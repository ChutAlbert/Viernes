export default function AppTopbar({ onOpenSidebar }) {
  return (
    <div className="h-16 px-4 md:px-6 flex items-center gap-3 border-b border-white/10">
      {/* botón solo en mobile */}
      <button
        className="md:hidden h-10 w-10 rounded-xl bg-white/5 border border-white/10 text-white/80"
        onClick={onOpenSidebar}
        aria-label="Open menu"
      >
        ☰
      </button>

      <div className="text-white/90 font-semibold w-32 md:w-48">Dashboard</div>

      <input
        className="flex-1 max-w-xl rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-fuchsia-500/20"
        placeholder="Search..."
      />

      <div className="hidden sm:block text-white/70">Usuario</div>
    </div>
  );
}