import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-[#0a0a1a] overflow-hidden flex flex-col items-center justify-center px-6">

      {/* Animated background orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-indigo-600 opacity-20 blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-violet-500 opacity-20 blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
      <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full bg-blue-500 opacity-10 blur-[80px] animate-pulse" style={{ animationDelay: "2s" }} />

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
        backgroundSize: "60px 60px"
      }} />

      {/* Badge */}
      <div className="relative z-10 mb-8 flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 backdrop-blur-sm">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-xs text-gray-400 font-medium tracking-wide uppercase">Cuemath Hiring Platform</span>
      </div>

      {/* Main heading */}
      <div className="relative z-10 text-center max-w-3xl mb-6">
        <h1 className="text-6xl md:text-7xl font-black text-white leading-tight tracking-tight mb-4">
          Find the
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-blue-400">
            best tutors.
          </span>
        </h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
          AI-powered voice screening that assesses communication, warmth, and teaching ability — in under 5 minutes.
        </p>
      </div>

      {/* Stats row */}
      <div className="relative z-10 flex gap-8 mb-12 text-center">
        {[
          { num: "5 min", label: "Interview" },
          { num: "5", label: "Dimensions scored" },
          { num: "AI", label: "Powered assessment" },
        ].map(({ num, label }) => (
          <div key={label}>
            <div className="text-2xl font-bold text-white">{num}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Cards */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">

        {/* Candidate Card */}
        <Link href="/candidate" className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-7 transition-all duration-300 hover:border-indigo-500/50 hover:bg-white/8 hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-500/20">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-2xl mb-5">
              🎓
            </div>
            <h2 className="text-xl font-bold text-white mb-2">I&apos;m a Candidate</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">
              Take a short voice interview and get an instant AI assessment of your teaching skills.
            </p>
            <div className="flex items-center gap-2 text-indigo-400 text-sm font-medium">
              Start interview
              <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
            </div>
          </div>
        </Link>

        {/* Recruiter Card */}
        <Link href="/recruiter" className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-7 transition-all duration-300 hover:border-violet-500/50 hover:bg-white/8 hover:scale-[1.02] hover:shadow-2xl hover:shadow-violet-500/20">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-2xl mb-5">
              📋
            </div>
            <h2 className="text-xl font-bold text-white mb-2">I&apos;m a Recruiter</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">
              Review scored transcripts, dimension breakdowns, and AI recommendations for every candidate.
            </p>
            <div className="flex items-center gap-2 text-violet-400 text-sm font-medium">
              View dashboard
              <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Feature pills */}
      <div className="relative z-10 flex flex-wrap justify-center gap-2 mt-10">
        {["🎙 Voice Interview", "📊 Rubric Scoring", "💬 Full Transcript", "✅ Instant Decision"].map(f => (
          <span key={f} className="text-xs text-gray-500 border border-white/10 rounded-full px-3 py-1.5 bg-white/5">
            {f}
          </span>
        ))}
      </div>

      {/* Footer */}
      <p className="relative z-10 text-gray-600 text-xs mt-10">
        Built for Cuemath · Powered by Groq + Llama 3.3
      </p>
    </main>
  );
}