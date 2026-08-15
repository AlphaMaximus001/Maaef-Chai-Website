"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/* ---------------------------------------------------------------------- */
/* config                                                                  */
/* ---------------------------------------------------------------------- */

const INK = "#17120E";
const PAPER = "#EDE2CB";
const CLAY = "#B4552F";
const AMBER = "#E8A33D";
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
    name: "Satyam Chai Wala",
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
/* rain — parallax streaks, drifting sheet, glass droplets, mist, thunder */
/* ---------------------------------------------------------------------- */

function RainBlock({ on }) {
  return (
    <div className={`rainblock${on ? " on" : ""}`} aria-hidden="true">
      <div className="rain-layer rain-sheet" />
      <div className="rain-layer rain-far" />
      <div className="rain-layer rain-near" />
      <div className="rain-glass" />
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
          top: 0,
          left: 0,
          bottom: 0,
          width: "min(360px, 88vw)",
          zIndex: 41,
          transform: open ? "translateX(0)" : "translateX(-104%)",
          transition: "transform 0.5s cubic-bezier(.2,.8,.25,1)",
          background: PAPER,
          boxShadow: "6px 0 30px rgba(0,0,0,0.4)",
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
            हिसाब रजिस्टर
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
                      background: AMBER,
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
          animation: kenburns 55s ease-in-out infinite alternate;
          transform-origin: 50% 60%;
          transition: filter 2s ease;
        }
        @keyframes kenburns {
          from { transform: scale(1.02); }
          to   { transform: scale(1.065); }
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

        /* streaks: varied lengths and widths in each tile, different angles and
           non-harmonic speeds per layer, so the fall never reads as one sheet */
        .rain-far {
          transform: rotate(9.5deg);
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='128' height='256'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='%23B9CCD8' stop-opacity='0'/><stop offset='0.3' stop-color='%23B9CCD8' stop-opacity='0.34'/><stop offset='0.7' stop-color='%23B9CCD8' stop-opacity='0.34'/><stop offset='1' stop-color='%23B9CCD8' stop-opacity='0'/></linearGradient></defs><g fill='url(%23g)'><rect x='10' y='20' width='1' height='52'/><rect x='34' y='150' width='1.1' height='78'/><rect x='56' y='58' width='0.9' height='44'/><rect x='78' y='180' width='1.1' height='64'/><rect x='99' y='6' width='1' height='86'/><rect x='118' y='114' width='0.9' height='50'/><rect x='45' y='96' width='1.1' height='70'/><rect x='22' y='206' width='1' height='46'/><rect x='88' y='118' width='0.9' height='40'/></g></svg>");
          background-size: 96px 192px;
          opacity: 0.55;
          filter: blur(0.6px);
          animation-name: rainfall-far;
          animation-duration: 2.1s;
        }
        @keyframes rainfall-far { to { background-position: 0 192px; } }

        .rain-near {
          transform: rotate(12.5deg);
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='128' height='256'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='%23B9CCD8' stop-opacity='0'/><stop offset='0.3' stop-color='%23B9CCD8' stop-opacity='0.4'/><stop offset='0.7' stop-color='%23B9CCD8' stop-opacity='0.4'/><stop offset='1' stop-color='%23B9CCD8' stop-opacity='0'/></linearGradient></defs><g fill='url(%23g)'><rect x='18' y='12' width='1.6' height='96'/><rect x='58' y='112' width='1.8' height='128'/><rect x='96' y='44' width='1.5' height='76'/><rect x='118' y='150' width='1.7' height='104'/><rect x='38' y='204' width='1.5' height='50'/></g></svg>");
          background-size: 170px 340px;
          opacity: 0.55;
          filter: blur(0.4px);
          animation-name: rainfall-near;
          animation-duration: 0.95s;
        }
        @keyframes rainfall-near { to { background-position: 0 340px; } }

        /* droplets stuck to the glass, like a train window */
        .rain-glass {
          position: absolute; inset: 0;
          pointer-events: none;
          background-image:
            url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'><defs><radialGradient id='d' cx='0.35' cy='0.3' r='0.75'><stop offset='0' stop-color='%23FFFFFF' stop-opacity='0.5'/><stop offset='0.35' stop-color='%23DCE8F0' stop-opacity='0.16'/><stop offset='0.8' stop-color='%239FB4C2' stop-opacity='0.04'/><stop offset='1' stop-color='%23FFFFFF' stop-opacity='0.22'/></radialGradient></defs><g fill='url(%23d)'><ellipse cx='28' cy='40' rx='3.2' ry='4'/><ellipse cx='70' cy='22' rx='2.2' ry='2.8'/><ellipse cx='120' cy='58' rx='4' ry='5'/><ellipse cx='176' cy='30' rx='2.6' ry='3.2'/><ellipse cx='220' cy='84' rx='3' ry='3.8'/><ellipse cx='44' cy='110' rx='2' ry='2.5'/><ellipse cx='96' cy='140' rx='3.4' ry='4.2'/><ellipse cx='150' cy='120' rx='2.4' ry='3'/><ellipse cx='204' cy='160' rx='4.4' ry='5.4'/><ellipse cx='30' cy='190' rx='2.8' ry='3.4'/><ellipse cx='86' cy='214' rx='2.2' ry='2.7'/><ellipse cx='140' cy='196' rx='3.6' ry='4.4'/><ellipse cx='198' cy='228' rx='2.4' ry='3'/><ellipse cx='240' cy='200' rx='2' ry='2.6'/><ellipse cx='12' cy='240' rx='3' ry='3.7'/><ellipse cx='60' cy='60' rx='1.8' ry='2.2'/><ellipse cx='160' cy='70' rx='1.9' ry='2.4'/><ellipse cx='110' cy='90' rx='2.1' ry='2.6'/></g></svg>"),
            url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'><defs><radialGradient id='d' cx='0.35' cy='0.3' r='0.75'><stop offset='0' stop-color='%23FFFFFF' stop-opacity='0.5'/><stop offset='0.35' stop-color='%23DCE8F0' stop-opacity='0.16'/><stop offset='0.8' stop-color='%239FB4C2' stop-opacity='0.04'/><stop offset='1' stop-color='%23FFFFFF' stop-opacity='0.22'/></radialGradient></defs><g fill='url(%23d)'><ellipse cx='28' cy='40' rx='3.2' ry='4'/><ellipse cx='70' cy='22' rx='2.2' ry='2.8'/><ellipse cx='120' cy='58' rx='4' ry='5'/><ellipse cx='176' cy='30' rx='2.6' ry='3.2'/><ellipse cx='220' cy='84' rx='3' ry='3.8'/><ellipse cx='44' cy='110' rx='2' ry='2.5'/><ellipse cx='96' cy='140' rx='3.4' ry='4.2'/><ellipse cx='150' cy='120' rx='2.4' ry='3'/><ellipse cx='204' cy='160' rx='4.4' ry='5.4'/><ellipse cx='30' cy='190' rx='2.8' ry='3.4'/><ellipse cx='86' cy='214' rx='2.2' ry='2.7'/><ellipse cx='140' cy='196' rx='3.6' ry='4.4'/><ellipse cx='198' cy='228' rx='2.4' ry='3'/><ellipse cx='240' cy='200' rx='2' ry='2.6'/><ellipse cx='12' cy='240' rx='3' ry='3.7'/><ellipse cx='60' cy='60' rx='1.8' ry='2.2'/><ellipse cx='160' cy='70' rx='1.9' ry='2.4'/><ellipse cx='110' cy='90' rx='2.1' ry='2.6'/></g></svg>");
          background-size: 256px 256px, 407px 407px;
          background-position: 0 0, 130px 90px;
          opacity: 0.5;
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

        .slip {
          position: relative;
          font-family: 'Kalam', cursive;
          background: ${PAPER};
          background-image:
            linear-gradient(90deg, rgba(0,0,0,0) 13px, rgba(180,85,47,0.55) 13px, rgba(180,85,47,0.55) 14.5px, rgba(0,0,0,0) 14.5px),
            repeating-linear-gradient(rgba(23,18,14,0) 0 15px, rgba(23,18,14,0.08) 15px 16px);
          color: ${INK};
          border: none;
          border-radius: 3px 7px 7px 3px;
          padding: 12px 16px 10px 24px;
          cursor: pointer;
          text-align: left;
          transform: rotate(-1.6deg);
          box-shadow: 0 4px 16px rgba(0,0,0,0.45);
          transition: transform 0.25s ease;
          max-width: 230px;
          font: inherit;
          font-family: 'Kalam', cursive;
        }
        .slip:hover { transform: rotate(0deg) scale(1.02); }
        .slip::before {
          content: "";
          position: absolute;
          top: 5px; left: 50%;
          width: 5px; height: 5px;
          margin-left: -3px;
          border-radius: 50%;
          background: rgba(23,18,14,0.5);
          box-shadow: inset 0 1px 1px rgba(0,0,0,0.6);
        }
        .slip-k {
          display: block;
          font-family: 'Familjen Grotesk', sans-serif;
          font-size: 10px;
          color: #7a6a52;
          margin-bottom: 1px;
        }
        .slip-name {
          display: block;
          font-size: 15px;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
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
          font-size: 13px;
          padding: 6px 12px;
          border-radius: 999px;
          border: none;
          cursor: pointer;
          color: ${PAPER};
          background: transparent;
          transition: background 0.3s ease, color 0.3s ease;
        }
        .pill:hover { background: rgba(237,226,203,0.1); }
        .pill.on { background: ${AMBER}; color: ${INK}; }
        .pill.on:hover { background: ${AMBER}; }

        .stall-info {
          position: fixed;
          left: 22px;
          bottom: 92px;
          z-index: 20;
          max-width: min(520px, 78vw);
          pointer-events: none;
          animation: fadeUp 0.9s ease both;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .stall-name {
          font-family: 'Rozha One', serif;
          font-size: clamp(26px, 4.2vw, 42px);
          line-height: 1.08;
          color: ${PAPER};
          text-shadow: 0 2px 16px rgba(0,0,0,0.6);
        }
        .stall-area {
          font-family: 'Familjen Grotesk', sans-serif;
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(237,226,203,0.72);
          margin-top: 6px;
          text-shadow: 0 1px 8px rgba(0,0,0,0.6);
        }
        .stall-note {
          font-family: 'Kalam', cursive;
          font-size: 14px;
          color: rgba(237,226,203,0.78);
          margin-top: 4px;
          max-width: 400px;
          text-shadow: 0 1px 8px rgba(0,0,0,0.6);
        }

        .player {
          position: fixed;
          bottom: 18px;
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
          background: ${AMBER};
          color: ${INK};
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
          border: 1.5px solid rgba(232,163,61,0.85);
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
          right: 18px;
          bottom: 18px;
          z-index: 20;
          font-family: 'Familjen Grotesk', sans-serif;
          font-size: 10px;
          color: rgba(147,160,166,0.6);
          text-decoration: none;
          letter-spacing: 0.06em;
        }
        .credit:hover { color: rgba(237,226,203,0.8); }

        button:focus-visible, [role="radio"]:focus-visible {
          outline: 2px solid ${AMBER};
          outline-offset: 2px;
        }

        /* ---------- responsive ---------- */

        @media (max-width: 640px) {
          .top-bar { padding: 12px !important; }
          .pill { font-size: 11.5px; padding: 5px 9px; }
          .player-art { width: 46px; height: 46px; }
          .player-btn { width: 38px; height: 38px; }
          .slip { padding: 10px 12px 8px 20px; max-width: 160px; }
          .stall-info { left: 16px; bottom: 88px; }
        }
        @media (max-width: 560px) {
          .slip-name { display: none; }
          .slip { max-width: none; }
          .credit { display: none; }
        }

        /* ---------- reduced motion ---------- */

        @media (prefers-reduced-motion: reduce) {
          .kb, .rain-layer, .rain-flash, .wash, .scene-in,
          .stall-info, .steam, .player-art.spin { animation: none !important; }
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

            <RainBlock on={rainOn} />
            <div className="scrim" />
            {wash.key > 0 && (
              <div key={wash.key} className="wash" style={{ background: wash.bg }} />
            )}
          </>
        )}
      </div>

      <div
        className="top-bar"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: 18,
        }}
      >
        <button
          className="slip"
          onClick={() => setDrawerOpen(true)}
          aria-haspopup="dialog"
          aria-label="register kholo — tapri chuno"
        >
          <span className="slip-k">रजिस्टर खोलो</span>
          <span className="slip-name">{active.name}</span>
        </button>

        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
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
      </div>

      <div className="stall-info" key={active.id}>
        <div className="stall-name">{active.name}</div>
        <div className="stall-area">{active.area}</div>
        <div className="stall-note">{active.note}</div>
      </div>

      <MusicPlayer />

      <a
        className="credit"
        href="https://instagram.com/maaef.media"
        target="_blank"
        rel="noreferrer"
      >
        @maaef.media
      </a>

      <RegisterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeId={activeId}
        onSelect={selectTapri}
      />
    </div>
  );
}
