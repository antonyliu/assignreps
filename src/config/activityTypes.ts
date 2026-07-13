export type ActivityType = "basketball" | "piano" | "martial_arts" | "tennis";

type ActivityConfig = {
  studentLabel: string;
  studentsLabel: string;
  groupLabel: string;
  verb: string;
  comingSoon?: true;
};

export const ACTIVITY_TYPES: Record<ActivityType, ActivityConfig> = {
  basketball: {
    studentLabel: "player",
    studentsLabel: "players",
    groupLabel: "roster",
    verb: "assign reps",
  },
  piano: {
    studentLabel: "student",
    studentsLabel: "students",
    groupLabel: "roster",
    verb: "assign practice",
    comingSoon: true,
  },
  martial_arts: {
    studentLabel: "student",
    studentsLabel: "students",
    groupLabel: "roster",
    verb: "assign drills",
    comingSoon: true,
  },
  tennis: {
    studentLabel: "player",
    studentsLabel: "players",
    groupLabel: "roster",
    verb: "assign drills",
    comingSoon: true,
  },
};

export function getActivityLabels(instructorType: string | null) {
  const key = (instructorType ?? "basketball") as ActivityType;
  return ACTIVITY_TYPES[key] ?? ACTIVITY_TYPES.basketball;
}
