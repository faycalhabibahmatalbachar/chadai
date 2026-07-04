"use client";

import { useEffect, useRef, useState } from "react";
import { transcribeAudio, synthesizeSpeech } from "@/lib/voice-api";
import { getPreferences } from "@/lib/preferences-api";
import { Waveform, useMicLevels } from "./Waveform";
import { Logo } from "./Logo";

type Phase = "listening" | "processing" | "speaking" | "error";

const SILENCE_THRESHOLD = 0.1;
const SILENCE_MS_TO_STOP = 1500;
const MIN_RECORD_MS = 600;

export function VoiceModeOverlay({
  onSend,
  onClose,
}: {
  /** Envoie le texte transcrit dans la conversation et renvoie la réponse
   * complète de l'IA (attend la fin du streaming). */
  onSend: (text: string) => Promise<string>;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("listening");
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [voice, setVoice] = useState<string | undefined>(undefined);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const closedRef = useRef(false);
  const startedAtRef = useRef(0);
  const silenceSinceRef = useRef<number | null>(null);

  const listening = phase === "listening";
  const levels = useMicLevels(listening, 5);

  useEffect(() => {
    getPreferences()
      .then((p) => setVoice(p.tts_voice))
      .catch(() => {});
  }, []);

  useEffect(() => {
    closedRef.current = false;
    startListening();
    return () => {
      closedRef.current = true;
      stopRecorderTracks();
      audioElRef.current?.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Arrêt automatique après un silence, une fois qu'on a commencé à parler.
  useEffect(() => {
    if (phase !== "listening") return;
    const avg = levels.reduce((a, b) => a + b, 0) / levels.length;
    const elapsed = Date.now() - startedAtRef.current;
    if (avg < SILENCE_THRESHOLD) {
      if (silenceSinceRef.current === null) silenceSinceRef.current = Date.now();
      else if (
        elapsed > MIN_RECORD_MS &&
        Date.now() - silenceSinceRef.current > SILENCE_MS_TO_STOP &&
        chunksRef.current.length > 0
      ) {
        stopListening();
      }
    } else {
      silenceSinceRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levels, phase]);

  function stopRecorderTracks() {
    try {
      recorderRef.current?.stop();
    } catch {
      /* déjà arrêté */
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function startListening() {
    setError(null);
    setCaption("");
    chunksRef.current = [];
    silenceSinceRef.current = null;
    startedAtRef.current = Date.now();
    setPhase("listening");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => handleRecordingStopped();
      recorder.start();
    } catch {
      setError("Accès au microphone refusé.");
      setPhase("error");
    }
  }

  function stopListening() {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function handleRecordingStopped() {
    if (closedRef.current) return;
    if (!chunksRef.current.length) return;
    setPhase("processing");
    try {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const { text } = await transcribeAudio(blob);
      if (!text.trim()) {
        if (!closedRef.current) startListening();
        return;
      }
      setCaption(text);
      const reply = await onSend(text);
      if (closedRef.current) return;
      if (!reply.trim()) {
        startListening();
        return;
      }
      setPhase("speaking");
      const { audio_base64, mime_type } = await synthesizeSpeech(reply, voice);
      if (closedRef.current) return;
      const audio = new Audio(`data:${mime_type};base64,${audio_base64}`);
      audioElRef.current = audio;
      audio.onended = () => {
        if (!closedRef.current) startListening();
      };
      audio.onerror = () => {
        if (!closedRef.current) startListening();
      };
      await audio.play();
    } catch (err) {
      if (closedRef.current) return;
      setError(err instanceof Error ? err.message : "Erreur pendant la conversation vocale.");
      setPhase("error");
    }
  }

  function close() {
    closedRef.current = true;
    stopRecorderTracks();
    audioElRef.current?.pause();
    onClose();
  }

  const phaseLabel: Record<Phase, string> = {
    listening: "Je vous écoute…",
    processing: "Un instant…",
    speaking: "Toumaï AI répond…",
    error: "Erreur",
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--background)]">
      <button
        onClick={close}
        aria-label="Fermer le mode vocal"
        className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-white/5"
      >
        <CloseIcon />
      </button>

      <div className="mb-8">
        <Logo size={48} />
      </div>

      <div className="mb-6 flex h-16 items-center">
        {phase === "listening" && <Waveform active bars={7} height={56} color="var(--primary)" />}
        {phase === "processing" && (
          <div className="h-3 w-3 animate-pulse rounded-full" style={{ background: "var(--text-tertiary)" }} />
        )}
        {phase === "speaking" && <SpeakingWaves />}
        {phase === "error" && <span className="text-3xl">⚠️</span>}
      </div>

      <p className="mb-2 text-sm text-[var(--text-tertiary)]">{phaseLabel[phase]}</p>
      {caption && (
        <p className="max-w-md px-6 text-center text-sm text-[var(--text-secondary)]">
          « {caption} »
        </p>
      )}
      {error && <p className="mt-2 max-w-md px-6 text-center text-sm text-[var(--error)]">{error}</p>}

      {phase === "listening" && (
        <button
          onClick={stopListening}
          className="mt-8 rounded-full px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
          style={{ background: "var(--primary)" }}
        >
          Terminer ma phrase
        </button>
      )}
      {phase === "error" && (
        <button
          onClick={startListening}
          className="mt-6 rounded-full px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
          style={{ background: "var(--primary)" }}
        >
          Réessayer
        </button>
      )}
    </div>
  );
}

/** Petite animation de pulsation pendant la lecture audio — pas d'analyse
 * d'amplitude réelle ici (complexité de brancher un AnalyserNode sur un
 * élément <audio> data-URI n'apporterait pas grand-chose de plus). */
function SpeakingWaves() {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="w-1.5 rounded-full"
          style={{
            background: "var(--primary)",
            height: 40,
            animation: "typing-bounce 0.9s ease-in-out infinite",
            animationDelay: `${i * 0.12}s`,
          }}
        />
      ))}
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  );
}
