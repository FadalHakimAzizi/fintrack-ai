// Groq chat-completions client with primary -> backup API-key fallback.
// Groq is OpenAI-compatible, so the same call shape works for chat + vision.
//
// Configure two keys so a rate/credit limit on one transparently falls back
// to the other:
//   GROQ_API_KEY          (primary)
//   GROQ_API_KEY_BACKUP   (backup)

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export const GROQ_TEXT_MODEL = (process.env.GROQ_MODEL || "llama-3.3-70b-versatile").trim();
// Llama 4 Scout is multimodal on Groq (accepts image_url content).
export const GROQ_VISION_MODEL = (
  process.env.GROQ_VISION_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct"
).trim();

// .trim() guards against a trailing \r (e.g. a key piped into `vercel env add`
// from PowerShell) — a CR in an Authorization header makes fetch() throw.
function groqKeys(): string[] {
  return [process.env.GROQ_API_KEY, process.env.GROQ_API_KEY_BACKUP]
    .map((k) => k?.trim())
    .filter((k): k is string => Boolean(k));
}

export interface GroqChatResult {
  ok: boolean;
  status: number; // last HTTP status (0 = network error)
  content: string; // assistant message content ("" if failed)
  keyUsed: number; // 1-based index of the key that succeeded (0 = none)
  error?: string;
}

interface GroqChatOptions {
  messages: unknown[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

// Statuses worth retrying on the next key: rate limit, payment/credit limit,
// forbidden (key limit), and transient server errors.
function shouldFallback(status: number) {
  return status === 429 || status === 402 || status === 403 || status >= 500;
}

export async function groqChat(opts: GroqChatOptions): Promise<GroqChatResult> {
  const keys = groqKeys();
  if (keys.length === 0) {
    return {
      ok: false,
      status: 500,
      content: "",
      keyUsed: 0,
      error: "GROQ_API_KEY tidak dikonfigurasi di server.",
    };
  }

  const body = JSON.stringify({
    model: opts.model || GROQ_TEXT_MODEL,
    messages: opts.messages,
    temperature: opts.temperature ?? 0.3,
    ...(opts.maxTokens ? { max_tokens: opts.maxTokens } : {}),
  });

  let lastStatus = 0;
  let lastError = "";

  for (let i = 0; i < keys.length; i++) {
    let res: Response;
    try {
      res = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${keys[i]}`,
          "Content-Type": "application/json",
        },
        body,
      });
    } catch (err) {
      // Network error — try the next key.
      lastStatus = 0;
      lastError = String(err);
      continue;
    }

    if (res.ok) {
      const json = await res.json();
      const content = json?.choices?.[0]?.message?.content || "";
      return { ok: true, status: 200, content, keyUsed: i + 1 };
    }

    lastStatus = res.status;
    lastError = (await res.text()).slice(0, 300);

    // A bad request (400/404 model, etc.) won't be fixed by another key.
    if (!shouldFallback(res.status)) break;
  }

  return {
    ok: false,
    status: lastStatus,
    content: "",
    keyUsed: 0,
    error: lastError || `Groq error ${lastStatus}`,
  };
}

// Streaming chat. Returns the first OK streaming Response (with key fallback on
// the initial connection only — once bytes flow we can't switch keys).
export async function groqChatStream(
  opts: GroqChatOptions,
): Promise<{ ok: boolean; status: number; response: Response | null; error?: string }> {
  const keys = groqKeys();
  if (keys.length === 0) {
    return { ok: false, status: 500, response: null, error: "GROQ_API_KEY tidak dikonfigurasi di server." };
  }
  const body = JSON.stringify({
    model: opts.model || GROQ_TEXT_MODEL,
    messages: opts.messages,
    temperature: opts.temperature ?? 0.3,
    stream: true,
    ...(opts.maxTokens ? { max_tokens: opts.maxTokens } : {}),
  });

  let lastStatus = 0;
  let lastError = "";
  for (let i = 0; i < keys.length; i++) {
    let res: Response;
    try {
      res = await fetch(GROQ_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${keys[i]}`, "Content-Type": "application/json" },
        body,
      });
    } catch (err) {
      lastStatus = 0;
      lastError = String(err);
      continue;
    }
    if (res.ok && res.body) return { ok: true, status: 200, response: res };
    lastStatus = res.status;
    lastError = (await res.text()).slice(0, 300);
    if (!shouldFallback(res.status)) break;
  }
  return { ok: false, status: lastStatus, response: null, error: lastError || `Groq error ${lastStatus}` };
}

const GROQ_TRANSCRIBE_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
export const GROQ_TRANSCRIBE_MODEL = (
  process.env.GROQ_TRANSCRIBE_MODEL || "whisper-large-v3-turbo"
).trim();

export interface GroqTranscribeResult {
  ok: boolean;
  status: number;
  text: string;
  error?: string;
}

// Speech-to-text via Groq Whisper. Same primary -> backup key fallback as chat.
export async function groqTranscribe(
  file: Blob,
  filename: string,
  opts?: { model?: string; language?: string },
): Promise<GroqTranscribeResult> {
  const keys = groqKeys();
  if (keys.length === 0) {
    return { ok: false, status: 500, text: "", error: "GROQ_API_KEY tidak dikonfigurasi di server." };
  }

  let lastStatus = 0;
  let lastError = "";

  for (let i = 0; i < keys.length; i++) {
    const form = new FormData();
    form.append("file", file, filename);
    form.append("model", opts?.model || GROQ_TRANSCRIBE_MODEL);
    form.append("response_format", "json");
    if (opts?.language) form.append("language", opts.language);

    let res: Response;
    try {
      res = await fetch(GROQ_TRANSCRIBE_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${keys[i]}` },
        body: form,
      });
    } catch (err) {
      lastStatus = 0;
      lastError = String(err);
      continue;
    }

    if (res.ok) {
      const json = await res.json();
      return { ok: true, status: 200, text: (json?.text as string) || "" };
    }

    lastStatus = res.status;
    lastError = (await res.text()).slice(0, 300);
    if (!shouldFallback(res.status)) break;
  }

  return { ok: false, status: lastStatus, text: "", error: lastError || `Groq error ${lastStatus}` };
}
