import { StatCardDark, Surface } from "@viernes/ui/react";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCardDark title="Avg First Reply Time" value="30" suffix="min" tone="purple" />
        <StatCardDark title="Avg Full Resolve Time" value="22" suffix="min" tone="cyan" />
        <Surface className="p-5">
          <div className="text-white/70 text-sm">Messages</div>
          <div className="text-white text-2xl font-bold mt-2">+20%</div>
        </Surface>
      </div>

      <Surface className="p-5">
        <div className="text-white font-semibold mb-3">Tickets Created vs Tickets Solved</div>
        <div className="h-64 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50">
          Chart placeholder
        </div>
      </Surface>
    </div>
  );
}