'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload, Folder, Download, Trash2, Shield, ChevronRight,
  File, Lock, Pencil, FolderInput, ExternalLink, Video,
  Image as ImageIcon, FileText, Package, Music, Cloud, Zap, Plus,
  FolderPlus, Home, Play, Search, ArrowLeft, X, Check, Link,
  MoreVertical, Grid, List, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions/StringSession';
import { Buffer } from 'buffer';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import { encryptSession, decryptSession } from '../utils/crypto';

const API_ID = Number(process.env.NEXT_PUBLIC_TELEGRAM_API_ID);
const API_HASH = process.env.NEXT_PUBLIC_TELEGRAM_API_HASH || '';
const SESSION_KEY = 'tg_session_string';
const PEER = process.env.NEXT_PUBLIC_TELEGRAM_PEER || 'me';

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

  // Data States
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [folders, setFolders] = useState<UserFolder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Upload/Download States
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [totalStorage, setTotalStorage] = useState('0 KB');

  // Auth States
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
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  // Remote Upload States
  const [isRemoteUploading, setIsRemoteUploading] = useState(false);
  const [remoteUrl, setRemoteUrl] = useState('');
  const [remoteTitle, setRemoteTitle] = useState('');

  // UI States
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // Breadcrumbs
  const breadcrumbs = useMemo(() => {
    const path: UserFolder[] = [];
    let current = folders.find(f => f.id === currentFolder);
    while (current) {
      path.unshift(current);
      current = folders.find(f => f.id === current?.parent_id);
    }
    return path;
  }, [currentFolder, folders]);

  const currentSubfolders = useMemo(() =>
    folders.filter(f => f.parent_id === currentFolder),
    [currentFolder, folders]
  );

  const parentFolder = useMemo(() =>
    folders.find(f => f.id === currentFolder)?.parent_id || null,
    [currentFolder, folders]
  );

  // Data Fetching
  const fetchFiles = async () => {
    try {
      let url = `${API_URL}/api/files?`;
      if (searchTerm) url += `q=${encodeURIComponent(searchTerm)}&`;
      if (currentFolder) url += `folderId=${currentFolder}&`;
      if (filterType) url += `type=${filterType}&`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
      });

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
      const res = await fetch(`${API_URL}/api/folders`, {
        headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
      });
      if (res.ok) setFolders(await res.json());
    } catch (e) { console.error(e); }
  };

  // Folder Actions
  const createFolder = async () => {
    const name = prompt('Enter folder name:');
    if (!name) return;
    await fetch(`${API_URL}/api/folders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      },
      body: JSON.stringify({ name, parent_id: currentFolder })
    });
    fetchFolders();
  };

  const handleDeleteFolder = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}" and all contents?`)) return;
    const res = await fetch(`${API_URL}/api/folders/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });
    if (res.ok) {
      fetchFolders();
      fetchFiles();
      if (currentFolder === id) setCurrentFolder(parentFolder);
    }
  };

  // File Actions
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

  // Remote Upload
  const handleRemoteUpload = async () => {
    if (!remoteUrl) return;
    setIsRemoteUploading(false);
    try {
      const title = remoteTitle || remoteUrl.split('/').pop() || 'remote_file';
      setIsUploading(true);
      setActiveFile(title);
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

  // Navigation
  const navigateToFolder = (id: string | null) => {
    setCurrentFolder(id);
    setFilterType(null);
    setSelectedFiles(new Set());
  };

  // Authentication
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_TOKEN) {
      setIsLoggedIn(true);
      setLoginError(false);

      // 🔄 Session Sync: Attempt to fetch and decrypt session from Cloudflare D1
      fetch(`${API_URL}/api/settings/tg_session`, {
        headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
      }).then(res => res.json()).then(async (data) => {
        if (data.value) {
          console.log('🔐 Encrypted session found in cloud, decrypting...');
          const decrypted = await decryptSession(data.value, ADMIN_TOKEN);
          if (decrypted) {
            console.log('✅ Session decrypted and restored!');
            localStorage.setItem(SESSION_KEY, decrypted);
            await initTelegram(decrypted);
          } else {
            console.error('❌ Failed to decrypt session');
          }
        }
      }).catch(e => console.error('Silent session sync failed', e));

    }
    else setLoginError(true);
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    window.location.reload();
  };

  // Telegram Auth
  useEffect(() => {
    setMounted(true);
    const savedSession = localStorage.getItem(SESSION_KEY);
    initTelegram(savedSession || '');
  }, []);

  const initTelegram = async (sessionString = '') => {
    setTgLoading(true);
    try {
      const client = new TelegramClient(
        new StringSession(sessionString),
        API_ID,
        API_HASH,
        {
          connectionRetries: 10,
          useWSS: true,
          timeout: 30000,
        }
      );
      await client.connect();
      setTgClient(client);
      if (await client.isUserAuthorized()) {
        setIsTgAuth(true);
      }
      return client;
    } catch (e) {
      console.error('TG Init failed', e);
      return null;
    } finally {
      setTgLoading(false);
    }
  };

  const sendCode = async () => {
    let client = tgClient;
    if (!client) client = await initTelegram('');
    if (!client) {
      alert('Failed to initialize Telegram client');
      return;
    }
    setTgLoading(true);
    try {
      const { phoneCodeHash } = await client.sendCode(
        { apiId: API_ID, apiHash: API_HASH },
        phone
      );
      setPhoneCodeHash(phoneCodeHash);
      setPhoneCodeSent(true);
    } catch (e) {
      console.error('Send code failed', e);
      alert('Failed to send code: ' + (e as any).message);
    } finally {
      setTgLoading(false);
    }
  };

  const signIn = async () => {
    if (!tgClient || !phoneCodeHash) return;
    setTgLoading(true);
    try {
      await tgClient.invoke(
        new Api.auth.SignIn({
          phoneNumber: phone,
          phoneCodeHash: phoneCodeHash,
          phoneCode: code,
        })
      );
      setIsTgAuth(true);
      const sessionStr = (tgClient.session as any).save();
      localStorage.setItem(SESSION_KEY, sessionStr);

      // 🔒 Encrypt and Backup Session to Cloudflare
      encryptSession(sessionStr, ADMIN_TOKEN).then(encrypted => {
        fetch(`${API_URL}/api/settings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ADMIN_TOKEN}`
          },
          body: JSON.stringify({ key: 'tg_session', value: encrypted })
        });
        console.log('☁️ Session encrypted and backed up to cloud!');
      });
    } catch (e) {
      console.error('Sign in failed', e);
      alert('Sign in failed: ' + (e as any).message);
    } finally {
      setTgLoading(false);
    }
  };

  // File Operations
  const watchVideo = (file: FileMetadata) => {
    if (!file.telegram_id) return;
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
    try {
      const messages = await tgClient.getMessages(PEER, {
        ids: [Number(file.telegram_id)]
      });
      if (!messages || messages.length === 0) {
        throw new Error('Message not found');
      }
      const message = messages[0];
      if (message && message.media) {
        const buffer = await tgClient.downloadFile(message.media as any, {
          progressCallback: (p: number) => setProgress(Math.round(p * 100))
        } as any);
        if (buffer) {
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
        }
      }
    } catch (e) {
      console.error('Download failed', e);
      alert('Download failed: ' + (e as any).message);
    } finally {
      setIsDownloading(false);
      setProgress(0);
    }
  };

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
    setIsUploading(true);
    setProgress(0);
    setActiveFile(file.name);
    try {
      const uploadedFile = await tgClient.uploadFile({
        file: file,
        workers: 4,
        onProgress: (p) => setProgress(Math.round(p * 100))
      });
      const res = await tgClient.sendFile(PEER, {
        file: uploadedFile,
        forceDocument: true,
      }) as any;
      const mimeType = getMimeFromExtension(file.name, file.type);
      await fetch(`${API_URL}/api/upload/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        },
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
    if (file) {
      uploadFile(file);
      e.target.value = '';
    }
  };

  // Helpers
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

  const getFileTypeLabel = (mime: string, filename?: string) => {
    let typeMime = mime;
    if ((!mime || mime === 'application/octet-stream') && filename) {
      typeMime = getMimeFromExtension(filename, mime);
    }
    if (typeMime?.startsWith('video/')) return 'Video';
    if (typeMime?.startsWith('image/')) return 'Image';
    if (typeMime?.includes('pdf')) return 'PDF';
    if (typeMime?.includes('document')) return 'Document';
    if (typeMime?.includes('zip') || typeMime?.includes('archive')) return 'Archive';
    if (typeMime?.startsWith('audio/')) return 'Audio';
    return 'File';
  };

  useEffect(() => {
    if (isLoggedIn) { fetchFiles(); fetchFolders(); }
    if (!ADMIN_TOKEN) setIsLoggedIn(true);
  }, [isLoggedIn, searchTerm, currentFolder, filterType]);

  if (!mounted) return null;

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="login-card"
        >
          <motion.div
            className="login-logo"
            animate={{
              boxShadow: [
                '0 8px 32px rgba(99, 102, 241, 0.4)',
                '0 12px 48px rgba(168, 85, 247, 0.5)',
                '0 8px 32px rgba(99, 102, 241, 0.4)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Lock className="text-white" size={32} />
          </motion.div>

          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Welcome Back
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>
              Enter your access token to continue
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Access Token"
                className="input-field"
                style={{
                  borderColor: loginError ? 'var(--danger)' : 'var(--border)'
                }}
              />
              {loginError && (
                <p className="text-sm mt-2" style={{ color: 'var(--danger)' }}>
                  Invalid token
                </p>
              )}
            </div>
            <button type="submit" className="btn-primary w-full">
              <Shield size={18} />
              Unlock Drive
            </button>
          </form>

          <div className="mt-8 pt-6 border-t grid grid-cols-3 gap-4 text-center" style={{ borderColor: 'var(--border)' }}>
            {[
              { icon: Cloud, label: 'Unlimited' },
              { icon: Lock, label: 'Secure' },
              { icon: Zap, label: 'Fast' }
            ].map((item, i) => (
              <div key={i} style={{ color: 'var(--text-muted)' }}>
                <item.icon size={20} className="mx-auto mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // Telegram Auth Screen
  if (!isTgAuth) {
    return (
      <div className="login-container">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="login-card"
        >
          <div className="text-center mb-8">
            <motion.div
              className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--accent-gradient)' }}
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Zap className="text-white" size={36} fill="white" />
            </motion.div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Connect Telegram
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Direct connection for 2GB+ uploads
            </p>
          </div>

          <div className="space-y-5">
            {!phoneCodeSent ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium ml-1 mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1234567890"
                    className="input-field"
                  />
                </div>
                <button
                  onClick={sendCode}
                  disabled={tgLoading}
                  className="btn-primary w-full"
                >
                  {tgLoading ? 'Sending...' : 'Send Code'}
                  <ChevronRight size={18} className="ml-1" />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium ml-1 mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter code"
                    className="input-field text-center text-2xl tracking-[0.3em]"
                    maxLength={5}
                  />
                </div>
                <button
                  onClick={signIn}
                  disabled={tgLoading}
                  className="btn-primary w-full"
                >
                  {tgLoading ? 'Authenticating...' : 'Connect Now'}
                </button>
                <button
                  onClick={() => setPhoneCodeSent(false)}
                  className="w-full text-sm py-2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Change Phone Number
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Desktop Sidebar - Always visible on lg screens with proper spacing */}
      <div className="hidden lg:block flex-shrink-0 h-full" style={{ background: 'var(--bg-secondary)' }}>
        <div className="h-full overflow-hidden">
          <Sidebar
            isOpen={true}
            onClose={() => { }}
            onUpload={handleFileChange}
            onCreateFolder={createFolder}
            onRemoteUpload={() => setIsRemoteUploading(true)}
            storageUsed={totalStorage}
            onLogout={handleLogout}
            onNavigate={(type) => {
              setFilterType(type);
              setCurrentFolder(null);
            }}
            currentFilter={filterType}
            onStreamUrl={() => router.push('/watch')}
          />
        </div>
      </div>

      {/* Mobile Sidebar - Slide in from left */}
      <div className="lg:hidden">
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
      </div>

      {/* Main Content with proper margins */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden ml-0 lg:ml-4">
        {/* Header */}
        <Header
          onMenuToggle={() => setSidebarOpen(true)}
          searchTerm={searchTerm}
          onSearchChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Mobile Search Overlay */}
        <AnimatePresence>
          {showMobileSearch && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="sm:hidden px-4 py-3 border-b"
              style={{
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border)'
              }}
            >
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  size={18}
                  style={{ color: 'var(--text-muted)' }}
                />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-11 pl-10 pr-10 rounded-xl text-sm"
                  style={{
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)'
                  }}
                  autoFocus
                />
                <button
                  onClick={() => {
                    setShowMobileSearch(false);
                    setSearchTerm('');
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 xl:p-10 scrollbar-hide">
          <div className="max-w-7xl mx-auto space-y-8">

            {/* Breadcrumbs & Header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-4 sm:p-6"
            >
              {/* Breadcrumbs */}
              <div className="flex items-center gap-1.5 flex-wrap mb-4 text-sm">
                <button
                  onClick={() => navigateToFolder(null)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all hover:bg-white/5"
                  style={{
                    color: !currentFolder ? 'var(--accent)' : 'var(--text-muted)',
                    fontWeight: !currentFolder ? 600 : 400
                  }}
                >
                  <Home size={14} />
                  My Drive
                </button>
                {breadcrumbs.map((folder, i) => (
                  <span key={folder.id} className="flex items-center gap-1.5">
                    <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                    <button
                      onClick={() => navigateToFolder(folder.id)}
                      className="px-2.5 py-1.5 rounded-lg transition-all hover:bg-white/5"
                      style={{
                        color: i === breadcrumbs.length - 1 ? 'var(--accent)' : 'var(--text-muted)',
                        fontWeight: i === breadcrumbs.length - 1 ? 600 : 400
                      }}
                    >
                      {folder.name}
                    </button>
                  </span>
                ))}
              </div>

              {/* Title Row */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-center gap-3">
                  {currentFolder && (
                    <button
                      onClick={() => navigateToFolder(parentFolder)}
                      className="p-2.5 rounded-xl transition-all hover:scale-105 active:scale-95"
                      style={{
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      <ArrowLeft size={18} />
                    </button>
                  )}
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {currentFolder
                        ? folders.find(f => f.id === currentFolder)?.name
                        : filterType
                          ? filterType.charAt(0).toUpperCase() + filterType.slice(1) + 's'
                          : 'My Drive'
                      }
                    </h2>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {currentSubfolders.length} {currentSubfolders.length === 1 ? 'folder' : 'folders'} · {files.length} {files.length === 1 ? 'file' : 'files'}
                    </p>
                  </div>
                </div>

                {/* View Toggle & Filter */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center p-1 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
                    <button
                      onClick={() => setViewMode('grid')}
                      className="p-2 rounded-lg transition-all"
                      style={{
                        background: viewMode === 'grid' ? 'var(--surface)' : 'transparent',
                        color: viewMode === 'grid' ? 'var(--accent)' : 'var(--text-muted)'
                      }}
                    >
                      <Grid size={18} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className="p-2 rounded-lg transition-all"
                      style={{
                        background: viewMode === 'list' ? 'var(--surface)' : 'transparent',
                        color: viewMode === 'list' ? 'var(--accent)' : 'var(--text-muted)'
                      }}
                    >
                      <List size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Progress Indicators */}
            <AnimatePresence>
              {(isUploading || isDownloading) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="glass-card p-5"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center animate-pulse"
                      style={{
                        background: isUploading
                          ? 'linear-gradient(135deg, #6366f1, #a855f7)'
                          : 'linear-gradient(135deg, #22c55e, #10b981)'
                      }}
                    >
                      {isUploading ? <Upload className="text-white" size={22} /> : <Download className="text-white" size={22} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {activeFile}
                      </p>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {isUploading ? 'Uploading to Telegram...' : 'Downloading...'}
                      </p>
                    </div>
                    <span
                      className="text-2xl font-bold"
                      style={{ color: isUploading ? 'var(--accent)' : 'var(--success)' }}
                    >
                      {progress}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <motion.div
                      className="progress-fill"
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Folders Section */}
            {currentSubfolders.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <p
                  className="text-xs font-bold uppercase tracking-wider mb-4"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Folders
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                  {currentSubfolders.map((folder, i) => (
                    <motion.div
                      key={folder.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="folder-card file-card p-4 group relative"
                      onClick={() => navigateToFolder(folder.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                          style={{ background: 'var(--folder-gradient)' }}
                        >
                          <Folder className="text-white" size={20} />
                        </div>
                        <span
                          className="font-medium truncate text-sm group-hover:text-amber-400 transition-colors"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {folder.name}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFolder(folder.id, folder.name);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20 hover:text-red-400"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Files Section */}
            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <p
                  className="text-xs font-bold uppercase tracking-wider mb-4"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Files
                </p>

                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                    {files.map((file, i) => (
                      <motion.div
                        key={file.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="file-card p-4 sm:p-5 group"
                      >
                        <div className="flex items-start gap-4">
                          <div className={`icon-container flex-shrink-0 ${getIconClass(file.mime_type, file.name)}`}>
                            {getIcon(file.mime_type, file.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3
                              className="font-semibold truncate group-hover:text-indigo-400 transition-colors text-sm sm:text-base"
                              title={file.name}
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {file.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {formatSize(Number(file.size))}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded-full" style={{
                                background: 'var(--surface)',
                                color: 'var(--text-muted)'
                              }}>
                                {getFileTypeLabel(file.mime_type, file.name)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                          <div className="flex gap-1.5">
                            {file.mime_type.startsWith('video/') && (
                              <button
                                onClick={() => watchVideo(file)}
                                className="action-btn"
                                style={{
                                  background: 'rgba(99, 102, 241, 0.1)',
                                  borderColor: 'rgba(99, 102, 241, 0.2)',
                                  color: 'var(--accent)'
                                }}
                                title="Watch"
                              >
                                <Play size={14} />
                              </button>
                            )}
                            <button
                              onClick={() => downloadFile(file)}
                              className="action-btn"
                              style={{
                                background: 'rgba(34, 197, 94, 0.1)',
                                borderColor: 'rgba(34, 197, 94, 0.2)',
                                color: 'var(--success)'
                              }}
                              title="Download"
                            >
                              <Download size={14} />
                            </button>
                            <button
                              onClick={() => { setEditingFile(file); setNewName(file.name); setIsRenaming(true); }}
                              className="action-btn"
                              style={{
                                background: 'rgba(245, 158, 11, 0.1)',
                                borderColor: 'rgba(245, 158, 11, 0.2)',
                                color: 'var(--warning)'
                              }}
                              title="Rename"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => { setEditingFile(file); setIsMoving(true); }}
                              className="action-btn"
                              style={{
                                background: 'rgba(168, 85, 247, 0.1)',
                                borderColor: 'rgba(168, 85, 247, 0.2)',
                                color: 'var(--accent-secondary)'
                              }}
                              title="Move"
                            >
                              <FolderInput size={14} />
                            </button>
                            <button
                              onClick={() => window.open(getTelegramLink(file), '_blank')}
                              className="action-btn"
                              style={{
                                background: 'rgba(59, 130, 246, 0.1)',
                                borderColor: 'rgba(59, 130, 246, 0.2)',
                                color: 'var(--info)'
                              }}
                              title="Open in Telegram"
                            >
                              <ExternalLink size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(file.id)}
                              className="action-btn danger"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                            {new Date(file.uploaded_at).toLocaleDateString()}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  // List View
                  <div className="glass-card overflow-hidden">
                    {files.map((file, i) => (
                      <motion.div
                        key={file.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border-b last:border-b-0 transition-all hover:bg-white/5"
                        style={{ borderColor: 'var(--border)' }}
                      >
                        <div className={`icon-container w-10 h-10 flex-shrink-0 ${getIconClass(file.mime_type, file.name)}`}>
                          {getIcon(file.mime_type, file.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate text-sm" style={{ color: 'var(--text-primary)' }}>
                            {file.name}
                          </h3>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {formatSize(Number(file.size))} · {getFileTypeLabel(file.mime_type, file.name)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                          {file.mime_type.startsWith('video/') && (
                            <button onClick={() => watchVideo(file)} className="action-btn">
                              <Play size={14} />
                            </button>
                          )}
                          <button onClick={() => downloadFile(file)} className="action-btn">
                            <Download size={14} />
                          </button>
                          <button onClick={() => { setEditingFile(file); setNewName(file.name); setIsRenaming(true); }} className="action-btn">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(file.id)} className="action-btn danger">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Empty State */}
            {currentSubfolders.length === 0 && files.length === 0 && !isUploading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="empty-state"
              >
                <div className="empty-state-icon">
                  <Folder size={36} />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  This folder is empty
                </h3>
                <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
                  Upload files or create folders to organize your unlimited cloud storage.
                </p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <label className="btn-primary cursor-pointer">
                    <Plus size={18} />
                    Upload
                    <input type="file" className="hidden" onChange={handleFileChange} />
                  </label>
                  <button
                    onClick={createFolder}
                    className="btn-secondary"
                  >
                    <FolderPlus size={18} />
                    New Folder
                  </button>
                </div>
              </motion.div>
            )}

            {/* Rename Modal */}
            <AnimatePresence>
              {isRenaming && editingFile && (
                <div className="modal-overlay">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="modal-content"
                  >
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
                      <Pencil style={{ color: 'var(--warning)' }} size={24} />
                      Rename File
                    </h3>
                    <div className="space-y-5">
                      <div>
                        <label className="text-sm font-medium ml-1 mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                          New Name
                        </label>
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="input-field"
                          autoFocus
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setIsRenaming(false)}
                          className="flex-1 btn-secondary"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => updateFile(editingFile.id, { name: newName })}
                          className="flex-1 btn-primary"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Remote Upload Modal */}
            <AnimatePresence>
              {isRemoteUploading && (
                <div className="modal-overlay">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="modal-content max-w-lg"
                  >
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
                      <Cloud style={{ color: 'var(--accent)' }} size={24} />
                      Remote Upload
                    </h3>
                    <div className="space-y-5">
                      <div>
                        <label className="text-sm font-medium ml-1 mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                          File URL
                        </label>
                        <input
                          type="text"
                          value={remoteUrl}
                          onChange={(e) => setRemoteUrl(e.target.value)}
                          placeholder="https://example.com/file.mp4"
                          className="input-field"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium ml-1 mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                          Custom Title (Optional)
                        </label>
                        <input
                          type="text"
                          value={remoteTitle}
                          onChange={(e) => setRemoteTitle(e.target.value)}
                          placeholder="Enter custom file name"
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium ml-1 mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                          Destination Folder
                        </label>
                        <div className="space-y-2 max-h-48 overflow-y-auto p-2 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
                          <button
                            onClick={() => setCurrentFolder(null)}
                            className="w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left"
                            style={{
                              background: currentFolder === null ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                              color: currentFolder === null ? 'var(--accent)' : 'var(--text-secondary)',
                              border: currentFolder === null ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent'
                            }}
                          >
                            <Home size={18} />
                            <span className="font-medium">My Drive (Root)</span>
                          </button>
                          {folders.map(folder => (
                            <button
                              key={folder.id}
                              onClick={() => setCurrentFolder(folder.id)}
                              className="w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left"
                              style={{
                                background: currentFolder === folder.id ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                color: currentFolder === folder.id ? 'var(--accent)' : 'var(--text-secondary)',
                                border: currentFolder === folder.id ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent'
                              }}
                            >
                              <Folder size={18} style={{ color: 'var(--folder-color)' }} />
                              <span className="font-medium">{folder.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => setIsRemoteUploading(false)}
                          className="flex-1 btn-secondary"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleRemoteUpload}
                          className="flex-1 btn-primary"
                          disabled={!remoteUrl}
                        >
                          Upload
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Move File Modal */}
            <AnimatePresence>
              {isMoving && editingFile && (
                <div className="modal-overlay">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="modal-content max-h-[80vh] flex flex-col"
                  >
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
                      <FolderInput style={{ color: 'var(--accent)' }} size={24} />
                      Move File
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                      <button
                        onClick={() => updateFile(editingFile.id, { folder_id: null })}
                        className="w-full flex items-center gap-4 p-4 rounded-xl border transition-all"
                        style={{
                          background: editingFile.folder_id === null ? 'rgba(99, 102, 241, 0.1)' : 'var(--surface)',
                          borderColor: editingFile.folder_id === null ? 'rgba(99, 102, 241, 0.3)' : 'var(--border)',
                          color: editingFile.folder_id === null ? 'var(--accent)' : 'var(--text-secondary)'
                        }}
                      >
                        <Home size={20} />
                        <span className="font-medium">My Drive (Root)</span>
                      </button>
                      {folders.map(folder => (
                        <button
                          key={folder.id}
                          onClick={() => updateFile(editingFile.id, { folder_id: folder.id })}
                          className="w-full flex items-center gap-4 p-4 rounded-xl border transition-all"
                          style={{
                            background: editingFile.folder_id === folder.id ? 'rgba(99, 102, 241, 0.1)' : 'var(--surface)',
                            borderColor: editingFile.folder_id === folder.id ? 'rgba(99, 102, 241, 0.3)' : 'var(--border)',
                            color: editingFile.folder_id === folder.id ? 'var(--accent)' : 'var(--text-secondary)'
                          }}
                        >
                          <Folder size={20} style={{ color: 'var(--folder-color)' }} />
                          <span className="font-medium">{folder.name}</span>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setIsMoving(false)}
                      className="mt-6 w-full py-3 text-sm rounded-xl transition-all hover:bg-white/5"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Cancel
                    </button>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* Bottom Progress Toast */}
        <AnimatePresence>
          {(isUploading || isDownloading) && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 w-full max-w-sm"
            >
              <div
                className="p-4 rounded-2xl border shadow-2xl"
                style={{
                  background: isUploading
                    ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                    : 'linear-gradient(135deg, #22c55e, #16a34a)',
                  borderColor: 'rgba(255,255,255,0.1)'
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center animate-pulse">
                      {isUploading ? <Upload size={16} className="text-white" /> : <Download size={16} className="text-white" />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white text-sm font-bold truncate max-w-[160px]">
                        {isUploading ? 'Uploading...' : 'Downloading...'}
                      </span>
                      <span className="text-white/70 text-xs truncate max-w-[160px]">
                        {activeFile}
                      </span>
                    </div>
                  </div>
                  <span className="text-white font-black text-lg">{progress}%</span>
                </div>
                <div className="h-1.5 bg-black/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-white shadow-lg"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
