import type { ProcessedPacket, NetworkStats } from '../types';
import { buildTimeline } from './dashboardUtils.ts';

type Fields = Record<string, unknown>;
const record = (value: unknown): Fields =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Fields : {};
const field = (value: unknown, fallback = ''): string => {
  if (Array.isArray(value)) return field(value[0], fallback);
  return typeof value === 'string' || typeof value === 'number' ? String(value) : fallback;
};
const number = (value: unknown, fallback: number): number => {
  const parsed = Number(field(value));
  return field(value) !== '' && Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : fallback;
};

const findField = (value: unknown, key: string, depth = 0): unknown => {
  if (depth > 20 || value === null || typeof value !== 'object') return undefined;
  const fields = record(value);
  if (Object.hasOwn(fields, key)) return fields[key];
  for (const nested of Object.values(value)) {
    const found = findField(nested, key, depth + 1);
    if (found !== undefined) return found;
  }
  return undefined;
};
const numericTime = (value: unknown): number | null => {
  const text = field(value);
  const parsed = Number(text);
  return text !== '' && Number.isFinite(parsed) && Math.abs(parsed) <= 8.64e12 ? parsed : null;
};
const timestamp = (frame: Fields, basis: string): number | null => {
  if (basis !== 'frame.time') return numericTime(frame[basis]);
  const parsed = Date.parse(field(frame['frame.time']).replace(/(\.\d{3})\d+/, '$1'));
  return Number.isFinite(parsed) ? parsed / 1000 : null;
};

export const parseWiresharkJSON = (jsonData: unknown): { packets: ProcessedPacket[], stats: NetworkStats } => {
  if (!Array.isArray(jsonData)) throw new Error('Formato inválido: esperado um array de pacotes do Wireshark.');
  const packets: ProcessedPacket[] = [];
  const protocols = new Map<string, number>();
  const addresses = new Map<string, NetworkStats['topTalkers'][number]>();
  // Keep one time basis for the entire capture; never mix epoch and relative seconds.
  const frames = jsonData.map(item => record(record(record(record(item)._source).layers).frame));
  const timeBasis = frames.some(frame => numericTime(frame['frame.time_epoch']) !== null) ? 'frame.time_epoch'
    : frames.some(frame => numericTime(frame['frame.time_relative']) !== null) ? 'frame.time_relative' : 'frame.time';
  jsonData.forEach((item, index) => {
    const layers = record(record(record(item)._source).layers);
    const frame = record(layers.frame);
    if (!Object.keys(frame).length) return;
    const stack = field(frame['frame.protocols']).split(':').filter(Boolean);
    const protocol = (stack.at(-1) || 'ETH').toUpperCase();
    const ip = record(layers.ip);
    const ipv6 = record(layers.ipv6);
    const eth = record(layers.eth);
    const sourceIP = field(ip['ip.src']) || field(ipv6['ipv6.src']);
    const destinationIP = field(ip['ip.dst']) || field(ipv6['ipv6.dst']);
    const source = sourceIP || field(eth['eth.src'], 'Desconhecido');
    const destination = destinationIP || field(eth['eth.dst'], 'Desconhecido');
    const http = record(layers.http);
    const transport = record(layers.tcp || layers.udp);
    const prefix = layers.tcp ? 'tcp' : 'udp';
    const length = number(frame['frame.len'], 0);
    for (const address of new Set([sourceIP, destinationIP].filter(Boolean))) {
      const entry = addresses.get(address) || { ip: address, count: 0, bytes: 0, sentBytes: 0, receivedBytes: 0 };
      entry.count++;
      entry.bytes += length;
      if (address === sourceIP) entry.sentBytes += length;
      if (address === destinationIP) entry.receivedBytes += length;
      addresses.set(address, entry);
    }
    const retransmission = ['tcp.analysis.retransmission', 'tcp.analysis.fast_retransmission', 'tcp.analysis.spurious_retransmission']
      .some(key => findField(layers.tcp, key) !== undefined);
    const dnsResponse = field(findField(layers.dns, 'dns.flags.response'));
    const dnsCode = field(findField(layers.dns, 'dns.flags.rcode'));
    const dnsResponseAvailable = ['1', 'true', 'True'].includes(dnsResponse) && dnsCode !== '' && Number.isFinite(Number(dnsCode));

    let info = `Len: ${length}`;
    if (layers.http) {
      info = `${field(http['http.request.method'], 'RESPONSE')} ${field(http['http.request.uri'])}`.trim();
    } else if (layers.dns) {
      const query = Object.entries(record(layers.dns)).find(([key]) => key.includes('qry.name'));
      info = query ? `DNS Query: ${field(query[1])}` : 'DNS Transaction';
    } else if (layers.tcp || layers.udp) {
      info = `${field(transport[`${prefix}.srcport`], '?')} → ${field(transport[`${prefix}.dstport`], '?')} [${protocol}]`;
    }
    protocols.set(protocol, (protocols.get(protocol) || 0) + 1);
    packets.push({
      id: number(frame['frame.number'], index + 1),
      time: field(frame['frame.time']) || field(frame['frame.time_epoch'], 'Desconhecido'),
      source, destination, protocol, length, info,
      timestamp: timestamp(frame, timeBasis), retransmission,
      tcpAnalysisAvailable: findField(layers.tcp, 'tcp.analysis') !== undefined || findField(layers.tcp, 'tcp.analysis.flags') !== undefined || retransmission,
      dnsResponseAvailable, dnsError: dnsResponseAvailable && Number(dnsCode) !== 0,
    });
  });
  if (!packets.length) throw new Error('Nenhum pacote válido encontrado. Exporte a captura como JSON pelo Wireshark.');
  return {
    packets,
    stats: {
      totalPackets: packets.length,
      protocolCounts: [...protocols].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      topTalkers: [...addresses.values()].sort((a, b) => b.count - a.count),
      ...buildTimeline(packets),
      retransmissions: packets.filter(p => p.retransmission).length,
      tcpAnalysisPackets: packets.filter(p => p.tcpAnalysisAvailable).length,
      dnsErrors: packets.filter(p => p.dnsError).length,
      dnsResponses: packets.filter(p => p.dnsResponseAvailable).length,
      startTime: packets[0].time,
      endTime: packets.at(-1)!.time,
      suspiciousIPs: [],
    },
  };
};

// Evenly distributed sample without changing capture order.
export const samplePackets = (packets: ProcessedPacket[], limit = 30): ProcessedPacket[] => {
  if (limit <= 0) return [];
  if (packets.length <= limit) return packets.slice();
  if (limit === 1) return [packets[0]];
  return Array.from({ length: limit }, (_, index) => packets[Math.floor(index * (packets.length - 1) / (limit - 1))]);
};
