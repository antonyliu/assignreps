export type Unit = "reps" | "minutes" | "target";

export type Exercise = {
  name: string
  default: number
  slug: string
}

export type Category = {
  title: string
  hint: string
  unit: Unit
  quick: number[]
  exercises: Exercise[]
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
    ],
  },
  finishing: {
    title: "Finishing",
    hint: "Layups, floaters",
    unit: "reps",
    quick: [20, 50, 100],
    exercises: [
      { name: "Layups (right hand)", default: 25, slug: "layups-right" },
      { name: "Layups (left hand)",  default: 25, slug: "layups-left" },
      { name: "Floaters",            default: 20, slug: "floaters" },
    ],
  },
  footwork: {
    title: "Footwork",
    hint: "Pivots, jump stops, defensive slides",
    unit: "reps",
    quick: [10, 20, 50],
    exercises: [
      { name: "Pivots",             default: 20, slug: "pivots" },
      { name: "Jump stops",         default: 20, slug: "jump-stops" },
      { name: "Defensive slides",   default: 10, slug: "defensive-slides" },
    ],
  },
  conditioning: {
    title: "Conditioning",
    hint: "Suicides, sprints, jump rope",
    unit: "reps",
    quick: [5, 10, 20],
    exercises: [
      { name: "Suicides",                      default: 10, slug: "suicides" },
      { name: "Sprints (baseline to baseline)", default: 10, slug: "sprints" },
      { name: "Jump rope",                     default: 5,  slug: "jump-rope" },
    ],
  },
};
