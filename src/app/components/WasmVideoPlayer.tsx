"use client";
import React, { useEffect, useRef, useState } from 'react';

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
    tgClient: any; // We pass GramJS client here
}

const WasmVideoPlayer: React.FC<WasmVideoPlayerProps> = ({ file, apiId, apiHash, onClose, tgClient }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [status, setStatus] = useState<string>("Initializing Rust Engine...");
    const [progress, setProgress] = useState(0);

    // Refs for state management inside sync loops
    const mediaSourceRef = useRef<MediaSource | null>(null);
    const sourceBufferRef = useRef<SourceBuffer | null>(null);
    const wasmClientRef = useRef<any>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const bufferIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const mediaRef = useRef<any>(null); // Store message.media

    // Config
    const CHUNK_SIZE = 1024 * 1024; // 1MB chunks
    const TOTAL_SIZE = file.size;

    useEffect(() => {
        const initPlayer = async () => {
            if (!tgClient) {
                setStatus("❌ Error: Telegram Client Disconnected.");
                return;
            }

            // Codec check (using more lenient check logic for MVP)
            const mime = file.mime_type?.includes('mp4')
                ? 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"'
                : (file.mime_type || 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"');

            if (!MediaSource.isTypeSupported(mime)) {
                console.warn("MIME probably not supported:", mime);
                setStatus(`⚠️ Browser might reject ${mime}`);
            }

            try {
                // 1. Load WASM Module (Engine)
                // @ts-ignore
                const wasm = await import(/* webpackIgnore: true */ '/wasm/telegram_wasm_player.js');
                await wasm.default('/wasm/telegram_wasm_player_bg.wasm');
                const client = new wasm.TelegramPro();
                await client.connect(apiId, apiHash, "");
                wasmClientRef.current = client;

                setStatus("Resolving Video Location in Cloud...");

                // 2. Resolve Telegram Media
                // We use GramJS to find the message
                // Assuming "me" peer for now, or use PEER from env if we can access it,
                // but simpler to use the file.telegram_id directly with getMessages
                const PEER = process.env.NEXT_PUBLIC_TELEGRAM_PEER || 'me';
                const messages = await tgClient.getMessages(PEER, { ids: [Number(file.telegram_id)] });

                if (!messages || !messages[0] || !messages[0].media) {
                    throw new Error(`Video message ${file.telegram_id} not found.`);
                }

                mediaRef.current = messages[0].media;
                setStatus("Engine Ready. Starting Stream...");

                // 3. Setup MediaSource
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
                        setStatus("MSE Error: Codec mismatched.");
                    }
                });

            } catch (e: any) {
                console.error("Init Error:", e);
                setStatus("Init Failed: " + e.message);
            }
        };

        const startStreaming = async () => {
            const sb = sourceBufferRef.current;
            const ms = mediaSourceRef.current;
            if (!sb || !ms || ms.readyState !== 'open') return;

            try {
                console.log('[Stream] Starting progressive download...');
                let bytesReceived = 0;
                const chunks: Uint8Array[] = [];

                // Download the file progressively
                const buffer = await tgClient.downloadFile(mediaRef.current, {
                    progressCallback: (received: number, total: number) => {
                        const newBytes = received - bytesReceived;
                        if (newBytes > 0) {
                            bytesReceived = received;
                            setProgress((received / TOTAL_SIZE) * 100);
                            setStatus(`Buffering: ${(received / 1024 / 1024).toFixed(1)}MB / ${(TOTAL_SIZE / 1024 / 1024).toFixed(1)}MB`);
                            console.log(`[Stream] Progress: ${received} / ${total}`);
                        }
                    }
                } as any);

                console.log(`[Stream] Download complete: ${buffer ? buffer.length : 0} bytes`);

                if (buffer && buffer.length > 0) {
                    // Append the entire buffer at once
                    // For large files, we might need to chunk it, but let's try this first
                    const chunkSize = 1024 * 1024; // 1MB chunks for appending
                    for (let i = 0; i < buffer.length; i += chunkSize) {
                        const chunk = buffer.slice(i, Math.min(i + chunkSize, buffer.length));

                        // Wait for buffer to be ready
                        while (sb.updating) {
                            await new Promise(resolve => setTimeout(resolve, 50));
                        }

                        if (ms.readyState === 'open') {
                            sb.appendBuffer(chunk);
                            console.log(`[Stream] Appended chunk ${i / chunkSize + 1}`);
                        }
                    }

                    if (!sb.updating && ms.readyState === 'open') {
                        ms.endOfStream();
                        setStatus("Playback Ready");
                    }
                }
            } catch (e: any) {
                console.error('[Stream] Error:', e);
                setStatus('Stream Error: ' + e.message);
            }
        };

        if (file && tgClient) initPlayer();

        return () => {
            if (mediaSourceRef.current?.readyState === 'open') {
                try { mediaSourceRef.current.endOfStream(); } catch (e) { }
            }
            if (videoRef.current) URL.revokeObjectURL(videoRef.current.src);
        };
    }, []); // Run on mount

    return (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-5xl bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-white/10">
                <div className="flex justify-between items-center p-4 border-b border-white/5 bg-black/40">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                        <h3 className="font-medium text-white/90">
                            🚀 Rust-WASM Player: <span className="text-white/60">{file.name}</span>
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        ✖
                    </button>
                </div>

                <div className="relative aspect-video bg-black group">
                    <video ref={videoRef} controls autoPlay className="w-full h-full" />
                    <div className="absolute top-4 left-4 bg-black/80 backdrop-blur px-3 py-1.5 rounded-lg border border-orange-500/20 text-xs font-mono text-orange-400">
                        ⚙️ {status}
                    </div>
                </div>

                <div className="bg-black/40 p-1">
                    <div className="h-1 bg-gray-800 w-full">
                        <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WasmVideoPlayer;
