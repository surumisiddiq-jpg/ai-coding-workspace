'use client';
import { useEffect, useState, use } from 'react';
import { api } from '../../../utils/api';
import Editor from '@monaco-editor/react';
import { Play, FileCode, ArrowLeft, Save, Loader2 } from 'lucide-react';
import AiChat from '../../../components/AiChat';

interface FileRecord {
  id: string;
  name: string;
  content: string;
}

interface ProjectRecord {
  id: string;
  name: string;
  workspace_type: 'javascript' | 'python' | 'website';
}

export default function Workspace({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [activeFile, setActiveFile] = useState<FileRecord | null>(null);
  const [terminalOutput, setTerminalOutput] = useState('Terminal output will display here after execution...');
  const [runningCode, setRunningCode] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchWorkspaceData();
  }, [projectId]);

  const fetchWorkspaceData = async () => {
    try {
      const data = await api.get(`/projects/${projectId}`);
      setProject(data.project);
      setFiles(data.files);
      if (data.files.length > 0) {
        setActiveFile(data.files[0]);
      }
    } catch (err) {
      console.error('Error hydrating workspace panels', err);
    }
  };

  const handleCodeChange = (value: string | undefined) => {
    if (!activeFile) return;
    const updatedContent = value || '';
    setActiveFile({ ...activeFile, content: updatedContent });
    setFiles(files.map(f => f.id === activeFile.id ? { ...f, content: updatedContent } : f));
  };

  const saveCurrentFile = async () => {
    if (!activeFile) return;
    try {
      await api.put(`/files/${activeFile.id}`, { content: activeFile.content });
    } catch (err) {
      console.error('Failed to commit manual file sync save', err);
    }
  };

  const executeCodeSubsystem = async () => {
    if (!activeFile || !project) return;
    setRunningCode(true);
    setTerminalOutput('Running script inside remote sandbox workspace...');
    try {
      await saveCurrentFile();
      const res = await api.post('/execute', {
        code: activeFile.content,
        language: project.workspace_type
      });
      setTerminalOutput(res.output);
    } catch (err) {
      setTerminalOutput('Execution failure connecting to sandbox backend routing.');
    } finally {
      setRunningCode(false);
    }
  };

  if (!isMounted || !project || !activeFile) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono">
        <Loader2 className="animate-spin text-blue-500 mr-2" /> Initializing Isolated Dev Environment...
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      <header className="h-14 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => window.location.href = '/dashboard'} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="font-bold text-sm tracking-tight text-white">{project.name}</h2>
            <p className="text-xs text-slate-500 font-mono uppercase">{project.workspace_type} runtime</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={saveCurrentFile} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-700">
            <Save size={14} /> Save File
          </button>
          {project.workspace_type !== 'website' && (
            <button onClick={executeCodeSubsystem} disabled={runningCode} className="flex items-center gap-1.5 px-4 py-1.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-xs font-semibold rounded-lg transition-colors shadow-lg shadow-green-600/10">
              <Play size={14} /> {runningCode ? 'Executing...' : 'Run Code'}
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-56 border-r border-slate-800 bg-slate-900/20 p-4 flex flex-col gap-2 flex-shrink-0">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Explorer</h3>
          {files.map(file => (
            <button
              key={file.id}
              onClick={() => setActiveFile(file)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg text-left transition-colors ${activeFile.id === file.id ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
            >
              <FileCode size={14} /> {file.name}
            </button>
          ))}
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 min-h-0 relative bg-slate-950">
            <Editor
              height="100%"
              theme="vs-dark"
              language={project.workspace_type === 'website' ? 'html' : project.workspace_type}
              value={activeFile.content}
              onChange={handleCodeChange}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                automaticLayout: true,
              }}
            />
          </div>

          <div className="h-56 border-t border-slate-800 bg-slate-950 flex flex-col flex-shrink-0">
            <div className="h-8 bg-slate-900/80 border-b border-slate-800 flex items-center px-4 justify-between">
              <span className="text-xs font-semibold tracking-wide uppercase text-slate-400">
                {project.workspace_type === 'website' ? 'Web Live Preview Browser' : 'Standard Sandbox Terminal Output'}
              </span>
            </div>
            <div className="flex-1 p-4 font-mono text-xs overflow-y-auto text-slate-300">
              {project.workspace_type === 'website' ? (
                <iframe
                  title="Web Sandbox"
                  srcDoc={activeFile.content}
                  className="w-full h-full bg-white rounded-lg border-0"
                  sandbox="allow-scripts"
                />
              ) : (
                <pre className="whitespace-pre-wrap">{terminalOutput}</pre>
              )}
            </div>
          </div>
        </div>

        {/* Modular AI component inject element call */}
        <AiChat
          api={api}
          activeFile={activeFile}
          projectId={projectId}
          onCodeUpdate={(updatedContent: string) => handleCodeChange(updatedContent)}
        />
      </div>
    </div>
  );
}