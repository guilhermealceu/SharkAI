import React, { useState } from 'react';
import UploadSection from './components/UploadSection';
import Dashboard from './components/Dashboard';
import { parseWiresharkJSON } from './utils/packetUtils';
import { analyzeNetworkTraffic } from './services/geminiService';
import { AppState, NetworkStats, ProcessedPacket } from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.UPLOAD);
  const [packets, setPackets] = useState<ProcessedPacket[]>([]);
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // AI State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const handleDataLoaded = (jsonData: any[]) => {
    setIsLoading(true);
    // Simulate slight delay for processing UX
    setTimeout(() => {
      const { packets: parsedPackets, stats: parsedStats } = parseWiresharkJSON(jsonData);
      setPackets(parsedPackets);
      setStats(parsedStats);
      setAppState(AppState.DASHBOARD);
      setIsLoading(false);
    }, 800);
  };

  const handleAnalyze = async (focus: string = "") => {
    if (!stats || packets.length === 0) return;
    setIsAnalyzing(true);
    
    // Create a sample of packets: first 15 + 15 random ones from the middle
    const sample = [
        ...packets.slice(0, 15),
        ...packets.sort(() => 0.5 - Math.random()).slice(0, 15)
    ];

    const result = await analyzeNetworkTraffic(stats, sample, focus);
    setAnalysisResult(result);
    setIsAnalyzing(false);
  };

  const handleResetAnalysis = () => {
    setAnalysisResult(null);
  };

  const handleReset = () => {
    setAppState(AppState.UPLOAD);
    setPackets([]);
    setStats(null);
    setAnalysisResult(null);
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
      <main className="relative">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

        {appState === AppState.UPLOAD && (
          <UploadSection onDataLoaded={handleDataLoaded} isLoading={isLoading} />
        )}

        {appState === AppState.DASHBOARD && stats && (
          <Dashboard 
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