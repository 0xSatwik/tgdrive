"use client";
import React, { useEffect, useRef, useState } from 'react';

interface SmartVideoPlayerProps {
    file: any;
    tgClient: any;
    onClose: () => void;
}

const SmartVideoPlayer: React.FC<SmartVideoPlayerProps> = ({ file, tgClient, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [status, setStatus] = useState<string>("Initializing Pro Streamer...");
    const [progress, setProgress] = useState(0);

    // Get variables from env
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
            setStatus("❌ Error: NEXT_PUBLIC_HF_STREAM_URL not set in .env");
            return;
        }

        const video = videoRef.current;
        if (!video) return;

        // Directly set the source to the HF Bridge
        const streamUrl = getStreamUrl();
        video.src = streamUrl;

        setStatus("🚀 Streaming via HF Pro Bridge...");

        // Handle bridge errors (like 503 Connecting)
        video.onerror = async () => {
            try {
                const res = await fetch(streamUrl, { method: 'HEAD' });
                if (res.status === 503) {
                    setStatus("⏳ Bridge is still connecting to Telegram (via MTProxy)... Please wait 1 min.");
                    // Retry in 10s
                    setTimeout(() => { if (video.src === streamUrl) video.load(); }, 10000);
                } else {
                    setStatus("❌ HF Bridge Error or DC Blocked");
                }
            } catch (e) {
                setStatus("❌ HF Bridge is Offline or Unreachable");
            }
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

    return (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-5xl bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-white/10">
                {/* Header */}
                <div className="bg-gray-800/50 p-4 border-b border-white/5 flex justify-between items-center">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <h3 className="font-semibold text-white text-lg truncate max-w-md">
                                HF Pro Player: {file.name}
                            </h3>
                        </div>
                        <span className="text-xs text-gray-400 mt-1">
                            {status} • {progress}% buffered
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <a
                            href={getVlcUrl()}
                            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all transform hover:scale-105 shadow-lg"
                        >
                            🎬 OPEN IN VLC
                        </a>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors p-2"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Video Stage */}
                <div className="aspect-video bg-black relative flex items-center justify-center group">
                    <video
                        ref={videoRef}
                        controls
                        autoPlay
                        className="w-full h-full"
                    >
                        Your browser does not support the video tag.
                    </video>

                    {/* Bottom Progress Bar */}
                    <div className="absolute bottom-0 left-0 h-1 bg-white/10 w-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-500 transition-all duration-300 ease-out shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Footer Info */}
                <div className="p-4 bg-gray-800/30 flex justify-between items-center text-sm">
                    <div className="flex gap-6 text-gray-400">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Filesize</span>
                            <span className="text-white">{(file.size / (1024 * 1024)).toFixed(1)} MB</span>
                        </div>
                        <div className="flex flex-col text-emerald-400">
                            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Source</span>
                            <span>Hugging Face Pro Bridge</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Backdrop Close Click */}
            <div className="absolute inset-0 -z-10" onClick={onClose} />
        </div>
    );
};

export default SmartVideoPlayer;
