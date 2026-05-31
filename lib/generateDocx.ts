import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  PageBreak,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { GeneratedWorksheet, SubPlan } from "@/types/plan";

// ── Page geometry (US Letter, 1-inch margins) ────────────────────────────────
const PAGE_W = 12240;
const PAGE_H = 15840;
const MARGIN = 1440; // 1 inch in TWIPs
const CONTENT_W = PAGE_W - MARGIN * 2; // 9360 TWIPs

// Column widths for schedule table — must sum to CONTENT_W (9360)
const SCHED_COLS = [1300, 1500, 5060, 1500];

// ── Helpers ──────────────────────────────────────────────────────────────────
const hp = (pt: number) => pt * 2; // points → half-points (docx font size unit)

const FONT = "Arial";
const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "auto" } as const;
const NO_BORDERS = { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER };

function run(text: string, opts: { bold?: boolean; italic?: boolean; size?: number; color?: string } = {}) {
  return new TextRun({ text, font: FONT, size: hp(opts.size ?? 11), bold: opts.bold, italics: opts.italic, color: opts.color });
}

function para(
  children: TextRun[],
  opts: { align?: (typeof AlignmentType)[keyof typeof AlignmentType]; spacingAfter?: number; spacingBefore?: number; borderBottom?: boolean; shading?: string } = {}
) {
  return new Paragraph({
    children,
    alignment: opts.align,
    spacing: { after: opts.spacingAfter ?? 120, before: opts.spacingBefore ?? 0 },
    ...(opts.borderBottom
      ? { border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "AAAAAA" } } }
      : {}),
    ...(opts.shading ? { shading: { type: ShadingType.CLEAR, fill: opts.shading } } : {}),
  });
}

const gap = (after = 160) => new Paragraph({ children: [], spacing: { after } });

const rule = () =>
  new Paragraph({
    children: [],
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "DDDDDD" } },
    spacing: { after: 180, before: 60 },
  });

function sectionHeading(text: string) {
  return new Paragraph({
    children: [run(text, { bold: true, size: 13, color: "3730A3" })],
    spacing: { after: 100, before: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "C7D2FE" } },
  });
}

function answerLine() {
  return new Paragraph({
    children: [run(" ")],
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "AAAAAA" } },
    spacing: { after: 160 },
  });
}

// ── Plan page ────────────────────────────────────────────────────────────────

function buildPlanPage(plan: SubPlan, formattedDate: string): (Paragraph | Table)[] {
  const items: (Paragraph | Table)[] = [];

  // ── Title banner
  items.push(
    new Paragraph({
      children: [run("SUBSTITUTE TEACHER PLAN", { bold: true, size: 18, color: "FFFFFF" })],
      alignment: AlignmentType.CENTER,
      shading: { type: ShadingType.CLEAR, fill: "4F46E5" },
      spacing: { after: 0, before: 160 },
    }),
    new Paragraph({
      children: [run("Please leave this form on the desk at the end of the day.", { size: 9, color: "C7D2FE", italic: true })],
      alignment: AlignmentType.CENTER,
      shading: { type: ShadingType.CLEAR, fill: "4F46E5" },
      spacing: { after: 200, before: 0 },
    })
  );

  // ── Info grid (2-col table)
  const infoRows: [string, string][] = [
    ["Teacher", "Mrs. Yung"],
    ["Date", formattedDate],
    ["Grade", plan.gradeLevel],
    ["Room", plan.room],
  ];
  const halfW = Math.floor(CONTENT_W / 2);
  items.push(gap(100));
  items.push(
    new Table({
      rows: [
        new TableRow({
          children: infoRows.slice(0, 2).map(([k, v]) =>
            new TableCell({
              children: [para([run(`${k}:  `, { bold: true }), run(v)])],
              width: { size: halfW, type: WidthType.DXA },
              borders: NO_BORDERS,
            })
          ),
        }),
        new TableRow({
          children: infoRows.slice(2, 4).map(([k, v]) =>
            new TableCell({
              children: [para([run(`${k}:  `, { bold: true }), run(v)])],
              width: { size: halfW, type: WidthType.DXA },
              borders: NO_BORDERS,
            })
          ),
        }),
      ],
      width: { size: CONTENT_W, type: WidthType.DXA },
      columnWidths: [halfW, halfW],
      borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER },
    })
  );

  // ── Attendance
  items.push(gap(120), rule(), sectionHeading("Attendance"));
  items.push(para([run(plan.attendance)], { spacingAfter: 80 }));

  // ── Schedule
  items.push(gap(120), rule(), sectionHeading("Daily Schedule"));
  items.push(buildScheduleTable(plan));

  // ── Classroom Rules
  if (plan.classroomRules.length > 0) {
    items.push(gap(120), rule(), sectionHeading("Classroom Rules"));
    plan.classroomRules.forEach((rule, i) => {
      items.push(para([run(`${i + 1}.  ${rule}`)], { spacingAfter: 80 }));
    });
  }

  // ── Students
  if (plan.studentsToWatch) {
    items.push(gap(120), rule(), sectionHeading("Students Needing Attention"));
    items.push(para([run(plan.studentsToWatch)], { spacingAfter: 80 }));
  }

  // ── End of day
  items.push(gap(120), rule(), sectionHeading("End of Day"));
  items.push(para([run(plan.endOfDayInstructions)], { spacingAfter: 80 }));

  // ── Notes
  if (plan.specialNotes) {
    items.push(gap(120), rule(), sectionHeading("Additional Notes"));
    items.push(para([run(plan.specialNotes)], { spacingAfter: 80 }));
  }

  // ── Feedback prompt (boxed)
  if (plan.subFeedbackPrompt) {
    items.push(gap(180));
    items.push(
      new Paragraph({
        children: [run(plan.subFeedbackPrompt, { italic: true, size: 10, color: "555555" })],
        spacing: { after: 160, before: 160 },
        border: {
          top: { style: BorderStyle.SINGLE, size: 8, color: "C7D2FE" },
          bottom: { style: BorderStyle.SINGLE, size: 8, color: "C7D2FE" },
          left: { style: BorderStyle.SINGLE, size: 24, color: "6366F1" },
          right: { style: BorderStyle.NONE, size: 0, color: "auto" },
        },
        shading: { type: ShadingType.CLEAR, fill: "F5F7FF" },
      })
    );
  }

  // ── Signature line
  items.push(gap(240));
  items.push(buildSignatureRow());

  return items;
}

function buildScheduleTable(plan: SubPlan): Table {
  const headerRow = new TableRow({
    tableHeader: true,
    children: (["Time", "Subject", "Activity", "Location"] as const).map((h, i) =>
      new TableCell({
        children: [para([run(h, { bold: true, size: 10 })], { spacingAfter: 80 })],
        width: { size: SCHED_COLS[i], type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, fill: "E0E7FF" },
      })
    ),
  });

  const dataRows = plan.periods.map((p, idx) =>
    new TableRow({
      children: [p.time, p.subject, p.activity, p.location].map((val, i) =>
        new TableCell({
          children: [para([run(val || "", { size: 10 })], { spacingAfter: 80 })],
          width: { size: SCHED_COLS[i], type: WidthType.DXA },
          shading: idx % 2 === 1 ? { type: ShadingType.CLEAR, fill: "F8F9FF" } : undefined,
        })
      ),
    })
  );

  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: SCHED_COLS,
  });
}

function buildSignatureRow(): Table {
  const colW = Math.floor((CONTENT_W - 400) / 2);
  const makeCell = (label: string) =>
    new TableCell({
      children: [
        new Paragraph({
          children: [run(label, { size: 9, color: "888888" })],
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "999999" } },
          spacing: { after: 0, before: 320 },
        }),
      ],
      width: { size: colW, type: WidthType.DXA },
      borders: NO_BORDERS,
    });

  return new Table({
    rows: [
      new TableRow({
        children: [
          makeCell("Substitute Signature"),
          new TableCell({
            children: [new Paragraph({ children: [] })],
            width: { size: 400, type: WidthType.DXA },
            borders: NO_BORDERS,
          }),
          makeCell("Date"),
        ],
      }),
    ],
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [colW, 400, colW],
    borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER },
  });
}

// ── Worksheet pages ──────────────────────────────────────────────────────────

function buildWorksheetPage(ws: GeneratedWorksheet, gradeLevel: string, formattedDate: string): (Paragraph | Table)[] {
  const items: (Paragraph | Table)[] = [];

  // Page break before each worksheet
  items.push(new Paragraph({ children: [new PageBreak()] }));

  // Title
  items.push(
    new Paragraph({
      children: [run(ws.title.toUpperCase(), { bold: true, size: 16 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [run(`${ws.subject}  ·  Grade: ${gradeLevel}`, { size: 10, color: "6B7280" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
    })
  );

  // Name / Date / Class header row
  items.push(buildNameDateRow(formattedDate));
  items.push(gap(200));

  // Instructions
  items.push(
    new Paragraph({
      children: [run(ws.instructions, { italic: true, size: 11 })],
      spacing: { after: 200 },
    }),
    rule()
  );

  // Questions
  ws.questions.forEach((q) => {
    items.push(
      new Paragraph({
        children: [run(`${q.number}.  `, { bold: true }), run(q.question)],
        spacing: { after: 100 },
      })
    );
    for (let i = 0; i < q.answerLines; i++) {
      items.push(answerLine());
    }
    items.push(gap(80));
  });

  // Footer
  items.push(
    gap(120),
    rule(),
    new Paragraph({
      children: [run("Please leave completed work on the teacher's desk.", { size: 9, color: "888888", italic: true })],
      alignment: AlignmentType.CENTER,
    })
  );

  return items;
}

function buildNameDateRow(formattedDate: string): Table {
  // Name ___________   Date: ___________   Class ___________
  const thirds = [3000, 400, 2560, 400, 3000];
  const makeField = (label: string, width: number) =>
    new TableCell({
      children: [
        new Paragraph({
          children: [run(label, { bold: true, size: 10 })],
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "888888" } },
          spacing: { after: 0, before: 80 },
        }),
      ],
      width: { size: width, type: WidthType.DXA },
      borders: NO_BORDERS,
    });
  const spacerCell = (width: number) =>
    new TableCell({
      children: [new Paragraph({ children: [] })],
      width: { size: width, type: WidthType.DXA },
      borders: NO_BORDERS,
    });

  return new Table({
    rows: [
      new TableRow({
        children: [
          makeField("Name:", thirds[0]),
          spacerCell(thirds[1]),
          makeField(`Date:  ${formattedDate}`, thirds[2]),
          spacerCell(thirds[3]),
          makeField("Class:", thirds[4]),
        ],
      }),
    ],
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: thirds,
    borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER },
  });
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function generateSubPackageDocx(
  plan: SubPlan,
  worksheets: GeneratedWorksheet[],
  formattedDate: string
): Promise<Blob> {
  const planContent = buildPlanPage(plan, formattedDate);
  const worksheetContent = worksheets.flatMap((ws) =>
    buildWorksheetPage(ws, plan.gradeLevel, formattedDate)
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_W, height: PAGE_H },
            margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
          },
        },
        children: [...planContent, ...worksheetContent],
      },
    ],
  });

  return Packer.toBlob(doc);
}
