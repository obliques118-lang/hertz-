Hertz – Synchronized Multi‑Device Audio Streaming
A production‑ready application enabling a Host to stream audio with perfect phase alignment to many Receivers, complete with a real‑time chat and song suggestion system. The entire stack is designed for seamless deployment on Vercel, using Firebase Realtime Database for signaling and a frosted glassmorphism UI.

1. Architecture Overview
Frontend: React + TypeScript + Vite + Tailwind CSS

Signaling & Real‑time Data: Firebase Realtime Database (free tier)

Media Transport: WebRTC (peer‑to‑peer from Host to each Receiver)

Clock Synchronisation: Firebase server time via ServerValue.TIMESTAMP

Deployment: Vercel (static site with optional Serverless Functions for server time)

How it works
Host creates a session → writes a unique roomId to Firebase.

A QR code (and a textual code) is displayed on the Host screen.

Receivers scan the QR (or enter the code) → join the same Firebase room.

Host captures audio (file or system audio) and creates a WebRTC offer.

Signalling (SDP exchange) is handled over Firebase Realtime Database.

Once the connection is established, the Host streams its audio track.

All clients synchronise their AudioContext.currentTime using a shared clock.

Host sends a startPlaybackAt timestamp; every Receiver begins playback exactly at that synchronised moment.

A Chat and Song Suggestions panel uses the same Firebase room.

The result is low‑latency, phase‑aligned audio across all devices.
