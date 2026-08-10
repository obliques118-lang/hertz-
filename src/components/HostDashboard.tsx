// components/HostDashboard.tsx
import { useState, useEffect, useRef } from 'react';
import { Radio, Users, MessageSquare, Music, QrCode } from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import AudioControls from './AudioControls';
import QRDisplay from './QRDisplay';
import ChatBox from './ChatBox';
import SongSuggestions from './SongSuggestions';

export default function HostDashboard() {
  const roomId = useRef(Math.random().toString(36).substring(2, 8).toUpperCase()).current;
  const [receivers, setReceivers] = useState<string[]>([]);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    const receiversRef = ref(db, `rooms/${roomId}/receivers`);
    const unsub = onValue(receiversRef, (snap) => {
      if (snap.exists()) setReceivers(Object.keys(snap.val()));
      else setReceivers([]);
    });
    return () => unsub();
  }, [roomId]);

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md">
            <Radio className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Host Control</h1>
            <p className="text-white/60 text-sm flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              {receivers.length} listening
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowQR(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-sm font-medium transition-colors"
        >
          <QrCode className="w-4 h-4" /> Share Invite
        </button>
      </div>

      {/* Audio Controls */}
      <AudioControls roomId={roomId} />

      {/* Chat & Song Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <ChatBox roomId={roomId} isHost />
        <SongSuggestions roomId={roomId} />
      </div>

      {/* QR Modal */}
      {showQR && <QRDisplay roomId={roomId} onClose={() => setShowQR(false)} />}
    </>
  );
}
