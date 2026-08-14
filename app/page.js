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

const STATES = [
  { key: "subah", label: "सुबह", plate: "day", filter: "brightness(1.04) saturate(0.96) sepia(0.06) hue-rotate(-6deg)" },
  { key: "dopahar", label: "दोपहर", plate: "day", filter: "brightness(1.1) contrast(1.03) saturate(1.05)" },
  { key: "shaam", label: "शाम", plate: "day", filter: "brightness(0.92) saturate(1.15) sepia(0.18) hue-rotate(-8deg)" },
  { key: "raat", label: "रात", plate: "night", filter: "brightness(0.98) saturate(1.05) contrast(1.05)" },
  { key: "baarish", label: "बारिश", plate: "day", filter: "brightness(0.8) contrast(0.94) saturate(0.55) hue-rotate(4deg)" },
];

const PLAYLIST_ID = "PLJwtI1xb0Z_YSjwpW6zQVQkr6TWb_7GRP";
const LS_TAPRI = "nautapri.tapri";
const LS_STATE = "nautapri.state";

function detectStateFromIST() {
  const ist = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );
  const h = ist.getHours();
  if (h >= 5 && h < 11) return "subah";
  if (h >= 11 && h < 16) return "dopahar";
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
/* image with graceful fallback to placeholder                            */
/* ---------------------------------------------------------------------- */

function Plate({ tapri, plate, active, filter }) {
  const [broken, setBroken] = useState(false);
  const src = `/tapris/${tapri.id}-${plate}.jpeg`;

  useEffect(() => {
    setBroken(false);
  }, [src]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: active ? 1 : 0,
        transition: "opacity 1.4s ease",
        filter,
      }}
      aria-hidden={!active}
    >
      {broken ? (
        <Placeholder tapri={tapri} plate={plate} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          onError={() => setBroken(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            display: "block",
          }}
        />
      )}
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
            "repeating-linear-gradient(rgba(23,18,14,0.09) 0 1px, transparent 1px 34px)",
          backgroundPositionY: "58px",
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
/* time state pills                                                       */
/* ---------------------------------------------------------------------- */

function StatePills({ current, onChange }) {
  return (
    <div
      role="radiogroup"
      aria-label="waqt"
      style={{
        display: "flex",
        gap: 6,
        background: "rgba(23,18,14,0.45)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        padding: 5,
        borderRadius: 999,
        border: "1px solid rgba(237,226,203,0.15)",
      }}
    >
      {STATES.map((s) => {
        const active = s.key === current;
        return (
          <button
            key={s.key}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(s.key)}
            style={{
              font: "inherit",
              fontFamily: "'Familjen Grotesk', sans-serif",
              fontSize: 13,
              padding: "6px 12px",
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              color: active ? INK : PAPER,
              background: active ? AMBER : "transparent",
              transition: "background 0.25s ease, color 0.25s ease",
            }}
          >
            {s.label}
          </button>
        );
      })}
    </div>
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
  const [title, setTitle] = useState("");

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
                setTitle(d && d.title ? d.title : "");
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

  return (
    <div
      style={{
        position: "fixed",
        bottom: 18,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 30,
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "rgba(23,18,14,0.55)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        border: "1px solid rgba(237,226,203,0.15)",
        borderRadius: 999,
        padding: "8px 16px 8px 8px",
        maxWidth: "min(420px, 84vw)",
      }}
    >
      <div ref={containerRef} style={{ width: 1, height: 1, overflow: "hidden" }} />
      <button
        onClick={toggle}
        disabled={!ready}
        aria-label={playing ? "pause" : "play"}
        style={{
          width: 34,
          height: 34,
          flexShrink: 0,
          borderRadius: "50%",
          border: "none",
          background: AMBER,
          color: INK,
          cursor: ready ? "pointer" : "default",
          opacity: ready ? 1 : 0.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          font: "inherit",
        }}
      >
        {playing ? "❚❚" : "▶"}
      </button>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: "'Familjen Grotesk', sans-serif",
            fontSize: 12,
            color: PAPER,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title || "gaane suno"}
        </div>
        <div
          style={{
            fontFamily: "'Familjen Grotesk', sans-serif",
            fontSize: 9.5,
            color: STEEL,
            marginTop: 1,
          }}
        >
          via YouTube — plays go to the artist
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* main page                                                              */
/* ---------------------------------------------------------------------- */

export default function Page() {
  const [activeId, setActiveId] = useState(TAPRIS[0].id);
  const [stateKey, setStateKey] = useState("dopahar");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

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

  function changeState(key) {
    setStateKey(key);
    try {
      localStorage.setItem(LS_STATE, key);
    } catch (e) {}
  }

  function selectTapri(id) {
    setActiveId(id);
    setDrawerOpen(false);
  }

  const active = useMemo(
    () => TAPRIS.find((t) => t.id === activeId) || TAPRIS[0],
    [activeId]
  );
  const state = useMemo(
    () => STATES.find((s) => s.key === stateKey) || STATES[1],
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
          background: radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.55) 100%);
        }

        .rain-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0;
          transition: opacity 1s ease;
          background-image: repeating-linear-gradient(
            100deg,
            rgba(237,226,203,0.12) 0px,
            rgba(237,226,203,0.12) 1px,
            transparent 1px,
            transparent 12px
          );
          background-size: 140% 140%;
          animation: rainfall 0.35s linear infinite;
        }
        .rain-overlay.on { opacity: 1; }

        @keyframes rainfall {
          0% { background-position: 0 0; }
          100% { background-position: -40px 90px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .rain-overlay { animation: none; }
          * { transition-duration: 0.01ms !important; }
        }

        @media (max-width: 640px) {
          .top-bar { padding: 12px !important; }
          .register-tab { padding: 8px 12px !important; font-size: 12px !important; }
        }

        button:focus-visible, [role="radio"]:focus-visible {
          outline: 2px solid ${AMBER};
          outline-offset: 2px;
        }
      `}</style>

      <div className="grain vignette" style={{ position: "absolute", inset: 0 }}>
        {hydrated && (
          <>
            <Plate
              tapri={active}
              plate="day"
              active={state.plate === "day"}
              filter={state.plate === "day" ? state.filter : "none"}
            />
            <Plate
              tapri={active}
              plate="night"
              active={state.plate === "night"}
              filter={state.plate === "night" ? state.filter : "none"}
            />
          </>
        )}
        <div className={`rain-overlay ${stateKey === "baarish" ? "on" : ""}`} />
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
          className="register-tab"
          onClick={() => setDrawerOpen(true)}
          aria-haspopup="dialog"
          style={{
            font: "inherit",
            fontFamily: "'Kalam', cursive",
            fontSize: 14,
            color: PAPER,
            background: "rgba(23,18,14,0.5)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            border: `1px solid rgba(237,226,203,0.2)`,
            borderRadius: 8,
            padding: "10px 16px",
            cursor: "pointer",
            textAlign: "left",
            maxWidth: 220,
          }}
        >
          <div style={{ fontSize: 10, color: STEEL, fontFamily: "'Familjen Grotesk', sans-serif", marginBottom: 2 }}>
            रजिस्टर खोलो
          </div>
          <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {active.name}
          </div>
        </button>

        <StatePills current={stateKey} onChange={changeState} />
      </div>

      <div
        style={{
          position: "fixed",
          left: 18,
          bottom: 84,
          zIndex: 20,
          maxWidth: "min(420px, 60vw)",
          color: PAPER,
          fontFamily: "'Familjen Grotesk', sans-serif",
          fontSize: 12.5,
          lineHeight: 1.5,
          textShadow: "0 1px 6px rgba(0,0,0,0.6)",
        }}
      >
        <div style={{ opacity: 0.85 }}>{active.area}</div>
        <div style={{ opacity: 0.65, marginTop: 2 }}>{active.note}</div>
      </div>

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
