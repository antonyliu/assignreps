// Supabase generated types will go here.
// Run: npx supabase gen types typescript --project-id <your-project-id> > src/types/database.ts
// For now, a minimal hand-written stub to satisfy the supabase client import.

export type Database = {
  public: {
    Tables: {
      coaches: {
        Row: {
          id: string;
          name: string;
          phone: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["coaches"]["Row"], "id" | "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["coaches"]["Insert"]>;
      };
      players: {
        Row: {
          id: string;
          coach_id: string;
          name: string;
          phone: string;
          parent_phone: string | null;
          token: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["players"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["players"]["Insert"]>;
      };
      assignments: {
        Row: {
          id: string;
          coach_id: string;
          player_id: string;
          exercise_name: string;
          target: number;
          unit: "reps" | "minutes" | "target";
          video_url: string | null;
          week_start: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["assignments"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["assignments"]["Insert"]>;
      };
      logs: {
        Row: {
          id: string;
          player_id: string;
          assignment_id: string;
          amount: number;
          logged_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["logs"]["Row"], "id" | "logged_at">;
        Update: Partial<Database["public"]["Tables"]["logs"]["Insert"]>;
      };
    };
  };
};
