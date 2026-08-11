// components/YouTubePlayer.tsx
import { useState, useEffect, useRef } from 'react';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import { Play, Pause, SkipBack, SkipForward, LogOut } from 'lucide-react';

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

interface Playlist {
  id: string;
  title: string;
  thumbnail: string;
}

export default function YouTubePlayer() {
  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

  // Google Login
  const login = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/youtube.readonly',
    onSuccess: (tokenResponse) => {
      setAccessToken(tokenResponse.access_token);
      fetchUserInfo(tokenResponse.access_token);
    },
  });

  const fetchUserInfo = async (token: string) => {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setUser(data);
    fetchPlaylists(token);
  };

  const fetchPlaylists = async (token: string) => {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true&maxResults=25`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    if (data.items) {
      const list = data.items.map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.default?.url || '',
      }));
      setPlaylists(list);
    }
  };

  // Load YouTube IFrame API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
      window.onYouTubeIframeAPIReady = () => {};
    }
  }, []);

  // Initialise / update player when videoId changes
  useEffect(() => {
    if (!currentVideoId || !containerRef.current) return;

    if (playerRef.current) {
      playerRef.current.loadVideoById(currentVideoId);
    } else {
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: currentVideoId,
        height: '0',
        width: '0',
        playerVars: {
          autoplay: 1,
          controls: 0,
          origin: window.location.origin,
        },
        events: {
          onStateChange: (event: any) => {
            setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
          },
        },
      });
    }
  }, [currentVideoId]);

  // Fetch first video of a playlist and play it
  const playPlaylist = async (playlistId: string) => {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=1&playlistId=${playlistId}&key=${API_KEY}`
    );
    const data = await res.json();
    if (data.items?.length) {
      setCurrentVideoId(data.items[0].snippet.resourceId.videoId);
    }
  };

  const togglePlayPause = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
    setIsPlaying(!isPlaying);
  };

  const skipNext = () => {
    if (playerRef.current) playerRef.current.nextVideo();
  };

  const skipPrev = () => {
    if (playerRef.current) playerRef.current.previousVideo();
  };

  const handleLogout = () => {
    googleLogout();
    setUser(null);
    setAccessToken(null);
    setPlaylists([]);
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }
    setCurrentVideoId(null);
  };

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
      {!user ? (
        <button
          onClick={() => login()}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors"
        >
          Sign in with Google / YouTube
        </button>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <span className="text-white/80 text-sm">
              Logged in as <strong>{user.name}</strong>
            </span>
            <button onClick={handleLogout} className="text-white/50 hover:text-white">
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Playlist grid */}
          <div className="max-h-40 overflow-y-auto grid grid-cols-2 gap-2">
            {playlists.map((pl) => (
              <button
                key={pl.id}
                onClick={() => playPlaylist(pl.id)}
                className="flex items-center gap-2 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm"
              >
                {pl.thumbnail && <img src={pl.thumbnail} alt="" className="w-10 h-10 rounded" />}
                <span className="truncate">{pl.title}</span>
              </button>
            ))}
          </div>

          {/* Hidden player container */}
          <div ref={containerRef} style={{ display: 'none' }} />

          {/* Playback controls */}
          {currentVideoId && (
            <div className="flex items-center justify-center gap-4">
              <button onClick={skipPrev} className="p-2 text-white/70 hover:text-white">
                <SkipBack className="w-5 h-5" />
              </button>
              <button
                onClick={togglePlayPause}
                className="p-4 rounded-full bg-amber-500 hover:bg-amber-400 text-white"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>
              <button onClick={skipNext} className="p-2 text-white/70 hover:text-white">
                <SkipForward className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}