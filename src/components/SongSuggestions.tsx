// components/SongSuggestions.tsx
import { useState, useEffect } from 'react';
import { Music, Plus } from 'lucide-react';
import { ref, push, onValue, serverTimestamp } from 'firebase/database';
import { db } from '../firebase';

export default function SongSuggestions({ roomId }: { roomId: string }) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (!roomId) return;
    const suggRef = ref(db, `rooms/${roomId}/suggestions`);
    const unsub = onValue(suggRef, (snap) => {
      if (snap.exists()) setSuggestions(Object.values(snap.val()));
      else setSuggestions([]);
    });
    return () => unsub();
  }, [roomId]);

  const suggest = () => {
    if (!title.trim()) return;
    push(ref(db, `rooms/${roomId}/suggestions`), {
      title,
      timestamp: serverTimestamp(),
    });
    setTitle('');
  };

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col h-80">
      <h3 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
        <Music className="w-4 h-4" /> Song Suggestions
      </h3>
      <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1">
        {suggestions.map((s, i) => (
          <div key={i} className="bg-white/10 rounded-lg px-3 py-1.5 text-white/80 text-sm flex items-center gap-2">
            <Music className="w-3.5 h-3.5 text-amber-400/70" />
            {s.title}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && suggest()}
          placeholder="Suggest a song..."
          className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-purple-400/50"
        />
        <button
          onClick={suggest}
          className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
