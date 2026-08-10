// components/ReceiverDashboard.tsx
import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Headphones, Volume2, MessageSquare, Music } from 'lucide-react';
import { useWebRTC } from '../hooks/useWebRTC';
import { useClockSync } from '../hooks/useClockSync';
import ChatBox from './ChatBox';
import SongSuggestions from './SongSuggestions';
import QRScanner from './QRScanner';

export default function ReceiverDashboard() {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('room') || '';
  const [connected, setConnected] = useState(false);
  const [volume, setVolume] = useState(80);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const { remoteStream, connectToHost } = useWebRTC(roomId, false);
  const { syncedTime } = useClockSync();

  // Connect once we have roomId
  useEffect(() => {
    if (roomId) connectToHost();
  }, [roomId]);

  // When remote stream arrives, attach to AudioContext with GainNode
  useEffect(() => {
    if (remoteStream && !audioContextRef.current) {
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(remoteStream);
      const gainNode = ctx.createGain();
      gainNode.gain.value = volume / 100;
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      audioContextRef.current = ctx;
      gainNodeRef.current = gainNode;
      ctx.resume();
      setConnected(true);
    }
  }, [remoteStream]);

  // Update gain when volume changes
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume / 100;
    }
  }, [volume]);

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md">
          <Headphones className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Receiver</h1>
          <p className="text-white/60 text-sm">
            {connected ? 'Synchronised' : 'Connecting…'} · Room{' '}
            <span className="font-mono">{roomId}</span>
          </p>
        </div>
      </div>

      {/* QR Scanner if no roomId provided */}
      {!roomId && <QRScanner onScan={(id) => window.location.href = `/receiver?room=${id}`} />}

      {/* Volume control (only visible after connection) */}
      {connected && (
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4 mb-8">
          <Volume2 className="w-5 h-5 text-white/70" />
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full h-1.5 bg-white/20 rounded-full accent-purple-400 cursor-pointer"
          />
          <span className="text-white/70 text-sm w-10 text-right">{volume}%</span>
        </div>
      )}

      {/* Chat & Song Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChatBox roomId={roomId} isHost={false} />
        <SongSuggestions roomId={roomId} />
      </div>
    </>
  );
}
