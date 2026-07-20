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
  raw: any;
}

export interface NetworkStats {
  totalPackets: number;
  protocolCounts: { name: string; value: number }[];
  topTalkers: { ip: string; count: number }[];
  startTime: string;
  endTime: string;
  suspiciousIPs: string[];
}

export enum AppState {
  UPLOAD = 'UPLOAD',
  DASHBOARD = 'DASHBOARD',
}