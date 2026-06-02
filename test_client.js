const axios = require('axios');

// paste your live ngrok url from colab here
const COLA_API_URL = 'https://jame-unpneumatic-refugia.ngrok-free.dev/api/v1/uwa/score';

// high-risk patient payload (Adaeze Okonkwo clinical proxy)
const fhirBundlePayload = {
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
        "code": { "coding": [{ "system": "http://loinc.org", "code": "55284-4", "display": "Blood pressure" }] },
        "valueQuantity": [
          { "value": 148, "component": "systolic" },
          { "value": 95, "component": "diastolic" }
        ]
      }
    },
    {
      "resource": {
        "resourceType": "Observation",
        "code": { "coding": [{ "system": "http://loinc.org", "code": "2339-0", "display": "Blood Glucose" }] },
        "valueQuantity": { "value": 6.8 }
      }
    }
  ]
};

async function testUwaEngine() {
  console.log("📤 Transmitting FHIR R4 Bundle to Colab engine...");
  try {
    const response = await axios.post(COLA_API_URL, fhirBundlePayload, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = response.data;
    console.log("\n📥 --- LIVE INFERENCE RESPONSE RECEIVED ---");
    console.log(`Composite Risk Score : ${data.uwa_composite_score}/100`);
    console.log(`Priority Tier        : ${data.uwa_priority_colour}`);
    console.log(`Clinical Directive   : ${data.note[0].text}`);
    console.log("\nCondition Breakdowns & SHAP Explanations:");
    
    data.prediction.forEach(pred => {
      console.log(`\n- ${pred.outcome.text}:`);
      console.log(`  Risk Status: ${pred.qualitativeRisk.coding[0].code}`);
      console.log(`  Probability: ${(pred.probabilityDecimal * 100).toFixed(1)}%`);
      console.log(`  SHAP Drivers: ${pred.rationale}`);
    });
    
  } catch (error) {
    console.error("❌ Pipeline connection error:", error.response?.data || error.message);
  }
}

testUwaEngine();
