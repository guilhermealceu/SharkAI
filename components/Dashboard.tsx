import React, { useState } from 'react';
import { ProcessedPacket, NetworkStats } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Activity, Shield, Users, Clock, Search, List, BarChart2, MessageSquare, RefreshCw, Terminal, Cpu, HelpCircle, Info, Zap, Globe, Lock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface DashboardProps {
  stats: NetworkStats;
  packets: ProcessedPacket[];
  onAnalyze: (focus: string) => void;
  onResetAnalysis: () => void;
  isAnalyzing: boolean;
  analysisResult: string | null;
}

const COLORS = ['#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'];

const ProtocolInfo: Record<string, { title: string, desc: string, icon: React.ReactNode }> = {
    'TCP': { title: 'Conexão Segura', desc: 'Garante que os dados cheguem sem erros. Usado em sites e e-mails.', icon: <Lock className="w-4 h-4 text-green-400" /> },
    'UDP': { title: 'Fluxo Rápido', desc: 'Focado em velocidade. Comum em vídeos e jogos online.', icon: <Zap className="w-4 h-4 text-orange-400" /> },
    'HTTP': { title: 'Navegação Web', desc: 'O protocolo básico da internet para carregar sites.', icon: <Globe className="w-4 h-4 text-blue-400" /> },
    'DNS': { title: 'Lista Telefônica', desc: 'Traduz nomes de sites (google.com) em endereços IP.', icon: <Search className="w-4 h-4 text-purple-400" /> },
    'QUIC': { title: 'Internet Moderna', desc: 'Protocolo ultra-rápido do Google para carregamento instantâneo.', icon: <Zap className="w-4 h-4 text-cyan-400" /> },
    'TLS': { title: 'Criptografia', desc: 'Protege seus dados para que ninguém consiga ler no caminho.', icon: <Shield className="w-4 h-4 text-indigo-400" /> },
};

const Dashboard: React.FC<DashboardProps> = ({ stats, packets, onAnalyze, onResetAnalysis, isAnalyzing, analysisResult }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'packets' | 'ai'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [userFocus, setUserFocus] = useState('');
  const [showHelp, setShowHelp] = useState<string | null>(null);

  const filteredPackets = packets.filter(p => 
    p.protocol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.source.includes(searchTerm) ||
    p.destination.includes(searchTerm) ||
    p.info.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 100); // Limit rendered packets for performance

  const handleAnalyzeClick = () => {
    onAnalyze(userFocus);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      
      {/* Top Stats Cards - Bento Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="group bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 p-5 rounded-2xl transition-all hover:bg-slate-800/60 hover:border-blue-500/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <Activity className="w-12 h-12 text-blue-400" />
            </div>
            <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
                    <Activity className="w-5 h-5" />
                </div>
                <button onMouseEnter={() => setShowHelp('packets')} onMouseLeave={() => setShowHelp(null)} className="text-slate-500 hover:text-slate-300">
                    <HelpCircle className="w-4 h-4" />
                </button>
            </div>
            <div>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Volume de Dados</p>
                <p className="text-3xl font-bold text-white tabular-nums">{stats.totalPackets.toLocaleString()}</p>
                <p className="text-[10px] text-slate-500 mt-2 leading-tight">Total de "pedaços" de informação capturados na rede.</p>
            </div>
            {showHelp === 'packets' && (
                <div className="absolute inset-0 bg-slate-900/95 p-4 flex items-center text-xs text-slate-300 animate-in fade-in duration-200">
                    Pacotes são as unidades básicas de dados enviadas pela rede. Quanto mais pacotes, mais atividade está ocorrendo.
                </div>
            )}
        </div>

        <div className="group bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 p-5 rounded-2xl transition-all hover:bg-slate-800/60 hover:border-purple-500/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <Users className="w-12 h-12 text-purple-400" />
            </div>
            <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20">
                    <Users className="w-5 h-5" />
                </div>
                <button onMouseEnter={() => setShowHelp('talker')} onMouseLeave={() => setShowHelp(null)} className="text-slate-500 hover:text-slate-300">
                    <HelpCircle className="w-4 h-4" />
                </button>
            </div>
            <div>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Dispositivo Mais Ativo</p>
                <p className="text-xl font-bold text-white truncate">{stats.topTalkers[0]?.ip || 'N/A'}</p>
                <p className="text-[10px] text-slate-500 mt-2 leading-tight">O endereço IP que mais enviou ou recebeu informações.</p>
            </div>
            {showHelp === 'talker' && (
                <div className="absolute inset-0 bg-slate-900/95 p-4 flex items-center text-xs text-slate-300 animate-in fade-in duration-200">
                    O "Top Talker" identifica qual aparelho (computador, celular, TV) está consumindo mais tráfego no momento.
                </div>
            )}
        </div>

        <div className="group bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 p-5 rounded-2xl transition-all hover:bg-slate-800/60 hover:border-green-500/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <Shield className="w-12 h-12 text-green-400" />
            </div>
            <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 bg-green-500/10 rounded-xl text-green-400 border border-green-500/20">
                    <Shield className="w-5 h-5" />
                </div>
                <button onMouseEnter={() => setShowHelp('proto')} onMouseLeave={() => setShowHelp(null)} className="text-slate-500 hover:text-slate-300">
                    <HelpCircle className="w-4 h-4" />
                </button>
            </div>
            <div>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Linguagem Principal</p>
                <p className="text-3xl font-bold text-white">{stats.protocolCounts[0]?.name || 'N/A'}</p>
                <p className="text-[10px] text-slate-500 mt-2 leading-tight">O protocolo (idioma) mais utilizado pelos dispositivos.</p>
            </div>
            {showHelp === 'proto' && (
                <div className="absolute inset-0 bg-slate-900/95 p-4 flex items-center text-xs text-slate-300 animate-in fade-in duration-200">
                    Protocolos são regras que definem como os dados são transmitidos. Diferentes apps usam diferentes protocolos.
                </div>
            )}
        </div>

        <div className="group bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 p-5 rounded-2xl transition-all hover:bg-slate-800/60 hover:border-orange-500/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <Clock className="w-12 h-12 text-orange-400" />
            </div>
            <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 bg-orange-500/10 rounded-xl text-orange-400 border border-orange-500/20">
                    <Clock className="w-5 h-5" />
                </div>
                <button onMouseEnter={() => setShowHelp('time')} onMouseLeave={() => setShowHelp(null)} className="text-slate-500 hover:text-slate-300">
                    <HelpCircle className="w-4 h-4" />
                </button>
            </div>
            <div>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Início da Captura</p>
                <p className="text-sm font-bold text-white truncate">{stats.startTime.split('.')[0]}</p>
                <p className="text-[10px] text-slate-500 mt-2 leading-tight">O momento exato em que o Wireshark começou a gravar.</p>
            </div>
            {showHelp === 'time' && (
                <div className="absolute inset-0 bg-slate-900/95 p-4 flex items-center text-xs text-slate-300 animate-in fade-in duration-200">
                    Mostra o horário local do primeiro pacote registrado nesta análise.
                </div>
            )}
        </div>
      </div>

      {/* Quick Insights - Layman Friendly */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 p-4 rounded-2xl flex items-center gap-4">
          <div className="p-2 bg-cyan-500/20 rounded-full">
              <Zap className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="flex-1">
              <p className="text-sm font-bold text-white">Resumo Rápido</p>
              <p className="text-xs text-slate-400">
                  Sua rede está processando <span className="text-cyan-400 font-bold">{stats.totalPackets}</span> pacotes. 
                  O tráfego é dominado por <span className="text-purple-400 font-bold">{stats.protocolCounts[0]?.name}</span>, 
                  o que sugere atividade de <span className="text-white italic">{ProtocolInfo[stats.protocolCounts[0]?.name]?.title || 'comunicação padrão'}</span>.
              </p>
          </div>
          <div className="hidden md:block px-3 py-1 bg-slate-900/50 border border-slate-700 rounded-full text-[10px] text-slate-400 font-mono">
              STATUS: OPERACIONAL
          </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-4 border-b border-slate-700 pb-2">
        <button 
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${activeTab === 'overview' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}
        >
            <BarChart2 className="w-4 h-4" /> Visão Geral
        </button>
        <button 
            onClick={() => setActiveTab('packets')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${activeTab === 'packets' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}
        >
            <List className="w-4 h-4" /> Lista de Pacotes
        </button>
        <button 
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${activeTab === 'ai' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-white'}`}
        >
            <Shield className="w-4 h-4" /> Análise IA
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        
        {activeTab === 'overview' && (
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-white">Distribuição de Protocolos</h3>
                                <p className="text-xs text-slate-500">Quais "idiomas" sua rede está falando agora.</p>
                            </div>
                            <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
                                <BarChart2 className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.protocolCounts.slice(0, 8)}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {stats.protocolCounts.slice(0, 8).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.1)" />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                            {stats.protocolCounts.slice(0, 4).map((p, i) => (
                                <div key={p.name} className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/50 border border-slate-700/30">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                    <span className="text-[10px] font-bold text-slate-300">{p.name}</span>
                                    <span className="text-[10px] text-slate-500 ml-auto">{((p.value / stats.totalPackets) * 100).toFixed(1)}%</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-white">Guia de Protocolos</h3>
                                <p className="text-xs text-slate-500">Entenda o que cada sigla significa.</p>
                            </div>
                            <Info className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="space-y-4 overflow-auto max-h-[350px] pr-2 custom-scrollbar">
                            {stats.protocolCounts.slice(0, 6).map((p) => {
                                const info = ProtocolInfo[p.name] || { title: p.name, desc: 'Protocolo de comunicação de dados.', icon: <Terminal className="w-4 h-4 text-slate-400" /> };
                                return (
                                    <div key={p.name} className="p-3 rounded-xl bg-slate-900/40 border border-slate-700/30 hover:border-slate-600 transition-colors">
                                        <div className="flex items-center gap-3 mb-1">
                                            <div className="p-1.5 bg-slate-800 rounded-lg">
                                                {info.icon}
                                            </div>
                                            <span className="text-xs font-bold text-white">{info.title}</span>
                                            <span className="text-[10px] font-mono text-slate-500 ml-auto">{p.name}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 leading-relaxed">{info.desc}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-white">Top Dispositivos (IPs)</h3>
                            <p className="text-xs text-slate-500">Quem está gerando mais tráfego na rede.</p>
                        </div>
                        <Users className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.topTalkers.slice(0, 10)} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <XAxis 
                                    dataKey="ip" 
                                    stroke="#475569" 
                                    fontSize={10} 
                                    tickLine={false} 
                                    axisLine={false}
                                    interval={0}
                                    angle={-25}
                                    textAnchor="end"
                                    height={60}
                                />
                                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                                />
                                <Bar dataKey="count" fill="url(#colorBar)" radius={[6, 6, 0, 0]} />
                                <defs>
                                    <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'packets' && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden flex flex-col h-[600px]">
                <div className="p-4 border-b border-slate-700 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input 
                            type="text" 
                            placeholder="Buscar por IP, Protocolo ou Info..." 
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="overflow-auto flex-1">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-slate-900 text-slate-400 sticky top-0">
                            <tr>
                                <th className="p-3 font-medium">No.</th>
                                <th className="p-3 font-medium">Time</th>
                                <th className="p-3 font-medium">Source</th>
                                <th className="p-3 font-medium">Destination</th>
                                <th className="p-3 font-medium">Protocol</th>
                                <th className="p-3 font-medium">Info</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {filteredPackets.map((packet) => (
                                <tr key={packet.id} className="hover:bg-slate-700/30 font-mono text-xs">
                                    <td className="p-3 text-slate-500">{packet.id}</td>
                                    <td className="p-3">{packet.time}</td>
                                    <td className="p-3 text-cyan-300">{packet.source}</td>
                                    <td className="p-3 text-purple-300">{packet.destination}</td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                                                packet.protocol === 'TCP' ? 'bg-green-900/40 text-green-300 border border-green-500/20' :
                                                packet.protocol === 'UDP' ? 'bg-orange-900/40 text-orange-300 border border-orange-500/20' :
                                                packet.protocol === 'HTTP' ? 'bg-blue-900/40 text-blue-300 border border-blue-500/20' :
                                                packet.protocol === 'DNS' ? 'bg-purple-900/40 text-purple-300 border border-purple-500/20' :
                                                'bg-slate-700/40 text-slate-300 border border-slate-500/20'
                                            }`}>
                                                {packet.protocol === 'TCP' && <Lock className="w-2.5 h-2.5" />}
                                                {packet.protocol === 'UDP' && <Zap className="w-2.5 h-2.5" />}
                                                {packet.protocol === 'HTTP' && <Globe className="w-2.5 h-2.5" />}
                                                {packet.protocol === 'DNS' && <Search className="w-2.5 h-2.5" />}
                                                {packet.protocol}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-3 truncate max-w-[300px]" title={packet.info}>{packet.info}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredPackets.length === 0 && (
                        <div className="p-8 text-center text-slate-500">
                            Nenhum pacote encontrado para esta busca.
                        </div>
                    )}
                </div>
            </div>
        )}

        {activeTab === 'ai' && (
            <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl min-h-[500px]">
                {!analysisResult ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-8">
                        <div className="bg-slate-700/50 p-6 rounded-full">
                            <Shield className="w-16 h-16 text-cyan-400" />
                        </div>
                        <div className="max-w-xl w-full">
                            <h3 className="text-xl font-bold text-white mb-2">Solicitar Análise de IA</h3>
                            <p className="text-slate-400 mb-6">
                                A IA analisará estatísticas gerais e uma amostra dos pacotes. Defina um foco para resultados mais precisos.
                            </p>
                            
                            <div className="mb-6 text-left">
                                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-cyan-400" />
                                    Foco da Análise (Opcional)
                                </label>
                                <textarea
                                    value={userFocus}
                                    onChange={(e) => setUserFocus(e.target.value)}
                                    placeholder="Ex: Verificar por que o Wi-Fi está lento, analisar tráfego suspeito na porta 443, investigar perda de pacotes..."
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all h-32 resize-none placeholder-slate-600"
                                />
                            </div>

                            <button 
                                onClick={handleAnalyzeClick}
                                disabled={isAnalyzing}
                                className="w-full px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                                        Analisando Tráfego...
                                    </>
                                ) : (
                                    <>
                                        <Shield className="w-5 h-5" />
                                        Iniciar Análise Inteligente
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="w-full max-w-4xl mx-auto">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-slate-700/50 pb-6 gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-500/20 rounded-xl border border-purple-500/30">
                                    <Cpu className="w-6 h-6 text-purple-400 animate-pulse" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white tracking-tight m-0">Relatório de Inteligência</h2>
                                    {userFocus && (
                                        <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                                            <Terminal className="w-3 h-3 text-cyan-400" />
                                            Foco: <span className="text-cyan-300 italic">"{userFocus}"</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button 
                                onClick={onResetAnalysis} 
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-white flex items-center gap-2 transition-all hover:border-cyan-500/50"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Nova Consulta
                            </button>
                        </div>
                        
                        <div className="relative">
                            {/* Decorative elements */}
                            <div className="absolute -top-4 -left-4 w-8 h-8 border-t-2 border-l-2 border-cyan-500/30 rounded-tl-lg"></div>
                            <div className="absolute -bottom-4 -right-4 w-8 h-8 border-b-2 border-r-2 border-purple-500/30 rounded-br-lg"></div>
                            
                            <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl shadow-purple-500/5 overflow-hidden">
                                <div className="bg-slate-800/50 border-b border-slate-700/50 px-6 py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1.5">
                                            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                                            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                                            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                                        </div>
                                        <span className="text-xs font-mono text-slate-400 ml-2 uppercase tracking-widest">Análise do Sistema</span>
                                    </div>
                                    <div className="text-[10px] font-mono text-cyan-500/50 animate-pulse">
                                        AI_ENGINE_ACTIVE
                                    </div>
                                </div>
                                <div className="p-8">
                                    <div className="markdown-body prose prose-invert max-w-none 
                                        prose-headings:text-white prose-headings:font-bold prose-headings:tracking-tight
                                        prose-p:text-slate-300 prose-p:leading-relaxed
                                        prose-strong:text-cyan-400 prose-strong:font-semibold
                                        prose-ul:list-disc prose-ul:pl-6
                                        prose-li:text-slate-300 prose-li:my-1
                                        prose-code:bg-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-cyan-300 prose-code:before:content-none prose-code:after:content-none
                                        prose-table:border-collapse prose-table:w-full
                                        prose-th:border prose-th:border-slate-700 prose-th:p-2 prose-th:bg-slate-800/50
                                        prose-td:border prose-td:border-slate-700 prose-td:p-2
                                    ">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {analysisResult}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;