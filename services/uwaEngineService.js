const axios = require('axios');

/**
 * Production Client Service for Uwa Health v2.0 ML Gateway
 * Securely transforms standard EHR internal states into FHIR R4 Bundle schemas,
 * pushes vectors to the Colab engine, and normalizes the clinical return array.
 */
class UwaEngineService {
  constructor() {
    // Dynamic runtime route bridge pointing directly to your live Colab link
    this.gatewayUrl = 'https://jame-unpneumatic-refugia.ngrok-free.dev/api/v1/uwa/score';
    
    // Explicit HTTP boundary rules to prevent local process blockages
    this.client = axios.create({
      baseURL: this.gatewayUrl,
      timeout: 12000, 
      headers: { 'Content-Type': 'application/json' }
    });
  }

  /**
   * Evaluates local patient data records against the remote tree ensemble
   * @param {Object} patientRecord Raw local entity parameters
   * @returns {Promise<Object>} Formatted FHIR R4 RiskAssessment resource
   */
  async evaluateMaternalRisk(patientRecord) {
    try {
      // Structural Translation Layer: Maps local app memory keys cleanly to FHIR nodes
      const fhirBundlePayload = {
        "resourceType": "Bundle",
        "type": "transaction",
        "entry": [
          {
            "resource": {
              "resourceType": "Patient",
              "id": patientRecord.id || "UNKNOWN-PATIENT",
              "birthDate": patientRecord.birthDate, // Expected format: "YYYY-MM-DD"
              "extension": [
                { "url": "https://uwa.health/fhir/sickle-cell-genotype", "valueCode": patientRecord.sickleCellGenotype || "AA" },
                { "url": "https://uwa.health/fhir/anc-booking-week", "valueInteger": parseInt(patientRecord.ancBookingWeek || 12) }
              ]
            }
          },
          {
            "resource": {
              "resourceType": "Observation",
              "code": { "coding": [{ "system": "http://loinc.org", "code": "55284-4", "display": "Blood pressure" }] },
              "valueQuantity": [
                { "value": parseFloat(patientRecord.systolicBp), "component": "systolic" },
                { "value": parseFloat(patientRecord.diastolicBp), "component": "diastolic" }
              ]
            }
          },
          {
            "resource": {
              "resourceType": "Observation",
              "code": { "coding": [{ "system": "http://loinc.org", "code": "2339-0", "display": "Blood Glucose" }] },
              "valueQuantity": { "value": parseFloat(patientRecord.bloodSugar) }
            }
          }
        ]
      };

      // Execute network transaction across the ngrok tunnel boundary
      const response = await this.client.post('', fhirBundlePayload);
      return response.data;

    } catch (error) {
      this._handlePipelineErrors(error);
    }
  }

  /**
   * Internal Error Normalization Layer
   * @private
   */
  _handlePipelineErrors(error) {
    if (error.response) {
      // Colab engine caught the call but rejected structural properties (400 / 500)
      console.error(`❌ Uwa Engine Rejected Payload [Status ${error.response.status}]:`, error.response.data);
      throw new Error(`Engine Processing Error: ${error.response.data.error || 'Server processing failure'}`);
    } else if (error.request) {
      // Tunnel broken, Colab asleep, or ngrok connection timed out completely
      console.error("❌ Gateway Unreachable: No handshake acknowledgement received from Colab engine.");
      throw new Error("Maternal Risk Engine is offline. Verify Colab running status and link integrity.");
    } else {
      // Local setup calculation anomalies
      console.error("❌ Local Execution Fault:", error.message);
      throw error;
    }
  }
}

module.exports = new UwaEngineService();
