'use client';

import {
    Folder, Video, Image as ImageIcon, FileText, Package,
    Plus, FolderPlus, Zap, Cloud, LogOut, Play, HardDrive, X, Music,
    ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onCreateFolder: () => void;
    onRemoteUpload: () => void;
    storageUsed: string;
    onLogout: () => void;
    onNavigate: (type: string | null) => void;
    currentFilter: string | null;
    onStreamUrl: () => void;
}

export default function Sidebar({
    isOpen,
    onClose,
    onUpload,
    onCreateFolder,
    onRemoteUpload,
    storageUsed,
    onLogout,
    onNavigate,
    currentFilter,
    onStreamUrl
}: SidebarProps) {
    const navItems = [
        { icon: Folder, label: 'All Files', type: null, color: '#6366f1' },
        { icon: Video, label: 'Videos', type: 'video', color: '#ec4899' },
        { icon: ImageIcon, label: 'Images', type: 'image', color: '#3b82f6' },
        { icon: FileText, label: 'Documents', type: 'application', color: '#f59e0b' },
        { icon: Package, label: 'Archives', type: 'zip', color: '#8b5cf6' },
        { icon: Music, label: 'Audio', type: 'audio', color: '#10b981' },
    ];

    const handleNavClick = (type: string | null) => {
        onNavigate(type);
        onClose();
    };

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                        onClick={onClose}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Container */}
            <motion.aside
                initial={false}
                animate={{
                    x: isOpen ? 0 : '-100%',
                }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`
                    fixed lg:static inset-y-0 left-0 z-50 flex flex-col h-full
                    border-r shadow-2xl lg:shadow-none
                    w-[280px] sm:w-[300px] lg:w-[320px]
                `}
                style={{
                    background: 'var(--bg-secondary)',
                    borderColor: 'var(--border)'
                }}
            >
                {/* Brand Area */}
                <div
                    className="flex-shrink-0 h-20 sm:h-24 flex items-center px-5 sm:px-6 lg:px-8 border-b"
                    style={{ borderColor: 'var(--border)' }}
                >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                            className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{
                                background: 'var(--accent-gradient)',
                                boxShadow: 'var(--shadow-accent)'
                            }}
                        >
                            <HardDrive className="text-white" size={24} />
                        </div>
                        <div className="min-w-0">
                            <h1
                                className="font-bold text-lg sm:text-xl tracking-tight truncate"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                TG Drive
                            </h1>
                            <span
                                className="text-xs font-bold tracking-wider uppercase block"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                Cloud Storage
                            </span>
                        </div>
                    </div>

                    {/* Close button for mobile */}
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2.5 rounded-xl transition-all hover:scale-105 active:scale-95 flex-shrink-0 ml-2"
                        style={{
                            background: 'var(--surface)',
                            color: 'var(--text-muted)',
                            border: '1px solid var(--border)'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                    {/* Main Upload Button */}
                    <div className="px-5 sm:px-6 lg:px-8 pt-6 pb-2">
                        <label
                            className="group flex items-center justify-center gap-2 w-full py-3.5 sm:py-4 px-4 rounded-xl cursor-pointer text-white font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                            style={{
                                background: 'var(--accent-gradient)',
                                boxShadow: 'var(--shadow-accent)'
                            }}
                        >
                            <Plus
                                size={22}
                                className="transition-transform duration-300 group-hover:rotate-90 flex-shrink-0"
                            />
                            <span className="text-sm sm:text-base">Upload New File</span>
                            <input type="file" className="hidden" onChange={onUpload} />
                        </label>

                        {/* Secondary Actions */}
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <button
                                onClick={onCreateFolder}
                                className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border border-dashed transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group"
                                style={{
                                    borderColor: 'var(--border)',
                                    color: 'var(--text-secondary)',
                                    background: 'var(--surface)'
                                }}
                            >
                                <FolderPlus
                                    size={20}
                                    className="mb-1.5 transition-all duration-300 group-hover:scale-110"
                                    style={{ color: 'var(--folder-color)' }}
                                />
                                <span className="text-xs font-medium">New Folder</span>
                            </button>
                            <button
                                onClick={onRemoteUpload}
                                className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border border-dashed transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group"
                                style={{
                                    borderColor: 'var(--border)',
                                    color: 'var(--text-secondary)',
                                    background: 'var(--surface)'
                                }}
                            >
                                <Zap
                                    size={20}
                                    className="mb-1.5 transition-all duration-300 group-hover:scale-110"
                                    style={{ color: 'var(--warning)' }}
                                />
                                <span className="text-xs font-medium">Remote URL</span>
                            </button>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <div className="px-5 sm:px-6 lg:px-8 py-5">
                        <p
                            className="px-1 mb-3 text-xs font-bold uppercase tracking-wider"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            Library
                        </p>

                        <div className="space-y-1.5">
                            {navItems.map((item) => (
                                <button
                                    key={item.label}
                                    onClick={() => handleNavClick(item.type)}
                                    className={`
                                        w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium 
                                        transition-all duration-200 group text-left
                                    `}
                                    style={{
                                        background: currentFilter === item.type
                                            ? `${item.color}15`
                                            : 'transparent',
                                        border: currentFilter === item.type
                                            ? `1px solid ${item.color}30`
                                            : '1px solid transparent',
                                        color: currentFilter === item.type ? item.color : 'var(--text-secondary)'
                                    }}
                                >
                                    <item.icon
                                        size={20}
                                        style={{
                                            color: currentFilter === item.type ? item.color : 'var(--text-muted)',
                                            transition: 'all 0.2s'
                                        }}
                                        className="group-hover:scale-110 flex-shrink-0"
                                    />
                                    <span className="truncate">{item.label}</span>
                                    <ChevronRight
                                        size={16}
                                        className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                        style={{ color: 'var(--text-muted)' }}
                                    />
                                </button>
                            ))}

                            {/* Stream URL Button */}
                            <button
                                onClick={() => {
                                    onStreamUrl();
                                    onClose();
                                }}
                                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group text-left"
                                style={{
                                    color: 'var(--text-secondary)',
                                    border: '1px solid transparent'
                                }}
                            >
                                <Play
                                    size={20}
                                    className="group-hover:scale-110 transition-all flex-shrink-0"
                                    style={{ color: 'var(--video-color)' }}
                                />
                                <span className="truncate">Stream URL</span>
                                <ChevronRight
                                    size={16}
                                    className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                    style={{ color: 'var(--text-muted)' }}
                                />
                            </button>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="mx-6 sm:mx-8 my-4 h-px" style={{ background: 'var(--border)' }} />

                    {/* Quick Stats */}
                    <div className="px-5 sm:px-6 lg:px-8 mb-6">
                        <div
                            className="p-4 rounded-xl border"
                            style={{
                                background: 'var(--surface)',
                                borderColor: 'var(--border)'
                            }}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div
                                    className="p-2 rounded-lg flex-shrink-0"
                                    style={{
                                        background: 'rgba(99, 102, 241, 0.1)',
                                        color: 'var(--accent)'
                                    }}
                                >
                                    <Cloud size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                                        Storage Used
                                    </p>
                                    <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                                        {storageUsed}
                                    </p>
                                </div>
                            </div>
                            <div
                                className="h-1.5 w-full rounded-full overflow-hidden"
                                style={{ background: 'var(--bg-primary)' }}
                            >
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{
                                        background: 'var(--accent-gradient)',
                                        width: '5%'
                                    }}
                                    animate={{
                                        opacity: [0.6, 1, 0.6],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Area - Always at bottom */}
                <div
                    className="p-5 sm:p-6 lg:px-8 border-t flex-shrink-0"
                    style={{ borderColor: 'var(--border)' }}
                >
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group"
                        style={{
                            color: 'var(--danger)',
                            background: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid rgba(239, 68, 68, 0.15)'
                        }}
                    >
                        <LogOut size={18} className="flex-shrink-0" />
                        <span>Sign Out</span>
                        <ChevronRight
                            size={16}
                            className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        />
                    </button>
                </div>
            </motion.aside>
        </>
    );
}
