// components/AudioControls.tsx
import { useState, useRef } from 'react';
import { Play, Pause, Volume2, Upload, MonitorSpeaker } from 'lucide-react';
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
  const systemStreamRef = useRef<MediaStream | null>(null);
  const { startStream } = useWebRTC(roomId, true);

  // ---------- Upload audio file – works on 100% of devices ----------
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

  // ---------- System audio – only Chrome/Edge desktop ----------
  const startSystemAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        audio: true,
        video: false,
      });
      systemStreamRef.current = stream;
      setAudioSource('system');
    } catch (err) {
      const msg =
        err instanceof DOMException && err.name === 'NotSupportedError'
          ? '❌ System audio capture is not supported in this browser.\n\n' +
            '✅ Use Google Chrome or Microsoft Edge on a desktop/laptop and tick "Share audio" in the dialog.\n' +
            '📂 Or use "Upload Audio" – works on every device instantly.'
          : '⚠️ Permission denied.\n\n' +
            'To share system audio you must:\n' +
            '• Use Chrome or Edge on a computer.\n' +
            '• Tick the "Share audio" checkbox when prompted.\n' +
            '• Or simply use "Upload Audio" to share a file from any device.';
      alert(msg);
    }
  };

  // ---------- Play / Pause ----------
  const togglePlayback = () => {
    if (!audioSource) return;
    const audio = audioRef.current;

    if (audioSource === 'file' && audio) {
      if (audio.paused) {
        audio.play();
        setIsPlaying(true);
        const mediaStream = (audio as any).captureStream?.();
        if (mediaStream) startStream(mediaStream);
      } else {
        audio.pause();
        setIsPlaying(false);
      }
    } else if (audioSource === 'system' && systemStreamRef.current) {
      if (!isPlaying) {
        startStream(systemStreamRef.current);
        setIsPlaying(true);
      } else {
        // Stop stream when pausing
        systemStreamRef.current.getTracks().forEach((t) => t.stop());
        systemStreamRef.current = null;
        setAudioSource(null);
        setIsPlaying(false);
      }
    }

    set(ref(db, `rooms/${roomId}/playback`), {
      action: isPlaying ? 'pause' : 'play',
      timestamp: serverTimestamp(),
    });
  };

  // ---------- Volume (for uploaded file) ----------
  const handleVolume = (val: number) => {
    setVolume(val);
    if (audioRef.current) audioRef.current.volume = val / 100;
  };

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
      {/* Source selection */}
      <div className="flex flex-wrap gap-4">
        {/* Upload Audio – 100% universal */}
        <button
          onClick={() => document.getElementById('fileUpload')?.click()}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-colors"
        >
          <Upload className="w-5 h-5" /> Upload Audio
        </button>
        <input
          id="fileUpload"
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* System Audio – with clear fallback */}
        <button
          onClick={startSystemAudio}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-colors"
        >
          <MonitorSpeaker className="w-5 h-5" /> System Audio
        </button>

        {audioSource && (
          <span className="self-center text-white/50 text-sm ml-2">
            {audioSource === 'file' ? 'Audio file' : 'System audio'}
          </span>
        )}
      </div>

      {/* Playback controls */}
      <div className="flex items-center justify-center">
        <button
          onClick={togglePlayback}
          disabled={!audioSource}
          className="p-5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 shadow-lg shadow-orange-500/25 disabled:opacity-40 transition-all"
        >
          {isPlaying ? (
            <Pause className="w-8 h-8 text-white" />
          ) : (
            <Play className="w-8 h-8 text-white ml-0.5" />
          )}
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
          onChange={(e) => handleVolume(Number(e.target.value))}
          className="w-full h-1.5 bg-white/20 rounded-full accent-amber-400 cursor-pointer"
        />
        <span className="text-white/70 text-sm w-10 text-right">{volume}%</span>
      </div>

      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
