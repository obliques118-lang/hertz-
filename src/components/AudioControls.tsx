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
  const [audioSource, setAudioSource] = useState<'file' | 'mic' | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const { startStream } = useWebRTC(roomId, true);

  // ---------- Upload audio file (works everywhere) ----------
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

  // ---------- Use microphone (works on all browsers/devices) ----------
  const startMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      micStreamRef.current = stream;
      setAudioSource('mic');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        alert(
          'Microphone access denied. Please allow the microphone permission in your browser settings, then try again.'
        );
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
        alert('No microphone found on this device.');
      } else {
        alert('Could not access microphone: ' + err);
      }
    }
  };

  // ---------- Play / Pause logic ----------
  const togglePlayback = () => {
    if (!audioSource) return;
    const audio = audioRef.current;

    if (audioSource === 'file' && audio) {
      if (audio.paused) {
        audio.play();
        setIsPlaying(true);
        // Send the audio element’s own stream if available (Chrome)
        const mediaStream = (audio as any).captureStream?.();
        if (mediaStream) startStream(mediaStream);
      } else {
        audio.pause();
        setIsPlaying(false);
      }
    } else if (audioSource === 'mic' && micStreamRef.current) {
      if (!isPlaying) {
        startStream(micStreamRef.current);
        setIsPlaying(true);
      } else {
        // Stop all tracks to "pause" the microphone stream
        micStreamRef.current.getTracks().forEach((track) => track.stop());
        micStreamRef.current = null;
        setAudioSource(null);
        setIsPlaying(false);
      }
    }

    set(ref(db, `rooms/${roomId}/playback`), {
      action: isPlaying ? 'pause' : 'play',
      timestamp: serverTimestamp(),
    });
  };

  // ---------- Volume for uploaded file ----------
  const handleVolume = (val: number) => {
    setVolume(val);
    if (audioRef.current) audioRef.current.volume = val / 100;
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
        <input
          id="fileUpload"
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        <button
          onClick={startMicrophone}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-colors"
        >
          <Mic className="w-5 h-5" /> Microphone
        </button>

        {audioSource && (
          <span className="self-center text-white/50 text-sm ml-2">
            Source: {audioSource === 'file' ? 'Audio file' : 'Live microphone'}
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

      {/* Volume slider (only affects uploaded file audio) */}
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
