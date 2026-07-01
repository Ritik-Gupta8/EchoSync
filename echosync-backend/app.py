from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
from google.genai import types
import os
import json
import base64
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure Gemini Client
api_key = os.getenv("GEMINI_API_KEY")
try:
    client = genai.Client(api_key=api_key) if api_key else None
except Exception as e:
    client = None
    print(f"Failed to initialize Gemini client: {e}")

@app.route('/analyze-crisis', methods=['POST'])
def analyze_crisis():
    data = request.json
    message = data.get('message', '')
    image_data = data.get('image_data', None) # Base64 string

    if not message and not image_data:
        return jsonify({"error": "No message or image provided"}), 400

    if not api_key or not client:
        # Fallback/Mock response
        return jsonify({
            "priority": "High",
            "action": "Investigate immediately (Mock Data)",
            "english_translation": message or "Image attached without text.",
            "language_code": "en"
        })

    prompt = f"""
    You are an advanced emergency response AI for a hospitality crisis management system.
    Analyze the following message (and attached image if provided) from a guest and determine:
    1. The Priority Level (Strictly choose one: 'Critical', 'High', 'Medium', or 'Low').
    2. A brief, actionable Recommended Action for the staff or responders (maximum 10 words).
    3. Detect the language of the guest's message and return the 2-letter ISO code.
    4. Provide a clear English translation of the guest's message. If it is already in English, return the original message.

    Guest Message: "{message}"

    Respond ONLY in valid JSON format with the keys: "priority", "action", "english_translation", and "language_code".
    Example: {{"priority": "Critical", "action": "Deploy Fire Extinguisher Team", "english_translation": "There is a massive fire in the lobby!", "language_code": "es"}}
    """

    contents = [prompt]
    
    if image_data:
        try:
            # Strip data URI scheme if present
            if "base64," in image_data:
                image_data = image_data.split("base64,")[1]
            
            image_bytes = base64.b64decode(image_data)
            image_part = types.Part.from_bytes(
                data=image_bytes,
                mime_type='image/jpeg' # Assuming jpeg for simplicity, works generally
            )
            contents.append(image_part)
        except Exception as e:
            print(f"Failed to process image: {e}")

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=contents
        )
        
        # Parse JSON from response
        response_text = response.text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:-3].strip()
        elif response_text.startswith("```"):
            response_text = response_text[3:-3].strip()
            
        result = json.loads(response_text)
        return jsonify(result)

    except Exception as e:
        print(f"Error during AI analysis: {e}")
        return jsonify({
            "priority": "High",
            "action": "Needs immediate review",
            "english_translation": "Translation failed. Please review original message.",
            "language_code": "unknown"
        })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
