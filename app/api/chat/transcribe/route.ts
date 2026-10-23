import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_AUDIO_SIZE = 25 * 1024 * 1024;
const ALLOWED_AUDIO_TYPES = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/wav",
  "audio/mpeg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/mp4a-latm",
]);

export async function POST(request: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Voice chat is not configured yet. Please try again later." },
      { status: 503 },
    );
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Record a voice message first." }, { status: 400 });
    }
    if (!file.size || file.size > MAX_AUDIO_SIZE) {
      return NextResponse.json({ error: "Voice message must be under 25 MB." }, { status: 413 });
    }
    if (!ALLOWED_AUDIO_TYPES.has(file.type.split(";")[0].toLowerCase())) {
      return NextResponse.json({ error: "This audio format is not supported. Try recording again." }, { status: 415 });
    }

    const groqForm = new FormData();
    groqForm.set("file", file, file.name || "voice-message.webm");
    groqForm.set("model", "whisper-large-v3-turbo");
    groqForm.set("response_format", "verbose_json");
    groqForm.set("temperature", "0");

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: groqForm,
      signal: AbortSignal.timeout(30_000),
    });
    const data = await response.json();

    if (!response.ok) {
      const providerMessage = typeof data.error?.message === "string"
        ? data.error.message.slice(0, 400)
        : "No transcription details returned";
      console.error("Groq transcription failed:", response.status, providerMessage);
      return NextResponse.json(
        { error: response.status === 401
          ? "Voice service rejected the Groq API key. Check GROQ_API_KEY and restart the server."
          : response.status === 429
            ? "Voice service usage limit reached. Please try again later."
            : "I couldn't understand that recording. Please try speaking again." },
        { status: 502 },
      );
    }

    const transcript = typeof data.text === "string" ? data.text.trim() : "";
    if (!transcript) {
      return NextResponse.json({ error: "I couldn't hear any words. Please try again." }, { status: 422 });
    }

    const detectedLanguage = typeof data.language === "string" ? data.language.toLowerCase() : "";
    const languageNames: Record<string, string> = {
      arabic: "ar",
      bengali: "bn",
      english: "en",
      french: "fr",
      german: "de",
      gujarati: "gu",
      hindi: "hi",
      japanese: "ja",
      kannada: "kn",
      malayalam: "ml",
      marathi: "mr",
      punjabi: "pa",
      spanish: "es",
      tamil: "ta",
      telugu: "te",
      urdu: "ur",
    };
    const language = languageNames[detectedLanguage]
      || (/^[a-z]{2,3}$/.test(detectedLanguage) ? detectedLanguage : undefined);

    return NextResponse.json({ transcript, language });
  } catch (error) {
    console.error("Voice transcription error:", error);
    return NextResponse.json(
      { error: "Voice message could not be processed. Please try again." },
      { status: 502 },
    );
  }
}
