// components/ChatBox.tsx
import { useState, useEffect } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { ref, push, onValue, serverTimestamp } from 'firebase/database';
import { db } from '../firebase';

interface ChatBoxProps {
  roomId: string;
  isHost: boolean;
}

export default function ChatBox({ roomId }: ChatBoxProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    if (!roomId) return;
    const chatRef = ref(db, `rooms/${roomId}/chat`);
    const unsub = onValue(chatRef, (snap) => {
      if (snap.exists()) setMessages(Object.values(snap.val()));
      else setMessages([]);
    });
    return () => unsub();
  }, [roomId]);

  const sendMessage = () => {
    if (!text.trim()) return;
    push(ref(db, `rooms/${roomId}/chat`), {
      text,
      timestamp: serverTimestamp(),
    });
    setText('');
  };

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col h-80">
      <h3 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
        <MessageSquare className="w-4 h-4" /> Chat
      </h3>
      <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1">
        {messages.map((msg, i) => (
          <div key={i} className="bg-white/10 rounded-lg px-3 py-1.5 text-white/80 text-sm">
            {msg.text}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-amber-400/50"
        />
        <button
          onClick={sendMessage}
          className="p-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
