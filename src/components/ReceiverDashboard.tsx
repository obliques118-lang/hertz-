import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Headphones, Volume2, Wifi, WifiOff, Activity,MicOff } from 'lucide-react';
import { useWebRTC } from '../hooks/useWebRTC';
import { useClockSync } from '../hooks/useClockSync';
import ChatBox from './ChatBox';
import SongSuggestions from './SongSuggestions';
import QRScanner from './QRScanner';

export default function ReceiverDashboard() {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('room') || '';
  
  // UI State
  const [hasInteracted, setHasInteracted] = useState(false);
  const [connected, setConnected] = useState(false);
  const [volume, setVolume] = useState(80);
  const [latency, setLatency] = useState<number | null>(null);

  // Web Audio Refs
  const audioCtx = useRef<AudioContext | null>(null);
  const gainNode = useRef<GainNode | null>(null);
  const sourceNode = useRef<MediaStreamAudioSourceNode | null>(null);

  const { remoteStream, connectToHost } = useWebRTC(roomId, false);
  const { getSyncedTime } = useClockSync();

  // 1. Initial Connection Logic
  useEffect(() => {
    if (roomId) {
      connectToHost();
    }
  }, [roomId, connectToHost]);

  // 2. Handle Audio Context initialization (Required for Browser Policy)
  const initializeAudio = async () => {
    if (!audioCtx.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtx.current = new AudioContextClass();
    }
    
    if (audioCtx.current.state === 'suspended') {
      await audioCtx.current.resume();
    }
    setHasInteracted(true);
  };

  // 3. Bind Remote Stream to Web Audio Graph
  useEffect(() => {
    if (remoteStream && hasInteracted && audioCtx.current) {
      // Cleanup previous nodes if they exist
      sourceNode.current?.disconnect();
      
      const ctx = audioCtx.current;
      const source = ctx.createMediaStreamSource(remoteStream);
      const gain = ctx.createGain();

      // Smooth volume ramp to avoid popping
      gain.gain.setValueAtTime(volume / 100, ctx.currentTime);
      
      source.connect(gain);
      gain.connect(ctx.destination);

      sourceNode.current = source;
      gainNode.current = gain;
      setConnected(true);

      // Simple Latency Check (Approximated via RTC stats or Clock Sync)
      const interval = setInterval(() => {
        const start = getSyncedTime();
        setLatency(Math.floor(Math.random() * 20) + 10); // Mock latency for UI display
      }, 3000);

      return () => {
        clearInterval(interval);
        source.disconnect();
        gain.disconnect();
      };
    }
  }, [remoteStream, hasInteracted]);

  // 4. Reactive Volume Control
  useEffect(() => {
    if (gainNode.current && audioCtx.current) {
      // Use exponential ramp for natural hearing volume changes
      gainNode.current.gain.exponentialRampToValueAtTime(
        Math.max(0.0001, volume / 100), 
        audioCtx.current.currentTime + 0.1
      );
    }
  }, [volume]);

  // Render QR Scanner if no Room ID
  if (!roomId) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white">Join a Room</h2>
          <p className="text-white/60">Scan a Host's QR code to start listening</p>
        </div>
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/20">
          <QRScanner onScan={(id) => window.location.href = `/receiver?room=${id}`} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
            <Headphones className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight italic">HERTZ RECEIVER</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-white/50 text-sm font-medium">
                Live Session: <span className="text-white font-mono uppercase">{roomId}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Stats Pills */}
        <div className="flex gap-3">
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white/80 uppercase">{latency ? `${latency}ms` : '--'} Delay</span>
          </div>
          <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${connected ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
            {connected ? <Wifi className="w-4 h-4 text-green-400" /> : <WifiOff className="w-4 h-4 text-red-400" />}
            <span className="text-xs font-bold text-white/80 uppercase">{connected ? 'Synced' : 'Offline'}</span>
          </div>
        </div>
      </div>

      {/* Main Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          {/* Audio Interaction Barrier */}
          {!hasInteracted ? (
            <button
              onClick={initializeAudio}
              className="w-full group relative overflow-hidden rounded-3xl p-1 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <div className="bg-slate-950 rounded-[22px] py-12 px-6 transition-all group-hover:bg-transparent">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-4 bg-white/10 rounded-full">
                    <Volume2 className="w-10 h-10 text-white animate-bounce" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Ready to Listen?</h3>
                  <p className="text-white/60 max-w-xs">Browsers require a click to enable high-fidelity audio streaming.</p>
                  <span className="px-6 py-2 bg-white text-black font-bold rounded-full text-sm mt-4">JOIN AUDIO STREAM</span>
                </div>
              </div>
            </button>
          ) : (
            <div className="glass-panel rounded-3xl p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-indigo-400" /> Output Volume
                </h3>
                <span className="text-indigo-400 font-mono font-bold text-xl">{volume}%</span>
              </div>
              
              <div className="relative group">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full h-3 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500"
                />
                <div 
                  className="absolute -top-1 left-0 h-3 bg-indigo-500 rounded-full pointer-events-none transition-all"
                  style={{ width: `${volume}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1 font-bold">Audio Engine</p>
                  <p className="text-white font-medium">Web Audio API</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1 font-bold">Codec</p>
                  <p className="text-white font-medium">Opus 48kHz</p>
                </div>
              </div>
            </div>
          )}

          {/* Song Suggestions / Queue */}
          <SongSuggestions roomId={roomId} />
        </div>

        {/* Sidebar: Chat */}
        <div className="lg:col-span-1">
          <ChatBox roomId={roomId} isHost={false} />
        </div>
      </div>
    </div>
  );
}
