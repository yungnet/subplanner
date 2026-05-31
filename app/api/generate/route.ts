import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { AI_MODEL } from "@/lib/ai-model";

// Vercel Pro allows up to 300s; Hobby is capped at 10s but setting this
// prevents an immediate 5s default and signals intent on paid plans.
export const maxDuration = 60;

export interface GenerateRequest {
  curriculumNotes: string;
  gradeLevel: string;
  toneNotes: string;
}

export interface GenerateResponse {
  periods: { time: string; subject: string; activity: string; location: string }[];
  attendance: string;
  endOfDayInstructions: string;
  specialNotes: string;
}

export async function POST(req: NextRequest) {
  // ── API key guard ──────────────────────────────────────────────────────────
  // Add ANTHROPIC_API_KEY to .env.local to enable this feature.
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "API_NOT_CONFIGURED" }, { status: 503 });
  }

  const body: GenerateRequest = await req.json();

  if (!body.curriculumNotes?.trim()) {
    return NextResponse.json(
      { error: "MISSING_CURRICULUM_NOTES" },
      { status: 400 }
    );
  }

  const client = new Anthropic();

  const systemPrompt =
    "You are helping an elementary school teacher write a substitute teacher plan. Your job is to produce clear, simple, structured instructions that a substitute with no knowledge of this classroom can follow confidently. Use short sentences. Break every activity into numbered steps. Be explicit about timing, location of materials, and what the sub should do if students finish early. Assume nothing.";

  const prompt = `Grade: ${body.gradeLevel || "elementary"}. Teacher: Mrs. Yung. School: ECSD (Canadian classroom).

Today's curriculum and lesson context:
${body.curriculumNotes}
${body.toneNotes ? `\nTeacher style notes: ${body.toneNotes}` : ""}

Generate a detailed substitute teacher plan. Return ONLY valid JSON — no markdown, no explanation — in exactly this format:

{
  "periods": [
    {
      "time": "8:30 – 9:15 AM",
      "subject": "Math",
      "activity": "Numbered step-by-step instructions the substitute can follow. State where materials are, what students should do, and what to do if they finish early.",
      "location": "Classroom"
    }
  ],
  "attendance": "Step-by-step attendance instructions.",
  "endOfDayInstructions": "Numbered end-of-day routine steps.",
  "specialNotes": "Any reminders about schedule, allergies, or important classroom info."
}

Use Canadian English. Include 4–6 periods matching a typical school day.`;

  let message: Awaited<ReturnType<typeof client.messages.create>>;
  try {
    message = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error("[generate] Anthropic API error:", detail);
    return NextResponse.json({ error: "ANTHROPIC_ERROR", detail }, { status: 502 });
  }

  const content = message.content[0];
  if (content.type !== "text") {
    return NextResponse.json({ error: "UNEXPECTED_RESPONSE" }, { status: 500 });
  }

  // Extract JSON — Claude sometimes wraps it in a code fence even when asked not to
  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    const preview = content.text.slice(0, 300);
    console.error("[generate] No JSON in response. Raw:", preview);
    return NextResponse.json(
      { error: "PARSE_ERROR", detail: `No JSON found. Claude said: ${preview}` },
      { status: 500 }
    );
  }

  try {
    const generated: GenerateResponse = JSON.parse(jsonMatch[0]);
    return NextResponse.json(generated);
  } catch (err) {
    const preview = jsonMatch[0].slice(0, 300);
    console.error("[generate] JSON.parse failed:", err, "Raw match:", preview);
    return NextResponse.json(
      { error: "PARSE_ERROR", detail: `Invalid JSON. Raw: ${preview}` },
      { status: 500 }
    );
  }
}
