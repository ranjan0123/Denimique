"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { MessageCircle, Mic, Paperclip, Send, Square, Volume2, X } from "lucide-react";

type ProductCard = {
  name: string;
  category?: string;
  priceINR?: number;
  mrpINR?: number;
  productPage?: string;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  products?: ProductCard[];
  speechLanguage?: string;
  attachmentName?: string;
};

type VoiceStatus = "idle" | "requesting" | "recording" | "transcribing";

const getSpeechLocale = (language: string | undefined, text: string): string => {
  const languageLocales: Record<string, string> = {
    ar: "ar-SA",
    bn: "bn-IN",
    de: "de-DE",
    en: "en-IN",
    es: "es-ES",
    fr: "fr-FR",
    gu: "gu-IN",
    hi: "hi-IN",
    it: "it-IT",
    ja: "ja-JP",
    kn: "kn-IN",
    ml: "ml-IN",
    mr: "mr-IN",
    pa: "pa-IN",
    ta: "ta-IN",
    te: "te-IN",
    ur: "ur-PK",
  };
  if (language && languageLocales[language.toLowerCase()]) {
    return languageLocales[language.toLowerCase()];
  }
  if (/[\u0900-\u097F]/.test(text)) return "hi-IN";
  if (/[\u0600-\u06FF]/.test(text)) return "ar-SA";
  if (/\b(mera|meri|hai|hain|kya|kitna|kitne|batao|bhai|nahi|kaise|aap|tum)\b/i.test(text)) {
    return "hi-IN";
  }
  return typeof navigator !== "undefined" && navigator.language
    ? navigator.language
    : "en-IN";
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);

export default function StoreChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I’m your Denimique style assistant. How can I help?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>("idle");
  const [error, setError] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => () => {
    const recorder = recorderRef.current;
    if (recorder?.state === "recording") {
      recorder.onstop = null;
      recorder.stop();
    }
    audioStreamRef.current?.getTracks().forEach((track) => track.stop());
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }, []);

  function speakReply(text: string, language?: string) {
    if (!("speechSynthesis" in window)) {
      setError("Spoken replies aren't supported in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getSpeechLocale(language, text);
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((candidate) => candidate.lang.toLowerCase() === utterance.lang.toLowerCase())
      || voices.find((candidate) => candidate.lang.slice(0, 2).toLowerCase() === utterance.lang.slice(0, 2).toLowerCase());
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  }

  async function submitMessage(content: string, voiceLanguage?: string, spokenInput = false, file: File | null = null) {
    const messageContent = content || (file ? "Please review the attached file and help me with it." : "");
    if ((!messageContent && !file) || loading) return;

    const nextMessages: Message[] = [...messages, { role: "user", content: messageContent, attachmentName: file?.name }];
    setMessages(nextMessages);
    setInput("");
    setAttachment(null);
    setError("");
    setLoading(true);
    try {
      let requestBody: BodyInit;
      const headers: Record<string, string> = {};
      if (file) {
        const formData = new FormData();
        formData.append("messages", JSON.stringify(nextMessages.slice(1).map(({ role, content: text }) => ({ role, content: text }))));
        formData.append("file", file);
        if (voiceLanguage) formData.append("voiceLanguage", voiceLanguage);
        requestBody = formData;
      } else {
        headers["Content-Type"] = "application/json";
        requestBody = JSON.stringify({ messages: nextMessages.slice(1), voiceLanguage });
      }
      const response = await fetch("/api/chat", { method: "POST", headers, body: requestBody });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Chat is temporarily unavailable.");
      const reply = typeof data.reply === "string" ? data.reply : "I couldn't prepare a reply. Please try again.";
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: reply,
          products: Array.isArray(data.products) ? data.products : [],
          speechLanguage: voiceLanguage || getSpeechLocale(undefined, messageContent),
        },
      ]);
      if (spokenInput) speakReply(reply, voiceLanguage);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitMessage(input.trim(), undefined, false, attachment);
  }

  function selectAttachment(file?: File) {
    if (!file) return;
    const allowedTypes = [".csv", ".json", ".txt"];
    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!allowedTypes.includes(extension)) {
      setError("Please attach a CSV, JSON, or TXT file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("The attachment must be 10 MB or smaller.");
      return;
    }
    setError("");
    setAttachment(file);
  }

  async function transcribeRecording(blob: Blob) {
    setVoiceStatus("transcribing");
    try {
      const extension = blob.type.includes("mp4") ? "m4a" : blob.type.includes("ogg") ? "ogg" : "webm";
      const formData = new FormData();
      formData.append("file", blob, `voice-message.${extension}`);
      const response = await fetch("/api/chat/transcribe", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Voice message could not be transcribed.");
      const transcript = typeof data.transcript === "string" ? data.transcript.trim() : "";
      if (!transcript) throw new Error("I couldn't hear any words. Please try again.");
      setInput(transcript);
      const language = typeof data.language === "string"
        ? data.language
        : /[\u0900-\u097F]/.test(transcript)
          ? "hi"
          : "en";
      await submitMessage(transcript, language, true);
    } catch (voiceError) {
      setError(voiceError instanceof Error ? voiceError.message : "Voice message could not be processed.");
    } finally {
      setVoiceStatus("idle");
    }
  }

  async function toggleRecording() {
    if (voiceStatus === "recording") {
      recorderRef.current?.stop();
      return;
    }
    if (voiceStatus !== "idle" || loading) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Voice input isn't supported in this browser. You can still type your message.");
      return;
    }

    setError("");
    setVoiceStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      audioChunksRef.current = [];
      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"]
        .find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        setError("Microphone recording failed. Please try again or type your message.");
        setVoiceStatus("idle");
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
        recorderRef.current = null;
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        audioChunksRef.current = [];
        if (!blob.size) {
          setVoiceStatus("idle");
          setError("I couldn't hear any words. Please try recording again.");
          return;
        }
        void transcribeRecording(blob);
      };
      recorder.start();
      setVoiceStatus("recording");
      window.setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, 30_000);
    } catch (microphoneError) {
      setVoiceStatus("idle");
      setError(microphoneError instanceof DOMException && microphoneError.name === "NotAllowedError"
        ? "Please allow microphone access to ask by voice."
        : "Couldn't start the microphone. Please try again or type your message.");
    }
  }

  function closeChat() {
    const recorder = recorderRef.current;
    if (recorder?.state === "recording") {
      recorder.onstop = null;
      recorder.stop();
      recorderRef.current = null;
      audioChunksRef.current = [];
    }
    audioStreamRef.current?.getTracks().forEach((track) => track.stop());
    audioStreamRef.current = null;
    window.speechSynthesis?.cancel();
    setVoiceStatus("idle");
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => (open ? closeChat() : setOpen(true))}
        aria-label={open ? "Close Denimique chat" : "Open Denimique chat"}
        aria-expanded={open}
        className="fixed left-0 top-1/2 z-[60] flex -translate-y-1/2 items-center gap-2 rounded-r-full bg-[#1B2E27] px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#29483c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B2E27]"
      >
        {open ? <X size={19} /> : <MessageCircle size={19} />}
        <span>{open ? "Close" : "Chat with us"}</span>
      </button>

      {open && (
        <section
          aria-label="Denimique shopping chat"
          className="fixed bottom-5 left-5 z-[60] flex h-[min(34rem,calc(100dvh-2.5rem))] w-[min(22rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-[#e8e1d8] bg-white shadow-2xl"
        >
          <header className="flex items-center justify-between bg-[#1B2E27] px-5 py-4 text-white">
            <div>
              <h2 className="font-semibold">Denimique Assistant</h2>
              <p className="mt-0.5 text-xs text-white/75">Here to help you find your style</p>
            </div>
            <button type="button" onClick={closeChat} aria-label="Close chat" className="rounded-full p-1 hover:bg-white/15">
              <X size={20} />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-[#faf9f6] p-4" aria-live="polite">
            {messages.map((message, index) => (
              <div key={`${index}-${message.role}`} className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}>
                <p className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${message.role === "user" ? "rounded-br-sm bg-[#1B2E27] text-white" : "rounded-bl-sm border border-[#eee8df] bg-white text-[#292720]"}`}>
                  {message.content}
                </p>
                {message.attachmentName && <span className="mt-1 max-w-[85%] truncate rounded-full bg-[#eee8df] px-2.5 py-1 text-xs text-[#514e47]">📎 {message.attachmentName}</span>}
                {message.role === "assistant" && (
                  <button
                    type="button"
                    onClick={() => speakReply(message.content, message.speechLanguage)}
                    aria-label="Listen to assistant reply"
                    title="Listen to reply"
                    className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-[#1B2E27] hover:bg-[#eee8df]"
                  >
                    <Volume2 size={14} /> Listen
                  </button>
                )}
                {message.products && message.products.length > 0 && (
                  <div className="mt-2 grid w-full gap-2">
                    {message.products.map((product, productIndex) => (
                      <article key={`${product.name}-${productIndex}`} className="rounded-xl border border-[#e8e1d8] bg-white p-3 shadow-sm">
                        <p className="text-sm font-semibold text-[#292720]">{product.name}</p>
                        {product.category && <p className="mt-0.5 text-xs text-[#716e66]">{product.category}</p>}
                        {typeof product.priceINR === "number" && (
                          <div className="mt-1 flex items-baseline gap-2">
                            <span className="text-sm font-semibold text-[#1B2E27]">{formatPrice(product.priceINR)}</span>
                            {typeof product.mrpINR === "number" && product.mrpINR > product.priceINR && (
                              <span className="text-xs text-[#716e66] line-through">{formatPrice(product.mrpINR)}</span>
                            )}
                          </div>
                        )}
                        {product.productPage && (
                          <a href={product.productPage} className="mt-2 inline-block text-xs font-semibold text-[#1B2E27] underline underline-offset-2">
                            View product
                          </a>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && <p className="text-sm text-[#716e66]">Thinking…</p>}
            {voiceStatus === "requesting" && <p className="text-sm text-[#716e66]">Starting microphone…</p>}
            {voiceStatus === "recording" && <p className="text-sm font-medium text-red-700">Listening… tap the mic to send.</p>}
            {voiceStatus === "transcribing" && <p className="text-sm text-[#716e66]">Understanding your voice…</p>}
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <div ref={endRef} />
          </div>

          {attachment && (
            <div className="flex items-center justify-between gap-2 border-t border-[#eee8df] bg-[#faf9f6] px-3 py-2 text-xs text-[#514e47]">
              <span className="truncate">📎 {attachment.name}</span>
              <button type="button" onClick={() => setAttachment(null)} aria-label="Remove attachment" className="rounded-full p-1 hover:bg-[#eee8df]"><X size={14} /></button>
            </div>
          )}
          <form onSubmit={sendMessage} className="flex gap-2 border-t border-[#eee8df] bg-white p-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json,.txt,text/csv,application/json,text/plain"
              className="hidden"
              onChange={(event) => {
                selectAttachment(event.target.files?.[0]);
                event.currentTarget.value = "";
              }}
            />
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={2000}
              placeholder="Ask us anything…"
              aria-label="Your message"
              className="min-w-0 flex-1 rounded-full border border-[#e5dfd6] px-4 py-2.5 text-sm outline-none focus:border-[#1B2E27]"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || voiceStatus !== "idle"}
              aria-label="Attach a CSV, JSON, or text file"
              title="Attach a CSV, JSON, or TXT file (up to 10 MB)"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e5dfd6] text-[#1B2E27] disabled:opacity-50"
            >
              <Paperclip size={17} />
            </button>
            <button
              type="button"
              onClick={() => void toggleRecording()}
              disabled={loading || voiceStatus === "requesting" || voiceStatus === "transcribing"}
              aria-label={voiceStatus === "recording" ? "Stop voice recording and send" : "Ask by voice"}
              title={voiceStatus === "recording" ? "Stop and send voice message" : "Ask by voice"}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-50 ${voiceStatus === "recording" ? "animate-pulse bg-red-700" : "bg-[#1B2E27]"}`}
            >
              {voiceStatus === "recording" ? <Square size={16} fill="currentColor" /> : <Mic size={17} />}
            </button>
            <button type="submit" disabled={(!input.trim() && !attachment) || loading || voiceStatus !== "idle"} aria-label="Send message" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1B2E27] text-white disabled:opacity-50">
              <Send size={17} />
            </button>
          </form>
        </section>
      )}
    </>
  );
}
