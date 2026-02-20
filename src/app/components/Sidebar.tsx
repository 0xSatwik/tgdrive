'use client';

import {
    Folder, Video, Image as ImageIcon, FileText, Package,
    Plus, FolderPlus, Zap, Cloud, LogOut, Play, HardDrive, X, Music,
    ChevronRight, Sparkles, TrendingUp
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
        { icon: Folder, label: 'All Files', type: null, color: '#818cf8', gradient: 'linear-gradient(135deg, #818cf8, #a855f7)' },
        { icon: Video, label: 'Videos', type: 'video', color: '#fb7185', gradient: 'linear-gradient(135deg, #fb7185, #fda4af)' },
        { icon: ImageIcon, label: 'Images', type: 'image', color: '#60a5fa', gradient: 'linear-gradient(135deg, #60a5fa, #93c5fd)' },
        { icon: FileText, label: 'Documents', type: 'application', color: '#fbbf24', gradient: 'linear-gradient(135deg, #fbbf24, #fcd34d)' },
        { icon: Package, label: 'Archives', type: 'zip', color: '#a855f7', gradient: 'linear-gradient(135deg, #a855f7, #c084fc)' },
        { icon: Music, label: 'Audio', type: 'audio', color: '#34d399', gradient: 'linear-gradient(135deg, #34d399, #6ee7b7)' },
    ];

    const handleNavClick = (type: string | null) => {
        onNavigate(type);
        onClose();
    };

    return (
        <>
            {/* Mobile Overlay - Enhanced */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-40 lg:hidden"
                        onClick={onClose}
                        style={{
                            background: 'rgba(0, 0, 0, 0.7)',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)'
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Container - Enhanced */}
            <motion.aside
                initial={false}
                animate={{
                    x: isOpen ? 0 : '-100%',
                }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`
                    fixed lg:static inset-y-0 left-0 z-50 flex flex-col h-full
                    border-r w-[260px] sm:w-[280px] lg:w-[300px]
                `}
                style={{
                    background: 'var(--bg-secondary)',
                    borderColor: 'var(--border)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    boxShadow: isOpen ? '20px 0 60px var(--shadow-lg)' : 'none'
                }}
            >
                {/* Decorative gradient line at top */}
                <div
                    className="absolute top-0 left-0 right-0 h-px"
                    style={{
                        background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
                        opacity: 0.5
                    }}
                />

                {/* Brand Area - Enhanced */}
                <div
                    className="flex-shrink-0 h-16 sm:h-20 flex items-center px-4 sm:px-5 lg:px-6 border-b relative"
                    style={{ borderColor: 'var(--border)' }}
                >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        {/* Animated Logo */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                            className="relative"
                        >
                            <div
                                className="absolute -inset-1 rounded-xl opacity-0 group-hover:opacity-100 blur-lg transition-opacity duration-500"
                                style={{ background: 'var(--accent-gradient)' }}
                            />
                            <div
                                className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                                style={{
                                    background: 'var(--accent-gradient)',
                                    boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)'
                                }}
                            >
                                <HardDrive className="text-white" size={20} />
                                <div
                                    className="absolute inset-0 opacity-30"
                                    style={{
                                        background: 'linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)',
                                        animation: 'shimmer 2s infinite'
                                    }}
                                />
                            </div>
                        </motion.div>
                        <div className="min-w-0">
                            <h1
                                className="font-bold text-base sm:text-lg tracking-tight truncate"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                TG Drive
                            </h1>
                            <span
                                className="text-[10px] sm:text-xs font-semibold tracking-wider uppercase block flex items-center gap-1"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                <Cloud size={8} style={{ color: 'var(--text-muted)' }} />
                                Cloud Storage
                            </span>
                        </div>
                    </div>

                    {/* Close button for mobile - Enhanced */}
                    <motion.button
                        whileHover={{ scale: 1.05, rotate: 90 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onClose}
                        className="lg:hidden p-2 rounded-xl transition-all flex-shrink-0 ml-1 relative overflow-hidden group"
                        style={{
                            background: 'var(--surface)',
                            color: 'var(--text-muted)',
                            border: '1px solid var(--border)'
                        }}
                    >
                        <X size={18} className="relative z-10" />
                        <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            style={{ background: 'var(--accent-gradient)' }}
                        />
                        <X
                            size={18}
                            className="absolute inset-0 m-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white"
                        />
                    </motion.button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                    {/* Main Upload Button - Enhanced */}
                    <div className="px-4 sm:px-5 lg:px-6 pt-4 pb-2">
                        <motion.label
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="group flex items-center justify-center gap-2 w-full py-3 sm:py-3.5 px-3 rounded-xl cursor-pointer text-white font-semibold transition-all duration-300 relative overflow-hidden"
                            style={{
                                background: 'var(--accent-gradient)',
                                boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)'
                            }}
                        >
                            {/* Shimmer effect */}
                            <div
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                style={{
                                    background: 'linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)',
                                    backgroundSize: '200% 200%',
                                    animation: 'shimmer 1.5s infinite'
                                }}
                            />
                            <Plus
                                size={18}
                                className="transition-transform duration-300 group-hover:rotate-90 flex-shrink-0 relative z-10"
                            />
                            <span className="text-xs sm:text-sm relative z-10">Upload New File</span>
                            <input type="file" className="hidden" onChange={onUpload} />
                        </motion.label>

                        {/* Secondary Actions - Enhanced */}
                        <div className="grid grid-cols-2 gap-2 mt-3">
                            <motion.button
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onCreateFolder}
                                className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border transition-all duration-300 group relative overflow-hidden"
                                style={{
                                    borderColor: 'var(--border)',
                                    color: 'var(--text-secondary)',
                                    background: 'var(--surface)'
                                }}
                            >
                                <div
                                    className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300"
                                    style={{ background: 'var(--folder-color)' }}
                                />
                                <FolderPlus
                                    size={16}
                                    className="mb-1 transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-0.5 relative z-10"
                                    style={{ color: 'var(--folder-color)' }}
                                />
                                <span className="text-[10px] sm:text-xs font-medium relative z-10">New Folder</span>
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onRemoteUpload}
                                className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border transition-all duration-300 group relative overflow-hidden"
                                style={{
                                    borderColor: 'var(--border)',
                                    color: 'var(--text-secondary)',
                                    background: 'var(--surface)'
                                }}
                            >
                                <div
                                    className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300"
                                    style={{ background: 'var(--warning)' }}
                                />
                                <Zap
                                    size={16}
                                    className="mb-1 transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-0.5 relative z-10"
                                    style={{ color: 'var(--warning)' }}
                                />
                                <span className="text-[10px] sm:text-xs font-medium relative z-10">Remote URL</span>
                            </motion.button>
                        </div>
                    </div>

                    {/* Navigation Links - Enhanced */}
                    <div className="px-4 sm:px-5 lg:px-6 py-3">
                        <p
                            className="px-1 mb-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            <TrendingUp size={8} />
                            Library
                        </p>

                        <div className="space-y-1">
                            {navItems.map((item, index) => (
                                <motion.button
                                    key={item.label}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    onClick={() => handleNavClick(item.type)}
                                    className={`
                                        w-full flex items-center gap-2 px-2.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium 
                                        transition-all duration-300 group text-left relative overflow-hidden
                                    `}
                                    style={{
                                        background: currentFilter === item.type
                                            ? `var(--surface-active)`
                                            : 'transparent',
                                        border: '1px solid transparent',
                                        color: currentFilter === item.type ? 'var(--text-primary)' : 'var(--text-secondary)'
                                    }}
                                    whileHover={{ x: 4 }}
                                >
                                    {/* Hover gradient background */}
                                    <div
                                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"
                                        style={{
                                            background: `linear-gradient(135deg, ${item.color}08, ${item.color}15)`
                                        }}
                                    />

                                    {/* Icon with background */}
                                    <div
                                        className="p-1 sm:p-1.5 rounded-lg transition-all duration-300 relative z-10"
                                        style={{
                                            background: currentFilter === item.type
                                                ? `var(--bg-elevated)`
                                                : 'var(--surface)'
                                        }}
                                    >
                                        <item.icon
                                            size={14}
                                            className="group-hover:scale-110 transition-transform duration-300 sm:w-[18px] sm:h-[18px]"
                                            style={{
                                                color: currentFilter === item.type ? item.color : 'var(--text-muted)',
                                            }}
                                        />
                                    </div>
                                    <span className="truncate relative z-10">{item.label}</span>
                                    <ChevronRight
                                        size={14}
                                        className="ml-auto opacity-0 group-hover:opacity-100 transition-all duration-300 relative z-10 transform group-hover:translate-x-1"
                                        style={{ color: currentFilter === item.type ? item.color : 'var(--text-muted)' }}
                                    />

                                    {/* Active indicator */}
                                    {currentFilter === item.type && (
                                        <motion.div
                                            layoutId="activeIndicator"
                                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full"
                                            style={{ background: item.gradient }}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.2 }}
                                        />
                                    )}
                                </motion.button>
                            ))}

                            {/* Stream URL Button - Enhanced */}
                            <motion.button
                                whileHover={{ x: 4 }}
                                onClick={() => {
                                    onStreamUrl();
                                    onClose();
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 group text-left relative overflow-hidden"
                                style={{
                                    color: 'var(--text-secondary)',
                                    border: '1px solid transparent'
                                }}
                            >
                                <div
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.08), rgba(236, 72, 153, 0.15))'
                                    }}
                                />
                                <div
                                    className="p-1 sm:p-1.5 rounded-lg transition-all duration-300 relative z-10"
                                    style={{ background: 'var(--surface)' }}
                                >
                                    <Play
                                        size={14}
                                        className="group-hover:scale-110 transition-transform duration-300 sm:w-[18px] sm:h-[18px]"
                                        style={{ color: 'var(--video-color)' }}
                                    />
                                </div>
                                <span className="truncate relative z-10">Stream URL</span>
                                <ChevronRight
                                    size={14}
                                    className="ml-auto opacity-0 group-hover:opacity-100 transition-all duration-300 relative z-10 transform group-hover:translate-x-1"
                                    style={{ color: 'var(--text-muted)' }}
                                />
                            </motion.button>
                        </div>
                    </div>

                    {/* Divider - Enhanced */}
                    <div
                        className="mx-4 sm:mx-6 my-3 h-px relative"
                        style={{ background: 'linear-gradient(90deg, transparent, var(--border), transparent)' }}
                    />

                    {/* Quick Stats - Enhanced */}
                    <div className="px-4 sm:px-5 lg:px-6 mb-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="p-3 sm:p-4 rounded-xl border relative overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, var(--surface), rgba(99, 102, 241, 0.05))',
                                borderColor: 'var(--border)'
                            }}
                        >
                            {/* Decorative elements */}
                            <div
                                className="absolute -top-10 -right-10 w-20 h-20 rounded-full opacity-10"
                                style={{ background: 'var(--accent-gradient)', filter: 'blur(20px)' }}
                            />

                            <div className="flex items-center gap-2.5 mb-2.5 relative z-10">
                                <motion.div
                                    animate={{
                                        scale: [1, 1.1, 1],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                    className="p-2 rounded-lg flex-shrink-0"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
                                        boxShadow: '0 4px 15px rgba(99, 102, 241, 0.2)'
                                    }}
                                >
                                    <Cloud size={16} className="sm:w-5 sm:h-5" style={{ color: 'var(--accent)' }} />
                                </motion.div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] sm:text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                                        Storage Used
                                    </p>
                                    <p className="text-sm sm:text-base font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                                        {storageUsed}
                                    </p>
                                </div>
                            </div>

                            {/* Enhanced Progress Bar */}
                            <div
                                className="h-1.5 sm:h-2 w-full rounded-full overflow-hidden relative"
                                style={{ background: 'var(--bg-primary)' }}
                            >
                                {/* Background glow */}
                                <div
                                    className="absolute inset-0 opacity-30"
                                    style={{
                                        background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
                                        animation: 'pulse 2s infinite'
                                    }}
                                />
                                <motion.div
                                    className="h-full rounded-full relative"
                                    style={{
                                        background: 'var(--accent-gradient)',
                                        width: '5%'
                                    }}
                                    animate={{
                                        opacity: [0.7, 1, 0.7],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                >
                                    {/* Shimmer effect on progress bar */}
                                    <div
                                        className="absolute inset-0"
                                        style={{
                                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                                            animation: 'shimmer 2s infinite'
                                        }}
                                    />
                                </motion.div>
                            </div>

                            <p className="text-[9px] sm:text-[10px] font-medium mt-1.5 text-center" style={{ color: 'var(--text-muted)' }}>
                                of 2 GB used
                            </p>
                        </motion.div>
                    </div>
                </div>

                {/* Footer Area - Enhanced */}
                <div
                    className="p-4 sm:p-5 lg:px-6 border-t flex-shrink-0 relative"
                    style={{ borderColor: 'var(--border)' }}
                >
                    {/* Decorative gradient */}
                    <div
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px"
                        style={{
                            background: 'linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.3), transparent)'
                        }}
                    />

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 group relative overflow-hidden"
                        style={{
                            color: 'var(--danger)',
                            background: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid rgba(239, 68, 68, 0.15)'
                        }}
                    >
                        <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            style={{ background: 'rgba(239, 68, 68, 0.1)' }}
                        />
                        <LogOut size={16} className="flex-shrink-0 relative z-10 transition-transform duration-300 group-hover:-translate-x-1 sm:w-[18px] sm:h-[18px]" />
                        <span className="relative z-10">Sign Out</span>
                        <ChevronRight
                            size={14}
                            className="ml-auto opacity-0 group-hover:opacity-100 transition-all duration-300 relative z-10 transform group-hover:translate-x-1"
                        />
                    </motion.button>
                </div>
            </motion.aside>
        </>
    );
}
