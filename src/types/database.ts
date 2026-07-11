// Generated-style types matching the Reps schema.
// Replace this file by running:
//   npx supabase gen types typescript --project-id obkwxyzpugpleahrgcby > src/types/database.ts

export type Database = {
  public: {
    Tables: {
      coaches: {
        Row: {
          id: string
          name: string
          phone: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          phone: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string
          created_at?: string
        }
      }
      players: {
        Row: {
          id: string
          coach_id: string
          name: string
          phone: string
          parent_phone: string | null
          token: string
          created_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          name: string
          phone: string
          parent_phone?: string | null
          token?: string
          created_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          name?: string
          phone?: string
          parent_phone?: string | null
          token?: string
          created_at?: string
        }
      }
      assignments: {
        Row: {
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
        Insert: {
          id?: string
          coach_id: string
          player_id: string
          exercise_name: string
          target: number
          unit: "reps" | "minutes" | "target"
          video_url?: string | null
          week_start: string
          created_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          player_id?: string
          exercise_name?: string
          target?: number
          unit?: "reps" | "minutes" | "target"
          video_url?: string | null
          week_start?: string
          created_at?: string
        }
      }
      logs: {
        Row: {
          id: string
          player_id: string
          assignment_id: string
          amount: number
          logged_at: string
        }
        Insert: {
          id?: string
          player_id: string
          assignment_id: string
          amount: number
          logged_at?: string
        }
        Update: {
          id?: string
          player_id?: string
          assignment_id?: string
          amount?: number
          logged_at?: string
        }
      }
    }
  }
}
