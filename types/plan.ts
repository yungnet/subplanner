export interface Period {
  time: string;
  subject: string;
  activity: string;
  location: string;
}

export interface SubPlan {
  date: string;
  gradeLevel: string;
  room: string;
  attendance: string;
  classroomRules: string[];
  periods: Period[];
  studentsToWatch: string;
  endOfDayInstructions: string;
  specialNotes: string;
  subFeedbackPrompt: string;
}

// ── AI worksheet types ────────────────────────────────────────────────────────

export interface DetectedMaterial {
  id: string;
  subject: string;
  title: string;
  description: string;
}

export type WorksheetType = "math" | "reading" | "other";

export interface WorksheetQuestion {
  number: number;
  question: string;
  answerLines: number;
}

export interface GeneratedWorksheet {
  materialId: string;
  subject: string;
  title: string;
  type: WorksheetType;
  instructions: string;
  questions: WorksheetQuestion[];
}
