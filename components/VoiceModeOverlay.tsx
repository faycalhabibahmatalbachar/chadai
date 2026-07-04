"use client";

import { useEffect, useRef, useState } from "react";
import { transcribeAudio, synthesizeSpeech } from "@/lib/voice-api";
import { getPreferences } from "@/lib/preferences-api";
import { Waveform, useMicLevels } from "./Waveform";
import { Logo } from "./Logo";

type Phase = "listening" | "processing" | "speaking" | "error";

// useMicLevels renvoie un plancher artificiel de 0.08 même en silence total
// (pour que les barres restent visibles à l'écran) — un seuil fixe se
// retrouvait donc quasi toujours au-dessus du bruit ambiant réel, empêchant
// l'arrêt automatique de se déclencher (bug réel : l'utilisateur devait
// cliquer "Terminer ma phrase" à chaque fois). On calibre désormais le bruit
// ambiant en tout début d'écoute, puis on exige un dépassement net de ce
// plancher pour considérer que l'utilisateur parle.
const CALIBRATION_MS = 350;
const SPEAKING_MARGIN = 0.13;
const SILENCE_MS_TO_STOP = 1100;
const MIN_RECORD_MS = 500;
const MAX_RECORD_MS = 20000; // garde-fou : ne jamais rester bloqué en écoute

// Découpe la réponse en phrases complètes dès qu'elles arrivent dans le flux,
// pour lancer la synthèse vocale phrase par phrase (temps réel) plutôt que
// d'attendre la réponse entière avant de commencer à parler.
const SENTENCE_END = /^([\s\S]*?[.!?…:])(\s+|$)/;

export function VoiceModeOverlay({
  onSend,
  onClose,
}: {
  /** Envoie le texte transcrit dans la conversation ; `onChunk` est appelé
   * pour chaque fragment de la réponse dès qu'il arrive (streaming), et la
   * promesse se résout avec le texte complet une fois le flux terminé. */
  onSend: (text: string, onChunk?: (chunk: string) => void) => Promise<string>;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("listening");
  const [caption, setCaption] = useState("");
  const [replyCaption, setReplyCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [voice, setVoice] = useState<string | undefined>(undefined);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const closedRef = useRef(false);
  const startedAtRef = useRef(0);
  const silenceSinceRef = useRef<number | null>(null);
  const hasSpokenRef = useRef(false);
  const noiseFloorRef = useRef(0.08);
  const calibrationSamplesRef = useRef<number[]>([]);

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

  // Calibration du bruit ambiant + détection de silence après prise de parole.
  useEffect(() => {
    if (phase !== "listening") return;
    const avg = levels.reduce((a, b) => a + b, 0) / levels.length;
    const elapsed = Date.now() - startedAtRef.current;

    if (elapsed < CALIBRATION_MS) {
      calibrationSamplesRef.current.push(avg);
      return;
    }
    if (calibrationSamplesRef.current.length && noiseFloorRef.current === 0.08) {
      const samples = calibrationSamplesRef.current;
      noiseFloorRef.current = samples.reduce((a, b) => a + b, 0) / samples.length;
    }

    const speakingThreshold = noiseFloorRef.current + SPEAKING_MARGIN;
    const isSpeaking = avg > speakingThreshold;

    if (isSpeaking) {
      hasSpokenRef.current = true;
      silenceSinceRef.current = null;
    } else if (hasSpokenRef.current) {
      if (silenceSinceRef.current === null) silenceSinceRef.current = Date.now();
      else if (
        elapsed > MIN_RECORD_MS &&
        Date.now() - silenceSinceRef.current > SILENCE_MS_TO_STOP &&
        chunksRef.current.length > 0
      ) {
        stopListening();
      }
    }

    if (elapsed > MAX_RECORD_MS && chunksRef.current.length > 0) {
      stopListening();
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
    setReplyCaption("");
    chunksRef.current = [];
    silenceSinceRef.current = null;
    hasSpokenRef.current = false;
    noiseFloorRef.current = 0.08;
    calibrationSamplesRef.current = [];
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

  /** Joue une file de segments audio (base64) dans l'ordre, en attendant que
   * chaque synthèse soit prête — mais celles-ci tournent en parallèle en
   * arrière-plan pendant que le segment précédent joue encore. */
  async function playQueueInOrder(
    queue: Promise<{ audio_base64: string; mime_type: string } | null>[],
  ) {
    for (const p of queue) {
      if (closedRef.current) return;
      const result = await p.catch(() => null);
      if (!result || closedRef.current) continue;
      await playAudio(result.audio_base64, result.mime_type);
    }
  }

  function playAudio(audioBase64: string, mimeType: string): Promise<void> {
    return new Promise((resolve) => {
      const audio = new Audio(`data:${mimeType};base64,${audioBase64}`);
      audioElRef.current = audio;
      audio.onended = () => resolve();
      audio.onerror = () => resolve();
      audio.play().catch(() => resolve());
    });
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

      // Synthèse phrase par phrase : dès qu'une phrase complète arrive dans
      // le flux, on lance sa synthèse vocale immédiatement en arrière-plan,
      // sans attendre la fin de la réponse — c'est ce qui rend la conversation
      // perceptiblement instantanée plutôt que d'attendre le texte entier.
      let buffer = "";
      let spokenAnything = false;
      let playbackPromise: Promise<void> | null = null;
      const audioQueue: Promise<{ audio_base64: string; mime_type: string } | null>[] = [];

      function flushSentence(sentence: string) {
        const trimmed = sentence.trim();
        if (!trimmed) return;
        spokenAnything = true;
        audioQueue.push(synthesizeSpeech(trimmed, voice).catch(() => null));
        if (audioQueue.length === 1) {
          setPhase("speaking");
          playbackPromise = playQueueInOrder(audioQueue);
        }
      }

      const reply = await onSend(text, (chunk) => {
        if (closedRef.current) return;
        setReplyCaption((prev) => prev + chunk);
        buffer += chunk;
        let match: RegExpExecArray | null;
        while ((match = SENTENCE_END.exec(buffer))) {
          flushSentence(match[1]);
          buffer = buffer.slice(match[0].length);
        }
      });
      if (closedRef.current) return;
      if (buffer.trim()) flushSentence(buffer);

      if (!reply.trim() && !spokenAnything) {
        startListening();
        return;
      }

      // playQueueInOrder consomme la file au fur et à mesure qu'elle se
      // remplit (même tableau référencé) ; on attend juste sa fin réelle
      // pour rouvrir le micro seulement une fois la dernière phrase jouée.
      if (playbackPromise) await playbackPromise;
      if (!closedRef.current) startListening();
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
      {caption && phase !== "speaking" && (
        <p className="max-w-md px-6 text-center text-sm text-[var(--text-secondary)]">
          « {caption} »
        </p>
      )}
      {phase === "speaking" && replyCaption && (
        <p className="max-w-md px-6 text-center text-sm text-[var(--text-secondary)]">
          {replyCaption}
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
