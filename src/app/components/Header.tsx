'use client';

import ThemeToggle from './ThemeToggle';
import { ArrowLeft, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
    title?: string;
    showBack?: boolean;
    onBack?: () => void;
    onMenuToggle?: () => void;
    showMenu?: boolean;
}

export default function Header({
    title = 'Telegram Drive',
    showBack = false,
    onBack,
    onMenuToggle,
    showMenu = false
}: HeaderProps) {
    return (
        <header className="sticky top-0 z-50 backdrop-blur-xl border-b" style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)'
        }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Left Section */}
                    <div className="flex items-center gap-3">
                        {/* Mobile Menu Button */}
                        {onMenuToggle && (
                            <button
                                onClick={onMenuToggle}
                                className="lg:hidden action-btn mobile-menu-btn"
                                style={{ display: 'flex' }}
                            >
                                {showMenu ? <X size={20} /> : <Menu size={20} />}
                            </button>
                        )}

                        {/* Back Button */}
                        {showBack && onBack && (
                            <button onClick={onBack} className="action-btn">
                                <ArrowLeft size={20} />
                            </button>
                        )}

                        {/* Logo/Title */}
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{
                                background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))'
                            }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                </svg>
                            </div>
                            <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                                {title}
                            </h1>
                        </div>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                    </div>
                </div>
            </div>
        </header>
    );
}
