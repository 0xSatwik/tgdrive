'use client';

import ThemeToggle from './ThemeToggle';
import { Menu, Search, User, ChevronDown, ArrowLeft, Zap, Shield, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeaderProps {
    onMenuToggle: () => void;
    searchTerm?: string;
    onSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    title?: string;
    showBack?: boolean;
    onBack?: () => void;
    onRelogin?: () => void;
    on2faSetup?: () => void;
}

export default function Header({
    onMenuToggle,
    searchTerm = '',
    onSearchChange = () => { },
    title,
    showBack,
    onBack,
    onRelogin,
    on2faSetup
}: HeaderProps) {
    return (
        <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex-shrink-0 h-16 sm:h-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between z-30 relative"
            style={{
                background: 'var(--bg-secondary)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderBottom: '1px solid var(--border)',
                boxShadow: 'var(--shadow-md)'
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

            {/* Left Section */}
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                {/* Mobile Menu Toggle */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onMenuToggle}
                    className="lg:hidden p-2.5 -ml-2 rounded-xl transition-all duration-300 relative overflow-hidden group"
                    style={{
                        background: 'var(--surface)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border)'
                    }}
                    aria-label="Open menu"
                >
                    <Menu size={22} className="relative z-10" />
                    <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ background: 'var(--accent-gradient)' }}
                    />
                    <Menu
                        size={22}
                        className="absolute inset-0 m-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white"
                    />
                </motion.button>

                {/* Back Button or Title/Search */}
                {showBack ? (
                    <div className="flex items-center gap-3 min-w-0">
                        <motion.button
                            whileHover={{ scale: 1.05, x: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onBack}
                            className="p-2.5 rounded-xl transition-all duration-300 flex-shrink-0 relative overflow-hidden group"
                            style={{
                                background: 'var(--surface)',
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--border)'
                            }}
                            aria-label="Go back"
                        >
                            <ArrowLeft size={20} className="relative z-10 transition-transform duration-300 group-hover:-translate-x-0.5" />
                        </motion.button>
                        <h2
                            className="text-lg font-bold truncate"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            {title}
                        </h2>
                    </div>
                ) : (
                    <div className="relative w-full max-w-xl hidden sm:block group">
                        {/* Search icon with animation */}
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300 group-focus-within:scale-110 group-focus-within:rotate-12 z-10">
                            <Search
                                size={18}
                                className="text-gray-400 group-focus-within:text-indigo-400 transition-colors duration-300"
                            />
                        </div>

                        {/* Search input with enhanced styling - using CSS variables */}
                        <input
                            type="text"
                            placeholder="Search your files..."
                            value={searchTerm}
                            onChange={onSearchChange}
                            className="w-full h-11 sm:h-12 pl-12 pr-4 rounded-xl text-sm font-medium outline-none border-2 transition-all duration-300"
                            style={{
                                background: 'var(--surface)',
                                color: 'var(--text-primary)',
                                borderColor: 'var(--border)'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = 'var(--accent)';
                                e.target.style.background = 'var(--surface-hover)';
                                e.target.style.boxShadow = 'var(--shadow-accent)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = 'var(--border)';
                                e.target.style.background = 'var(--surface)';
                                e.target.style.boxShadow = 'none';
                            }}
                        />

                        {/* Keyboard shortcut hint */}
                        <div
                            className="absolute right-4 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        >
                            <kbd
                                className="px-2 py-0.5 text-[10px] font-mono rounded"
                                style={{
                                    background: 'var(--surface)',
                                    color: 'var(--text-muted)',
                                    border: '1px solid var(--border)'
                                }}
                            >
                                ⌘K
                            </kbd>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2 sm:gap-4">
                {/* Mobile Search Button */}
                {!showBack && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="sm:hidden p-2.5 rounded-xl transition-all duration-300 relative overflow-hidden group"
                        style={{
                            background: 'var(--surface)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border)'
                        }}
                        aria-label="Search"
                    >
                        <Search size={20} className="relative z-10" />
                        <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            style={{ background: 'var(--accent-gradient)' }}
                        />
                        <Search
                            size={20}
                            className="absolute inset-0 m-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white"
                        />
                    </motion.button>
                )}

                {/* Theme Toggle */}
                <div className="hidden sm:block">
                    <ThemeToggle />
                </div>

                {/* Divider */}
                <div
                    className="h-8 w-px mx-1 hidden sm:block"
                    style={{
                        background: 'linear-gradient(180deg, transparent, var(--border), transparent)'
                    }}
                />

                {/* Profile */}
                <div className="relative group">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-2 sm:gap-3 pl-1 pr-2 sm:pr-3 py-1.5 rounded-full transition-all duration-300"
                        style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border)'
                        }}
                    >
                        {/* Avatar with gradient border effect */}
                        <div className="relative">
                            <div
                                className="absolute -inset-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                style={{ background: 'var(--accent-gradient)' }}
                            />
                            <div
                                className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                                style={{
                                    background: 'var(--accent-gradient)',
                                    boxShadow: 'var(--shadow-accent)'
                                }}
                            >
                                AK
                            </div>
                        </div>
                        <div className="hidden md:block text-left">
                            <p
                                className="text-xs font-bold leading-none"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                Akash
                            </p>
                            <p
                                className="text-[10px] font-medium leading-none mt-0.5 flex items-center gap-1"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                <Sparkles size={8} style={{ color: 'var(--accent)' }} />
                                Admin
                            </p>
                        </div>
                        <ChevronDown
                            size={14}
                            className="hidden sm:block opacity-50 transition-transform duration-300 group-hover:rotate-180"
                            style={{ color: 'var(--text-muted)' }}
                        />
                    </motion.button>

                    {/* Enhanced Dropdown */}
                    <div
                        className="absolute right-0 mt-3 w-56 py-2 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50"
                        style={{
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            boxShadow: 'var(--shadow-xl)'
                        }}
                    >
                        {/* Dropdown arrow */}
                        <div
                            className="absolute -top-2 right-6 w-4 h-4 rotate-45"
                            style={{
                                background: 'var(--bg-secondary)',
                                borderLeft: '1px solid var(--border)',
                                borderTop: '1px solid var(--border)'
                            }}
                        />

                        {/* User info header */}
                        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                Akash
                            </p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                akash@example.com
                            </p>
                        </div>

                        {/* Menu items */}
                        <div className="py-1">
                            <motion.button
                                whileHover={{ x: 4 }}
                                onClick={() => window.location.reload()}
                                className="w-full text-left px-4 py-2.5 text-sm transition-all duration-200 flex items-center gap-3 group/item"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                <div
                                    className="p-1.5 rounded-lg transition-colors duration-200"
                                    style={{ background: 'var(--surface)' }}
                                >
                                    <User size={14} style={{ color: 'var(--text-secondary)' }} />
                                </div>
                                <span>My Account</span>
                            </motion.button>

                            <motion.button
                                whileHover={{ x: 4 }}
                                onClick={on2faSetup}
                                className="w-full text-left px-4 py-2.5 text-sm transition-all duration-200 flex items-center gap-3 group/item"
                                style={{ color: 'var(--success)' }}
                            >
                                <div
                                    className="p-1.5 rounded-lg transition-colors duration-200"
                                    style={{ background: 'var(--surface)' }}
                                >
                                    <Shield size={14} style={{ color: 'var(--success)' }} />
                                </div>
                                <span>Enable 2FA</span>
                            </motion.button>

                            <motion.button
                                whileHover={{ x: 4 }}
                                onClick={onRelogin}
                                className="w-full text-left px-4 py-2.5 text-sm transition-all duration-200 flex items-center gap-3 group/item"
                                style={{ color: 'var(--accent)' }}
                            >
                                <div
                                    className="p-1.5 rounded-lg transition-colors duration-200"
                                    style={{ background: 'var(--surface)' }}
                                >
                                    <Zap size={14} style={{ color: 'var(--accent)' }} />
                                </div>
                                <span>Relogin Telegram</span>
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.header>
    );
}
