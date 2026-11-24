import type { NetworkStats, ProcessedPacket } from '../types';

export type PacketFilter =
  | { kind: 'ip' | 'protocol'; value: string }
  | { kind: 'other'; protocols: string[] }
  | { kind: 'retransmission' | 'dnsError' };

export const matchesPacketFilter = (packet: ProcessedPacket, filter: PacketFilter | null): boolean => {
  if (!filter) return true;
  switch (filter.kind) {
    case 'ip': return packet.source === filter.value || packet.destination === filter.value;
    case 'protocol': return packet.protocol === filter.value;
    case 'other': return !filter.protocols.includes(packet.protocol);
    case 'retransmission': return packet.retransmission;
    case 'dnsError': return packet.dnsError;
  }
};

export const formatBytes = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const power = bytes > 0 ? Math.max(0, Math.min(Math.floor(Math.log(bytes) / Math.log(1000)), units.length - 1)) : 0;
  return `${(bytes / 1000 ** power).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ${units[power]}`;
};

export const formatRate = (bits: number | null): string => {
  if (bits === null) return 'Indisponível';
  const units = ['bit/s', 'kbit/s', 'Mbit/s', 'Gbit/s'];
  const power = bits > 0 ? Math.max(0, Math.min(Math.floor(Math.log(bits) / Math.log(1000)), units.length - 1)) : 0;
  return `${(bits / 1000 ** power).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ${units[power]}`;
};

export const buildTimeline = (packets: ProcessedPacket[]): Pick<NetworkStats,
  'totalBytes' | 'durationSeconds' | 'averageBitsPerSecond' | 'timedPackets' | 'timeline' | 'bucketSeconds'
> => {
  let start = Infinity;
  let end = -Infinity;
  let totalBytes = 0;
  let timedBytes = 0;
  let timedPackets = 0;
  for (const packet of packets) {
    totalBytes += packet.length;
    if (packet.timestamp !== null) {
      start = Math.min(start, packet.timestamp);
      end = Math.max(end, packet.timestamp);
      timedBytes += packet.length;
      timedPackets++;
    }
  }
  const durationSeconds = timedPackets ? end - start : null;
  // Bound chart size and include zero-traffic intervals.
  const bucketSeconds = Math.max(1, Math.ceil((durationSeconds ?? 0) / 119));
  const timeline = timedPackets ? Array.from({ length: Math.floor((durationSeconds ?? 0) / bucketSeconds) + 1 }, (_, index) => ({
    seconds: index * bucketSeconds, packets: 0, bytes: 0, bitsPerSecond: 0,
  })) : [];
  for (const packet of packets) {
    if (packet.timestamp === null) continue;
    const bucket = timeline[Math.floor((packet.timestamp - start) / bucketSeconds)];
    bucket.packets++;
    bucket.bytes += packet.length;
    bucket.bitsPerSecond = bucket.bytes * 8 / bucketSeconds;
  }
  return {
    totalBytes, durationSeconds, timedPackets, timeline, bucketSeconds,
    averageBitsPerSecond: durationSeconds !== null && durationSeconds > 0 ? timedBytes * 8 / durationSeconds : null,
  };
};

export const groupProtocols = (counts: NetworkStats['protocolCounts'], limit = 7) => {
  const main = counts.slice(0, limit).map(p => ({ ...p, other: false }));
  const rest = counts.slice(limit);
  return rest.length ? [...main, { name: 'Outros', value: rest.reduce((sum, p) => sum + p.value, 0), other: true }] : main;
};
