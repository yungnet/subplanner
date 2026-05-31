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
