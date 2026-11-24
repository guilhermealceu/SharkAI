import React, { useRef, useState } from 'react';
import UploadSection from './components/UploadSection';
import Dashboard from './components/Dashboard';
import { samplePackets } from './utils/packetUtils';
import { analyzeNetworkTraffic } from './services/groqService';
import { AppState, NetworkStats, ProcessedPacket, CaptureData } from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.UPLOAD);
  const [packets, setPackets] = useState<ProcessedPacket[]>([]);
  const [stats, setStats] = useState<NetworkStats | null>(null);
  
  // AI State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const [apiKey, setApiKey] = useState('');
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const analysisController = useRef<AbortController | null>(null);

  const handleDataLoaded = ({ packets: parsedPackets, stats: parsedStats }: CaptureData) => {
    setPackets(parsedPackets);
    setStats(parsedStats);
    setAppState(AppState.DASHBOARD);
  };

  const handleAnalyze = async (focus = '') => {
    if (!stats || !packets.length || analysisController.current) return;
    const controller = new AbortController();
    analysisController.current = controller;
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const result = await analyzeNetworkTraffic(stats, samplePackets(packets), focus, apiKey, controller.signal);
      if (!controller.signal.aborted) setAnalysisResult(result);
    } catch (error) {
      if (!controller.signal.aborted) setAnalysisError(error instanceof Error ? error.message : 'Falha na análise.');
    } finally {
      if (analysisController.current === controller) {
        analysisController.current = null;
        setIsAnalyzing(false);
      }
    }
  };

  const handleResetAnalysis = () => {
    setAnalysisResult(null);
    setAnalysisError(null);
  };

  const handleReset = () => {
    analysisController.current?.abort();
    analysisController.current = null;
    setIsAnalyzing(false);
    setAppState(AppState.UPLOAD);
    setPackets([]);
    setStats(null);
    setAnalysisResult(null);
    setAnalysisError(null);
  };

  return (
    <div className="min-h-screen bg-cyber-900 text-slate-200 font-sans selection:bg-cyan-500/30">
      
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={handleReset}>
             {/* Using a generic SVG for shark fin aesthetics if Lucide doesn't have Shark */}
             <svg className="w-8 h-8 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" style={{display: 'none'}} /> 
                <path d="M12 2L2 22h20L12 2z" className="hidden" /> 
                {/* Custom Fin Path */}
                <path d="M12 2C8 6 6 14 6 22H18C18 14 16 6 12 2Z" fill="currentColor" className="text-cyan-500 opacity-20"/>
                <path d="M12 2C10 8 12 18 12 22" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 2C14 8 12 18 12 22" stroke="currentColor" strokeWidth="2"/>
                <path d="M2 22H22" stroke="currentColor" strokeWidth="2"/>
             </svg>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
              SharkAI
            </span>
          </div>
          
          {appState === AppState.DASHBOARD && (
            <button 
                onClick={handleReset}
                className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
                Nova Análise
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative overflow-x-clip">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

        {appState === AppState.UPLOAD && (
          <UploadSection onDataLoaded={handleDataLoaded} isLoading={false} />
        )}

        {appState === AppState.DASHBOARD && stats && (
          <Dashboard 
            apiKey={apiKey}
            onApiKeyChange={setApiKey}
            analysisError={analysisError}
            stats={stats} 
            packets={packets} 
            onAnalyze={handleAnalyze} 
            onResetAnalysis={handleResetAnalysis}
            isAnalyzing={isAnalyzing}
            analysisResult={analysisResult}
          />
        )}
      </main>

    </div>
  );
};

export default App;
