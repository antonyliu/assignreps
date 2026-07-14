import { LogoLarge } from "@/components/Logo";
import PlayerOtpFlow from "@/components/PlayerOtpFlow";
import { lookupPlayerByPhone } from "./actions";

export default function PlayerLoginPage() {
  return (
    <main className="flex flex-col flex-1 min-h-screen items-center justify-center text-center px-6">
      <LogoLarge size={44} />
      <h1 className="text-[28px] font-semibold tracking-[-0.5px] mt-6 mb-2">Welcome back</h1>
      <div className="w-full max-w-[320px]">
        <p className="text-[13px] text-reps-sub mb-4">Enter your number to find your assignments.</p>
        <PlayerOtpFlow token="" lookupByPhone={lookupPlayerByPhone} />
      </div>
    </main>
  );
}
