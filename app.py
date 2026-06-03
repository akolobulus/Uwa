import os
import glob
import json
import datetime
import warnings
import numpy as np
import pandas as pd
import xgboost as xgb
import shap
from flask import Flask, request, jsonify
from sklearn.model_selection import train_test_split
from imblearn.combine import SMOTETomek
import kagglehub
from ucimlrepo import fetch_ucirepo

warnings.filterwarnings('ignore')

app = Flask(__name__)

FEATURES = [
    'Age', 'Systolic_BP', 'Diastolic_BP', 'Blood_Sugar', 'Body_Temperature', 'HeartRate',
    'Malaria_Episodes', 'SCD_Risk_Score', 'Late_ANC_Booking', 'ANC_Booking_Week',
    'HIV_Risk_Score', 'IPTp_Doses', 'Prior_Facility_Delivery',
    'Prior_Hypertension_History', 'Multiple_Gestation', 'Gravidity', 'Grand_Multiparity'
]
TARGET_CHANNELS = {'PPH': 'Target_PPH', 'Preeclamp': 'Target_Preeclamp', 'Preterm': 'Target_Preterm'}
LIVE_ENGINES = {}
OPERATING_THRESHOLDS = {'PPH': 0.22, 'Preeclamp': 0.25, 'Preterm': 0.24}

def initialize_and_train_model():
    """Ingests medical data repositories and runs cost-sensitive ensemble boosting."""
    global LIVE_ENGINES
    print("📥 Ingesting clinical data tables from open data networks...")
    
    # 1. Fetch Kaggle Source Vectors
    kaggle_dir = kagglehub.dataset_download("abuchionwuegbusi/maternal-health-risk")
    target_csvs = glob.glob(os.path.join(kaggle_dir, "*.csv"))
    if not target_csvs:
        raise FileNotFoundError("Downstream ingestion failed. Kaggle CSV vector missing.")
    df_kaggle = pd.read_csv(target_csvs[0])

    # 2. Ingest UCI Datasets
    u_repo = fetch_ucirepo(id=863)
    df_master_raw = u_repo.data.original

    # 3. Structural Normalization Map
    feature_rename_map = {
        'SystolicBP': 'Systolic_BP',
        'DiastolicBP': 'Diastolic_BP',
        'BodyTemp': 'Body_Temperature',
        'BS': 'Blood_Sugar'
    }
    df_kaggle = df_kaggle.rename(columns=feature_rename_map)
    df_master_raw = df_master_raw.rename(columns=feature_rename_map)

    df_master = pd.concat([df_kaggle, df_master_raw], axis=0, ignore_index=True).drop_duplicates().reset_index(drop=True)
    df_master['RiskLevel_Num'] = df_master['RiskLevel'].str.lower().map({'low risk': 0, 'mid risk': 1, 'high risk': 2}).fillna(0)

    # 4. Epidemiological Injection Controls
    np.random.seed(42)
    total_records = len(df_master)

    malaria_prob_vector = np.clip(np.where(df_master['Blood_Sugar'] < 7.5, 0.35, 0.12) + (df_master['RiskLevel_Num'] * 0.05), 0, 0.9)
    df_master['Malaria_Episodes'] = np.random.binomial(3, malaria_prob_vector).clip(0, 2)
    df_master['Sickle_Cell_Genotype'] = np.random.choice(['AA','AS','SS','SC'], size=total_records, p=[0.68, 0.24, 0.025, 0.055])
    df_master['SCD_Risk_Score'] = df_master['Sickle_Cell_Genotype'].map({'AA': 0, 'AS': 1, 'SC': 2, 'SS': 3})
    
    late_anc_prob = np.clip(0.38 + (df_master['Systolic_BP'] > 130).astype(float) * 0.15, 0, 0.85)
    is_late_booking = np.random.binomial(1, late_anc_prob)
    df_master['ANC_Booking_Week'] = np.where(is_late_booking, np.random.randint(20, 36, total_records), np.random.randint(6, 19, total_records))
    df_master['Late_ANC_Booking'] = (df_master['ANC_Booking_Week'] >= 20).astype(int)

    df_master['HIV_Status'] = np.random.choice(['Negative', 'Positive_ART', 'Positive_No_ART', 'Unknown'], size=total_records, p=[0.935, 0.035, 0.015, 0.015])
    df_master['HIV_Risk_Score'] = df_master['HIV_Status'].map({'Negative': 0, 'Unknown': 0.2, 'Positive_ART': 0.5, 'Positive_No_ART': 1.0})
    df_master['IPTp_Doses'] = np.random.choice([0,1,2,3], size=total_records, p=[0.28, 0.35, 0.22, 0.15])
    df_master['Prior_Facility_Delivery'] = np.random.choice([1,0], size=total_records, p=[0.43, 0.57])

    high_bp_mask = df_master['Systolic_BP'] > 140
    mid_bp_mask = (df_master['Systolic_BP'] > 120) & (df_master['Systolic_BP'] <= 140)
    low_bp_mask = df_master['Systolic_BP'] <= 120
    ht_history = np.zeros(total_records, dtype=int)
    ht_history[high_bp_mask] = np.random.choice([1,0], size=high_bp_mask.sum(), p=[0.70, 0.30])
    ht_history[mid_bp_mask] = np.random.choice([1,0], size=mid_bp_mask.sum(), p=[0.25, 0.75])
    ht_history[low_bp_mask] = np.random.choice([1,0], size=low_bp_mask.sum(), p=[0.08, 0.92])
    df_master['Prior_Hypertension_History'] = ht_history

    df_master['Multiple_Gestation'] = np.random.choice([1,0], size=total_records, p=[0.04, 0.96])
    df_master['Gravidity'] = np.random.choice([1,2,3,4,5,6], size=total_records, p=[0.20,0.22,0.20,0.16,0.12,0.10])
    df_master['Grand_Multiparity'] = (df_master['Gravidity'] >= 5).astype(int)

    # 5. Label Engineering Matrix
    df_master['Target_PPH'] = (((df_master['RiskLevel_Num']/2.0)*0.35 + (df_master['SCD_Risk_Score']/3.0)*0.20 + (df_master['Blood_Sugar']<7.0).astype(float)*0.15 + (df_master['Malaria_Episodes']/2.0)*0.15 + df_master['Grand_Multiparity'].astype(float)*0.10 + df_master['Multiple_Gestation'].astype(float)*0.05) >= 0.35).astype(int)
    df_master['Target_Preeclamp'] = (((df_master['Systolic_BP']>=140).astype(float)*0.35 + (df_master['Diastolic_BP']>=90).astype(float)*0.25 + df_master['Prior_Hypertension_History'].astype(float)*0.20 + df_master['Late_ANC_Booking'].astype(float)*0.10 + df_master['Multiple_Gestation'].astype(float)*0.05 + ((df_master['Age']<18)|(df_master['Age']>35)).astype(float)*0.05) >= 0.35).astype(int)
    df_master['Target_Preterm'] = (((df_master['RiskLevel_Num']/2.0)*0.30 + (df_master['Malaria_Episodes']/2.0)*0.25 + df_master['HIV_Risk_Score']*0.20 + (df_master['SCD_Risk_Score']/3.0)*0.15 + df_master['Late_ANC_Booking'].astype(float)*0.10) >= 0.28).astype(int)

    # 6. Ensemble Training Pass
    X_matrix = df_master[FEATURES].fillna(df_master[FEATURES].median())
    for channel, col_name in TARGET_CHANNELS.items():
        y_vector = df_master[col_name]
        X_train, _, y_train, _ = train_test_split(X_matrix, y_vector, test_size=0.2, random_state=42, stratify=y_vector)
        X_resampled, y_resampled = SMOTETomek(random_state=42).fit_resample(X_train, y_train)
        
        penalization_coefficient = ((y_train == 0).sum() / (y_train == 1).sum()) * 1.5
        booster = xgb.XGBClassifier(
            objective='binary:logistic', scale_pos_weight=penalization_coefficient,
            learning_rate=0.05, max_depth=5, n_estimators=250, eval_metric='logloss', random_state=42
        )
        booster.fit(X_resampled, y_resampled)
        LIVE_ENGINES[channel] = booster
    print("⚡ Core multi-label predictive analytics structures successfully deployed to Render instances.")

# Lazy initialize model weights on first boot sequence
initialize_and_train_model()

def run_vector_inference(raw_metrics):
    evaluation_dataframe = pd.DataFrame([raw_metrics])[FEATURES].fillna(0)
    conditions_response = {}
    aggregated_scores = []
    activation_flags = []

    for channel, engine in LIVE_ENGINES.items():
        predicted_probability = float(engine.predict_proba(evaluation_dataframe)[0][1])
        configured_threshold = OPERATING_THRESHOLDS[channel]
        is_active = predicted_probability >= configured_threshold
        integer_score = int(predicted_probability * 100)

        aggregated_scores.append(integer_score)
        activation_flags.append(int(is_active))

        tree_explainer = shap.TreeExplainer(engine)
        local_shap_array = tree_explainer(evaluation_dataframe).values[0]
        dominant_indices = np.argsort(np.abs(local_shap_array))[::-1][:3]

        influence_strings = []
        for index in dominant_indices:
            name = FEATURES[index]
            weight = float(local_shap_array[index])
            vector_direction = "↑" if weight > 0 else "↓"
            influence_strings.append(f"{name} {vector_direction} ({'+' if weight > 0 else ''}{weight:.2f})")

        conditions_response[channel] = {
            'condition': 'Postpartum Haemorrhage' if channel=='PPH' else 'Preeclampsia/Eclampsia' if channel=='Preeclamp' else 'Preterm Labour',
            'probability': round(predicted_probability, 4),
            'score_0_to_100': integer_score,
            'flagged': bool(is_active),
            'top_drivers': "; ".join(influence_strings)
        }

    maximum_score = max(aggregated_scores)
    any_channel_tripped = any(activation_flags)

    if maximum_score >= 70:
        priority_label, color_hex = "🚨 CRITICAL — Immediate specialist review required", "RED"
    elif maximum_score >= 50 or any_channel_tripped:
        priority_label, color_hex = "⚠️ HIGH — Prioritize immediate clinical assessment", "AMBER"
    elif maximum_score >= 30:
        priority_label, color_hex = "🟡 MODERATE — Monitor tracking closely, reassess inside 7 days", "YELLOW"
    else:
        priority_label, color_hex = "✅ LOW — Standard preventative antenatal routine checks", "GREEN"

    return {
        'composite_score': maximum_score,
        'any_flagged': any_channel_tripped,
        'priority': priority_label,
        'priority_colour': color_hex,
        'conditions': conditions_response,
        'timestamp': datetime.datetime.utcnow().isoformat() + 'Z',
        'model_version': 'uwa-v2.0'
    }

@app.route('/healthz', methods=['GET'])
def server_health_check():
    return jsonify({"status": "healthy", "engines_loaded": len(LIVE_ENGINES) == 3}), 200

@app.route('/api/v1/uwa/score', methods=['POST'])
def receive_fhir_transaction():
    try:
        inbound_bundle = request.get_json()
        if not inbound_bundle or inbound_bundle.get("resourceType") != "Bundle":
            return jsonify({"error": "Malformed structural contract. FHIR R4 Bundle required."}), 400

        runtime_features = {feat: 0.0 for feat in FEATURES}
        runtime_features['Age'] = 26.0
        clinical_subject_id = "Unknown"

        for component in inbound_bundle.get("entry", []):
            resource_entity = component.get("resource", {})
            resource_type = resource_entity.get("resourceType")

            if resource_type == "Patient":
                clinical_subject_id = resource_entity.get("id", "Unknown")
                if "birthDate" in resource_entity:
                    birth_year = int(resource_entity["birthDate"].split("-")[0])
                    runtime_features['Age'] = datetime.datetime.now().year - birth_year

                for extension in resource_entity.get("extension", []):
                    target_url = extension.get("url", "")
                    if "sickle-cell-genotype" in target_url:
                        genotype_mapping = {'AA': 0, 'AS': 1, 'SC': 2, 'SS': 3}
                        runtime_features['SCD_Risk_Score'] = genotype_mapping.get(extension.get("valueCode"), 0)
                    elif "anc-booking-week" in target_url:
                        booking_week = int(extension.get("valueInteger", 12))
                        runtime_features['ANC_Booking_Week'] = booking_week
                        runtime_features['Late_ANC_Booking'] = 1 if booking_week >= 20 else 0

            elif resource_type == "Observation":
                coding_dictionary = resource_entity.get("code", {}).get("coding", [])

                if any(node.get("code") == "55284-4" for node in coding_dictionary):
                    for part in resource_entity.get("valueQuantity", []):
                        if part.get("component") == "systolic":
                            runtime_features['Systolic_BP'] = float(part.get("value"))
                        elif part.get("component") == "diastolic":
                            runtime_features['Diastolic_BP'] = float(part.get("value"))

                elif any(node.get("code") == "2339-0" for node in coding_dictionary):
                    runtime_features['Blood_Sugar'] = float(resource_entity.get("valueQuantity", {}).get("value", 5.2))

        inference_output = run_vector_inference(runtime_features)

        fhir_compliant_assessment = {
            "resourceType": "RiskAssessment",
            "id": f"uwa-risk-assessment-{int(datetime.datetime.utcnow().timestamp())}",
            "status": "final",
            "subject": {"reference": f"Patient/{clinical_subject_id}"},
            "occurrenceDateTime": inference_output['timestamp'],
            "method": {
                "coding": [{"system": "https://uwa.health/methods", "code": "xgboost-nigerian-v2", "display": "Uwa Ensemble Core Engine"}]
            },
            "prediction": [
                {
                    "outcome": {"text": data['condition']},
                    "probabilityDecimal": data['probability'],
                    "qualitativeRisk": {"coding": [{"code": "HIGH" if data['flagged'] else "LOW"}]},
                    "rationale": data['top_drivers']
                } for channel_id, data in inference_output['conditions'].items()
            ],
            "note": [{"text": inference_output['priority']}],
            "uwa_composite_score": inference_output['composite_score'],
            "uwa_priority_colour": inference_output['priority_colour'],
            "uwa_model_version": inference_output['model_version'],
            "uwa_ensemble_any_flag": inference_output['any_flagged']
        }
        return jsonify(fhir_compliant_assessment), 200

    except Exception as server_error:
        return jsonify({"error": "Pipeline execution failure", "internal_details": str(server_error)}), 500

if __name__ == '__main__':
    # Fallback runner for local execution testing profiles
    app.run(host='0.0.0.0', port=int(os.environ.get("PORT", 5000)))