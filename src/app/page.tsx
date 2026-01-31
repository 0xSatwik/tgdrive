'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload, Folder, Download, Trash2, Shield, ChevronRight,
  File, Lock, Pencil, FolderInput, ExternalLink, Video,
  Image as ImageIcon, FileText, Package, Music, Cloud, Zap, Plus, FolderPlus, Home, Play, Search, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions/StringSession';
import { Buffer } from 'buffer';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ThemeToggle from './components/ThemeToggle';

const API_ID = Number(process.env.NEXT_PUBLIC_TELEGRAM_API_ID);
const API_HASH = process.env.NEXT_PUBLIC_TELEGRAM_API_HASH || '';
const SESSION_KEY = 'tg_session_string';
const PEER = process.env.NEXT_PUBLIC_TELEGRAM_PEER || 'me';

const CHUNK_SIZE = 512 * 1024;

interface FileMetadata {
  id: string;
  name: string;
  size: number;
  uploaded_at: string;
  mime_type: string;
  folder_id?: string;
  telegram_id?: string;
}

interface UserFolder {
  id: string;
  name: string;
  parent_id?: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN || '';

export default function Dashboard() {
  const router = useRouter();
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [folders, setFolders] = useState<UserFolder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [totalStorage, setTotalStorage] = useState('0 KB');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  // Telegram States
  const [tgClient, setTgClient] = useState<TelegramClient | null>(null);
  const [isTgAuth, setIsTgAuth] = useState(false);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);
  const [phoneCodeHash, setPhoneCodeHash] = useState('');
  const [tgLoading, setTgLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Management States
  const [editingFile, setEditingFile] = useState<FileMetadata | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [newName, setNewName] = useState('');

  // Remote Upload States
  const [isRemoteUploading, setIsRemoteUploading] = useState(false);
  const [remoteUrl, setRemoteUrl] = useState('');
  const [remoteTitle, setRemoteTitle] = useState('');
  const [remoteFolder, setRemoteFolder] = useState<string | null>(null);

  // UI States
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const breadcrumbs = useMemo(() => {
    const path: UserFolder[] = [];
    let current = folders.find(f => f.id === currentFolder);
    while (current) {
      path.unshift(current);
      current = folders.find(f => f.id === current?.parent_id);
    }
    return path;
  }, [currentFolder, folders]);

  const currentSubfolders = useMemo(() => folders.filter(f => f.parent_id === currentFolder), [currentFolder, folders]);
  const parentFolder = useMemo(() => folders.find(f => f.id === currentFolder)?.parent_id || null, [currentFolder, folders]);

  const fetchFiles = async () => {
    try {
      let url = `${API_URL}/api/files?`;
      if (searchTerm) url += `q=${encodeURIComponent(searchTerm)}&`;
      if (currentFolder) url += `folderId=${currentFolder}&`;
      if (filterType) url += `type=${filterType}&`;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` } });
      if (res.ok) {
        const data = await res.json();
        setFiles(data);
        const totalBytes = data.reduce((acc: number, f: FileMetadata) => acc + (f.size || 0), 0);
        if (totalBytes > 1024 * 1024 * 1024) setTotalStorage(`${(totalBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`);
        else if (totalBytes > 1024 * 1024) setTotalStorage(`${(totalBytes / (1024 * 1024)).toFixed(1)} MB`);
        else setTotalStorage(`${(totalBytes / 1024).toFixed(1)} KB`);
      }
    } catch (e) { console.error(e); }
  };

  const fetchFolders = async () => {
    try {
      const res = await fetch(`${API_URL}/api/folders`, { headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` } });
      if (res.ok) setFolders(await res.json());
    } catch (e) { console.error(e); }
  };

  const createFolder = async () => {
    const name = prompt('Enter folder name:');
    if (!name) return;
    await fetch(`${API_URL}/api/folders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ADMIN_TOKEN}` },
      body: JSON.stringify({ name, parent_id: currentFolder })
    });
    fetchFolders();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this file?')) {
      try {
        const res = await fetch(`${API_URL}/api/files/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
        });
        if (res.ok) fetchFiles();
      } catch (e) { console.error(e); }
    }
  };

  /* Remote Upload Handler */
  const handleRemoteUpload = async () => {
    if (!remoteUrl) return;
    setIsRemoteUploading(false); // Close modal immediately
    try {
      const title = remoteUrl.split('/').pop() || 'remote_file';
      // Call backend or start mock process
      setIsUploading(true);
      setActiveFile(title);
      // ... (existing logic or mock) ...
      // For now, simulate upload
      let p = 0;
      const interval = setInterval(() => {
        p += 10;
        setProgress(p);
        if (p >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          fetchFiles();
        }
      }, 500);
    } catch (e) {
      console.error(e);
      setIsUploading(false);
    }
  };


  const updateFile = async (id: string, updates: { name?: string, folder_id?: string | null }) => {
    try {
      const res = await fetch(`${API_URL}/api/files/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        fetchFiles();
        setIsRenaming(false);
        setIsMoving(false);
        setEditingFile(null);
      }
    } catch (e) {
      console.error('Update failed', e);
      alert('Update failed');
    }
  };

  const handleDeleteFolder = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}" and all contents?`)) return;
    const res = await fetch(`${API_URL}/api/folders/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` } });
    if (res.ok) { fetchFolders(); fetchFiles(); if (currentFolder === id) setCurrentFolder(parentFolder); }
  };

  const navigateToFolder = (id: string | null) => { setCurrentFolder(id); setFilterType(null); };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_TOKEN) { setIsLoggedIn(true); setLoginError(false); }
    else setLoginError(true);
  };

  const disconnectTelegram = async () => {
    if (tgClient) {
      await tgClient.destroy();
      localStorage.removeItem(SESSION_KEY);
      setIsTgAuth(false);
      setTgClient(null);
    }
  };

  useEffect(() => {
    setMounted(true);
    const savedSession = localStorage.getItem(SESSION_KEY);
    initTelegram(savedSession || '');
  }, []);

  const initTelegram = async (sessionString = '') => {
    setTgLoading(true);
    console.log('🏗️ Initializing TelegramClient...');
    try {
      const client = new TelegramClient(new StringSession(sessionString), API_ID, API_HASH, {
        connectionRetries: 10,
        useWSS: true,
        timeout: 30000, // 30 seconds
      });
      console.log('📡 Connecting to Telegram...');
      await client.connect();
      setTgClient(client);
      if (await client.isUserAuthorized()) {
        console.log('✅ Telegram Authorized');
        setIsTgAuth(true);
      } else {
        console.log('🔑 Telegram Not Authorized (Needs Login)');
      }
      return client;
    } catch (e) {
      console.error('❌ TG Init failed', e);
      return null;
    } finally {
      setTgLoading(false);
    }
  };

  const sendCode = async () => {
    let client = tgClient;
    if (!client) {
      client = await initTelegram('');
    }

    if (!client) {
      alert('Failed to initialize Telegram client. Please check your API_ID and API_HASH in .env');
      return;
    }

    setTgLoading(true);
    console.log('✉️ Requesting code for:', phone);
    try {
      const { phoneCodeHash } = await client.sendCode({ apiId: API_ID, apiHash: API_HASH }, phone);
      console.log('📬 Code hash received:', phoneCodeHash);
      setPhoneCodeHash(phoneCodeHash);
      setPhoneCodeSent(true);
    } catch (e) {
      console.error('❌ Send code failed', e);
      alert('Failed to send code: ' + (e as any).message);
    } finally {
      setTgLoading(false);
    }
  };

  const signIn = async () => {
    if (!tgClient || !phoneCodeHash) return;
    setTgLoading(true);
    console.log('🔑 Authenticating with code...');
    try {
      await tgClient.invoke(
        new Api.auth.SignIn({
          phoneNumber: phone,
          phoneCodeHash: phoneCodeHash,
          phoneCode: code,
        })
      );
      console.log('✅ Authentication Successful!');
      setIsTgAuth(true);
      localStorage.setItem(SESSION_KEY, (tgClient.session as any).save());
    } catch (e) {
      console.error('❌ Sign in failed', e);
      alert('Sign in failed: ' + (e as any).message);
    } finally {
      setTgLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    window.location.reload();
  };

  const [activeVideo, setActiveVideo] = useState<FileMetadata | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);

  const watchVideo = (file: FileMetadata) => {
    if (!file.telegram_id) return;
    // Navigate to the new YouTube-style watch page
    const params = new URLSearchParams({
      id: file.telegram_id,
      peer: PEER,
      name: file.name
    });
    router.push(`/watch?${params.toString()}`);
  };

  const downloadFile = async (file: FileMetadata) => {
    if (!tgClient || !file.telegram_id) return;
    setIsDownloading(true);
    setProgress(0);
    setActiveFile(file.name);
    console.log(`📥 Downloading ${file.name} from ${PEER}...`);
    try {
      console.log('🔍 Looking for message info...');
      const messages = await tgClient.getMessages(PEER, { ids: [Number(file.telegram_id)] });

      if (!messages || messages.length === 0) {
        throw new Error('Message not found in the search peer.');
      }

      const message = messages[0];
      if (message && message.media) {
        console.log('✅ Media found, starting binary download...');
        const buffer = await tgClient.downloadFile(message.media as any, {
          progressCallback: (p: number) => setProgress(Math.round(p * 100))
        } as any);

        if (buffer) {
          console.log('💾 File downloaded to memory, triggering browser save...');
          const blob = new Blob([buffer] as any, { type: file.mime_type });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = file.name;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }, 100);
          console.log('✨ Download process finished!');
        }
      } else {
        throw new Error('Message found but contains no media.');
      }
    } catch (e) {
      console.error('❌ Download failed', e);
      alert('Download failed: ' + (e as any).message);
    } finally {
      setIsDownloading(false);
      setProgress(0);
    }
  };

  const closeVideo = () => {
    if (videoSrc) URL.revokeObjectURL(videoSrc);
    setActiveVideo(null);
    setVideoSrc(null);
  };

  useEffect(() => {
    if (isLoggedIn) { fetchFiles(); fetchFolders(); }
    if (!ADMIN_TOKEN) setIsLoggedIn(true);
  }, [isLoggedIn, searchTerm, currentFolder, filterType]);

  const getMimeFromExtension = (filename: string, originalMime: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const videoExts = ['mkv', 'mp4', 'webm', 'avi', 'mov', 'wmv', 'flv', 'm4v'];
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
    const audioExts = ['mp3', 'wav', 'ogg', 'm4a', 'flac'];
    const docExts = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'];
    const zipExts = ['zip', 'rar', '7z', 'tar', 'gz'];

    if (videoExts.includes(ext || '')) return 'video/' + (ext === 'mkv' ? 'x-matroska' : ext);
    if (imageExts.includes(ext || '')) return 'image/' + ext;
    if (audioExts.includes(ext || '')) return 'audio/' + ext;
    if (ext === 'pdf') return 'application/pdf';
    if (zipExts.includes(ext || '')) return 'application/zip';

    return originalMime || 'application/octet-stream';
  };

  const uploadFile = async (file: File) => {
    if (!isTgAuth || !tgClient) {
      alert('Please connect Telegram first!');
      return;
    }

    setIsUploading(true); setProgress(0); setActiveFile(file.name);

    try {
      // Direct MTProto Upload
      const toPeer = PEER;

      console.log(`📤 Starting upload to Telegram (${toPeer})...`);
      const uploadedFile = await tgClient.uploadFile({
        file: file,
        workers: 4,
        onProgress: (p) => setProgress(Math.round(p * 100))
      });

      console.log('✅ Upload complete, sending message...');
      const res = await tgClient.sendFile(toPeer, {
        file: uploadedFile,
        forceDocument: true,
      }) as any;

      // Backend expects the telegram message ID
      const mimeType = getMimeFromExtension(file.name, file.type);

      await fetch(`${API_URL}/api/upload/finalize`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ADMIN_TOKEN}` },
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          mime_type: mimeType,
          folder_id: currentFolder,
          telegram_id: res.id.toString()
        })
      });
      fetchFiles();
    } catch (e) {
      console.error('Upload failed', e);
      alert('Upload failed: ' + (e as any).message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { uploadFile(file); e.target.value = ''; }
  };

  const getIconClass = (mime: string, filename?: string) => {
    let typeMime = mime;
    if ((!mime || mime === 'application/octet-stream') && filename) {
      typeMime = getMimeFromExtension(filename, mime);
    }

    if (typeMime?.startsWith('video/')) return 'icon-video';
    if (typeMime?.startsWith('image/')) return 'icon-image';
    if (typeMime?.includes('pdf') || typeMime?.includes('document')) return 'icon-document';
    if (typeMime?.includes('zip') || typeMime?.includes('archive')) return 'icon-archive';
    if (typeMime?.startsWith('audio/')) return 'icon-audio';
    return 'icon-default';
  };

  const getIcon = (mime: string, filename?: string) => {
    let typeMime = mime;
    if ((!mime || mime === 'application/octet-stream') && filename) {
      typeMime = getMimeFromExtension(filename, mime);
    }

    if (typeMime?.startsWith('video/')) return <Video className="text-white" size={20} />;
    if (typeMime?.startsWith('image/')) return <ImageIcon className="text-white" size={20} />;
    if (typeMime?.includes('pdf') || typeMime?.includes('document')) return <FileText className="text-white" size={20} />;
    if (typeMime?.includes('zip') || typeMime?.includes('archive')) return <Package className="text-white" size={20} />;
    if (typeMime?.startsWith('audio/')) return <Music className="text-white" size={20} />;
    return <File className="text-white" size={20} />;
  };

  const formatSize = (bytes: number) => {
    if (bytes > 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const getTelegramLink = (file: FileMetadata) => {
    if (!PEER || !file.telegram_id) return '#';
    if (PEER === 'me') return 'tg://msg?number=' + file.telegram_id;
    if (PEER.startsWith('@')) return `https://t.me/${PEER.substring(1)}/${file.telegram_id}`;
    if (PEER.startsWith('-100')) return `https://t.me/c/${PEER.substring(4)}/${file.telegram_id}`;
    return `https://t.me/${PEER}/${file.telegram_id}`;
  };

  if (!mounted) return null;

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="glass-card p-10">
            <div className="text-center mb-10">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                <Lock className="text-white" size={36} />
              </div>
              <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
              <p className="text-gray-400">Enter your access token to continue</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-5">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Access Token" className={`input-field ${loginError ? 'border-red-500' : ''}`} />
              {loginError && <p className="text-red-400 text-sm">Invalid token</p>}
              <button type="submit" className="btn-primary w-full"><Shield size={18} /> Unlock Drive</button>
            </form>
            <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-3 gap-4 text-center">
              {[{ icon: Cloud, label: 'Unlimited' }, { icon: Lock, label: 'Encrypted' }, { icon: Zap, label: 'Fast' }].map((item, i) => (
                <div key={i} className="text-gray-500"><item.icon size={20} className="mx-auto mb-1 text-gray-600" /><span className="text-xs font-medium">{item.label}</span></div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Telegram Connection Screen
  if (!isTgAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#0a0a0c]">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg">
          <div className="glass-card p-12 border border-white/10 relative overflow-hidden">
            {/* Animated background element */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>

            <div className="text-center mb-10">
              <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/20">
                <Zap className="text-white" size={36} fill="white" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight mb-3 text-white">Connect Telegram</h2>
              <p className="text-gray-400 text-lg">Direct connect for 2GB+ uploads</p>
            </div>

            <div className="space-y-6">
              {!phoneCodeSent ? (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400 ml-1">Phone Number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1234567890"
                      className="input-field !py-4 text-lg tracking-wider"
                    />
                  </div>
                  <button
                    onClick={sendCode}
                    disabled={tgLoading}
                    className="btn-primary w-full !py-4 text-lg font-bold group"
                  >
                    {tgLoading ? 'Sending...' : 'Send Verification Code'}
                    <ChevronRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400 ml-1">Verification Code</label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Enter 5-digit code"
                      className="input-field !py-4 text-center text-3xl font-mono tracking-[0.5em]"
                      maxLength={5}
                    />
                  </div>
                  <button
                    onClick={signIn}
                    disabled={tgLoading}
                    className="btn-primary w-full !py-4 text-lg font-bold"
                  >
                    {tgLoading ? 'Authenticating...' : 'Connect Now'}
                  </button>
                  <button
                    onClick={() => setPhoneCodeSent(false)}
                    className="w-full text-sm text-gray-500 hover:text-white transition-colors py-2"
                  >
                    Change Phone Number
                  </button>
                </div>
              )}
            </div>

            <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-center gap-6 text-gray-500">
              <div className="flex items-center gap-2"><Lock size={14} /> <span className="text-xs uppercase tracking-widest font-semibold text-gray-600">Secure Direct Link</span></div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const navItems = [
    { icon: Folder, label: 'All Files', type: null },
    { icon: Video, label: 'Videos', type: 'video' },
    { icon: ImageIcon, label: 'Images', type: 'image' },
    { icon: FileText, label: 'Documents', type: 'application' },
    { icon: Package, label: 'Archives', type: 'zip' },
  ];

  // Flexbox Shell Layout
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">

      {/* 1. Sidebar (Fixed Width) */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onUpload={handleFileChange}
        onCreateFolder={createFolder}
        onRemoteUpload={() => setIsRemoteUploading(true)}
        storageUsed={totalStorage}
        onLogout={handleLogout}
        onNavigate={(type) => {
          setFilterType(type);
          setCurrentFolder(null);
          setSidebarOpen(false);
        }}
        currentFilter={filterType}
        onStreamUrl={() => router.push('/watch')}
      />

      {/* 2. Main Content Wrapper (Flex via Column) */}
      <div className="flex-1 flex flex-col min-w-0 h-screen transition-all duration-300">

        {/* 2.1 Header (Fixed Height) */}
        <Header
          onMenuToggle={() => setSidebarOpen(true)}
          searchTerm={searchTerm}
          onSearchChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* 2.2 Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 lg:p-10 scrollbar-hide">
          <div className="max-w-7xl mx-auto space-y-10">

            {/* Breadcrumbs & Title Section */}
            <div>
              <nav className="flex items-center gap-2 text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                <button
                  onClick={() => navigateToFolder(null)}
                  className={`hover:text-[var(--accent)] transition-colors ${!currentFolder ? 'text-[var(--text-primary)]' : ''}`}
                >
                  My Drive
                </button>
                {breadcrumbs.map((folder) => (
                  <div key={folder.id} className="flex items-center gap-2">
                    <ChevronRight size={14} className="opacity-50" />
                    <button
                      onClick={() => navigateToFolder(folder.id)}
                      className="hover:text-[var(--accent)] transition-colors"
                    >
                      {folder.name}
                    </button>
                  </div>
                ))}
              </nav>

              <div className="flex items-end justify-between">
                <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  {currentFolder ? folders.find(f => f.id === currentFolder)?.name :
                    filterType ? (filterType.charAt(0).toUpperCase() + filterType.slice(1) + 's') :
                      'All Files'}
                </h2>
                <span className="text-xs font-medium px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)]" style={{ color: 'var(--text-secondary)' }}>
                  {files.length} items
                </span>
              </div>
            </div>

            {/* Content Grids */}
            {/* Page Header - Clean & Attractive */}
            <div className="glass-card p-6 sm:p-8">
              {/* Breadcrumbs */}
              <div className="flex items-center gap-1.5 flex-wrap mb-4 text-sm">
                <button
                  onClick={() => navigateToFolder(null)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${!currentFolder ? 'text-indigo-400 font-medium' : 'hover:bg-white/5'}`}
                  style={{ color: !currentFolder ? 'var(--accent)' : 'var(--text-muted)' }}
                >
                  <Home size={14} /> My Drive
                </button>
                {breadcrumbs.map((folder, i) => (
                  <span key={folder.id} className="flex items-center gap-1.5">
                    <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />
                    <button
                      onClick={() => navigateToFolder(folder.id)}
                      className={`px-2.5 py-1 rounded-md transition-all ${i === breadcrumbs.length - 1 ? 'font-medium' : 'hover:bg-white/5'}`}
                      style={{ color: i === breadcrumbs.length - 1 ? 'var(--accent)' : 'var(--text-muted)' }}
                    >
                      {folder.name}
                    </button>
                  </span>
                ))}
              </div>

              {/* Title & Search Row */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-center gap-4">
                  {currentFolder && (
                    <button
                      onClick={() => navigateToFolder(parentFolder)}
                      className="p-2 rounded-lg transition-all"
                      style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                    >
                      <ArrowLeft size={18} />
                    </button>
                  )}
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {currentFolder ? folders.find(f => f.id === currentFolder)?.name : 'My Drive'}
                    </h2>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {currentSubfolders.length} {currentSubfolders.length === 1 ? 'folder' : 'folders'} · {files.length} {files.length === 1 ? 'file' : 'files'}
                    </p>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2" size={18} style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-field !pl-12 !py-3 !text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Progress Indicators (Upload & Download) */}
            <AnimatePresence>
              {(isUploading || isDownloading) && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass-card p-5">
                  <div className="flex items-center gap-4 mb-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${isUploading ? 'from-indigo-500 to-purple-600' : 'from-emerald-500 to-teal-600'} flex items-center justify-center animate-pulse`}>
                      {isUploading ? <Upload className="text-white" size={22} /> : <Download className="text-white" size={22} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{activeFile}</p>
                      <p className="text-sm text-gray-400">{isUploading ? 'Uploading to Telegram...' : 'Downloading to Browser...'}</p>
                    </div>
                    <span className={`text-2xl font-bold ${isUploading ? 'text-indigo-400' : 'text-emerald-400'}`}>{progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <motion.div
                      className={`progress-fill ${isDownloading ? '!bg-emerald-500 !shadow-emerald-500/30' : ''}`}
                      animate={{ width: `${progress}%` }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Folders Grid */}
            {currentSubfolders.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Folders</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {currentSubfolders.map((folder, i) => (
                    <motion.div key={folder.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="file-card p-4 group relative">
                      <button onClick={() => navigateToFolder(folder.id)} className="flex items-center gap-3 w-full text-left">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Folder className="text-amber-400" size={20} />
                        </div>
                        <span className="font-medium truncate flex-1 text-sm group-hover:text-indigo-400 transition-colors" style={{ color: 'var(--text-primary)' }}>{folder.name}</span>
                      </button>
                      <button onClick={() => handleDeleteFolder(folder.id, folder.name)} className="absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                        <Trash2 size={14} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Files Grid */}
            {files.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Files</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {files.map((file, i) => (
                    <motion.div key={file.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="file-card p-5 group">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getIconClass(file.mime_type, file.name)}`}>
                          {getIcon(file.mime_type, file.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate group-hover:text-indigo-400 transition-colors" title={file.name}>{file.name}</h3>
                          <p className="text-sm text-gray-500">{formatSize(Number(file.size))}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/5">
                        <div className="flex gap-1.5">
                          {file.mime_type.startsWith('video/') && (
                            <button onClick={() => watchVideo(file)} className="action-btn text-indigo-400 border-indigo-500/10 hover:bg-indigo-500/5" title="Watch Preview">
                              <Video size={14} />
                            </button>
                          )}
                          <button onClick={() => downloadFile(file)} className="action-btn text-emerald-400 border-emerald-500/10 hover:bg-emerald-500/5" title="Download Full File"><Download size={14} /></button>
                          <button onClick={() => { setEditingFile(file); setNewName(file.name); setIsRenaming(true); }} className="action-btn text-amber-400 border-amber-500/10 hover:bg-amber-500/5" title="Rename"><Pencil size={14} /></button>
                          <button onClick={() => { setEditingFile(file); setIsMoving(true); }} className="action-btn text-purple-400 border-purple-500/10 hover:bg-purple-500/5" title="Move to Folder"><FolderInput size={14} /></button>
                          <button onClick={() => window.open(getTelegramLink(file), '_blank')} className="action-btn text-blue-400 border-blue-500/10 hover:bg-blue-500/5" title="Open in Telegram"><ExternalLink size={14} /></button>
                          <button onClick={() => handleDelete(file.id)} className="action-btn text-red-400 border-red-500/10 hover:bg-red-500/5" title="Delete"><Trash2 size={14} /></button>
                        </div>
                        <span className="text-[10px] text-gray-600 font-mono tracking-wider">{new Date(file.uploaded_at).toLocaleDateString()}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {currentSubfolders.length === 0 && files.length === 0 && !isUploading && (
              <div className="text-center py-20 px-10 rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02]">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <Folder className="text-gray-600" size={36} />
                </div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">This folder is empty</h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">Upload files or create subfolders to organize your unlimited cloud storage.</p>
                <div className="flex items-center justify-center gap-4">
                  <label className="btn-primary cursor-pointer"><Plus size={18} /> Upload<input type="file" className="hidden" onChange={handleFileChange} /></label>
                  <button onClick={createFolder} className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-medium border border-white/10 flex items-center gap-2 transition-all">
                    <FolderPlus size={18} /> New Folder
                  </button>
                </div>
              </div>
            )}





            {/* Rename Modal */}
            <AnimatePresence>
              {
                isRenaming && editingFile && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 pb-24">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsRenaming(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card p-10 w-full max-w-md relative z-10 border border-white/10">
                      <h3 className="text-2xl font-bold mb-6 flex items-center gap-3"><Pencil className="text-amber-400" size={24} /> Rename File</h3>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-400 ml-1">New Name</label>
                          <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="input-field !py-4"
                            autoFocus
                          />
                        </div>
                        <div className="flex gap-4">
                          <button onClick={() => setIsRenaming(false)} className="flex-1 py-4 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-medium border border-white/10 transition-all">Cancel</button>
                          <button onClick={() => updateFile(editingFile.id, { name: newName })} className="flex-1 btn-primary">Save Changes</button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )
              }
            </AnimatePresence >





            {/* Rename Modal */}
            <AnimatePresence>
              {
                isRenaming && editingFile && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 pb-24">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsRenaming(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card p-10 w-full max-w-md relative z-10 border border-white/10">
                      <h3 className="text-2xl font-bold mb-6 flex items-center gap-3"><Pencil className="text-amber-400" size={24} /> Rename File</h3>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-400 ml-1">New Name</label>
                          <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="input-field !py-4" autoFocus />
                        </div>
                        <div className="flex gap-4">
                          <button onClick={() => setIsRenaming(false)} className="flex-1 py-4 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-medium border border-white/10 transition-all">Cancel</button>
                          <button onClick={() => updateFile(editingFile.id, { name: newName })} className="flex-1 btn-primary">Save Changes</button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )
              }
            </AnimatePresence >

            {/* Remote Upload Modal */}
            <AnimatePresence>
              {
                isRemoteUploading && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 pb-24">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsRemoteUploading(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card p-10 w-full max-w-md relative z-10 border border-white/10">
                      <h3 className="text-2xl font-bold mb-6 flex items-center gap-3"><Cloud className="text-blue-400" size={24} /> Remote Upload</h3>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-400 ml-1">File URL</label>
                          <input type="text" value={remoteUrl} onChange={(e) => setRemoteUrl(e.target.value)} placeholder="https://example.com/file.mp4" className="input-field !py-4" autoFocus />
                        </div>
                        <div className="flex gap-4">
                          <button onClick={() => setIsRemoteUploading(false)} className="flex-1 py-4 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-medium border border-white/10 transition-all">Cancel</button>
                          <button onClick={handleRemoteUpload} className="flex-1 btn-primary" disabled={!remoteUrl}>Upload</button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )
              }
            </AnimatePresence >

            {/* Move File Modal */}
            <AnimatePresence>
              {
                isMoving && editingFile && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMoving(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card p-8 w-full max-w-lg relative z-10 border border-white/10 flex flex-col max-h-[80vh]">
                      <h3 className="text-xl font-bold mb-6 flex items-center gap-3" style={{ color: 'white' }}><FolderInput className="text-indigo-400" size={24} /> Move File</h3>
                      <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        <button onClick={() => updateFile(editingFile.id, { folder_id: null })} className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${editingFile.folder_id === null ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 select-none'}`}>
                          <Home size={20} /> <span className="font-medium">My Drive (Root)</span>
                        </button>
                        {folders.map(folder => (
                          <button key={folder.id} onClick={() => updateFile(editingFile.id, { folder_id: folder.id })} className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${editingFile.folder_id === folder.id ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}>
                            <Folder size={20} className={editingFile.folder_id === folder.id ? 'text-indigo-400' : 'text-amber-400'} /> <span className="font-medium">{folder.name}</span>
                          </button>
                        ))}
                      </div>
                      <button onClick={() => setIsMoving(false)} className="mt-6 w-full py-3 text-gray-400 hover:text-white transition-colors text-sm">Cancel</button>
                    </motion.div>
                  </div>
                )
              }
            </AnimatePresence>
          </div>
        </main>

        {/* Global Bottom Progress */}
        <AnimatePresence>
          {
            (isUploading || isDownloading) && (
              <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed bottom-10 right-10 z-[60] w-full max-w-sm">
                <div className={`glass-card p-4 mx-4 ${isUploading ? '!bg-indigo-600 shadow-indigo-500/40' : '!bg-emerald-600 shadow-emerald-500/40'} shadow-2xl`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center animate-pulse">
                        {isUploading ? <Upload size={16} className="text-white" /> : <Download size={16} className="text-white" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white text-sm font-bold truncate max-w-[180px]">{isUploading ? 'Uploading...' : 'Downloading...'}</span>
                        <span className="text-white/70 text-xs truncate max-w-[180px]">{activeFile}</span>
                      </div>
                    </div>
                    <span className="text-white font-black">{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-black/20 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            )
          }
        </AnimatePresence>
      </div>
    </div>
  );
}
