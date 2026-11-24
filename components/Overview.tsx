import React, { useMemo, useState } from 'react';
import { Activity, Clock, Database, Gauge, Search } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { NetworkStats } from '../types';
import { formatBytes, formatRate, groupProtocols, type PacketFilter } from '../utils/dashboardUtils';

interface OverviewProps {
  stats: NetworkStats;
  onFilter: (filter: PacketFilter) => void;
}

const colors = ['#22d3ee', '#818cf8', '#c084fc', '#f472b6', '#fb923c', '#facc15', '#34d399', '#94a3b8'];
const tooltipStyle = { backgroundColor: '#0f172a', border: '1px solid #475569', borderRadius: 12, color: '#e2e8f0' };
const panel = 'bg-slate-800/40 border border-slate-700/60 p-5 md:p-6 rounded-2xl';
const integer = (value: number) => value.toLocaleString('pt-BR');
const duration = (seconds: number | null) => {
  if (seconds === null) return 'Indisponível';
  if (seconds < 60) return `${seconds.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} s`;
  return `${Math.floor(seconds / 60)} min ${(seconds % 60).toFixed(0)} s`;
};

const Overview: React.FC<OverviewProps> = ({ stats, onFilter }) => {
  const [rankingMetric, setRankingMetric] = useState<'bytes' | 'count'>('bytes');
  const [timelineMetric, setTimelineMetric] = useState<'bitsPerSecond' | 'packets'>('bitsPerSecond');
  const [showGuide, setShowGuide] = useState(false);
  const protocols = useMemo(() => groupProtocols(stats.protocolCounts), [stats.protocolCounts]);
  const ranking = useMemo(() => [...stats.topTalkers].sort((a, b) => b[rankingMetric] - a[rankingMetric]).slice(0, 10), [stats.topTalkers, rankingMetric]);
  const filterProtocol = (name: string, other: boolean) => onFilter(other
    ? { kind: 'other', protocols: protocols.filter(p => !p.other).map(p => p.name) }
    : { kind: 'protocol', value: name });
  const cards = [
    { title: 'Pacotes', value: integer(stats.totalPackets), detail: 'Total de frames importados', icon: Activity },
    { title: 'Volume dos frames', value: formatBytes(stats.totalBytes), detail: 'Soma dos tamanhos informados na captura', icon: Database },
    { title: 'Duração', value: duration(stats.durationSeconds), detail: 'Intervalo entre o primeiro e o último horário válido', icon: Clock },
    { title: 'Taxa média', value: formatRate(stats.averageBitsPerSecond), detail: 'Volume com horário válido ÷ duração', icon: Gauge },
  ];

  return <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map(card => <div key={card.title} className={panel}>
        <div className="flex justify-between items-center mb-4"><span className="text-sm text-slate-300">{card.title}</span><card.icon aria-hidden="true" className="w-5 h-5 text-cyan-400" /></div>
        <p className="text-2xl font-bold text-white tabular-nums">{card.value}</p>
        <p className="text-xs text-slate-400 mt-2">{card.detail}</p>
      </div>)}
    </div>

    <section className={panel} aria-labelledby="timeline-title">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div><h2 id="timeline-title" className="text-lg font-semibold text-white">Tráfego ao longo da captura</h2>
          <p className="text-sm text-slate-400 mt-1">Tempo desde o primeiro pacote · intervalos de {stats.bucketSeconds} s</p></div>
        <div className="flex gap-2" aria-label="Métrica da linha do tempo">
          {(['bitsPerSecond', 'packets'] as const).map(metric => <button key={metric} aria-pressed={timelineMetric === metric} onClick={() => setTimelineMetric(metric)} className={`px-3 py-2 rounded-lg text-sm ${timelineMetric === metric ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-900 text-slate-300'}`}>{metric === 'packets' ? 'Pacotes' : 'Taxa de tráfego'}</button>)}
        </div>
      </div>
      {stats.timeline.length > 0 && (stats.durationSeconds ?? 0) > 0 ? <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={stats.timeline} margin={{ top: 10, right: 16, left: 8, bottom: 0 }}>
            <defs><linearGradient id="traffic-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} /><stop offset="100%" stopColor="#22d3ee" stopOpacity={0.02} /></linearGradient></defs>
            <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="seconds" stroke="#94a3b8" fontSize={12} tickFormatter={v => `${v}s`} minTickGap={35} />
            <YAxis stroke="#94a3b8" fontSize={12} width={90} tickFormatter={v => timelineMetric === 'packets' ? integer(Number(v)) : formatRate(Number(v))} allowDecimals={timelineMetric !== 'packets'} />
            <Tooltip contentStyle={tooltipStyle} labelFormatter={v => `Intervalo a partir de ${v} s`} formatter={v => [timelineMetric === 'packets' ? integer(Number(v)) : formatRate(Number(v)), timelineMetric === 'packets' ? 'Pacotes no intervalo' : 'Taxa no intervalo']} />
            <Area type="stepAfter" dataKey={timelineMetric} stroke="#22d3ee" fill="url(#traffic-fill)" strokeWidth={2} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div> : <p className="py-12 text-center text-slate-400">A captura não possui horários distintos suficientes para calcular a evolução do tráfego.</p>}
      <p className="text-xs text-slate-400 mt-3">{integer(stats.timedPackets)} de {integer(stats.totalPackets)} pacotes com horário válido. Taxas representam o tráfego observado na captura, não a velocidade contratada da internet.</p>
    </section>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <section className={panel} aria-labelledby="protocol-title">
        <h2 id="protocol-title" className="text-lg font-semibold text-white">Distribuição de protocolos</h2>
        <p className="text-sm text-slate-400 mt-1">Participação por pacotes. Clique para investigar.</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%"><PieChart>
            <Pie data={protocols} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2} isAnimationActive={false} onClick={(_, index) => filterProtocol(protocols[index].name, protocols[index].other)} style={{ cursor: 'pointer' }}>
              {protocols.map((p, i) => <Cell key={p.name} fill={colors[i]} stroke="#0f172a" />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={v => [integer(Number(v)), 'Pacotes']} />
          </PieChart></ResponsiveContainer>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {protocols.map((p, i) => <button key={`${p.name}-${p.other}`} onClick={() => filterProtocol(p.name, p.other)} className="flex items-center gap-2 rounded-lg bg-slate-900/60 border border-slate-700 px-3 py-2 text-sm hover:border-cyan-500 text-left">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colors[i] }} />
            <span className="text-slate-200 truncate">{p.name}</span><span className="ml-auto text-slate-400 tabular-nums">{(p.value / stats.totalPackets * 100).toFixed(1)}%</span>
          </button>)}
        </div>
      </section>

      <section className={panel} aria-labelledby="ranking-title">
        <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
          <div><h2 id="ranking-title" className="text-lg font-semibold text-white">IPs mais ativos</h2><p className="text-sm text-slate-400 mt-1">Enviados + recebidos. Clique para filtrar.</p></div>
          <div className="flex gap-2">{(['bytes', 'count'] as const).map(metric => <button key={metric} aria-pressed={rankingMetric === metric} onClick={() => setRankingMetric(metric)} className={`text-sm px-3 py-2 rounded-lg ${rankingMetric === metric ? 'text-cyan-300 bg-cyan-500/20' : 'text-slate-300 bg-slate-900'}`}>{metric === 'bytes' ? 'Bytes' : 'Pacotes'}</button>)}</div>
        </div>
        {ranking.length ? <>
          <div style={{ height: Math.max(160, ranking.length * 38) }}>
            <ResponsiveContainer width="100%" height="100%"><BarChart data={ranking} layout="vertical" margin={{ left: 0, right: 16, bottom: 0 }}>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" stroke="#94a3b8" fontSize={12} tickFormatter={v => rankingMetric === 'bytes' ? formatBytes(Number(v)) : integer(Number(v))} allowDecimals={false} />
              <YAxis type="category" dataKey="ip" width={110} stroke="#94a3b8" fontSize={12} tickLine={false} tickFormatter={v => String(v).length > 15 ? `${String(v).slice(0, 13)}…` : String(v)} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#33415544' }} formatter={v => [rankingMetric === 'bytes' ? formatBytes(Number(v)) : integer(Number(v)), rankingMetric === 'bytes' ? 'Volume' : 'Pacotes']} />
              <Bar dataKey={rankingMetric} fill="#818cf8" radius={[0, 4, 4, 0]} isAnimationActive={false} onClick={(_, index) => onFilter({ kind: 'ip', value: ranking[index].ip })} style={{ cursor: 'pointer' }} />
            </BarChart></ResponsiveContainer>
          </div>
          <details className="mt-4 text-sm text-slate-300">
            <summary className="cursor-pointer hover:text-cyan-300">Ver IPs completos e volumes por direção</summary>
            <div className="mt-2 space-y-1">
            {ranking.map(ip => <button key={ip.ip} onClick={() => onFilter({ kind: 'ip', value: ip.ip })} className="w-full flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 rounded px-2 py-1.5 hover:bg-slate-700/50">
              <span className="font-mono break-all">{ip.ip}</span><span className="text-slate-400">↑ {formatBytes(ip.sentBytes)} · ↓ {formatBytes(ip.receivedBytes)}</span>
            </button>)}
            </div>
          </details>
        </> : <p className="py-12 text-center text-slate-400">Nenhum endereço IPv4 ou IPv6 encontrado.</p>}
        <p className="text-xs text-slate-400 mt-3">Um frame entre dois IPs participa do volume de ambos. IPs não equivalem necessariamente a dispositivos distintos.</p>
      </section>
    </div>

    <section className={panel} aria-labelledby="signals-title">
      <h2 id="signals-title" className="text-lg font-semibold text-white">Sinais para investigar</h2>
      <p className="text-sm text-slate-400 mt-1 mb-4">Baseados nos campos exportados pelo Wireshark.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button onClick={() => onFilter({ kind: 'retransmission' })} disabled={!stats.retransmissions} className="p-4 rounded-xl border border-slate-700 bg-slate-900/50 text-left enabled:hover:border-amber-400">
          <p className="text-sm text-slate-300">Retransmissões TCP sinalizadas</p><p className="text-2xl font-semibold text-amber-300 mt-2">{stats.tcpAnalysisPackets ? integer(stats.retransmissions) : 'Não informado'}</p>
          <p className="text-xs text-slate-400 mt-2">{stats.tcpAnalysisPackets ? 'Pacotes marcados como retransmissão pelo Wireshark. Clique para ver.' : 'A exportação não contém indicadores de análise TCP.'}</p>
        </button>
        <button onClick={() => onFilter({ kind: 'dnsError' })} disabled={!stats.dnsErrors} className="p-4 rounded-xl border border-slate-700 bg-slate-900/50 text-left enabled:hover:border-amber-400">
          <p className="text-sm text-slate-300">Respostas DNS com erro</p><p className="text-2xl font-semibold text-amber-300 mt-2">{stats.dnsResponses ? `${integer(stats.dnsErrors)} / ${integer(stats.dnsResponses)}` : 'Não informado'}</p>
          <p className="text-xs text-slate-400 mt-2">{stats.dnsResponses ? 'Respostas com código diferente de zero. Clique para ver.' : 'Nenhuma resposta DNS com código de retorno disponível.'}</p>
        </button>
      </div>
      <p className="text-xs text-slate-400 mt-4">Ausência de indicadores não comprova uma rede sem problemas. Retransmissões e erros DNS exigem contexto para determinar a causa.</p>
    </section>

    <section className={panel}>
      <button aria-expanded={showGuide} onClick={() => setShowGuide(!showGuide)} className="flex items-center justify-between w-full text-sm text-slate-200"><span className="flex items-center gap-2"><Search className="w-4 h-4 text-cyan-400" />Guia de protocolos</span><span>{showGuide ? 'Recolher' : 'Expandir'}</span></button>
      {showGuide && <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        {[
          ['TCP', 'Entrega ordenada com retransmissão de perdas; não fornece criptografia.'],
          ['UDP', 'Transporte sem garantia de entrega; utilizado em aplicações que priorizam baixa latência.'],
          ['DNS', 'Resolve nomes em endereços e outros registros.'],
          ['HTTP', 'Troca requisições e respostas de aplicações web.'],
          ['TLS', 'Protege a comunicação com criptografia.'],
          ['QUIC', 'Transporte sobre UDP com criptografia e múltiplos fluxos.'],
        ].map(([name, description]) => <div key={name}><dt className="font-semibold text-cyan-300">{name}</dt><dd className="mt-1 text-slate-400">{description}</dd></div>)}
      </dl>}
    </section>
  </div>;
};

export default Overview;
