"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ConnectionStatus = "idle" | "connecting" | "connected" | "error";

type ToolFeedback = {
  id: string;
  toolName: string;
  label: string;
  message: string;
  success: boolean;
  timestamp: Date;
};

type TranscriptLine = {
  id: string;
  role: "user" | "agent";
  text: string;
  timestamp: Date;
};

export interface VoiceAssistantProps {
  onRefreshRequired: () => void;
  /** Called when Tolu navigates to a patient */
  onNavigateToPatient?: (patientId: string) => void;
  /** Currently active patient (so Tolu can reference it for risk explanation) */
  activePatientId?: string | null;
}

// ─── Tool label map ───────────────────────────────────────────────────────────

const TOOL_LABELS: Record<string, string> = {
  add_patient: "Registering patient",
  search_patient: "Searching records",
  log_visit: "Logging ANC visit",
  explain_patient_risk: "Analysing risk",
};

const TOOL_ICONS: Record<string, string> = {
  add_patient: "person_add",
  search_patient: "search",
  log_visit: "clinical_notes",
  explain_patient_risk: "psychology",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function VoiceAssistant({
  onRefreshRequired,
  onNavigateToPatient,
  activePatientId,
}: VoiceAssistantProps) {
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [toolFeedbacks, setToolFeedbacks] = useState<ToolFeedback[]>([]);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // ─── Audio level analyser ─────────────────────────────────────────────────

  const startAudioAnalysis = useCallback((stream: MediaStream) => {
    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;

    const buffer = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(buffer);
      const avg = buffer.reduce((a, b) => a + b, 0) / buffer.length;
      setAudioLevel(Math.min(avg / 40, 1));
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
  }, []);

  // ─── Cleanup function (extracted for stable reference) ────────────────────

  const cleanup = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    setAudioLevel(0);
    setActiveTool(null);
  }, []);

  // ─── UI event polling ─────────────────────────────────────────────────────

  const startPolling = useCallback(
    (sid: string) => {
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/voice/ui-events?session_id=${sid}`);
          if (!res.ok) return;
          const { event } = await res.json();
          if (!event) return;

          if (event.type === "NAVIGATE_TO_PATIENT" && event.patient_id) {
            if (event.refresh) onRefreshRequired();
            onNavigateToPatient?.(event.patient_id as string);
          }

          if (event.type === "SEARCH_QUERY") {
            onRefreshRequired();
          }
        } catch {
          /* silent */
        }
      }, 800);
    },
    [onRefreshRequired, onNavigateToPatient]
  );

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // ─── Connect ──────────────────────────────────────────────────────────────

  const startVoiceSession = async () => {
    try {
      setStatus("connecting");
      setErrorMessage("");
      setToolFeedbacks([]);
      setTranscript([]);

      // 1. Acquire session
      const sessionRes = await fetch("/api/voice/session", { method: "POST" });
      if (!sessionRes.ok) {
        const err = await sessionRes.json().catch(() => ({}));
        throw new Error(err.error || "Failed to acquire Aethex session");
      }
      const { session_id, ice_config } = await sessionRes.json();
      setSessionId(session_id);

      // 2. Set up RTCPeerConnection
      const pc = new RTCPeerConnection(ice_config);
      pcRef.current = pc;

      // Connection state
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          setStatus("connected");
          if (!isExpanded) setIsExpanded(true);
          startPolling(session_id);
        }
        // Only terminate on terminal states, not transient "disconnected"
        if (pc.connectionState === "failed" || pc.connectionState === "closed") {
          cleanup();
          setStatus("idle");
          onRefreshRequired();
        }
      };

      // Incoming audio (Tolu speaking)
      pc.ontrack = (ev) => {
        const audio = document.getElementById(
          "evans-voice-output"
        ) as HTMLAudioElement | null;
        if (audio && ev.streams[0]) {
          audio.srcObject = ev.streams[0];
          audio.play().catch(() => {
            // Autoplay policy — user must interact with page first
            console.warn("Audio autoplay blocked by browser policy");
          });
        }
      };

      // Data channel — receives transcript & tool events from Aethex
      pc.ondatachannel = (ev) => {
        const channel = ev.channel;
        channel.onmessage = (msg) => {
          try {
            const data = JSON.parse(msg.data);
            handleAethexEvent(data);
          } catch {
            /* not JSON */
          }
        };
      };

      // Mic input
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      startAudioAnalysis(stream);

      // SDP offer/answer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (pc.iceGatheringState !== "complete") {
        await new Promise<void>((resolve) => {
          const check = () => {
            if (pc.iceGatheringState === "complete") resolve();
          };
          pc.onicegatheringstatechange = check;
          setTimeout(resolve, 5000); // fallback timeout
        });
      }

      const { sdp, type } = pc.localDescription!;
      const offerRes = await fetch(`/api/voice/session/${session_id}/offer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sdp, type }),
      });

      if (!offerRes.ok) {
        throw new Error("SDP exchange failed");
      }

      const answer = await offerRes.json();
      await pc.setRemoteDescription({ sdp: answer.sdp, type: "answer" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Connection failed";
      setErrorMessage(message);
      setStatus("error");
      endVoiceSession();
    }
  };

  // ─── Handle Aethex data channel events ───────────────────────────────────

  const handleAethexEvent = useCallback(
    (data: Record<string, unknown>) => {
      // Transcript events
      if (data.type === "transcript" || data.type === "user_transcript") {
        const text = String(data.text ?? data.content ?? "");
        if (text) {
          setTranscript((prev) => [
            ...prev.slice(-50),
            {
              id: crypto.randomUUID(),
              role: "user",
              text,
              timestamp: new Date(),
            },
          ]);
        }
      }

      if (data.type === "agent_response" || data.type === "assistant_transcript") {
        const text = String(data.text ?? data.content ?? "");
        if (text) {
          setTranscript((prev) => [
            ...prev.slice(-50),
            {
              id: crypto.randomUUID(),
              role: "agent",
              text,
              timestamp: new Date(),
            },
          ]);
        }
      }

      // Tool invocation events
      if (data.type === "tool_call" || data.type === "function_call") {
        const toolName = String(data.name ?? data.tool_name ?? "");
        setActiveTool(toolName);
      }

      // Tool result events
      if (data.type === "tool_result" || data.type === "function_result") {
        const toolName = String(data.name ?? data.tool_name ?? "");
        const result = data.result as Record<string, unknown> | undefined;
        const success = Boolean(result?.success ?? true);
        const message = String(result?.message ?? "Done");

        setActiveTool(null);
        setToolFeedbacks((prev) => [
          {
            id: crypto.randomUUID(),
            toolName,
            label: TOOL_LABELS[toolName] ?? toolName,
            message,
            success,
            timestamp: new Date(),
          },
          ...prev.slice(0, 4),
        ]);

        // Handle UI navigation from result
        const uiEvent = result?.__ui_event as Record<string, unknown> | null;
        if (uiEvent?.type === "NAVIGATE_TO_PATIENT" && uiEvent.patient_id) {
          if (uiEvent.refresh) onRefreshRequired();
          onNavigateToPatient?.(uiEvent.patient_id as string);
        }
      }
    },
    [onRefreshRequired, onNavigateToPatient]
  );

  // ─── Disconnect ───────────────────────────────────────────────────────────

  const endVoiceSession = useCallback(() => {
    cleanup();
    setStatus("idle");
    onRefreshRequired();
  }, [cleanup, onRefreshRequired]);

  // ─── Auto-scroll transcript ───────────────────────────────────────────────

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  // ─── Cleanup on unmount ───────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      endVoiceSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Derived state ────────────────────────────────────────────────────────

  const isLive = status === "connected";
  const isConnecting = status === "connecting";
  const hasActivity = toolFeedbacks.length > 0 || transcript.length > 0;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-sm">
      {/* ── Header bar ─────────────────────────────────────────────────── */}
      <div
        className={`flex items-center justify-between gap-4 px-5 py-3.5 transition-colors duration-300 ${
          isLive
            ? "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
            : "bg-surface-container-low"
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Animated orb */}
          <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center">
            {isLive && (
              <>
                <div
                  className="absolute inset-0 rounded-full bg-primary/20"
                  style={{
                    transform: `scale(${1 + audioLevel * 0.6})`,
                    transition: "transform 0.1s ease",
                  }}
                />
                <div
                  className="absolute inset-1 rounded-full bg-primary/30"
                  style={{
                    transform: `scale(${1 + audioLevel * 0.3})`,
                    transition: "transform 0.15s ease",
                  }}
                />
              </>
            )}
            <div
              className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                isLive
                  ? "border-primary bg-primary text-on-primary"
                  : isConnecting
                  ? "border-amber-400 bg-amber-50 text-amber-600"
                  : status === "error"
                  ? "border-red-400 bg-red-50 text-red-600"
                  : "border-outline-variant bg-surface text-on-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">
                {isLive ? "mic" : isConnecting ? "hourglass_top" : "mic_off"}
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-on-surface">
                Tolu Voice Core
              </span>
              {isLive && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                  LIVE
                </span>
              )}
              {isConnecting && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                  <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-amber-500" />
                  CONNECTING
                </span>
              )}
            </div>
            <div className="text-xs text-on-surface-variant">
              {isLive
                ? activeTool
                  ? `Running: ${TOOL_LABELS[activeTool] ?? activeTool}…`
                  : "Listening — speak naturally"
                : isConnecting
                ? "Initialising WebRTC session…"
                : status === "error"
                ? errorMessage
                : "Hands-free patient data automation"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Expand/collapse toggle (only if there's content) */}
          {(isLive || hasActivity) && (
            <button
              onClick={() => setIsExpanded((v) => !v)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              <span className="material-symbols-outlined text-[14px]">
                {isExpanded ? "expand_less" : "expand_more"}
              </span>
            </button>
          )}

          {/* Connect / Disconnect */}
          {status === "idle" || status === "error" ? (
            <button
              onClick={startVoiceSession}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-on-primary hover:brightness-110 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[14px]">mic</span>
              Activate Tolu
            </button>
          ) : isConnecting ? (
            <button
              onClick={endVoiceSession}
              className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-4 py-1.5 text-xs font-bold text-amber-700"
              disabled
            >
              <span className="material-symbols-outlined animate-spin text-[14px]">
                progress_activity
              </span>
              Connecting…
            </button>
          ) : (
            <button
              onClick={endVoiceSession}
              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[14px]">
                call_end
              </span>
              Disconnect
            </button>
          )}
        </div>
      </div>

      {/* ── Expanded panel ──────────────────────────────────────────────── */}
      {isExpanded && (
        <div className="border-t border-outline-variant">
          <div className="grid grid-cols-1 divide-y divide-outline-variant md:grid-cols-2 md:divide-x md:divide-y-0">
            {/* Left: Tool activity feed */}
            <div className="p-4">
              <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                Actions
              </div>

              {activeTool && (
                <div className="mb-3 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
                  <span className="material-symbols-outlined animate-pulse text-[16px] text-primary">
                    {TOOL_ICONS[activeTool] ?? "settings"}
                  </span>
                  <span className="text-xs font-bold text-primary">
                    {TOOL_LABELS[activeTool] ?? activeTool}…
                  </span>
                </div>
              )}

              {toolFeedbacks.length === 0 && !activeTool ? (
                <div className="rounded-lg border border-dashed border-outline-variant p-4 text-center text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined mb-1 block text-xl">
                    voice_over_off
                  </span>
                  Tolu will show actions here as you speak
                </div>
              ) : (
                <div className="space-y-2">
                  {toolFeedbacks.map((fb) => (
                    <div
                      key={fb.id}
                      className={`rounded-lg border px-3 py-2 ${
                        fb.success
                          ? "border-green-200 bg-green-50"
                          : "border-red-200 bg-red-50"
                      }`}
                    >
                      <div className="mb-1 flex items-center gap-1.5">
                        <span
                          className={`material-symbols-outlined text-[14px] ${
                            fb.success ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {TOOL_ICONS[fb.toolName] ?? "check_circle"}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase ${
                            fb.success ? "text-green-700" : "text-red-700"
                          }`}
                        >
                          {fb.label}
                        </span>
                        <span className="ml-auto text-[10px] text-on-surface-variant">
                          {fb.timestamp.toLocaleTimeString("en-NG", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface">{fb.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Live transcript */}
            <div className="flex flex-col p-4">
              <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                Transcript
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto" style={{ maxHeight: 220 }}>
                {transcript.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-outline-variant p-4 text-center text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined mb-1 block text-xl">
                      chat_bubble_outline
                    </span>
                    Transcript appears here during the call
                  </div>
                ) : (
                  transcript.map((line) => (
                    <div
                      key={line.id}
                      className={`flex gap-2 ${
                        line.role === "agent" ? "flex-row" : "flex-row-reverse"
                      }`}
                    >
                      <div
                        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                          line.role === "agent"
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container-high text-on-surface"
                        }`}
                      >
                        {line.role === "agent" ? "E" : "Dr"}
                      </div>
                      <div
                        className={`max-w-[80%] rounded-lg px-2.5 py-1.5 text-xs leading-relaxed ${
                          line.role === "agent"
                            ? "bg-surface-container text-on-surface"
                            : "bg-primary/10 text-on-surface"
                        }`}
                      >
                        {line.text}
                      </div>
                    </div>
                  ))
                )}
                <div ref={transcriptEndRef} />
              </div>
            </div>
          </div>

          {/* Quick command hints */}
          {isLive && (
            <div className="border-t border-outline-variant bg-surface-container-low px-5 py-3">
              <div className="mb-2 text-[10px] font-bold uppercase text-on-surface-variant">
                Example commands
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  "What does Nurture do?",
                  "Add patient Adaeze, age 24, week 20",
                  "Find patient Amaka",
                  "Why was this patient flagged?",
                  "Log BP 130 over 85",
                ].map((cmd) => (
                  <span
                    key={cmd}
                    className="rounded-full border border-outline-variant bg-surface px-3 py-1 text-[11px] text-on-surface-variant"
                  >
                    &ldquo;{cmd}&rdquo;
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hidden audio element */}
      <audio id="evans-voice-output" autoPlay playsInline className="hidden" />
    </div>
  );
}