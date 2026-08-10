// components/QRScanner.tsx
import { useState, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  onScan: (roomId: string) => void;
}

export default function QRScanner({ onScan }: QRScannerProps) {
  const [error, setError] = useState('');

  useEffect(() => {
    const scanner = new Html5Qrcode('reader');
    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: 250 },
      (decodedText: string) => {
        // Expect URL like .../receiver?room=XXXXXX
        try {
          const url = new URL(decodedText);
          const roomId = url.searchParams.get('room');
          if (roomId) {
            scanner.stop();
            onScan(roomId);
          } else {
            setError('Invalid QR code');
          }
        } catch {
          setError('Not a valid URL');
        }
      },
      () => {}
    ).catch(() => setError('Camera access denied'));

    return () => {
      scanner.stop().catch(() => {});
    };
  }, [onScan]);

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-4">
      <p className="text-white/70 text-sm">Scan host QR code</p>
      <div id="reader" className="w-full max-w-xs rounded-xl overflow-hidden" />
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  );
}
