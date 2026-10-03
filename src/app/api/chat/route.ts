import { NextRequest, NextResponse } from "next/server";
import { getAnthropic, isChatConfigured, CHAT_SYSTEM_PROMPT } from "@/lib/anthropic";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 2000;

export async function POST(req: NextRequest) {
  if (!isChatConfigured) {
    return NextResponse.json({ error: "Chat is not configured." }, { status: 503 });
  }

  let body: { messages?: ChatMessage[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: "No messages provided" }, { status: 400 });
  }

  const messages = body.messages
    .slice(-MAX_MESSAGES)
    .filter(
      (m): m is ChatMessage =>
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.length > 0,
    )
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_LENGTH) }));

  if (messages.length === 0) {
    return NextResponse.json({ error: "No valid messages provided" }, { status: 400 });
  }

  try {
    const response = await getAnthropic().messages.create({
      model: "claude-sonnet-5",
      max_tokens: 500,
      system: CHAT_SYSTEM_PROMPT,
      messages,
    });

    const reply = response.content.find((block) => block.type === "text")?.text ?? "";
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Chat request failed", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
