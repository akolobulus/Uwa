<div align="center">
  <img src="public/site logo.png" alt="Nurture Logo" width="100" style="border-radius: 50%"/>
  <h1>Nurture v2.0</h1>
  <p><strong>AI-powered maternal health triage for Nigerian antenatal clinics</strong></p>
  <p>
    <img src="https://img.shields.io/badge/Next.js-16.2-black?logo=next.js" alt="Next.js"/>
    <img src="https://img.shields.io/badge/Python-Flask-blue?logo=python" alt="Flask"/>
    <img src="https://img.shields.io/badge/XGBoost-ML Engine-orange" alt="XGBoost"/>
    <img src="https://img.shields.io/badge/Supabase-Database-green?logo=supabase" alt="Supabase"/>
    <img src="https://img.shields.io/badge/Groq-Llama 3.3-purple" alt="Groq"/>
    <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License"/>
  </p>
  <p>
    Built for <strong>The Artificial Future Hackathon 2026</strong> · Healthcare Access Track
  </p>
</div>

---

## What is Nurture?

Nigeria accounts for **28.5% of all global maternal deaths**. A Nigerian woman has a **1-in-19 lifetime risk** of dying from pregnancy — compared to 1-in-4,900 in wealthy countries. One of the biggest causes is the "First Delay": danger signs being missed or noticed too late.

Nurses and midwives at busy government clinics see 30–60 patients a day, logging everything on paper, with no tool to help them decide who needs urgent care _right now_.

**Nurture** is a two-sided AI platform that fixes that. It gives clinicians a real-time risk scoring system that joins all the dots — blood pressure, sickle cell type, malaria history, HIV status, antenatal booking date, and more — and tells them, in plain English, which patient needs immediate attention and why. It also gives pregnant women a 24/7 AI companion they can talk to when they are worried, and that can alert their doctor or request an ambulance on their behalf.

> **"Uwa"** means _world / life_ in Igbo and _mother_ in Hausa — deliberately chosen to reflect the cross-cultural, Nigerian-first design of this platform.

---

## Screenshots

### Landing Page

![Nurture Landing Page](public/hero.png)

### Auth / Login Portal

![Nurture Auth Page](public/auth-illustration.png)

### Clinician Dashboard

![Nurture Clinician Dashboard](public/screen.png)

---

## The Two Sides of Nurture

### 🩺 Clinician Portal

Built for the midwife or obstetric nurse working a busy antenatal clinic.

- Register patients with 14 clinical fields — including Nigerian-specific risk factors like sickle cell genotype, HIV/ART status, malaria episodes, malaria prevention dose count (IPTp), late antenatal booking, and number of previous pregnancies

- Log each antenatal visit: blood pressure, heart rate, blood sugar, temperature, weight, swelling (oedema), protein in urine

- Get instant AI risk scores for 3 dangerous conditions:

**Postpartum Haemorrhage** — dangerous bleeding after delivery

- **Preeclampsia / Eclampsia** — dangerous high blood pressure in pregnancy that can cause seizures

- **Preterm Labour** — risk of delivering too early

- Read a plain-English explanation of _why_ a patient was flagged, with specific numbers and a 6-step action plan

- Use **Tolu**, a hands-free voice assistant, to register patients, log visits, search records, and ask "why was this patient flagged?" — all by speaking

### 🤱 Mother Portal

Built for the pregnant woman at home between appointments.

- Chat with **Nurture AI** by typing or speaking — in plain English or Nigerian Pidgin

- Get a warm, clear response that tells her whether her symptoms are normal or need urgent attention

- High-risk symptoms automatically alert the on-duty doctor and show their phone number

- One-tap **Ambulance** button for true emergencies

- Symptoms are logged automatically so the clinician sees them at the next visit

---

## How the AI Works

### Risk Scoring Engine (Python / Flask — deployed on Render)

Three separate **XGBoost** machine learning models analyse 17 clinical variables simultaneously and produce a risk score (0–99) for each condition.

**The 17 variables include standard vitals plus Nigeria-specific factors:**

Category
Variables

Vitals
Age, Systolic BP, Diastolic BP, Blood Sugar, Temperature, Heart Rate

Nigerian Context
Malaria Episodes, Sickle Cell Risk Score, HIV Risk Score, IPTp Doses

Antenatal History
ANC Booking Week, Late ANC Booking, Prior Facility Delivery

Pregnancy Details
Gravidity, Grand Multiparity, Multiple Gestation, Prior Hypertension

**Risk colour tiers:**

Score
Colour
Meaning

0–29
🟢 GREEN
Standard antenatal care

30–49
🟡 YELLOW
Reassess within 7 days

50–69
🟠 AMBER
Immediate clinical assessment

70–99
🔴 RED / CRITICAL
Immediate specialist review

**SHAP Explainability** identifies the top 3 factors driving each patient's score — so the system never just gives a number, it shows the clinician exactly what pushed it there.

### Clinical Narrative Generation (Groq Llama 3.3 70b via Cencori)

After scoring, Groq's Llama model reads the patient's full picture and writes a plain-English clinical summary that:

- Quotes the exact numbers that triggered the flag

- Explains what those numbers mean in plain language

- Connects the patient's history and background factors

- States the real-world consequence if not treated

- Gives 6 numbered action steps for the nurse

> Example: _"Her blood pressure today was 148/95, which is above the safe limit of 140/90. Combined with her previous history of high blood pressure and two malaria episodes this pregnancy, this reading is very concerning. If left untreated, this can cause seizures."_

### Voice Assistants (Aethex WebRTC)

Two completely separate voice agents — one for clinicians (Tolu), one for mothers (Nurture AI) — both powered by Aethex real-time voice AI over WebRTC.

**Tolu (Clinician)** can:

- Register new patients by voice

- Search patient records

- Log ANC visit vitals

- Explain why a patient was flagged

**Nurture AI Voice (Mother)** can:

- Listen to symptoms and assess severity

- Log symptoms to the database

- Check upcoming appointments

- Call the on-duty doctor

- Request an ambulance

### Data Exchange (FHIR R4)

Patient data is sent from the Next.js frontend to the Python ML backend using the **FHIR R4 Bundle** format — the international standard for clinical data exchange — ensuring the system is designed to integrate with real hospital information systems.

---

## Tech Stack

Layer
Technology

Frontend
Next.js 16, TypeScript, Tailwind CSS

Backend API
Next.js API Routes (TypeScript)

ML Engine
Python, Flask, XGBoost, SHAP, scikit-learn, imbalanced-learn

Database
Supabase (PostgreSQL with Row Level Security)

AI / LLM
Groq Llama 3.3 70b (via Cencori SDK)

Voice Agents
Aethex AI (WebRTC real-time voice)

ML Hosting
Render

Frontend Hosting
Vercel

Data Format
FHIR R4 Bundle

---

## Project Structure

```
nurture-v2/
├── app.py                          # Python/Flask ML backend
├── requirements.txt                # Python dependencies
├── SUPABASE_MIGRATION.sql          # Database schema
│
├── src/
│   ├── app/
│   │   ├── page.tsx                # Landing page
│   │   ├── auth/                   # Login / auth portal
│   │   ├── clinician/
│   │   │   └── dashboard/          # Clinician dashboard (main portal)
│   │   ├── mother/                 # Mother portal + NurtureAI chat
│   │   └── api/
│   │       ├── patients/           # Patient CRUD
│   │       │   └── visit/          # ANC visit logging + ML scoring
│   │       ├── risk-narrative/     # Groq narrative generation
│   │       ├── voice/              # Tolu clinician voice agent (Aethex)
│   │       └── mother/
│   │           ├── chat/           # Mother text chat (Groq)
│   │           ├── emergency/      # Doctor alert + ambulance request
│   │           ├── appointments/   # Appointment management
│   │           ├── doctor-on-duty/ # On-duty doctor management
│   │           └── voice/          # Mother voice agent (Aethex)
│   │
│   ├── components/
│   │   ├── RiskNarrativePanel.tsx  # AI clinical narrative display
│   │   ├── VoiceAssistant.tsx      # Tolu clinician voice widget
│   │   ├── NurtureAI.tsx           # Mother chat + voice interface
│   │   └── DoctorOnDutyManager.tsx # On-duty doctor management
│   │
│   ├── hooks/
│   │   └── useRiskNarrative.ts     # Narrative fetch + state hook
│   │
│   └── lib/
│       ├── supabase.ts             # Supabase client
│       └── cencori.ts              # Cencori (Groq gateway) client
│
└── public/                         # Static assets + site images
```

---

## Database Schema

The system uses Supabase (PostgreSQL). Core tables:

Table
Purpose

`patients`
Patient demographics and clinical history

`visits`
ANC visit vitals and ML risk scores per visit

`appointments`
Upcoming antenatal appointments

`symptom_logs`
Mother-reported symptoms and AI severity assessments

`doctor_on_duty`
Currently on-duty doctor for mother alert routing

`ambulance_requests`
Emergency ambulance request log

Run `SUPABASE_MIGRATION.sql` in your Supabase SQL editor to create the mother-side tables.

---

## Getting Started

### Prerequisites

- Node.js 20+

- Python 3.10+

- A Supabase project

- A Groq API key

- A Cencori API key

- An Aethex AI account and API key

### 1. Clone the repo

```
git clone https://github.com/akolobulus/Nurture_YPIT_Project.git
cd Nurture_YPIT_Project
```

### 2. Install frontend dependencies

```
npm install
```

### 3. Install Python dependencies

```
pip install -r requirements.txt
```

### 4. Set up environment variables

Create a `.env.local` file in the root:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Cencori (routes to Groq)
CENCORI_API_KEY=your_cencori_api_key
CENCORI_RISK_MODEL=groq/llama-3.3-70b-versatile

# Aethex Voice AI
AETHEX_API_KEY=your_aethex_api_key
AETHEX_AGENT_ID=your_clinician_agent_id        # optional — auto-created if blank
AETHEX_MOTHER_AGENT_ID=your_mother_agent_id    # optional — auto-created if blank

# ML Engine
COLAB_ENGINE_URL=https://your-render-app.onrender.com

# App URL (for voice agent tool callbacks)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For the Python backend, set:

```
GROQ_API_KEY=your_groq_api_key
PORT=5000
```

### 5. Set up the database

Run the contents of `SUPABASE_MIGRATION.sql` in your Supabase SQL editor to create the `appointments`, `symptom_logs`, `doctor_on_duty`, and `ambulance_requests` tables.

### 6. Start the ML backend

```
python app.py
```

The Flask server will start on `http://localhost:5000`. On first start it downloads training data and trains the three XGBoost models — this takes 2–4 minutes.

### 7. Start the frontend

```
npm run dev
```

Open [http://localhost:3000](http://localhost:3000/).

---

## Key Endpoints

### ML Backend (Flask)

Method
Route
Description

GET
`/healthz`
Check engine health and model status

POST
`/api/v1/uwa/score`
Score a patient from a FHIR R4 Bundle

### Frontend API (Next.js)

Method
Route
Description

GET/POST
`/api/patients`
List all patients / register new patient

POST
`/api/patients/visit`
Log ANC visit and trigger ML scoring

POST
`/api/risk-narrative`
Generate plain-English clinical narrative

POST
`/api/voice/session`
Start Tolu clinician voice session

POST
`/api/mother/chat`
Mother text chat with Nurture AI

POST
`/api/mother/emergency`
Alert doctor or request ambulance

GET/POST
`/api/mother/appointments`
Manage appointments

POST
`/api/mother/voice/session`
Start mother voice session

---

## What Makes This Different

Most maternal health tools in Nigeria are either paper-based, SMS-only, or generic apps that don't account for the specific risk profile of a Nigerian pregnant woman. Nurture is different in three ways:

**1. It is built for Nigerian clinical reality.** The AI models include malaria in pregnancy, sickle cell genotype (Nigeria has the world's highest burden), late antenatal booking, IPTp dose gaps, and HIV co-infection as first-class risk factors — not afterthoughts.

**2. It explains itself.** Every risk flag comes with a plain-English explanation that quotes real numbers and real history. A nurse doesn't need to trust a black box — she can see exactly what the system saw.

**3. It works for both the clinician and the mother.** Most tools pick one. Nurture connects both sides: a mother's symptoms reported via chat appear in the clinician's portal, and a doctor flagged as on-duty is reachable from the mother's emergency button.

---

## Team

Built with care for the mothers of Nigeria by:

Name
Contribution

**Akolo Bulus**
Full-stack engineering, ML pipeline, AI integration, product design

**Bede Nwankwo**
_(contributor)_

**Oluyemi Temitayo**
_(contributor)_

**Adepoju Adewale**
_(contributor)_

_Submitted for The Artificial Future Hackathon 2026 — Healthcare Access Track._
_Date submitted: June 7, 2026_

---

## Acknowledgements

- **Groq** — for fast, affordable LLM inference that makes real-time narrative generation possible

- **Aethex AI** — for the WebRTC voice agent infrastructure

- **Supabase** — for the database and real-time features

- **Cencori** — for the AI gateway SDK

- **UCI Machine Learning Repository** and **Kaggle** — for the maternal health datasets used to train the models

- **WHO / FIGO** — whose clinical guidelines on preeclampsia, PPH, and preterm labour informed the model labelling thresholds

---

## License

MIT — free to use, adapt, and build on. If you deploy this in a clinical setting, please validate the models against your own patient population before relying on scores for clinical decisions.

---

<div align="center">
  <p>Made in Nigeria, for Nigeria 🇳🇬</p>
  <p><em>"Uwa" — world, life, mother.</em></p>
</div>
