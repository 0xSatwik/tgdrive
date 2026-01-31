// Service Worker for Streaming Telegram Files
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';

let client = null;
let apiId, apiHash, sessionString;

self.addEventListener('message', (event) => {
    if (event.data.type === 'INIT_TG') {
        apiId = event.data.apiId;
        apiHash = event.data.apiHash;
        sessionString = event.data.sessionString;
        initClient();
    }
});

async function initClient() {
    if (client) return;
    client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, {
        connectionRetries: 5,
    });
    await client.connect();
}

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    if (url.pathname.startsWith('/tg-stream/')) {
        event.respondWith(handleStream(event.request));
    }
});

async function handleStream(request) {
    const url = new URL(request.url);
    const messageId = parseInt(url.pathname.split('/').pop());
    const range = request.headers.get('Range');

    if (!client) await initClient();

    // Fetch file metadata first
    const messages = await client.getMessages('me', { ids: [messageId] });
    if (!messages || !messages[0] || !messages[0].media) {
        return new Response('File not found', { status: 404 });
    }

    const media = messages[0].media;
    const document = media.document;
    const fileSize = document.size;

    let start = 0;
    let end = fileSize - 1;

    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        start = parseInt(parts[0], 10);
        end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    }

    const chunkStream = new ReadableStream({
        async start(controller) {
            const chunkSize = 512 * 1024; // 512KB chunks
            let offset = start;

            try {
                while (offset <= end) {
                    const limit = Math.min(chunkSize, end - offset + 1);
                    const buffer = await client.downloadFile(media, {
                        offset: BigInt(offset),
                        limit: limit,
                    });
                    controller.enqueue(new Uint8Array(buffer));
                    offset += limit;
                }
                controller.close();
            } catch (e) {
                console.error('Stream error', e);
                controller.error(e);
            }
        }
    });

    return new Response(chunkStream, {
        status: range ? 206 : 200,
        headers: {
            'Content-Type': 'video/mp4', // Adjust as needed
            'Content-Length': (end - start + 1).toString(),
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
        }
    });
}
