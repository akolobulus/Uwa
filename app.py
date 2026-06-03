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
from groq import Groq

warnings.filterwarnings('ignore')

app = Flask(__name__)

# Initialize Groq client securely using Render Environment Variables
groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

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
    """Ingests data packages to establish model baselines before incoming API requests go live."""
    global LIVE_ENGINES
    print("📥 Ingesting clinical training records...")
    try:
        kaggle_dir = kagglehub.dataset_download("abuchionwuegbusi/maternal-health-risk")
        target_csvs = glob.glob(os.path.join(kaggle_dir, "*.csv"))
        df_kaggle = pd.read_csv(target_csvs[0])

        u_repo = fetch_ucirepo(id=863)
        df_master_raw = u_repo.data.original

        feature_rename_map = {'SystolicBP': 'Systolic_BP', 'DiastolicBP': 'Diastolic_BP', 'BodyTemp': 'Body_Temperature', 'BS': 'Blood_Sugar'}
        df_kaggle = df_kaggle.rename(columns=feature_rename_map)
        df_master_raw = df_master_raw.rename(columns=feature_rename_map)

        df_master = pd.concat([df_kaggle, df_master_raw], axis=0, ignore_index=True).drop_duplicates().reset_index(drop=True)
        df_master['RiskLevel_Num'] = df_master['RiskLevel'].str.lower().map({'low risk': 0, 'mid risk': 1, 'high risk': 2}).fillna(0)

        # Baseline feature synthesis for training dataset structures
        np.random.seed(42)
        total_records = len(df_master)
        df_master['Malaria_Episodes'] = np.random.binomial(2, 0.15, total_records)
        df_master['SCD_Risk_Score'] = np.random.choice([0, 1, 2, 3], size=total_records, p=[0.70, 0.23, 0.05, 0.02])
        df_master['ANC_Booking_Week'] = np.random.randint(8, 32, total_records)
        df_master['Late_ANC_Booking'] = (df_master['ANC_Booking_Week'] >= 20).astype(int)
        df_master['HIV_Risk_Score'] = np.random.choice([0.0, 0.2, 0.5, 1.0], size=total_records, p=[0.95, 0.02, 0.02, 0.01])
        df_master['IPTp_Doses'] = np.random.choice([0, 1, 2, 3], size=total_records, p=[0.20, 0.30, 0.35, 0.15])
        df_master['Prior_Facility_Delivery'] = np.random.choice([0, 1], size=total_records, p=[0.40, 0.60])
        df_master['Prior_Hypertension_History'] = np.where(df_master['Systolic_BP'] > 135, 1, 0)
        df_master['Multiple_Gestation'] = np.random.choice([0, 1], size=total_records, p=[0.97, 0.03])
        df_master['Gravidity'] = np.random.randint(1, 6, total_records)
        df_master['Grand_Multiparity'] = (df_master['Gravidity'] >= 5).astype(int)
        df_master['HeartRate'] = df_master['HeartRate'].fillna(75.0)

        df_master['Target_PPH'] = (((df_master['RiskLevel_Num']/2.0)*0.35 + (df_master['SCD_Risk_Score']/3.0)*0.20 + (df_master['Blood_Sugar']<7.0).astype(float)*0.15) >= 0.35).astype(int)
        df_master['Target_Preeclamp'] = (((df_master['Systolic_BP']>=140).astype(float)*0.35 + df_master['Prior_Hypertension_History'].astype(float)*0.20) >= 0.35).astype(int)
        df_master['Target_Preterm'] = (((df_master['RiskLevel_Num']/2.0)*0.30 + (df_master['Malaria_Episodes']/2.0)*0.25) >= 0.28).astype(int)

        X_matrix = df_master[FEATURES].fillna(df_master[FEATURES].median())
        for channel, col_name in TARGET_CHANNELS.items():
            y_vector = df_master[col_name]
            X_train, _, y_train, _ = train_test_split(X_matrix, y_vector, test_size=0.2, random_state=42, stratify=y_vector)
            X_resampled, y_resampled = SMOTETomek(random_state=42).fit_resample(X_train, y_train)
            
            booster = xgb.XGBClassifier(objective='binary:logistic', learning_rate=0.05, max_depth=5, n_estimators=200, eval_metric='logloss', random_state=42)
            booster.fit(X_resampled, y_resampled)
            LIVE_ENGINES[channel] = booster
        print("⚡ Models fully trained.")
    except Exception as e:
        print(print(f"❌ Initialization aborted: {str(e)}"))

# Lazy initialize model weights on first boot sequence
initialize_and_train_model()

def generate_groq_clinical_rationale(condition_name, probability, top_drivers, patient_vitals):
    """Generates precise, real-time diagnostic rationales through Groq LLM pipelines."""
    if not os.environ.get("GROQ_API_KEY"):
        return f"Risk determined by top driving elements: {top_drivers}"

    try:
        system_prompt = (
            "You are an expert obstetric intelligence assistant evaluating maternal health risks in Nigeria. "
            "Provide a concise, 2-sentence clinical breakdown explaining why this patient is flagged for a given risk. "
            "Incorporate local contexts (e.g., impact of frequent malaria, ANC booking styles) where applicable. "
            "Do not include introductory words or meta-commentary. Speak directly to the clinician user."
        )
        
        user_prompt = (
            f"Condition Assessed: {condition_name}\n"
            f"Calculated Probability: {probability:.2%}\n"
            f"Key Mathematical Drivers (SHAP values): {top_drivers}\n"
            f"Patient Context Vector: {json.dumps(patient_vitals)}"
        )

        chat_completion = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            model="llama3-8b-8192",
            temperature=0.2,
            max_tokens=120
        )
        return chat_completion.choices[0].message.content.strip()
    except Exception as e:
        return f"Model evaluation linked to key parameters: {top_drivers}. (Reasoning fallbacks activated: {str(e)})"

def run_vector_inference(raw_metrics):
    evaluation_dataframe = pd.DataFrame([raw_metrics])[FEATURES]
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
            influence_strings.append(f"{FEATURES[index]} ({'+' if local_shap_array[index] > 0 else ''}{local_shap_array[index]:.2f})")
        
        drivers_summary = "; ".join(influence_strings)
        condition_title = 'Postpartum Haemorrhage' if channel=='PPH' else 'Preeclampsia/Eclampsia' if channel=='Preeclamp' else 'Preterm Labour'
        
        # Invoke Groq execution engine for narrative synthesis
        clinical_reasoning = generate_groq_clinical_rationale(condition_title, predicted_probability, drivers_summary, raw_metrics)

        conditions_response[channel] = {
            'condition': condition_title,
            'probability': round(predicted_probability, 4),
            'score_0_to_100': integer_score,
            'flagged': bool(is_active),
            'top_drivers': clinical_reasoning
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

        # Construct safe base dict matching FEATURE schema array exactly
        runtime_features = {feat: 0.0 for feat in FEATURES}
        
        # Extrapolate values out from individual resource payloads mapping back to real client inputs
        for component in inbound_bundle.get("entry", []):
            resource_entity = component.get("resource", {})
            res_type = resource_entity.get("resourceType")

            if res_type == "Patient":
                if "birthDate" in resource_entity:
                    birth_year = int(resource_entity["birthDate"].split("-")[0])
                    runtime_features['Age'] = float(datetime.datetime.now().year - birth_year)

                for extension in resource_entity.get("extension", []):
                    url = extension.get("url", "")
                    if "sickle-cell-genotype" in url:
                        runtime_features['SCD_Risk_Score'] = float({'AA':0,'AS':1,'SC':2,'SS':3}.get(extension.get("valueCode"), 0))
                    elif "anc-booking-week" in url:
                        wk = int(extension.get("valueInteger", 12))
                        runtime_features['ANC_Booking_Week'] = float(wk)
                        runtime_features['Late_ANC_Booking'] = 1.0 if wk >= 20 else 0.0
                    elif "hiv-status" in url:
                        runtime_features['HIV_Risk_Score'] = float({'Negative':0,'Unknown':0.2,'Positive_ART':0.5,'Positive_No_ART':1.0}.get(extension.get("valueCode"), 0))
                    elif "malaria-episodes" in url:
                        runtime_features['Malaria_Episodes'] = float(extension.get("valueInteger", 0))
                    elif "prior-hypertension" in url:
                        runtime_features['Prior_Hypertension_History'] = 1.0 if extension.get("valueBoolean") is True else 0.0
                    elif "multiple-gestation" in url:
                        runtime_features['Multiple_Gestation'] = 1.0 if extension.get("valueBoolean") is True else 0.0
                    elif "grand-multiparity" in url:
                        runtime_features['Grand_Multiparity'] = 1.0 if extension.get("valueBoolean") is True else 0.0
                    elif "gravidity" in url:
                        runtime_features['Gravidity'] = float(extension.get("valueInteger", 1))
                    elif "facility-delivery" in url:
                        runtime_features['Prior_Facility_Delivery'] = 1.0 if extension.get("valueBoolean") is True else 0.0
                    elif "iptp-doses" in url:
                        runtime_features['IPTp_Doses'] = float(extension.get("valueInteger", 0))

            elif res_type == "Observation":
                coding = resource_entity.get("code", {}).get("coding", [])
                if any(node.get("code") == "55284-4" for node in coding):
                    for part in resource_entity.get("valueQuantity", []):
                        if part.get("component") == "systolic":
                            runtime_features['Systolic_BP'] = float(part.get("value", 120))
                        elif part.get("component") == "diastolic":
                            runtime_features['Diastolic_BP'] = float(part.get("value", 80))
                elif any(node.get("code") == "2339-0" for node in coding):
                    runtime_features['Blood_Sugar'] = float(resource_entity.get("valueQuantity", {}).get("value", 5.0))
                elif any(node.get("code") == "8867-4" for node in coding):
                    runtime_features['HeartRate'] = float(resource_entity.get("valueQuantity", {}).get("value", 72.0))

        # Pass true metrics into inference workflow
        inference_output = run_vector_inference(runtime_features)
        return jsonify(inference_output), 200

    except Exception as e:
        return jsonify({"error": "Pipeline execution failure", "internal_details": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get("PORT", 5000)))