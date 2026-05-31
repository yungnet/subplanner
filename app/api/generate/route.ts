import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

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

  const message = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 1500,
    system: systemPrompt,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    return NextResponse.json({ error: "UNEXPECTED_RESPONSE" }, { status: 500 });
  }

  // Extract JSON — Claude sometimes wraps it in a code fence even when asked not to
  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: "PARSE_ERROR" }, { status: 500 });
  }

  try {
    const generated: GenerateResponse = JSON.parse(jsonMatch[0]);
    return NextResponse.json(generated);
  } catch {
    return NextResponse.json({ error: "PARSE_ERROR" }, { status: 500 });
  }
}
