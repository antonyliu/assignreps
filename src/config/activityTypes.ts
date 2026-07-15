export type ActivityType =
  | "basketball"
  | "piano"
  | "martial_arts"
  | "tennis"
  | "golf"
  | "guitar"
  | "gymnastics"
  | "soccer"
  | "swimming"
  | "voice";

type ActivityConfig = {
  /** Display name + icon for the signup picker. */
  label: string;
  emoji: string;
  /** Whether an instructor can pick this discipline yet. */
  available: boolean;
  /** UI copy that branches on the coach's chosen discipline. */
  studentLabel: string;
  studentsLabel: string;
  groupLabel: string;
  verb: string;
};

export const ACTIVITY_TYPES: Record<ActivityType, ActivityConfig> = {
  basketball: {
    label: "Basketball",
    emoji: "🏀",
    available: true,
    studentLabel: "player",
    studentsLabel: "players",
    groupLabel: "roster",
    verb: "assign reps",
  },
  piano: {
    label: "Piano",
    emoji: "🎹",
    available: false,
    studentLabel: "student",
    studentsLabel: "students",
    groupLabel: "roster",
    verb: "assign practice",
  },
  martial_arts: {
    label: "Martial Arts",
    emoji: "🥋",
    available: false,
    studentLabel: "student",
    studentsLabel: "students",
    groupLabel: "roster",
    verb: "assign drills",
  },
  tennis: {
    label: "Tennis",
    emoji: "🎾",
    available: false,
    studentLabel: "player",
    studentsLabel: "players",
    groupLabel: "roster",
    verb: "assign drills",
  },
  golf: {
    label: "Golf",
    emoji: "⛳",
    available: false,
    studentLabel: "student",
    studentsLabel: "students",
    groupLabel: "roster",
    verb: "assign drills",
  },
  guitar: {
    label: "Guitar",
    emoji: "🎸",
    available: false,
    studentLabel: "student",
    studentsLabel: "students",
    groupLabel: "roster",
    verb: "assign practice",
  },
  gymnastics: {
    label: "Gymnastics",
    emoji: "🤸",
    available: false,
    studentLabel: "gymnast",
    studentsLabel: "gymnasts",
    groupLabel: "roster",
    verb: "assign drills",
  },
  soccer: {
    label: "Soccer",
    emoji: "⚽",
    available: false,
    studentLabel: "player",
    studentsLabel: "players",
    groupLabel: "roster",
    verb: "assign drills",
  },
  swimming: {
    label: "Swimming",
    emoji: "🏊",
    available: false,
    studentLabel: "swimmer",
    studentsLabel: "swimmers",
    groupLabel: "roster",
    verb: "assign sets",
  },
  voice: {
    label: "Voice/Vocal",
    emoji: "🎤",
    available: false,
    studentLabel: "student",
    studentsLabel: "students",
    groupLabel: "roster",
    verb: "assign practice",
  },
};

// Display order for the signup discipline picker.
export const ACTIVITY_TYPE_ORDER: ActivityType[] = [
  "basketball",
  "piano",
  "martial_arts",
  "tennis",
  "golf",
  "guitar",
  "gymnastics",
  "soccer",
  "swimming",
  "voice",
];

export function getActivityLabels(instructorType: string | null) {
  const key = (instructorType ?? "basketball") as ActivityType;
  return ACTIVITY_TYPES[key] ?? ACTIVITY_TYPES.basketball;
}
