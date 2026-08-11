import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';

export const useClockSync = () => {
  const [serverOffset, setServerOffset] = useState(0);

  useEffect(() => {
    const offsetRef = ref(db, '.info/serverTimeOffset');
    return onValue(offsetRef, (snap) => {
      setServerOffset(snap.val() || 0);
    });
  }, []);

  const getSyncedTime = () => Date.now() + serverOffset;

  return { getSyncedTime, serverOffset };
};
