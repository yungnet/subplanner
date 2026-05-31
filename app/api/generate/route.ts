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

  const prompt = `You are helping a ${body.gradeLevel || "elementary"} school teacher named Mrs. Yung prepare a substitute teacher plan for a Canadian classroom (ECSD).

Today's curriculum and lesson context:
${body.curriculumNotes}
${body.toneNotes ? `\nStyle/tone notes from the teacher: ${body.toneNotes}` : ""}

Generate a realistic, detailed substitute teacher plan. Return ONLY valid JSON — no markdown, no explanation, just the JSON object — in exactly this format:

{
  "periods": [
    {
      "time": "8:30 – 9:15 AM",
      "subject": "Math",
      "activity": "Step-by-step instructions the substitute can follow without subject expertise. Include page numbers, worksheet names, or specific tasks.",
      "location": "Classroom"
    }
  ],
  "attendance": "Clear instructions for how and when to take attendance.",
  "endOfDayInstructions": "Step-by-step end-of-day routine.",
  "specialNotes": "Any relevant reminders (e.g. early lunch, special schedule, allergies to be aware of)."
}

Guidelines:
- Write activity descriptions clearly enough that a non-specialist substitute can follow them confidently
- Use Canadian English spelling (e.g. "centre", "colour", "programme")
- Include 4–6 periods matching a typical school day
- Keep instructions practical and specific — avoid vague phrases like "continue with the lesson"`;

  const message = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 1500,
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
