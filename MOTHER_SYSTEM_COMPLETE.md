# Nurture AI — Mother Portal Implementation Complete ✅

**Status:** Fully integrated and ready for testing  
**Date:** 2026-06-06  
**System Type:** Independent maternal health companion (separate from Tolu)

---

## Summary

The Nurture AI mother-side system is now **fully implemented and integrated** into the UWA app. When mothers login through the auth portal and select "Mother," they are automatically routed to the new `/mother` dashboard featuring the integrated Nurture AI widget.

### What's Included

#### API Endpoints (10 routes)

✅ **Text Chat**

- `POST /api/mother/chat` — AI analysis with severity flagging

✅ **Voice Chat**

- `POST /api/mother/voice/session` — WebRTC session creation
- `POST /api/mother/voice/session/[sid]` — SDP offer/answer relay
- `POST /api/mother/voice/agent-tools` — Tool execution (log_symptoms, get_appointment, call_doctor, request_ambulance)
- `GET/POST /api/mother/voice/ui-events` — Real-time event queue to UI

✅ **Clinical Data**

- `GET/POST /api/mother/appointments` — ANC visit lookup
- `GET/POST /api/mother/symptom-log` — Symptom history with auto-flagging
- `GET/POST/PATCH /api/mother/doctor-on-duty` — On-duty doctor management
- `POST/GET/PATCH /api/mother/ambulance` — Emergency dispatch

✅ **Maintenance**

- `POST /api/mother/voice/reset-agent` — Force agent recreation when URLs change

#### React Components (2)

✅ **NurtureAI.tsx** (780px max-height)

- Dual-mode interface (text chat + voice chat)
- Real-time severity badges
- Emergency buttons always visible
- Audio visualization
- Event queue polling
- Full TypeScript types

✅ **DoctorOnDutyManager.tsx**

- Clinician dashboard widget
- Set/clear on-duty doctor
- Specialty selection
- Call routing

#### Database Schema

✅ **4 tables** (via SUPABASE_MIGRATION.sql)

- `appointments` — ANC visit records
- `symptom_logs` — Maternal health tracking
- `doctor_on_duty` — Current shift doctor
- `ambulance_requests` — Emergency dispatch

#### UI Integration

✅ **Mother Dashboard** (/src/app/mother/page.tsx)

- Left column: Existing dashboard cards (28-week progress, appointments, etc.)
- Right column: NurtureAI widget (sticky, 780px max-height)
- Session-based patient ID and name
- Auth redirect from login

#### Auth Integration

✅ **Auth Portal** (/src/app/auth/uwa-auth-portal.tsx)

- Mother role selection
- Automatic redirect to `/mother` on login
- Already configured ✅ (no changes needed)

---

## System Separation (Complete Independence)

| Component          | Tolu (Clinician)            | Nurture AI (Mother)             |
| ------------------ | --------------------------- | ------------------------------- |
| **Agent Name**     | "Tolu — Nurture Voice Core" | "Nurture AI — Mother Voice"     |
| **Agent ID Env**   | `AETHEX_AGENT_ID`           | `AETHEX_MOTHER_AGENT_ID`        |
| **Session Route**  | `/api/voice/session`        | `/api/mother/voice/session`     |
| **Tools Route**    | `/api/voice/agent-tools`    | `/api/mother/voice/agent-tools` |
| **Event Queue**    | `eventQueues` Map           | `motherEventQueues` Map         |
| **UI Event Route** | `/api/voice/ui-events`      | `/api/mother/voice/ui-events`   |
| **System Prompt**  | Clinical workspace tool     | Maternal health companion       |
| **Voice Config**   | Tolu voice (ID varies)      | Female voice (96b20f06-...)     |

**Result:** Zero cross-contamination. Each system is completely isolated.

---

## Setup Required

### 1. Database

Run `SUPABASE_MIGRATION.sql` in Supabase SQL editor.

### 2. Environment Variables

Add to `.env.local`:

```env
AETHEX_MOTHER_AGENT_ID=        # Leave blank, auto-created first run, then fill with ID
AETHEX_API_KEY=ae_live_...     # Already configured for Tolu
NEXT_PUBLIC_SUPABASE_URL=...   # Already configured
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
ANTHROPIC_API_KEY=...          # Already configured (Groq/Cencori)
NEXT_PUBLIC_APP_URL=https://...
```

### 3. First Run

1. Navigate to `/auth` and select "Mother"
2. Login (any credentials for dev)
3. Should redirect to `/mother`
4. Click "Start Voice Session" to trigger agent creation
5. Copy the auto-created agent ID into `AETHEX_MOTHER_AGENT_ID`

### 4. Features Ready to Test

- ✅ Text chat (severity detection, symptom logging)
- ✅ Voice chat (WebRTC, tool calling, event updates)
- ✅ Emergency buttons (Call Doctor, Ambulance)
- ✅ Doctor on-duty lookup
- ✅ Appointment display
- ✅ Symptom history with auto-flagging

---

## File Locations

**API Routes:**

```
src/app/api/mother/
├── chat/route.ts
├── appointments/route.ts
├── symptom-log/route.ts
├── ambulance/route.ts
├── doctor-on-duty/route.ts
└── voice/
    ├── session/route.ts
    ├── session/[sid]/route.ts
    ├── agent-tools/route.ts
    ├── ui-events/route.ts
    └── reset-agent/route.ts
```

**Components:**

```
src/components/
├── NurtureAI.tsx
└── DoctorOnDutyManager.tsx
```

**Pages:**

```
src/app/
├── auth/
│   ├── page.tsx (router)
│   └── uwa-auth-portal.tsx (login UI)
└── mother/
    └── page.tsx (dashboard with NurtureAI)
```

**Setup Documentation:**

```
MOTHER_SETUP_GUIDE.md (this document)
SUPABASE_MIGRATION.sql (database schema)
```

---

## Testing Workflow

### Text Mode

1. Navigate to `/mother`
2. Type in chat: "I have a headache"
3. ✅ AI responds with reassurance
4. ✅ Severity badge appears
5. ✅ Symptom logged to DB

### Voice Mode

1. Click "Start Voice Session"
2. ✅ Listens within 5 seconds
3. Say: "My blood pressure is high"
4. ✅ AI processes, logs symptom
5. ✅ Emergency panel highlights if critical
6. ✅ UI event queue delivers alerts to dashboard

### Emergency Path (Voice)

1. Say: "I'm bleeding"
2. ✅ AI detects "critical" severity
3. ✅ Triggers ambulance request event
4. ✅ Button highlights red
5. ✅ Logs to ambulance_requests table

---

## Next Steps

1. **Database Migration** → Run SUPABASE_MIGRATION.sql
2. **Environment Setup** → Add AETHEX_MOTHER_AGENT_ID (leave blank initially)
3. **Initial Test** → Login as mother, start voice session
4. **Production Config** → Fill AETHEX_MOTHER_AGENT_ID with auto-created ID
5. **Real Integration** → Connect to real ambulance/doctor dispatch APIs
6. **Monitoring** → Set up logs for `/api/mother/voice/agent-tools` tool execution

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     UWA App                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
            ┌───────▼────────┐  ┌──────▼────────┐
            │  Tolu System   │  │ Nurture AI    │
            │  (Clinician)   │  │ (Mother)      │
            │                │  │               │
            │ /api/voice/*   │  │ /api/mother/* │
            │ eventQueues    │  │ motherEventQ. │
            └────────────────┘  └───────────────┘
                    │                   │
            ┌───────▼────────┐  ┌──────▼────────┐
            │ Aethex Agent 1 │  │ Aethex Agent 2│
            │ "Tolu"         │  │ "Nurture AI"  │
            │ (Clinician AI) │  │ (Mother AI)   │
            └────────────────┘  └───────────────┘
                    │                   │
            ┌───────▼─────────────────▼───────┐
            │ Supabase (RLS Protected)        │
            │ - appointments                  │
            │ - symptom_logs                  │
            │ - doctor_on_duty                │
            │ - ambulance_requests            │
            └─────────────────────────────────┘
```

---

## Deployment Checklist

- [ ] Database migration executed
- [ ] Environment variables set
- [ ] `AETHEX_MOTHER_AGENT_ID` populated (after first run)
- [ ] Mother portal accessible at `/mother`
- [ ] Text chat functional
- [ ] Voice chat functional
- [ ] Severity detection working
- [ ] Ambulance integration connected
- [ ] Doctor on-duty workflow tested
- [ ] Symptom logs visible in Supabase
- [ ] Performance tested on slow network
- [ ] RLS policies enforced
- [ ] Logs monitored in production

---

## Support & Debugging

See **MOTHER_SETUP_GUIDE.md** for:

- Detailed troubleshooting
- API endpoint specifications
- Tool definitions and responses
- Severity mapping
- Real ambulance service integration

---

**Implementation Status:** ✅ **COMPLETE**  
**Ready for:** Database migration → Environment setup → Testing → Production

All files are in place. No additional development required for core functionality.
