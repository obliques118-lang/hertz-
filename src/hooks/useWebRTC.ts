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

  // Initialize PeerConnection with ICE handling
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

  // Function for the Host to start broadcasting
  const startStream = async (stream: MediaStream) => {
    const connection = initPC();
    
    // Add local tracks to the connection
    stream.getTracks().forEach(track => {
      connection.addTrack(track, stream);
    });

    // Create and save Offer
    const offer = await connection.createOffer();
    await connection.setLocalDescription(offer);
    await set(ref(db, `rooms/${roomId}/offer`), { 
      sdp: offer.sdp, 
      type: offer.type 
    });

    // Listen for Answers from Receivers
    onValue(ref(db, `rooms/${roomId}/answer`), async (snapshot) => {
      const answer = snapshot.val();
      if (answer && connection.signalingState !== 'stable') {
        await connection.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    // Listen for Receiver ICE Candidates
    onChildAdded(ref(db, `rooms/${roomId}/iceCandidates/receiver`), (snapshot) => {
      const candidate = snapshot.val();
      if (candidate) {
        connection.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
      }
    });
  };

  // Function for the Receiver to connect
  const connectToHost = useCallback(async () => {
    const connection = initPC();

    // Listen for Host Offer
    onValue(ref(db, `rooms/${roomId}/offer`), async (snapshot) => {
      const offer = snapshot.val();
      if (offer && connection.signalingState === 'new') {
        await connection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await connection.createAnswer();
        await connection.setLocalDescription(answer);
        await set(ref(db, `rooms/${roomId}/answer`), { 
          sdp: answer.sdp, 
          type: answer.type 
        });
      }
    });

    // Listen for Host ICE Candidates
    onChildAdded(ref(db, `rooms/${roomId}/iceCandidates/host`), (snapshot) => {
      const candidate = snapshot.val();
      if (candidate) {
        connection.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
      }
    });
  }, [initPC, roomId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      pc.current?.close();
    };
  }, []);

  return { startStream, connectToHost, remoteStream };
};
