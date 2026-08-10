// components/QRDisplay.tsx
import { X } from 'lucide-react';
import QRCode from 'qrcode.react';

interface QRDisplayProps {
  roomId: string;
  onClose: () => void;
}

export default function QRDisplay({ roomId, onClose }: QRDisplayProps) {
  const joinUrl = `${window.location.origin}/receiver?room=${roomId}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8 text-white w-full max-w-sm relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-semibold mb-4 text-center">Join this stream</h2>

        <div className="flex justify-center mb-4 p-4 bg-white rounded-2xl">
          <QRCode value={joinUrl} size={200} level="H" includeMargin />
        </div>

        <div className="text-center space-y-1">
          <p className="text-sm text-white/50">Session Code</p>
          <p className="font-mono text-2xl tracking-widest text-amber-300 select-all">{roomId}</p>
          <p className="text-xs text-white/40 mt-2">Scan with receiver device or enter code manually</p>
        </div>
      </div>
    </div>
  );
}
