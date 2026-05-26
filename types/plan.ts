export interface Period {
  time: string;
  subject: string;
  activity: string;
  location: string;
}

export interface SubPlan {
  teacherName: string;
  date: string;
  gradeLevel: string;
  room: string;
  emergencyContact: string;
  emergencyPhone: string;
  attendance: string;
  classroomRules: string[];
  periods: Period[];
  studentsToWatch: string;
  endOfDayInstructions: string;
  specialNotes: string;
  subFeedbackPrompt: string;
}
