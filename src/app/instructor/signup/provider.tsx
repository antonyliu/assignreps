"use client";

import { createContext, useContext, useState } from "react";
import { type ActivityType } from "@/config/activityTypes";

// Holds the fields that must survive as the coach moves between the step routes
// (/instructor/signup → /type → /email). Because this provider is rendered by the
// signup layout, Next keeps it mounted across navigations between those child
// routes, so the state persists and browser back/forward stays in sync.
type SignupCtx = {
  name: string;
  setName: (v: string) => void;
  /**
   * ⚠️ READ-ONLY as of the two-step signup. There is no setter, because the
   * activity picker that used to set it (/instructor/signup/type) is gone and
   * this now has exactly one value for every new coach.
   *
   * It stays in the context rather than being inlined at the insert site so the
   * signup flow still has ONE place that decides what a new coach teaches — the
   * email step reads it and writes it to `coaches.instructor_type` unchanged.
   *
   * ⚠️ Re-adding a picker means restoring the setter here and a screen that
   * calls it; NOT changing the column. `instructor_type` is plain nullable text
   * with no CHECK constraint, and `getActivityLabels()` already falls back to
   * basketball for null, so every other activity in activityTypes.ts is
   * reachable without a migration.
   */
  instructorType: ActivityType;
  email: string;
  setEmail: (v: string) => void;
};

const Ctx = createContext<SignupCtx | null>(null);

export function useSignup() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSignup must be used within SignupProvider");
  return ctx;
}

export function SignupProvider({ children }: { children: React.ReactNode }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  // ⚠️ THE DEFAULT IS NOW THE ONLY SOURCE. It was already "basketball" — the
  // picker merely had the chance to change it — so this is not a new value
  // being invented, it is the one the field already expected, and the one
  // getActivityLabels() falls back to. A const rather than state: nothing can
  // change it during signup any more, and useState would imply otherwise.
  const instructorType: ActivityType = "basketball";
  return (
    <Ctx.Provider value={{ name, setName, instructorType, email, setEmail }}>
      {children}
    </Ctx.Provider>
  );
}
