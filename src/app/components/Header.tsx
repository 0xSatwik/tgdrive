'use client';

import ThemeToggle from './ThemeToggle';
import { Menu, Search, Bell, ChevronDown } from 'lucide-react';

interface HeaderProps {
    onMenuToggle: () => void;
    searchTerm?: string;
    onSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    title?: string;
    showBack?: boolean;
    onBack?: () => void;
    showMenu?: boolean; // Kept for compatibility if needed
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
        <header
            className="flex-shrink-0 h-20 px-6 lg:px-10 flex items-center justify-between border-b transition-colors z-30"
            style={{
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border)'
            }}
        >
            {/* Left Section: Back/Menu & Title/Search */}
            <div className="flex items-center gap-4 flex-1">
                {/* Mobile Menu Toggle */}
                <button
                    onClick={onMenuToggle}
                    className="lg:hidden p-2.5 -ml-2 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    <Menu size={24} />
                </button>

                {/* Conditional Render: Back Button / Title OR Search */}
                {showBack ? (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onBack}
                            className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                        </button>
                        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
                    </div>
                ) : (
                    <div className="relative w-full max-w-xl hidden sm:block group">
                        <Search
                            className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-indigo-500"
                            size={18}
                            style={{ color: 'var(--text-muted)' }}
                        />
                        <input
                            type="text"
                            placeholder="Search your files..."
                            value={searchTerm}
                            onChange={onSearchChange}
                            className="w-full h-11 pl-11 pr-4 rounded-xl text-sm font-medium outline-none border-2 border-transparent focus:border-indigo-500/20 transition-all placeholder:text-[var(--text-muted)/50]"
                            style={{
                                background: 'var(--bg-primary)',
                                color: 'var(--text-primary)'
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Right Section: Actions & Profile */}
            <div className="flex items-center gap-3 sm:gap-5">
                <div className="hidden sm:block">
                    <ThemeToggle />
                </div>

                <button
                    className="relative p-2.5 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    <Bell size={20} />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-[var(--bg-secondary)]" />
                </button>

                <div className="h-8 w-[1px] bg-[var(--border)] mx-1 hidden sm:block"></div>

                <button className="flex items-center gap-3 pl-1 pr-2 py-1 rounded-full hover:bg-[var(--bg-tertiary)] transition-all group">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 ring-2 ring-transparent group-hover:ring-indigo-500/20 transition-all">
                        <span className="text-sm font-bold">AK</span>
                    </div>
                    <div className="hidden md:block text-left">
                        <p className="text-xs font-bold leading-none mb-0.5" style={{ color: 'var(--text-primary)' }}>Akash</p>
                        <p className="text-[10px] font-medium leading-none opacity-70" style={{ color: 'var(--text-secondary)' }}>Admin</p>
                    </div>
                    <ChevronDown size={14} className="hidden md:block opacity-50 ml-1" style={{ color: 'var(--text-secondary)' }} />
                </button>
            </div>
        </header>
    );
}
