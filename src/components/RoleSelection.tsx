// components/RoleSelection.tsx
import { useNavigate } from 'react-router-dom';
import { Radio, Headphones } from 'lucide-react';

export default function RoleSelection() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl p-10 text-white text-center w-full max-w-lg space-y-8">
        <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
          Hertz
        </h1>
        <p className="text-white/70 text-lg">Zero‑latency synchronised audio</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-10">
          <button
            onClick={() => navigate('/host')}
            className="group flex flex-col items-center justify-center gap-4 p-8 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
          >
            <div className="p-4 rounded-full bg-amber-500/20 group-hover:bg-amber-500/40 transition-colors">
              <Radio className="w-10 h-10 text-amber-400" />
            </div>
            <span className="text-xl font-semibold">Host</span>
            <span className="text-sm text-white/50">Share audio</span>
          </button>

          <button
            onClick={() => navigate('/receiver')}
            className="group flex flex-col items-center justify-center gap-4 p-8 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
          >
            <div className="p-4 rounded-full bg-purple-500/20 group-hover:bg-purple-500/40 transition-colors">
              <Headphones className="w-10 h-10 text-purple-400" />
            </div>
            <span className="text-xl font-semibold">Receiver</span>
            <span className="text-sm text-white/50">Listen in sync</span>
          </button>
        </div>
      </div>
    </div>
  );
}
