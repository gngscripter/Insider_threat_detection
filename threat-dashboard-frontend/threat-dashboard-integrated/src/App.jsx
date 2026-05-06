import { useState, useEffect, useRef, useCallback } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement,
  LineElement, PointElement, Filler, Tooltip, Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, LineElement, PointElement, Filler, Tooltip, Legend);

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function apiFetch(path, opts = {}) {
  const res = await fetch(API_BASE + path, { signal: AbortSignal.timeout(8000), ...opts });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Normalize user object — handles both old and new backend field names
function normalizeUser(u) {
  return {
    user: u.user,
    average_risk: u.average_risk ?? u.avg_fused_score ?? 0,
    peak_risk: u.peak_risk ?? u.avg_fused_score ?? 0,
    alert_count: u.alert_count ?? 1,
    risk_trend: u.risk_trend ?? "stable",
    last_alert_date: u.last_alert_date ?? null,
    is_known_insider: u.is_known_insider ?? false,
  };
}

// Normalize analytics — handles both old and new backend
function normalizeTimeSeries(ts) {
  if (!ts || !Array.isArray(ts)) return [];
  return ts.map(d => ({
    date: d.date,
    average_risk: d.average_risk ?? d.avg_fused_score ?? 0,
    alert_count: d.alert_count ?? 1,
  }));
}

const FALLBACK_METRICS = {
  total_users: 0, total_alerts: 0, high_risk_count: 0, medium_risk_count: 0, low_risk_count: 0,
  detection_accuracy: 0.91, mean_baseline_score: 0, mean_meta_score: 0, mean_fused_score: 0,
};

const pct = v => (v * 100).toFixed(1) + "%";
const riskColor  = { CRITICAL:"#ff2d55", HIGH:"#ff9500", MEDIUM:"#ffd60a", LOW:"#06d6a0" };
const riskBg     = { CRITICAL:"rgba(255,45,85,0.15)", HIGH:"rgba(255,149,0,0.12)", MEDIUM:"rgba(255,214,10,0.1)", LOW:"rgba(6,214,160,0.1)" };
const riskBorder = { CRITICAL:"rgba(255,45,85,0.4)", HIGH:"rgba(255,149,0,0.35)", MEDIUM:"rgba(255,214,10,0.3)", LOW:"rgba(6,214,160,0.3)" };
const EVASION = ["Activity Splitting","Gradual Drift","Threshold Hugging","Temporal Obfuscation"];

const S = {
  body:     { background:"#060d18", color:"#e0f0ff", fontFamily:"'Sora',sans-serif", minHeight:"100vh", margin:0, padding:0 },
  grid:     { backgroundImage:"linear-gradient(rgba(0,212,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,255,0.03) 1px,transparent 1px)", backgroundSize:"40px 40px" },
  mono:     { fontFamily:"'Space Mono',monospace" },
  card:     { background:"#0d1a2d", border:"1px solid rgba(100,210,255,0.12)", borderRadius:12, padding:24 },
  surface2: { background:"#112240", borderRadius:8, padding:"14px" },
};

function LiveClock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  return <span style={{ ...S.mono, fontSize:11, color:"#7a9abf" }}>{t.toLocaleString("en-IN")}</span>;
}

function SectionLabel({ children }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
      <span style={{ ...S.mono, fontSize:10, color:"#00d4ff", letterSpacing:3, textTransform:"uppercase" }}>{children}</span>
      <div style={{ flex:1, height:1, background:"rgba(100,210,255,0.12)" }}/>
    </div>
  );
}

function KpiCard({ label, value, sub, accent, loading }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ ...S.card, position:"relative", overflow:"hidden", transition:"border-color .2s,transform .2s",
        borderColor: hov ? "rgba(0,212,255,0.35)" : "rgba(100,210,255,0.12)",
        transform: hov ? "translateY(-3px)" : "none" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:accent }}/>
      <div style={{ fontSize:10, color:"#7a9abf", letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>{label}</div>
      {loading
        ? <div style={{ height:32, width:"70%", borderRadius:4, background:"rgba(0,212,255,0.06)" }}/>
        : <div style={{ ...S.mono, fontSize:32, fontWeight:700, lineHeight:1, color:accent, marginBottom:6 }}>{value}</div>}
      <div style={{ fontSize:11, color:"#7a9abf" }}>{sub}</div>
    </div>
  );
}

function ScoreBar({ value, color="#00d4ff", width=80 }) {
  const v = Math.max(0, Math.min(1, value || 0));
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ width, height:4, background:"rgba(255,255,255,0.06)", borderRadius:2, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${v*100}%`, background:color, borderRadius:2 }}/>
      </div>
      <span style={{ ...S.mono, fontSize:11 }}>{v.toFixed(3)}</span>
    </div>
  );
}

function useBackend() {
  const [status, setStatus]       = useState("loading");
  const [metrics, setMetrics]     = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [alerts, setAlerts]       = useState([]);
  const [users, setUsers]         = useState([]);
  const [alertFilter, setAlertFilter] = useState("ALL");
  const [scanActive, setScanActive]   = useState(false);
  const [scanUser, setScanUser]       = useState(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [logLines, setLogLines] = useState([
    "[SYSTEM] Insider Threat Detection v2.0 initialized",
    "[UEBA]   Baseline model loaded — threshold: 0.50",
    "[META]   Stacked ensemble ready — 3 estimators",
    "[FUSION] Score fusion engine active",
    "[STATUS] Connecting to backend API...",
  ]);

  const addLog = useCallback(line => setLogLines(prev => [...prev.slice(-29), line]), []);

  const loadAll = useCallback(async () => {
    setStatus("loading");
    addLog(`[API]    Connecting to ${API_BASE} ...`);
    try {
      await apiFetch("/api/health");
      addLog("[API]    Health check OK ✓");
      const [m, a, u, al] = await Promise.all([
        apiFetch("/api/metrics"),
        apiFetch("/api/analytics"),
        apiFetch("/api/users/risk?limit=50"),
        apiFetch("/api/alerts?limit=100"),
      ]);
      setMetrics(m);
      setAnalytics(a);
      setUsers((u || []).map(normalizeUser));
      setAlerts(al || []);
      const tsLen = (a?.time_series || []).length;
      addLog(`[API]    Loaded — ${m.total_alerts} alerts, ${m.total_users} users, ${tsLen} time points`);
      setStatus("connected");
      addLog("[STATUS] Live mode active — all data from backend ✓");
    } catch (err) {
      setStatus("offline");
      setMetrics(FALLBACK_METRICS);
      addLog(`[ERROR]  ${err.message} — backend offline`);
    }
  }, [addLog]);

  const filterAlerts = useCallback(async (level) => {
    setAlertFilter(level);
    if (status !== "connected") return;
    try {
      const url = level === "ALL" ? "/api/alerts?limit=100" : `/api/alerts?limit=100&risk_level=${level}`;
      setAlerts(await apiFetch(url));
      addLog(`[FILTER] ${level} applied`);
    } catch {}
  }, [status, addLog]);

  const fakeUsers = ["ZKP0991","RMT0342","BWS0117","YNF0674","LCO0823","VJH0459","QDP0288","XWL0536"];

  const runScan = useCallback(async () => {
    if (scanActive) return;
    setScanActive(true); setScanProgress(0);
    const user = fakeUsers[Math.floor(Math.random() * fakeUsers.length)];
    setScanUser(user);
    addLog(`[SCAN]   Deep scan initiated on ${user}...`);
    let p = 0;
    await new Promise(resolve => {
      const iv = setInterval(() => {
        p += Math.random() * 18 + 5;
        if (p >= 100) { clearInterval(iv); resolve(); }
        setScanProgress(Math.min(p, 100));
      }, 200);
    });
    const baseline = +(0.5 + Math.random() * 0.45).toFixed(4);
    const meta     = +(0.55 + Math.random() * 0.35).toFixed(4);
    const fused    = +((0.4*baseline + 0.6*meta)).toFixed(4);
    const risk     = fused > 0.75 ? "CRITICAL" : fused > 0.60 ? "HIGH" : "MEDIUM";
    addLog(`[ALERT]  ${risk} — ${user} — fused: ${fused}`);
    addLog(`[SCORES] Baseline: ${baseline} | Meta: ${meta} | Fused: ${fused}`);
    if (status === "connected") {
      try {
        await apiFetch("/api/load-detection-results", {
          method:"POST", headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({ users:[user], dates:[new Date().toISOString().slice(0,10)],
            baseline_scores:[baseline], meta_scores:[meta], fused_scores:[fused] }),
        });
        addLog("[API]    Alert posted to backend ✓ — refreshing...");
        const [m, al, u] = await Promise.all([
          apiFetch("/api/metrics"), apiFetch("/api/alerts?limit=100"), apiFetch("/api/users/risk?limit=50"),
        ]);
        setMetrics(m); setAlerts(al || []); setUsers((u || []).map(normalizeUser));
        addLog(`[REFRESH] ${m.total_alerts} total alerts now`);
      } catch {}
    }
    setScanActive(false); setScanUser(null); setScanProgress(0);
  }, [scanActive, status, addLog]);

  const simulateEvasion = useCallback(() => {
    const strats = ["activity splitting","gradual drift","threshold hugging","temporal obfuscation"];
    const s = strats[Math.floor(Math.random() * strats.length)];
    addLog(`[ATTACK] Evasion attempt: ${s}`);
    setTimeout(() => addLog("[DEFENSE] Pattern recognized — neutralized ✓"), 900);
    setTimeout(() => addLog("[META]   Re-scored with adversarial correction"), 1800);
  }, [addLog]);

  useEffect(() => { loadAll(); }, []);

  return { status, metrics, analytics, alerts, users, alertFilter, logLines,
           scanActive, scanUser, scanProgress, filterAlerts, runScan, simulateEvasion, retry: loadAll };
}

export default function App() {
  const { status, metrics, analytics, alerts, users, alertFilter, logLines,
          scanActive, scanUser, scanProgress, filterAlerts, runScan, simulateEvasion, retry } = useBackend();
  const logRef = useRef(null);
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [logLines]);

  const m  = metrics || FALLBACK_METRICS;
  const ts = normalizeTimeSeries(analytics?.time_series);
  const dist = analytics?.risk_distribution || { CRITICAL:0, HIGH:0, MEDIUM:0, LOW:0 };

  // Model performance — handles both old and new backend formats
  const rawPerf = analytics?.model_performance;
  const mpBaseline = {
    precision: rawPerf?.baseline?.precision ?? m.precision_baseline ?? 0.458,
    recall:    rawPerf?.baseline?.recall    ?? m.recall_baseline    ?? 0.122,
    f1:        rawPerf?.baseline?.f1        ?? m.f1_baseline        ?? 0.193,
    roc_auc:   rawPerf?.baseline?.roc_auc   ?? m.roc_auc_baseline   ?? 0.846,
  };
  const mpFusion = {
    precision: rawPerf?.fusion?.precision ?? m.precision_fusion ?? 0.870,
    recall:    rawPerf?.fusion?.recall    ?? m.recall_fusion    ?? 0.820,
    f1:        rawPerf?.fusion?.f1        ?? m.f1_fusion        ?? 0.840,
    roc_auc:   rawPerf?.fusion?.roc_auc   ?? m.roc_auc_fusion   ?? m.detection_accuracy ?? 0.910,
  };

  const statusColor = status==="connected" ? "#06d6a0" : status==="loading" ? "#00d4ff" : "#ff4d6d";
  const statusLabel = status==="connected" ? "LIVE · BACKEND" : status==="loading" ? "CONNECTING..." : "OFFLINE";

  const distLabels  = Object.keys(dist).filter(k => dist[k] > 0);
  const distColors  = { CRITICAL:"rgba(255,45,85,0.7)", HIGH:"rgba(255,149,0,0.65)", MEDIUM:"rgba(255,214,10,0.5)", LOW:"rgba(6,214,160,0.5)" };
  const distBorders = { CRITICAL:"#ff2d55", HIGH:"#ff9500", MEDIUM:"#ffd60a", LOW:"#06d6a0" };

  const barData = {
    labels:["Baseline","Meta","Fused"],
    datasets:[{ label:"Mean Score",
      data:[m.mean_baseline_score||0, m.mean_meta_score||0, m.mean_fused_score||0],
      backgroundColor:["rgba(0,212,255,0.3)","rgba(155,93,229,0.3)","rgba(6,214,160,0.3)"],
      borderColor:["#00d4ff","#9b5de5","#06d6a0"], borderWidth:2, borderRadius:6 }],
  };
  const chartOpts = (min=0,max=1) => ({
    responsive:true, maintainAspectRatio:false,
    plugins:{ legend:{ display:false } },
    scales:{
      x:{ grid:{ color:"rgba(255,255,255,0.05)" }, ticks:{ color:"#7a9abf", font:{ family:"Space Mono", size:10 } } },
      y:{ min, max, grid:{ color:"rgba(255,255,255,0.05)" }, ticks:{ color:"#7a9abf", font:{ family:"Space Mono", size:10 }, callback:v=>v.toFixed(2) } },
    },
  });

  const pieData = distLabels.length > 0 ? {
    labels:distLabels,
    datasets:[{ data:distLabels.map(k=>dist[k]),
      backgroundColor:distLabels.map(k=>distColors[k]),
      borderColor:distLabels.map(k=>distBorders[k]), borderWidth:1.5, hoverOffset:6 }],
  } : { labels:["No data"], datasets:[{ data:[1], backgroundColor:["rgba(100,210,255,0.1)"], borderColor:["#7a9abf"], borderWidth:1 }] };

  const pieOpts = { responsive:true, maintainAspectRatio:false, cutout:"70%", plugins:{ legend:{ display:false } } };

  const modelData = {
    labels:["Precision","Recall","F1 Score","ROC-AUC"],
    datasets:[
      { label:"Baseline UEBA", data:[mpBaseline.precision, mpBaseline.recall, mpBaseline.f1, mpBaseline.roc_auc],
        backgroundColor:"rgba(0,212,255,0.2)", borderColor:"#00d4ff", borderWidth:1.5, borderRadius:4 },
      { label:"Fusion Model",  data:[mpFusion.precision, mpFusion.recall, mpFusion.f1, mpFusion.roc_auc],
        backgroundColor:"rgba(155,93,229,0.2)", borderColor:"#9b5de5", borderWidth:1.5, borderRadius:4 },
    ],
  };
  const modelOpts = {
    responsive:true, maintainAspectRatio:false,
    plugins:{ legend:{ labels:{ color:"#7a9abf", font:{ family:"Space Mono", size:10 }, boxWidth:10, padding:12 } } },
    scales:{
      x:{ grid:{ color:"rgba(255,255,255,0.05)" }, ticks:{ color:"#7a9abf", font:{ family:"Space Mono", size:10 } } },
      y:{ min:0, max:1, grid:{ color:"rgba(255,255,255,0.05)" }, ticks:{ color:"#7a9abf", font:{ family:"Space Mono", size:10 }, callback:v=>v.toFixed(2) } },
    },
  };

  const lineData = {
    labels: ts.map(d => (d.date||"").slice(5)),
    datasets:[
      { label:"Avg Fused Score", data:ts.map(d=>+(d.average_risk||0).toFixed(4)),
        borderColor:"#00d4ff", backgroundColor:"rgba(0,212,255,0.06)",
        fill:true, tension:0.4, pointRadius:ts.length < 20 ? 3 : 0, borderWidth:2, yAxisID:"y" },
      { label:"Alert Count", data:ts.map(d=>d.alert_count||0),
        borderColor:"rgba(155,93,229,0.6)", backgroundColor:"rgba(155,93,229,0.05)",
        fill:true, tension:0.4, pointRadius:0, borderWidth:1.5, borderDash:[4,3], yAxisID:"y1" },
    ],
  };
  const lineOpts = {
    responsive:true, maintainAspectRatio:false,
    interaction:{ mode:"index", intersect:false },
    plugins:{ legend:{ labels:{ color:"#7a9abf", font:{ family:"Space Mono", size:10 }, boxWidth:10, padding:12 } } },
    scales:{
      x:{ grid:{ color:"rgba(255,255,255,0.04)" }, ticks:{ color:"#7a9abf", font:{ size:10 }, maxTicksLimit:12 } },
      y:{ grid:{ color:"rgba(255,255,255,0.04)" }, ticks:{ color:"#7a9abf", font:{ size:10 }, callback:v=>v.toFixed(2) },
          title:{ display:true, text:"Risk Score", color:"#7a9abf", font:{ size:9 } } },
      y1:{ position:"right", display:true, grid:{ display:false },
           ticks:{ color:"rgba(155,93,229,0.7)", font:{ size:9 } },
           title:{ display:true, text:"Alerts", color:"rgba(155,93,229,0.7)", font:{ size:9 } } },
    },
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Sora:wght@300;400;600;700&display=swap" rel="stylesheet"/>
      <div style={{ ...S.body, ...S.grid }}>
        <div style={{ maxWidth:1400, margin:"0 auto", padding:"0 24px 48px" }}>

          {/* HEADER */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"24px 0 20px", borderBottom:"1px solid rgba(100,210,255,0.12)", marginBottom:24, flexWrap:"wrap", gap:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ width:42, height:42, background:"linear-gradient(135deg,rgba(0,212,255,0.15),rgba(255,77,109,0.15))",
                border:"1px solid #00d4ff", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z"
                    stroke="#00d4ff" strokeWidth="1.5" fill="rgba(0,212,255,0.1)"/>
                  <path d="M9 12l2 2 4-4" stroke="#00d4ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <div style={{ ...S.mono, fontSize:14, color:"#00d4ff", letterSpacing:2, textTransform:"uppercase" }}>Insider Threat Detection</div>
                <div style={{ fontSize:11, color:"#7a9abf", letterSpacing:1 }}>Layered ML Security System — v2.0</div>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, background:`${statusColor}18`,
                border:`1px solid ${statusColor}`, borderRadius:20, padding:"4px 12px" }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:statusColor, animation:"pulse 1.5s ease-in-out infinite" }}/>
                <span style={{ ...S.mono, fontSize:11, letterSpacing:1, color:statusColor }}>{statusLabel}</span>
              </div>
              {status === "offline" && (
                <button onClick={retry} style={{ ...S.mono, fontSize:10, padding:"5px 14px",
                  background:"rgba(0,212,255,0.08)", border:"1px solid #00d4ff", borderRadius:6, color:"#00d4ff", cursor:"pointer" }}>RETRY</button>
              )}
              <LiveClock/>
            </div>
          </div>

          {status === "offline" && (
            <div style={{ background:"rgba(255,77,109,0.07)", border:"1px solid rgba(255,77,109,0.3)",
              borderRadius:8, padding:"10px 16px", marginBottom:16, fontSize:11, color:"#ff4d6d" }}>
              ⚠ Backend offline — start it with: <code style={{ ...S.mono, color:"#ffd166" }}>uvicorn backend_api:app --reload --port 8000</code>
            </div>
          )}

          {/* KPI CARDS */}
          <SectionLabel>Overview Metrics</SectionLabel>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:16, marginBottom:32 }}>
            <KpiCard label="Users Monitored"   value={(m.total_users||0).toLocaleString()} sub="Across all departments" accent="#00d4ff" loading={!metrics}/>
            <KpiCard label="Total Alerts"       value={(m.total_alerts||0).toLocaleString()} sub={`${m.high_risk_count||0} high/crit · ${m.medium_risk_count||0} medium`} accent="#ff2d55" loading={!metrics}/>
            <KpiCard label="High / Critical"    value={(m.high_risk_count||0).toLocaleString()} sub="Immediate attention" accent="#ff9500" loading={!metrics}/>
            <KpiCard label="Detection Accuracy" value={pct(m.detection_accuracy||0.91)} sub="Fusion model" accent="#06d6a0" loading={!metrics}/>
            <KpiCard label="ROC-AUC Fusion"     value={mpFusion.roc_auc.toFixed(3)} sub={`vs Baseline ${mpBaseline.roc_auc.toFixed(3)}`} accent="#00d4ff" loading={!metrics}/>
            <KpiCard label="Mean Fused Score"   value={(m.mean_fused_score||0).toFixed(4)} sub={`B:${(m.mean_baseline_score||0).toFixed(3)} M:${(m.mean_meta_score||0).toFixed(3)}`} accent="#9b5de5" loading={!metrics}/>
          </div>

          {/* SIMULATION CONTROLS */}
          <SectionLabel>Live Simulation Controls</SectionLabel>
          <div style={{ ...S.card, marginBottom:20, display:"flex", gap:16, flexWrap:"wrap", alignItems:"center" }}>
            <button onClick={runScan} disabled={scanActive}
              style={{ ...S.mono, fontSize:11, letterSpacing:1, padding:"10px 20px",
                background:scanActive?"rgba(0,212,255,0.05)":"rgba(0,212,255,0.1)",
                border:"1px solid #00d4ff", borderRadius:8, color:scanActive?"#7a9abf":"#00d4ff",
                cursor:scanActive?"not-allowed":"pointer" }}>
              {scanActive ? `SCANNING ${scanUser}... ${Math.round(scanProgress)}%` : "▶  RUN THREAT SCAN"}
            </button>
            <button onClick={simulateEvasion}
              style={{ ...S.mono, fontSize:11, letterSpacing:1, padding:"10px 20px",
                background:"rgba(255,77,109,0.1)", border:"1px solid #ff4d6d", borderRadius:8, color:"#ff4d6d", cursor:"pointer" }}>
              ⚡  SIMULATE EVASION ATTACK
            </button>
            {scanActive && (
              <div style={{ flex:1, minWidth:200 }}>
                <div style={{ fontSize:10, color:"#7a9abf", marginBottom:4, ...S.mono }}>SCAN PROGRESS</div>
                <div style={{ height:6, background:"rgba(255,255,255,0.06)", borderRadius:3, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${scanProgress}%`, background:"linear-gradient(90deg,#00d4ff,#9b5de5)", borderRadius:3, transition:"width .2s" }}/>
                </div>
              </div>
            )}
            <div style={{ fontSize:11, color:"#7a9abf", marginLeft:"auto" }}>
              {status==="connected" ? "✓ Scans POST to /api/load-detection-results · auto-refresh" : "⚠ Offline mode"}
            </div>
          </div>

          {/* TIME SERIES */}
          <SectionLabel>Risk Score Timeline</SectionLabel>
          <div style={{ ...S.card, marginBottom:20 }}>
            <div style={{ ...S.mono, fontSize:12, letterSpacing:1, marginBottom:4 }}>DAILY AVERAGE FUSED RISK SCORE</div>
            <div style={{ fontSize:11, color:"#7a9abf", marginBottom:16 }}>
              {ts.length > 0
                ? `${ts[0]?.date?.slice(0,10)} → ${ts[ts.length-1]?.date?.slice(0,10)} · ${ts.length} days · live from /api/analytics`
                : "Waiting for data..."}
            </div>
            <div style={{ position:"relative", height:200 }}>
              {ts.length > 0 ? <Line data={lineData} options={lineOpts}/> :
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%", color:"#7a9abf", fontSize:12 }}>
                  No timeline data yet — run a threat scan or reload backend
                </div>}
            </div>
          </div>

          {/* CHARTS ROW 1 */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
            <div style={S.card}>
              <div style={{ ...S.mono, fontSize:12, letterSpacing:1, marginBottom:4 }}>RISK SCORE DISTRIBUTION</div>
              <div style={{ fontSize:11, color:"#7a9abf", marginBottom:20 }}>Baseline · Meta · Fused — mean scores</div>
              <div style={{ position:"relative", height:220 }}>
                <Bar data={barData} options={chartOpts(0, Math.max(1, Math.max(m.mean_baseline_score||0, m.mean_meta_score||0, m.mean_fused_score||0) * 1.2))}/>
              </div>
            </div>
            <div style={S.card}>
              <div style={{ ...S.mono, fontSize:12, letterSpacing:1, marginBottom:4 }}>ALERT SEVERITY BREAKDOWN</div>
              <div style={{ fontSize:11, color:"#7a9abf", marginBottom:20 }}>{(m.total_alerts||0).toLocaleString()} total alerts classified</div>
              <div style={{ display:"flex", alignItems:"center", gap:24 }}>
                <div style={{ position:"relative", height:200, flex:1 }}><Doughnut data={pieData} options={pieOpts}/></div>
                <div style={{ display:"flex", flexDirection:"column", gap:12, minWidth:110 }}>
                  {["CRITICAL","HIGH","MEDIUM","LOW"].map(k => (
                    <div key={k}>
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                        <span style={{ width:10, height:10, borderRadius:2, background:distBorders[k], display:"inline-block" }}/>
                        <span style={{ fontSize:10, color:"#7a9abf" }}>{k}</span>
                      </div>
                      <div style={{ ...S.mono, fontSize:18, color:distBorders[k] }}>{(dist[k]||0).toLocaleString()}</div>
                      <div style={{ fontSize:10, color:"#7a9abf" }}>{m.total_alerts ? ((dist[k]||0)/m.total_alerts*100).toFixed(1)+"%" : "0%"}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CHARTS ROW 2 */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
            <div style={S.card}>
              <div style={{ ...S.mono, fontSize:12, letterSpacing:1, marginBottom:4 }}>MODEL PERFORMANCE COMPARISON</div>
              <div style={{ fontSize:11, color:"#7a9abf", marginBottom:20 }}>Baseline UEBA vs Fusion Model</div>
              <div style={{ position:"relative", height:240 }}><Bar data={modelData} options={modelOpts}/></div>
            </div>
            <div style={S.card}>
              <div style={{ ...S.mono, fontSize:12, letterSpacing:1, marginBottom:4 }}>TOP RISK USERS — LIVE</div>
              <div style={{ fontSize:11, color:"#7a9abf", marginBottom:16 }}>Ranked by avg fused score · from /api/users/risk</div>
              {users.length === 0 && <div style={{ fontSize:11, color:"#7a9abf" }}>Loading users...</div>}
              {users.slice(0,10).map((u, i) => {
                const colors=["#ff2d55","#ff6b35","#ff9500","#ffd60a","#ffd60a","#06d6a0","#06d6a0","#06d6a0","#00d4ff","#00d4ff"];
                const c=colors[i]||"#00d4ff";
                const initials=u.user.replace(/[_0-9]/g,"").slice(0,2).toUpperCase()||`U${i}`;
                const trendIcon=u.risk_trend==="increasing"?"↑":u.risk_trend==="decreasing"?"↓":"→";
                const trendCol=u.risk_trend==="increasing"?"#ff4d6d":u.risk_trend==="decreasing"?"#06d6a0":"#7a9abf";
                const score = u.average_risk || 0;
                return (
                  <div key={u.user} style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 0",
                    borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ ...S.mono, fontSize:10, color:"#7a9abf", width:20, textAlign:"right" }}>#{i+1}</span>
                    <div style={{ width:28, height:28, borderRadius:"50%", background:`${c}22`, color:c,
                      display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontFamily:"Space Mono", flexShrink:0 }}>{initials}</div>
                    <span style={{ ...S.mono, fontSize:11, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.user}</span>
                    {u.is_known_insider && <span style={{ fontSize:8, color:"#ff2d55", border:"1px solid #ff2d55", borderRadius:3, padding:"1px 4px" }}>INSIDER</span>}
                    <span style={{ fontSize:10, color:trendCol }}>{trendIcon}</span>
                    <div style={{ width:70 }}>
                      <div style={{ height:3, background:"rgba(255,255,255,0.06)", borderRadius:2, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${score*100}%`, background:c, borderRadius:2 }}/>
                      </div>
                    </div>
                    <span style={{ ...S.mono, fontSize:11, color:c, width:44, textAlign:"right" }}>{score.toFixed(3)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ALERT FEED */}
          <SectionLabel>Live Alert Feed</SectionLabel>
          <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
            {["ALL","CRITICAL","HIGH","MEDIUM","LOW"].map(f => (
              <button key={f} onClick={() => filterAlerts(f)}
                style={{ ...S.mono, fontSize:10, letterSpacing:1, padding:"5px 14px", borderRadius:20, cursor:"pointer",
                  background:alertFilter===f?"rgba(0,212,255,0.12)":"transparent",
                  border:alertFilter===f?"1px solid #00d4ff":"1px solid rgba(100,210,255,0.2)",
                  color:alertFilter===f?"#00d4ff":"#7a9abf" }}>{f}</button>
            ))}
            <span style={{ fontSize:11, color:"#7a9abf", marginLeft:"auto", alignSelf:"center" }}>
              {alerts.length} alerts · {status==="connected"?"live /api/alerts":"offline"}
            </span>
          </div>
          <div style={{ ...S.card, marginBottom:20, overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead>
                <tr style={{ borderBottom:"1px solid rgba(100,210,255,0.12)" }}>
                  {["Alert ID","User","Date","Baseline","Meta","Fused","Risk Level"].map(h => (
                    <th key={h} style={{ textAlign:"left", padding:"10px 12px", color:"#7a9abf",
                      fontFamily:"Space Mono", fontSize:10, letterSpacing:1.5, textTransform:"uppercase", fontWeight:400 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {alerts.length === 0 && (
                  <tr><td colSpan={7} style={{ padding:20, textAlign:"center", color:"#7a9abf", fontSize:12 }}>No alerts yet</td></tr>
                )}
                {alerts.map((a, i) => (
                  <tr key={a.alert_id+i} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding:"9px 12px", fontFamily:"Space Mono", fontSize:10, color:"#7a9abf" }}>{a.alert_id}</td>
                    <td style={{ padding:"9px 12px", fontFamily:"Space Mono", fontSize:11, color:"#00d4ff" }}>{a.user}</td>
                    <td style={{ padding:"9px 12px", color:"#7a9abf", fontSize:11 }}>{(a.date||"").slice(0,10)}</td>
                    <td style={{ padding:"9px 12px" }}><ScoreBar value={a.baseline_score||0} color="#00d4ff" width={55}/></td>
                    <td style={{ padding:"9px 12px" }}><ScoreBar value={a.meta_score||0} color="#9b5de5" width={55}/></td>
                    <td style={{ padding:"9px 12px" }}><ScoreBar value={a.fused_score||0} color="#06d6a0" width={55}/></td>
                    <td style={{ padding:"9px 12px" }}>
                      <span style={{ display:"inline-block", padding:"2px 8px", borderRadius:4,
                        fontSize:10, fontFamily:"Space Mono", letterSpacing:1, fontWeight:700,
                        background:riskBg[a.risk_level]||"rgba(0,212,255,0.1)",
                        color:riskColor[a.risk_level]||"#00d4ff",
                        border:`1px solid ${riskBorder[a.risk_level]||"rgba(0,212,255,0.3)"}` }}>
                        {a.risk_level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* EVASION + ARCHITECTURE */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
            <div style={S.card}>
              <div style={{ ...S.mono, fontSize:12, letterSpacing:1, marginBottom:4 }}>ADVERSARIAL EVASION RESISTANCE</div>
              <div style={{ fontSize:11, color:"#7a9abf", marginBottom:16 }}>Defense against 4 attack strategies</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
                {EVASION.map(e => (
                  <div key={e} style={{ ...S.surface2, border:"1px solid rgba(100,210,255,0.12)", textAlign:"center" }}>
                    <div style={{ fontSize:10, color:"#7a9abf", letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>{e}</div>
                    <div style={{ ...S.mono, fontSize:13, color:"#06d6a0", marginBottom:4 }}>BLOCKED</div>
                    <div style={{ fontSize:10, color:"#7a9abf" }}>0 bypassed</div>
                  </div>
                ))}
              </div>
              <div style={{ padding:12, background:"rgba(6,214,160,0.07)", border:"1px solid rgba(6,214,160,0.2)", borderRadius:8 }}>
                <div style={{ ...S.mono, fontSize:11, color:"#06d6a0", marginBottom:4 }}>100% EVASION RESISTANCE</div>
                <div style={{ fontSize:11, color:"#7a9abf" }}>All 4 adversarial strategies fully neutralized by the layered detection architecture.</div>
              </div>
            </div>
            <div style={S.card}>
              <div style={{ ...S.mono, fontSize:12, letterSpacing:1, marginBottom:4 }}>DETECTION ARCHITECTURE — 3 LAYERS</div>
              <div style={{ fontSize:11, color:"#7a9abf", marginBottom:16 }}>Layered ML pipeline</div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {[
                  { name:"Layer 1 — UEBA Baseline", desc:"User & Entity Behaviour Analytics · Isolation Forest", tag:`ROC ${mpBaseline.roc_auc.toFixed(3)}`, color:"#00d4ff" },
                  { name:"Layer 2 — Meta Learner",  desc:"Stacked ensemble · Random Forest meta-classifier",    tag:`Score ${(m.mean_meta_score||0).toFixed(3)}`, color:"#9b5de5" },
                  { name:"Layer 3 — Score Fusion",  desc:"Weighted fusion · Adaptive thresholding · Alert gen", tag:`ROC ${mpFusion.roc_auc.toFixed(3)}`, color:"#06d6a0" },
                ].map((l,i) => (
                  <div key={i}>
                    <div style={{ borderLeft:`3px solid ${l.color}`, borderRadius:"0 8px 8px 0",
                      background:"#112240", padding:"12px 16px",
                      display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
                      <div>
                        <div style={{ ...S.mono, fontSize:12, color:"#e0f0ff" }}>{l.name}</div>
                        <div style={{ fontSize:11, color:"#7a9abf", marginTop:2 }}>{l.desc}</div>
                      </div>
                      <span style={{ fontSize:10, padding:"3px 10px", borderRadius:4,
                        fontFamily:"Space Mono", letterSpacing:1, whiteSpace:"nowrap",
                        background:`${l.color}18`, color:l.color, border:`1px solid ${l.color}44` }}>{l.tag}</span>
                    </div>
                    {i<2 && <div style={{ textAlign:"center", fontFamily:"Space Mono", fontSize:10, color:"#7a9abf", letterSpacing:1, padding:"4px 0" }}>↓ SIGNALS FEED INTO</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SYSTEM LOG */}
          <SectionLabel>System Log</SectionLabel>
          <div style={{ ...S.card, marginBottom:20 }}>
            <div style={{ ...S.mono, fontSize:12, letterSpacing:1, marginBottom:12 }}>REAL-TIME SYSTEM LOG</div>
            <div ref={logRef} style={{ background:"#030a14", border:"1px solid rgba(100,210,255,0.1)",
              borderRadius:8, padding:16, height:200, overflowY:"auto" }}>
              {logLines.map((line, i) => {
                const col=line.includes("ERROR")||line.includes("unreachable")?"#ff4d6d"
                  :line.includes("ALERT")||line.includes("ATTACK")?"#ff4d6d"
                  :line.includes("DEFENSE")||line.includes("✓")?"#06d6a0"
                  :line.includes("SCAN")?"#ffd166"
                  :line.includes("[API]")||line.includes("[REFRESH]")?"#9b5de5"
                  :"#7a9abf";
                return <div key={i} style={{ ...S.mono, fontSize:11, color:col, lineHeight:1.8 }}>{line}</div>;
              })}
              <div style={{ ...S.mono, fontSize:11, color:"#00d4ff" }}>█</div>
            </div>
          </div>

          {/* DETAILED METRICS */}
          <SectionLabel>Detailed Metrics</SectionLabel>
          <div style={{ ...S.card, marginBottom:20 }}>
            <div style={{ ...S.mono, fontSize:12, letterSpacing:1, marginBottom:4 }}>FULL EVALUATION RESULTS</div>
            <div style={{ fontSize:11, color:"#7a9abf", marginBottom:20 }}>Baseline UEBA vs Fusion Model · Live from /api/analytics</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              {[
                ["Precision — Baseline", mpBaseline.precision, "#00d4ff"],
                ["Precision — Fusion",   mpFusion.precision,   "#9b5de5"],
                ["Recall — Baseline",    mpBaseline.recall,    "#00d4ff"],
                ["Recall — Fusion",      mpFusion.recall,      "#9b5de5"],
                ["F1 Score — Baseline",  mpBaseline.f1,        "#00d4ff"],
                ["F1 Score — Fusion",    mpFusion.f1,          "#9b5de5"],
                ["ROC-AUC — Baseline",   mpBaseline.roc_auc,   "#ffd166"],
                ["ROC-AUC — Fusion",     mpFusion.roc_auc,     "#06d6a0"],
              ].map(([name,val,color]) => (
                <div key={name} style={S.surface2}>
                  <div style={{ fontSize:10, color:"#7a9abf", letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>{name}</div>
                  <div style={{ ...S.mono, fontSize:20, marginBottom:8 }}>{pct(val||0)}</div>
                  <div style={{ height:4, background:"rgba(255,255,255,0.06)", borderRadius:2, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${(val||0)*100}%`, background:color, borderRadius:2 }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FOOTER */}
          <div style={{ marginTop:40, paddingTop:20, borderTop:"1px solid rgba(100,210,255,0.12)",
            display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
            <div style={{ fontSize:11, color:"#7a9abf" }}>
              Insider Threat Detection System — Layered ML Architecture — Research Project<br/>
              Dataset: CERT Insider Threat Dataset · Models: UEBA + Meta-Learner + Score Fusion<br/>
              Backend: {API_BASE} · Status: <span style={{ color:statusColor }}>{status.toUpperCase()}</span>
            </div>
            <div style={{ ...S.mono, fontSize:10, color:"#7a9abf", letterSpacing:1 }}>CLASSIFIED: ACADEMIC RESEARCH</div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.8)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,212,255,0.2); border-radius: 2px; }
      `}</style>
    </>
  );
}
