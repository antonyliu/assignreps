import { LogoLarge } from "@/components/Logo";
import PlayerOtpFlow from "@/components/PlayerOtpFlow";
import { lookupPlayerByPhone } from "./actions";

export default function PlayerLoginPage() {
  return (
    <main className="flex flex-col flex-1 min-h-screen items-center justify-center text-center px-6">
      <LogoLarge />
      <h1 className="text-[36px] font-semibold tracking-[-1px] mb-2">Reps</h1>
      <p className="text-[14px] text-[#8a8a8e] italic mb-10">
        For players who want to be great.
      </p>
      <p className="text-[18px] font-medium mb-2">Welcome back</p>
      <p className="text-[14px] text-[#8a8a8e] mb-8 max-w-[260px]">
        Enter your number to find your assignments.
      </p>
      <div className="w-full max-w-[300px]">
        <PlayerOtpFlow token="" lookupByPhone={lookupPlayerByPhone} />
      </div>
    </main>
  );
}
