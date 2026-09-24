import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { CONFIRMATION_MESSAGE, roleFields, validateAnswers, type Answers } from "@/lib/intake/form";
import { buildSubmitTool, buildSystemPrompt } from "@/lib/intake/prompt";
import { dbConfigured, insertSubmission, type TranscriptMessage } from "@/lib/intake/db";
import { clientIp, rateLimit } from "@/lib/intake/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MODEL = "claude-sonnet-5";
const MAX_MESSAGES = 80; // total turns in one conversation
const MAX_CHARS = 2000; // per user message
const MAX_TOOL_ROUNDS = 3; // submit retries within one request

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

// Accepts two shapes:
//   { messages: [{role, content}] }  → chat agent (streams NDJSON)
//   { answers: {...} }              → plain accessible form fallback (JSON)
export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad("Invalid request body.");
  }

  if (body.answers !== undefined) {
    if (!rateLimit(`submit:${ip}`, 5, 60 * 60 * 1000)) {
      return bad("Too many submissions — please try again later.", 429);
    }
    return submitForm(body.answers);
  }

  if (!rateLimit(`chat:${ip}`, 40, 10 * 60 * 1000)) {
    return bad("You're sending messages too quickly — please wait a few minutes.", 429);
  }
  const parsed = parseMessages(body.messages);
  if (typeof parsed === "string") return bad(parsed);
  if (!process.env.ANTHROPIC_API_KEY) {
    return bad("The chat assistant isn't configured yet — please use the regular form.", 503);
  }
  return streamChat(parsed, ip);
}

async function submitForm(input: unknown) {
  const v = validateAnswers(input);
  if (!v.ok) return NextResponse.json({ ok: false, errors: v.errors }, { status: 422 });
  try {
    const id = await save(v.answers, null, "form");
    return NextResponse.json({ ok: true, id, message: CONFIRMATION_MESSAGE });
  } catch (e) {
    console.error("[intake] form insert failed:", e);
    return bad("We couldn't save your request. Please try again or call the studio.", 502);
  }
}

function save(answers: Answers, transcript: TranscriptMessage[] | null, source: "chat" | "form") {
  if (!dbConfigured()) throw new Error("Supabase not configured");
  return insertSubmission({ answers, transcript, source, ...roleFields(answers) });
}

function parseMessages(raw: unknown): TranscriptMessage[] | string {
  if (!Array.isArray(raw) || raw.length === 0) return "No messages.";
  if (raw.length > MAX_MESSAGES) {
    return "This conversation has gotten too long — please refresh to start over or use the regular form.";
  }
  const out: TranscriptMessage[] = [];
  for (const m of raw) {
    const role = m?.role;
    const content = typeof m?.content === "string" ? m.content.trim() : "";
    if ((role !== "user" && role !== "assistant") || !content) return "Invalid message.";
    if (role === "user" && content.length > MAX_CHARS) return `Please keep messages under ${MAX_CHARS} characters.`;
    out.push({ role, content: content.slice(0, 8000) });
  }
  if (out[0].role !== "user" || out[out.length - 1].role !== "user") return "Invalid conversation.";
  return out;
}

function streamChat(history: TranscriptMessage[], ip: string) {
  const client = new Anthropic();
  const today = new Date().toLocaleDateString("en-US", {
    timeZone: "America/Chicago",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const system = buildSystemPrompt(today);
  const tools = [buildSubmitTool()];
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));

      const messages: Anthropic.MessageParam[] = history.map((m) => ({ role: m.role, content: m.content }));
      let assistantText = "";

      try {
        for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
          const s = client.messages.stream({
            model: MODEL,
            max_tokens: 8000,
            output_config: { effort: "medium" },
            system,
            tools,
            messages,
          });
          for await (const ev of s) {
            if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") {
              assistantText += ev.delta.text;
              send({ type: "text", text: ev.delta.text });
            }
          }
          const msg = await s.finalMessage();

          if (msg.stop_reason === "refusal") {
            send({ type: "text", text: "Sorry — I can't help with that here. Let's get back to your party request!" });
            break;
          }
          const toolUse = msg.content.find(
            (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === "submit_intake"
          );
          if (msg.stop_reason !== "tool_use" || !toolUse) break;

          if (round === MAX_TOOL_ROUNDS || !rateLimit(`submit:${ip}`, 5, 60 * 60 * 1000)) {
            send({ type: "error", error: "Too many submission attempts — please try the regular form." });
            break;
          }

          const input = toolUse.input as { answers?: unknown };
          const v = validateAnswers(input?.answers);
          messages.push({ role: "assistant", content: msg.content });

          if (!v.ok) {
            messages.push({
              role: "user",
              content: [
                {
                  type: "tool_result",
                  tool_use_id: toolUse.id,
                  is_error: true,
                  content: `Not submitted. Fix these with the user, then re-confirm and resubmit:\n${v.errors
                    .map((e) => `- [${e.id}] ${e.label.split("\n")[0]}: ${e.message}`)
                    .join("\n")}`,
                },
              ],
            });
            if (assistantText && !assistantText.endsWith("\n")) {
              assistantText += "\n\n";
              send({ type: "text", text: "\n\n" });
            }
            continue;
          }

          const transcript: TranscriptMessage[] = [...history];
          if (assistantText.trim()) transcript.push({ role: "assistant", content: assistantText.trim() });
          transcript.push({ role: "assistant", content: CONFIRMATION_MESSAGE });
          try {
            const id = await save(v.answers, transcript, "chat");
            send({ type: "submitted", id, message: CONFIRMATION_MESSAGE });
          } catch (e) {
            console.error("[intake] chat insert failed:", e);
            send({
              type: "error",
              error: "We couldn't save your request just now. Please try again in a moment, or use the regular form.",
            });
          }
          break;
        }
      } catch (e) {
        if (e instanceof Anthropic.RateLimitError) {
          send({ type: "error", error: "The assistant is busy right now — please try again in a minute." });
        } else {
          console.error("[intake] Anthropic error:", e);
          send({ type: "error", error: "Something went wrong with the assistant. Please try again or use the regular form." });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
