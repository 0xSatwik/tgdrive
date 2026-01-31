'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, Volume2, Maximize, Loader2, AlertCircle, CheckCircle, Cpu } from 'lucide-react';

// Define the interface for our WASM module
interface WasmModule {
  default: (path: string) => Promise<unknown>;
  TelegramPro: any;
}

interface WasmVideoPlayerProps {
  file: any;
  apiId: number;
  apiHash: string;
  onClose: () => void;
  tgClient: any;
}

const WasmVideoPlayer: React.FC<WasmVideoPlayerProps> = ({ file, apiId, apiHash, onClose, tgClient }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<string>("Initializing...");
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const mediaSourceRef = useRef<MediaSource | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);
  const wasmClientRef = useRef<any>(null);
  const mediaRef = useRef<any>(null);

  const TOTAL_SIZE = file.size;

  useEffect(() => {
    const initPlayer = async () => {
      if (!tgClient) {
        setError("Telegram Client Disconnected");
        setIsLoading(false);
        return;
      }

      const mime = file.mime_type?.includes('mp4')
        ? 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"'
        : (file.mime_type || 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"');

      if (!MediaSource.isTypeSupported(mime)) {
        console.warn("MIME probably not supported:", mime);
        setStatus(`Browser might not support ${mime}`);
      }

      try {
        // @ts-ignore
        const wasm = await import(/* webpackIgnore: true */ '/wasm/telegram_wasm_player.js');
        await wasm.default('/wasm/telegram_wasm_player_bg.wasm');
        const client = new wasm.TelegramPro();
        await client.connect(apiId, apiHash, "");
        wasmClientRef.current = client;

        setStatus("Resolving video...");

        const PEER = process.env.NEXT_PUBLIC_TELEGRAM_PEER || 'me';
        const messages = await tgClient.getMessages(PEER, { ids: [Number(file.telegram_id)] });

        if (!messages || !messages[0] || !messages[0].media) {
          throw new Error(`Video message ${file.telegram_id} not found.`);
        }

        mediaRef.current = messages[0].media;
        setStatus("Starting stream...");

        const mediaSource = new MediaSource();
        mediaSourceRef.current = mediaSource;
        if (videoRef.current) {
          videoRef.current.src = URL.createObjectURL(mediaSource);
        }

        mediaSource.addEventListener('sourceopen', () => {
          try {
            const sb = mediaSource.addSourceBuffer(mime);
            sourceBufferRef.current = sb;
            sb.mode = 'segments';
            startStreaming();
          } catch (e) {
            console.error("MSE Error:", e);
            setError("Codec not supported");
            setIsLoading(false);
          }
        });

      } catch (e: any) {
        console.error("Init Error:", e);
        setError("Initialization failed: " + e.message);
        setIsLoading(false);
      }
    };

    const startStreaming = async () => {
      const sb = sourceBufferRef.current;
      const ms = mediaSourceRef.current;
      if (!sb || !ms || ms.readyState !== 'open') return;

      try {
        console.log('[Stream] Starting progressive download...');
        let bytesReceived = 0;

        const buffer = await tgClient.downloadFile(mediaRef.current, {
          progressCallback: (received: number, total: number) => {
            const newBytes = received - bytesReceived;
            if (newBytes > 0) {
              bytesReceived = received;
              setProgress((received / TOTAL_SIZE) * 100);
              setStatus(`Buffering: ${(received / 1024 / 1024).toFixed(1)}MB / ${(TOTAL_SIZE / 1024 / 1024).toFixed(1)}MB`);
            }
          }
        } as any);

        console.log(`[Stream] Download complete: ${buffer ? buffer.length : 0} bytes`);

        if (buffer && buffer.length > 0) {
          const chunkSize = 1024 * 1024;
          for (let i = 0; i < buffer.length; i += chunkSize) {
            const chunk = buffer.slice(i, Math.min(i + chunkSize, buffer.length));

            while (sb.updating) {
              await new Promise(resolve => setTimeout(resolve, 50));
            }

            if (ms.readyState === 'open') {
              sb.appendBuffer(chunk);
            }
          }

          if (!sb.updating && ms.readyState === 'open') {
            ms.endOfStream();
            setStatus("Ready to play");
            setIsLoading(false);
          }
        }
      } catch (e: any) {
        console.error('[Stream] Error:', e);
        setError('Stream failed: ' + e.message);
        setIsLoading(false);
      }
    };

    if (file && tgClient) initPlayer();

    return () => {
      if (mediaSourceRef.current?.readyState === 'open') {
        try { mediaSourceRef.current.endOfStream(); } catch (e) { }
      }
      if (videoRef.current) URL.revokeObjectURL(videoRef.current.src);
    };
  }, []);

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
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                boxShadow: '0 4px 16px rgba(245, 158, 11, 0.3)'
              }}
            >
              <Cpu size={20} className="text-white" />
            </div>
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
                {status}
              </span>
            </div>
          </div>
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
                  background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                  boxShadow: '0 8px 32px rgba(245, 158, 11, 0.5)'
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
                <Loader2 size={48} style={{ color: '#f59e0b' }} />
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
                background: 'linear-gradient(90deg, #f59e0b, #ef4444)',
                boxShadow: '0 0 8px rgba(245, 158, 11, 0.5)'
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
                Engine
              </span>
              <span style={{ color: '#f59e0b' }}>
                Rust + WASM
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold block mb-0.5" style={{ color: 'var(--text-muted)' }}>
                Buffer
              </span>
              <span style={{ color: 'var(--success)' }}>
                {progress.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default WasmVideoPlayer;
