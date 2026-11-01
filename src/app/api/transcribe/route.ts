import { transcribeAudio } from "@/lib/ai";
import { mapAiError } from "@/lib/http";
import { parseKeys } from "@/lib/failover";

// Transcription can take a while for longer clips.
export const maxDuration = 60;

const ALLOWED_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/vnd.wave",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/webm",
  "audio/ogg",
  "audio/aac",
  "audio/flac",
]);

const ALLOWED_EXTENSIONS = [
  ".mp3",
  ".wav",
  ".m4a",
  ".webm",
  ".ogg",
  ".aac",
  ".flac",
];

const MAX_BYTES = 25 * 1024 * 1024; // 25MB

function isValidAudio(file: File): boolean {
  const mime = (file.type || "").toLowerCase().split(";")[0].trim();
  if (ALLOWED_TYPES.has(mime) || mime.startsWith("audio/")) return true;
  const name = (file.name || "").toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

function normalizeMimeType(file: File): string {
  const mime = (file.type || "").toLowerCase().split(";")[0].trim();
  if (mime.includes("wav") || mime.includes("wave")) return "audio/wav";
  if (mime.includes("webm")) return "audio/webm";
  if (mime.includes("mp4") || mime.includes("m4a")) return "audio/mp4";
  if (mime.includes("mpeg") || mime.includes("mp3")) return "audio/mpeg";
  if (mime.includes("ogg")) return "audio/ogg";
  if (mime.includes("aac")) return "audio/aac";

  const name = file.name.toLowerCase();
  if (name.endsWith(".wav")) return "audio/wav";
  if (name.endsWith(".mp3")) return "audio/mpeg";
  if (name.endsWith(".m4a")) return "audio/mp4";
  if (name.endsWith(".webm")) return "audio/webm";

  return mime || "audio/wav";
}

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Expected multipart form data." }, { status: 400 });
  }

  const file = form.get("audio");
  if (!(file instanceof File)) {
    return Response.json({ error: "No audio file provided." }, { status: 400 });
  }
  if (file.size === 0) {
    return Response.json({ error: "The audio file is empty." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "Audio exceeds the 25MB limit." }, { status: 413 });
  }
  if (!isValidAudio(file)) {
    return Response.json(
      { error: `Unsupported audio type: ${file.type || "unknown"}. Use mp3, wav, m4a, or webm.` },
      { status: 415 },
    );
  }

  const language = (form.get("language") as string | null) || undefined;
  const keys = parseKeys(req.headers.get("x-groq-key"));
  const googleKeys = parseKeys(req.headers.get("x-google-key"));
  const normalizedMime = normalizeMimeType(file);

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = await transcribeAudio(bytes, {
      language,
      keys,
      googleKeys,
      mimeType: normalizedMime,
    });
    if (!result.text.trim()) {
      return Response.json(
        { error: "No speech was detected in the audio." },
        { status: 422 },
      );
    }
    return Response.json(result);
  } catch (err) {
    const isByok = keys.length > 0 || googleKeys.length > 0;
    return mapAiError(err, isByok);
  }
}
