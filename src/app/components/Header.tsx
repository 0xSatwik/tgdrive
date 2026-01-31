'use client';

import ThemeToggle from './ThemeToggle';
import { Menu, Search, Bell, ChevronDown, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeaderProps {
    onMenuToggle: () => void;
    searchTerm?: string;
    onSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    title?: string;
    showBack?: boolean;
    onBack?: () => void;
}

export default function Header({
    onMenuToggle,
    searchTerm = '',
    onSearchChange = () => { },
    title,
    showBack,
    onBack
}: HeaderProps) {
    return (
        <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-shrink-0 h-16 sm:h-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between border-b z-30 relative"
            style={{
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border)'
            }}
        >
            {/* Left Section */}
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                {/* Mobile Menu Toggle */}
                <button
                    onClick={onMenuToggle}
                    className="lg:hidden p-2.5 -ml-2 rounded-xl transition-all hover:scale-105 active:scale-95"
                    style={{ 
                        background: 'var(--surface)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border)'
                    }}
                    aria-label="Open menu"
                >
                    <Menu size={22} />
                </button>

                {/* Back Button or Title/Search */}
                {showBack ? (
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            onClick={onBack}
                            className="p-2.5 rounded-xl transition-all hover:scale-105 active:scale-95 flex-shrink-0"
                            style={{ 
                                background: 'var(--surface)',
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--border)'
                            }}
                            aria-label="Go back"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h2 
                            className="text-lg font-bold truncate"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            {title}
                        </h2>
                    </div>
                ) : (
                    <div className="relative w-full max-w-xl hidden sm:block group">
                        <Search
                            className="absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300 group-focus-within:scale-110"
                            size={18}
                            style={{ color: 'var(--text-muted)' }}
                        />
                        <input
                            type="text"
                            placeholder="Search your files..."
                            value={searchTerm}
                            onChange={onSearchChange}
                            className="w-full h-11 sm:h-12 pl-12 pr-4 rounded-xl text-sm font-medium outline-none border-2 transition-all duration-300"
                            style={{
                                background: 'var(--bg-primary)',
                                color: 'var(--text-primary)',
                                borderColor: 'var(--border)'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                        />
                    </div>
                )}
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2 sm:gap-4">
                {/* Mobile Search Button */}
                {!showBack && (
                    <button
                        className="sm:hidden p-2.5 rounded-xl transition-all hover:scale-105 active:scale-95"
                        style={{ 
                            background: 'var(--surface)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border)'
                        }}
                        aria-label="Search"
                    >
                        <Search size={20} />
                    </button>
                )}

                {/* Theme Toggle */}
                <div className="hidden sm:block">
                    <ThemeToggle />
                </div>

                {/* Notifications */}
                <button
                    className="relative p-2.5 rounded-xl transition-all hover:scale-105 active:scale-95 hidden sm:flex"
                    style={{ 
                        background: 'var(--surface)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border)'
                    }}
                    aria-label="Notifications"
                >
                    <Bell size={20} />
                    <span 
                        className="absolute top-2 right-2 w-2 h-2 rounded-full"
                        style={{ background: 'var(--danger)' }}
                    />
                </button>

                {/* Divider */}
                <div 
                    className="h-8 w-px mx-1 hidden sm:block"
                    style={{ background: 'var(--border)' }}
                />

                {/* Profile */}
                <button 
                    className="flex items-center gap-2 sm:gap-3 pl-1 pr-2 sm:pr-3 py-1.5 rounded-full transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{ 
                        background: 'var(--surface)',
                        border: '1px solid var(--border)'
                    }}
                >
                    <div 
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ 
                            background: 'var(--accent-gradient)',
                            boxShadow: 'var(--shadow-accent)'
                        }}
                    >
                        AK
                    </div>
                    <div className="hidden md:block text-left">
                        <p 
                            className="text-xs font-bold leading-none"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            Akash
                        </p>
                        <p 
                            className="text-[10px] font-medium leading-none mt-0.5"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            Admin
                        </p>
                    </div>
                    <ChevronDown 
                        size={14} 
                        className="hidden sm:block opacity-50"
                        style={{ color: 'var(--text-muted)' }}
                    />
                </button>
            </div>
        </motion.header>
    );
}
