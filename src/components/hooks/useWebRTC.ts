// hooks/useWebRTC.ts
import { useRef, useState, useEffect } from 'react';
import { ref, set, onValue, push } from 'firebase/database';
import { db } from '../firebase';

const pcConfig = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

export function useWebRTC(roomId: string, isHost: boolean) {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Host: create offer when a new receiver joins
  const startStream = (stream: MediaStream) => {
    localStreamRef.current = stream;
    stream.getTracks().forEach((track) => {
      pcRef.current?.addTrack(track, stream);
    });
    createAndSendOffer();
  };

  const createAndSendOffer = async () => {
    if (!pcRef.current) return;
    const offer = await pcRef.current.createOffer();
    await pcRef.current.setLocalDescription(offer);
    set(ref(db, `rooms/${roomId}/host/offer`), {
      sdp: offer.sdp,
      type: offer.type,
    });
  };

  // Client: connect to host's offer
  const connectToHost = () => {
    if (pcRef.current) return; // already connected
    pcRef.current = new RTCPeerConnection(pcConfig);
    pcRef.current.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };
    pcRef.current.onicecandidate = (e) => {
      if (e.candidate) {
        push(ref(db, `rooms/${roomId}/host/iceCandidates`), e.candidate.toJSON());
      }
    };

    // Listen for host's offer
    const offerRef = ref(db, `rooms/${roomId}/host/offer`);
    const unsub = onValue(offerRef, async (snap) => {
      if (snap.exists()) {
        const desc = snap.val();
        await pcRef.current!.setRemoteDescription(new RTCSessionDescription(desc));
        const answer = await pcRef.current!.createAnswer();
        await pcRef.current!.setLocalDescription(answer);
        set(ref(db, `rooms/${roomId}/receiver/answer`), {
          sdp: answer.sdp,
          type: answer.type,
        });
      }
    });
    return () => unsub();
  };

  // Host: listen for answers and ICE
  useEffect(() => {
    if (!isHost) return;

    pcRef.current = new RTCPeerConnection(pcConfig);
    pcRef.current.onicecandidate = (e) => {
      if (e.candidate) {
        push(ref(db, `rooms/${roomId}/host/iceCandidates`), e.candidate.toJSON());
      }
    };

    // Listen for answers
    const answerRef = ref(db, `rooms/${roomId}/receiver/answer`);
    const unsub = onValue(answerRef, async (snap) => {
      if (snap.exists() && pcRef.current) {
        const desc = snap.val();
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(desc));
      }
    });

    return () => {
      unsub();
      pcRef.current?.close();
    };
  }, [roomId, isHost]);

  return { startStream, remoteStream, connectToHost };
}
