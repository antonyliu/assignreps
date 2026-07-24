export type Unit = "reps" | "minutes" | "target";

// What an assignment's `target` measures.
//
//   reps        target = attempts. The original shape; every pre-existing
//               assignment reads as this.
//   makes       target = makes. "Make 50 free throws" — attempts may still be
//               recorded, but completion is counted in makes.
//   consecutive target = STREAK LENGTH, not a quantity. "Hit 5 in a row" stores
//               5, and the student logs sets completed (one row, amount 1) once
//               they manage it. ⚠️ Completion is therefore `>= 1 set`, NOT
//               `>= target` — summing against target would mean hitting the
//               streak five separate times. Every completion site special-cases
//               this; see isComplete().
export type GoalType = "reps" | "makes" | "consecutive";

export type Side = "left" | "right";

// Preset rows for the two non-default goals. A makes goal counts in makes, so
// the attempt-scaled category presets (25/50/100/200) are far too high to be
// useful; a streak is smaller still.
export const GOAL_PRESETS: Record<Exclude<GoalType, "reps">, number[]> = {
  makes: [10, 25, 50, 100],
  consecutive: [3, 5, 10],
};

// Exercises where a left/right choice is meaningless, by exact library name.
// Everything else — including custom exercises, which match nothing here —
// offers the Side row.
//
// Two groups: whole-body conditioning that has no side at all (suicides,
// sprints, jump rope, planks, isometric squats, pick-up ball), and free throws,
// which are taken from one fixed spot with the shooting hand.
const SIDELESS_EXERCISES = new Set([
  "Free throws",
  "Jump rope",
  "Planks",
  "Isometric squats",
  "Pick-up basketball",
  "Suicides",
  // The library name carries the qualifier; the spec's "Sprints" refers to this.
  "Sprints (baseline to baseline)",
]);

export function supportsSide(exerciseName: string): boolean {
  return !SIDELESS_EXERCISES.has(exerciseName);
}

// Categories where a makes or streak goal is meaningful — the shooting-type
// drills, where a rep is an attempt at a basket and can therefore go in or miss.
// Ball-handling, footwork and conditioning have no notion of a "make", so they
// keep the original attempts-only flow and never show the Goal selector.
//
// Same three keys LogScreen uses to decide the ATTEMPTS label, for the same
// underlying reason: a rep here is a shot.
const GOAL_CATEGORIES = new Set(["shooting", "finishing", "spot-shots"]);

// `categoryKey` is undefined for custom exercises and "mine" for saved ones —
// neither belongs to a category, so neither can be known to be a shooting drill
// and both fall through to attempts-only, matching defaultTrackMakes().
export function supportsGoalTypes(categoryKey?: string): boolean {
  return categoryKey !== undefined && GOAL_CATEGORIES.has(categoryKey);
}

// One completion rule for the whole app, so the six places that ask "is this
// done?" can't drift apart. `logged` is SUM(amount), `makes` is SUM(makes).
//
// ⚠️ consecutive ignores `target` deliberately — target holds the streak length,
// and one completed set finishes the assignment.
export function isComplete(
  goalType: GoalType,
  target: number,
  logged: number,
  makes: number,
): boolean {
  if (goalType === "consecutive") return logged >= 1;
  if (goalType === "makes") return makes >= target;
  return logged >= target;
}

// The measure that fills the progress bar, matching isComplete's denominator.
export function progressValue(goalType: GoalType, logged: number, makes: number): number {
  if (goalType === "consecutive") return Math.min(logged, 1);
  if (goalType === "makes") return makes;
  return logged;
}

// The denominator to show and divide by. Consecutive collapses to a single set.
export function progressTarget(goalType: GoalType, target: number): number {
  return goalType === "consecutive" ? 1 : target;
}

export type Exercise = {
  name: string
  default: number
  slug: string
  // Overrides the category's unit for this exercise only. Most exercises inherit
  // it; holds (planks, isometric squats) are timed even though they sit in a
  // reps category. Resolve as `ex.unit ?? cat.unit`.
  unit?: Unit
  // Overrides the category's preset row for this exercise only. Needed where one
  // category mixes scales — Conditioning runs suicides in the tens but planks in
  // single minutes. Resolve as `ex.quick ?? cat.quick`.
  // INVARIANT: `default` must appear in whichever array wins, or the count screen
  // opens with no preset selected and the target hidden.
  quick?: number[]
}

export type Category = {
  title: string
  hint: string
  unit: Unit
  quick: number[]
  exercises: Exercise[]
}

// Categories with no notion of a "make" at all. A suicide, a sprint, a plank, a
// pivot or a jump stop is either done or not — there is nothing to go in or miss
// — so the "Track makes?" toggle is meaningless for them and never renders.
//
// Distinct from GOAL_CATEGORIES above, and deliberately not its complement:
// ball-handling sits in neither, because a coach may reasonably score a timed
// dribbling drill by makes even though a makes GOAL doesn't parse for it.
const MAKELESS_CATEGORIES = new Set(["conditioning", "footwork"]);

// Whether to OFFER the "Track makes?" toggle. Only the two makeless categories
// withhold it. A custom exercise ("mine" or undefined) belongs to no category, so
// nothing is known about it — it keeps the toggle, which is the coach's only way
// to enable makes on their own drill.
//
// Note this is NOT `in CATEGORIES`: that test answers the default question below,
// not the visibility one, and using it here would silently strip the toggle from
// every custom exercise.
export function supportsMakes(categoryKey?: string): boolean {
  return categoryKey === undefined || !MAKELESS_CATEGORIES.has(categoryKey);
}

// Default for the "Track makes?" toggle: on for the preset categories where makes
// mean something, and the coach turns it off per assignment when a drill isn't
// scored that way. Custom exercises have no category to infer from and stay off,
// so the coach opts in explicitly via the toggle above.
//
// Conditioning and footwork default OFF because they can't be scored on makes;
// the toggle they'd default for isn't rendered for them either.
export function defaultTrackMakes(categoryKey?: string): boolean {
  return (
    categoryKey !== undefined &&
    categoryKey in CATEGORIES &&
    !MAKELESS_CATEGORIES.has(categoryKey)
  );
}

// The category an exercise belongs to, matched by name — assignments store
// `exercise_name` as free text, not a category key, so this is the only way back
// to the category once work has been assigned. Custom exercises match nothing
// and return undefined; callers must handle that.
export function categoryKeyForExercise(exerciseName: string): string | undefined {
  for (const [key, cat] of Object.entries(CATEGORIES)) {
    if (cat.exercises.some((e) => e.name === exerciseName)) return key;
  }
  return undefined;
}

// The count-screen preset buttons for a given exercise, found by matching the
// exercise name to its category. Honours a per-exercise `quick` override before
// falling back to the category's. Custom exercises (no category) return [] — the
// Edit-amount modal then falls back to the number input.
export function presetsForExercise(exerciseName: string): number[] {
  for (const cat of Object.values(CATEGORIES)) {
    const ex = cat.exercises.find((e) => e.name === exerciseName);
    if (ex) return ex.quick ?? cat.quick;
  }
  return [];
}

export const CATEGORIES: Record<string, Category> = {
  shooting: {
    title: "Shooting",
    hint: "Free throws, corner 3s, catch & shoot",
    unit: "reps",
    quick: [25, 50, 100, 200],
    exercises: [
      { name: "Form shooting",      default: 50,  slug: "form-shooting" },
      { name: "Free throws",        default: 50,  slug: "free-throws" },
      { name: "Mid-range jumpers",  default: 50,  slug: "mid-range-jumpers" },
      { name: "Corner 3s",          default: 25,  slug: "corner-3s" },
      { name: "Catch & shoot",      default: 50,  slug: "catch-and-shoot" },
      { name: "Elbow jumpers",      default: 25,  slug: "elbow-jumpers" },
      { name: "Short corner jumpers", default: 25, slug: "short-corner-jumpers" },
      { name: "Dribble pull-ups",   default: 25,  slug: "dribble-pull-ups" },
    ],
  },
  handling: {
    title: "Ball-handling",
    hint: "Stationary, two-ball, figure 8s",
    unit: "minutes",
    quick: [5, 10, 15, 20],
    exercises: [
      { name: "Stationary dribbling", default: 10, slug: "stationary-dribbling" },
      { name: "Two-ball dribbling",   default: 10, slug: "two-ball-dribbling" },
      { name: "Crossovers",           default: 5,  slug: "crossovers" },
      { name: "Figure 8s",            default: 5,  slug: "figure-8s" },
      { name: "Dribble series",       default: 10, slug: "dribble-series" },
    ],
  },
  finishing: {
    title: "Finishing",
    hint: "Layups, floaters, euro-step",
    unit: "reps",
    quick: [10, 20, 50, 100],
    exercises: [
      { name: "Layups (right hand)", default: 20, slug: "layups-right" },
      { name: "Layups (left hand)",  default: 20, slug: "layups-left" },
      { name: "Floaters",            default: 20, slug: "floaters" },
      { name: "Euro-step",           default: 20, slug: "euro-step" },
      { name: "Hop-step",            default: 20, slug: "hop-step" },
      { name: "Spin",                default: 20, slug: "spin" },
    ],
  },
  footwork: {
    title: "Footwork",
    hint: "Pivots, jump stops, defensive slides",
    unit: "reps",
    quick: [10, 20, 30, 50],
    exercises: [
      { name: "Pivots",             default: 20, slug: "pivots" },
      { name: "Jump stops",         default: 20, slug: "jump-stops" },
      // Timed, unlike the rest of Footwork — own unit and own scale.
      { name: "Defensive slides",   default: 10, slug: "defensive-slides", unit: "minutes", quick: [5, 10, 15, 20] },
    ],
  },
  conditioning: {
    title: "Conditioning",
    hint: "Suicides, sprints, jump rope",
    unit: "reps",
    quick: [5, 10, 15, 20],
    exercises: [
      { name: "Suicides",                      default: 10, slug: "suicides" },
      { name: "Sprints (baseline to baseline)", default: 10, slug: "sprints" },
      // Everything below is timed, and on three different scales — holds run in
      // single minutes, a run-out in tens. Each carries its own preset row.
      { name: "Jump rope",         default: 10, slug: "jump-rope",         unit: "minutes", quick: [5, 10, 15] },
      { name: "Planks",            default: 2,  slug: "planks",            unit: "minutes", quick: [1, 2, 3, 5] },
      { name: "Isometric squats",  default: 2,  slug: "isometric-squats",  unit: "minutes", quick: [1, 2, 3, 5] },
      { name: "Pick-up basketball", default: 30, slug: "pick-up-basketball", unit: "minutes", quick: [20, 30, 45, 60] },
    ],
  },
  "spot-shots": {
    title: "Spot shots",
    hint: "Corner-to-wing spots",
    unit: "reps",
    quick: [5, 10, 15, 20],
    exercises: [
      { name: "Right corner-to-wing", default: 10, slug: "right-corner-to-wing" },
      { name: "Left corner-to-wing",  default: 10, slug: "left-corner-to-wing" },
      { name: "STAR drill",           default: 5,  slug: "star-drill" },
    ],
  },
};
