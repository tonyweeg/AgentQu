import { useState } from 'react';
import { ArrowLeft, Music, Copy, Check, Download, Mic, Zap } from 'lucide-react';

interface AudioToolsProps {
  onBack: () => void;
}

export default function AudioTools({ onBack }: AudioToolsProps) {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [localFile, setLocalFile] = useState('');
  const [activeTab, setActiveTab] = useState<'youtube' | 'vocals' | 'both'>('both');
  const [copied, setCopied] = useState<string | null>(null);

  const getCommand = () => {
    const baseCmd = 'source ~/AgentQu/tools/vocal-remover-venv/bin/activate && python ~/AgentQu/tools/audio_tools.py';

    if (activeTab === 'youtube' && youtubeUrl) {
      return `${baseCmd} youtube "${youtubeUrl}"`;
    } else if (activeTab === 'vocals' && localFile) {
      return `${baseCmd} vocals "${localFile}"`;
    } else if (activeTab === 'both' && youtubeUrl) {
      return `${baseCmd} both "${youtubeUrl}"`;
    }
    return '';
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const command = getCommand();

  const tabs = [
    { id: 'both', label: 'YouTube + Vocals', icon: <Zap className="w-4 h-4" /> },
    { id: 'youtube', label: 'YouTube Only', icon: <Download className="w-4 h-4" /> },
    { id: 'vocals', label: 'Remove Vocals', icon: <Mic className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {/* Header */}
      <header className="px-6 py-4 border-b border-slate-700/50">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Music className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-semibold text-lg">Audio Tools</h1>
              <p className="text-slate-400 text-xs">YouTube Download + Vocal Removal</p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Mode Tabs */}
          <div className="flex gap-2 mb-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'youtube' | 'vocals' | 'both')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800 border border-slate-700/50'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Input Section */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 mb-6">
            {(activeTab === 'youtube' || activeTab === 'both') && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  YouTube URL
                </label>
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
            )}

            {activeTab === 'vocals' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Local File Path
                </label>
                <input
                  type="text"
                  value={localFile}
                  onChange={(e) => setLocalFile(e.target.value)}
                  placeholder="/path/to/your/audio.mp3"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
            )}

            {/* Command Preview */}
            {command && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-300">
                    Terminal Command
                  </label>
                  <button
                    onClick={() => copyToClipboard(command, 'command')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      copied === 'command'
                        ? 'bg-green-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {copied === 'command' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-slate-900 rounded-xl p-4 text-sm text-green-400 font-mono overflow-x-auto border border-slate-700/50">
                  {command}
                </pre>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              How to Use
            </h3>
            <ol className="space-y-3 text-slate-300">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-xs font-bold text-white">1</span>
                <span>Enter a YouTube URL or local file path above</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-xs font-bold text-white">2</span>
                <span>Copy the generated terminal command</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-xs font-bold text-white">3</span>
                <span>Paste and run in your terminal</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-xs font-bold text-white">4</span>
                <span>Find your files in <code className="px-2 py-0.5 bg-slate-900 rounded text-purple-300 text-sm">~/AgentQu/docs/Audio/</code></span>
              </li>
            </ol>

            <div className="mt-6 p-4 bg-purple-900/30 rounded-xl border border-purple-500/30">
              <h4 className="font-medium text-purple-300 mb-2">Output Files</h4>
              <ul className="text-sm text-slate-300 space-y-1">
                <li><code className="text-green-400">docs/Audio/</code> - Downloaded MP3 files</li>
                <li><code className="text-green-400">docs/Audio/separated/htdemucs/{'{song}'}/vocals.wav</code> - Isolated vocals</li>
                <li><code className="text-green-400">docs/Audio/separated/htdemucs/{'{song}'}/no_vocals.wav</code> - Instrumental/Karaoke</li>
              </ul>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="mt-6 text-center text-slate-500 text-sm">
            Powered by <span className="text-purple-400">Demucs</span> (Meta AI) + <span className="text-pink-400">yt-dlp</span>
          </div>
        </div>
      </main>
    </div>
  );
}
