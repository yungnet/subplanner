import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { DetectedMaterial, WorksheetType } from "@/types/plan";

interface WorksheetRequest {
  material: DetectedMaterial;
  gradeLevel: string;
  curriculumNotes: string;
}

function detectType(subject: string): WorksheetType {
  const s = subject.toLowerCase();
  if (s.includes("math") || s.includes("numeracy")) return "math";
  if (
    s.includes("reading") ||
    s.includes("english") ||
    s.includes("language") ||
    s.includes("literacy") ||
    s.includes("writing") ||
    s.includes("ela")
  )
    return "reading";
  return "other";
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "API_NOT_CONFIGURED" }, { status: 503 });
  }

  const body: WorksheetRequest = await req.json();
  const { material, gradeLevel, curriculumNotes } = body;
  const type = detectType(material.subject);
  const client = new Anthropic();

  const typeGuide =
    type === "math"
      ? `Generate 12–15 numbered math problems appropriate for Grade ${gradeLevel}.
- Write each problem as the full expression or question (e.g. "345 ÷ 15 = ____" or "A rectangle is 8 cm wide and 6 cm long. What is the perimeter?").
- Set answerLines to 1 for simple one-step problems, 3 for multi-step or word problems.
- Vary difficulty slightly across the set (warm-up → challenge).`
      : type === "reading"
      ? `Generate 6–8 comprehension or writing questions appropriate for Grade ${gradeLevel}.
- Mix recall questions (1–2 answer lines), inference questions (2–3 lines), and one extended response (4 lines).
- Set answerLines accordingly.
- Questions should be answerable after reading a text or from prior knowledge of the topic.`
      : `Generate 8–10 short-answer or activity items appropriate for Grade ${gradeLevel}.
- Each item should be completable in 2–3 minutes.
- Set answerLines to 2–3 per item.
- Make activities clear enough that a substitute can explain them without subject knowledge.`;

  const prompt = `Create a classroom worksheet for printing.

Subject: ${material.subject}
Title: ${material.title}
What it should contain: ${material.description}
Grade: ${gradeLevel}
Curriculum context: ${curriculumNotes}

${typeGuide}

Return ONLY valid JSON — no markdown, no explanation:

{
  "subject": "${material.subject}",
  "title": "${material.title}",
  "type": "${type}",
  "instructions": "One or two sentences at the top of the worksheet telling students what to do.",
  "questions": [
    {
      "number": 1,
      "question": "Full question or problem text",
      "answerLines": 2
    }
  ]
}`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1800,
    system:
      "You generate printable classroom worksheets. Questions must be clear, grade-appropriate, and specific enough that a substitute teacher can hand them out with no explanation. Return only valid JSON.",
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    return NextResponse.json({ error: "UNEXPECTED_RESPONSE" }, { status: 500 });
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return NextResponse.json({ error: "PARSE_ERROR" }, { status: 500 });

  try {
    const ws = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ worksheet: { materialId: material.id, ...ws } });
  } catch {
    return NextResponse.json({ error: "PARSE_ERROR" }, { status: 500 });
  }
}
