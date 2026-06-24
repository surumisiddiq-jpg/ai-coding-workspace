'use client';
import { useState, useEffect } from 'react';
import { Bot, Loader2 } from 'lucide-react';

interface ChatLogItem {
    role: string;
    content: string;
}

interface AiChatProps {
    api: { post: (endpoint: string, body: unknown) => Promise<{ message: string; suggested_code?: string }|unknown>; get: (endpoint: string) => Promise<unknown> };
    activeFile: { name: string; content: string };
    projectId: string;
    onCodeUpdate: (updatedContent: string) => void;
    disabled?: boolean;
}

export default function AiChat({ api, activeFile, projectId, onCodeUpdate, disabled = false }: AiChatProps) {
    const [aiMessage, setAiMessage] = useState('');
    const [aiChatLog, setAiChatLog] = useState<ChatLogItem[]>([]);
    const [aiLoading, setAiLoading] = useState(false);

    const loadProjectChatHistory = async () => {
        try {
            const history = await api.get(`/projects/${projectId}/chat`);
            setAiChatLog(history as ChatLogItem[]);
        } catch (err) {
            console.error('Failed to restore project chat timelines from MongoDB', err);
        }
    };

    // --- REQUIREMENT #4: PERSISTENT CHAT HISTORY FETCH ---
    useEffect(() => {
        if (projectId) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            loadProjectChatHistory();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId]);

    const sendAiChatMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!aiMessage.trim() || !activeFile) return;

        const userText = aiMessage;

        // Optimistically display user message locally
        const updatedLog = [...aiChatLog, { role: 'user', content: userText }];
        setAiChatLog(updatedLog);
        setAiMessage('');
        setAiLoading(true);

        try {
            // 1. Commit user message record down into the MongoDB log tables
            await api.post(`/projects/${projectId}/chat`, { role: 'user', content: userText });

            // 2. Transmit the file context to your AI backend model handler
            const res = await api.post('/chat', {
                message: userText,
                current_file_name: activeFile.name,
                current_file_content: activeFile.content
            });

            // 3. Commit the AI's response down into the MongoDB log tables
            await api.post(`/projects/${projectId}/chat`, { role: 'assistant', content: res.message });

            setAiChatLog(prev => [...prev, { role: 'assistant', content: res.message }]);

            if (res.suggested_code) {
                onCodeUpdate(res.suggested_code);
            }
        } catch (err: unknown) {
            console.error('AI context request failed:', err);
            const errorMessage = err instanceof Error ? err.message : 'Error connecting to the AI context module.';
            setAiChatLog(prev => [...prev, { role: 'assistant', content: errorMessage }]);
        } finally {
            setAiLoading(false);
        }
    };

    return (
        <aside className="w-80 border-l border-slate-800 bg-slate-900/10 flex flex-col flex-shrink-0 overflow-hidden">
            <div className="h-11 border-b border-slate-800 px-4 flex items-center justify-between bg-slate-900/30 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <Bot size={16} className="text-blue-400" />
                    <span className="text-xs font-bold tracking-wide uppercase text-slate-200">DevSpace Pairing AI</span>
                </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs font-sans">
                <div className="bg-slate-900/60 border border-slate-800/80 text-slate-400 p-3 rounded-lg leading-relaxed">
                    Hi! I can read your active editor file code dynamically. Ask me how to debug your logic!
                </div>
                {aiChatLog.map((chat, idx) => (
                    <div key={idx} className={`p-3 rounded-lg border ${chat.role === 'user' ? 'bg-blue-600/5 border-blue-500/10 ml-6 text-blue-200' : 'bg-slate-900/80 border-slate-800/60 mr-6 text-slate-300'
                        }`}>
                        <span className="block font-semibold uppercase text-[10px] tracking-wider mb-1 text-slate-500">
                            {chat.role === 'user' ? 'You' : 'Assistant'}
                        </span>
                        <p className="whitespace-pre-wrap font-mono text-[11px]">{chat.content}</p>
                    </div>
                ))}
                {aiLoading && (
                    <div className="text-slate-500 text-xs font-mono animate-pulse flex items-center gap-1.5">
                        <Loader2 className="animate-spin h-3 w-3" /> Consulting AI neurons...
                    </div>
                )}
            </div>

            <form onSubmit={sendAiChatMessage} className="p-3 border-t border-slate-800 bg-slate-950 flex-shrink-0">
                <input
                    type="text"
                    className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder={disabled ? 'AI chat disabled while code is executing...' : 'Ask AI helper...'}
                    value={aiMessage}
                    onChange={(e) => setAiMessage(e.target.value)}
                    disabled={aiLoading || disabled}
                />
            </form>
        </aside>
    );
}
