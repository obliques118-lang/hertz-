// components/AudioControls.tsx
import { useState, useRef } from 'react';
import { Play, Pause, Volume2, Upload, Mic } from 'lucide-react';
import { ref, set, serverTimestamp } from 'firebase/database';
import { db } from '../firebase';
import { useWebRTC } from '../hooks/useWebRTC';

interface AudioControlsProps {
  roomId: string;
}

export default function AudioControls({ roomId }: AudioControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [audioSource, setAudioSource] = useState<'file' | 'system' | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { startStream } = useWebRTC(roomId, true);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.load();
      setAudioSource('file');
    }
  };

  const startSystemAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ audio: true, video: false });
      streamRef.current = stream;
      setAudioSource('system');
    } catch {
      alert('Microphone / system audio access denied.');
    }
  };

  const togglePlayback = () => {
    if (!audioSource) return;
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play();
      setIsPlaying(true);
      // Start WebRTC stream
      if (audioSource === 'file') {
        const mediaStream = (audio as any).captureStream?.();
        if (mediaStream) startStream(mediaStream);
      } else if (streamRef.current) {
        startStream(streamRef.current);
      }
      set(ref(db, `rooms/${roomId}/playback`), {
        action: 'play',
        timestamp: serverTimestamp(),
      });
    } else {
      audio.pause();
      setIsPlaying(false);
      set(ref(db, `rooms/${roomId}/playback`), {
        action: 'pause',
        timestamp: serverTimestamp(),
      });
    }
  };

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
      {/* Source selection */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => document.getElementById('fileUpload')?.click()}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-colors"
        >
          <Upload className="w-5 h-5" /> Upload Audio
        </button>
        <input id="fileUpload" type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
        <button
          onClick={startSystemAudio}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-colors"
        >
          <Mic className="w-5 h-5" /> System Audio
        </button>
        {audioSource && <span className="self-center text-white/50 text-sm ml-2">Source: {audioSource}</span>}
      </div>

      {/* Playback controls */}
      <div className="flex items-center justify-center">
        <button
          onClick={togglePlayback}
          disabled={!audioSource}
          className="p-5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 shadow-lg shadow-orange-500/25 disabled:opacity-40 transition-all"
        >
          {isPlaying ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white ml-0.5" />}
        </button>
      </div>

      {/* Volume slider */}
      <div className="flex items-center gap-4">
        <Volume2 className="w-5 h-5 text-white/70" />
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(e) => {
            const val = Number(e.target.value);
            setVolume(val);
            if (audioRef.current) audioRef.current.volume = val / 100;
          }}
          className="w-full h-1.5 bg-white/20 rounded-full accent-amber-400 cursor-pointer"
        />
        <span className="text-white/70 text-sm w-10 text-right">{volume}%</span>
      </div>

      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
