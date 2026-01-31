'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense, useRef } from 'react';
import Header from '../components/Header';
import { 
  Play, Link as LinkIcon, ExternalLink, Copy, Check, 
  Volume2, Maximize, Pause, Settings,
  ChevronLeft, Monitor, Download, HardDrive, Folder,
  FileText, Video, Image as ImageIcon, Package, Music,
  ArrowRight, Clock, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const HF_STREAM_URL = process.env.NEXT_PUBLIC_HF_STREAM_URL || '';
const HF_TOKEN = process.env.NEXT_PUBLIC_HF_TOKEN || '';

function WatchPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);

    const [streamUrl, setStreamUrl] = useState<string | null>(null);
    const [title, setTitle] = useState('Video Player');
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customUrl, setCustomUrl] = useState('');
    const [showControls, setShowControls] = useState(true);
    const [volume, setVolume] = useState(1);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [buffered, setBuffered] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const id = searchParams.get('id');
        const peer = searchParams.get('peer');
        const name = searchParams.get('name');
        const urlParam = searchParams.get('url');

        if (name) setTitle(decodeURIComponent(name));

        if (id && peer) {
            const url = `${HF_STREAM_URL}/stream/${id}?peer=${peer}&token=${HF_TOKEN}`;
            setStreamUrl(url);
        } else if (urlParam) {
            try {
                const parsed = parseTelegramUrl(decodeURIComponent(urlParam));
                if (parsed) {
                    const url = `${HF_STREAM_URL}/stream/${parsed.messageId}?peer=${parsed.peerId}&token=${HF_TOKEN}`;
                    setStreamUrl(url);
                    setTitle('External Video');
                }
            } catch (e) {
                setError('Invalid Telegram URL');
            }
        } else {
            setShowCustomInput(true);
        }
    }, [searchParams]);

    const parseTelegramUrl = (url: string): { peerId: string; messageId: string } | null => {
        const privateMatch = url.match(/t\.me\/c\/(\d+)\/(\d+)/);
        if (privateMatch) {
            return { peerId: `-100${privateMatch[1]}`, messageId: privateMatch[2] };
        }

        const publicMatch = url.match(/t\.me\/([^/]+)\/(\d+)/);
        if (publicMatch && publicMatch[1] !== 'c') {
            return { peerId: publicMatch[1], messageId: publicMatch[2] };
        }

        return null;
    };

    const handleCustomStream = () => {
        if (!customUrl.trim()) return;

        const parsed = parseTelegramUrl(customUrl);
        if (parsed) {
            const url = `${HF_STREAM_URL}/stream/${parsed.messageId}?peer=${parsed.peerId}&token=${HF_TOKEN}`;
            setStreamUrl(url);
            setShowCustomInput(false);
            setTitle('External Video');
            setError(null);
        } else {
            setError('Invalid Telegram URL. Use format: t.me/c/channel_id/message_id');
        }
    };

    const handleCopyLink = () => {
        if (streamUrl) {
            navigator.clipboard.writeText(streamUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleOpenVLC = () => {
        if (streamUrl) {
            window.location.href = `vlc://${streamUrl}`;
        }
    };

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

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            videoRef.current?.parentElement?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (videoRef.current) {
            videoRef.current.volume = newVolume;
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current && !isDragging) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    const handleProgress = () => {
        if (videoRef.current && videoRef.current.buffered.length > 0) {
            const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
            setBuffered(bufferedEnd);
        }
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
        if (!videoRef.current || !progressRef.current) return;
        
        const rect = progressRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const pos = (clientX - rect.left) / rect.width;
        const newTime = Math.max(0, Math.min(pos * duration, duration));
        
        videoRef.current.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        setIsDragging(true);
        handleSeek(e);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        setShowControls(true);
        if (isDragging) {
            handleSeek(e);
        }
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        controlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying && !isDragging) {
                setShowControls(false);
            }
        }, 3000);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        return () => {
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const handleGlobalMouseUp = () => setIsDragging(false);
        document.addEventListener('mouseup', handleGlobalMouseUp);
        return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
    }, []);

    const progressPercent = duration ? (currentTime / duration) * 100 : 0;
    const bufferedPercent = duration ? (buffered / duration) * 100 : 0;

    return (
        <div className="video-page min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
            <Header
                title={title}
                showBack={true}
                onBack={() => router.push('/')}
                onMenuToggle={() => {}}
                searchTerm=""
                onSearchChange={() => {}}
            />

            <main className="flex-1 px-6 sm:px-8 lg:px-10 py-8 sm:py-10">
                <div className="max-w-6xl mx-auto">
                    {streamUrl && !showCustomInput ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-8"
                        >
                            {/* Title Section */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <motion.div 
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center gap-3 mb-2"
                                    >
                                        <div 
                                            className="p-2.5 rounded-xl"
                                            style={{ 
                                                background: 'var(--video-gradient)',
                                                boxShadow: '0 4px 16px rgba(236, 72, 153, 0.3)'
                                            }}
                                        >
                                            <Video size={20} className="text-white" />
                                        </div>
                                        <h1 
                                            className="text-2xl sm:text-3xl lg:text-4xl font-bold truncate"
                                            style={{ color: 'var(--text-primary)' }}
                                        >
                                            {title}
                                        </h1>
                                    </motion.div>
                                    <p className="text-sm ml-1" style={{ color: 'var(--text-muted)' }}>
                                        Streaming via Telegram · HD Quality
                                    </p>
                                </div>
                            </div>

                            {/* Video Player */}
                            <div 
                                className="relative rounded-3xl overflow-hidden shadow-2xl"
                                style={{ 
                                    background: '#000',
                                    boxShadow: '0 25px 80px -12px rgba(0, 0, 0, 0.8)'
                                }}
                                onMouseMove={handleMouseMove}
                                onMouseLeave={() => {
                                    if (isPlaying && !isDragging) {
                                        setShowControls(false);
                                    }
                                }}
                            >
                                <video
                                    ref={videoRef}
                                    src={streamUrl}
                                    className="w-full aspect-video"
                                    onPlay={() => setIsPlaying(true)}
                                    onPause={() => setIsPlaying(false)}
                                    onClick={togglePlay}
                                    onTimeUpdate={handleTimeUpdate}
                                    onLoadedMetadata={handleLoadedMetadata}
                                    onProgress={handleProgress}
                                >
                                    Your browser does not support the video tag.
                                </video>

                                {/* Custom Controls Overlay */}
                                <AnimatePresence>
                                    {showControls && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30 pointer-events-none"
                                        >
                                            {/* Center Play Button */}
                                            {!isPlaying && (
                                                <motion.button
                                                    initial={{ scale: 0.8, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full flex items-center justify-center pointer-events-auto"
                                                    style={{
                                                        background: 'var(--accent-gradient)',
                                                        boxShadow: '0 8px 40px rgba(99, 102, 241, 0.6)'
                                                    }}
                                                    onClick={togglePlay}
                                                >
                                                    <Play size={40} className="text-white ml-1" fill="white" />
                                                </motion.button>
                                            )}

                                            {/* Bottom Controls */}
                                            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 pointer-events-auto">
                                                {/* Progress Bar - YouTube Style */}
                                                <div className="mb-4">
                                                    <div 
                                                        ref={progressRef}
                                                        className="relative h-1.5 bg-white/30 rounded-full cursor-pointer group"
                                                        onClick={handleSeek}
                                                        onMouseDown={handleMouseDown}
                                                        onMouseMove={handleMouseMove}
                                                        onMouseUp={handleMouseUp}
                                                    >
                                                        {/* Buffered Progress */}
                                                        <div 
                                                            className="absolute top-0 left-0 h-full bg-white/40 rounded-full"
                                                            style={{ width: `${bufferedPercent}%` }}
                                                        />
                                                        
                                                        {/* Current Progress */}
                                                        <div 
                                                            className="absolute top-0 left-0 h-full rounded-full transition-all duration-100"
                                                            style={{ 
                                                                width: `${progressPercent}%`,
                                                                background: 'var(--accent-gradient)'
                                                            }}
                                                        />
                                                        
                                                        {/* Hover/Seek Preview Line */}
                                                        <div className="absolute top-0 left-0 h-full w-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <div className="h-full bg-white/20 rounded-full" />
                                                        </div>
                                                        
                                                        {/* Thumb/Handle */}
                                                        <div 
                                                            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                            style={{ left: `calc(${progressPercent}% - 8px)` }}
                                                        />
                                                    </div>
                                                    
                                                    {/* Time Display */}
                                                    <div className="flex justify-between mt-2 text-sm font-medium">
                                                        <span style={{ color: 'var(--text-secondary)' }}>
                                                            {formatTime(currentTime)}
                                                        </span>
                                                        <span style={{ color: 'var(--text-secondary)' }}>
                                                            {formatTime(duration)}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6">
                                                    <button 
                                                        onClick={togglePlay}
                                                        className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                                                    >
                                                        {isPlaying ? (
                                                            <Pause size={24} className="text-white" fill="white" />
                                                        ) : (
                                                            <Play size={24} className="text-white ml-0.5" fill="white" />
                                                        )}
                                                    </button>

                                                    <div className="flex items-center gap-3">
                                                        <Volume2 size={20} className="text-white/70" />
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="1"
                                                            step="0.1"
                                                            value={volume}
                                                            onChange={handleVolumeChange}
                                                            className="w-24 h-1.5 bg-white/30 rounded-full appearance-none cursor-pointer"
                                                            style={{
                                                                background: `linear-gradient(to right, white ${volume * 100}%, rgba(255,255,255,0.3) ${volume * 100}%)`
                                                            }}
                                                        />
                                                    </div>

                                                    <div className="flex-1" />

                                                    <button 
                                                        onClick={toggleFullscreen}
                                                        className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                                                    >
                                                        <Maximize size={20} className="text-white" />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Action Buttons Bar */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="glass-card p-6 sm:p-8"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <div 
                                            className="p-3 rounded-xl"
                                            style={{ background: 'var(--surface)' }}
                                        >
                                            <Monitor size={22} style={{ color: 'var(--text-secondary)' }} />
                                        </div>
                                        <div>
                                            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                External Players
                                            </p>
                                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                                Open in VLC or copy stream URL
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 flex-wrap">
                                        <button 
                                            onClick={handleCopyLink} 
                                            className="btn-secondary"
                                        >
                                            {copied ? <Check size={18} /> : <Copy size={18} />}
                                            {copied ? 'Copied!' : 'Copy Stream URL'}
                                        </button>
                                        <button 
                                            onClick={handleOpenVLC} 
                                            className="btn-secondary"
                                        >
                                            <ExternalLink size={18} />
                                            Open in VLC
                                        </button>
                                        <button 
                                            onClick={() => setShowCustomInput(true)}
                                            className="btn-primary"
                                        >
                                            <LinkIcon size={18} />
                                            Stream Another
                                        </button>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Quick Links Section */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                            >
                                {[
                                    { icon: Folder, label: 'All Files', color: '#6366f1', filter: null },
                                    { icon: Video, label: 'Videos', color: '#ec4899', filter: 'video' },
                                    { icon: ImageIcon, label: 'Images', color: '#3b82f6', filter: 'image' },
                                    { icon: FileText, label: 'Documents', color: '#f59e0b', filter: 'application' },
                                ].map((item, index) => (
                                    <button
                                        key={item.label}
                                        onClick={() => router.push(`/?filter=${item.filter}`)}
                                        className="flex items-center gap-3 p-4 rounded-xl transition-all hover:scale-[1.02]"
                                        style={{ 
                                            background: 'var(--surface)',
                                            border: '1px solid var(--border)'
                                        }}
                                    >
                                        <div 
                                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                                            style={{ background: `${item.color}20` }}
                                        >
                                            <item.icon size={20} style={{ color: item.color }} />
                                        </div>
                                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                            {item.label}
                                        </span>
                                        <ArrowRight size={16} className="ml-auto" style={{ color: 'var(--text-muted)' }} />
                                    </button>
                                ))}
                            </motion.div>
                        </motion.div>
                    ) : (
                        /* Custom URL Input */
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass-card p-8 sm:p-12 max-w-2xl mx-auto"
                        >
                            <div className="text-center mb-8">
                                <motion.div
                                    animate={{ 
                                        boxShadow: [
                                            '0 8px 32px rgba(99, 102, 241, 0.3)',
                                            '0 12px 48px rgba(168, 85, 247, 0.4)',
                                            '0 8px 32px rgba(99, 102, 241, 0.3)'
                                        ]
                                    }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
                                    style={{ background: 'var(--accent-gradient)' }}
                                >
                                    <Play size={40} className="text-white ml-1" fill="white" />
                                </motion.div>
                                <h2 
                                    className="text-2xl sm:text-3xl font-bold mb-3"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    Stream from Telegram
                                </h2>
                                <p className="text-base" style={{ color: 'var(--text-muted)' }}>
                                    Paste any Telegram video link to start streaming
                                </p>
                            </div>

                            <div className="space-y-5">
                                <div className="relative">
                                    <LinkIcon 
                                        className="absolute left-4 top-1/2 -translate-y-1/2" 
                                        size={20}
                                        style={{ color: 'var(--text-muted)' }}
                                    />
                                    <input
                                        type="text"
                                        value={customUrl}
                                        onChange={(e) => setCustomUrl(e.target.value)}
                                        placeholder="https://t.me/c/1234567890/123"
                                        className="input-field !pl-12 !py-4 text-base"
                                    />
                                </div>

                                {error && (
                                    <motion.p 
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-sm p-4 rounded-xl"
                                        style={{ 
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            color: 'var(--danger)',
                                            border: '1px solid rgba(239, 68, 68, 0.2)'
                                        }}
                                    >
                                        {error}
                                    </motion.p>
                                )}

                                <button
                                    onClick={handleCustomStream}
                                    className="btn-primary w-full !py-4"
                                    disabled={!customUrl.trim()}
                                >
                                    <Play size={20} />
                                    Start Streaming
                                </button>
                            </div>

                            <div className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
                                <p 
                                    className="text-sm text-center"
                                    style={{ color: 'var(--text-muted)' }}
                                >
                                    Works with private channels if your bot has access
                                </p>
                            </div>
                        </motion.div>
                    )}
                </div>
            </main>

            {/* Site Footer */}
            <footer className="mt-auto py-8 px-6 sm:px-8 lg:px-10 border-t" style={{ 
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border)'
            }}>
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div 
                                className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{ 
                                    background: 'var(--accent-gradient)',
                                    boxShadow: 'var(--shadow-accent)'
                                }}
                            >
                                <HardDrive className="text-white" size={16} />
                            </div>
                            <div>
                                <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                                    TG Drive
                                </p>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                    Unlimited Cloud Storage
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm" style={{ color: 'var(--text-muted)' }}>
                            <span className="flex items-center gap-2">
                                <Clock size={14} />
                                Streaming Ready
                            </span>
                            <span className="flex items-center gap-2">
                                <Eye size={14} />
                                HD Quality
                            </span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default function WatchPage() {
    return (
        <Suspense fallback={
            <div 
                className="video-page flex items-center justify-center min-h-screen"
                style={{ background: 'var(--bg-primary)' }}
            >
                <motion.div
                    animate={{ 
                        scale: [1, 1.1, 1],
                        opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ color: 'var(--text-muted)' }}
                >
                    <Play size={48} />
                </motion.div>
            </div>
        }>
            <WatchPageContent />
        </Suspense>
    );
}
