import { useEffect, useRef } from 'react';
import { ref, set, onChildAdded, push } from 'firebase/database';
import { db } from '../firebase';

const iceServers = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

export const useWebRTC = (roomId: string, isHost: boolean) => {
  const pc = useRef<RTCPeerConnection>(new RTCPeerConnection(iceServers));
  const localStream = useRef<MediaStream | null>(null);

  const startHost = async (stream: MediaStream) => {
    localStream.current = stream;
    stream.getTracks().forEach(track => pc.current.addTrack(track, stream));

    pc.current.onicecandidate = (event) => {
      if (event.candidate) {
        push(ref(db, `rooms/${roomId}/iceCandidates/host`), event.candidate.toJSON());
      }
    };

    const offer = await pc.current.createOffer();
    await pc.current.setLocalDescription(offer);
    await set(ref(db, `rooms/${roomId}/offer`), { sdp: offer.sdp, type: offer.type });

    // Listen for Answer
    onValue(ref(db, `rooms/${roomId}/answer`), async (snapshot) => {
      const answer = snapshot.val();
      if (answer && !pc.current.currentRemoteDescription) {
        await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });
  };

  const joinRoom = async (onTrack: (stream: MediaStream) => void) => {
    pc.current.ontrack = (event) => onTrack(event.streams[0]);

    pc.current.onicecandidate = (event) => {
      if (event.candidate) {
        push(ref(db, `rooms/${roomId}/iceCandidates/receiver`), event.candidate.toJSON());
      }
    };

    // Get Offer
    onValue(ref(db, `rooms/${roomId}/offer`), async (snapshot) => {
      const offer = snapshot.val();
      if (offer) {
        await pc.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.current.createAnswer();
        await pc.current.setLocalDescription(answer);
        await set(ref(db, `rooms/${roomId}/answer`), { sdp: answer.sdp, type: answer.type });
      }
    });

    // Listen for ICE Candidates from Host
    onChildAdded(ref(db, `rooms/${roomId}/iceCandidates/host`), (snapshot) => {
      pc.current.addIceCandidate(new RTCIceCandidate(snapshot.val()));
    });
  };

  return { startHost, joinRoom };
};
