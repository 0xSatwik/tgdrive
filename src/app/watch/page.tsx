'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import Header from '../components/Header';
import { Play, Link as LinkIcon, ExternalLink, Share2, Copy, Check } from 'lucide-react';

const HF_STREAM_URL = process.env.NEXT_PUBLIC_HF_STREAM_URL || '';
const HF_TOKEN = process.env.NEXT_PUBLIC_HF_TOKEN || '';

function WatchPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [streamUrl, setStreamUrl] = useState<string | null>(null);
    const [title, setTitle] = useState('Video Player');
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Custom URL input for streaming from any Telegram link
    const [customUrl, setCustomUrl] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);

    useEffect(() => {
        const id = searchParams.get('id');
        const peer = searchParams.get('peer');
        const name = searchParams.get('name');
        const urlParam = searchParams.get('url');

        if (name) setTitle(decodeURIComponent(name));

        if (id && peer) {
            // Standard stream from our library
            const url = `${HF_STREAM_URL}/stream/${id}?peer=${peer}&token=${HF_TOKEN}`;
            setStreamUrl(url);
        } else if (urlParam) {
            // Parse a t.me link
            try {
                const parsed = parseTelegramUrl(decodeURIComponent(urlParam));
                if (parsed) {
                    const url = `${HF_STREAM_URL}/stream/${parsed.messageId}?peer=${parsed.peerId}&token=${HF_TOKEN}`;
                    setStreamUrl(url);
                    setTitle(`Telegram Video`);
                }
            } catch (e) {
                setError('Invalid Telegram URL');
            }
        } else {
            // Show custom input if no params
            setShowCustomInput(true);
        }
    }, [searchParams]);

    // Parse t.me URLs to extract peer and message ID
    const parseTelegramUrl = (url: string): { peerId: string; messageId: string } | null => {
        // Format: https://t.me/c/1234567890/123 (private channel)
        // Format: https://t.me/channelname/123 (public channel)
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

    return (
        <div className="video-page">
            <Header
                title={title}
                showBack={true}
                onBack={() => router.push('/')}
                // These are required props for the new interface, filling with defaults for this view
                onMenuToggle={() => console.log('Menu toggle not implemented in watch view')}
                searchTerm=""
                onSearchChange={() => { }}
            />

            <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto">
                    {/* Video Player Container */}
                    {streamUrl && !showCustomInput ? (
                        <div className="animate-fade-in">
                            <div className="video-container shadow-2xl">
                                <video
                                    src={streamUrl}
                                    controls
                                    autoPlay
                                    className="w-full h-full"
                                    style={{ background: '#000' }}
                                >
                                    Your browser does not support the video tag.
                                </video>
                            </div>

                            {/* Video Info Bar */}
                            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                                    {title}
                                </h2>

                                <div className="flex items-center gap-2">
                                    <button onClick={handleCopyLink} className="btn-secondary flex items-center gap-2">
                                        {copied ? <Check size={16} /> : <Copy size={16} />}
                                        {copied ? 'Copied!' : 'Copy Link'}
                                    </button>
                                    <button onClick={handleOpenVLC} className="btn-secondary flex items-center gap-2">
                                        <ExternalLink size={16} />
                                        Open in VLC
                                    </button>
                                </div>
                            </div>

                            {/* Stream Another Video */}
                            <div className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
                                <button
                                    onClick={() => setShowCustomInput(true)}
                                    className="text-sm flex items-center gap-2"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    <LinkIcon size={16} />
                                    Stream another video from Telegram URL
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Custom URL Input */
                        <div className="glass-card p-8 max-w-2xl mx-auto animate-fade-in">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{
                                    background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))'
                                }}>
                                    <Play size={32} color="white" />
                                </div>
                                <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                                    Stream from Telegram
                                </h2>
                                <p style={{ color: 'var(--text-secondary)' }}>
                                    Paste any Telegram video link to start streaming
                                </p>
                            </div>

                            <div className="space-y-4">
                                <input
                                    type="text"
                                    value={customUrl}
                                    onChange={(e) => setCustomUrl(e.target.value)}
                                    placeholder="https://t.me/c/1234567890/123"
                                    className="input-field"
                                />

                                {error && (
                                    <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>
                                )}

                                <button
                                    onClick={handleCustomStream}
                                    className="btn-primary w-full"
                                    disabled={!customUrl.trim()}
                                >
                                    <Play size={18} />
                                    Start Streaming
                                </button>
                            </div>

                            <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
                                <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                                    Works with private channels if your bot has access
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default function WatchPage() {
    return (
        <Suspense fallback={
            <div className="video-page flex items-center justify-center">
                <div className="animate-pulse" style={{ color: 'var(--text-secondary)' }}>Loading...</div>
            </div>
        }>
            <WatchPageContent />
        </Suspense>
    );
}
