import os
import requests

API_KEY = os.environ.get("AETHEX_API_KEY", "ae_live_YOUR_KEY_HERE")
BASE_URL = "https://api.aethexai.com/api/v1"
headers = {"X-API-Key": API_KEY, "Content-Type": "application/json"}

# Grab an English vocal driver (targeting standard male catalog configurations if available)
voices_resp = requests.get(f"{BASE_URL}/voices?language=english", headers=headers)
voices_resp.raise_for_status()

# Look for a male voice fallback, otherwise use the first available option
voices = voices_resp.json()
male_voices = [v for v in voices if v.get("gender") == "male" and not v.get("is_cloned")]
voice_id = male_voices[0]["id"] if male_voices else voices[0]["id"]

SYSTEM_PROMPT = """You are Evans, an advanced hands-free clinical voice assistant for the Nurture Maternal Health platform. 
Your primary job is to assist busy clinicians by searching, adding, or deleting patient data entirely through vocal requests.

You have access to three custom data utilities:
1. `search_patient`: Trigger this immediately when the clinician asks about a patient's status, checkups, vitals, or checks if they are in the database.
2. `add_patient`: Trigger this when a clinician requests to register, save, or add a new patient. If they omit parameters like name, age, or current gestational week, prompt them for the missing details sequentially before executing the tool.
3. `remove_patient`: Trigger this when a clinician explicitly tells you to delete or drop a profile. Crucial step: ALWAYS explicitly state the patient's identity and ask for verbal confirmation (e.g., "Are you certain you want to permanently remove this record?") before firing the parameters down to the backend hook.

Vocal Guidelines:
- Keep your sentences concise, calm, professional, and directly informative. 
- Avoid chatty phrasing. Clinicians use you in fast-paced medical surroundings where clarity is everything.
"""

# Register the Agent along with its structured Tool schemas
agent_payload = {
    "name": "Evans - Nurture Voice Assistant",
    "system_prompt": SYSTEM_PROMPT,
    "first_message": "Hello, this is Evans. Nurture voice automation systems are live. How can I manage patient records for you today?",
    "voice_id": voice_id,
    "language": "english",
    "tools": [
        {
            "name": "search_patient",
            "description": "Searches the Supabase directory for an existing maternal patient profile by name parameters.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "The exact name or search substring of the patient."}
                },
                "required": ["query"]
            }
        },
        {
            "name": "add_patient",
            "description": "Registers a completely new maternal patient clinical profile into the database system storage layer.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {"type": "string", "description": "Full legal name of the patient"},
                    "age": {"type": "integer", "description": "Calculated current age in years"},
                    "week": {"type": "integer", "description": "Current gestational tracking week of pregnancy"},
                    "state": {"type": "string", "description": "Nigerian state of origin or resident location"}
                },
                "required": ["name", "age", "week"]
            }
        },
        {
            "name": "remove_patient",
            "description": "Deletes a patient permanent record context from the backend via their unique ID key.",
            "parameters": {
                "type": "object",
                "properties": {
                    "patient_id": {"type": "string", "description": "The target text-based identification ID string of the patient to drop"}
                },
                "required": ["patient_id"]
            }
        }
    ]
}

agent_resp = requests.post(f"{BASE_URL}/agents", headers=headers, json=agent_payload)
agent_resp.raise_for_status()
print(f"SUCCESS! Save this ID: {agent_resp.json()['id']}")