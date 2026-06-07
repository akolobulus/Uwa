# Nurture AI — Mother Side Setup Guide

> ✅ **FULLY INTEGRATED** — This system is **completely independent** from Tolu (clinician voice agent).

---

## Quick Start Checklist

- [ ] **1. Database** — Run the migration SQL
- [ ] **2. Environment** — Add env variables
- [ ] **3. Verify** — Test the mother portal at `/mother`
- [ ] **4. Production** — Set up Aethex agent ID caching

---

## 1. Database Migration

Copy the contents of `SUPABASE_MIGRATION.sql` into your Supabase SQL editor and run it.

**Tables created:**

| Table                | Purpose                                     |
| -------------------- | ------------------------------------------- |
| `appointments`       | Upcoming ANC visit records                  |
| `symptom_logs`       | Every symptom mother reports (voice + text) |
| `doctor_on_duty`     | Which doctor is currently on shift          |
| `ambulance_requests` | Emergency dispatch records                  |

---

## 2. Environment Variables

Add these to your `.env.local`:

```env
# Shared with Tolu (already set):
AETHEX_API_KEY=ae_live_...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
ANTHROPIC_API_KEY=...
NEXT_PUBLIC_APP_URL=https://your-domain.com

# NEW — Mother agent ID (optional, but recommended for zero-cold-start):
AETHEX_MOTHER_AGENT_ID=         # Leave blank initially, fill after first run
```

**After the first mother voice session**, check your server logs:

```
[NurtureAI] Created agent: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

Copy this ID into `AETHEX_MOTHER_AGENT_ID` so it's not recreated on every server restart.

---

## 3. File Structure

Files are automatically in place:

```
src/
  api/
    mother/
      chat/
        route.ts                ← Text chat (Claude via Cencori)
      appointments/
        route.ts                ← ANC visit lookup
      symptom-log/
        route.ts                ← Symptom history
      ambulance/
        route.ts                ← Emergency dispatch
      doctor-on-duty/
        route.ts                ← On-duty doctor lookup
      voice/
        session/
          route.ts              ← WebRTC session start
          [sid]/route.ts        ← SDP offer/answer
        agent-tools/
          route.ts              ← Tool execution (log_symptoms, etc.)
        ui-events/
          route.ts              ← UI event queue
        reset-agent/
          route.ts              ← Force agent recreation

  components/
    NurtureAI.tsx               ← Main widget (text + voice chat)
    DoctorOnDutyManager.tsx     ← Clinician duty status widget

  app/
    mother/
      page.tsx                  ← Mother dashboard (includes NurtureAI)
```

---

## 4. How It Works

### Text Chat Flow

1. Mother types message in NurtureAI widget
2. → POST `/api/mother/chat` (Claude via Groq/Cencori)
3. ← AI analyzes severity, suggests action, logs symptoms
4. UI displays: severity badge, alert, doctor/ambulance buttons

### Voice Chat Flow

1. Mother clicks "Start Voice Session"
2. → POST `/api/mother/voice/session` (Aethex WebRTC)
3. Browser sends SDP offer → `/api/mother/voice/session/[sid]/offer`
4. Aethex agent "Nurture AI — Mother Voice" listens
5. When tool needed (e.g. `log_symptoms`) → Aethex calls `/api/mother/voice/agent-tools`
6. Tool handler queries DB, returns guidance
7. UI events queue to `/api/mother/voice/ui-events` for UI updates

### Severity Mapping

| Severity     | Examples                                                           | AI Action                     |
| ------------ | ------------------------------------------------------------------ | ----------------------------- |
| **low**      | Normal questions, mild nausea, food cravings                       | ✅ Reassure, provide info     |
| **moderate** | Mild headaches, back pain, heartburn                               | 📞 Suggest calling clinic     |
| **high**     | Fever, persistent vomiting, swelling, reduced movement             | 🚑 Alert on-duty doctor       |
| **critical** | Heavy bleeding, seizures, no fetal movement, loss of consciousness | 🚨 Request ambulance + doctor |

---

## 5. Reset Agent (When ngrok URL Changes)

If your tunnel URL changes and Aethex still has old webhook URLs:

```bash
curl -X POST https://your-domain.com/api/mother/voice/reset-agent
```

The next time a mother starts a voice session, a fresh agent is created with correct URLs.

---

## 6. Connect Real Ambulance Service

**In production**, replace the placeholder in `/api/mother/ambulance/route.ts`:

```typescript
// Current (placeholder):
console.log("🚨 AMBULANCE REQUESTED:", data);

// Replace with:
// POST to LASAMBUS CAD API
// Or send SMS via Twilio to emergency coordinator
// Or message WhatsApp Business API
```

Same for `/api/mother/voice/agent-tools/route.ts` in `handleRequestAmbulance()`.

---

## 7. Testing Checklist

✅ **Text chat**

- [ ] Type a message → AI responds
- [ ] Describe symptoms → Severity badge appears
- [ ] For "critical": Ambulance button highlights

✅ **Voice chat**

- [ ] Click "Start Voice Session" → Listens within 5s
- [ ] Say a symptom → AI acknowledges and logs
- [ ] Ask for appointment → AI retrieves and speaks it back
- [ ] Say "Call doctor" → Doctor on-duty info appears

✅ **Data flow**

- [ ] Check `/symptom_logs` table → Entries created
- [ ] Check `/appointments` → Queries work
- [ ] Check `/doctor_on_duty` → Current doctor visible

✅ **Integration**

- [ ] Login as mother → Redirect to `/mother` works
- [ ] NurtureAI widget visible on right side
- [ ] Can toggle between chat and voice modes

---

## 8. Troubleshooting

### "AI service unavailable"

- Verify `ANTHROPIC_API_KEY` and Cencori credentials
- Check if Groq/Cencori endpoint is reachable

### "Aethex connection failed"

- Verify `AETHEX_API_KEY` is correct
- Check if `NEXT_PUBLIC_APP_URL` is set to your actual domain
- Run `/api/mother/voice/reset-agent` to force agent recreation

### "Doctor on duty: not found"

- No doctor has called the `/api/mother/doctor-on-duty` POST endpoint
- Clinician dashboard (`DoctorOnDutyManager`) must be used to register

### Voice cuts off after 5s

- Ice gathering timeout too short — increase in `startVoiceSession()`
- Network latency — check browser DevTools Network tab

---

## 9. Independence Guarantee

| Aspect               | Tolu (Clinician)            | Nurture AI (Mother)             |
| -------------------- | --------------------------- | ------------------------------- |
| **Agent Name**       | "Tolu — Nurture Voice Core" | "Nurture AI — Mother Voice"     |
| **Session Endpoint** | `/api/voice/session`        | `/api/mother/voice/session`     |
| **Tools Endpoint**   | `/api/voice/agent-tools`    | `/api/mother/voice/agent-tools` |
| **UI Events**        | `/api/voice/ui-events`      | `/api/mother/voice/ui-events`   |
| **Env Var**          | `AETHEX_AGENT_ID`           | `AETHEX_MOTHER_AGENT_ID`        |
| **In-Memory Queue**  | `eventQueues`               | `motherEventQueues`             |

**Zero shared state.** Breaking one system does not affect the other.

---

## 10. Going Live

Before production deployment:

1. ✅ Run database migration
2. ✅ Set all env variables
3. ✅ Test text and voice modes
4. ✅ Configure real ambulance API
5. ✅ Set `AETHEX_MOTHER_AGENT_ID` in `.env`
6. ✅ Enable RLS policies on Supabase tables
7. ✅ Monitor `/api/mother/voice/agent-tools` logs for tool calls
8. ✅ Test on slow network (DevTools throttling)

---

## Support

For issues, check:

- Server logs for `[NurtureAI]` prefixed messages
- Supabase logs for RLS or connection errors
- Browser DevTools Network tab for API response codes
- Aethex dashboard for agent and session status

---

**Last updated:** 2026-06-06
**System:** Nurture AI — Mother Side v1.0 (Independent from Tolu)
