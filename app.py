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

# ─── Groq: lazy-initialized to prevent crash on missing env var at boot ───────
_groq_client = None

def get_groq_client():
    global _groq_client
    if _groq_client is None:
        api_key = os.environ.get("GROQ_API_KEY")
        if api_key:
            try:
                from groq import Groq
                _groq_client = Groq(api_key=api_key)
            except Exception as e:
                print(f"⚠️  Groq client init failed: {e}")
    return _groq_client

# ─── Model config ─────────────────────────────────────────────────────────────
FEATURES = [
    'Age', 'Systolic_BP', 'Diastolic_BP', 'Blood_Sugar', 'Body_Temperature', 'HeartRate',
    'Malaria_Episodes', 'SCD_Risk_Score', 'Late_ANC_Booking', 'ANC_Booking_Week',
    'HIV_Risk_Score', 'IPTp_Doses', 'Prior_Facility_Delivery',
    'Prior_Hypertension_History', 'Multiple_Gestation', 'Gravidity', 'Grand_Multiparity'
]

TARGET_CHANNELS = {
    'PPH':      'Target_PPH',
    'Preeclamp':'Target_Preeclamp',
    'Preterm':  'Target_Preterm'
}

LIVE_ENGINES = {}

OPERATING_THRESHOLDS = {
    'PPH':      0.22,
    'Preeclamp':0.25,
    'Preterm':  0.24
}

# ─── Training ─────────────────────────────────────────────────────────────────
def initialize_and_train_model():
    global LIVE_ENGINES
    print("📥 Ingesting clinical training records...")
    try:
        kaggle_dir  = kagglehub.dataset_download("abuchionwuegbusi/maternal-health-risk")
        target_csvs = glob.glob(os.path.join(kaggle_dir, "*.csv"))
        df_kaggle   = pd.read_csv(target_csvs[0])

        u_repo         = fetch_ucirepo(id=863)
        df_master_raw  = u_repo.data.original

        rename_map = {
            'SystolicBP':  'Systolic_BP',
            'DiastolicBP': 'Diastolic_BP',
            'BodyTemp':    'Body_Temperature',
            'BS':          'Blood_Sugar'
        }
        df_kaggle     = df_kaggle.rename(columns=rename_map)
        df_master_raw = df_master_raw.rename(columns=rename_map)

        df_master = (
            pd.concat([df_kaggle, df_master_raw], axis=0, ignore_index=True)
            .drop_duplicates()
            .reset_index(drop=True)
        )
        df_master['RiskLevel_Num'] = (
            df_master['RiskLevel'].str.lower()
            .map({'low risk': 0, 'mid risk': 1, 'high risk': 2})
            .fillna(0)
        )

        np.random.seed(42)
        n = len(df_master)
        df_master['Malaria_Episodes']         = np.random.binomial(2, 0.15, n)
        df_master['SCD_Risk_Score']           = np.random.choice([0,1,2,3], size=n, p=[0.70,0.23,0.05,0.02])
        df_master['ANC_Booking_Week']         = np.random.randint(8, 32, n)
        df_master['Late_ANC_Booking']         = (df_master['ANC_Booking_Week'] >= 20).astype(int)
        df_master['HIV_Risk_Score']           = np.random.choice([0.0,0.2,0.5,1.0], size=n, p=[0.95,0.02,0.02,0.01])
        df_master['IPTp_Doses']               = np.random.choice([0,1,2,3], size=n, p=[0.20,0.30,0.35,0.15])
        df_master['Prior_Facility_Delivery']  = np.random.choice([0,1], size=n, p=[0.40,0.60])
        df_master['Prior_Hypertension_History'] = np.where(df_master['Systolic_BP'] > 135, 1, 0)
        df_master['Multiple_Gestation']       = np.random.choice([0,1], size=n, p=[0.97,0.03])
        df_master['Gravidity']                = np.random.randint(1, 6, n)
        df_master['Grand_Multiparity']        = (df_master['Gravidity'] >= 5).astype(int)
        df_master['HeartRate']                = df_master['HeartRate'].fillna(75.0)

        df_master['Target_PPH'] = (
            (df_master['RiskLevel_Num']/2.0)*0.35 +
            (df_master['SCD_Risk_Score']/3.0)*0.20 +
            (df_master['Blood_Sugar'] < 7.0).astype(float)*0.15
        ) >= 0.35
        df_master['Target_PPH'] = df_master['Target_PPH'].astype(int)

        df_master['Target_Preeclamp'] = (
            (df_master['Systolic_BP'] >= 140).astype(float)*0.35 +
            df_master['Prior_Hypertension_History'].astype(float)*0.20
        ) >= 0.35
        df_master['Target_Preeclamp'] = df_master['Target_Preeclamp'].astype(int)

        df_master['Target_Preterm'] = (
            (df_master['RiskLevel_Num']/2.0)*0.30 +
            (df_master['Malaria_Episodes']/2.0)*0.25
        ) >= 0.28
        df_master['Target_Preterm'] = df_master['Target_Preterm'].astype(int)

        X_matrix = df_master[FEATURES].fillna(df_master[FEATURES].median())

        for channel, col_name in TARGET_CHANNELS.items():
            y_vector = df_master[col_name]
            X_train, _, y_train, _ = train_test_split(
                X_matrix, y_vector, test_size=0.2, random_state=42, stratify=y_vector
            )
            X_res, y_res = SMOTETomek(random_state=42).fit_resample(X_train, y_train)

            booster = xgb.XGBClassifier(
                objective='binary:logistic',
                learning_rate=0.05,
                max_depth=5,
                n_estimators=200,
                eval_metric='logloss',
                random_state=42
            )
            booster.fit(X_res, y_res)
            LIVE_ENGINES[channel] = booster

        print(f"⚡ Models fully trained across {n} records.")

    except Exception as e:
        print(f"❌ Initialization aborted: {e}")


initialize_and_train_model()


# ─── Groq narrative ───────────────────────────────────────────────────────────
def generate_groq_clinical_rationale(condition_name, probability, top_drivers, patient_vitals):
    client = get_groq_client()
    if not client:
        return f"Risk driven by: {top_drivers}"

    try:
        system_prompt = (
            "You are an expert obstetric intelligence assistant evaluating maternal health risks in Nigeria. "
            "Provide a concise, 2-sentence clinical breakdown explaining why this patient is flagged. "
            "Incorporate local context (malaria burden, ANC booking patterns) where applicable. "
            "No introductory words or meta-commentary. Speak directly to the clinician."
        )
        user_prompt = (
            f"Condition: {condition_name}\n"
            f"Probability: {probability:.2%}\n"
            f"SHAP drivers: {top_drivers}\n"
            f"Patient vector: {json.dumps(patient_vitals)}"
        )
        resp = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_prompt}
            ],
            model="llama-3.1-8b-instant",
            temperature=0.2,
            max_tokens=120
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        return f"Risk driven by: {top_drivers}. (Groq fallback: {e})"


# ─── Inference ────────────────────────────────────────────────────────────────
def run_vector_inference(raw_metrics):
    eval_df          = pd.DataFrame([raw_metrics])[FEATURES]
    conditions_resp  = {}
    agg_scores       = []
    activation_flags = []

    for channel, engine in LIVE_ENGINES.items():
        prob      = float(engine.predict_proba(eval_df)[0][1])
        threshold = OPERATING_THRESHOLDS[channel]
        is_active = prob >= threshold
        score     = int(prob * 100)

        agg_scores.append(score)
        activation_flags.append(int(is_active))

        explainer   = shap.TreeExplainer(engine)
        shap_vals   = explainer(eval_df).values[0]
        top_idx     = np.argsort(np.abs(shap_vals))[::-1][:3]

        drivers = "; ".join(
            f"{FEATURES[i]} ({'+' if shap_vals[i] > 0 else ''}{shap_vals[i]:.2f})"
            for i in top_idx
        )

        label = (
            'Postpartum Haemorrhage'   if channel == 'PPH'      else
            'Preeclampsia/Eclampsia'   if channel == 'Preeclamp' else
            'Preterm Labour'
        )

        rationale = generate_groq_clinical_rationale(label, prob, drivers, raw_metrics)

        conditions_resp[channel] = {
            'condition':      label,
            'probability':    round(prob, 4),
            'score_0_to_100': score,
            'flagged':        bool(is_active),
            'top_drivers':    rationale
        }

    max_score   = max(agg_scores)
    any_flagged = any(activation_flags)

    if max_score >= 70:
        priority, colour = "🚨 CRITICAL — Immediate specialist review required", "RED"
    elif max_score >= 50 or any_flagged:
        priority, colour = "⚠️ HIGH — Prioritize immediate clinical assessment",   "AMBER"
    elif max_score >= 30:
        priority, colour = "🟡 MODERATE — Monitor closely, reassess within 7 days","YELLOW"
    else:
        priority, colour = "✅ LOW — Standard preventative antenatal routine",      "GREEN"

    return {
        'composite_score':  max_score,
        'any_flagged':      any_flagged,
        'priority':         priority,
        'priority_colour':  colour,
        'conditions':       conditions_resp,
        'timestamp':        datetime.datetime.utcnow().isoformat() + 'Z',
        'model_version':    'nurture-v2.0'
    }


# ─── FHIR parser ──────────────────────────────────────────────────────────────
def parse_fhir_bundle(bundle):
    """
    Parses a FHIR R4 Bundle into the flat feature dict expected by the ML engine.
    Handles the JS client's BP format: valueQuantity as an array with a 'component' key.
    """
    features = {feat: 0.0 for feat in FEATURES}

    # Sensible clinical defaults so missing fields don't zero-out predictions
    features['Body_Temperature'] = 37.0
    features['HeartRate']        = 75.0
    features['Blood_Sugar']      = 5.0
    features['Systolic_BP']      = 120.0
    features['Diastolic_BP']     = 80.0
    features['Gravidity']        = 1.0
    features['ANC_Booking_Week'] = 12.0

    SCD_MAP  = {'AA': 0, 'AS': 1, 'SC': 2, 'SS': 3}
    HIV_MAP  = {
        'Negative':        0.0,
        'Unknown':         0.2,
        'Positive_ART':    0.5,
        'Positive_No_ART': 1.0
    }

    for entry in bundle.get("entry", []):
        res      = entry.get("resource", {})
        res_type = res.get("resourceType")

        # ── Patient resource ──────────────────────────────────────────────────
        if res_type == "Patient":
            if "birthDate" in res:
                try:
                    birth_year         = int(res["birthDate"].split("-")[0])
                    features['Age']    = float(datetime.datetime.now().year - birth_year)
                except (ValueError, IndexError):
                    pass

            for ext in res.get("extension", []):
                url = ext.get("url", "")

                if "sickle-cell-genotype" in url:
                    features['SCD_Risk_Score'] = float(
                        SCD_MAP.get(ext.get("valueCode", "AA"), 0)
                    )

                elif "anc-booking-week" in url:
                    wk = int(ext.get("valueInteger", 12))
                    features['ANC_Booking_Week'] = float(wk)
                    features['Late_ANC_Booking'] = 1.0 if wk >= 20 else 0.0

                elif "hiv-status" in url:
                    features['HIV_Risk_Score'] = HIV_MAP.get(
                        ext.get("valueCode", "Negative"), 0.0
                    )

                elif "malaria-episodes" in url:
                    features['Malaria_Episodes'] = float(ext.get("valueInteger", 0))

                elif "prior-hypertension" in url:
                    features['Prior_Hypertension_History'] = (
                        1.0 if ext.get("valueBoolean") is True else 0.0
                    )

                elif "multiple-gestation" in url:
                    features['Multiple_Gestation'] = (
                        1.0 if ext.get("valueBoolean") is True else 0.0
                    )

                elif "grand-multiparity" in url:
                    features['Grand_Multiparity'] = (
                        1.0 if ext.get("valueBoolean") is True else 0.0
                    )

                elif "gravidity" in url:
                    grav = float(ext.get("valueInteger", 1))
                    features['Gravidity']        = grav
                    features['Grand_Multiparity'] = 1.0 if grav >= 5 else 0.0

                elif "facility-delivery" in url:
                    features['Prior_Facility_Delivery'] = (
                        1.0 if ext.get("valueBoolean") is True else 0.0
                    )

                elif "iptp-doses" in url:
                    features['IPTp_Doses'] = float(ext.get("valueInteger", 0))

        # ── Observation resource ──────────────────────────────────────────────
        elif res_type == "Observation":
            coding = res.get("code", {}).get("coding", [])
            codes  = {c.get("code") for c in coding}
            vq     = res.get("valueQuantity")

            # Blood pressure — LOINC 55284-4
            # JS client sends valueQuantity as an ARRAY:
            #   [{ "value": 120, "component": "systolic" }, ...]
            if "55284-4" in codes:
                if isinstance(vq, list):
                    for part in vq:
                        comp = part.get("component", "").lower()
                        val  = part.get("value")
                        if val is not None:
                            if comp == "systolic":
                                features['Systolic_BP']  = float(val)
                            elif comp == "diastolic":
                                features['Diastolic_BP'] = float(val)
                # Also handle object form with nested components (FHIR standard)
                elif isinstance(vq, dict):
                    for comp_entry in res.get("component", []):
                        comp_codes = {
                            c.get("code")
                            for c in comp_entry.get("code", {}).get("coding", [])
                        }
                        comp_val = comp_entry.get("valueQuantity", {}).get("value")
                        if comp_val is not None:
                            if "8480-6" in comp_codes:   # systolic
                                features['Systolic_BP']  = float(comp_val)
                            elif "8462-4" in comp_codes: # diastolic
                                features['Diastolic_BP'] = float(comp_val)

            # Blood glucose — LOINC 2339-0
            elif "2339-0" in codes:
                if isinstance(vq, dict) and vq.get("value") is not None:
                    features['Blood_Sugar'] = float(vq["value"])

            # Heart rate — LOINC 8867-4
            elif "8867-4" in codes:
                if isinstance(vq, dict) and vq.get("value") is not None:
                    features['HeartRate'] = float(vq["value"])

            # Body temperature — LOINC 8310-5
            elif "8310-5" in codes:
                if isinstance(vq, dict) and vq.get("value") is not None:
                    features['Body_Temperature'] = float(vq["value"])

    return features


# ─── Routes ───────────────────────────────────────────────────────────────────
@app.route('/healthz', methods=['GET'])
def health_check():
    engines_ready = len(LIVE_ENGINES) == 3
    groq_ready    = get_groq_client() is not None
    return jsonify({
        "status":        "healthy" if engines_ready else "degraded",
        "engines_loaded": engines_ready,
        "groq_connected": groq_ready,
        "model_version":  "nurture-v2.0"
    }), 200 if engines_ready else 503


@app.route('/api/v1/uwa/score', methods=['POST'])
def receive_fhir_transaction():
    try:
        bundle = request.get_json()

        if not bundle or bundle.get("resourceType") != "Bundle":
            return jsonify({
                "error": "Malformed payload. FHIR R4 Bundle required.",
                "hint":  "Ensure resourceType is 'Bundle' with an 'entry' array."
            }), 400

        features = parse_fhir_bundle(bundle)
        result   = run_vector_inference(features)
        return jsonify(result), 200

    except Exception as e:
        return jsonify({
            "error":            "Pipeline execution failure",
            "internal_details": str(e)
        }), 500


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)