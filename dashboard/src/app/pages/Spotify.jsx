import { useState, useEffect, useCallback } from "react";
import { viernesApi } from "@apis/viernes";
import { API_BASE_URL } from "@apis/client";

const Ic = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const ICONS = {
  music:   "M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
  play:    "M5 3l14 9-14 9V3z",
  pause:   "M6 4h4v16H6zM14 4h4v16h-4z",
  clock:   "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 5v5l3 3",
  star:    "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  link:    "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3",
  refresh: "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
};

function msToMin(ms) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function timeAgo(isoStr) {
  const diff = Date.now() - new Date(isoStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

// ─── Connect Panel ────────────────────────────────────────────────────────────
function ConnectPanel({ onConnected }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConnect = async () => {
    setLoading(true);
    setError("");
    try {
      const { auth_url } = await viernesApi.spotifyAuth();
      window.open(auth_url, "_blank", "width=500,height=700");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
      <div className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{ background: "rgba(29,185,84,0.15)", border: "1px solid rgba(29,185,84,0.3)" }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="rgba(29,185,84,0.9)">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.517 17.398a.75.75 0 0 1-1.031.25c-2.827-1.728-6.387-2.12-10.582-1.16a.75.75 0 0 1-.334-1.463c4.588-1.047 8.524-.596 11.697 1.342a.75.75 0 0 1 .25 1.031zm1.47-3.272a.937.937 0 0 1-1.288.308C14.87 12.424 11.1 11.95 7.5 12.98a.937.937 0 0 1-.525-1.8c4.056-1.18 8.266-.608 11.698 1.658a.938.938 0 0 1 .314 1.288zm.127-3.411C15.76 8.49 9.99 8.3 6.578 9.325a1.125 1.125 0 1 1-.652-2.152C9.89 5.998 16.327 6.22 20.027 8.55a1.125 1.125 0 0 1-.913 2.065v.1z"/>
        </svg>
      </div>
      <div className="text-center">
        <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--c-text)" }}>Conectar Spotify</h2>
        <p className="text-sm max-w-sm" style={{ color: "var(--c-text-3)" }}>
          Conecta tu cuenta de Spotify para ver qué estás escuchando, tu historial y tus canciones favoritas.
        </p>
      </div>
      {error && (
        <p className="text-sm px-4 py-2 rounded-xl" style={{ background: "rgba(248,113,113,0.12)", color: "#f87171" }}>
          {error}
        </p>
      )}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={handleConnect}
          disabled={loading}
          className="flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: "#1db954", color: "#fff" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.517 17.398a.75.75 0 0 1-1.031.25c-2.827-1.728-6.387-2.12-10.582-1.16a.75.75 0 0 1-.334-1.463c4.588-1.047 8.524-.596 11.697 1.342a.75.75 0 0 1 .25 1.031zm1.47-3.272a.937.937 0 0 1-1.288.308C14.87 12.424 11.1 11.95 7.5 12.98a.937.937 0 0 1-.525-1.8c4.056-1.18 8.266-.608 11.698 1.658a.938.938 0 0 1 .314 1.288zm.127-3.411C15.76 8.49 9.99 8.3 6.578 9.325a1.125 1.125 0 1 1-.652-2.152C9.89 5.998 16.327 6.22 20.027 8.55a1.125 1.125 0 0 1-.913 2.065v.1z"/>
          </svg>
          {loading ? "Abriendo…" : "Conectar con Spotify"}
        </button>
        <button
          onClick={onConnected}
          className="text-xs transition-colors"
          style={{ color: "var(--c-text-4)" }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--c-text-2)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--c-text-4)"}
        >
          Ya conecté → verificar
        </button>
      </div>
      <div className="text-xs text-center max-w-xs px-4" style={{ color: "var(--c-text-4)" }}>
        Se abrirá una ventana de Spotify. Después de autorizar, regresa aquí y haz click en "Ya conecté".
      </div>
    </div>
  );
}

// ─── Now Playing ──────────────────────────────────────────────────────────────
function NowPlaying({ track, onRefresh }) {
  if (!track.playing) {
    return (
      <div className="rounded-2xl p-5 flex items-center gap-4"
        style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}>
        <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--c-hover)" }}>
          <Ic d={ICONS.music} size={24} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--c-text-4)" }}>Ahora</p>
          <p className="text-sm" style={{ color: "var(--c-text-3)" }}>Sin reproducción activa</p>
        </div>
        <button onClick={onRefresh} className="ml-auto p-2 rounded-lg" style={{ color: "var(--c-text-4)" }}>
          <Ic d={ICONS.refresh} size={14} />
        </button>
      </div>
    );
  }

  const pct = track.duration_ms > 0 ? (track.progress_ms / track.duration_ms) * 100 : 0;

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: "linear-gradient(135deg,rgba(29,185,84,0.12),rgba(29,185,84,0.05))", border: "1px solid rgba(29,185,84,0.25)" }}>
      <div className="p-5 flex gap-4">
        {track.image ? (
          <img src={track.image} alt={track.album} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--c-hover)" }}>
            <Ic d={ICONS.music} size={24} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: "#1db954" }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#1db954" }} />
              Reproduciendo
            </span>
          </div>
          <p className="text-base font-semibold truncate" style={{ color: "var(--c-text)" }}>{track.name}</p>
          <p className="text-sm truncate" style={{ color: "var(--c-text-3)" }}>{track.artists.join(", ")}</p>
          <p className="text-xs truncate" style={{ color: "var(--c-text-4)" }}>{track.album}</p>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <button onClick={onRefresh} className="p-1.5 rounded-lg" style={{ color: "var(--c-text-4)" }}>
            <Ic d={ICONS.refresh} size={13} />
          </button>
          <a href={track.spotify_url} target="_blank" rel="noreferrer"
            className="p-1.5 rounded-lg" style={{ color: "var(--c-text-4)" }}>
            <Ic d={ICONS.link} size={13} />
          </a>
        </div>
      </div>
      {/* Progress bar */}
      <div className="px-5 pb-4">
        <div className="flex justify-between text-[10px] mb-1" style={{ color: "var(--c-text-4)" }}>
          <span>{msToMin(track.progress_ms)}</span>
          <span>{msToMin(track.duration_ms)}</span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--c-border-med)" }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "#1db954" }} />
        </div>
      </div>
    </div>
  );
}

// ─── Track Row ────────────────────────────────────────────────────────────────
function TrackRow({ track, rank, meta }) {
  return (
    <a href={track.spotify_url} target="_blank" rel="noreferrer"
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group"
      style={{ background: "transparent" }}
      onMouseEnter={e => e.currentTarget.style.background = "var(--c-hover)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      {rank != null && (
        <span className="w-5 text-right text-xs flex-shrink-0" style={{ color: "var(--c-text-4)" }}>{rank}</span>
      )}
      {track.image ? (
        <img src={track.image} alt={track.album} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
      ) : (
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--c-hover)" }}>
          <Ic d={ICONS.music} size={14} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: "var(--c-text)" }}>{track.name}</p>
        <p className="text-xs truncate" style={{ color: "var(--c-text-3)" }}>{track.artists.join(", ")}</p>
      </div>
      {meta && <span className="text-[10px] flex-shrink-0" style={{ color: "var(--c-text-4)" }}>{meta}</span>}
      <Ic d={ICONS.link} size={11} />
    </a>
  );
}

// ─── Página principal Spotify ─────────────────────────────────────────────────
export default function Spotify() {
  const [connected, setConnected] = useState(null); // null=checking
  const [nowPlaying, setNowPlaying] = useState(null);
  const [recent, setRecent] = useState([]);
  const [topTracks, setTopTracks] = useState([]);
  const [timeRange, setTimeRange] = useState("short_term");
  const [loading, setLoading] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      const { connected: ok } = await viernesApi.spotifyStatus();
      setConnected(ok);
      if (ok) loadData();
    } catch {
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    // Connected=true from OAuth callback redirect
    if (new URLSearchParams(window.location.search).get("connected") === "true") {
      window.history.replaceState({}, "", window.location.pathname);
    }
    checkStatus();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [np, rec, top] = await Promise.all([
        viernesApi.spotifyNowPlaying().catch(() => null),
        viernesApi.spotifyRecent(15).catch(() => ({ tracks: [] })),
        viernesApi.spotifyTopTracks(20, timeRange).catch(() => ({ tracks: [] })),
      ]);
      if (np) setNowPlaying(np);
      setRecent(rec.tracks || []);
      setTopTracks(top.tracks || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (connected) {
      viernesApi.spotifyTopTracks(20, timeRange)
        .then(d => setTopTracks(d.tracks || []))
        .catch(() => {});
    }
  }, [timeRange, connected]);

  const refreshNowPlaying = () => {
    viernesApi.spotifyNowPlaying()
      .then(np => setNowPlaying(np))
      .catch(() => {});
  };

  if (connected === null) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 rounded-full animate-spin"
          style={{ borderColor: "var(--c-border-med)", borderTopColor: "#1db954" }} />
      </div>
    );
  }

  if (!connected) {
    return <ConnectPanel onConnected={checkStatus} />;
  }

  const TIME_RANGES = [
    { k: "short_term",  l: "4 semanas" },
    { k: "medium_term", l: "6 meses"   },
    { k: "long_term",   l: "Todo el tiempo" },
  ];

  return (
    <div className="space-y-5 max-w-[1100px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#1db954">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.517 17.398a.75.75 0 0 1-1.031.25c-2.827-1.728-6.387-2.12-10.582-1.16a.75.75 0 0 1-.334-1.463c4.588-1.047 8.524-.596 11.697 1.342a.75.75 0 0 1 .25 1.031zm1.47-3.272a.937.937 0 0 1-1.288.308C14.87 12.424 11.1 11.95 7.5 12.98a.937.937 0 0 1-.525-1.8c4.056-1.18 8.266-.608 11.698 1.658a.938.938 0 0 1 .314 1.288zm.127-3.411C15.76 8.49 9.99 8.3 6.578 9.325a1.125 1.125 0 1 1-.652-2.152C9.89 5.998 16.327 6.22 20.027 8.55a1.125 1.125 0 0 1-.913 2.065v.1z"/>
          </svg>
          <h1 className="font-semibold text-base" style={{ color: "var(--c-text)" }}>Spotify</h1>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className={`p-2 rounded-lg transition-colors ${loading ? "animate-spin" : ""}`}
          style={{ color: "var(--c-text-3)" }}
        >
          <Ic d={ICONS.refresh} size={14} />
        </button>
      </div>

      {/* Now Playing */}
      {nowPlaying && <NowPlaying track={nowPlaying} onRefresh={refreshNowPlaying} />}

      {/* Dos columnas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Escuchado recientemente */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}>
          <div className="px-4 py-3.5 flex items-center gap-2"
            style={{ borderBottom: "1px solid var(--c-border)" }}>
            <Ic d={ICONS.clock} size={14} />
            <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>Recientes</p>
          </div>
          <div className="p-2 max-h-[420px] overflow-y-auto space-y-0.5">
            {recent.length === 0 ? (
              <p className="text-xs text-center py-10" style={{ color: "var(--c-text-4)" }}>Sin historial</p>
            ) : recent.map((t, i) => (
              <TrackRow key={i} track={t} meta={timeAgo(t.played_at)} />
            ))}
          </div>
        </div>

        {/* Top Tracks */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}>
          <div className="px-4 py-3.5 flex items-center justify-between"
            style={{ borderBottom: "1px solid var(--c-border)" }}>
            <div className="flex items-center gap-2">
              <Ic d={ICONS.star} size={14} />
              <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>Tus favoritas</p>
            </div>
            <div className="flex gap-0.5">
              {TIME_RANGES.map(({ k, l }) => (
                <button key={k} onClick={() => setTimeRange(k)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors"
                  style={{
                    background: timeRange === k ? "var(--c-hover-2)" : "transparent",
                    color: timeRange === k ? "var(--c-text)" : "var(--c-text-4)",
                  }}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="p-2 max-h-[420px] overflow-y-auto space-y-0.5">
            {topTracks.length === 0 ? (
              <p className="text-xs text-center py-10" style={{ color: "var(--c-text-4)" }}>Sin datos</p>
            ) : topTracks.map((t) => (
              <TrackRow key={t.rank} track={t} rank={t.rank} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
