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
}

export type Log = {
  id: string
  player_id: string
  assignment_id: string
  amount: number
  logged_at: string
}
