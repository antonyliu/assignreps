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
  instructorType: ActivityType;
  setInstructorType: (v: ActivityType) => void;
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
  const [instructorType, setInstructorType] = useState<ActivityType>("basketball");
  const [email, setEmail] = useState("");
  return (
    <Ctx.Provider value={{ name, setName, instructorType, setInstructorType, email, setEmail }}>
      {children}
    </Ctx.Provider>
  );
}
