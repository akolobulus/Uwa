"use client";

import { useState, useRef } from "react";

export default function VoiceAssistant({ onRefreshRequired }: { onRefreshRequired: () => void }) {
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [errorLog, setErrorLog] = useState("");
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startVoiceSession = async () => {
    try {
      setStatus("connecting");
      setErrorLog("");

      const res = await fetch("/api/voice/session", { method: "POST" });
      if (!res.ok) throw new Error("Could not acquire Aethex token stream");
      const { session_id, ice_config } = await res.json();

      const pc = new RTCPeerConnection(ice_config);
      pcRef.current = pc;

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") setStatus("connected");
        if (["failed", "closed"].includes(pc.connectionState)) endVoiceSession();
      };

      // Play returning speech response audio tracks from Evans
      pc.ontrack = (ev) => {
        const audio = document.getElementById("evans-voice-output") as HTMLAudioElement;
        if (audio) audio.srcObject = ev.streams[0];
      };

      // Request and attach mic inputs
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Handle ICE tracking completion
      if (pc.iceGatheringState !== "complete") {
        await new Promise<void>((resolve) => {
          pc.onicegatheringstatechange = () => {
            if (pc.iceGatheringState === "complete") resolve();
          };
        });
      }

      const { sdp, type } = pc.localDescription!;
      const answerRes = await fetch(`/api/voice/session/${session_id}/offer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sdp, type }),
      });

      if (!answerRes.ok) throw new Error("Sdp answer processing block failure");
      const answer = await answerRes.json();
      await pc.setRemoteDescription({ sdp: answer.sdp, type: "answer" });

    } catch (err: any) {
      setErrorLog(err.message);
      setStatus("error");
      endVoiceSession();
    }
  };

  const endVoiceSession = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    setStatus("idle");
    onRefreshRequired(); // Trigger parent grid pull to display any added/removed records instantly!
  };

  return (
    <div className="bg-surface p-4 border border-outline-variant rounded-xl flex items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${status === 'connected' ? 'bg-green-500 animate-pulse' : status === 'connecting' ? 'bg-amber-500 animate-bounce' : 'bg-gray-400'}`} />
        <div>
          <div className="text-sm font-bold text-on-surface">Evans Voice Core</div>
          <div className="text-xs text-on-surface-variant">
            {status === "connected" ? "Listening... Say 'Add patient Adaeze age 24 week 12'" : "Hands-free patient data automation"}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {status === "idle" || status === "error" ? (
          <button onClick={startVoiceSession} className="px-4 py-1.5 bg-primary text-on-primary text-xs font-bold rounded-lg hover:brightness-110">
            Activate Voice
          </button>
        ) : (
          <button onClick={endVoiceSession} className="px-4 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:brightness-110">
            Disconnect
          </button>
        )}
      </div>
      <audio id="evans-voice-output" autoPlay playsInline className="hidden" />
      {errorLog && <p className="text-xs text-red-600 absolute mt-12">{errorLog}</p>}
    </div>
  );
}