// Coach view of a single player's week — TODO: build next session
export default async function CoachPlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="p-6">
      <h1 className="text-xl font-bold">Player detail</h1>
      <p className="text-[#8a8a8e] mt-1 text-sm">id: {id}</p>
    </main>
  );
}
