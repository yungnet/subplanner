import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { Period } from "@/types/plan";

interface DetectRequest {
  periods: Period[];
  attendance: string;
  endOfDayInstructions: string;
  specialNotes: string;
  curriculumNotes: string;
  gradeLevel: string;
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "API_NOT_CONFIGURED" }, { status: 503 });
  }

  const body: DetectRequest = await req.json();
  const client = new Anthropic();

  const periodSummary = body.periods
    .map((p) => `• ${p.time} — ${p.subject}: ${p.activity}`)
    .join("\n");

  const prompt = `A substitute teacher plan has been generated for a Grade ${body.gradeLevel} class. Identify any activities that require a physical worksheet or printed handout that the teacher would need to create and print — one that does not already exist as a commercial/standard resource.

Teacher's original description:
${body.curriculumNotes}

Generated schedule:
${periodSummary}

Notes: ${body.specialNotes}

Rules for what counts:
- INCLUDE: custom worksheets, activity sheets, graphic organisers, problem sets, recording sheets, writing frames — things the teacher would need to print specifically for this lesson
- EXCLUDE: textbooks, workbooks, commercially printed materials, digital resources, rulers, manipulatives, or anything a school would already stock

Return ONLY valid JSON. If nothing is needed, return { "materials": [] }.

{
  "materials": [
    {
      "id": "unique-lowercase-hyphen-id",
      "subject": "Math",
      "title": "Long Division Practice Worksheet",
      "description": "12–15 long division problems at Grade 5 level"
    }
  ]
}`;

  const message = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 600,
    system:
      "You are an assistant that reviews substitute teacher plans and identifies missing printed materials. Be concise. Only flag items the teacher genuinely needs to create. Return valid JSON only.",
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") return NextResponse.json({ materials: [] });

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return NextResponse.json({ materials: [] });

  try {
    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch {
    return NextResponse.json({ materials: [] });
  }
}
