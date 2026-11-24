import React, { useMemo, useState } from 'react';
import { ProcessedPacket, NetworkStats } from '../types';
import { Shield, Search, List, BarChart2, MessageSquare, RefreshCw, Terminal, Cpu, Zap, Globe } from 'lucide-react';
import Overview from './Overview';
import { matchesPacketFilter, type PacketFilter } from '../utils/dashboardUtils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface DashboardProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  analysisError: string | null;
  stats: NetworkStats;
  packets: ProcessedPacket[];
  onAnalyze: (focus: string) => void;
  onResetAnalysis: () => void;
  isAnalyzing: boolean;
  analysisResult: string | null;
}

const Dashboard: React.FC<DashboardProps> = ({ apiKey, onApiKeyChange, analysisError, stats, packets, onAnalyze, onResetAnalysis, isAnalyzing, analysisResult }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'packets' | 'ai'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [userFocus, setUserFocus] = useState('');
  const [packetFilter, setPacketFilter] = useState<PacketFilter | null>(null);

  const [page, setPage] = useState(0);
  const filteredPackets = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return packets.filter(p => matchesPacketFilter(p, packetFilter) && [p.protocol, p.source, p.destination, p.info].some(value => value.toLowerCase().includes(query)));
  }, [packets, searchTerm, packetFilter]);
  const pageCount = Math.max(1, Math.ceil(filteredPackets.length / 100));
  const visiblePackets = filteredPackets.slice(page * 100, (page + 1) * 100);

  const handleFilter = (filter: PacketFilter) => {
    setPacketFilter(filter);
    setSearchTerm('');
    setPage(0);
    setActiveTab('packets');
  };
  const filterLabel = packetFilter && ('value' in packetFilter ? packetFilter.value : packetFilter.kind === 'other' ? 'Outros protocolos' : packetFilter.kind === 'retransmission' ? 'Retransmissões TCP' : 'Respostas DNS com erro');

  const handleAnalyzeClick = () => {
    onAnalyze(userFocus);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-white">Visão da captura</h1><p className="text-sm text-slate-400 mt-1">Explore o tráfego e encontre os pacotes por trás de cada indicador.</p></div>
        <span className="text-xs text-cyan-300 border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 rounded-full">{stats.totalPackets.toLocaleString('pt-BR')} pacotes importados</span>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-700 pb-2">
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
        
        {activeTab === 'overview' && <Overview stats={stats} onFilter={handleFilter} />}

        {activeTab === 'packets' && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden flex flex-col h-[600px]">
                <div className="p-4 border-b border-slate-700 flex flex-wrap items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input 
                            type="text" 
                            aria-label="Buscar pacotes"
                            placeholder="Buscar por IP, protocolo ou informação..." 
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                        />
                    </div>
                </div>
                {packetFilter && <div className="px-4 py-3 flex items-center gap-3 bg-cyan-500/10 text-sm text-cyan-200">
                    <span>Filtro: {filterLabel}</span>
                    <button onClick={() => { setPacketFilter(null); setPage(0); }} className="underline ml-auto">Limpar filtro</button>
                </div>}
                <div className="overflow-auto flex-1">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-slate-900 text-slate-400 sticky top-0">
                            <tr>
                                <th className="p-3 font-medium">No.</th>
                                <th className="p-3 font-medium">Horário</th>
                                <th className="p-3 font-medium">Origem</th>
                                <th className="p-3 font-medium">Destino</th>
                                <th className="p-3 font-medium">Protocolo</th>
                                <th className="p-3 font-medium">Bytes</th>
                                <th className="p-3 font-medium">Informação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {visiblePackets.map((packet, index) => (
                                <tr key={`${packet.id}-${page}-${index}`} className="hover:bg-slate-700/30 font-mono text-xs">
                                    <td className="p-3 text-slate-400">{packet.id}</td>
                                    <td className="p-3">{packet.time}</td>
                                    <td className="p-3 text-cyan-300">{packet.source}</td>
                                    <td className="p-3 text-purple-300">{packet.destination}</td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 ${
                                                packet.protocol === 'TCP' ? 'bg-green-900/40 text-green-300 border border-green-500/20' :
                                                packet.protocol === 'UDP' ? 'bg-orange-900/40 text-orange-300 border border-orange-500/20' :
                                                packet.protocol === 'HTTP' ? 'bg-blue-900/40 text-blue-300 border border-blue-500/20' :
                                                packet.protocol === 'DNS' ? 'bg-purple-900/40 text-purple-300 border border-purple-500/20' :
                                                'bg-slate-700/40 text-slate-300 border border-slate-500/20'
                                            }`}>
                                                
                                                {packet.protocol === 'UDP' && <Zap className="w-2.5 h-2.5" />}
                                                {packet.protocol === 'HTTP' && <Globe className="w-2.5 h-2.5" />}
                                                {packet.protocol === 'DNS' && <Search className="w-2.5 h-2.5" />}
                                                {packet.protocol}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-3 tabular-nums">{packet.length.toLocaleString('pt-BR')}</td>
                                    <td className="p-3 truncate max-w-[300px]" title={packet.info}>{packet.retransmission && <span className="text-amber-300 mr-2">[Retransmissão]</span>}{packet.dnsError && <span className="text-amber-300 mr-2">[Erro DNS]</span>}{packet.info}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredPackets.length === 0 && (
                        <div className="p-8 text-center text-slate-400">
                            Nenhum pacote encontrado para esta busca.
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-slate-700 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
                    <span>{filteredPackets.length.toLocaleString('pt-BR')} pacotes · Página {page + 1} de {pageCount}</span>
                    <div className="flex gap-3">
                        <button className="disabled:opacity-40" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Anterior</button>
                        <button className="disabled:opacity-40" disabled={page + 1 >= pageCount} onClick={() => setPage(p => p + 1)}>Próxima</button>
                    </div>
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
                                <label htmlFor="groq-key" className="block text-sm font-medium text-slate-300 mb-2">Chave da API Groq</label>
                                <input id="groq-key" type="password" autoComplete="off" spellCheck={false}
                                    value={apiKey} onChange={(e) => onApiKeyChange(e.target.value)} disabled={isAnalyzing}
                                    placeholder="gsk_..."
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500" />
                                <p className="text-xs text-slate-400 mt-2">A chave fica na memória até recarregar a página. <a className="text-cyan-400 underline" href="https://console.groq.com/keys" target="_blank" rel="noreferrer">Obter chave</a></p>
                                <p className="text-xs text-slate-400 mt-2">Ao iniciar, serão enviados à Groq IPs, horários, protocolos, tamanhos, estatísticas e o foco informado. Payloads e URLs HTTP não são enviados.</p>
                            </div>
                            {analysisError && <p role="alert" className="text-sm text-red-300 mb-4">{analysisError}</p>}
                            <div className="mb-6 text-left">
                                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-cyan-400" />
                                    Foco da Análise (Opcional)
                                </label>
                                <textarea
                                    maxLength={2000}
                                    disabled={isAnalyzing}
                                    value={userFocus}
                                    onChange={(e) => setUserFocus(e.target.value)}
                                    placeholder="Ex: Verificar por que o Wi-Fi está lento, analisar tráfego suspeito na porta 443, investigar perda de pacotes..."
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all h-32 resize-none placeholder-slate-600"
                                />
                            </div>

                            <button 
                                onClick={handleAnalyzeClick}
                                disabled={isAnalyzing || !apiKey.trim()}
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
                                    <div className="text-xs font-mono text-cyan-500/50 animate-pulse">
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