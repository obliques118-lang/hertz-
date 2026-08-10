// hooks/useClockSync.ts
import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';

export function useClockSync() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    // Firebase provides server time offset via .info/serverTimeOffset
    const timeRef = ref(db, '.info/serverTimeOffset');
    const unsub = onValue(timeRef, (snap) => {
      if (snap.exists()) setOffset(snap.val());
    });
    return () => unsub();
  }, []);

  const syncedTime = () => Date.now() + offset;
  return { syncedTime };
}
