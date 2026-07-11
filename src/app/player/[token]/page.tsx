// Student view — accessed via unique magic link token, no auth required
// Token is looked up against players.token in Supabase
export default async function PlayerPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <main className="p-6">
      <h1 className="text-xl font-bold">Player View</h1>
      <p className="text-[#f5f0eb]/60 mt-1">Token: {token}</p>
      <p className="text-[#f5f0eb]/40 mt-2 text-sm">Scaffold only — UI coming soon.</p>
    </main>
  );
}
