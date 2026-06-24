'use client';
import { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { Terminal, Code2, Globe, Plus, LogOut, FolderCode } from 'lucide-react';

interface Project {
    id: string;
    name: string;
    workspace_type: 'javascript' | 'python' | 'website';
    created_at: string;
}

export default function Dashboard() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [newProjectName, setNewProjectName] = useState('');
    const [activeTab, setActiveTab] = useState<'javascript' | 'python' | 'website'>('javascript');
    const [loading, setLoading] = useState(true);

    const fetchProjects = async () => {
        try {
            const data = await api.get('/projects');
            setProjects(data);
        } catch (_err) {
            console.error("Failed fetching project list maps", _err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!localStorage.getItem('token')) {
            window.location.href = '/';
            return;
        }
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchProjects();
    }, []);

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProjectName.trim()) return;

        try {
            await api.post('/projects', {
                name: newProjectName,
                workspace_type: activeTab,
            });
            setNewProjectName('');
            fetchProjects(); // Refresh running containers list
        } catch {
            alert("Could not initialize project environment instance.");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/';
    };



    const cards = [
        { type: 'javascript', title: 'JavaScript Workspace', desc: 'Isolate scripts & logic operations', icon: Code2, color: 'border-yellow-500/30 text-yellow-400 bg-yellow-500/5' },
        { type: 'python', title: 'Python Workspace', desc: 'Process backend math & automation tools', icon: Terminal, color: 'border-blue-500/30 text-blue-400 bg-blue-500/5' },
        { type: 'website', title: 'Website Builder', desc: 'Live HTML, CSS, & Tailwind engine sandbox', icon: Globe, color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' },
    ] as const;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
            {/* Upper Navigation Row */}
            <header className="flex justify-between items-center max-w-7xl mx-auto mb-12 border-b border-slate-800 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                        <FolderCode className="text-blue-500 h-8 w-8" /> Central Workspace Dashboard
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Select an environment card below to create or manage your coding workspaces.</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 rounded-lg bg-slate-900 border border-slate-800 px-4 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-all"
                >
                    <LogOut size={16} /> Sign Out
                </button>
            </header>

            <main className="max-w-7xl mx-auto space-y-12">
                {/* The 3 Core Concept Cards Selection Grid */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {cards.map((card) => {
                        const Icon = card.icon;
                        const isSelected = activeTab === card.type;
                        return (
                            <div
                                key={card.type}
                                onClick={() => setActiveTab(card.type)}
                                className={`cursor-pointer border rounded-xl p-6 transition-all duration-200 transform hover:-translate-y-1 ${card.color} ${isSelected ? 'ring-2 ring-blue-500 scale-[1.02]' : 'opacity-70 hover:opacity-100'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <Icon size={32} />
                                    <span className="text-xs font-mono uppercase bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800">
                                        {card.type}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{card.title}</h3>
                                <p className="text-slate-400 text-sm">{card.desc}</p>
                            </div>
                        );
                    })}
                </section>

                {/* Project Generation Controller Panel */}
                <section className="bg-slate-900/40 border border-slate-800 rounded-xl p-8 max-w-3xl mx-auto">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        Create a New <span className="text-blue-400 capitalize">{activeTab}</span> Workspace Project
                    </h2>
                    <form onSubmit={handleCreateProject} className="flex gap-3">
                        <input
                            type="text"
                            required
                            placeholder="e.g., algorithmic-data-processor"
                            className="flex-1 rounded-lg bg-slate-950 border border-slate-800 px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors text-white"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-6 py-3 font-semibold text-sm transition-all shadow-lg shadow-blue-600/10"
                        >
                            <Plus size={16} /> Create
                        </button>
                    </form>
                </section>

                {/* Container Render Grid Display */}
                <section>
                    <h2 className="text-xl font-bold text-white mb-6">Your Running Projects</h2>
                    {loading ? (
                        <div className="text-slate-500 text-sm font-mono animate-pulse">Loading execution maps...</div>
                    ) : projects.length === 0 ? (
                        <div className="text-slate-500 border border-dashed border-slate-800 text-center rounded-xl p-12 text-sm">
                            No active workspaces discovered. Select a card framework type above to configure your environment.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {projects.map((project) => (
                                <div
                                    key={project.id}
                                    onClick={() => window.location.href = `/workspace/${project.id}`}
                                    className="group cursor-pointer border border-slate-800 bg-slate-900/60 rounded-xl p-5 hover:border-blue-500/50 transition-all flex justify-between items-center"
                                >
                                    <div>
                                        <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors mb-1">
                                            {project.name}
                                        </h4>
                                        <p className="text-xs text-slate-500 uppercase font-mono">
                                            Type: {project.workspace_type}
                                        </p>
                                    </div>
                                    <span className="text-blue-500 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                                        Open &rarr;
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
