import { useState, useEffect, useRef } from "react";

// ─── Animated counter hook ──────────────────────────────────────────────
function useCounter(end, duration = 2000, startOnView = true) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(!startOnView);
  const ref = useRef(null);

  useEffect(() => {
    if (!startOnView) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [startOnView]);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [started, end, duration]);

  return [count, ref];
}

// ─── Glow orb background component ─────────────────────────────────────
function GlowOrbs() {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      <div style={{
        position: "absolute", width: 600, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,255,200,0.07) 0%, transparent 70%)",
        top: "-10%", left: "-10%", filter: "blur(80px)",
        animation: "orbFloat1 20s ease-in-out infinite"
      }} />
      <div style={{
        position: "absolute", width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(120,80,255,0.06) 0%, transparent 70%)",
        bottom: "10%", right: "-5%", filter: "blur(80px)",
        animation: "orbFloat2 25s ease-in-out infinite"
      }} />
      <div style={{
        position: "absolute", width: 300, height: 300, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,50,80,0.05) 0%, transparent 70%)",
        top: "40%", left: "50%", filter: "blur(60px)",
        animation: "orbFloat3 18s ease-in-out infinite"
      }} />
    </div>
  );
}

// ─── Scan animation component ───────────────────────────────────────────
function ScanVisual() {
  const [scanLine, setScanLine] = useState(0);
  const [phase, setPhase] = useState("scanning");
  const [threats, setThreats] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setScanLine((p) => {
        if (p >= 100) {
          setPhase("detected");
          setTimeout(() => {
            setThreats([
              { x: 35, y: 28, label: "Face Swap", conf: 97.2 },
              { x: 62, y: 45, label: "Lip Sync", conf: 94.8 },
              { x: 48, y: 68, label: "Audio Clone", conf: 91.3 },
            ]);
          }, 400);
          setTimeout(() => { setPhase("scanning"); setThreats([]); setScanLine(0); }, 5000);
          return 100;
        }
        return p + 0.6;
      });
    }, 20);
    return () => clearInterval(interval);
  }, [phase]);

  return (
    <div style={{
      position: "relative", width: "100%", aspectRatio: "16/10",
      borderRadius: 16, overflow: "hidden",
      background: "linear-gradient(145deg, #0a0a0f 0%, #0d1117 50%, #0a0a0f 100%)",
      border: "1px solid rgba(255,255,255,0.06)",
      boxShadow: phase === "detected"
        ? "0 0 60px rgba(255,50,80,0.15), inset 0 0 60px rgba(255,50,80,0.03)"
        : "0 0 60px rgba(0,255,200,0.08), inset 0 0 60px rgba(0,255,200,0.02)",
      transition: "box-shadow 0.8s ease"
    }}>
      {/* Grid overlay */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.04,
        backgroundImage: "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
        backgroundSize: "40px 40px"
      }} />

      {/* Fake face silhouette */}
      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: 120, height: 150, borderRadius: "50% 50% 45% 45%",
        border: `2px solid ${phase === "detected" ? "rgba(255,50,80,0.3)" : "rgba(0,255,200,0.15)"}`,
        transition: "border-color 0.5s ease",
        boxShadow: phase === "detected" ? "0 0 30px rgba(255,50,80,0.1)" : "none"
      }}>
        <div style={{
          position: "absolute", top: "30%", left: "20%", width: 18, height: 8,
          borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)"
        }} />
        <div style={{
          position: "absolute", top: "30%", right: "20%", width: 18, height: 8,
          borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)"
        }} />
        <div style={{
          position: "absolute", bottom: "25%", left: "50%", transform: "translateX(-50%)",
          width: 20, height: 8, borderRadius: "0 0 10px 10px",
          border: "1px solid rgba(255,255,255,0.08)", borderTop: "none"
        }} />
      </div>

      {/* Scan line */}
      {phase === "scanning" && (
        <div style={{
          position: "absolute", left: 0, right: 0, height: 2,
          top: `${scanLine}%`,
          background: "linear-gradient(90deg, transparent, #00ffc8, transparent)",
          boxShadow: "0 0 20px #00ffc8, 0 0 60px rgba(0,255,200,0.3)",
          transition: "top 0.02s linear"
        }} />
      )}

      {/* Threat markers */}
      {threats.map((t, i) => (
        <div key={i} style={{
          position: "absolute", left: `${t.x}%`, top: `${t.y}%`,
          animation: `threatPop 0.4s ease-out ${i * 0.15}s both`
        }}>
          <div style={{
            width: 12, height: 12, borderRadius: "50%",
            border: "2px solid #ff3250", background: "rgba(255,50,80,0.2)",
            animation: "threatPulse 1.5s ease-in-out infinite",
            boxShadow: "0 0 15px rgba(255,50,80,0.4)"
          }} />
          <div style={{
            position: "absolute", left: 18, top: -4, whiteSpace: "nowrap",
            background: "rgba(255,50,80,0.12)", backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,50,80,0.25)", borderRadius: 6,
            padding: "3px 8px", fontSize: 11, color: "#ff6480",
            fontFamily: "'JetBrains Mono', monospace"
          }}>
            {t.label} <span style={{ color: "#ff3250", fontWeight: 700 }}>{t.conf}%</span>
          </div>
        </div>
      ))}

      {/* Status bar */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, padding: "12px 20px",
        background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        fontFamily: "'JetBrains Mono', monospace", fontSize: 11
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 7, height: 7, borderRadius: "50%",
            background: phase === "detected" ? "#ff3250" : "#00ffc8",
            boxShadow: `0 0 8px ${phase === "detected" ? "#ff3250" : "#00ffc8"}`,
            animation: "statusBlink 1s ease-in-out infinite"
          }} />
          <span style={{ color: phase === "detected" ? "#ff6480" : "#00ffc8", letterSpacing: 1.5, textTransform: "uppercase" }}>
            {phase === "scanning" ? "Analyzing..." : "⚠ Deepfake Detected"}
          </span>
        </div>
        <span style={{ color: "rgba(255,255,255,0.3)" }}>
          {phase === "scanning" ? `${Math.floor(scanLine)}% complete` : "3 threats found"}
        </span>
      </div>
    </div>
  );
}

// ─── Feature card component ─────────────────────────────────────────────
function FeatureCard({ icon, title, desc, color, delay }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative", padding: 32, borderRadius: 16,
        background: hovered
          ? `linear-gradient(145deg, rgba(${color},0.06), rgba(${color},0.02))`
          : "rgba(255,255,255,0.02)",
        border: `1px solid ${hovered ? `rgba(${color},0.2)` : "rgba(255,255,255,0.05)"}`,
        backdropFilter: "blur(20px)",
        transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        cursor: "default",
        animation: `fadeSlideUp 0.6s ease-out ${delay}s both`,
        overflow: "hidden"
      }}
    >
      {hovered && (
        <div style={{
          position: "absolute", top: -40, right: -40, width: 120, height: 120,
          borderRadius: "50%", background: `radial-gradient(circle, rgba(${color},0.08), transparent)`,
          filter: "blur(20px)", pointerEvents: "none"
        }} />
      )}
      <div style={{
        fontSize: 28, marginBottom: 16, width: 52, height: 52,
        display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: 12, background: `rgba(${color},0.08)`,
        border: `1px solid rgba(${color},0.15)`
      }}>
        {icon}
      </div>
      <h3 style={{
        fontSize: 18, fontWeight: 600, color: "#e8e8ef", marginBottom: 10,
        fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em"
      }}>{title}</h3>
      <p style={{
        fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.7,
        fontFamily: "'DM Sans', sans-serif"
      }}>{desc}</p>
    </div>
  );
}

// ─── Stat block component ───────────────────────────────────────────────
function StatBlock({ value, suffix, label, color }) {
  const [count, ref] = useCounter(value, 2000);
  return (
    <div ref={ref} style={{ textAlign: "center" }}>
      <div style={{
        fontSize: 52, fontWeight: 700, fontFamily: "'Outfit', sans-serif",
        background: `linear-gradient(135deg, ${color}, rgba(255,255,255,0.9))`,
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        letterSpacing: "-0.03em", lineHeight: 1.1
      }}>
        {count}{suffix}
      </div>
      <div style={{
        fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 8,
        textTransform: "uppercase", letterSpacing: 2,
        fontFamily: "'JetBrains Mono', monospace"
      }}>{label}</div>
    </div>
  );
}

// ─── Integration logo pill ──────────────────────────────────────────────
function IntegrationPill({ name, icon }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 18px", borderRadius: 100,
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.06)",
      fontSize: 13, color: "rgba(255,255,255,0.5)",
      fontFamily: "'DM Sans', sans-serif",
      whiteSpace: "nowrap",
      transition: "all 0.3s ease",
      cursor: "default"
    }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      {name}
    </div>
  );
}

// ─── Pricing card ───────────────────────────────────────────────────────
function PricingCard({ tier, price, period, features, highlighted, cta }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative", padding: 36, borderRadius: 20,
        background: highlighted
          ? "linear-gradient(145deg, rgba(0,255,200,0.04), rgba(120,80,255,0.03))"
          : "rgba(255,255,255,0.015)",
        border: `1px solid ${highlighted ? "rgba(0,255,200,0.15)" : "rgba(255,255,255,0.05)"}`,
        backdropFilter: "blur(20px)",
        transition: "all 0.4s ease",
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        flex: 1, minWidth: 260, maxWidth: 360,
        overflow: "hidden"
      }}
    >
      {highlighted && (
        <div style={{
          position: "absolute", top: 16, right: 16,
          padding: "4px 12px", borderRadius: 100,
          background: "linear-gradient(135deg, #00ffc8, #7850ff)",
          fontSize: 10, fontWeight: 700, color: "#000",
          textTransform: "uppercase", letterSpacing: 1.5,
          fontFamily: "'JetBrains Mono', monospace"
        }}>Popular</div>
      )}
      <div style={{
        fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 8,
        textTransform: "uppercase", letterSpacing: 2,
        fontFamily: "'JetBrains Mono', monospace", fontWeight: 500
      }}>{tier}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 24 }}>
        <span style={{
          fontSize: 44, fontWeight: 700, color: "#e8e8ef",
          fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.03em"
        }}>{price}</span>
        {period && <span style={{
          fontSize: 14, color: "rgba(255,255,255,0.3)",
          fontFamily: "'DM Sans', sans-serif"
        }}>/{period}</span>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 32 }}>
        {features.map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "rgba(255,255,255,0.55)", fontFamily: "'DM Sans', sans-serif" }}>
            <span style={{ color: "#00ffc8", fontSize: 14 }}>✓</span>
            {f}
          </div>
        ))}
      </div>
      <button style={{
        width: "100%", padding: "14px 0", borderRadius: 12, border: "none",
        background: highlighted
          ? "linear-gradient(135deg, #00ffc8, #00d4a8)"
          : "rgba(255,255,255,0.06)",
        color: highlighted ? "#000" : "rgba(255,255,255,0.7)",
        fontSize: 14, fontWeight: 600, cursor: "pointer",
        fontFamily: "'DM Sans', sans-serif",
        transition: "all 0.3s ease",
        transform: hovered ? "scale(1.02)" : "scale(1)"
      }}>{cta}</button>
    </div>
  );
}

// ─── Main App ───────────────────────────────────────────────────────────
export default function ScannerUltraLanding() {
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navOpacity = Math.min(scrollY / 100, 0.95);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#050508",
      color: "#e8e8ef",
      fontFamily: "'DM Sans', sans-serif",
      overflowX: "hidden"
    }}>
      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      {/* Keyframe animations */}
      <style>{`
        @keyframes orbFloat1 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(50px, 30px); } }
        @keyframes orbFloat2 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-40px, -50px); } }
        @keyframes orbFloat3 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(30px, -20px); } }
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        @keyframes threatPop { from { opacity:0; transform:scale(0); } to { opacity:1; transform:scale(1); } }
        @keyframes threatPulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.6; transform:scale(1.4); } }
        @keyframes statusBlink { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes heroGlow { 0%,100% { opacity:0.5; } 50% { opacity:1; } }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes borderRotate { from { --angle: 0deg; } to { --angle: 360deg; } }
        * { margin:0; padding:0; box-sizing:border-box; }
        html { scroll-behavior: smooth; }
        ::selection { background: rgba(0,255,200,0.2); color: #fff; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #050508; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        @media (max-width: 768px) {
          .hero-heading { font-size: 36px !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .stats-row { flex-direction: column !important; gap: 32px !important; }
          .pricing-row { flex-direction: column !important; align-items: center !important; }
          .nav-links { display: none !important; }
          .section-pad { padding-left: 20px !important; padding-right: 20px !important; }
        }
      `}</style>

      <GlowOrbs />

      {/* ═══ NAVBAR ═══ */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "0 40px", height: 72,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: `rgba(5,5,8,${navOpacity})`,
        backdropFilter: scrollY > 10 ? "blur(20px) saturate(180%)" : "none",
        borderBottom: scrollY > 10 ? "1px solid rgba(255,255,255,0.04)" : "1px solid transparent",
        transition: "all 0.3s ease"
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: "linear-gradient(135deg, #00ffc8, #7850ff)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 800, color: "#000",
            fontFamily: "'Outfit', sans-serif"
          }}>S</div>
          <span style={{
            fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em",
            fontFamily: "'Outfit', sans-serif"
          }}>
            Scanner <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>ULTRA</span>
          </span>
        </div>

        {/* Nav links */}
        <div className="nav-links" style={{ display: "flex", gap: 32, alignItems: "center" }}>
          {["Features", "How it Works", "Pricing", "Docs"].map((item) => (
            <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`} style={{
              color: "rgba(255,255,255,0.45)", fontSize: 13, textDecoration: "none",
              fontWeight: 500, letterSpacing: "0.02em", transition: "color 0.2s",
              fontFamily: "'DM Sans', sans-serif",
              cursor: "pointer"
            }}
            onMouseEnter={(e) => e.target.style.color = "#fff"}
            onMouseLeave={(e) => e.target.style.color = "rgba(255,255,255,0.45)"}
            >{item}</a>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button style={{
            padding: "9px 20px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)",
            background: "transparent", color: "rgba(255,255,255,0.6)",
            fontSize: 13, fontWeight: 500, cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif"
          }}>Sign In</button>
          <button style={{
            padding: "9px 20px", borderRadius: 10, border: "none",
            background: "linear-gradient(135deg, #00ffc8, #00d4a8)",
            color: "#000", fontSize: 13, fontWeight: 600, cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif"
          }}>Get Started</button>
        </div>
      </nav>

      {/* ═══ HERO SECTION ═══ */}
      <section className="section-pad" style={{
        paddingTop: 160, paddingBottom: 80,
        paddingLeft: 40, paddingRight: 40,
        position: "relative", zIndex: 1
      }}>
        {/* Top badge */}
        <div style={{
          display: "flex", justifyContent: "center", marginBottom: 32,
          animation: "fadeSlideUp 0.6s ease-out 0.1s both"
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "7px 16px 7px 8px", borderRadius: 100,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            fontSize: 12, color: "rgba(255,255,255,0.5)",
            fontFamily: "'DM Sans', sans-serif"
          }}>
            <span style={{
              padding: "2px 8px", borderRadius: 100,
              background: "linear-gradient(135deg, rgba(0,255,200,0.15), rgba(120,80,255,0.15))",
              color: "#00ffc8", fontSize: 10, fontWeight: 600,
              fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1
            }}>v5.0</span>
            PentaShield™ Edition — Now Available
          </div>
        </div>

        {/* Main heading */}
        <h1 className="hero-heading" style={{
          fontSize: 72, fontWeight: 800, textAlign: "center",
          fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.04em",
          lineHeight: 1.05, maxWidth: 900, margin: "0 auto 24px",
          animation: "fadeSlideUp 0.6s ease-out 0.2s both"
        }}>
          Detect Deepfakes{" "}
          <span style={{
            background: "linear-gradient(135deg, #00ffc8, #7850ff, #ff3250)",
            backgroundSize: "200% 200%",
            animation: "gradientShift 6s ease infinite",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>Before They</span>
          <br />Cause Damage
        </h1>

        {/* Subheading */}
        <p style={{
          fontSize: 17, color: "rgba(255,255,255,0.4)", textAlign: "center",
          maxWidth: 560, margin: "0 auto 40px", lineHeight: 1.7,
          fontFamily: "'DM Sans', sans-serif",
          animation: "fadeSlideUp 0.6s ease-out 0.35s both"
        }}>
          Multi-modal AI platform that detects manipulated video, audio, images,
          and text in real-time. Protect your organization from synthetic media threats.
        </p>

        {/* CTA buttons */}
        <div style={{
          display: "flex", justifyContent: "center", gap: 14, marginBottom: 72,
          animation: "fadeSlideUp 0.6s ease-out 0.45s both",
          flexWrap: "wrap"
        }}>
          <button style={{
            padding: "15px 32px", borderRadius: 12, border: "none",
            background: "linear-gradient(135deg, #00ffc8, #00d4a8)",
            color: "#000", fontSize: 15, fontWeight: 600, cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: "0 8px 32px rgba(0,255,200,0.2)",
            transition: "all 0.3s ease"
          }}>
            Start Free Trial →
          </button>
          <button style={{
            padding: "15px 32px", borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.03)",
            color: "rgba(255,255,255,0.7)", fontSize: 15, fontWeight: 500,
            cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            backdropFilter: "blur(10px)",
            transition: "all 0.3s ease"
          }}>
            View Live Demo
          </button>
        </div>

        {/* Scan visual */}
        <div style={{
          maxWidth: 860, margin: "0 auto",
          animation: "fadeSlideUp 0.8s ease-out 0.6s both"
        }}>
          <ScanVisual />
        </div>
      </section>

      {/* ═══ TRUSTED BY / MARQUEE ═══ */}
      <section style={{
        padding: "48px 0", borderTop: "1px solid rgba(255,255,255,0.03)",
        borderBottom: "1px solid rgba(255,255,255,0.03)",
        overflow: "hidden", position: "relative", zIndex: 1
      }}>
        <div style={{
          fontSize: 11, textAlign: "center", color: "rgba(255,255,255,0.2)",
          textTransform: "uppercase", letterSpacing: 3, marginBottom: 24,
          fontFamily: "'JetBrains Mono', monospace"
        }}>Trusted by industry leaders</div>
        <div style={{ display: "flex", animation: "marquee 30s linear infinite", width: "max-content" }}>
          {[...Array(2)].map((_, setIdx) => (
            <div key={setIdx} style={{ display: "flex", gap: 48, paddingRight: 48, alignItems: "center" }}>
              {["NATO CCDCOE", "Visa Security", "Deutsche Bank", "BBC Verify", "Reuters", "Europol",
                "JP Morgan", "Interpol", "Swiss Re", "Al Jazeera", "Türk Telekom", "Bloomberg"
              ].map((name) => (
                <span key={name + setIdx} style={{
                  fontSize: 15, fontWeight: 500, color: "rgba(255,255,255,0.12)",
                  fontFamily: "'Outfit', sans-serif", letterSpacing: "0.02em",
                  whiteSpace: "nowrap"
                }}>{name}</span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="section-pad" style={{
        padding: "100px 40px", position: "relative", zIndex: 1
      }}>
        <div style={{
          fontSize: 11, color: "#00ffc8", textTransform: "uppercase",
          letterSpacing: 3, marginBottom: 16, textAlign: "center",
          fontFamily: "'JetBrains Mono', monospace"
        }}>Detection Technologies</div>
        <h2 style={{
          fontSize: 44, fontWeight: 700, textAlign: "center",
          fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.03em",
          marginBottom: 16, lineHeight: 1.15
        }}>
          Five Layers of<br />
          <span style={{ color: "rgba(255,255,255,0.35)" }}>Intelligent Defense</span>
        </h2>
        <p style={{
          fontSize: 15, color: "rgba(255,255,255,0.35)", textAlign: "center",
          maxWidth: 500, margin: "0 auto 56px", lineHeight: 1.7
        }}>
          Each layer operates independently and in concert, creating
          an impenetrable shield against synthetic media threats.
        </p>

        <div className="features-grid" style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 20, maxWidth: 1100, margin: "0 auto"
        }}>
          <FeatureCard delay={0.1}
            icon="🧬" title="HYDRA Engine"
            desc="Adversarial-immune multi-head detection with self-training loop. Three independent decision heads ensure no single attack vector can fool the system."
            color="0,255,200" />
          <FeatureCard delay={0.2}
            icon="🔮" title="Zero-Day Sentinel"
            desc="Detects never-before-seen deepfake techniques using anomaly detection, physics verification, and biological consistency checks."
            color="120,80,255" />
          <FeatureCard delay={0.3}
            icon="🔬" title="Forensic DNA"
            desc="Identifies the exact AI generator used — StyleGAN, Stable Diffusion, DALL-E, and 4 more families. Full attribution reports."
            color="255,50,80" />
          <FeatureCard delay={0.4}
            icon="⚡" title="Active Probe"
            desc="Real-time challenge-response liveness for video calls. Light reflection and motion checks with <50ms latency analysis."
            color="255,180,50" />
          <FeatureCard delay={0.5}
            icon="👻" title="Ghost Protocol"
            desc="Edge-optimized models under 10MB for on-device inference. Federated learning with differential privacy — your data never leaves."
            color="80,200,255" />
          <FeatureCard delay={0.6}
            icon="🛡️" title="Multi-Modal Fusion"
            desc="Cross-modal attention fuses visual, audio, and text signals. Temporal consistency tracking catches what single-frame analysis misses."
            color="200,120,255" />
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how-it-works" className="section-pad" style={{
        padding: "100px 40px",
        background: "linear-gradient(180deg, transparent, rgba(0,255,200,0.01), transparent)",
        position: "relative", zIndex: 1
      }}>
        <div style={{
          fontSize: 11, color: "#7850ff", textTransform: "uppercase",
          letterSpacing: 3, marginBottom: 16, textAlign: "center",
          fontFamily: "'JetBrains Mono', monospace"
        }}>How It Works</div>
        <h2 style={{
          fontSize: 44, fontWeight: 700, textAlign: "center",
          fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.03em",
          marginBottom: 64, lineHeight: 1.15
        }}>
          Three Steps to<br />
          <span style={{ color: "rgba(255,255,255,0.35)" }}>Complete Protection</span>
        </h2>

        <div style={{
          display: "flex", gap: 24, maxWidth: 1100, margin: "0 auto",
          flexWrap: "wrap", justifyContent: "center"
        }}>
          {[
            { step: "01", title: "Upload or Connect", desc: "Send any media file via API, SDK, or browser extension. Connect to Zoom/Teams for real-time meeting protection.", color: "#00ffc8" },
            { step: "02", title: "Multi-Layer Analysis", desc: "All five PentaShield engines analyze simultaneously — visual artifacts, audio patterns, temporal consistency, and generator fingerprints.", color: "#7850ff" },
            { step: "03", title: "Actionable Report", desc: "Get a trust score, threat level, generator attribution, and forensic evidence — all within seconds. Integrate results into your workflow.", color: "#ff3250" },
          ].map((item, i) => (
            <div key={i} style={{
              flex: 1, minWidth: 280, maxWidth: 360, padding: 36,
              borderRadius: 16, background: "rgba(255,255,255,0.015)",
              border: "1px solid rgba(255,255,255,0.05)",
              position: "relative", overflow: "hidden",
              animation: `fadeSlideUp 0.6s ease-out ${0.2 + i * 0.15}s both`
            }}>
              <div style={{
                position: "absolute", top: -20, right: -10,
                fontSize: 100, fontWeight: 800, color: "rgba(255,255,255,0.02)",
                fontFamily: "'Outfit', sans-serif"
              }}>{item.step}</div>
              <div style={{
                fontSize: 12, fontWeight: 700, color: item.color,
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: 2, marginBottom: 16
              }}>STEP {item.step}</div>
              <h3 style={{
                fontSize: 20, fontWeight: 600, color: "#e8e8ef",
                fontFamily: "'Outfit', sans-serif", marginBottom: 12,
                letterSpacing: "-0.02em"
              }}>{item.title}</h3>
              <p style={{
                fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.7,
                fontFamily: "'DM Sans', sans-serif"
              }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section className="section-pad" style={{
        padding: "80px 40px", position: "relative", zIndex: 1,
        borderTop: "1px solid rgba(255,255,255,0.03)",
        borderBottom: "1px solid rgba(255,255,255,0.03)"
      }}>
        <div className="stats-row" style={{
          display: "flex", justifyContent: "center",
          gap: 80, maxWidth: 900, margin: "0 auto",
          flexWrap: "wrap"
        }}>
          <StatBlock value={97} suffix="%" label="Detection Accuracy" color="#00ffc8" />
          <StatBlock value={500} suffix="ms" label="Avg Response Time" color="#7850ff" />
          <StatBlock value={19} suffix="+" label="Detection Models" color="#ff3250" />
          <StatBlock value={99} suffix="%" label="Uptime SLA" color="#50c8ff" />
        </div>
      </section>

      {/* ═══ INTEGRATIONS ═══ */}
      <section className="section-pad" style={{
        padding: "100px 40px", position: "relative", zIndex: 1
      }}>
        <div style={{
          fontSize: 11, color: "rgba(255,255,255,0.25)", textTransform: "uppercase",
          letterSpacing: 3, marginBottom: 16, textAlign: "center",
          fontFamily: "'JetBrains Mono', monospace"
        }}>Integrations</div>
        <h2 style={{
          fontSize: 36, fontWeight: 700, textAlign: "center",
          fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.03em",
          marginBottom: 40
        }}>
          Works Where You Work
        </h2>
        <div style={{
          display: "flex", flexWrap: "wrap", justifyContent: "center",
          gap: 12, maxWidth: 700, margin: "0 auto"
        }}>
          <IntegrationPill name="Zoom" icon="📹" />
          <IntegrationPill name="Microsoft Teams" icon="💬" />
          <IntegrationPill name="Google Meet" icon="🎥" />
          <IntegrationPill name="Slack" icon="💡" />
          <IntegrationPill name="REST API" icon="⚙️" />
          <IntegrationPill name="Python SDK" icon="🐍" />
          <IntegrationPill name="JavaScript SDK" icon="📦" />
          <IntegrationPill name="Chrome Extension" icon="🌐" />
          <IntegrationPill name="Kubernetes" icon="☸️" />
          <IntegrationPill name="WebRTC" icon="📡" />
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="pricing" className="section-pad" style={{
        padding: "100px 40px",
        background: "linear-gradient(180deg, transparent, rgba(120,80,255,0.01), transparent)",
        position: "relative", zIndex: 1
      }}>
        <div style={{
          fontSize: 11, color: "#7850ff", textTransform: "uppercase",
          letterSpacing: 3, marginBottom: 16, textAlign: "center",
          fontFamily: "'JetBrains Mono', monospace"
        }}>Pricing</div>
        <h2 style={{
          fontSize: 44, fontWeight: 700, textAlign: "center",
          fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.03em",
          marginBottom: 56
        }}>
          Simple, Transparent<br />
          <span style={{ color: "rgba(255,255,255,0.35)" }}>Pricing</span>
        </h2>

        <div className="pricing-row" style={{
          display: "flex", gap: 20, justifyContent: "center",
          maxWidth: 1100, margin: "0 auto", flexWrap: "wrap"
        }}>
          <PricingCard tier="Starter" price="$0" period="month"
            features={["100 scans/month", "Image detection", "API access", "Community support"]}
            cta="Start Free" />
          <PricingCard tier="Pro" price="$199" period="month" highlighted
            features={["10K scans/month", "Video + Audio + Image", "Real-time meeting protection", "Forensic reports", "Priority support"]}
            cta="Start Free Trial" />
          <PricingCard tier="Enterprise" price="Custom" period=""
            features={["Unlimited scans", "All PentaShield™ engines", "On-premise deployment", "Custom model training", "Dedicated SLA", "24/7 support"]}
            cta="Contact Sales" />
        </div>
      </section>

      {/* ═══ CTA SECTION ═══ */}
      <section className="section-pad" style={{
        padding: "100px 40px", position: "relative", zIndex: 1
      }}>
        <div style={{
          maxWidth: 700, margin: "0 auto", textAlign: "center",
          padding: "64px 48px", borderRadius: 24,
          background: "linear-gradient(145deg, rgba(0,255,200,0.03), rgba(120,80,255,0.03))",
          border: "1px solid rgba(255,255,255,0.05)",
          position: "relative", overflow: "hidden"
        }}>
          <div style={{
            position: "absolute", top: -100, left: -100, width: 300, height: 300,
            borderRadius: "50%", background: "radial-gradient(circle, rgba(0,255,200,0.06), transparent)",
            filter: "blur(60px)", pointerEvents: "none"
          }} />
          <div style={{
            position: "absolute", bottom: -100, right: -100, width: 300, height: 300,
            borderRadius: "50%", background: "radial-gradient(circle, rgba(120,80,255,0.06), transparent)",
            filter: "blur(60px)", pointerEvents: "none"
          }} />
          <h2 style={{
            fontSize: 36, fontWeight: 700, fontFamily: "'Outfit', sans-serif",
            letterSpacing: "-0.03em", marginBottom: 16, position: "relative"
          }}>
            Ready to Protect Your
            <br />Organization?
          </h2>
          <p style={{
            fontSize: 15, color: "rgba(255,255,255,0.4)", marginBottom: 32,
            lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif", position: "relative"
          }}>
            Start detecting deepfakes in minutes. No credit card required.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 12, position: "relative", flexWrap: "wrap" }}>
            <button style={{
              padding: "15px 36px", borderRadius: 12, border: "none",
              background: "linear-gradient(135deg, #00ffc8, #00d4a8)",
              color: "#000", fontSize: 15, fontWeight: 600, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: "0 8px 32px rgba(0,255,200,0.2)"
            }}>Get Started Free →</button>
            <button style={{
              padding: "15px 36px", borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.7)",
              fontSize: 15, fontWeight: 500, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif"
            }}>Schedule Demo</button>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{
        padding: "60px 40px 40px",
        borderTop: "1px solid rgba(255,255,255,0.04)",
        position: "relative", zIndex: 1
      }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          display: "flex", justifyContent: "space-between",
          flexWrap: "wrap", gap: 40
        }}>
          <div style={{ maxWidth: 280 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: "linear-gradient(135deg, #00ffc8, #7850ff)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 800, color: "#000",
                fontFamily: "'Outfit', sans-serif"
              }}>S</div>
              <span style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
                Scanner <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>ULTRA</span>
              </span>
            </div>
            <p style={{
              fontSize: 13, color: "rgba(255,255,255,0.3)", lineHeight: 1.7,
              fontFamily: "'DM Sans', sans-serif"
            }}>
              Advanced multi-modal deepfake detection platform protecting organizations
              from synthetic media threats.
            </p>
          </div>

          {[
            { title: "Product", links: ["Features", "Pricing", "API Docs", "SDK", "Browser Extension"] },
            { title: "Company", links: ["About", "Blog", "Careers", "Contact", "Press Kit"] },
            { title: "Legal", links: ["Privacy Policy", "Terms of Service", "Security", "GDPR", "KVKK"] },
          ].map((col) => (
            <div key={col.title}>
              <div style={{
                fontSize: 11, color: "rgba(255,255,255,0.25)", textTransform: "uppercase",
                letterSpacing: 2, marginBottom: 16,
                fontFamily: "'JetBrains Mono', monospace", fontWeight: 600
              }}>{col.title}</div>
              {col.links.map((link) => (
                <a key={link} href="#" style={{
                  display: "block", fontSize: 13, color: "rgba(255,255,255,0.35)",
                  textDecoration: "none", marginBottom: 10,
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "color 0.2s"
                }}
                onMouseEnter={(e) => e.target.style.color = "#fff"}
                onMouseLeave={(e) => e.target.style.color = "rgba(255,255,255,0.35)"}
                >{link}</a>
              ))}
            </div>
          ))}
        </div>

        <div style={{
          maxWidth: 1100, margin: "40px auto 0",
          paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.04)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: 16
        }}>
          <span style={{
            fontSize: 12, color: "rgba(255,255,255,0.2)",
            fontFamily: "'DM Sans', sans-serif"
          }}>© 2026 Scanner Technologies. All rights reserved.</span>
          <div style={{ display: "flex", gap: 20 }}>
            {["GitHub", "Discord", "X / Twitter", "LinkedIn"].map((s) => (
              <a key={s} href="#" style={{
                fontSize: 12, color: "rgba(255,255,255,0.2)",
                textDecoration: "none", fontFamily: "'DM Sans', sans-serif",
                transition: "color 0.2s"
              }}
              onMouseEnter={(e) => e.target.style.color = "#fff"}
              onMouseLeave={(e) => e.target.style.color = "rgba(255,255,255,0.2)"}
              >{s}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
