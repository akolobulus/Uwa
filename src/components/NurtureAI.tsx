"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Mode = "text" | "voice";
type ConnectionStatus = "idle" | "connecting" | "connected" | "error";
type Severity = "low" | "moderate" | "high" | "critical";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  severity?: Severity;
};

type UIEvent =
  | { type: "SYMPTOM_FLAGGED"; severity: Severity; symptoms: string[] }
  | { type: "TRIGGER_DOCTOR_CALL"; severity: Severity; symptoms: string[] }
  | { type: "TRIGGER_AMBULANCE"; severity: Severity; symptoms: string[] }
  | { type: "DOCTOR_CALLED"; doctor_name: string; doctor_phone: string; severity: string }
  | { type: "AMBULANCE_REQUESTED"; address: string; request_id: string; doctor_name: string | null }
  | { type: "SHOW_APPOINTMENT"; appointment: Record<string, unknown> }
  | { type: "DOCTOR_UNAVAILABLE" };

export interface NurtureAIProps {
  patientId?: string;
  patientName?: string;
}

// ─── Severity config ───────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<Severity, { color: string; bg: string; border: string; label: string; icon: string }> = {
  low:      { color: "text-green-700",  bg: "bg-green-50",  border: "border-green-200",  label: "All good",      icon: "check_circle" },
  moderate: { color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-200",  label: "Watch closely", icon: "warning" },
  high:     { color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200", label: "See doctor",    icon: "local_hospital" },
  critical: { color: "text-red-700",    bg: "bg-red-50",    border: "border-red-200",    label: "Emergency!",    icon: "emergency" },
};

// ─── Quick prompts ─────────────────────────────────────────────────────────────

type QuickPrompt = { label: string; icon: string; text: string };

const QUICK_PROMPTS: QuickPrompt[] = [
  { label: "Baby movement", icon: "child_care", text: "I haven't felt my baby move much today" },
  { label: "Bleeding", icon: "emergency", text: "I noticed some spotting or bleeding" },
  { label: "Headache", icon: "warning", text: "I have a severe headache and my vision is blurry" },
  { label: "Appointment", icon: "event", text: "When is my next appointment?" },
  { label: "Nausea", icon: "sentiment_very_dissatisfied", text: "I've been vomiting a lot today and can't keep food down" },
  { label: "Swelling", icon: "health_metrics", text: "My hands and face are swelling" },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export default function NurtureAI({ patientId, patientName }: NurtureAIProps) {
  // Mode
  const [mode, setMode] = useState<Mode>("text");

  // Text chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hello mama! 👋 I'm Nurture AI, your pregnancy health companion. I'm here to help you with:\n\n• Understanding your symptoms\n• Your next appointment\n• Questions about your baby\n• Connecting you to a doctor when needed\n\nHow are you feeling today?`,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());

  // Voice state
  const [voiceStatus, setVoiceStatus] = useState<ConnectionStatus>("idle");
  const [voiceError, setVoiceError] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);

  // Alerts
  const [activeAlert, setActiveAlert] = useState<UIEvent | null>(null);
  const [lastSeverity, setLastSeverity] = useState<Severity>("low");

  // Refs
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const voicePollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const voiceSessionIdRef = useRef<string | null>(null);

  // ─── Auto-scroll ────────────────────────────────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── Handle UI events ────────────────────────────────────────────────────────

  const handleUIEvent = useCallback((event: UIEvent) => {
    setActiveAlert(event);

    if (event.type === "SYMPTOM_FLAGGED" || event.type === "TRIGGER_DOCTOR_CALL" || event.type === "TRIGGER_AMBULANCE") {
      setLastSeverity(event.severity);
    }
    if (event.type === "DOCTOR_CALLED" || event.type === "AMBULANCE_REQUESTED") {
      setLastSeverity("critical");
    }
  }, []);

  // ─── Text chat send ──────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (text?: string) => {
    const content = (text ?? inputText).trim();
    if (!content || isSending) return;

    setInputText("");
    setIsSending(true);

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);

    try {
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/mother/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          patient_id: patientId,
          session_id: sessionId,
        }),
      });

      if (!res.ok) throw new Error("Chat service unavailable");

      const data = await res.json();
      const { reply, severity, ui_event } = data;

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: reply,
        timestamp: new Date(),
        severity: severity as Severity,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (severity && severity !== "low") {
        setLastSeverity(severity as Severity);
      }

      if (ui_event) {
        handleUIEvent(ui_event as UIEvent);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "I'm having trouble connecting right now, mama. Please try again in a moment. If this is an emergency, call your clinic directly.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }, [inputText, isSending, messages, patientId, sessionId, handleUIEvent]);

  // ─── Voice: audio level analyser ────────────────────────────────────────────

  const startAudioAnalysis = useCallback((stream: MediaStream) => {
    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    const buffer = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(buffer);
      const avg = buffer.reduce((a, b) => a + b, 0) / buffer.length;
      setAudioLevel(Math.min(avg / 40, 1));
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
  }, []);

  // ─── Voice: cleanup ──────────────────────────────────────────────────────────

  const cleanupVoice = useCallback(() => {
    if (voicePollRef.current) { clearInterval(voicePollRef.current); voicePollRef.current = null; }
    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    setAudioLevel(0);
    voiceSessionIdRef.current = null;
  }, []);

  // ─── Voice: poll UI events ───────────────────────────────────────────────────

  const startVoicePoll = useCallback((sid: string) => {
    voicePollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/mother/voice/ui-events?session_id=${sid}`);
        if (!res.ok) return;
        const { event } = await res.json();
        if (event) handleUIEvent(event as UIEvent);
      } catch { /* silent */ }
    }, 800);
  }, [handleUIEvent]);

  // ─── Voice: connect ──────────────────────────────────────────────────────────

  const startVoiceSession = useCallback(async () => {
    setVoiceStatus("connecting");
    setVoiceError("");

    try {
      const sessionRes = await fetch("/api/mother/voice/session", { method: "POST" });
      if (!sessionRes.ok) {
        const err = await sessionRes.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to start voice session");
      }
      const { session_id, ice_config } = await sessionRes.json();
      voiceSessionIdRef.current = session_id;

      const pc = new RTCPeerConnection(ice_config);
      pcRef.current = pc;

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          setVoiceStatus("connected");
          startVoicePoll(session_id);
        }
        if (pc.connectionState === "failed" || pc.connectionState === "closed") {
          cleanupVoice();
          setVoiceStatus("idle");
        }
      };

      pc.ontrack = (ev) => {
        const audio = document.getElementById("nurture-ai-audio") as HTMLAudioElement | null;
        if (audio && ev.streams[0]) {
          audio.srcObject = ev.streams[0];
          audio.play().catch(() => {});
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      startAudioAnalysis(stream);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (pc.iceGatheringState !== "complete") {
        await new Promise<void>((resolve) => {
          const t = setTimeout(resolve, 5000);
          pc.onicegatheringstatechange = () => {
            if (pc.iceGatheringState === "complete") { clearTimeout(t); resolve(); }
          };
        });
      }

      const { sdp, type } = pc.localDescription!;
      const offerRes = await fetch(`/api/mother/voice/session/${session_id}/offer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sdp, type }),
      });

      if (!offerRes.ok) throw new Error("SDP exchange failed");

      const answer = await offerRes.json();
      await pc.setRemoteDescription({ sdp: answer.sdp, type: "answer" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Connection failed";
      setVoiceError(msg);
      setVoiceStatus("error");
      cleanupVoice();
    }
  }, [startAudioAnalysis, startVoicePoll, cleanupVoice]);

  const endVoiceSession = useCallback(() => {
    cleanupVoice();
    setVoiceStatus("idle");
  }, [cleanupVoice]);

  // ─── Ambulance / Doctor quick actions ────────────────────────────────────────

  const requestAmbulance = useCallback(async () => {
    const address = prompt("Please enter your current address or nearest landmark:");
    if (!address) return;
    const res = await fetch("/api/mother/emergency", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "request_ambulance",
        patient_id: patientId,
        address,
        symptoms: "Emergency — requested from app",
      }),
    });
    const event = await res.json();
    handleUIEvent(event as UIEvent);
  }, [patientId, handleUIEvent]);

  const callDoctor = useCallback(async () => {
    const res = await fetch("/api/mother/emergency", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "call_doctor", patient_id: patientId }),
    });
    const event = await res.json();
    handleUIEvent(event as UIEvent);
  }, [patientId, handleUIEvent]);

  // ─── Cleanup on unmount ──────────────────────────────────────────────────────

  useEffect(() => () => cleanupVoice(), [cleanupVoice]);

  // ─── Derived ──────────────────────────────────────────────────────────────────

  const isVoiceLive = voiceStatus === "connected";
  const isVoiceConnecting = voiceStatus === "connecting";
  const sevConfig = SEVERITY_CONFIG[lastSeverity];

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full max-h-[780px] rounded-2xl border border-outline-variant bg-surface shadow-lg overflow-hidden">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-pink-600 to-rose-500 text-white">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src="/site logo.png"
              alt="Nurture Logo"
              className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
              style={{ borderRadius: "50%" }}
            />
            {isVoiceLive && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-white" />
            )}
          </div>
          <div>
            <div className="font-bold text-sm leading-tight">Nurture AI</div>
            <div className="text-xs text-white/80 leading-tight">
              {isVoiceLive ? "Voice — Listening…" : "Your pregnancy companion"}
            </div>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-1 bg-white/20 rounded-lg p-1">
          <button
            onClick={() => setMode("text")}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${
              mode === "text" ? "bg-white text-rose-600" : "text-white/80 hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">message</span>
            Chat
          </button>
          <button
            onClick={() => setMode("voice")}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${
              mode === "voice" ? "bg-white text-rose-600" : "text-white/80 hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">mic</span>
            Voice
          </button>
        </div>
      </div>

      {/* ── Severity / Alert banner ────────────────────────────────────── */}
      {activeAlert && (
        <div className={`px-4 py-3 border-b ${sevConfig.bg} ${sevConfig.border} flex items-start justify-between gap-3`}>
          <div className="flex items-start gap-2">
            <span className={`material-symbols-outlined text-[20px] mt-0.5 ${sevConfig.color}`}>
              {sevConfig.icon}
            </span>
            <div>
              {activeAlert.type === "DOCTOR_CALLED" && (
                <>
                  <div className={`text-xs font-bold ${sevConfig.color}`}>Doctor Alerted</div>
                  <div className="text-xs text-on-surface">
                    Dr. {activeAlert.doctor_name} has been notified.{" "}
                    <a href={`tel:${activeAlert.doctor_phone}`} className="font-bold underline">
                      Call: {activeAlert.doctor_phone}
                    </a>
                  </div>
                </>
              )}
              {activeAlert.type === "AMBULANCE_REQUESTED" && (
                <>
                  <div className="text-xs font-bold text-red-700">🚨 Ambulance Requested</div>
                  <div className="text-xs text-on-surface">
                    Help is on the way to: <span className="font-semibold">{activeAlert.address}</span>
                  </div>
                </>
              )}
              {activeAlert.type === "SHOW_APPOINTMENT" && (
                <>
                  <div className={`text-xs font-bold ${sevConfig.color}`}>Next Appointment</div>
                  <div className="text-xs text-on-surface">
                    {String((activeAlert.appointment as Record<string, unknown>).scheduled_at ?? "")}
                  </div>
                </>
              )}
              {activeAlert.type === "DOCTOR_UNAVAILABLE" && (
                <>
                  <div className="text-xs font-bold text-amber-700">No Doctor On Duty</div>
                  <div className="text-xs text-on-surface">
                    Please call your clinic's emergency line directly.
                  </div>
                </>
              )}
              {(activeAlert.type === "SYMPTOM_FLAGGED" || activeAlert.type === "TRIGGER_DOCTOR_CALL" || activeAlert.type === "TRIGGER_AMBULANCE") && (
                <>
                  <div className={`text-xs font-bold ${sevConfig.color}`}>{sevConfig.label}</div>
                  <div className="text-xs text-on-surface">
                    {activeAlert.symptoms?.join(", ")}
                  </div>
                </>
              )}
            </div>
          </div>
          <button onClick={() => setActiveAlert(null)} className="text-on-surface-variant hover:text-on-surface mt-0.5">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* ── TEXT MODE ─────────────────────────────────────────────────── */}
      {mode === "text" && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-surface-container-low">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              const msgSev = msg.severity ? SEVERITY_CONFIG[msg.severity] : null;
              return (
                <div key={msg.id} className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                  {/* Avatar */}
                  <div
                    className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      isUser
                        ? "bg-rose-100 text-rose-700"
                        : "bg-gradient-to-br from-pink-500 to-rose-500 text-white"
                    }`}
                  >
                    {isUser ? (patientName?.[0]?.toUpperCase() ?? "M") : "N"}
                  </div>

                  {/* Bubble */}
                  <div className={`max-w-[78%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                        isUser
                          ? "bg-rose-500 text-white rounded-tr-sm"
                          : msgSev && msg.severity !== "low"
                          ? `${msgSev.bg} ${msgSev.border} border ${msgSev.color} rounded-tl-sm`
                          : "bg-surface text-on-surface rounded-tl-sm border border-outline-variant"
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-on-surface-variant px-1">
                      {msg.timestamp.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {isSending && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-xs text-white font-bold">N</div>
                <div className="bg-surface border border-outline-variant rounded-2xl rounded-tl-sm px-4 py-3">
                  <span className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompts */}
          <div className="px-4 py-2 border-t border-outline-variant bg-surface overflow-x-auto">
            <div className="flex gap-2 w-max">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => sendMessage(p.text)}
                  disabled={isSending}
                  className="flex-shrink-0 text-[11px] border border-outline-variant rounded-full px-3 py-1 text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors disabled:opacity-40 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">{p.icon}</span>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="px-4 pb-4 pt-2 bg-surface border-t border-outline-variant">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Tell me how you're feeling, mama…"
                rows={1}
                className="flex-1 resize-none rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent leading-relaxed"
                style={{ maxHeight: 120, overflowY: "auto" }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!inputText.trim() || isSending}
                className="flex-shrink-0 w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── VOICE MODE ─────────────────────────────────────────────────── */}
      {mode === "voice" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6 py-8 bg-gradient-to-b from-rose-50 to-white">

          {/* Animated orb */}
          <div className="relative flex items-center justify-center">
            {isVoiceLive && (
              <>
                <div
                  className="absolute rounded-full bg-rose-200"
                  style={{
                    width: 160,
                    height: 160,
                    transform: `scale(${1 + audioLevel * 0.5})`,
                    transition: "transform 0.1s ease",
                    opacity: 0.4,
                  }}
                />
                <div
                  className="absolute rounded-full bg-rose-300"
                  style={{
                    width: 120,
                    height: 120,
                    transform: `scale(${1 + audioLevel * 0.35})`,
                    transition: "transform 0.12s ease",
                    opacity: 0.5,
                  }}
                />
              </>
            )}
            <div
              className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-lg transition-all duration-300 ${
                isVoiceLive
                  ? "bg-gradient-to-br from-pink-500 to-rose-600 shadow-rose-300"
                  : isVoiceConnecting
                  ? "bg-amber-100 shadow-amber-200"
                  : "bg-surface-container border-2 border-outline-variant"
              }`}
            >
              {isVoiceLive ? (
                <span className="material-symbols-outlined text-white text-[40px]">mic</span>
              ) : isVoiceConnecting ? (
                <span className="material-symbols-outlined animate-spin text-amber-700 text-[40px]">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-on-surface text-[40px]">pregnant_woman</span>
              )}
            </div>
          </div>

          {/* Status text */}
          <div className="text-center space-y-1">
            <div className="font-semibold text-on-surface text-base">
              {isVoiceLive
                ? "Nurture AI is listening…"
                : isVoiceConnecting
                ? "Connecting, please wait…"
                : voiceStatus === "error"
                ? "Connection failed"
                : "Talk to Nurture AI"}
            </div>
            <div className="text-sm text-on-surface-variant">
              {isVoiceLive
                ? "Speak naturally — describe how you're feeling"
                : isVoiceConnecting
                ? "Setting up your voice session"
                : voiceStatus === "error"
                ? voiceError
                : "Press the button below to start your voice session"}
            </div>
          </div>

          {/* Connect / Disconnect button */}
          {voiceStatus === "idle" || voiceStatus === "error" ? (
            <button
              onClick={startVoiceSession}
              className="flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-sm shadow-lg hover:shadow-rose-300 hover:brightness-110 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">mic</span>
              Start Voice Session
            </button>
          ) : isVoiceConnecting ? (
            <button
              disabled
              className="flex items-center gap-2 px-8 py-3 rounded-full bg-amber-100 text-amber-700 font-bold text-sm"
            >
              <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
              Connecting…
            </button>
          ) : (
            <button
              onClick={endVoiceSession}
              className="flex items-center gap-2 px-8 py-3 rounded-full bg-red-500 text-white font-bold text-sm shadow-lg hover:bg-red-600 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">call_end</span>
              End Session
            </button>
          )}

          {/* Quick voice hints */}
          <div className="w-full">
            <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-center mb-3">
              You can say…
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                "I have a headache and blurry vision",
                "When is my next appointment?",
                "My baby hasn't moved today",
                "I need to speak to a doctor",
                "I have heavy bleeding",
                "What foods should I eat?",
              ].map((hint) => (
                <div
                  key={hint}
                  className="text-[11px] text-center text-on-surface-variant border border-outline-variant rounded-lg px-2 py-1.5 bg-surface"
                >
                  &ldquo;{hint}&rdquo;
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Emergency action bar (always visible) ─────────────────────── */}
      <div className="grid grid-cols-2 border-t border-outline-variant">
        <button
          onClick={callDoctor}
          className="flex items-center justify-center gap-2 py-3 text-xs font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 transition-colors border-r border-outline-variant"
        >
          <span className="material-symbols-outlined text-[16px]">local_hospital</span>
          Call Doctor
        </button>
        <button
          onClick={requestAmbulance}
          className="flex items-center justify-center gap-2 py-3 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">emergency</span>
          Ambulance
        </button>
      </div>

      {/* Hidden audio element for voice output */}
      <audio id="nurture-ai-audio" autoPlay playsInline className="hidden" />
    </div>
  );
}
