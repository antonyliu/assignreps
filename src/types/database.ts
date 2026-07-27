export type Coach = {
  id: string
  name: string
  email: string | null
  phone: string | null
  instructor_type: string | null
  created_at: string
}

export type Player = {
  id: string
  coach_id: string
  name: string
  phone: string
  parent_phone: string | null
  send_to_parent: boolean
  token: string
  created_at: string
  /** Last assign-notification SMS. Null = never texted. Compared as an
   *  America/Los_Angeles calendar date to cap sends at one per day. */
  last_texted_at: string | null
}

/** What `target` measures. 'reps' = attempts, 'makes' = makes, 'consecutive' =
 *  a streak length — see GoalType notes in src/lib/exercises.ts. */
export type GoalType = "reps" | "makes" | "consecutive"

/** Which hand/side the drill is for. Null = unspecified (not "both"). */
export type Side = "left" | "right"

export type Assignment = {
  id: string
  coach_id: string
  player_id: string
  exercise_name: string
  target: number
  unit: "reps" | "minutes" | "target"
  video_url: string | null
  week_start: string
  created_at: string
  /** Coach's choice at assign time: may the student record makes for this drill?
   *  Defaults on for shooting-type categories, off everywhere else. Forced true
   *  when goal_type is 'makes' or 'consecutive', where makes are the point. */
  track_makes: boolean
  /** What `target` counts. Defaults to 'reps' for every pre-existing row. */
  goal_type: GoalType
  side: Side | null
}

export type Log = {
  id: string
  player_id: string
  assignment_id: string
  amount: number
  logged_at: string
  /** Optional even when the assignment tracks makes. Null = "logged the reps,
   *  didn't say how many went in" and is NOT the same as 0 = "made none" —
   *  anything aggregating these must keep them distinct. */
  makes: number | null
  /** Snapshot of the assignment as it was WHEN THIS ROW WAS LOGGED, copied by
   *  saveLog from a server-side read. assignment_id is ON DELETE SET NULL, so
   *  without these a cleared assignment leaves a log with no record of what it
   *  was. Written once and never updated — a later edit to the assignment must
   *  not rewrite what the student actually did.
   *
   *  Null on every row written before this existed; there is no backfill,
   *  because today's assignment values are not necessarily what a past log
   *  meant. Readers keep joining live to `assignments` and should treat these
   *  as the fallback for an orphan, not the primary source. */
  exercise_name: string | null
  unit: string | null
  goal_type: GoalType | null
  target: number | null
  side: Side | null
}
