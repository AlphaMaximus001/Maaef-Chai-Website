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
    name: "Ashfaq Tea and Lassi Corner",
    area: "Hussainabad",
    maps: "https://maps.app.goo.gl/LZ9URVi2EE9cwoxE6",
    coords: null,
    note: "purani Lucknow ka ek kona, subah subah bhaap uthti hai.",
  },
  {
    id: "keval",
    name: "Kewal Tea Centre",
    area: "Makbara Road, Hazratganj",
    maps: "https://maps.app.goo.gl/bXYnZ4kxY5tS3M5NA",
    coords: [26.8499576, 80.9407454],
    note: "chhoti si dukaan, lambi line — waise hi chalta aaya hai.",
  },
  {
    id: "shukla",
    name: "Shukla Tea Stall",
    area: "Hazratganj",
    maps: "https://maps.app.goo.gl/hYrkS7TGLb4Jp6VR8",
    coords: null,
    note: "Ganj ki bheed ke beech, ek kulhad thaam lo, sab thehar jaata hai.",
  },
  {
    id: "sharma",
    name: "Sharma Ji Ki Chai",
    area: "T.N. Road, Lalbagh",
    maps: "https://maps.app.goo.gl/HqbzZF4Afw2EGAcq6",
    coords: [26.8477398, 80.9406583],
    note: "office jaate waqt ka thehraav, roz ka rasta yahin se hoke.",
  },
  {
    id: "globe",
    name: "Globe Cafe",
    area: "Meergunj",
    maps: "https://maps.app.goo.gl/vBdAyJxSw1Hxqi6N8",
    coords: [26.8401179, 80.9376781],
    note: "purana naam, purana kaam — chai wahi, andaaz wahi.",
  },
  {
    id: "raj",
    name: "Raj Coffee Corner",
    area: "Rana Pratap Marg",
    maps: "https://maps.app.goo.gl/QcSHa65ujidLPGgS8",
    coords: [26.8520149, 80.9545227],
    note: "naam mein coffee hai, dil chai mein hai.",
  },
  {
    id: "satyam",
    name: "System Chai Centre",
    area: "Vipul Khand, Gomti Nagar",
    maps: "https://maps.app.goo.gl/bDGEcYM1oBTSPLsq8",
    coords: null,
    note: "shaam ka adda, gate ke bahar ka table.",
  },
  {
    id: "sonu",
    name: "Sonu Tea Stall",
    area: "Vipin Khand, Gomti Nagar",
    maps: "https://maps.app.goo.gl/x6mYiWaV1qFBuqHp6",
    coords: [26.8666409, 80.997157],
    note: "mohalle wali chai, sabko naam se pehchaanta hai.",
  },
  {
    id: "nukkad",
    name: "Nukkad Cafe",
    area: "Gomti Nagar",
    maps: "https://maps.app.goo.gl/tXrGMVrnjc22fm17A",
    coords: null,
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

const PLAYLIST_ID = "PLa628Dr7zxEg";
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

/*
 * Google Maps link for a tapri. `maps` holds the owner-verified share
 * link, which opens the actual place page rather than a bare coordinate;
 * the name + area search is only a fallback if one is ever missing.
 */
function mapsHref(t) {
  if (t.maps) return t.maps;
  const q = encodeURIComponent(`${t.name}, ${t.area}, Lucknow`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

/*
 * Nearest-tapri lookup. Great-circle distance, and a radius gate: the nine
 * stalls are all in Lucknow, so for a visitor anywhere else the "nearest"
 * one is just whichever edge of the city faces them — meaningless. Beyond
 * NEAR_KM we decline to guess rather than open an arbitrary stall.
 * Inert until the coords below are filled in.
 */
const NEAR_KM = 60;

function distanceKm(a, b) {
  const R = 6371;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b[0] - a[0]);
  const dLon = rad(b[1] - a[1]);
  const la1 = rad(a[0]);
  const la2 = rad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function nearestTapri(here) {
  let best = null;
  let bestKm = Infinity;
  for (const t of TAPRIS) {
    if (!hasCoords(t)) continue;
    const km = distanceKm(here, t.coords);
    if (km < bestKm) {
      bestKm = km;
      best = t;
    }
  }
  if (!best || bestKm > NEAR_KM) return null;
  return { tapri: best, km: bestKm };
}

/*
 * Every stall must be mapped before this runs. With only some of them
 * placed, the "closest" answer is confidently wrong for anyone standing
 * near an unmapped one — it would name a stall kilometres away while the
 * real nearest is across the street. Partial data is worse than none here.
 */
const hasCoords = (t) => Array.isArray(t.coords) && t.coords.length === 2;
const geoReady = () =>
  typeof navigator !== "undefined" &&
  !!navigator.geolocation &&
  TAPRIS.every(hasCoords);

/* heartbeat to /api/presence and report how many tabs are open right now.
   returns null whenever there is no real number to show */
function useViewerCount() {
  const [count, setCount] = useState(null);

  useEffect(() => {
    let sid;
    try {
      sid = sessionStorage.getItem("nautapri.sid");
      if (!sid) {
        sid =
          crypto.randomUUID?.() ??
          `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
        sessionStorage.setItem("nautapri.sid", sid);
      }
    } catch {
      sid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
    }

    let alive = true;
    let timer;

    async function beat() {
      clearTimeout(timer);
      if (!alive) return;
      if (document.hidden) {
        timer = setTimeout(beat, 12_000);
        return;
      }
      try {
        const res = await fetch("/api/presence", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: sid }),
        });
        const data = await res.json();
        if (alive) setCount(typeof data.count === "number" ? data.count : null);
      } catch {
        if (alive) setCount(null);
      }
      if (alive) timer = setTimeout(beat, 12_000);
    }

    beat();
    const onVisible = () => {
      if (!document.hidden) beat();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      alive = false;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return count;
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

function RegisterDrawer({ open, onClose, activeId, onSelect, onLocate, locating }) {
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
              display: "flex",
              alignItems: "baseline",
              gap: 8,
            }}
          >
            <span>nau tapri, nau adde</span>
            {onLocate && (
              <button className="reg-near" onClick={onLocate} disabled={locating}>
                {locating ? "dhoondh rahe hain…" : "sabse paas wali?"}
              </button>
            )}
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
  /* the bar shrinks to prev / thumbnail / next once the pointer has left it
     alone for a while; the thumbnail carries play-pause in that state */
  const [compact, setCompact] = useState(false);
  const idleRef = useRef(null);

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

  /* any attention on the bar wakes it and restarts the countdown */
  function poke() {
    setCompact((c) => (c ? false : c));
    clearTimeout(idleRef.current);
    idleRef.current = setTimeout(() => setCompact(true), 10_000);
  }

  useEffect(() => {
    idleRef.current = setTimeout(() => setCompact(true), 10_000);
    return () => clearTimeout(idleRef.current);
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
    <div
      className={`player${compact ? " compact" : ""}`}
      onPointerEnter={poke}
      onPointerMove={poke}
      onPointerDown={poke}
      onFocusCapture={poke}
    >
      <div ref={containerRef} style={{ width: 1, height: 1, overflow: "hidden" }} />
      <button
        className="pbtn-side pbtn-prev"
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
        className="pbtn-side pbtn-next"
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
      <button
        className={`player-art${playing && !compact ? " spin" : ""}`}
        onClick={toggle}
        disabled={!ready}
        aria-label={playing ? "pause" : "play"}
        style={
          track.videoId
            ? {
                backgroundImage: `url(https://i.ytimg.com/vi/${track.videoId}/mqdefault.jpg)`,
              }
            : undefined
        }
      >
        {!track.videoId && <span className="player-art-note">♪</span>}
        <span className="player-art-glyph">{playing ? "❚❚" : "▶"}</span>
      </button>
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
  const [rotateDismissed, setRotateDismissed] = useState(false);
  /* {id, km} when a stall was opened because it is the closest one */
  const [near, setNear] = useState(null);
  const [locating, setLocating] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const audioRef = useRef(null);
  const thunderTimersRef = useRef([]);
  const viewers = useViewerCount();

  useEffect(() => {
    let s;
    let firstVisit = false;
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
      // only on a first visit — a stall chosen last time outranks geography
      if (!savedTapri) firstVisit = true;
    } catch (e) {
      firstVisit = true;
    }
    setStateKey(s || detectStateFromIST());
    setHydrated(true);
    if (firstVisit) locate(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setNear((n) => (n && n.id !== id ? null : n));
    if (id !== activeId) {
      setPrevId(activeId);
      setActiveId(id);
    }
    setDrawerOpen(false);
  }

  /* ask the browser where we are and open the closest stall. Silent on
     refusal or timeout — a denied prompt must not disturb the page. */
  function locate(manual) {
    if (!geoReady()) return;
    if (manual) setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const hit = nearestTapri([pos.coords.latitude, pos.coords.longitude]);
        if (!hit) return; // too far from Lucknow to mean anything
        setNear({ id: hit.tapri.id, km: hit.km });
        selectTapri(hit.tapri.id);
      },
      () => setLocating(false),
      { timeout: 8000, maximumAge: 10 * 60 * 1000, enableHighAccuracy: false }
    );
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

        /* --u is the scaling unit: exactly 1px at the 1400x850 desktop
           reference, falling off with the square root of viewport area so
           chrome keeps the same share of the screen as it shrinks.
           (0.0357vw + 0.0588vh tracks sqrt(area) to within ~1% at ordinary
           aspect ratios.) Every chrome dimension below is a multiple of it. */
        :root {
          --u: clamp(0.36px, calc(0.0357vw + 0.0588vh), 1.08px);
          /* control sizes carry pixel floors so tap targets survive on
             small screens; the collapsed bar width is built from them */
          --btn-main: max(34px, calc(42 * var(--u)));
          --btn-side: max(26px, calc(32 * var(--u)));
          --art:      max(30px, calc(54 * var(--u)));
          --pgap:     calc(8 * var(--u));
        }

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
          left: calc(22 * var(--u));
          bottom: calc(24 * var(--u));
          z-index: 20;
          display: flex;
          gap: calc(10 * var(--u));
          align-items: stretch;
          /* vmin, not vw: on a landscape phone the scarce axis is height,
             and width-only sizing made this fill the screen */
          /* the 64vw cap only bites on a narrow portrait screen, where
             holding the area share would otherwise make this too wide */
          width: min(calc(460 * var(--u)), 64vw, calc(100vw - 44px));
          font-family: 'Kalam', cursive;
          background: ${PAPER};
          background-image:
            linear-gradient(90deg, rgba(0,0,0,0) 15px, rgba(180,85,47,0.55) 15px, rgba(180,85,47,0.55) 16.5px, rgba(0,0,0,0) 16.5px),
            repeating-linear-gradient(rgba(23,18,14,0) 0 26px, rgba(23,18,14,0.08) 26px 27px);
          /* the margin stripe runs the full height, but the ruled lines stop
             short so there is a genuine last line with clear paper under it */
          background-repeat: no-repeat, no-repeat;
          background-size: 100% 100%, 100% calc(100% - 36 * var(--u));
          color: ${INK};
          border-radius: 4px 8px 8px 4px;
          padding: calc(16 * var(--u)) calc(44 * var(--u))
                   calc(36 * var(--u)) calc(28 * var(--u));
          transform: rotate(-1.2deg);
          box-shadow: 0 6px 24px rgba(0,0,0,0.5);
          animation: fadeUp 0.8s ease both;
        }
        .chit::before {
          content: "";
          position: absolute;
          top: calc(6 * var(--u)); left: 50%;
          width: calc(6 * var(--u)); height: calc(6 * var(--u));
          margin-left: calc(-3 * var(--u));
          border-radius: 50%;
          background: rgba(23,18,14,0.5);
          box-shadow: inset 0 1px 1px rgba(0,0,0,0.6);
        }
        .chit-body { flex: 1; min-width: 0; }
        .chit-k {
          font-family: 'Familjen Grotesk', sans-serif;
          font-size: max(8px, calc(10 * var(--u)));
          letter-spacing: 0.08em;
          color: #7a6a52;
          margin-bottom: 3px;
        }
        .chit-name {
          font-family: 'Kalam', cursive;
          font-weight: 700;
          font-size: max(14px, calc(34 * var(--u)));
          line-height: 1.14;
          color: ${INK};
        }
        /* map pin, sized off the stall name so it scales with it */
        .chit-lastword { white-space: nowrap; }
        .chit-pin {
          display: inline-block;
          width: 0.5em;
          height: 0.66em;
          margin-left: 0.26em;
          color: ${RED};
          opacity: 0.9;
          transition: transform 0.2s ease, opacity 0.2s ease;
        }
        .chit-pin svg { display: block; width: 100%; height: 100%; }
        .chit-pin:hover { opacity: 1; transform: translateY(-2px); }

        .chit-area {
          font-family: 'Familjen Grotesk', sans-serif;
          font-size: max(8.5px, calc(11 * var(--u)));
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #7a6a52;
          margin-top: 5px;
        }
        .chit-near { color: ${CLAY}; margin-left: 4px; letter-spacing: 0.06em; }
        .reg-near {
          font: inherit;
          font-family: 'Familjen Grotesk', sans-serif;
          font-size: 11px;
          color: ${CLAY};
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(180,85,47,0.45);
          padding: 0 0 1px;
          cursor: pointer;
        }
        .reg-near:disabled { opacity: 0.55; cursor: default; }

        .chit-note {
          font-family: 'Kalam', cursive;
          font-size: max(10.5px, calc(13.5 * var(--u)));
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
          color: ${INK};
          opacity: 0.72;      /* ink sitting in the paper, not printed on it */
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font: inherit;
          transition: transform 0.2s ease, opacity 0.2s ease;
        }
        .chit-arrow:hover { opacity: 0.95; }
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
          gap: max(3px, calc(5 * var(--u)));
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
          font-size: max(11px, calc(14 * var(--u)));
          padding: max(5px, calc(8 * var(--u))) max(9px, calc(15 * var(--u)));
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
          top: calc(18 * var(--u));
          left: 50%;
          transform: translateX(-50%);
          z-index: 30;
          display: flex;
          align-items: center;
          gap: var(--pgap);
          background: rgba(23,18,14,0.55);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(237,226,203,0.15);
          border-radius: 999px;
          padding: calc(8 * var(--u)) calc(8 * var(--u))
                   calc(8 * var(--u)) calc(10 * var(--u));
          width: min(calc(548 * var(--u)), 94vw);
          transition: width 0.4s cubic-bezier(.2,.8,.25,1);
        }
        .player-btn-wrap { position: relative; flex-shrink: 0; }
        .player-btn {
          width: var(--btn-main);
          height: var(--btn-main);
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
          width: var(--btn-side);
          height: var(--btn-side);
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
          width: var(--art);
          height: var(--art);
          position: relative;
          padding: 0;
          cursor: pointer;
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
          font-size: max(10.5px, calc(12.5 * var(--u)));
          color: ${PAPER};
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .player-artist {
          font-family: 'Familjen Grotesk', sans-serif;
          font-size: max(8.5px, calc(10.5 * var(--u)));
          color: ${STEEL};
          margin-top: 1px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ---- collapsed bar: prev / thumbnail / next ---- */
        .player.compact {
          width: calc(
            calc(10 * var(--u)) + var(--btn-side) + var(--pgap) +
            var(--art) + var(--pgap) + var(--btn-side) + calc(8 * var(--u))
          );
        }
        .player.compact .player-btn-wrap,
        .player.compact .player-text { display: none; }
        /* the thumbnail takes the middle slot between the two skips */
        .player.compact .pbtn-prev { order: 1; }
        .player.compact .player-art  { order: 2; margin-left: 0; }
        .player.compact .pbtn-next   { order: 3; }

        .player-art-glyph {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-size: max(10px, calc(13 * var(--u)));
          color: ${PAPER};
          background: rgba(23,18,14,0.42);
          text-shadow: 0 1px 3px rgba(0,0,0,0.8);
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }
        .player.compact .player-art-glyph { opacity: 1; }
        .player-art:hover .player-art-glyph { opacity: 1; }
        .player-art-note { font-size: max(12px, calc(17 * var(--u))); }

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
          height: max(22px, calc(39 * var(--u)));
          width: auto;
          filter: drop-shadow(0 1px 7px rgba(0,0,0,0.75));
        }

        .viewers {
          position: fixed;
          right: 20px;
          top: 22px;
          z-index: 20;
          display: flex;
          align-items: center;
          gap: 7px;
          font-family: 'Familjen Grotesk', sans-serif;
          font-size: max(9.5px, calc(11 * var(--u)));
          letter-spacing: 0.04em;
          font-weight: 500;
          color: rgba(237,226,203,0.62);
          text-shadow: 0 1px 8px rgba(0,0,0,0.7);
          pointer-events: none;
        }
        /* paint the inverse of whatever sits behind, so the count stays
           legible over bright sky and dark night alike. white through a
           difference blend resolves to the negative of the backdrop. */
        @supports (mix-blend-mode: difference) {
          .viewers {
            color: #fff;
            mix-blend-mode: difference;
            text-shadow: none;
          }
          .viewers-dot { background: #fff; }
        }
        .viewers-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: ${RED_LIT};
          box-shadow: 0 0 0 0 rgba(227,59,51,0.55);
          animation: pulseDot 2.6s ease-out infinite;
        }
        @keyframes pulseDot {
          0%   { box-shadow: 0 0 0 0 rgba(227,59,51,0.5); }
          70%  { box-shadow: 0 0 0 7px rgba(227,59,51,0); }
          100% { box-shadow: 0 0 0 0 rgba(227,59,51,0); }
        }

        /* portrait phones and tablets: ask for landscape, but never trap
           anyone whose orientation is locked */
        .rotate-gate {
          display: none;
          position: fixed;
          inset: 0;
          z-index: 60;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 32px;
          text-align: center;
          background: rgba(17,13,10,0.94);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          color: ${PAPER};
        }
        @media (orientation: portrait) and (max-width: 1024px) and (pointer: coarse) {
          .rotate-gate { display: flex; }
          .rotate-gate.dismissed { display: none; }
        }
        .rotate-icon {
          width: 128px;
          height: 106px;
          color: ${PAPER};
          opacity: 0.85;
          margin-bottom: 14px;
          animation: rotateHint 3.4s ease-in-out infinite;
          transform-origin: 50% 50%;
        }
        @keyframes rotateHint {
          0%, 55%, 100% { transform: rotate(0deg); }
          72%, 88%      { transform: rotate(-12deg); }
        }
        .rotate-title {
          font-family: 'Rozha One', serif;
          font-size: 30px;
          letter-spacing: 0.01em;
        }
        .rotate-sub {
          font-family: 'Familjen Grotesk', sans-serif;
          font-size: 12px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(237,226,203,0.6);
          margin-top: 2px;
        }
        .rotate-skip {
          margin-top: 26px;
          font: inherit;
          font-family: 'Kalam', cursive;
          font-size: 13px;
          color: rgba(237,226,203,0.55);
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(237,226,203,0.3);
          padding: 2px 2px 3px;
          cursor: pointer;
        }
        .rotate-skip:hover { color: ${PAPER}; }

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

        /* ---------- responsive ----------
           Sizes above are vmin-based and already shrink with the smaller
           viewport edge. These rules only handle placement, and drop the
           lines that stop earning their space on a small screen. */

        @media (max-width: 780px) {
          /* the top-centre player crowds the corner credit */
          .credit { display: none; }
        }
        @media (max-width: 900px) {
          .player { top: 12px; }
          /* pills tuck under the player's right edge, stacked */
          .controls-br {
            right: 12px;
            bottom: auto;
            top: calc(clamp(31px, 5vmin, 42px) + clamp(10px, 1.9vmin, 16px) + 28px);
            flex-direction: column;
            align-items: flex-end;
          }
        }

        /* short viewport — a phone held landscape. Height is the scarce
           axis here, so shed the optional lines and tighten the margins. */
        @media (max-height: 460px) {
          .chit {
            left: 12px;
            bottom: 12px;
            border-radius: 3px 6px 6px 3px;
            background-image:
              linear-gradient(90deg, rgba(0,0,0,0) 10px, rgba(180,85,47,0.55) 10px, rgba(180,85,47,0.55) 11px, rgba(0,0,0,0) 11px),
              repeating-linear-gradient(rgba(23,18,14,0) 0 17px, rgba(23,18,14,0.08) 17px 18px);
          }
          .chit::before { width: 4px; height: 4px; margin-left: -2px; top: 4px; }
          .chit-k, .chit-note { display: none; }
          .chit-area { letter-spacing: 0.1em; margin-top: 3px; }
          .player { top: 8px; }
          .player-artist { display: none; }
          .controls-br { top: auto; bottom: 12px; right: 12px; flex-direction: row; }
          .viewers { top: 14px; right: 14px; }
        }

        /* narrow viewport — a phone held portrait */
        @media (max-width: 640px) {
          .chit {
            left: 14px;
            bottom: 14px;
            border-radius: 3px 6px 6px 3px;
            background-image:
              linear-gradient(90deg, rgba(0,0,0,0) 10px, rgba(180,85,47,0.55) 10px, rgba(180,85,47,0.55) 11px, rgba(0,0,0,0) 11px),
              repeating-linear-gradient(rgba(23,18,14,0) 0 17px, rgba(23,18,14,0.08) 17px 18px);
          }
          .chit::before { width: 4px; height: 4px; margin-left: -2px; top: 4px; }
          .chit-k, .chit-note { display: none; }
          .chit-area { letter-spacing: 0.1em; margin-top: 3px; }
          .viewers { display: none; }
        }

        /* ---------- reduced motion ---------- */

        @media (prefers-reduced-motion: reduce) {
          .kb, .rain-layer, .rain-flash, .wash, .scene-in,
          .chit, .steam, .player-art.spin,
          .viewers-dot { animation: none !important; }
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

      {viewers != null && viewers > 0 && (
        <div className="viewers" aria-live="polite">
          <span className="viewers-dot" />
          {viewers > 1 ? `${viewers} log tapri pe` : "abhi tum akele ho"}
        </div>
      )}

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
          <div className="chit-name">
            {/* the pin rides with the last word so it can never be
                left stranded alone on a wrapped line */}
            {active.name.split(" ").slice(0, -1).join(" ")}{" "}
            <span className="chit-lastword">
              {active.name.split(" ").slice(-1)[0]}
              <a
                className="chit-pin"
                href={mapsHref(active)}
                target="_blank"
                rel="noreferrer"
                aria-label={`${active.name} — map par dekho`}
                title="map par dekho"
              >
                <svg viewBox="0 0 24 32" fill="currentColor" fillRule="evenodd" aria-hidden="true">
                  <path d="M12.1 29.8 C 11.2 26.5, 8.9 23.4, 7.2 20.6 C 5.8 18.3, 5.0 16.3, 5.1 13.9 C 5.3 9.5, 8.4 6.0, 12.3 6.1 C 16.1 6.2, 19.1 9.6, 19.0 14.0 C 18.9 16.6, 17.9 18.7, 16.3 21.2 C 14.6 23.9, 12.8 26.7, 12.1 29.8 Z
                           M15.2 13.6 A 3.1 3.1 0 1 1 9.0 13.6 A 3.1 3.1 0 1 1 15.2 13.6 Z" />
                </svg>
              </a>
            </span>
          </div>
          <div className="chit-area">
            {active.area}
            {near && near.id === active.id && (
              <span className="chit-near">
                · aapke sabse paas{near.km >= 0.1 ? `, ${near.km.toFixed(1)} km` : ""}
              </span>
            )}
          </div>
          <div className="chit-note">{active.note}</div>
        </div>
        <button
          className="chit-arrow chit-next"
          onClick={nextTapri}
          aria-label="agli tapri"
          title="agli tapri"
        >
          {/* each arm is a thin full stroke with a heavier overlay through the
              middle — a pen lays down least ink where it lands and lifts */}
          <svg width="22" height="30" viewBox="0 0 22 30" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5.1 4.2 C 8.4 6.9, 11.4 9.7, 13.8 12.4 C 14.9 13.6, 15.8 14.7, 16.5 15.6" strokeWidth="1.2" />
            <path d="M6.4 5.5 C 9.0 7.7, 11.6 10.2, 14.0 12.7 C 14.7 13.5, 15.3 14.2, 15.8 14.8" strokeWidth="1.9" />
            <path d="M7.6 6.7 C 9.6 8.6, 11.7 10.7, 13.7 12.8" strokeWidth="2.6" />
            <path d="M16.8 14.9 C 13.2 18.6, 9.6 22.1, 6.2 25.4 C 5.6 26.0, 5.1 26.5, 4.6 26.9" strokeWidth="1.2" />
            <path d="M15.6 16.2 C 12.6 19.2, 9.5 22.2, 6.6 24.9" strokeWidth="1.8" />
            <path d="M14.4 17.4 C 12.0 19.8, 9.6 22.2, 7.4 24.3" strokeWidth="2.4" />
          </svg>
        </button>
        <button
          className="chit-arrow chit-open"
          onClick={() => setDrawerOpen(true)}
          aria-haspopup="dialog"
          aria-label="register kholo — tapri chuno"
          title="register kholo"
        >
          <svg width="30" height="22" viewBox="0 0 30 22" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4.2 5.1 C 6.9 8.4, 9.7 11.4, 12.4 13.8 C 13.6 14.9, 14.7 15.8, 15.6 16.5" strokeWidth="1.2" />
            <path d="M5.5 6.4 C 7.7 9.0, 10.2 11.6, 12.7 14.0 C 13.5 14.7, 14.2 15.3, 14.8 15.8" strokeWidth="1.9" />
            <path d="M6.7 7.6 C 8.6 9.6, 10.7 11.7, 12.8 13.7" strokeWidth="2.6" />
            <path d="M14.9 16.8 C 18.6 13.2, 22.1 9.6, 25.4 6.2 C 26.0 5.6, 26.5 5.1, 26.9 4.6" strokeWidth="1.2" />
            <path d="M16.2 15.6 C 19.2 12.6, 22.2 9.5, 24.9 6.6" strokeWidth="1.8" />
            <path d="M17.4 14.4 C 19.8 12.0, 22.2 9.6, 24.3 7.4" strokeWidth="2.4" />
          </svg>
        </button>
      </div>
      )}

      <MusicPlayer />

      <div className={`rotate-gate${rotateDismissed ? " dismissed" : ""}`} role="dialog" aria-label="phone ghumao">
        <svg className="rotate-icon" viewBox="0 0 120 100" fill="none" stroke="currentColor"
             strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {/* upright phone, and the same phone laid down */}
          <rect x="26" y="16" width="30" height="52" rx="5" strokeWidth="2.4" />
          <line x1="36" y1="62" x2="46" y2="62" strokeWidth="2.2" />
          <rect x="64" y="34" width="52" height="30" rx="5" strokeWidth="2.4" opacity="0.5" />
          <line x1="110" y1="43" x2="110" y2="53" strokeWidth="2.2" opacity="0.5" />
          {/* turning arrow */}
          <path d="M40 82 C 58 94, 84 92, 100 78" strokeWidth="2.2" />
          <path d="M94 71 C 97 74.5, 100 77, 103 78.4 C 99.6 80, 96.6 82.6, 94.2 85.6" strokeWidth="2.2" />
        </svg>
        <div className="rotate-title">phone ghumao</div>
        <div className="rotate-sub">rotate for a better experience</div>
        <button className="rotate-skip" onClick={() => setRotateDismissed(true)}>
          waise hi dekhna hai
        </button>
      </div>

      <RegisterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeId={activeId}
        onSelect={selectTapri}
        onLocate={geoReady() ? () => locate(true) : null}
        locating={locating}
      />
    </div>
  );
}
