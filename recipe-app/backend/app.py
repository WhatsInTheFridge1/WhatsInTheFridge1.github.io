from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
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


# Search for recipe videos on YouTube
@app.route("/search", methods=["GET"])
def search_recipes():
    query = request.args.get("q", "")
    url = f"https://www.googleapis.com/youtube/v3/search"
    params = {
        "part": "snippet",
        "q": f"{query} recipe",
        "type": "video",
        "maxResults": 12,
        "key": YOUTUBE_API_KEY
    }
    response = requests.get(url, params=params)
    data = response.json()

   
    videos = []
    for item in data.get("items", []):
        videos.append({
            "id": item["id"]["videoId"],
            "title": item["snippet"]["title"],
            "thumbnail": item["snippet"]["thumbnails"]["high"]["url"],
            "channel": item["snippet"]["channelTitle"],
            "description": item["snippet"]["description"]
        })
    
    return jsonify(videos)
    for item in data.get("items", []):
        videos.append({
            "id": item["id"]["videoId"],
            "title": item["snippet"]["title"],
            "thumbnail": item["snippet"]["thumbnails"]["high"]["url"],
            "channel": item["snippet"]["channelTitle"],
            "description": item["snippet"]["description"]
        })
    
    return jsonify(videos)


@app.route("/ingredients", methods=["GET"])
def get_ingredients():
    video_id = request.args.get("id", "")
    transcribe_audio = request.args.get("transcribe_audio", "false").lower() in {"1", "true", "yes"}

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

    prompt = f"""
    Look at this YouTube video description and extract any ingredients listed.
    If you find ingredients, return them as a clean numbered list with the full amount/quantity.
    Format: "1. 2 cups flour", "2. 1/2 teaspoon salt", etc.
    Include units (cups, tablespoons, grams, etc.) and amounts for each ingredient.
    If there are no ingredients in the description, just say "NO_INGREDIENTS_FOUND".
    Do NOT include recipe names, categories, or section titles unless they are actual ingredients.

    Description:
    {description}
    """

    ai_response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}]
    )

    result = sanitize_ingredients(ai_response.choices[0].message.content)

    if "No ingredients could be confidently extracted" in result and transcribe_audio:
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

            prompt2 = f"""
            This is a transcript from a cooking video. Extract all ingredients mentioned with their amounts.
            Return as a clean numbered list in the format: "1. 2 cups flour", "2. 1/2 teaspoon salt", etc.
            Include quantities and units (cups, tablespoons, grams, pinch, etc.) for each ingredient.
            Be as specific as possible with measurements even if approximate.
            Do NOT include recipe names, section titles, or non-ingredient items.

            Transcript:
            {transcript.text[:4000]}
            """

            ai_response2 = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt2}]
            )
            result = sanitize_ingredients(ai_response2.choices[0].message.content)

            if os.path.exists("audio.mp3"):
                os.remove("audio.mp3")

        except Exception:
            result = "No ingredients could be confidently extracted from this video."

    RESULT_CACHE[video_id] = result
    return jsonify({"ingredients": result})


if __name__ == "__main__":
    app.run(debug=True, port=5000)