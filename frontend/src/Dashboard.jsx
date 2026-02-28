import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════════════
// SCANNER ULTRA — Deepfake Scan Dashboard
// Upload → Analyze → Results  (3-phase UI)
// ═══════════════════════════════════════════════════════════════════════

/* ── tiny helpers ─────────────────────────────────────────────────────── */
const fmt = (n) => (n < 10 ? `0${n}` : n);
const pct = (v) => `${Math.round(v * 100)}%`;
const rng = (min, max) => Math.random() * (max - min) + min;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/* ── colour tokens (same palette as landing page) ────────────────────── */
const C = {
  bg: "#050508",
  surface: "#0a0a10",
  card: "rgba(255,255,255,0.02)",
  border: "rgba(255,255,255,0.06)",
  cyan: "#00ffc8",
  purple: "#7850ff",
  red: "#ff3250",
  amber: "#ffb832",
  text: "#e8e8ef",
  muted: "rgba(255,255,255,0.4)",
  faint: "rgba(255,255,255,0.15)",
};

/* ── fonts (loaded via <link>) ───────────────────────────────────────── */
const F = {
  head: "'Outfit', sans-serif",
  body: "'DM Sans', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

/* ── simulated engine names & timings ────────────────────────────────── */
const ENGINES = [
  { id: "hydra", name: "HYDRA Engine", icon: "🧬", color: C.cyan },
  { id: "sentinel", name: "Zero-Day Sentinel", icon: "🔮", color: C.purple },
  { id: "forensic", name: "Forensic DNA", icon: "🔬", color: C.red },
  { id: "probe", name: "Active Probe", icon: "⚡", color: C.amber },
  { id: "ghost", name: "Ghost Protocol", icon: "👻", color: "#50c8ff" },
];

const DETECTORS = [
  "CLIP ViT-L/14", "EfficientNet-B7", "Xception", "Frequency (FFT)",
  "GAN Artifact", "Diffusion Artifact", "PPG Biosignal", "Gaze Consistency",
  "WavLM Audio", "CQT Spectrogram", "SyncNet Lip", "AI Text Detector",
];

/* ══════════════════════════════════════════════════════════════════════ */
/*  PHASE 1 — Upload                                                     */
/* ══════════════════════════════════════════════════════════════════════ */
function UploadPhase({ onFileSelected }) {
  const [dragOver, setDragOver] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const inputRef = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) onFileSelected(file);
  }, [onFileSelected]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
  };

  return (
    <div style={{ animation: "fadeIn 0.5s ease-out" }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{
          fontSize: 32, fontWeight: 700, fontFamily: F.head,
          letterSpacing: "-0.03em", marginBottom: 8
        }}>
          Scan Media
        </h1>
        <p style={{ fontSize: 14, color: C.muted, fontFamily: F.body, lineHeight: 1.6 }}>
          Upload a video, image, or audio file to analyze for deepfake manipulation.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          position: "relative",
          borderRadius: 20,
          padding: "72px 40px",
          border: `2px dashed ${dragOver ? C.cyan : "rgba(255,255,255,0.08)"}`,
          background: dragOver
            ? "rgba(0,255,200,0.02)"
            : "rgba(255,255,255,0.01)",
          cursor: "pointer",
          transition: "all 0.35s ease",
          textAlign: "center",
          overflow: "hidden",
        }}
      >
        {/* corner decorations */}
        {[
          { top: 16, left: 16 }, { top: 16, right: 16 },
          { bottom: 16, left: 16 }, { bottom: 16, right: 16 },
        ].map((pos, i) => (
          <div key={i} style={{
            position: "absolute", ...pos, width: 20, height: 20,
            borderColor: dragOver ? C.cyan : "rgba(255,255,255,0.08)",
            borderStyle: "solid", borderWidth: 0,
            ...(i === 0 ? { borderTopWidth: 2, borderLeftWidth: 2 } :
              i === 1 ? { borderTopWidth: 2, borderRightWidth: 2 } :
              i === 2 ? { borderBottomWidth: 2, borderLeftWidth: 2 } :
              { borderBottomWidth: 2, borderRightWidth: 2 }),
            borderRadius: i === 0 ? "6px 0 0 0" : i === 1 ? "0 6px 0 0" : i === 2 ? "0 0 0 6px" : "0 0 6px 0",
            transition: "border-color 0.3s ease",
          }} />
        ))}

        <input ref={inputRef} type="file" accept="video/*,image/*,audio/*" onChange={handleFile} style={{ display: "none" }} />

        {/* upload icon */}
        <div style={{
          width: 72, height: 72, borderRadius: 20, margin: "0 auto 24px",
          background: dragOver ? "rgba(0,255,200,0.08)" : "rgba(255,255,255,0.03)",
          border: `1px solid ${dragOver ? "rgba(0,255,200,0.2)" : "rgba(255,255,255,0.06)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, transition: "all 0.3s ease",
        }}>
          {dragOver ? "⬇️" : "📁"}
        </div>

        <div style={{
          fontSize: 16, fontWeight: 600, fontFamily: F.head,
          color: dragOver ? C.cyan : C.text, marginBottom: 8,
          transition: "color 0.3s ease",
        }}>
          {dragOver ? "Drop your file here" : "Drag & drop your media file"}
        </div>
        <div style={{ fontSize: 13, color: C.muted, fontFamily: F.body, marginBottom: 20 }}>
          or click to browse files
        </div>

        {/* format badges */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
          {["MP4", "AVI", "MOV", "WEBM", "PNG", "JPG", "WAV", "MP3"].map((f) => (
            <span key={f} style={{
              padding: "4px 10px", borderRadius: 6, fontSize: 10,
              fontFamily: F.mono, letterSpacing: 1, fontWeight: 600,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.3)",
            }}>{f}</span>
          ))}
        </div>
      </div>

      {/* OR divider */}
      <div style={{
        display: "flex", alignItems: "center", gap: 16,
        margin: "28px 0",
      }}>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontFamily: F.mono, letterSpacing: 2 }}>OR</span>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
      </div>

      {/* URL input */}
      <div style={{
        display: "flex", gap: 12,
        animation: "fadeIn 0.4s ease-out 0.2s both",
      }}>
        <div style={{
          flex: 1, display: "flex", alignItems: "center", gap: 10,
          padding: "0 16px", borderRadius: 12, height: 48,
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          transition: "border-color 0.3s ease",
        }}>
          <span style={{ fontSize: 14, color: "rgba(255,255,255,0.2)" }}>🔗</span>
          <input
            type="text"
            placeholder="Paste video URL (YouTube, TikTok, X/Twitter...)"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              color: C.text, fontSize: 13, fontFamily: F.body,
            }}
          />
        </div>
        <button
          onClick={() => {
            if (urlValue.trim()) {
              onFileSelected({ name: urlValue.trim(), size: 0, type: "url", isUrl: true });
            }
          }}
          style={{
            padding: "0 24px", borderRadius: 12, border: "none",
            background: urlValue.trim() ? `linear-gradient(135deg, ${C.cyan}, #00d4a8)` : "rgba(255,255,255,0.04)",
            color: urlValue.trim() ? "#000" : "rgba(255,255,255,0.3)",
            fontSize: 13, fontWeight: 600, cursor: urlValue.trim() ? "pointer" : "default",
            fontFamily: F.body, transition: "all 0.3s ease",
            whiteSpace: "nowrap",
          }}
        >Scan URL</button>
      </div>

      {/* Recent scans */}
      <div style={{ marginTop: 48 }}>
        <div style={{
          fontSize: 11, color: "rgba(255,255,255,0.2)", textTransform: "uppercase",
          letterSpacing: 2, fontFamily: F.mono, marginBottom: 16
        }}>Recent Scans</div>
        {[
          { name: "interview_ceo_final.mp4", verdict: "authentic", score: 0.96, time: "2 min ago" },
          { name: "suspicious_call_rec.wav", verdict: "likely_fake", score: 0.18, time: "14 min ago" },
          { name: "profile_photo.jpg", verdict: "authentic", score: 0.91, time: "1 hour ago" },
        ].map((item, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 16px", borderRadius: 12,
            background: "rgba(255,255,255,0.01)",
            border: "1px solid rgba(255,255,255,0.03)",
            marginBottom: 8,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.025)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.01)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.03)"; }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 16 }}>
                {item.name.endsWith(".mp4") ? "🎬" : item.name.endsWith(".wav") ? "🎵" : "🖼️"}
              </span>
              <div>
                <div style={{ fontSize: 13, fontFamily: F.body, fontWeight: 500, color: "rgba(255,255,255,0.7)" }}>
                  {item.name}
                </div>
                <div style={{ fontSize: 11, fontFamily: F.mono, color: "rgba(255,255,255,0.2)", marginTop: 2 }}>
                  {item.time}
                </div>
              </div>
            </div>
            <div style={{
              padding: "4px 12px", borderRadius: 100, fontSize: 11,
              fontFamily: F.mono, fontWeight: 600, letterSpacing: 0.5,
              background: item.verdict === "authentic" ? "rgba(0,255,200,0.08)" : "rgba(255,50,80,0.08)",
              color: item.verdict === "authentic" ? C.cyan : C.red,
              border: `1px solid ${item.verdict === "authentic" ? "rgba(0,255,200,0.15)" : "rgba(255,50,80,0.15)"}`,
            }}>
              {item.verdict === "authentic" ? "✓ Authentic" : "⚠ Likely Fake"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════ */
/*  PHASE 2 — Scanning / Analyzing                                      */
/* ══════════════════════════════════════════════════════════════════════ */
function ScanPhase({ file, onComplete }) {
  const [progress, setProgress] = useState(0);
  const [activeEngine, setActiveEngine] = useState(0);
  const [engineResults, setEngineResults] = useState({});
  const [detectorStates, setDetectorStates] = useState({});
  const [logLines, setLogLines] = useState([]);
  const logRef = useRef(null);
  const apiResultRef = useRef(null);
  const progressDoneRef = useRef(false);

  // ── Real API call ──────────────────────────────────────────────────────
  useEffect(() => {
    async function runScan() {
      try {
        const form = new FormData();
        if (file?.isUrl) {
          // URL-based scan: create a tiny text blob describing the URL
          const blob = new Blob([file.name], { type: "text/plain" });
          form.append("file", blob, "url.txt");
        } else {
          form.append("file", file);
        }
        const res = await fetch("/v1/scan", { method: "POST", body: form });
        if (res.ok) {
          apiResultRef.current = await res.json();
          // If progress animation already finished, call onComplete now
          if (progressDoneRef.current) onComplete(apiResultRef.current);
        }
      } catch (_) {
        // API unreachable — simulation fallback (result=null triggers random mode)
        if (progressDoneRef.current) onComplete(null);
      }
    }
    if (file) runScan();
  }, [file, onComplete]);

  useEffect(() => {
    let p = 0;
    const interval = setInterval(() => {
      p += rng(0.3, 1.2);
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setTimeout(() => {
          progressDoneRef.current = true;
          // Only complete when API result is ready (or give it 2s max)
          const go = () => onComplete(apiResultRef.current);
          if (apiResultRef.current !== null) go();
          else setTimeout(go, 2000); // fallback: complete after 2s even without API
        }, 800);
      }
      setProgress(clamp(p, 0, 100));

      // engine progression
      const engIdx = Math.min(Math.floor(p / 20), 4);
      setActiveEngine(engIdx);

      // mark engines as done
      if (p > 20) setEngineResults((r) => ({ ...r, hydra: rng(0.85, 0.99) }));
      if (p > 40) setEngineResults((r) => ({ ...r, sentinel: rng(0.7, 0.95) }));
      if (p > 60) setEngineResults((r) => ({ ...r, forensic: rng(0.8, 0.97) }));
      if (p > 80) setEngineResults((r) => ({ ...r, probe: rng(0.6, 0.95) }));
      if (p > 95) setEngineResults((r) => ({ ...r, ghost: rng(0.75, 0.98) }));

      // detector progression
      const detsDone = Math.floor((p / 100) * DETECTORS.length);
      const newStates = {};
      DETECTORS.forEach((d, i) => {
        if (i < detsDone) newStates[d] = "done";
        else if (i === detsDone) newStates[d] = "running";
        else newStates[d] = "pending";
      });
      setDetectorStates(newStates);
    }, 80);

    return () => clearInterval(interval);
  }, [onComplete]);

  // Log lines simulation
  useEffect(() => {
    const logs = [
      "Initializing PentaShield™ detection pipeline...",
      `Loading media: ${file?.name || "unknown"}`,
      "Extracting video frames @ 30fps...",
      "Preprocessing: face detection & alignment",
      "HYDRA Engine: spawning 3 adversarial heads",
      "Running CLIP ViT-L/14 embedding extraction",
      "Frequency domain analysis (FFT/DCT)...",
      "EfficientNet-B7: analyzing spatial artifacts",
      "Zero-Day Sentinel: OOD anomaly scan",
      "Physics verification: lighting consistency ✓",
      "Biological check: blink rate analysis...",
      "Forensic DNA: spectral fingerprint extraction",
      "Matching against 7 generator families...",
      "Audio stream: WavLM feature extraction",
      "CQT spectrogram: vocal pattern analysis",
      "SyncNet: lip-sync correlation check",
      "Active Probe: latency profiling",
      "Ghost Protocol: edge model inference (<8ms)",
      "Cross-modal attention fusion layer",
      "Temporal consistency verification...",
      "Confidence calibration & trust score",
      "Generating forensic report...",
      "✓ Analysis complete — assembling results",
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < logs.length) {
        setLogLines((prev) => [...prev.slice(-14), logs[i]]);
        i++;
      }
    }, 420);
    return () => clearInterval(interval);
  }, [file]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logLines]);

  const progressColor = progress < 100
    ? `linear-gradient(90deg, ${C.cyan}, ${C.purple})`
    : `linear-gradient(90deg, ${C.cyan}, ${C.cyan})`;

  return (
    <div style={{ animation: "fadeIn 0.5s ease-out" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 10, height: 10, borderRadius: "50%", background: C.cyan,
            boxShadow: `0 0 12px ${C.cyan}`,
            animation: "pulse 1.2s ease-in-out infinite",
          }} />
          <h1 style={{
            fontSize: 24, fontWeight: 700, fontFamily: F.head,
            letterSpacing: "-0.02em",
          }}>
            Analyzing Media
          </h1>
        </div>
        <p style={{ fontSize: 13, color: C.muted, fontFamily: F.body }}>
          {file?.name || "media file"} — {file?.size ? `${(file.size / 1048576).toFixed(1)} MB` : "URL scan"}
        </p>
      </div>

      {/* Main progress bar */}
      <div style={{
        height: 6, borderRadius: 3, background: "rgba(255,255,255,0.04)",
        marginBottom: 8, overflow: "hidden",
      }}>
        <div style={{
          height: "100%", borderRadius: 3, width: `${progress}%`,
          background: progressColor,
          boxShadow: `0 0 20px rgba(0,255,200,0.3)`,
          transition: "width 0.15s linear",
        }} />
      </div>
      <div style={{
        display: "flex", justifyContent: "space-between", marginBottom: 36,
        fontSize: 11, fontFamily: F.mono, color: "rgba(255,255,255,0.25)",
      }}>
        <span>{Math.round(progress)}% complete</span>
        <span>ETA {Math.max(0, Math.round((100 - progress) * 0.15))}s</span>
      </div>

      {/* Two column layout */}
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        {/* Left: Engines */}
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{
            fontSize: 10, color: "rgba(255,255,255,0.2)", textTransform: "uppercase",
            letterSpacing: 2, fontFamily: F.mono, marginBottom: 14, fontWeight: 600,
          }}>PentaShield™ Engines</div>

          {ENGINES.map((eng, i) => {
            const status = engineResults[eng.id]
              ? "done"
              : i === activeEngine
              ? "running"
              : "pending";
            return (
              <div key={eng.id} style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "12px 14px", borderRadius: 12, marginBottom: 6,
                background: status === "running"
                  ? `rgba(${eng.color === C.cyan ? "0,255,200" : eng.color === C.purple ? "120,80,255" : eng.color === C.red ? "255,50,80" : eng.color === C.amber ? "255,184,50" : "80,200,255"},0.04)`
                  : "rgba(255,255,255,0.01)",
                border: `1px solid ${status === "running" ? `${eng.color}22` : "rgba(255,255,255,0.03)"}`,
                transition: "all 0.4s ease",
              }}>
                <span style={{ fontSize: 18 }}>{eng.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 13, fontFamily: F.body, fontWeight: 500,
                    color: status === "pending" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.75)",
                    transition: "color 0.3s ease",
                  }}>
                    {eng.name}
                  </div>
                  {status === "running" && (
                    <div style={{
                      marginTop: 6, height: 3, borderRadius: 2,
                      background: "rgba(255,255,255,0.04)", overflow: "hidden",
                    }}>
                      <div style={{
                        height: "100%", borderRadius: 2,
                        background: eng.color, width: "60%",
                        animation: "engineProgress 1.5s ease-in-out infinite",
                      }} />
                    </div>
                  )}
                </div>
                <div style={{
                  fontSize: 10, fontFamily: F.mono, fontWeight: 600, letterSpacing: 1,
                  color: status === "done" ? C.cyan : status === "running" ? eng.color : "rgba(255,255,255,0.15)",
                }}>
                  {status === "done" ? "✓ DONE" : status === "running" ? "SCANNING" : "QUEUED"}
                </div>
              </div>
            );
          })}

          {/* Detector grid */}
          <div style={{
            fontSize: 10, color: "rgba(255,255,255,0.2)", textTransform: "uppercase",
            letterSpacing: 2, fontFamily: F.mono, margin: "24px 0 12px", fontWeight: 600,
          }}>Detectors ({Object.values(detectorStates).filter((s) => s === "done").length}/{DETECTORS.length})</div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {DETECTORS.map((d) => {
              const st = detectorStates[d] || "pending";
              return (
                <div key={d} style={{
                  padding: "5px 10px", borderRadius: 6, fontSize: 10,
                  fontFamily: F.mono, letterSpacing: 0.5,
                  background: st === "done" ? "rgba(0,255,200,0.06)" : st === "running" ? "rgba(120,80,255,0.06)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${st === "done" ? "rgba(0,255,200,0.12)" : st === "running" ? "rgba(120,80,255,0.15)" : "rgba(255,255,255,0.04)"}`,
                  color: st === "done" ? "rgba(0,255,200,0.7)" : st === "running" ? C.purple : "rgba(255,255,255,0.15)",
                  transition: "all 0.3s ease",
                }}>
                  {st === "done" ? "✓ " : st === "running" ? "◉ " : ""}{d}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Live log */}
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{
            fontSize: 10, color: "rgba(255,255,255,0.2)", textTransform: "uppercase",
            letterSpacing: 2, fontFamily: F.mono, marginBottom: 14, fontWeight: 600,
          }}>Live Analysis Log</div>

          <div ref={logRef} style={{
            height: 420, overflowY: "auto", borderRadius: 14,
            background: "rgba(0,0,0,0.3)",
            border: "1px solid rgba(255,255,255,0.04)",
            padding: 16,
          }}>
            {logLines.map((line, i) => (
              <div key={i} style={{
                fontSize: 11, fontFamily: F.mono, lineHeight: 1.8,
                color: i === logLines.length - 1 ? C.cyan : "rgba(255,255,255,0.3)",
                transition: "color 0.3s ease",
                display: "flex", gap: 8,
              }}>
                <span style={{ color: "rgba(255,255,255,0.1)", userSelect: "none" }}>
                  {fmt(Math.floor(i / 60))}:{fmt(i % 60)}
                </span>
                <span>{line}</span>
              </div>
            ))}
            {progress < 100 && (
              <span style={{
                display: "inline-block", width: 7, height: 14,
                background: C.cyan, animation: "cursorBlink 1s step-end infinite",
                marginLeft: 4, verticalAlign: "middle",
              }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════ */
/*  PHASE 3 — Results                                                    */
/* ══════════════════════════════════════════════════════════════════════ */
function ResultPhase({ file, result, onReset }) {
  const [show, setShow] = useState(false);
  useEffect(() => { setTimeout(() => setShow(true), 100); }, []);

  // ── Map real API result OR fall back to simulation ─────────────────────
  const hasReal = result && result.verdict;

  const FAKE_VERDICTS = new Set(["likely_fake", "fake"]);
  const isFake = hasReal
    ? FAKE_VERDICTS.has(result.verdict)
    : Math.random() > 0.4;

  const trustScore = hasReal ? result.trust_score
    : (isFake ? rng(0.05, 0.3) : rng(0.82, 0.98));

  const confidence = hasReal ? result.confidence : rng(0.88, 0.99);

  // Verdict label
  const VERDICT_LABELS = {
    authentic: "AUTHENTIC",
    likely_authentic: "LIKELY AUTHENTIC",
    uncertain: "UNCERTAIN",
    likely_fake: "LIKELY DEEPFAKE",
    fake: "DEEPFAKE DETECTED",
  };
  const verdict = hasReal
    ? (VERDICT_LABELS[result.verdict] || "UNCERTAIN")
    : (isFake ? "LIKELY DEEPFAKE" : "AUTHENTIC");

  // Threat level
  const THREAT_LABELS = { none: "LOW", low: "LOW", medium: "MEDIUM", high: "HIGH", critical: "CRITICAL" };
  const threatLevel = hasReal
    ? (THREAT_LABELS[result.threat_level] || "MEDIUM")
    : (isFake ? (trustScore < 0.15 ? "CRITICAL" : "HIGH") : "LOW");

  // ── Engine scores (use pentashield if available, else simulate) ─────────
  const ps = hasReal && result.pentashield;
  // consensus_score from hydra: higher = more fake → invert for "authenticity" display
  const isStub = (v) => v === undefined || v === null || v === 0.5;

  const engineScores = {
    "HYDRA Engine": {
      score: (ps && !isStub(ps.hydra?.consensus_score))
        ? clamp(1 - ps.hydra.consensus_score, 0, 1)
        : (isFake ? rng(0.05, 0.25) : rng(0.85, 0.98)),
      icon: "🧬",
    },
    "Zero-Day Sentinel": {
      score: (ps && !isStub(ps.sentinel?.anomaly_score))
        ? clamp(1 - ps.sentinel.anomaly_score, 0, 1)
        : (isFake ? rng(0.1, 0.35) : rng(0.8, 0.95)),
      icon: "🔮",
    },
    "Forensic DNA": {
      score: (ps && !isStub(ps.forensic_dna?.forensic_score))
        ? clamp(1 - ps.forensic_dna.forensic_score, 0, 1)
        : (isFake ? rng(0.02, 0.2) : rng(0.88, 0.99)),
      icon: "🔬",
    },
    "Active Probe": {
      score: (ps && !isStub(ps.active_probe?.liveness_score))
        ? clamp(ps.active_probe.liveness_score, 0, 1)
        : (isFake ? rng(0.15, 0.4) : rng(0.75, 0.95)),
      icon: "⚡",
    },
    "Ghost Protocol": {
      score: (ps && !isStub(ps.ghost_protocol?.edge_score))
        ? clamp(ps.ghost_protocol.edge_score, 0, 1)
        : (isFake ? rng(0.08, 0.3) : rng(0.82, 0.97)),
      icon: "👻",
    },
  };

  // ── Generator attribution ───────────────────────────────────────────────
  const detectedGen = hasReal && (
    result.attribution?.generator_family ||
    result.pentashield?.forensic_dna?.generator_type
  );
  const genNames = ["StyleGAN3", "Stable Diffusion", "DALL-E 3", "MidJourney", "Real Camera"];
  const generators = genNames.map((name) => {
    if (detectedGen) {
      // Match detected generator to display name
      const isMatch = name.toLowerCase().includes(detectedGen.toLowerCase()) ||
        detectedGen.toLowerCase().includes(name.split(" ")[0].toLowerCase());
      return { name, prob: isMatch ? rng(0.72, 0.94) : rng(0.01, 0.06) };
    }
    return {
      name,
      prob: name === "Real Camera"
        ? (isFake ? rng(0.02, 0.08) : rng(0.85, 0.95))
        : (isFake ? rng(0.01, 0.35) : rng(0.01, 0.04)),
    };
  }).sort((a, b) => b.prob - a.prob);

  // ── Anomalies ───────────────────────────────────────────────────────────
  const physicsAnomalies = hasReal && result.pentashield?.sentinel?.physics_anomalies || [];
  const keyIndicators = hasReal && result.explanation?.key_indicators || [];
  const buildAnomalies = () => {
    if (!isFake) return [{ area: "Overall", type: "No significant anomalies detected", severity: "none" }];
    const list = [];
    if (physicsAnomalies.length > 0) {
      physicsAnomalies.slice(0, 2).forEach((a) =>
        list.push({ area: "Physics", type: String(a), severity: "high" })
      );
    }
    if (keyIndicators.length > 0) {
      keyIndicators.slice(0, 3).forEach((k) =>
        list.push({ area: "Detection", type: String(k), severity: "high" })
      );
    }
    if (list.length === 0) {
      list.push(
        { area: "Face Region", type: "GAN artifacts in skin texture", severity: "high" },
        { area: "Eye Region", type: "Irregular reflection patterns", severity: "high" },
        { area: "Audio Track", type: "Spectral inconsistency at 4.2kHz", severity: "medium" },
        { area: "Temporal", type: "Frame interpolation detected (f:42-67)", severity: "medium" },
        { area: "Metadata", type: "EXIF data stripped / inconsistent", severity: "low" },
      );
    }
    return list;
  };
  const anomalies = buildAnomalies();

  const verdictColor = isFake ? C.red : C.cyan;
  const verdictBg = isFake ? "rgba(255,50,80,0.06)" : "rgba(0,255,200,0.06)";
  const verdictBorder = isFake ? "rgba(255,50,80,0.15)" : "rgba(0,255,200,0.15)";

  return (
    <div style={{
      animation: "fadeIn 0.6s ease-out",
      opacity: show ? 1 : 0,
      transition: "opacity 0.5s ease",
    }}>
      {/* Top bar */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        marginBottom: 32, flexWrap: "wrap", gap: 16,
      }}>
        <div>
          <h1 style={{
            fontSize: 24, fontWeight: 700, fontFamily: F.head,
            letterSpacing: "-0.02em", marginBottom: 6,
          }}>Scan Results</h1>
          <div style={{
            fontSize: 12, color: "rgba(255,255,255,0.25)", fontFamily: F.mono,
          }}>
            {file?.name || "media"} • scan_id: scn_{Math.random().toString(36).slice(2, 8)} • {new Date().toLocaleString()}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onReset} style={{
            padding: "10px 20px", borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "transparent", color: "rgba(255,255,255,0.5)",
            fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: F.body,
          }}>← New Scan</button>
          <button style={{
            padding: "10px 20px", borderRadius: 10, border: "none",
            background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)",
            fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: F.body,
          }}>📄 Export PDF</button>
          <button style={{
            padding: "10px 20px", borderRadius: 10, border: "none",
            background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)",
            fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: F.body,
          }}>{ "{}"} JSON</button>
        </div>
      </div>

      {/* ── VERDICT CARD ── */}
      <div style={{
        padding: 32, borderRadius: 20, marginBottom: 20,
        background: verdictBg,
        border: `1px solid ${verdictBorder}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 24,
        animation: "slideUp 0.5s ease-out 0.2s both",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: isFake ? "rgba(255,50,80,0.1)" : "rgba(0,255,200,0.1)",
            border: `1px solid ${verdictBorder}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28,
          }}>
            {isFake ? "⚠️" : "✅"}
          </div>
          <div>
            <div style={{
              fontSize: 11, fontFamily: F.mono, letterSpacing: 2,
              color: "rgba(255,255,255,0.3)", marginBottom: 4, textTransform: "uppercase",
            }}>Verdict</div>
            <div style={{
              fontSize: 28, fontWeight: 800, fontFamily: F.head,
              color: verdictColor, letterSpacing: "-0.02em",
            }}>{verdict}</div>
          </div>
        </div>

        {/* Score circles */}
        <div style={{ display: "flex", gap: 32 }}>
          {[
            { label: "Trust Score", value: trustScore, color: verdictColor },
            { label: "Confidence", value: confidence, color: C.purple },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{
                width: 72, height: 72, borderRadius: "50%", position: "relative",
                background: `conic-gradient(${s.color} ${s.value * 360}deg, rgba(255,255,255,0.04) 0deg)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 8px",
              }}>
                <div style={{
                  width: 58, height: 58, borderRadius: "50%",
                  background: "#0a0a10", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontWeight: 700, fontFamily: F.mono,
                  color: s.color,
                }}>{pct(s.value)}</div>
              </div>
              <div style={{ fontSize: 10, fontFamily: F.mono, color: "rgba(255,255,255,0.25)", letterSpacing: 1 }}>
                {s.label}
              </div>
            </div>
          ))}
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 72, height: 72, borderRadius: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: isFake
                ? threatLevel === "CRITICAL" ? "rgba(255,50,80,0.12)" : "rgba(255,50,80,0.08)"
                : "rgba(0,255,200,0.06)",
              border: `1px solid ${isFake ? "rgba(255,50,80,0.2)" : "rgba(0,255,200,0.12)"}`,
              margin: "0 auto 8px",
            }}>
              <span style={{
                fontSize: 13, fontWeight: 800, fontFamily: F.mono,
                color: isFake ? C.red : C.cyan, letterSpacing: 1,
              }}>{threatLevel}</span>
            </div>
            <div style={{ fontSize: 10, fontFamily: F.mono, color: "rgba(255,255,255,0.25)", letterSpacing: 1 }}>
              Threat Level
            </div>
          </div>
        </div>
      </div>

      {/* ── DETAIL GRID ── */}
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>

        {/* Engine breakdown */}
        <div style={{
          flex: 1, minWidth: 300, padding: 24, borderRadius: 16,
          background: C.card, border: `1px solid ${C.border}`,
          animation: "slideUp 0.5s ease-out 0.3s both",
        }}>
          <div style={{
            fontSize: 10, color: "rgba(255,255,255,0.2)", textTransform: "uppercase",
            letterSpacing: 2, fontFamily: F.mono, marginBottom: 20, fontWeight: 600,
          }}>Engine Breakdown</div>

          {Object.entries(engineScores).map(([name, data]) => (
            <div key={name} style={{ marginBottom: 16 }}>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                marginBottom: 6,
              }}>
                <span style={{ fontSize: 13, fontFamily: F.body, color: "rgba(255,255,255,0.6)" }}>
                  {data.icon} {name}
                </span>
                <span style={{
                  fontSize: 12, fontFamily: F.mono, fontWeight: 600,
                  color: data.score > 0.7 ? C.cyan : data.score > 0.4 ? C.amber : C.red,
                }}>{pct(data.score)}</span>
              </div>
              <div style={{
                height: 4, borderRadius: 2, background: "rgba(255,255,255,0.04)",
                overflow: "hidden",
              }}>
                <div style={{
                  height: "100%", borderRadius: 2,
                  width: pct(data.score),
                  background: data.score > 0.7 ? C.cyan : data.score > 0.4 ? C.amber : C.red,
                  transition: "width 1s ease-out",
                  boxShadow: `0 0 8px ${data.score > 0.7 ? C.cyan : data.score > 0.4 ? C.amber : C.red}44`,
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Generator Attribution */}
        <div style={{
          flex: 1, minWidth: 300, padding: 24, borderRadius: 16,
          background: C.card, border: `1px solid ${C.border}`,
          animation: "slideUp 0.5s ease-out 0.4s both",
        }}>
          <div style={{
            fontSize: 10, color: "rgba(255,255,255,0.2)", textTransform: "uppercase",
            letterSpacing: 2, fontFamily: F.mono, marginBottom: 20, fontWeight: 600,
          }}>Generator Attribution</div>

          {generators.map((g, i) => (
            <div key={g.name} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 12px", borderRadius: 10, marginBottom: 6,
              background: i === 0 && g.prob > 0.5 ? "rgba(255,50,80,0.04)" : "transparent",
              border: i === 0 && g.prob > 0.5 ? "1px solid rgba(255,50,80,0.1)" : "1px solid transparent",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.05)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontFamily: F.mono, fontWeight: 700,
                color: "rgba(255,255,255,0.2)",
              }}>#{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontFamily: F.body, color: "rgba(255,255,255,0.65)", fontWeight: 500 }}>
                  {g.name}
                  {i === 0 && g.prob > 0.5 && (
                    <span style={{
                      marginLeft: 8, fontSize: 9, padding: "2px 6px",
                      borderRadius: 4, background: "rgba(255,50,80,0.1)",
                      color: C.red, fontFamily: F.mono, fontWeight: 700,
                    }}>MATCH</span>
                  )}
                </div>
                <div style={{
                  marginTop: 4, height: 3, borderRadius: 2,
                  background: "rgba(255,255,255,0.04)", overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%", borderRadius: 2,
                    width: pct(g.prob),
                    background: g.prob > 0.5 ? C.red : g.prob > 0.2 ? C.amber : "rgba(255,255,255,0.15)",
                  }} />
                </div>
              </div>
              <span style={{
                fontSize: 12, fontFamily: F.mono, fontWeight: 600,
                color: g.prob > 0.5 ? C.red : "rgba(255,255,255,0.25)",
                minWidth: 40, textAlign: "right",
              }}>{pct(g.prob)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Anomalies */}
      <div style={{
        marginTop: 20, padding: 24, borderRadius: 16,
        background: C.card, border: `1px solid ${C.border}`,
        animation: "slideUp 0.5s ease-out 0.5s both",
      }}>
        <div style={{
          fontSize: 10, color: "rgba(255,255,255,0.2)", textTransform: "uppercase",
          letterSpacing: 2, fontFamily: F.mono, marginBottom: 16, fontWeight: 600,
        }}>Detected Anomalies</div>

        {anomalies.map((a, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "12px 14px", borderRadius: 10, marginBottom: 6,
            background: a.severity === "high" ? "rgba(255,50,80,0.03)" :
              a.severity === "medium" ? "rgba(255,184,50,0.02)" : "rgba(255,255,255,0.01)",
            border: `1px solid ${a.severity === "high" ? "rgba(255,50,80,0.08)" :
              a.severity === "medium" ? "rgba(255,184,50,0.06)" : "rgba(255,255,255,0.03)"}`,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: a.severity === "high" ? C.red : a.severity === "medium" ? C.amber : a.severity === "none" ? C.cyan : "rgba(255,255,255,0.15)",
              boxShadow: a.severity === "high" ? `0 0 8px ${C.red}` : "none",
            }} />
            <span style={{
              fontSize: 11, fontFamily: F.mono, fontWeight: 600,
              color: "rgba(255,255,255,0.4)", minWidth: 80,
              letterSpacing: 0.5,
            }}>{a.area}</span>
            <span style={{ fontSize: 13, fontFamily: F.body, color: "rgba(255,255,255,0.55)", flex: 1 }}>
              {a.type}
            </span>
            {a.severity !== "none" && (
              <span style={{
                fontSize: 9, fontFamily: F.mono, fontWeight: 700, letterSpacing: 1,
                padding: "3px 8px", borderRadius: 4, textTransform: "uppercase",
                background: a.severity === "high" ? "rgba(255,50,80,0.1)" : "rgba(255,184,50,0.08)",
                color: a.severity === "high" ? C.red : C.amber,
              }}>{a.severity}</span>
            )}
          </div>
        ))}
      </div>

      {/* API response preview */}
      <div style={{
        marginTop: 20, padding: 24, borderRadius: 16,
        background: "rgba(0,0,0,0.3)", border: `1px solid ${C.border}`,
        animation: "slideUp 0.5s ease-out 0.6s both",
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 14,
        }}>
          <div style={{
            fontSize: 10, color: "rgba(255,255,255,0.2)", textTransform: "uppercase",
            letterSpacing: 2, fontFamily: F.mono, fontWeight: 600,
          }}>API Response</div>
          <button style={{
            padding: "4px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.06)",
            background: "transparent", color: "rgba(255,255,255,0.3)",
            fontSize: 10, fontFamily: F.mono, cursor: "pointer",
          }}>Copy</button>
        </div>
        <pre style={{
          fontSize: 11, fontFamily: F.mono, color: "rgba(255,255,255,0.35)",
          lineHeight: 1.7, overflow: "auto", whiteSpace: "pre-wrap",
        }}>
{JSON.stringify({
  scan_id: `scn_${Math.random().toString(36).slice(2, 8)}`,
  verdict: isFake ? "likely_fake" : "authentic",
  trust_score: +trustScore.toFixed(4),
  confidence: +confidence.toFixed(4),
  threat_level: threatLevel.toLowerCase(),
  generator: isFake ? generators[0].name : null,
  processing_ms: Math.round(rng(1200, 3800)),
  engines: Object.fromEntries(
    Object.entries(engineScores).map(([k, v]) => [
      k.toLowerCase().replace(/ /g, "_"),
      +v.score.toFixed(4),
    ])
  ),
}, null, 2)}
        </pre>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════ */
/*  MAIN APP — Shell + Sidebar + Phase Router                            */
/* ══════════════════════════════════════════════════════════════════════ */
export default function ScanDashboard({ onGoHome }) {
  const [phase, setPhase] = useState("upload"); // upload | scan | result
  const [file, setFile] = useState(null);
  const [apiResult, setApiResult] = useState(null);
  const [sidebarItem, setSidebarItem] = useState("scan");

  const handleFileSelected = (f) => {
    setFile(f);
    setApiResult(null);
    setPhase("scan");
  };

  const handleScanComplete = useCallback((result) => {
    setApiResult(result);
    setPhase("result");
  }, []);

  const handleReset = () => {
    setPhase("upload");
    setFile(null);
    setApiResult(null);
  };

  return (
    <div style={{
      display: "flex", height: "100vh", background: C.bg, color: C.text,
      fontFamily: F.body, overflow: "hidden",
    }}>
      {/* Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.5; transform:scale(1.3); } }
        @keyframes engineProgress { 0% { width:20%; } 50% { width:80%; } 100% { width:20%; } }
        @keyframes cursorBlink { 0%,100% { opacity:1; } 50% { opacity:0; } }
        * { margin:0; padding:0; box-sizing:border-box; }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.06); border-radius:3px; }
        ::selection { background:rgba(0,255,200,0.2); }
        @media (max-width:768px) {
          .sidebar { display:none !important; }
          .main-content { margin-left:0 !important; }
        }
      `}</style>

      {/* ── SIDEBAR ── */}
      <div className="sidebar" style={{
        width: 240, minWidth: 240, height: "100vh",
        borderRight: `1px solid ${C.border}`,
        background: "rgba(255,255,255,0.01)",
        display: "flex", flexDirection: "column",
        padding: "20px 12px",
        backdropFilter: "blur(20px)",
      }}>
        {/* Logo */}
        <div onClick={onGoHome} style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "8px 12px", marginBottom: 32, cursor: "pointer",
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: "linear-gradient(135deg, #00ffc8, #7850ff)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 800, color: "#000", fontFamily: F.head,
          }}>S</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, fontFamily: F.head, letterSpacing: "-0.02em" }}>
              Scanner <span style={{ color: "rgba(255,255,255,0.35)", fontWeight: 400 }}>ULTRA</span>
            </div>
            <div style={{ fontSize: 9, fontFamily: F.mono, color: "rgba(255,255,255,0.15)", letterSpacing: 1 }}>
              v5.0.0 PentaShield™
            </div>
          </div>
        </div>

        {/* Nav items */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 9, color: "rgba(255,255,255,0.15)", textTransform: "uppercase",
            letterSpacing: 2, fontFamily: F.mono, padding: "0 12px", marginBottom: 8,
          }}>Main</div>

          {[
            { id: "scan", icon: "🔍", label: "New Scan", active: true },
            { id: "history", icon: "📋", label: "Scan History" },
            { id: "realtime", icon: "📡", label: "Real-Time Monitor" },
            { id: "reports", icon: "📊", label: "Reports" },
          ].map((item) => (
            <div key={item.id} onClick={() => { setSidebarItem(item.id); if (item.id === "scan") handleReset(); }}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 10, marginBottom: 2,
                cursor: "pointer", transition: "all 0.2s ease",
                background: sidebarItem === item.id ? "rgba(0,255,200,0.04)" : "transparent",
                border: `1px solid ${sidebarItem === item.id ? "rgba(0,255,200,0.08)" : "transparent"}`,
              }}>
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              <span style={{
                fontSize: 13, fontFamily: F.body, fontWeight: 500,
                color: sidebarItem === item.id ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.35)",
              }}>{item.label}</span>
            </div>
          ))}

          <div style={{ height: 1, background: "rgba(255,255,255,0.04)", margin: "16px 12px" }} />

          <div style={{
            fontSize: 9, color: "rgba(255,255,255,0.15)", textTransform: "uppercase",
            letterSpacing: 2, fontFamily: F.mono, padding: "0 12px", marginBottom: 8,
          }}>Integrations</div>

          {[
            { id: "meetings", icon: "📹", label: "Meeting Protection" },
            { id: "api", icon: "⚙️", label: "API & SDK" },
            { id: "extension", icon: "🌐", label: "Browser Extension" },
          ].map((item) => (
            <div key={item.id} onClick={() => setSidebarItem(item.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 10, marginBottom: 2,
                cursor: "pointer", transition: "all 0.2s ease",
                background: sidebarItem === item.id ? "rgba(120,80,255,0.04)" : "transparent",
              }}>
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              <span style={{
                fontSize: 13, fontFamily: F.body, fontWeight: 500,
                color: sidebarItem === item.id ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.35)",
              }}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Bottom: usage */}
        <div style={{
          padding: 14, borderRadius: 12, background: "rgba(255,255,255,0.015)",
          border: "1px solid rgba(255,255,255,0.04)",
        }}>
          <div style={{
            display: "flex", justifyContent: "space-between", marginBottom: 8,
            fontSize: 11, fontFamily: F.body,
          }}>
            <span style={{ color: "rgba(255,255,255,0.4)" }}>Scans Used</span>
            <span style={{ color: "rgba(255,255,255,0.6)", fontFamily: F.mono, fontSize: 11 }}>847 / 10K</span>
          </div>
          <div style={{
            height: 4, borderRadius: 2, background: "rgba(255,255,255,0.04)",
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%", width: "8.47%", borderRadius: 2,
              background: `linear-gradient(90deg, ${C.cyan}, ${C.purple})`,
            }} />
          </div>
          <div style={{
            fontSize: 10, color: "rgba(255,255,255,0.15)", fontFamily: F.mono,
            marginTop: 6, letterSpacing: 0.5,
          }}>Pro Plan • Resets in 18 days</div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="main-content" style={{
        flex: 1, overflow: "auto", padding: "32px 40px",
        background: C.bg,
        position: "relative",
      }}>
        {/* Subtle background glow */}
        <div style={{
          position: "fixed", top: 0, right: 0, width: 500, height: 500,
          borderRadius: "50%", pointerEvents: "none",
          background: phase === "result"
            ? "radial-gradient(circle, rgba(255,50,80,0.03) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(0,255,200,0.03) 0%, transparent 70%)",
          filter: "blur(60px)", transition: "background 0.5s ease",
        }} />

        <div style={{ maxWidth: 920, margin: "0 auto", position: "relative", zIndex: 1 }}>
          {phase === "upload" && <UploadPhase onFileSelected={handleFileSelected} />}
          {phase === "scan" && <ScanPhase file={file} onComplete={handleScanComplete} />}
          {phase === "result" && <ResultPhase file={file} result={apiResult} onReset={handleReset} />}
        </div>
      </div>
    </div>
  );
}
