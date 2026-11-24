// Simplified structure of a Wireshark JSON export
export interface WiresharkPacket {
  _index: string;
  _type: string;
  _score:  number | null;
  _source: {
    layers: {
      frame: {
        "frame.number": string;
        "frame.time": string;
        "frame.len": string;
        "frame.protocols": string;
        [key: string]: any;
      };
      ip?: {
        "ip.src": string;
        "ip.dst": string;
        "ip.proto": string;
        [key: string]: any;
      };
      tcp?: {
        "tcp.srcport": string;
        "tcp.dstport": string;
        "tcp.flags": string;
        [key: string]: any;
      };
      udp?: {
        "udp.srcport": string;
        "udp.dstport": string;
        [key: string]: any;
      };
      http?: {
        "http.request.method"?: string;
        "http.request.uri"?: string;
        "http.user_agent"?: string;
        [key: string]: any;
      };
      [key: string]: any;
    };
  };
}

export interface ProcessedPacket {
  id: number;
  time: string;
  source: string;
  destination: string;
  protocol: string;
  length: number;
  info: string;
  timestamp: number | null;
  retransmission: boolean;
  dnsError: boolean;
  tcpAnalysisAvailable: boolean;
  dnsResponseAvailable: boolean;
}

export interface CaptureData {
  packets: ProcessedPacket[];
  stats: NetworkStats;
}

export interface NetworkStats {
  totalPackets: number;
  protocolCounts: { name: string; value: number }[];
  topTalkers: { ip: string; count: number; bytes: number; sentBytes: number; receivedBytes: number }[];
  totalBytes: number;
  durationSeconds: number | null;
  averageBitsPerSecond: number | null;
  timedPackets: number;
  timeline: { seconds: number; packets: number; bytes: number; bitsPerSecond: number }[];
  bucketSeconds: number;
  retransmissions: number;
  tcpAnalysisPackets: number;
  dnsErrors: number;
  dnsResponses: number;
  startTime: string;
  endTime: string;
  suspiciousIPs: string[];
}

export enum AppState {
  UPLOAD = 'UPLOAD',
  DASHBOARD = 'DASHBOARD',
}
