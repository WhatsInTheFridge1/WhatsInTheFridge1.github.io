from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor
import os
import re
import requests
import yt_dlp
from openai import OpenAI

load_dotenv()

app = Flask(__name__)
CORS(app)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
RESULT_CACHE = {}

MEASUREMENT_WORDS = (
    "cup", "cups", "tablespoon", "tablespoons", "tbsp", "teaspoon", "teaspoons",
    "tsp", "gram", "grams", "g", "oz", "ounce", "ounces", "lb", "lbs", "pound",
    "pounds", "pinch", "clove", "cloves", "slice", "slices", "piece", "pieces",
    "can", "cans", "bottle", "bottles", "packet", "packets", "sprig", "sprigs",
    "dash", "dashes", "ml", "l", "milliliter", "milliliters", "liter", "liters"
)

# Word-boundary-safe subset for scanning raw prose (video descriptions).
# Excludes single-letter abbreviations like "g"/"l" which would otherwise
# match inside ordinary words (e.g. "g" inside "garlic").
_DESCRIPTION_MEASUREMENT_PATTERN = re.compile(
    r'\b(' + '|'.join([
        "cup", "cups", "tablespoon", "tablespoons", "tbsp", "teaspoon", "teaspoons",
        "tsp", "gram", "grams", "oz", "ounce", "ounces", "lb", "lbs", "pound",
        "pounds", "pinch", "clove", "cloves", "ml", "milliliter", "milliliters",
        "liter", "liters", "kg", "kilogram", "kilograms",
    ]) + r')\b',
    re.IGNORECASE
)

INGREDIENT_HINTS = (
    "salt", "pepper", "flour", "sugar", "oil", "butter", "milk", "egg", "eggs",
    "garlic", "onion", "tomato", "tomatoes", "chicken", "beef", "pasta", "rice",
    "beans", "cheese", "broccoli", "spinach", "mushroom", "mushrooms", "lemon",
    "avocado", "tofu", "shrimp", "salmon", "turkey", "pepperoni", "cumin", "paprika",
    "parsley", "basil", "cilantro", "oregano", "thyme", "yogurt", "cream", "bread",
    "tortilla", "tortillas", "curry", "coconut", "potato", "potatoes"
)


def sanitize_ingredients(raw_text):
    if not raw_text:
        return "No ingredients could be confidently extracted from this video."

    cleaned = raw_text.strip()
    if cleaned.upper().startswith("NO_INGREDIENTS_FOUND"):
        return "No ingredients could be confidently extracted from this video."

    lines = []
    for raw_line in cleaned.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        line = re.sub(r'^[\-\*\d\.\)\(\s]+', '', line)
        line = re.sub(r'\s+', ' ', line).strip()
        if not line:
            continue
        if line.lower().startswith("no_ingredients_found"):
            continue

        lower = line.lower()
        has_measurement = any(word in lower for word in MEASUREMENT_WORDS)
        has_digit = any(ch.isdigit() for ch in line)
        has_ingredient_hint = any(word in lower for word in INGREDIENT_HINTS)

        if not (has_measurement or has_digit or has_ingredient_hint):
            # Likely a recipe title or non-ingredient section, reject it.
            continue

        lines.append(line)

    if not lines:
        return "No ingredients could be confidently extracted from this video."

    return "\n".join(lines)


_QUERY_STOPWORDS = {
    "recipe", "using", "only", "and", "no", "other", "ingredients", "with",
    "the", "a", "an", "of", "for"
}

_GENERIC_SPICE_TERMS = {"spice", "spices", "seasoning", "seasonings", "herb", "herbs"}

_SPICE_KEYWORDS = (
    "salt", "pepper", "cumin", "paprika", "turmeric", "cinnamon", "nutmeg",
    "clove", "allspice", "cardamom", "coriander", "chili powder", "chilli powder",
    "cayenne", "garlic powder", "onion powder", "basil", "oregano", "thyme",
    "rosemary", "parsley", "cilantro", "dill", "bay leaf", "sage", "curry",
    "ginger", "vanilla", "seasoning", "garam masala", "saffron", "mustard seed",
)


def _query_terms(query):
    return [w for w in re.findall(r"[a-zA-Z]+", (query or "").lower()) if w not in _QUERY_STOPWORDS]


def _term_present(term, lower_text, despaced_text):
    """Checks a query term against text, tolerating the common real-world
    mismatches plain substring matching misses: singular/plural ("egg" vs
    "eggs"), compound-word spacing ("bread crumbs" vs "breadcrumbs"), and
    generic spice/herb terms standing in for specific ones ("spices"
    matching a description that lists "paprika" and "black pepper").
    """
    if term in _GENERIC_SPICE_TERMS:
        return any(keyword in lower_text for keyword in _SPICE_KEYWORDS)
    if term in lower_text:
        return True
    if term.endswith('s') and term[:-1] in lower_text:
        return True
    if not term.endswith('s') and (term + 's') in lower_text:
        return True
    return term.replace(' ', '') in despaced_text


def has_ingredient_coverage(text, query, strict=False):
    """Deterministic coverage check: how many of the query's ingredient
    terms literally appear in `text` (a video description or a real
    extracted ingredient list)? LLMs are unreliable at precise counting
    (verified empirically - gpt-3.5-turbo inconsistently applied this same
    rule when asked to judge it directly), so this is done in code instead.
    `strict` requires all-but-at-most-one term present; loose requires a
    majority.
    """
    terms = _query_terms(query)
    if not terms:
        return True
    lower = text.lower()
    despaced = re.sub(r'\s+', '', lower)
    missing = sum(1 for term in terms if not _term_present(term, lower, despaced))
    if strict:
        return missing <= 1
    return missing <= len(terms) // 2


def description_has_ingredient_list(description):
    """LLM judgment call: does this description contain an actual, specific
    ingredient list, as opposed to a vague mention of "ingredients" with
    nothing named? This is the part that genuinely needs semantic judgment
    (unlike coverage counting, which is handled deterministically instead).
    """
    prompt = f"""
    Does this YouTube video description contain an actual, specific list of
    cooking ingredients (individual items and/or quantities) - not just a
    passing mention in a title, blurb, links, hashtags, or sponsor/subscribe
    messages?
    Example of what does NOT count (answer NO): "This dish only requires 4
    ingredients for the sauce, full recipe on my site" - that talks ABOUT
    ingredients without listing any of them.
    Example of what DOES count (answer YES): "Ingredients: - 2 red onions,
    sliced - 5 cloves garlic - 1kg chicken thighs" - actual items are named.
    Answer with exactly one word: YES or NO.

    Description:
    {description[:2000]}
    """
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=3,
            temperature=0
        )
        return response.choices[0].message.content.strip().upper().startswith("YES")
    except Exception:
        # Don't let a transient API error hide a video from search.
        return True


def description_matches_query(description, query, strict=False):
    """Cheap, description-only check used to filter search results.
    Does not touch audio/Whisper, so a video can still pass full
    extraction later even if this says no (it just won't show up in search).
    When a query is given, checks whether the description actually backs up
    those specific ingredients rather than just containing *some* ingredient
    list (so results aren't just whatever YouTube's title search returned).
    `strict` raises the required ingredient coverage from "most" to
    "all, or all but one" - used for the fridge panel's Strict Mode toggle.
    """
    if not description or not description.strip():
        return False

    # Deterministic backstop: real ingredient lists almost always include
    # quantities. A description with none is almost certainly a vague blurb
    # ("only requires 4 ingredients!") rather than an actual list, so reject
    # it outright instead of relying on the LLM to catch every such case.
    has_digit = any(ch.isdigit() for ch in description)
    has_measurement_word = bool(_DESCRIPTION_MEASUREMENT_PATTERN.search(description))
    if not (has_digit or has_measurement_word):
        return False

    query = (query or "").strip()

    if not description_has_ingredient_list(description):
        return False

    if not query:
        return True

    return has_ingredient_coverage(description, query, strict)


# Search for recipe videos on YouTube
@app.route("/search", methods=["GET"])
def search_recipes():
    query = request.args.get("q", "")
    strict = request.args.get("strict", "false").lower() in {"1", "true", "yes"}
    url = f"https://www.googleapis.com/youtube/v3/search"
    params = {
        "part": "snippet",
        "q": f"{query} recipe",
        "type": "video",
        "maxResults": 50,
        "key": YOUTUBE_API_KEY
    }
    response = requests.get(url, params=params)
    data = response.json()

    items = data.get("items", [])
    video_ids = [item["id"]["videoId"] for item in items]

    # search.list only returns a short, truncated description snippet
    # (~150 chars) - nowhere near enough to judge ingredient coverage from.
    # Fetch the real, full descriptions in one batched call instead.
    full_descriptions = {}
    if video_ids:
        videos_response = requests.get(
            "https://www.googleapis.com/youtube/v3/videos",
            params={"part": "snippet", "id": ",".join(video_ids), "key": YOUTUBE_API_KEY}
        )
        for video_item in videos_response.json().get("items", []):
            full_descriptions[video_item["id"]] = video_item["snippet"]["description"]

    candidates = []
    for item in items:
        video_id = item["id"]["videoId"]
        candidates.append({
            "id": video_id,
            "title": item["snippet"]["title"],
            "thumbnail": item["snippet"]["thumbnails"]["high"]["url"],
            "channel": item["snippet"]["channelTitle"],
            "description": full_descriptions.get(video_id, item["snippet"]["description"])
        })

    def keep(video):
        cached = RESULT_CACHE.get(video["id"])
        if cached is not None:
            if "No ingredients could be confidently extracted" in cached:
                return False
            return has_ingredient_coverage(cached, query, strict)
        return description_matches_query(video["description"], query, strict)

    with ThreadPoolExecutor(max_workers=32) as executor:
        keep_flags = list(executor.map(keep, candidates))

    videos = [video for video, keep_it in zip(candidates, keep_flags) if keep_it]

    return jsonify(videos)


@app.route("/ingredients", methods=["GET"])
def get_ingredients():
    video_id = request.args.get("id", "")

    if not video_id:
        return jsonify({"ingredients": "No video was provided."})

    if video_id in RESULT_CACHE:
        return jsonify({"ingredients": RESULT_CACHE[video_id]})

    url = "https://www.googleapis.com/youtube/v3/videos"
    params = {
        "part": "snippet",
        "id": video_id,
        "key": YOUTUBE_API_KEY
    }
    response = requests.get(url, params=params)
    data = response.json()

    if not data.get("items"):
        return jsonify({"ingredients": "No ingredients could be confidently extracted from this video."})

    description = data["items"][0]["snippet"]["description"]

    transcript_text = ""
    try:
        ydl_opts = {
            "format": "bestaudio/best",
            "outtmpl": "audio.%(ext)s",
            "postprocessors": [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
            }],
            "quiet": True
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([f"https://youtube.com/watch?v={video_id}"])

        with open("audio.mp3", "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file
            )
        transcript_text = transcript.text[:12000]

    except Exception:
        transcript_text = ""
    finally:
        if os.path.exists("audio.mp3"):
            os.remove("audio.mp3")

    prompt = f"""
    You are extracting the full ingredient list for a cooking video from two sources:
    the video's YouTube description, and a transcript of the video's audio. Either
    source may be incomplete, mention ingredients the other doesn't, or contain
    unrelated text (links, sponsor messages, hashtags, etc).

    Combine both sources into ONE clean, deduplicated numbered list of every distinct
    ingredient mentioned, with the full amount/quantity when it's known.
    Format: "1. 2 cups flour", "2. 1/2 teaspoon salt", etc.
    Include units (cups, tablespoons, grams, etc.) and amounts for each ingredient.
    If the same ingredient appears in both sources, list it once using the most
    specific quantity available.
    Do NOT include recipe names, categories, section titles, or non-ingredient items
    (links, sponsors, hashtags, calls to subscribe, etc).
    If neither source mentions any ingredients, just say "NO_INGREDIENTS_FOUND".

    Video description:
    {description}

    Audio transcript:
    {transcript_text if transcript_text else "(not available)"}
    """

    ai_response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}]
    )

    result = sanitize_ingredients(ai_response.choices[0].message.content)

    RESULT_CACHE[video_id] = result
    return jsonify({"ingredients": result})


if __name__ == "__main__":
    app.run(debug=True, port=5000)