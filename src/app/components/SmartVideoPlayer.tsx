'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ExternalLink, Play, Pause, Volume2, Maximize, 
  Loader2, AlertCircle, CheckCircle 
} from 'lucide-react';

interface SmartVideoPlayerProps {
  file: any;
  tgClient: any;
  onClose: () => void;
}

const SmartVideoPlayer: React.FC<SmartVideoPlayerProps> = ({ file, tgClient, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<string>("Initializing...");
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const HF_URL = process.env.NEXT_PUBLIC_HF_STREAM_URL || "";
  const HF_TOKEN = process.env.NEXT_PUBLIC_HF_TOKEN || "";
  const PEER = process.env.NEXT_PUBLIC_TELEGRAM_PEER || "me";

  const getStreamUrl = () => {
    const url = `${HF_URL}/stream/${file.telegram_id}?peer=${PEER}`;
    return HF_TOKEN ? `${url}&token=${HF_TOKEN}` : url;
  };

  const getVlcUrl = () => `vlc://${getStreamUrl().replace('https://', '')}`;

  useEffect(() => {
    if (!HF_URL) {
      setError("Stream URL not configured");
      setIsLoading(false);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    const streamUrl = getStreamUrl();
    video.src = streamUrl;
    setStatus("Connecting to stream...");

    video.onerror = async () => {
      try {
        const res = await fetch(streamUrl, { method: 'HEAD' });
        if (res.status === 503) {
          setStatus("Bridge connecting... Please wait");
          setTimeout(() => { if (video.src === streamUrl) video.load(); }, 10000);
        } else {
          setError("Stream unavailable");
        }
      } catch (e) {
        setError("Connection failed");
      }
      setIsLoading(false);
    };

    video.oncanplay = () => {
      setIsLoading(false);
      setStatus("Ready to play");
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const duration = video.duration;
        if (duration > 0) {
          setProgress(Math.round((bufferedEnd / duration) * 100));
        }
      }
    };

    video.addEventListener('progress', handleProgress);
    return () => {
      video.removeEventListener('progress', handleProgress);
    };
  }, [file, HF_URL]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.parentElement?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.95)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl"
        style={{ 
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="p-4 sm:p-5 flex justify-between items-center"
          style={{ 
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border)'
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div 
              className="w-2.5 h-2.5 rounded-full animate-pulse flex-shrink-0"
              style={{ 
                background: error ? 'var(--danger)' : isLoading ? 'var(--warning)' : 'var(--success)',
                boxShadow: `0 0 8px ${error ? 'var(--danger)' : isLoading ? 'var(--warning)' : 'var(--success)'}`
              }}
            />
            <div className="min-w-0">
              <h3 
                className="font-semibold text-base sm:text-lg truncate"
                style={{ color: 'var(--text-primary)' }}
              >
                {file.name}
              </h3>
              <span className="text-xs flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                {isLoading && <Loader2 size={12} className="animate-spin" />}
                {error && <AlertCircle size={12} />}
                {!isLoading && !error && <CheckCircle size={12} />}
                {status} • {progress}% buffered
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={getVlcUrl()}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105"
              style={{ 
                background: 'var(--warning)',
                color: '#000'
              }}
            >
              <ExternalLink size={16} />
              Open in VLC
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-all hover:scale-105"
              style={{ 
                background: 'var(--surface)',
                color: 'var(--text-muted)'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Video Container */}
        <div 
          className="relative aspect-video bg-black"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => isPlaying && setShowControls(false)}
        >
          <video
            ref={videoRef}
            className="w-full h-full"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onClick={togglePlay}
          />

          {/* Center Play Button */}
          <AnimatePresence>
            {!isPlaying && !isLoading && !error && (
              <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center"
                style={{
                  background: 'var(--accent-gradient)',
                  boxShadow: '0 8px 32px rgba(99, 102, 241, 0.5)'
                }}
                onClick={togglePlay}
              >
                <Play size={28} className="text-white ml-1" fill="white" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Loading State */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 size={48} style={{ color: 'var(--accent)' }} />
              </motion.div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div 
                className="text-center p-6 rounded-2xl"
                style={{ 
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)'
                }}
              >
                <AlertCircle size={48} style={{ color: 'var(--danger)' }} className="mx-auto mb-3" />
                <p style={{ color: 'var(--danger)' }}>{error}</p>
              </div>
            </div>
          )}

          {/* Custom Controls */}
          <AnimatePresence>
            {showControls && !isLoading && !error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none"
              >
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 pointer-events-auto">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={togglePlay}
                      className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                    >
                      {isPlaying ? (
                        <Pause size={20} className="text-white" fill="white" />
                      ) : (
                        <Play size={20} className="text-white ml-0.5" fill="white" />
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      <Volume2 size={18} className="text-white/70" />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-20 sm:w-24 h-1 rounded-full appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, rgba(255,255,255,0.8) ${volume * 100}%, rgba(255,255,255,0.3) ${volume * 100}%)`
                        }}
                      />
                    </div>

                    <div className="flex-1" />

                    <button
                      onClick={toggleFullscreen}
                      className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                    >
                      <Maximize size={18} className="text-white" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Buffer Progress */}
          <div 
            className="absolute bottom-0 left-0 h-1 w-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            <motion.div
              className="h-full"
              style={{ 
                background: 'var(--success)',
                boxShadow: '0 0 8px var(--success)'
              }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Footer */}
        <div 
          className="p-4 flex justify-between items-center text-sm"
          style={{ 
            background: 'var(--surface)',
            borderTop: '1px solid var(--border)'
          }}
        >
          <div className="flex gap-4 sm:gap-6">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold block mb-0.5" style={{ color: 'var(--text-muted)' }}>
                File Size
              </span>
              <span style={{ color: 'var(--text-primary)' }}>
                {(file.size / (1024 * 1024)).toFixed(1)} MB
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold block mb-0.5" style={{ color: 'var(--text-muted)' }}>
                Source
              </span>
              <span style={{ color: 'var(--success)' }}>
                HF Pro Bridge
              </span>
            </div>
          </div>

          <a
            href={getVlcUrl()}
            className="sm:hidden flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold"
            style={{ 
              background: 'var(--warning)',
              color: '#000'
            }}
          >
            <ExternalLink size={14} />
            VLC
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SmartVideoPlayer;
