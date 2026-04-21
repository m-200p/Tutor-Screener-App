"use client";
import { useState, useEffect } from "react";

interface DimensionScore {
  score: number;
  quote: string;
  feedback: string;
}

interface Assessment {
  clarity: DimensionScore;
  warmth: DimensionScore;
  simplicity: DimensionScore;
  patience: DimensionScore;
  fluency: DimensionScore;
  recommendation: "advance" | "reject" | "maybe";
  summary: string;
}

interface Candidate {
  id: string;
  name: string;
  date: string;
  messages: { role: string; content: string }[];
  assessment: Assessment;
}

const DIMENSIONS = [
  { key: "clarity", label: "Communication Clarity", emoji: "🗣️" },
  { key: "warmth", label: "Warmth & Encouragement", emoji: "🤝" },
  { key: "simplicity", label: "Ability to Simplify", emoji: "💡" },
  { key: "patience", label: "Patience & Empathy", emoji: "🧘" },
  { key: "fluency", label: "English Fluency", emoji: "✨" },
];

const recConfig = {
  advance: { label: "Advance", color: "bg-green-500/10 text-green-400 border-green-500/30", dot: "🟢" },
  maybe: { label: "Review", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30", dot: "🟡" },
  reject: { label: "Reject", color: "bg-red-500/10 text-red-400 border-red-500/30", dot: "🔴" },
};

const scoreColor = (score: number) => {
  if (score >= 4) return "bg-green-500";
  if (score >= 3) return "bg-yellow-400";
  return "bg-red-400";
};

const avgScore = (assessment: Assessment) => {
  const dims = ["clarity", "warmth", "simplicity", "patience", "fluency"];
  const total = dims.reduce((sum, d) => sum + (assessment[d as keyof Assessment] as DimensionScore).score, 0);
  return (total / dims.length).toFixed(1);
};

export default function RecruiterPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [tab, setTab] = useState<"assessment" | "transcript">("assessment");

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("candidates") || "[]");
    setCandidates(stored);
  }, []);

  const deleteCandidate = (id: string) => {
    const updated = candidates.filter(c => c.id !== id);
    setCandidates(updated);
    localStorage.setItem("candidates", JSON.stringify(updated));
    if (selected?.id === id) setSelected(null);
  };

  const updateStatus = (id: string, recommendation: "advance" | "reject" | "maybe") => {
    const updated = candidates.map(c =>
      c.id === id ? { ...c, assessment: { ...c.assessment, recommendation } } : c
    );
    setCandidates(updated);
    localStorage.setItem("candidates", JSON.stringify(updated));
    if (selected?.id === id)
      setSelected(prev => prev ? { ...prev, assessment: { ...prev.assessment, recommendation } } : null);
  };

  return (
    <main className="relative min-h-screen bg-[#0a0a1a] overflow-hidden p-4 md:p-8">
      {/* Background orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-violet-600 opacity-15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[350px] h-[350px] rounded-full bg-indigo-500 opacity-15 blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
        backgroundSize: "60px 60px"
      }} />

      <div className="relative z-10 max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white">📋 Recruiter Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">AI-assessed voice interview results</p>
          </div>
          <div className="flex items-center gap-3">
            {candidates.length > 0 && (
              <button
                onClick={() => { localStorage.removeItem("candidates"); setCandidates([]); setSelected(null); }}
                className="text-xs text-red-400/60 hover:text-red-400 border border-red-500/20 hover:border-red-500/40 rounded-lg px-3 py-1.5 transition-all"
              >
                Clear all
              </button>
            )}
            <a href="/candidate" className="text-xs text-indigo-400 border border-indigo-500/30 hover:border-indigo-500/60 rounded-lg px-3 py-1.5 transition-all bg-indigo-500/5 hover:bg-indigo-500/10">
              + New Interview
            </a>
          </div>
        </div>

        {/* Stats */}
        {candidates.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { val: candidates.length, label: "Total Interviewed", color: "text-white" },
              { val: candidates.filter(c => c.assessment.recommendation === "advance").length, label: "Advancing", color: "text-green-400" },
              { val: candidates.filter(c => c.assessment.recommendation === "reject").length, label: "Rejected", color: "text-red-400" },
            ].map(({ val, label, color }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center backdrop-blur-sm">
                <div className={`text-2xl font-black ${color}`}>{val}</div>
                <div className="text-xs text-gray-500 mt-1">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {candidates.length === 0 ? (
          <div className="border border-dashed border-white/10 rounded-2xl p-16 text-center bg-white/3">
            <div className="text-5xl mb-4">🎙️</div>
            <h2 className="text-xl font-bold text-white mb-2">No candidates yet</h2>
            <p className="text-gray-500 text-sm mb-6">Candidates appear here after completing the voice interview</p>
            <a href="/candidate" className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-105">
              Go to Candidate Portal →
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Candidate List */}
            <div className="space-y-3">
              {candidates.map((c) => (
                <div key={c.id}
                  onClick={() => { setSelected(c); setTab("assessment"); }}
                  className={`group relative rounded-2xl border cursor-pointer p-5 transition-all duration-200 backdrop-blur-sm
                    ${selected?.id === c.id
                      ? "border-indigo-500/50 bg-indigo-500/10 shadow-lg shadow-indigo-500/10"
                      : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"
                    }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="font-bold text-white text-base">{c.name}</h2>
                      <p className="text-xs text-gray-500 mt-0.5">{c.date}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${recConfig[c.assessment.recommendation].color}`}>
                      {recConfig[c.assessment.recommendation].dot} {recConfig[c.assessment.recommendation].label}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {DIMENSIONS.map(({ key, emoji }) => {
                      const dim = c.assessment[key as keyof Assessment] as DimensionScore;
                      return (
                        <div key={key} className="flex items-center gap-2">
                          <span className="text-xs w-4">{emoji}</span>
                          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${scoreColor(dim.score)}`} style={{ width: `${(dim.score / 5) * 100}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 w-4">{dim.score}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center">
                    <span className="text-xs text-gray-600">Avg score</span>
                    <span className="text-sm font-black text-indigo-400">{avgScore(c.assessment)}/5</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Detail Panel */}
            {selected ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-blue-500" />

                {/* Tabs */}
                <div className="flex border-b border-white/10">
                  {(["assessment", "transcript"] as const).map((t) => (
                    <button key={t} onClick={() => setTab(t)}
                      className={`flex-1 py-3.5 text-sm font-semibold transition-colors capitalize
                        ${tab === t ? "text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5" : "text-gray-500 hover:text-gray-300"}`}>
                      {t === "assessment" ? "📊 Assessment" : "💬 Transcript"}
                    </button>
                  ))}
                </div>

                <div className="p-5 overflow-y-auto" style={{ maxHeight: "70vh" }}>
                  {tab === "assessment" && (
                    <div className="space-y-5">
                      <div>
                        <h2 className="text-xl font-black text-white">{selected.name}</h2>
                        <p className="text-xs text-gray-500">{selected.date}</p>
                      </div>

                      {/* Recommendation */}
                      <div className={`rounded-xl px-4 py-3.5 text-center font-bold text-sm border ${
                        selected.assessment.recommendation === "advance"
                          ? "bg-green-500/10 border-green-500/30 text-green-400"
                          : selected.assessment.recommendation === "maybe"
                            ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                            : "bg-red-500/10 border-red-500/30 text-red-400"
                      }`}>
                        {selected.assessment.recommendation === "advance" ? "✅ Advance to Next Round"
                          : selected.assessment.recommendation === "maybe" ? "🟡 Further Review Needed"
                          : "❌ Not Recommended"}
                      </div>

                      {/* Summary */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">AI Summary</h3>
                        <p className="text-sm text-gray-300 leading-relaxed">{selected.assessment.summary}</p>
                      </div>

                      {/* Dimensions */}
                      <div className="space-y-4">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Breakdown</h3>
                        {DIMENSIONS.map(({ key, label, emoji }) => {
                          const dim = selected.assessment[key as keyof Assessment] as DimensionScore;
                          if (!dim) return null;
                          return (
                            <div key={key} className="space-y-1.5">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-300">{emoji} {label}</span>
                                <span className="text-sm font-bold text-white">{dim.score}/5</span>
                              </div>
                              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${scoreColor(dim.score)}`} style={{ width: `${(dim.score / 5) * 100}%` }} />
                              </div>
                              <p className="text-xs text-gray-500 italic">&ldquo;{dim.quote}&rdquo;</p>
                              <p className="text-xs text-gray-400">{dim.feedback}</p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Actions */}
                      <div className="space-y-2 pt-2 border-t border-white/10">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Recruiter Decision</h3>
                        <div className="flex gap-2">
                          <button onClick={() => updateStatus(selected.id, "advance")}
                            className="flex-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 font-semibold py-2 rounded-xl text-sm transition-all">
                            ✓ Advance
                          </button>
                          <button onClick={() => updateStatus(selected.id, "maybe")}
                            className="flex-1 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-400 font-semibold py-2 rounded-xl text-sm transition-all">
                            ? Maybe
                          </button>
                          <button onClick={() => updateStatus(selected.id, "reject")}
                            className="flex-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-semibold py-2 rounded-xl text-sm transition-all">
                            ✗ Reject
                          </button>
                        </div>
                        <button onClick={() => deleteCandidate(selected.id)}
                          className="w-full border border-white/10 hover:border-white/20 text-gray-500 hover:text-gray-300 font-medium py-2 rounded-xl text-sm transition-all">
                          🗑 Delete Record
                        </button>
                      </div>
                    </div>
                  )}

                  {tab === "transcript" && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Full Conversation</h3>
                      {selected.messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[85%] px-3 py-2.5 rounded-xl text-xs leading-relaxed ${
                            msg.role === "user"
                              ? "bg-indigo-600 text-white"
                              : "bg-white/8 border border-white/10 text-gray-300"
                          }`}>
                            <span className="font-semibold block mb-1 opacity-60 text-[10px] uppercase tracking-wide">
                              {msg.role === "user" ? "Candidate" : "AI Interviewer"}
                            </span>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center text-center p-12 bg-white/3">
                <div className="text-4xl mb-3">👈</div>
                <p className="text-gray-500 text-sm">Select a candidate to view details</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}