import {
    Folder, Video, Image as ImageIcon, FileText, Package,
    Plus, FolderPlus, Zap, Cloud, LogOut, Play, HardDrive
} from 'lucide-react';

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
        { icon: Folder, label: 'All Files', type: null },
        { icon: Video, label: 'Videos', type: 'video' },
        { icon: ImageIcon, label: 'Images', type: 'image' },
        { icon: FileText, label: 'Documents', type: 'application' },
        { icon: Package, label: 'Archives', type: 'zip' },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 flex flex-col 
        bg-[var(--bg-secondary)] border-r border-[var(--border)]
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:static lg:h-screen lg:z-auto'}
      `}>
                {/* Brand Area */}
                <div className="flex-shrink-0 h-20 flex items-center px-6 border-b border-[var(--border)]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <HardDrive className="text-white" size={20} />
                        </div>
                        <div>
                            <h1 className="font-bold text-xl tracking-tight leading-none" style={{ color: 'var(--text-primary)' }}>TG Drive</h1>
                            <span className="text-[10px] font-bold tracking-wider uppercase opacity-60" style={{ color: 'var(--text-secondary)' }}>Cloud Storage</span>
                        </div>
                    </div>
                </div>

                {/* Action Button Area */}
                <div className="p-6 pb-2">
                    <label className="group flex items-center justify-center gap-3 w-full py-3.5 px-4 rounded-xl cursor-pointer bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0">
                        <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                        <span>Upload New File</span>
                        <input type="file" className="hidden" onChange={onUpload} />
                    </label>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <button
                            onClick={onCreateFolder}
                            className="flex flex-col items-center justify-center p-3 rounded-xl border border-dashed hover:border-solid hover:bg-[var(--bg-tertiary)] transition-all group"
                            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                        >
                            <FolderPlus size={22} className="mb-1 group-hover:scale-110 transition-transform group-hover:text-indigo-500" />
                            <span className="text-xs font-medium">New Folder</span>
                        </button>
                        <button
                            onClick={onRemoteUpload}
                            className="flex flex-col items-center justify-center p-3 rounded-xl border border-dashed hover:border-solid hover:bg-[var(--bg-tertiary)] transition-all group"
                            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                        >
                            <Zap size={22} className="mb-1 group-hover:scale-110 transition-transform group-hover:text-amber-500" />
                            <span className="text-xs font-medium">Remote URL</span>
                        </button>
                    </div>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scrollbar-hide">
                    <p className="px-4 mb-2 text-xs font-bold uppercase tracking-wider opacity-50" style={{ color: 'var(--text-secondary)' }}>Library</p>

                    {navItems.map((item) => (
                        <button
                            key={item.label}
                            onClick={() => onNavigate(item.type)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${currentFilter === item.type
                                    ? 'bg-indigo-500/10 text-indigo-500'
                                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                                }`}
                        >
                            <item.icon size={18} className={currentFilter === item.type ? 'text-indigo-500' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'} />
                            {item.label}
                        </button>
                    ))}

                    <button
                        onClick={onStreamUrl}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                    >
                        <Play size={18} className="text-[var(--text-muted)] group-hover:text-pink-500" />
                        Stream URL
                    </button>
                </div>

                {/* Footer Area */}
                <div className="p-4 border-t border-[var(--border)]">
                    <div className="bg-[var(--bg-tertiary)]/50 rounded-2xl p-4 border border-[var(--border)]">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
                                <Cloud size={18} />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Storage</span>
                                    <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{storageUsed}</span>
                                </div>
                                <div className="h-1.5 w-full bg-[var(--bg-primary)] rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 w-[5%] rounded-full animate-pulse" />
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onLogout}
                            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                            <LogOut size={14} />
                            Sign Out
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
