import requests
import json

# paste your live ngrok url from colab here
COLAB_API_URL = 'https://jame-unpneumatic-refugia.ngrok-free.dev/api/v1/uwa/score'

fhir_bundle_payload = {
    "resourceType": "Bundle",
    "type": "transaction",
    "entry": [
        {
            "resource": {
                "resourceType": "Patient",
                "id": "UWA-LAG-4012",
                "birthDate": "1997-03-15",
                "extension": [
                    { "url": "https://uwa.health/fhir/sickle-cell-genotype", "valueCode": "AS" },
                    { "url": "https://uwa.health/fhir/anc-booking-week", "valueInteger": 20 }
                ]
            }
        },
        {
            "resource": {
                "resourceType": "Observation",
                "code": { "coding": [{ "system": "http://loinc.org", "code": "55284-4" }] },
                "valueQuantity": [
                    { "value": 148, "component": "systolic" },
                    { "value": 95, "component": "diastolic" }
                ]
            }
        },
        {
            "resource": {
                "resourceType": "Observation",
                "code": { "coding": [{ "system": "http://loinc.org", "code": "2339-0" }] },
                "valueQuantity": { "value": 6.8 }
            }
        }
    ]
}

def fire_test_request():
    print("📤 Transmitting FHIR R4 Bundle to Colab engine...")
    try:
        response = requests.post(
            COLAB_API_URL, 
            json=fhir_bundle_payload, 
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print("\n📥 --- LIVE INFERENCE RESPONSE RECEIVED ---")
            print(f"Composite Risk Score : {data['uwa_composite_score']}/100")
            print(f"Priority Tier        : {data['uwa_priority_colour']}")
            print(f"Clinical Directive   : {data['note'][0]['text']}")
            print("\nCondition Breakdowns & SHAP Explanations:")
            
            for pred in data['prediction']:
                print(f"\n- {pred['outcome']['text']}:")
                print(f"  Risk Status: {pred['qualitativeRisk']['coding'][0]['code']}")
                print(f"  Probability: {pred['probabilityDecimal'] * 100:.1f}%")
                print(f"  SHAP Drivers: {pred['rationale']}")
        else:
            print(f"❌ Server Error {response.status_code}: {response.text}")
            
    except Exception as e:
        print(f"❌ Connection failed: {str(e)}")

if __name__ == '__main__':
    fire_test_request()