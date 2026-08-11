import { useEffect, useRef, useState, useCallback } from 'react';
import { ref, set, onChildAdded, onValue, push } from 'firebase/database';
import { db } from '../firebase';

const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
};

export const useWebRTC = (roomId: string, isHost: boolean) => {
  const pc = useRef<RTCPeerConnection | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const initPC = useCallback(() => {
    const connection = new RTCPeerConnection(iceServers);

    connection.onicecandidate = (event) => {
      if (event.candidate) {
        const path = isHost ? 'host' : 'receiver';
        const candidatesRef = ref(db, `rooms/${roomId}/iceCandidates/${path}`);
        push(candidatesRef, event.candidate.toJSON());
      }
    };

    connection.ontrack = (event) => {
      if (!isHost && event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    pc.current = connection;
    return connection;
  }, [roomId, isHost]);

  const startStream = async (stream: MediaStream) => {
    const connection = initPC();
    
    stream.getTracks().forEach(track => {
      connection.addTrack(track, stream);
    });

    const offer = await connection.createOffer();
    await connection.setLocalDescription(offer);
    await set(ref(db, `rooms/${roomId}/offer`), { 
      sdp: offer.sdp, 
      type: offer.type 
    });

    onValue(ref(db, `rooms/${roomId}/answer`), async (snapshot) => {
      const answer = snapshot.val();
      // We check for 'have-local-offer' because that's the state after the host sets its own offer
      if (answer && connection.signalingState === 'have-local-offer') {
        await connection.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    onChildAdded(ref(db, `rooms/${roomId}/iceCandidates/receiver`), (snapshot) => {
      const candidate = snapshot.val();
      if (candidate && connection.remoteDescription) {
        connection.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
      }
    });
  };

  const connectToHost = useCallback(async () => {
    const connection = initPC();

    onValue(ref(db, `rooms/${roomId}/offer`), async (snapshot) => {
      const offer = snapshot.val();
      // 'stable' is the correct initial state for a receiver waiting for an offer
      if (offer && connection.signalingState === 'stable') {
        await connection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await connection.createAnswer();
        await connection.setLocalDescription(answer);
        await set(ref(db, `rooms/${roomId}/answer`), { 
          sdp: answer.sdp, 
          type: answer.type 
        });
      }
    });

    onChildAdded(ref(db, `rooms/${roomId}/iceCandidates/host`), (snapshot) => {
      const candidate = snapshot.val();
      if (candidate && connection.remoteDescription) {
        connection.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
      }
    });
  }, [initPC, roomId]);

  useEffect(() => {
    return () => {
      if (pc.current) {
        pc.current.close();
        pc.current = null;
      }
    };
  }, []);

  return { startStream, connectToHost, remoteStream };
};
