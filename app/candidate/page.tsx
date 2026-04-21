"use client";
import { useState, useRef, useEffect } from "react";
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
interface Message {
  role: "user" | "assistant";
  content: string;
}

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

const DIMENSIONS = [
  { key: "clarity", label: "Communication Clarity", emoji: "🗣️" },
  { key: "warmth", label: "Warmth & Encouragement", emoji: "🤝" },
  { key: "simplicity", label: "Ability to Simplify", emoji: "💡" },
  { key: "patience", label: "Patience & Empathy", emoji: "🧘" },
  { key: "fluency", label: "English Fluency", emoji: "✨" },
];

const scoreColor = (score: number) => {
  if (score >= 4) return "bg-green-500";
  if (score >= 3) return "bg-yellow-400";
  return "bg-red-400";
};

export default function CandidatePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [isAssessing, setIsAssessing] = useState(false);
  const [interviewDone, setInterviewDone] = useState(false);
  const [status, setStatus] = useState("");

  const recognitionRef = useRef<InstanceType<typeof SpeechRecognition> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const finalTranscriptRef = useRef("");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const speak = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") return resolve();
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.93;
      utterance.pitch = 1.05;
      utterance.volume = 1;
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        v => v.name.includes("Samantha") || v.name.includes("Google US English") || v.lang === "en-US"
      );
      if (preferred) utterance.voice = preferred;
      setIsSpeaking(true);
      setStatus("AI is speaking…");
      utterance.onend = () => { setIsSpeaking(false); setStatus("Your turn — press mic to speak"); resolve(); };
      utterance.onerror = () => { setIsSpeaking(false); setStatus("Your turn — press mic to speak"); resolve(); };
      window.speechSynthesis.speak(utterance);
    });
  };

  const startInterview = async () => {
    setStarted(true);
    setIsLoading(true);
    setStatus("Starting interview…");
    try {
      const res = await fetch("/api/candidate/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [] }),
      });
      const data = await res.json();
      const firstMsg: Message = { role: "assistant", content: data.reply };
      setMessages([firstMsg]);
      setIsLoading(false);
      await speak(data.reply);
    } catch {
      setStatus("Error starting. Please refresh.");
      setIsLoading(false);
    }
  };

  const startRecording = () => {
    if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); }

    const SR = (window as Window & typeof globalThis).SpeechRecognition ||
               (window as Window & typeof globalThis).webkitSpeechRecognition;

    if (!SR) {
      alert("Please use Google Chrome for voice input.");
      return;
    }

    finalTranscriptRef.current = "";
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = finalTranscriptRef.current;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript + " ";
          finalTranscriptRef.current = final;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setLiveTranscript((final + interim).trim());
    };

    recognition.onerror = () => {
      setIsRecording(false);
      setStatus("Mic error. Try again.");
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setLiveTranscript("");
    setStatus("Listening… speak clearly");
  };

  const stopRecording = async () => {
    recognitionRef.current?.stop();
    setIsRecording(false);

    const spokenText = finalTranscriptRef.current.trim() || liveTranscript.trim();

    if (!spokenText) {
      setStatus("Didn't catch that — try again");
      setLiveTranscript("");
      return;
    }

    const userMsg: Message = { role: "user", content: spokenText };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLiveTranscript("");
    setIsLoading(true);
    setStatus("Processing your answer…");

    try {
      const res = await fetch("/api/candidate/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });
      const data = await res.json();
      const aiMsg: Message = { role: "assistant", content: data.reply };
      const finalMessages = [...updatedMessages, aiMsg];
      setMessages(finalMessages);
      setIsLoading(false);

      if (data.done) {
        setInterviewDone(true);
        await speak(data.reply);
        setStatus("Generating your assessment…");
        setIsAssessing(true);
        try {
          const aRes = await fetch("/api/candidate/assess", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: finalMessages }),
          });
          const aData = await aRes.json();
          setAssessment(aData.assessment);

          if (aData.assessment) {
            const existing = JSON.parse(localStorage.getItem("candidates") || "[]");
            const firstAnswer = finalMessages.find(m => m.role === "user")?.content || "";
            const match = firstAnswer.match(/(?:i(?:'m| am)\s+|my name(?:'s| is)\s+|call me\s+)([A-Z][a-z]+)/i);
            let candidateName = "Candidate";
            if (match) {
              candidateName = match[1];
            } else {
              const words = firstAnswer.trim().split(/\s+/);
              const name = words.find(w => w.length > 2 && /^[A-Za-z]+$/.test(w));
              if (name) candidateName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
            }
            const newEntry = {
              id: Date.now().toString(),
              name: candidateName,
              date: new Date().toLocaleDateString(),
              messages: finalMessages,
              assessment: aData.assessment,
            };
            localStorage.setItem("candidates", JSON.stringify([...existing, newEntry]));
          }

        } catch {
          setStatus("Error generating assessment.");
        }
        setIsAssessing(false);
      } else {
        await speak(data.reply);
      }
    } catch {
      setIsLoading(false);
      setStatus("Error — please try again.");
    }
  };

  return (
    <main className="relative min-h-screen bg-[#0a0a1a] overflow-hidden flex flex-col items-center justify-start p-4 md:p-8">

      {/* Background orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-indigo-600 opacity-20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[350px] h-[350px] rounded-full bg-violet-500 opacity-15 blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
        backgroundSize: "60px 60px"
      }} />

      <div className="relative z-10 w-full max-w-2xl space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
          <div>
            <h1 className="text-lg font-bold text-white">🎓 Tutor Screening Interview</h1>
            <p className="text-indigo-400 text-xs mt-0.5">Voice-powered · Cuemath Hiring</p>
          </div>
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 text-xs font-medium">Live</span>
          </div>
        </div>

        {/* Start Screen */}
        {!started && (
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-blue-500" />
            <div className="p-8 text-center space-y-6">
              <div className="w-20 h-20 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-4xl mx-auto">
                👋
              </div>
              <div>
                <h2 className="text-3xl font-black text-white mb-3">Welcome, Candidate!</h2>
                <p className="text-gray-400 text-sm leading-relaxed max-w-md mx-auto">
                  This is a short voice interview (~5 minutes). Speak naturally with our AI interviewer about your teaching approach.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-left">
                {[
                  { icon: "🌐", title: "Use Chrome", desc: "Best for voice" },
                  { icon: "🔇", title: "Quiet space", desc: "Low background noise" },
                  { icon: "🗣️", title: "Speak clearly", desc: "Natural pace is fine" },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <div className="text-xl mb-2">{icon}</div>
                    <div className="text-white text-xs font-semibold">{title}</div>
                    <div className="text-gray-500 text-xs mt-0.5">{desc}</div>
                  </div>
                ))}
              </div>

              <button
                onClick={startInterview}
                className="group w-full overflow-hidden rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 text-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-500/30 flex items-center justify-center gap-2"
              >
                Begin Interview
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>
          </div>
        )}

        {/* Chat Area */}
        {started && !assessment && (
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-blue-500" />

            {/* Messages */}
            <div className="p-5 space-y-4 max-h-96 overflow-y-auto">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs mr-2 flex-shrink-0 mt-1">
                      🤖
                    </div>
                  )}
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-sm"
                      : "bg-white/8 border border-white/10 text-gray-200 rounded-bl-sm"
                  }`}>
                    {msg.role === "assistant" && (
                      <span className="text-indigo-400 text-xs font-semibold block mb-1">AI Interviewer</span>
                    )}
                    {msg.content}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs flex-shrink-0">
                    🤖
                  </div>
                  <div className="bg-white/8 border border-white/10 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1.5 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}

              {liveTranscript && (
                <div className="flex justify-end">
                  <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-br-sm text-sm bg-indigo-500/20 border border-indigo-500/30 text-indigo-200">
                    <span className="text-indigo-400 text-xs font-semibold block mb-1">🎙 You (live)</span>
                    {liveTranscript}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Voice Controls */}
            {!interviewDone && (
              <div className="border-t border-white/10 p-6 flex flex-col items-center gap-4 bg-white/3">
                <p className="text-gray-400 text-sm font-medium">{status || "Press and hold to speak"}</p>

                <button
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  disabled={isLoading || isSpeaking}
                  className={`relative w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-2xl transition-all duration-200 select-none
                    ${isRecording
                      ? "bg-red-500 scale-110 shadow-red-500/50 ring-4 ring-red-500/30"
                      : isLoading || isSpeaking
                        ? "bg-white/10 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-500 hover:scale-105 shadow-indigo-500/40 ring-4 ring-indigo-500/20"
                    }`}
                >
                  {isRecording
                    ? <span className="w-6 h-6 bg-white rounded-sm" />
                    : isSpeaking ? "🔊" : "🎙️"}
                </button>

                <p className="text-gray-600 text-xs">
                  {isRecording ? "🔴 Recording — release to send"
                    : isLoading ? "⏳ Processing…"
                    : isSpeaking ? "🔊 AI speaking…"
                    : "Hold to speak · Release to send"}
                </p>
              </div>
            )}

            {interviewDone && isAssessing && (
              <div className="border-t border-white/10 p-8 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                  <p className="text-indigo-400 font-medium text-sm">Generating your assessment…</p>
                  <p className="text-gray-600 text-xs">Analysing 5 dimensions of your interview</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Assessment Report */}
        {assessment && (
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-blue-500" />
            <div className="px-6 py-5 border-b border-white/10">
              <h2 className="text-lg font-bold text-white">📊 Interview Assessment</h2>
              <p className="text-gray-500 text-sm">Your detailed evaluation report</p>
            </div>

            <div className="p-6 space-y-5">
              {/* Recommendation */}
              <div className={`rounded-xl px-5 py-4 text-center font-bold text-sm border ${
                assessment.recommendation === "advance"
                  ? "bg-green-500/10 border-green-500/30 text-green-400"
                  : assessment.recommendation === "maybe"
                    ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                    : "bg-red-500/10 border-red-500/30 text-red-400"
              }`}>
                {assessment.recommendation === "advance" ? "✅ Advance to Next Round"
                  : assessment.recommendation === "maybe" ? "🟡 Further Review Needed"
                  : "❌ Not Recommended"}
              </div>

              {/* Summary */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Overall Summary</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{assessment.summary}</p>
              </div>

              {/* Scores */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Dimension Scores</h3>
                {DIMENSIONS.map(({ key, label, emoji }) => {
                  const dim = assessment[key as keyof Assessment] as DimensionScore;
                  if (!dim) return null;
                  return (
                    <div key={key} className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">{emoji} {label}</span>
                        <span className="text-sm font-bold text-white">{dim.score}/5</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${scoreColor(dim.score)}`}
                          style={{ width: `${(dim.score / 5) * 100}%` }} />
                      </div>
                      <p className="text-xs text-gray-500 italic">&ldquo;{dim.quote}&rdquo;</p>
                      <p className="text-xs text-gray-400">{dim.feedback}</p>
                    </div>
                  );
                })}
              </div>

              {/* Try again */}
              <button
                onClick={() => window.location.reload()}
                className="w-full border border-white/10 hover:border-indigo-500/40 hover:bg-indigo-500/5 text-gray-400 hover:text-indigo-400 font-medium py-3 rounded-xl text-sm transition-all"
              >
                ↩ Start New Interview
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
