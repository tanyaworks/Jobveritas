import { useState, useEffect } from "react";
import axios from "axios";

const API = "https://jobveritas.onrender.com";

const GaugeCircle = ({ value }) => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const color = value < 30 ? "#22c55e" : value < 60 ? "#f59e0b" : "#ef4444";
  return (
    <svg width="150" height="150" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={radius} fill="none" stroke="#1e1e1e" strokeWidth="12" />
      <circle cx="70" cy="70" r={radius} fill="none" stroke={color} strokeWidth="12"
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 70 70)"
        style={{ transition: "stroke-dashoffset 1s ease", filter: `drop-shadow(0 0 8px ${color})` }} />
      <text x="70" y="63" textAnchor="middle" fill={color} fontSize="22" fontWeight="700">{value}%</text>
      <text x="70" y="82" textAnchor="middle" fill="#555" fontSize="10">FAKE PROBABILITY</text>
    </svg>
  );
};

const HighlightedText = ({ text, flags }) => {
  if (!text || !flags.length) return <p style={{ color: "#555", fontSize: "0.85rem", lineHeight: 1.7 }}>{text?.slice(0, 600)}...</p>;
  let parts = [{ text, highlight: false }];
  flags.forEach(flag => {
    parts = parts.flatMap(part => {
      if (part.highlight) return [part];
      const idx = part.text.toLowerCase().indexOf(flag.toLowerCase());
      if (idx === -1) return [part];
      return [
        { text: part.text.slice(0, idx), highlight: false },
        { text: part.text.slice(idx, idx + flag.length), highlight: true },
        { text: part.text.slice(idx + flag.length), highlight: false },
      ];
    });
  });
  return (
    <p style={{ color: "#888", fontSize: "0.85rem", lineHeight: 1.8, maxHeight: 300, overflowY: "auto" }}>
      {parts.slice(0, 80).map((p, i) => p.highlight
        ? <mark key={i} style={{ background: "#ef444422", color: "#ef4444", borderRadius: 4, padding: "2px 5px", border: "1px solid #ef444444" }}>{p.text}</mark>
        : <span key={i}>{p.text}</span>
      )}
    </p>
  );
};

export default function App() {
  const [mode, setMode] = useState("text");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const saved = localStorage.getItem("jobveritas_history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveToHistory = (res, inputText) => {
    const entry = { id: Date.now(), date: new Date().toLocaleString(), verdict: res.verdict, color: res.color, fake_probability: res.fake_probability, preview: inputText.slice(0, 80) + "..." };
    const updated = [entry, ...history].slice(0, 10);
    setHistory(updated);
    localStorage.setItem("jobveritas_history", JSON.stringify(updated));
  };

  const scrapeUrl = async () => {
    if (!url.trim()) return;
    setScraping(true);
    try {
      const res = await axios.post(`${API}/scrape`, { url });
      setText(res.data.text);
      setMode("text");
    } catch (e) { alert("Could not scrape that URL."); }
    setScraping(false);
  };

  const analyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await axios.post(`${API}/analyze`, { text, company_name: companyName });
      setResult(res.data);
      saveToHistory(res.data, text);
      setActiveTab("overview");
    } catch (e) { alert("Backend not running."); }
    setLoading(false);
  };

  const vc = { green: "#22c55e", yellow: "#f59e0b", red: "#ef4444" };
  const vb = { green: "#052e16", yellow: "#1c1407", red: "#1c0606" };

  return (
    <div style={{ minHeight: "100vh", background: "#060606", color: "#fff", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        textarea { border: none !important; outline: none !important; background: #0d0d0d !important; }
        .glow-btn:hover { box-shadow: 0 0 20px #6366f155; transform: translateY(-1px); }
        .glow-btn { transition: all 0.2s; }
        .card:hover { border-color: #2a2a2a !important; }
        .card { transition: border-color 0.2s; }
      `}</style>

      <div style={{ borderBottom: "1px solid #111", padding: "1rem 2.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, background: "#060606ee" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: "0 0 12px #6366f155" }}>🔍</div>
          <span style={{ fontWeight: 800, fontSize: "1.15rem", letterSpacing: "-0.02em" }}>Job<span style={{ color: "#6366f1" }}>veritas</span></span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {[["18k", "samples"], ["99%", "accuracy"], ["2", "ML models"]].map(([val, label]) => (
              <div key={label} style={{ background: "#0f0f0f", border: "1px solid #1a1a1a", borderRadius: 8, padding: "4px 12px", textAlign: "center" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#6366f1" }}>{val}</div>
                <div style={{ fontSize: "0.65rem", color: "#444" }}>{label}</div>
              </div>
            ))}
          </div>
          <button onClick={() => setShowHistory(!showHistory)} style={{ background: showHistory ? "#6366f1" : "#111", border: "1px solid #1e1e1e", color: showHistory ? "#fff" : "#666", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}>
            🕐 History <span style={{ background: showHistory ? "#ffffff22" : "#1e1e1e", borderRadius: 4, padding: "1px 6px", fontSize: "0.7rem", color: showHistory ? "#fff" : "#6366f1" }}>{history.length}</span>
          </button>
        </div>
      </div>

      {showHistory && (
        <div style={{ position: "fixed", top: 65, right: 0, width: 260, bottom: 0, background: "#080808", borderLeft: "1px solid #141414", padding: "1.25rem", overflowY: "auto", zIndex: 99 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h3 style={{ margin: 0, fontSize: "0.78rem", color: "#555", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>History</h3>
            {history.length > 0 && <button onClick={() => { setHistory([]); localStorage.removeItem("jobveritas_history"); }} style={{ background: "none", border: "none", color: "#333", cursor: "pointer", fontSize: "0.72rem" }}>Clear</button>}
          </div>
          {history.length === 0
            ? <p style={{ color: "#222", margin: 0, fontSize: "0.8rem" }}>No analyses yet</p>
            : history.map(h => (
              <div key={h.id} style={{ padding: "0.7rem 0", borderBottom: "1px solid #111" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: vc[h.color], flexShrink: 0, boxShadow: `0 0 4px ${vc[h.color]}` }} />
                  <span style={{ fontSize: "0.78rem", color: vc[h.color], fontWeight: 700 }}>{h.fake_probability}% fake</span>
                  <span style={{ fontSize: "0.68rem", color: "#2a2a2a", marginLeft: "auto" }}>{h.date.split(",")[0]}</span>
                </div>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "#3a3a3a", lineHeight: 1.5, paddingLeft: 14, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{h.preview}</p>
              </div>
            ))
          }
        </div>
      )}

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "4rem 2rem", transition: "margin-right 0.2s", marginRight: showHistory ? "260px" : "auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <div style={{ display: "inline-block", background: "#0f0f0f", border: "1px solid #1e1e1e", borderRadius: 20, padding: "4px 14px", fontSize: "0.75rem", color: "#6366f1", marginBottom: "1.5rem", fontWeight: 500 }}>
            ✦ Ensemble ML — Random Forest + Logistic Regression
          </div>
          <h1 style={{ fontSize: "3.5rem", fontWeight: 800, lineHeight: 1.1, margin: "0 0 1rem", letterSpacing: "-0.03em" }}>
            Is that job<br /><span style={{ color: "#6366f1", textShadow: "0 0 40px #6366f155" }}>real?</span>
          </h1>
          <p style={{ color: "#444", fontSize: "1rem", margin: 0, lineHeight: 1.6 }}>
            Paste a job description or drop a URL.<br />Get an instant authenticity verdict in seconds.
          </p>
        </div>

        <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 20, padding: "1.75rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", gap: 6, marginBottom: "1.25rem", background: "#111", borderRadius: 10, padding: 4, width: "fit-content" }}>
            {[["text", "📋 Paste Text"], ["url", "🔗 From URL"]].map(([m, label]) => (
              <button key={m} onClick={() => setMode(m)} style={{ padding: "0.35rem 1rem", borderRadius: 7, border: "none", background: mode === m ? "#6366f1" : "transparent", color: mode === m ? "#fff" : "#555", cursor: "pointer", fontSize: "0.82rem", fontWeight: mode === m ? 600 : 400, transition: "all 0.2s" }}>{label}</button>
            ))}
          </div>

          {mode === "url" ? (
            <div style={{ display: "flex", gap: 8, marginBottom: "0.75rem" }}>
              <input value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && scrapeUrl()}
                placeholder="https://linkedin.com/jobs/... or any job posting URL"
                style={{ flex: 1, background: "#111", border: "1px solid #1e1e1e", borderRadius: 10, color: "#fff", padding: "0.7rem 1rem", fontSize: "0.9rem", outline: "none" }} />
              <button onClick={scrapeUrl} disabled={scraping} className="glow-btn" style={{ padding: "0.7rem 1.4rem", background: "#6366f1", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" }}>
                {scraping ? "Fetching..." : "Fetch →"}
              </button>
            </div>
          ) : (
            <textarea value={text} onChange={e => setText(e.target.value)}
              placeholder="Paste the full job description here — title, company, requirements, salary..."
              style={{ width: "100%", height: 180, borderRadius: 10, color: "#ccc", fontSize: "0.92rem", resize: "none", fontFamily: "inherit", lineHeight: 1.7, padding: "1rem", marginBottom: "0.75rem", display: "block" }} />
          )}

          <input value={companyName} onChange={e => setCompanyName(e.target.value)}
            placeholder="🏢 Company name (optional — enables web verification)"
            style={{ width: "100%", background: "#111", border: "1px solid #1e1e1e", borderRadius: 10, color: "#aaa", padding: "0.65rem 1rem", fontSize: "0.85rem", outline: "none" }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.25rem" }}>
            <span style={{ fontSize: "0.78rem", color: "#2a2a2a" }}>{text.length > 0 ? `${text.length} chars` : "No input yet"}</span>
            <button onClick={analyze} disabled={loading || !text.trim()} className="glow-btn" style={{ padding: "0.7rem 2rem", background: loading || !text.trim() ? "#1a1a1a" : "linear-gradient(135deg, #6366f1, #8b5cf6)", color: loading || !text.trim() ? "#333" : "#fff", border: "none", borderRadius: 10, fontSize: "0.95rem", cursor: loading || !text.trim() ? "not-allowed" : "pointer", fontWeight: 700 }}>
              {loading ? "Analyzing..." : "Analyze Job →"}
            </button>
          </div>
        </div>

        {result && (
          <div style={{ marginTop: "2.5rem" }}>
            <div style={{ background: vb[result.color], border: `1px solid ${vc[result.color]}44`, borderRadius: 20, padding: "2rem 2.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1.5rem", marginBottom: "1.5rem", boxShadow: `0 0 40px ${vc[result.color]}11` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ width: 60, height: 60, borderRadius: "50%", background: `${vc[result.color]}15`, border: `2px solid ${vc[result.color]}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", color: vc[result.color], fontWeight: 800, boxShadow: `0 0 20px ${vc[result.color]}33` }}>
                  {result.color === "green" ? "✓" : result.color === "yellow" ? "⚠" : "✕"}
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: vc[result.color], fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, opacity: 0.7 }}>Verdict</div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 800, color: vc[result.color], letterSpacing: "-0.02em" }}>{result.verdict}</div>
                  <div style={{ fontSize: "0.85rem", color: "#666", marginTop: 4 }}>{result.real_probability}% probability this is a genuine posting</div>
                  <div style={{ fontSize: "0.8rem", color: "#555", marginTop: 4 }}>
                    Confidence range: <span style={{ color: vc[result.color] }}>{result.confidence_interval?.lower}% – {result.confidence_interval?.upper}%</span>
                    <span style={{ marginLeft: 8, background: "#1a1a1a", padding: "2px 8px", borderRadius: 20, fontSize: "0.72rem", color: result.confidence_level === "High" ? "#22c55e" : result.confidence_level === "Medium" ? "#f59e0b" : "#888" }}>
                      {result.confidence_level} confidence
                    </span>
                  </div>
                </div>
              </div>
              <GaugeCircle value={result.fake_probability} />
            </div>

            <div style={{ display: "flex", gap: 2, marginBottom: "1.25rem", background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 12, padding: 4, width: "fit-content" }}>
              {[["overview", "Overview"], ["highlights", "Highlights"], ["share", "Share"]].map(([tab, label]) => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "0.4rem 1.1rem", borderRadius: 8, border: "none", background: activeTab === tab ? "#1a1a1a" : "transparent", color: activeTab === tab ? "#fff" : "#444", cursor: "pointer", fontSize: "0.82rem", fontWeight: activeTab === tab ? 600 : 400, transition: "all 0.15s" }}>{label}</button>
              ))}
            </div>

            {activeTab === "overview" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="card" style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 16, padding: "1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.25rem" }}>
                    <span>🚩</span>
                    <span style={{ fontWeight: 700, fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#888" }}>Red Flags</span>
                    <span style={{ marginLeft: "auto", background: result.red_flags.length > 0 ? "#2a0808" : "#082a08", color: result.red_flags.length > 0 ? "#ef4444" : "#22c55e", fontSize: "0.72rem", padding: "3px 10px", borderRadius: 20, fontWeight: 700 }}>{result.red_flags.length} found</span>
                  </div>
                  {result.red_flags.length === 0
                    ? <div style={{ color: "#22c55e", fontSize: "0.88rem" }}>✓ No suspicious phrases detected</div>
                    : result.red_flags.map((f, i) => (
                      <div key={i} style={{ background: "#1a0808", border: "1px solid #ef444418", borderRadius: 8, padding: "0.45rem 0.9rem", marginBottom: 6, color: "#ef4444", fontSize: "0.84rem" }}>▸ {f}</div>
                    ))
                  }
                </div>

                <div className="card" style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 16, padding: "1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.25rem" }}>
                    <span>⚡</span>
                    <span style={{ fontWeight: 700, fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#888" }}>Pressure Score</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 10 }}>
                    <span style={{ fontSize: "3rem", fontWeight: 800, color: result.desperation_score > 40 ? "#f59e0b" : "#2a2a2a", lineHeight: 1 }}>{result.desperation_score}</span>
                    <span style={{ color: "#333", fontSize: "1rem" }}>/100</span>
                  </div>
                  <div style={{ height: 6, background: "#111", borderRadius: 3, marginBottom: 14, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${result.desperation_score}%`, background: "linear-gradient(90deg, #f59e0b, #ef4444)", borderRadius: 3, transition: "width 1s ease" }} />
                  </div>
                  {result.pressure_words.length > 0
                    ? result.pressure_words.map((w, i) => (
                      <span key={i} style={{ display: "inline-block", background: "#1c1407", border: "1px solid #f59e0b22", color: "#f59e0b", fontSize: "0.78rem", padding: "3px 10px", borderRadius: 20, marginRight: 6, marginBottom: 6 }}>{w}</span>
                    ))
                    : <span style={{ color: "#2a2a2a", fontSize: "0.85rem" }}>No pressure tactics</span>
                  }
                </div>

                {result.company_verification && (
                  <div className="card" style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 16, padding: "1.5rem", gridColumn: "1 / -1" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem" }}>
                      <span>🏢</span>
                      <span style={{ fontWeight: 700, fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#888" }}>Company Verification</span>
                      <span style={{ marginLeft: "auto", background: result.company_verification.verified ? "#082a08" : "#2a0808", color: result.company_verification.verified ? "#22c55e" : "#ef4444", fontSize: "0.72rem", padding: "3px 10px", borderRadius: 20, fontWeight: 700 }}>
                        {result.company_verification.verified ? "✓ Verified" : "✕ Not verified"}
                      </span>
                    </div>
                    <p style={{ color: "#555", fontSize: "0.84rem", margin: "0 0 10px" }}>{result.company_verification.reason}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {result.company_verification.domains_found?.map((d, i) => (
                        <span key={i} style={{ background: "#111", border: "1px solid #1e1e1e", color: "#555", fontSize: "0.78rem", padding: "3px 10px", borderRadius: 20 }}>{d}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "highlights" && (
              <div className="card" style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 16, padding: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.8rem", color: "#444", background: "#111", padding: "3px 10px", borderRadius: 20, border: "1px solid #1e1e1e" }}>
                    {result.red_flags.length} phrases highlighted
                  </span>
                </div>
                <HighlightedText text={text} flags={result.red_flags} />
              </div>
            )}

            {activeTab === "share" && (
              <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 16, padding: "1.5rem" }}>
                <p style={{ color: "#444", fontSize: "0.82rem", margin: "0 0 1rem" }}>Shareable result card</p>
                <div id="share-card" style={{ background: "#111", border: `1px solid ${vc[result.color]}33`, borderRadius: 14, padding: "1.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem" }}>
                    <div style={{ width: 22, height: 22, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>🔍</div>
                    <span style={{ fontWeight: 800, fontSize: "0.95rem" }}>Job<span style={{ color: "#6366f1" }}>veritas</span> <span style={{ color: "#333", fontWeight: 400 }}>Analysis Result</span></span>
                  </div>
                  <div style={{ fontSize: "2rem", fontWeight: 800, color: vc[result.color], marginBottom: 6 }}>{result.verdict}</div>
                  <div style={{ fontSize: "0.9rem", color: "#555", marginBottom: "1rem" }}>
                    Fake: <span style={{ color: vc[result.color], fontWeight: 700 }}>{result.fake_probability}%</span> · Real: <span style={{ color: "#888" }}>{result.real_probability}%</span>
                  </div>
                  {result.red_flags.length > 0 && (
                    <div style={{ background: "#1a0808", border: "1px solid #ef444418", borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "0.75rem" }}>
                      <div style={{ fontSize: "0.75rem", color: "#ef4444", fontWeight: 600, marginBottom: 4 }}>RED FLAGS</div>
                      <div style={{ fontSize: "0.84rem", color: "#ef4444", opacity: 0.8 }}>{result.red_flags.join(" · ")}</div>
                    </div>
                  )}
                  <div style={{ fontSize: "0.72rem", color: "#2a2a2a", marginTop: "0.75rem" }}>Jobveritas · {new Date().toLocaleDateString()}</div>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(document.getElementById("share-card").innerText); alert("Copied!"); }}
                  className="glow-btn" style={{ marginTop: "1rem", padding: "0.55rem 1.4rem", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>
                  Copy to clipboard
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
