"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/* ---------------------------------------------------------------------- */
/* config                                                                  */
/* ---------------------------------------------------------------------- */

const INK = "#17120E";
const PAPER = "#EDE2CB";
const CLAY = "#B4552F";
const RED = "#B7151E";   /* Afterhours wordmark red — UI accent */
const RED_LIT = "#E33B33"; /* brightened, for focus rings that must stay visible */
const STEEL = "#93A0A6";

const TAPRIS = [
  {
    id: "ashfaq",
    name: "Ashfaq Tea & Lassi Corner",
    area: "Hussainabad",
    note: "purani Lucknow ka ek kona, subah subah bhaap uthti hai.",
  },
  {
    id: "keval",
    name: "Ram Kewal Tea Stall",
    area: "Makbara Road, Hazratganj",
    note: "chhoti si dukaan, lambi line — waise hi chalta aaya hai.",
  },
  {
    id: "shukla",
    name: "Shukla Tea Stall",
    area: "Hazratganj",
    note: "Ganj ki bheed ke beech, ek kulhad thaam lo, sab thehar jaata hai.",
  },
  {
    id: "sharma",
    name: "Sharma Ji Ki Chai",
    area: "T.N. Road, Lalbagh",
    note: "office jaate waqt ka thehraav, roz ka rasta yahin se hoke.",
  },
  {
    id: "globe",
    name: "Globe Cafe",
    area: "Meergunj",
    note: "purana naam, purana kaam — chai wahi, andaaz wahi.",
  },
  {
    id: "raj",
    name: "Raj Coffee Corner",
    area: "Rana Pratap Marg",
    note: "naam mein coffee hai, dil chai mein hai.",
  },
  {
    id: "satyam",
    name: "System Chai Wala",
    area: "Vipul Khand, Gomti Nagar",
    note: "shaam ka adda, gate ke bahar ka table.",
  },
  {
    id: "sonu",
    name: "Sonu Tea Stall",
    area: "Vipin Khand, Gomti Nagar",
    note: "mohalle wali chai, sabko naam se pehchaanta hai.",
  },
  {
    id: "nukkad",
    name: "Nukkad",
    area: "Gomti Nagar",
    note: "naam mein hi sab kuch — nukkad pe milte hain.",
  },
];

/*
 * Each state mixes the day and night plates (night = opacity of the night
 * plate over the day plate) and stacks a colour-grade + a light-direction
 * overlay on top, so time shifts read as light changing, not a filter swap.
 */
const STATES = [
  {
    key: "subah",
    label: "सुबह",
    hint: "morning",
    night: 0,
    dayFilter: "brightness(1.04) saturate(0.94)",
    nightFilter: "none",
    tint: "linear-gradient(180deg, rgba(255,190,150,0.28), rgba(255,206,160,0.10) 45%, rgba(0,0,0,0) 70%)",
    tintBlend: "soft-light",
    light:
      "radial-gradient(ellipse 60% 45% at 16% 18%, rgba(255,210,160,0.35), rgba(255,210,160,0) 70%)",
    wash: "radial-gradient(circle at 50% 35%, rgba(255,198,140,0.55), rgba(255,198,140,0) 72%)",
  },
  {
    key: "shaam",
    label: "शाम",
    hint: "evening",
    night: 0.5,
    dayFilter: "brightness(0.9) saturate(1.15) sepia(0.15) hue-rotate(-8deg)",
    nightFilter: "brightness(1.05)",
    tint: "linear-gradient(195deg, rgba(226,110,52,0.30), rgba(150,64,84,0.22) 55%, rgba(70,42,66,0.26))",
    tintBlend: "multiply",
    light:
      "radial-gradient(ellipse 55% 40% at 80% 12%, rgba(255,150,70,0.42), rgba(255,150,70,0) 70%)",
    wash: "radial-gradient(circle at 50% 35%, rgba(238,124,58,0.55), rgba(238,124,58,0) 72%)",
  },
  {
    key: "raat",
    label: "रात",
    hint: "night",
    night: 1,
    dayFilter: "none",
    nightFilter: "contrast(1.04)",
    tint: "linear-gradient(180deg, rgba(16,26,54,0.25), rgba(16,26,54,0.10) 55%, rgba(10,16,36,0.20))",
    tintBlend: "multiply",
    light:
      "radial-gradient(ellipse 60% 50% at 50% 58%, rgba(255,176,84,0.14), rgba(255,176,84,0) 70%)",
    wash: "radial-gradient(circle at 50% 35%, rgba(34,48,92,0.6), rgba(34,48,92,0) 72%)",
  },
];

/* rain is a layer over any time state, not a state of its own */
const RAIN_TINT =
  "linear-gradient(180deg, rgba(70,88,104,0.40), rgba(70,88,104,0.26) 55%, rgba(60,74,88,0.34))";
const RAIN_FILTER = "saturate(0.62) brightness(0.8) contrast(0.97)";
const RAIN_WASH =
  "radial-gradient(circle at 50% 35%, rgba(112,132,150,0.5), rgba(112,132,150,0) 72%)";

const PLAYLIST_ID = "PLJwtI1xb0Z_YSjwpW6zQVQkr6TWb_7GRP";
const LS_TAPRI = "nautapri.tapri";
const LS_STATE = "nautapri.state";
const LS_RAIN = "nautapri.rain";

/* strip a raw YouTube video title down to "song — artist" */
const TITLE_JUNK = /\b(official( music)? (video|audio)|full( video)? song|lyrical( video)?|lyrics?|hd|4k|remastered|audio jukebox|video jukebox|jukebox|vevo|explicit)\b/gi;

function parseSongArtist(rawTitle, author) {
  let raw = (rawTitle || "").trim();
  raw = raw.replace(/[\(\[\{][^\)\]\}]*[\)\]\}]/g, " "); // drop bracketed/parenthetical junk
  const segments = raw
    .split("|")
    .map((s) => s.replace(TITLE_JUNK, " ").replace(/\s{2,}/g, " ").trim());
  const cleanAuthor = (author || "").replace(/\s*-\s*Topic$/i, "").trim();

  const first = (segments[0] || "").replace(/^[-–:\s]+|[-–:\s]+$/g, "").trim();
  const dashParts = first.split(/\s[-–]\s/);
  if (dashParts.length >= 2) {
    return { song: dashParts[0].trim(), artist: dashParts.slice(1).join(" — ").trim() };
  }

  if (segments.length > 1) {
    const last = segments[segments.length - 1].replace(/^[-–:\s]+|[-–:\s]+$/g, "").trim();
    return { song: first, artist: last || cleanAuthor };
  }
  return { song: first, artist: cleanAuthor };
}

function detectStateFromIST() {
  const ist = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );
  const h = ist.getHours();
  if (h >= 5 && h < 16) return "subah";
  if (h >= 16 && h < 19) return "shaam";
  return "raat";
}

/* ---------------------------------------------------------------------- */
/* placeholder plate — used when a photo file is missing                  */
/* ---------------------------------------------------------------------- */

function Placeholder({ tapri, plate }) {
  const isNight = plate === "night";
  const bg = isNight
    ? `radial-gradient(ellipse at 30% 70%, #2a2118 0%, #14100c 55%, #0b0906 100%)`
    : `radial-gradient(ellipse at 30% 70%, #e7c98d 0%, #cf9a5c 55%, #a9713f 100%)`;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: bg,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          marginBottom: "18%",
          fontFamily: "'Rozha One', serif",
          fontSize: "clamp(20px, 4vw, 40px)",
          color: isNight ? "rgba(237,226,203,0.55)" : "rgba(23,18,14,0.5)",
          textAlign: "center",
          padding: "0 24px",
          letterSpacing: "0.02em",
        }}
      >
        {tapri.name}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* rain + thunder sound — synthesised with Web Audio, no files needed     */
/* ---------------------------------------------------------------------- */

function createRainAudio() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const ctx = new Ctx();
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  /* rain bed: looped noise, band-limited to a soft hiss-patter */
  const len = 2 * ctx.sampleRate;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 300;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 1400;
  lp.Q.value = 0.4;
  const rainGain = ctx.createGain();
  rainGain.gain.value = 0.13;
  src.connect(hp);
  hp.connect(lp);
  lp.connect(rainGain);
  rainGain.connect(master);
  src.start();

  /* one thunder rumble: brown-noise burst, lowpass sweeping down */
  function thunder(intensity) {
    const dur = 4 + Math.random() * 2.5;
    const n = Math.floor(dur * ctx.sampleRate);
    const b = ctx.createBuffer(1, n, ctx.sampleRate);
    const ch = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < n; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      ch[i] = last * 3.5;
    }
    const s = ctx.createBufferSource();
    s.buffer = b;
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    const t0 = ctx.currentTime;
    f.frequency.setValueAtTime(240 + Math.random() * 80, t0);
    f.frequency.exponentialRampToValueAtTime(85, t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(
      Math.max(0.05, intensity),
      t0 + 0.25 + Math.random() * 0.45
    );
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f);
    f.connect(g);
    g.connect(master);
    s.start();
    s.stop(t0 + dur + 0.1);
  }

  return { ctx, master, thunder };
}

/* ---------------------------------------------------------------------- */
/* one plate (day or night) with graceful fallback                        */
/* ---------------------------------------------------------------------- */

function Plate({ tapri, plate, opacity, filter }) {
  const [broken, setBroken] = useState(false);
  const src = `/tapris/${tapri.id}-${plate}.jpeg`;

  useEffect(() => {
    setBroken(false);
  }, [src]);

  return (
    <div className="plate" style={{ opacity, filter }} aria-hidden={opacity === 0}>
      {broken ? (
        <Placeholder tapri={tapri} plate={plate} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" onError={() => setBroken(true)} />
      )}
    </div>
  );
}

/* a scene = the day + night plates of one tapri, mixed per time state */
function Scene({ tapri, state, nightAmt, entering }) {
  return (
    <div className={`scene${entering ? " scene-in" : ""}`}>
      <Plate tapri={tapri} plate="day" opacity={1} filter={state.dayFilter} />
      <Plate tapri={tapri} plate="night" opacity={nightAmt} filter={state.nightFilter} />
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* rain — canvas drops, lamp bloom, drifting sheet, glass, mist, thunder */
/* ---------------------------------------------------------------------- */

function RainCanvas({ on }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!on) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf, W, H;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = Math.max(1, W * dpr);
      canvas.height = Math.max(1, H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    /* three depth bands: far = fine mist, near = fast bright streaks */
    const BANDS = [
      { n: 300, v: 1250, len: [9, 17], w: 0.6, a: 0.12 },
      { n: 210, v: 2050, len: [20, 34], w: 0.9, a: 0.17 },
      { n: 130, v: 3100, len: [36, 60], w: 1.3, a: 0.22 },
    ];
    const drops = [];
    BANDS.forEach((b) => {
      for (let i = 0; i < b.n; i++) {
        drops.push({
          x: Math.random() * (W + 200) - 100,
          y: Math.random() * H,
          v: b.v * (0.85 + Math.random() * 0.3),
          len: b.len[0] + Math.random() * (b.len[1] - b.len[0]),
          w: b.w,
          a: b.a * (0.7 + Math.random() * 0.6),
        });
      }
    });

    let last = performance.now();
    let t = 0;
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      ctx.clearRect(0, 0, W, H);
      /* wind sways slowly; gusts modulate visibility so the rain breathes */
      const wind = 0.16 + 0.06 * Math.sin(t * 0.5) + 0.03 * Math.sin(t * 1.7);
      const gust = 0.8 + 0.2 * Math.sin(t * 0.23) * Math.sin(t * 0.11 + 2);
      ctx.lineCap = "round";
      for (const d of drops) {
        d.y += d.v * dt;
        d.x += d.v * wind * dt;
        if (d.y - d.len > H) {
          d.y = -d.len - Math.random() * 40;
          d.x = Math.random() * (W + 200) - 100;
        }
        if (d.x - 60 > W) d.x -= W + 120;
        ctx.strokeStyle = `rgba(186,204,220,${d.a * gust})`;
        ctx.lineWidth = d.w;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - wind * d.len, d.y - d.len);
        ctx.stroke();
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
      ctx.clearRect(0, 0, W, H);
    };
  }, [on]);

  return <canvas ref={ref} className="rain-canvas" />;
}

function RainBlock({ on, tapri }) {
  return (
    <div className={`rainblock${on ? " on" : ""}`} aria-hidden="true">
      <div className="rain-layer rain-sheet" />
      {/* the night plate, blurred and screen-blended: every lamp and lit
          signboard blooms into the rain fog, correctly placed per tapri */}
      <div
        className="rain-bloom"
        style={{ backgroundImage: `url(/tapris/${tapri.id}-night.jpeg)` }}
      />
      <RainCanvas on={on} />
      <div className="rain-mist" />
      <div className="rain-flash rain-flash-a" />
      <div className="rain-flash rain-flash-b" />
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* register drawer — the signature selector                               */
/* ---------------------------------------------------------------------- */

const DEVANAGARI_DIGITS = ["१", "२", "३", "४", "५", "६", "७", "८", "९"];

function RegisterDrawer({ open, onClose, activeId, onSelect }) {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.35s ease",
          zIndex: 40,
        }}
      />
      <aside
        role="dialog"
        aria-label="register — choose a tapri"
        aria-hidden={!open}
        style={{
          position: "fixed",
          bottom: 0,
          left: "min(22px, 4vw)",
          width: "min(420px, calc(100vw - 32px))",
          height: "min(72vh, 640px)",
          zIndex: 41,
          transform: open ? "translateY(0)" : "translateY(105%)",
          transition: "transform 0.55s cubic-bezier(.2,.8,.25,1)",
          background: PAPER,
          borderRadius: "10px 10px 0 0",
          boxShadow: "0 -6px 30px rgba(0,0,0,0.45)",
          display: "flex",
          flexDirection: "column",
          backgroundImage:
            "linear-gradient(90deg, rgba(0,0,0,0) 40px, rgba(180,85,47,0.45) 40px, rgba(180,85,47,0.45) 41px, rgba(0,0,0,0) 41px)," +
            "repeating-linear-gradient(rgba(23,18,14,0.09) 0 1px, rgba(0,0,0,0) 1px 34px)",
          backgroundPositionY: "0, 58px",
        }}
      >
        <div
          style={{
            padding: "22px 22px 10px",
            borderBottom: `2px solid ${CLAY}`,
          }}
        >
          <div
            style={{
              fontFamily: "'Rozha One', serif",
              fontSize: 22,
              color: INK,
            }}
          >
            गेड़ी रजिस्टर
          </div>
          <div
            style={{
              fontFamily: "'Familjen Grotesk', sans-serif",
              fontSize: 12,
              color: "#5c4a33",
              marginTop: 2,
            }}
          >
            nau tapri, nau adde
          </div>
        </div>

        <div style={{ overflowY: "auto", padding: "6px 8px 24px", flex: 1 }}>
          {TAPRIS.map((t, i) => {
            const isActive = t.id === activeId;
            return (
              <button
                key={t.id}
                onClick={() => onSelect(t.id)}
                style={{
                  display: "flex",
                  width: "100%",
                  alignItems: "baseline",
                  gap: 14,
                  padding: "8px 14px",
                  background: isActive ? "rgba(180,85,47,0.14)" : "transparent",
                  border: "none",
                  borderRadius: 3,
                  cursor: "pointer",
                  textAlign: "left",
                  font: "inherit",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Kalam', cursive",
                    fontSize: 18,
                    color: CLAY,
                    width: 22,
                    flexShrink: 0,
                  }}
                >
                  {DEVANAGARI_DIGITS[i]}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: "'Kalam', cursive",
                      fontSize: 17,
                      color: INK,
                      lineHeight: 1.25,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {t.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Familjen Grotesk', sans-serif",
                      fontSize: 11.5,
                      color: "#7a6a52",
                      marginTop: 1,
                    }}
                  >
                    {t.area}
                  </div>
                </span>
                {isActive && (
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: RED,
                      flexShrink: 0,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
}

/* ---------------------------------------------------------------------- */
/* music player                                                           */
/* ---------------------------------------------------------------------- */

function MusicPlayer() {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const shuffledOnce = useRef(false);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [track, setTrack] = useState({ song: "", artist: "", videoId: "" });

  useEffect(() => {
    let cancelled = false;

    function createPlayer() {
      if (cancelled || !containerRef.current || playerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        height: "1",
        width: "1",
        playerVars: {
          listType: "playlist",
          list: PLAYLIST_ID,
          controls: 0,
          disablekb: 1,
          playsinline: 1,
          shuffle: 1,
        },
        events: {
          onReady: () => {
            setReady(true);
            try {
              playerRef.current.setShuffle(true);
            } catch (e) {}
          },
          onStateChange: (e) => {
            if (window.YT && e.data === window.YT.PlayerState.PLAYING) {
              setPlaying(true);
              try {
                const d = playerRef.current.getVideoData();
                setTrack({
                  ...parseSongArtist(d?.title, d?.author),
                  videoId: d?.video_id || "",
                });
              } catch (err) {}
              if (!shuffledOnce.current) {
                shuffledOnce.current = true;
                try {
                  playerRef.current.setShuffle(true);
                  const n = playerRef.current.getPlaylist()?.length || 0;
                  if (n > 0) {
                    playerRef.current.playVideoAt(
                      Math.floor(Math.random() * n)
                    );
                  }
                } catch (err) {}
              }
            } else if (
              window.YT &&
              (e.data === window.YT.PlayerState.PAUSED ||
                e.data === window.YT.PlayerState.ENDED)
            ) {
              setPlaying(false);
            }
          },
        },
      });
    }

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prev) prev();
        createPlayer();
      };
    }

    return () => {
      cancelled = true;
    };
  }, []);

  function toggle() {
    const p = playerRef.current;
    if (!p) return;
    if (playing) {
      p.pauseVideo();
    } else {
      p.playVideo();
    }
  }

  function skip(dir) {
    const p = playerRef.current;
    if (!p) return;
    try {
      if (dir > 0) p.nextVideo();
      else p.previousVideo();
    } catch (e) {}
  }

  return (
    <div className="player">
      <div ref={containerRef} style={{ width: 1, height: 1, overflow: "hidden" }} />
      <button
        className="pbtn-side"
        onClick={() => skip(-1)}
        disabled={!ready}
        aria-label="pichla gaana"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M6 6h2v12H6zM20 6l-10 6 10 6z" />
        </svg>
      </button>
      <div className="player-btn-wrap">
        {playing && (
          <>
            <span className="steam steam-1" />
            <span className="steam steam-2" />
          </>
        )}
        <button
          className="player-btn"
          onClick={toggle}
          disabled={!ready}
          aria-label={playing ? "pause" : "play"}
        >
          {playing ? "❚❚" : "▶"}
        </button>
      </div>
      <button
        className="pbtn-side"
        onClick={() => skip(1)}
        disabled={!ready}
        aria-label="agla gaana"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M16 6h2v12h-2zM4 6l10 6-10 6z" />
        </svg>
      </button>
      <div className="player-text">
        <div className="player-song">{track.song || "gaane suno"}</div>
        <div className="player-artist">
          {track.artist
            ? `${track.artist} · via YouTube`
            : "via YouTube — plays go to the artist"}
        </div>
      </div>
      <div
        className={`player-art${playing ? " spin" : ""}`}
        aria-hidden="true"
        style={
          track.videoId
            ? {
                backgroundImage: `url(https://i.ytimg.com/vi/${track.videoId}/mqdefault.jpg)`,
              }
            : undefined
        }
      >
        {!track.videoId && "♪"}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* main page                                                              */
/* ---------------------------------------------------------------------- */

export default function Page() {
  const [activeId, setActiveId] = useState(TAPRIS[0].id);
  const [prevId, setPrevId] = useState(null);
  const [stateKey, setStateKey] = useState("subah");
  const [rainOn, setRainOn] = useState(false);
  const [wash, setWash] = useState({ key: 0, bg: "" });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const audioRef = useRef(null);
  const thunderTimersRef = useRef([]);

  useEffect(() => {
    let s;
    try {
      const savedTapri = localStorage.getItem(LS_TAPRI);
      const savedState = localStorage.getItem(LS_STATE);
      if (savedTapri && TAPRIS.some((t) => t.id === savedTapri)) {
        setActiveId(savedTapri);
      }
      if (savedState && STATES.some((st) => st.key === savedState)) {
        s = savedState;
      }
      if (localStorage.getItem(LS_RAIN) === "1") setRainOn(true);
    } catch (e) {}
    setStateKey(s || detectStateFromIST());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(LS_TAPRI, activeId);
    } catch (e) {}
  }, [activeId, hydrated]);

  /* preload every plate once idle, so tapri switches crossfade cleanly */
  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => {
      TAPRIS.forEach((tp) => {
        ["day", "night"].forEach((p) => {
          const img = new Image();
          img.src = `/tapris/${tp.id}-${p}.jpeg`;
        });
      });
    }, 1200);
    return () => clearTimeout(t);
  }, [hydrated]);

  /* drop the outgoing scene once the crossfade is done */
  useEffect(() => {
    if (prevId == null) return;
    const t = setTimeout(() => setPrevId(null), 1200);
    return () => clearTimeout(t);
  }, [prevId, activeId]);

  function changeState(key) {
    if (key === stateKey) return;
    const next = STATES.find((s) => s.key === key);
    setStateKey(key);
    setWash((w) => ({ key: w.key + 1, bg: next ? next.wash : "" }));
    try {
      localStorage.setItem(LS_STATE, key);
    } catch (e) {}
  }

  function toggleRain() {
    setRainOn((r) => {
      const next = !r;
      try {
        localStorage.setItem(LS_RAIN, next ? "1" : "0");
      } catch (e) {}
      if (next) {
        /* create/resume inside the click so autoplay policy allows it */
        try {
          if (!audioRef.current) audioRef.current = createRainAudio();
          audioRef.current.ctx.resume().catch(() => {});
        } catch (e) {}
      }
      return next;
    });
    setWash((w) => ({ key: w.key + 1, bg: RAIN_WASH }));
  }

  /* rain/thunder sound follows the rain toggle; rumbles land a beat
     after the visual flashes (17s and 23s cycles, same offsets) */
  useEffect(() => {
    const timers = thunderTimersRef.current;
    if (!rainOn) {
      const a = audioRef.current;
      if (a) {
        const t = a.ctx.currentTime;
        a.master.gain.cancelScheduledValues(t);
        a.master.gain.setTargetAtTime(0, t, 0.4);
      }
      timers.forEach(clearTimeout);
      thunderTimersRef.current = [];
      return;
    }
    let a = audioRef.current;
    if (!a) {
      try {
        a = audioRef.current = createRainAudio();
      } catch (e) {
        return;
      }
    }
    const t = a.ctx.currentTime;
    a.master.gain.cancelScheduledValues(t);
    a.master.gain.setTargetAtTime(1, t, 0.8);
    const tryResume = () => {
      if (audioRef.current) audioRef.current.ctx.resume().catch(() => {});
    };
    tryResume();
    /* if rain was restored from storage there was no gesture yet —
       unlock on the first interaction */
    window.addEventListener("pointerdown", tryResume, { once: true });
    window.addEventListener("keydown", tryResume, { once: true });

    function chain(offsetMs, periodMs, intensity) {
      const fire = () => {
        try {
          a.thunder(intensity * (0.7 + Math.random() * 0.6));
        } catch (e) {}
        thunderTimersRef.current.push(setTimeout(fire, periodMs));
      };
      thunderTimersRef.current.push(setTimeout(fire, offsetMs));
    }
    chain(10400 + 1200, 17000, 0.5); /* flash A strike */
    chain(8700 + 1600, 23000, 0.28); /* flash B, first strike */
    chain(18900 + 1400, 23000, 0.34); /* flash B, second strike */

    return () => {
      window.removeEventListener("pointerdown", tryResume);
      window.removeEventListener("keydown", tryResume);
      thunderTimersRef.current.forEach(clearTimeout);
      thunderTimersRef.current = [];
    };
  }, [rainOn]);

  function selectTapri(id) {
    if (id !== activeId) {
      setPrevId(activeId);
      setActiveId(id);
    }
    setDrawerOpen(false);
  }

  function nextTapri() {
    const idx = TAPRIS.findIndex((t) => t.id === activeId);
    selectTapri(TAPRIS[(idx + 1) % TAPRIS.length].id);
  }

  const active = useMemo(
    () => TAPRIS.find((t) => t.id === activeId) || TAPRIS[0],
    [activeId]
  );
  const prev = useMemo(
    () => (prevId ? TAPRIS.find((t) => t.id === prevId) : null),
    [prevId]
  );
  const state = useMemo(
    () => STATES.find((s) => s.key === stateKey) || STATES[0],
    [stateKey]
  );

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setDrawerOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100dvh",
        overflow: "hidden",
        background: INK,
        fontFamily: "'Familjen Grotesk', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rozha+One&family=Kalam:wght@400;700&family=Familjen+Grotesk:wght@400;500;600&display=swap');

        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; background: ${INK}; }

        /* ---------- scene ---------- */

        .stage { position: absolute; inset: 0; }

        .kb {
          position: absolute; inset: 0;
          animation: kenburns 90s ease-in-out infinite alternate;
          transform-origin: 50% 60%;
          transition: filter 2s ease;
          /* promote to its own compositor layer — without this the browser
             rasterises each step on the main thread and very slow scaling
             lands on whole-pixel boundaries, which reads as stepping */
          will-change: transform;
          backface-visibility: hidden;
        }
        @keyframes kenburns {
          from { transform: scale(1.03) translate3d(-0.35%, 0.18%, 0); }
          to   { transform: scale(1.062) translate3d(0.35%, -0.18%, 0); }
        }

        .scene { position: absolute; inset: 0; }
        .scene-in { animation: sceneIn 1.1s ease both; }
        @keyframes sceneIn { from { opacity: 0; } to { opacity: 1; } }

        .plate {
          position: absolute; inset: 0;
          transition: opacity 2.4s ease, filter 2.4s ease;
        }
        .plate img {
          width: 100%; height: 100%;
          object-fit: cover; object-position: center;
          display: block;
        }

        .grade {
          position: absolute; inset: 0;
          pointer-events: none;
          transition: opacity 2.4s ease;
        }

        .scrim {
          position: absolute; left: 0; right: 0; bottom: 0;
          height: 34%;
          background: linear-gradient(180deg, rgba(11,9,6,0), rgba(11,9,6,0.52));
          pointer-events: none;
        }

        .wash {
          position: absolute; inset: 0;
          pointer-events: none;
          opacity: 0;
          animation: washAnim 1.5s ease-in-out forwards;
        }
        @keyframes washAnim {
          0% { opacity: 0; }
          30% { opacity: 0.85; }
          100% { opacity: 0; }
        }

        /* ---------- rain ---------- */

        .rainblock {
          position: absolute; inset: 0;
          overflow: hidden;
          opacity: 0;
          transition: opacity 1.4s ease;
          pointer-events: none;
        }
        .rainblock.on { opacity: 1; }

        .rain-layer {
          position: absolute; inset: -30%;
          transform: rotate(11deg);
          background-repeat: repeat;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          animation-play-state: paused;
        }
        .rainblock.on .rain-layer { animation-play-state: running; }

        /* soft wind-blown sheets of rain, no lines — just drifting atmosphere */
        .rain-sheet {
          background:
            linear-gradient(100deg,
              rgba(172,192,206,0.10) 0%, rgba(172,192,206,0) 28%,
              rgba(172,192,206,0.07) 52%, rgba(172,192,206,0) 78%,
              rgba(172,192,206,0.09) 100%);
          background-size: 100% 100%;
          animation-name: sheetDrift;
          animation-duration: 13s;
          animation-timing-function: ease-in-out;
          animation-direction: alternate;
        }
        @keyframes sheetDrift {
          from { transform: rotate(11deg) translateX(-2.5%); }
          to   { transform: rotate(11deg) translateX(2.5%); }
        }

        /* dense per-drop rain, drawn on canvas */
        .rain-canvas {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          opacity: 0.85;
        }

        /* the night plate blurred + screen-blended = fog glow around lights */
        .rain-bloom {
          position: absolute; inset: -24px;
          background-size: cover;
          background-position: center;
          filter: blur(18px) brightness(1.1) saturate(1.15);
          mix-blend-mode: screen;
          opacity: 0.42;
          pointer-events: none;
        }

        .rain-mist {
          position: absolute; inset: 0;
          background:
            linear-gradient(180deg, rgba(200,214,224,0.16), rgba(200,214,224,0.05) 40%, rgba(200,214,224,0) 65%),
            radial-gradient(ellipse 90% 30% at 50% 105%, rgba(150,170,185,0.14), rgba(150,170,185,0) 70%);
        }

        /* two flash layers on prime-length cycles — together they read as
           irregular distant thunderstorm strikes */
        .rain-flash {
          position: absolute; inset: 0;
          opacity: 0;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          animation-play-state: paused;
        }
        .rainblock.on .rain-flash { animation-play-state: running; }
        .rain-flash-a {
          background: radial-gradient(ellipse 70% 45% at 68% -5%, rgba(220,232,245,0.9), rgba(220,232,245,0) 62%);
          animation-name: lightningA;
          animation-duration: 17s;
        }
        @keyframes lightningA {
          0%, 60.5%, 100% { opacity: 0; }
          61% { opacity: 0.16; }
          61.6% { opacity: 0.03; }
          62.4% { opacity: 0.2; }
          63.6% { opacity: 0; }
        }
        .rain-flash-b {
          background: radial-gradient(ellipse 60% 40% at 22% -8%, rgba(214,226,242,0.85), rgba(214,226,242,0) 58%);
          animation-name: lightningB;
          animation-duration: 23s;
        }
        @keyframes lightningB {
          0%, 37.6%, 100% { opacity: 0; }
          38% { opacity: 0.12; }
          38.7% { opacity: 0; }
          39.3% { opacity: 0.09; }
          40.4% { opacity: 0; }
          81.6% { opacity: 0; }
          82% { opacity: 0.14; }
          83.2% { opacity: 0; }
        }

        /* ---------- grain + vignette ---------- */

        .grain::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.06;
          mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
        }

        .vignette::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%);
        }

        /* ---------- chrome ---------- */

        .chit {
          position: fixed;
          left: 22px;
          bottom: 24px;
          z-index: 20;
          display: flex;
          gap: 10px;
          align-items: stretch;
          width: min(460px, calc(100vw - 44px));
          font-family: 'Kalam', cursive;
          background: ${PAPER};
          background-image:
            linear-gradient(90deg, rgba(0,0,0,0) 15px, rgba(180,85,47,0.55) 15px, rgba(180,85,47,0.55) 16.5px, rgba(0,0,0,0) 16.5px),
            repeating-linear-gradient(rgba(23,18,14,0) 0 26px, rgba(23,18,14,0.08) 26px 27px);
          /* the margin stripe runs the full height, but the ruled lines stop
             short so there is a genuine last line with clear paper under it */
          background-repeat: no-repeat, no-repeat;
          background-size: 100% 100%, 100% calc(100% - 36px);
          color: ${INK};
          border-radius: 4px 8px 8px 4px;
          padding: 16px 44px 36px 28px;
          transform: rotate(-1.2deg);
          box-shadow: 0 6px 24px rgba(0,0,0,0.5);
          animation: fadeUp 0.8s ease both;
        }
        .chit::before {
          content: "";
          position: absolute;
          top: 6px; left: 50%;
          width: 6px; height: 6px;
          margin-left: -3px;
          border-radius: 50%;
          background: rgba(23,18,14,0.5);
          box-shadow: inset 0 1px 1px rgba(0,0,0,0.6);
        }
        .chit-body { flex: 1; min-width: 0; }
        .chit-k {
          font-family: 'Familjen Grotesk', sans-serif;
          font-size: 10px;
          letter-spacing: 0.08em;
          color: #7a6a52;
          margin-bottom: 3px;
        }
        .chit-name {
          font-family: 'Kalam', cursive;
          font-weight: 700;
          font-size: clamp(22px, 3vw, 34px);
          line-height: 1.15;
          color: ${INK};
        }
        .chit-area {
          font-family: 'Familjen Grotesk', sans-serif;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #7a6a52;
          margin-top: 5px;
        }
        .chit-note {
          font-family: 'Kalam', cursive;
          font-size: 13.5px;
          color: #4a3a28;
          margin-top: 6px;
          line-height: 1.4;
        }
        /* arrows drawn on the paper in pen — no chrome, just ink strokes */
        .chit-arrow {
          position: absolute;
          padding: 4px;
          border: none;
          background: transparent;
          color: ${CLAY};
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font: inherit;
          transition: transform 0.2s ease, color 0.2s ease;
        }
        .chit-arrow:hover { color: #8f3f1f; }
        .chit-next {
          right: 12px;
          top: 50%;
          transform: translateY(-50%) rotate(-2deg);
        }
        .chit-next:hover { transform: translateY(-50%) rotate(-2deg) scale(1.12); }
        .chit-open {
          left: 50%;
          bottom: 6px;
          transform: translateX(-50%) rotate(2deg);
        }
        .chit-open:hover { transform: translateX(-50%) rotate(2deg) scale(1.12); }
        @keyframes fadeUp {
          from { opacity: 0; transform: rotate(-1.2deg) translateY(10px); }
          to   { opacity: 1; transform: rotate(-1.2deg) translateY(0); }
        }

        .pills {
          display: flex;
          gap: 5px;
          background: rgba(23,18,14,0.5);
          backdrop-filter: blur(7px);
          -webkit-backdrop-filter: blur(7px);
          padding: 5px;
          border-radius: 999px;
          border: 1px solid rgba(237,226,203,0.14);
        }
        .pill {
          font: inherit;
          font-family: 'Familjen Grotesk', sans-serif;
          font-size: 14px;
          padding: 8px 15px;
          border-radius: 999px;
          border: none;
          cursor: pointer;
          color: ${PAPER};
          background: transparent;
          transition: background 0.3s ease, color 0.3s ease;
        }
        .pill:hover { background: rgba(237,226,203,0.1); }
        .pill.on { background: ${RED}; color: ${PAPER}; }
        .pill.on:hover { background: ${RED}; }

        .player {
          position: fixed;
          top: 18px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 30;
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(23,18,14,0.55);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(237,226,203,0.15);
          border-radius: 999px;
          padding: 8px 8px 8px 10px;
          width: min(548px, 92vw);
        }
        .player-btn-wrap { position: relative; flex-shrink: 0; }
        .player-btn {
          width: 42px; height: 42px;
          border-radius: 50%;
          border: none;
          background: ${RED};
          color: ${PAPER};
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font: inherit;
          font-size: 13px;
          transition: transform 0.2s ease;
        }
        .player-btn:hover:enabled { transform: scale(1.06); }
        .player-btn:disabled { opacity: 0.5; cursor: default; }

        .pbtn-side {
          width: 32px; height: 32px;
          flex-shrink: 0;
          border-radius: 50%;
          border: none;
          background: transparent;
          color: rgba(237,226,203,0.8);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font: inherit;
          transition: background 0.2s ease, color 0.2s ease;
        }
        .pbtn-side:hover:enabled { background: rgba(237,226,203,0.12); color: ${PAPER}; }
        .pbtn-side:disabled { opacity: 0.4; cursor: default; }

        .player-text { flex: 1; min-width: 0; }

        .player-art {
          width: 54px; height: 54px;
          flex-shrink: 0;
          margin-left: auto;
          border-radius: 50%;
          background-color: rgba(237,226,203,0.08);
          background-size: cover;
          background-position: center;
          border: 1.5px solid rgba(183,21,30,0.9);
          box-shadow: 0 2px 10px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(237,226,203,0.6);
          font-size: 17px;
        }
        .player-art.spin { animation: artSpin 9s linear infinite; }
        @keyframes artSpin { to { transform: rotate(360deg); } }
        .player-song {
          font-family: 'Familjen Grotesk', sans-serif;
          font-weight: 600;
          font-size: 12.5px;
          color: ${PAPER};
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .player-artist {
          font-family: 'Familjen Grotesk', sans-serif;
          font-size: 10.5px;
          color: ${STEEL};
          margin-top: 1px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .steam {
          position: absolute;
          left: 50%;
          bottom: calc(100% - 4px);
          width: 5px; height: 14px;
          border-radius: 50%;
          background: rgba(237,226,203,0.4);
          filter: blur(2.5px);
          pointer-events: none;
        }
        .steam-1 { animation: steamRise 2.8s ease-out infinite; }
        .steam-2 { animation: steamRise 3.6s ease-out 1.4s infinite; margin-left: -7px; }
        @keyframes steamRise {
          0%   { opacity: 0; transform: translate(-50%, 4px) scale(0.7); }
          30%  { opacity: 0.55; }
          100% { opacity: 0; transform: translate(calc(-50% + 6px), -18px) scale(1.35); }
        }

        .credit {
          position: fixed;
          left: 18px;
          top: 16px;
          z-index: 20;
          display: block;
          opacity: 0.92;
          transition: opacity 0.25s ease, transform 0.25s ease;
        }
        .credit:hover { opacity: 1; transform: scale(1.04); }
        .credit img {
          display: block;
          height: 39px;
          width: auto;
          filter: drop-shadow(0 1px 7px rgba(0,0,0,0.75));
        }

        .controls-br {
          position: fixed;
          right: 18px;
          bottom: 18px;
          z-index: 20;
          display: flex;
          gap: 8px;
          align-items: center;
        }

        button:focus-visible, [role="radio"]:focus-visible {
          outline: 2px solid ${RED_LIT};
          outline-offset: 2px;
        }

        /* ---------- responsive ---------- */

        @media (max-width: 780px) {
          /* the top-centre player crowds the corner credit */
          .credit { display: none; }
        }
        @media (max-width: 900px) {
          .player { top: 12px; width: min(548px, 94vw); }
          /* pills tuck under the player's right edge, stacked */
          .controls-br {
            right: 12px;
            bottom: auto;
            top: 82px;
            flex-direction: column;
            align-items: flex-end;
          }
        }
        @media (max-width: 640px) {
          .pill { font-size: 12px; padding: 6px 10px; }
          .player-art { width: 46px; height: 46px; }
          .player-btn { width: 38px; height: 38px; }
          .chit {
            left: 16px;
            bottom: 16px;
            width: min(360px, calc(100vw - 32px));
            padding: 12px 40px 32px 24px;
          }
          .chit-note { display: none; }
        }

        /* ---------- reduced motion ---------- */

        @media (prefers-reduced-motion: reduce) {
          .kb, .rain-layer, .rain-flash, .wash, .scene-in,
          .chit, .steam, .player-art.spin { animation: none !important; }
          .wash { opacity: 0; }
          * { transition-duration: 0.01ms !important; }
        }
      `}</style>

      <div className="stage grain vignette">
        {hydrated && (
          <>
            <div
              className="kb"
              style={{ filter: rainOn ? RAIN_FILTER : "none" }}
            >
              {prev && (
                <Scene
                  tapri={prev}
                  state={state}
                  nightAmt={Math.min(1, state.night + (rainOn ? 0.3 : 0))}
                />
              )}
              <Scene
                key={active.id}
                tapri={active}
                state={state}
                nightAmt={Math.min(1, state.night + (rainOn ? 0.3 : 0))}
                entering={!!prev}
              />
            </div>

            {STATES.map((s) => (
              <div
                key={`${s.key}-tint`}
                className="grade"
                style={{
                  background: s.tint,
                  mixBlendMode: s.tintBlend,
                  opacity: s.key === stateKey ? 1 : 0,
                }}
              />
            ))}
            {STATES.map((s) => (
              <div
                key={`${s.key}-light`}
                className="grade"
                style={{
                  background: s.light,
                  mixBlendMode: "screen",
                  opacity: s.key === stateKey ? 1 : 0,
                }}
              />
            ))}
            <div
              className="grade"
              style={{
                background: RAIN_TINT,
                mixBlendMode: "multiply",
                opacity: rainOn ? 1 : 0,
              }}
            />

            <RainBlock on={rainOn} tapri={active} />
            <div className="scrim" />
            {wash.key > 0 && (
              <div key={wash.key} className="wash" style={{ background: wash.bg }} />
            )}
          </>
        )}
      </div>

      <a
        className="credit"
        href="https://www.instagram.com/maaef.afterhours"
        target="_blank"
        rel="noreferrer"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/afterhours-logo.svg" alt="Maaef Afterhours" />
      </a>

      <div className="controls-br">
        <div role="radiogroup" aria-label="waqt" className="pills">
          {STATES.map((s) => (
            <button
              key={s.key}
              role="radio"
              aria-checked={s.key === stateKey}
              title={s.hint}
              onClick={() => changeState(s.key)}
              className={`pill${s.key === stateKey ? " on" : ""}`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="pills">
          <button
            aria-pressed={rainOn}
            title="rain"
            onClick={toggleRain}
            className={`pill${rainOn ? " on" : ""}`}
          >
            बारिश
          </button>
        </div>
      </div>

      {/* hidden while the register is open; remounts with its fade-up
          entrance when the register closes */}
      {!drawerOpen && (
      <div className="chit" key={active.id}>
        <div className="chit-body">
          <div className="chit-k">गेड़ी रजिस्टर</div>
          <div className="chit-name">{active.name}</div>
          <div className="chit-area">{active.area}</div>
          <div className="chit-note">{active.note}</div>
        </div>
        <button
          className="chit-arrow chit-next"
          onClick={nextTapri}
          aria-label="agli tapri"
          title="agli tapri"
        >
          <svg width="20" height="30" viewBox="0 0 20 30" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5.5 3.5 C 9 8.5, 12.5 12, 15 15.2 C 12 18.2, 8.5 22.5, 5 27" />
          </svg>
        </button>
        <button
          className="chit-arrow chit-open"
          onClick={() => setDrawerOpen(true)}
          aria-haspopup="dialog"
          aria-label="register kholo — tapri chuno"
          title="register kholo"
        >
          <svg width="30" height="20" viewBox="0 0 30 20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3.5 5 C 8.5 8.5, 12 12, 15.2 15 C 18.2 12, 22.5 8.5, 27 4.5" />
          </svg>
        </button>
      </div>
      )}

      <MusicPlayer />

      <RegisterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeId={activeId}
        onSelect={selectTapri}
      />
    </div>
  );
}
