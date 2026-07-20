import { WiresharkPacket, ProcessedPacket, NetworkStats } from '../types';

export const parseWiresharkJSON = (jsonData: any[]): { packets: ProcessedPacket[], stats: NetworkStats } => {
  const processed: ProcessedPacket[] = [];
  const protocolMap = new Map<string, number>();
  const ipMap = new Map<string, number>();
  
  jsonData.forEach((item: WiresharkPacket) => {
    const layers = item._source?.layers;
    if (!layers || !layers.frame) return;

    const frame = layers.frame;
    const ip = layers.ip;
    
    // Determine info string based on protocols
    let info = "";
    let src = "Ethernet";
    let dst = "Broadcast";
    let proto = "ETH";

    // Extract Protocols
    const protocols = frame["frame.protocols"]?.split(':').reverse() || ["Unknown"];
    proto = protocols[0].toUpperCase(); // Most specific protocol usually last in stack (but reversed here to be first) -> Actually wireshark lists eth:ip:tcp. So last is specific.
    // Let's fix protocol logic: Wireshark "frame.protocols" is like "eth:ethertype:ip:tcp:tls". We want the last one usually.
    const protoStack = frame["frame.protocols"]?.split(':') || [];
    proto = protoStack.length > 0 ? protoStack[protoStack.length - 1].toUpperCase() : "ETH";

    // Extract IP
    if (ip) {
      src = ip["ip.src"];
      dst = ip["ip.dst"];
      ipMap.set(src, (ipMap.get(src) || 0) + 1);
      ipMap.set(dst, (ipMap.get(dst) || 0) + 1);
    } else if (layers.ipv6) {
        src = layers.ipv6["ipv6.src"];
        dst = layers.ipv6["ipv6.dst"];
        ipMap.set(src, (ipMap.get(src) || 0) + 1);
        ipMap.set(dst, (ipMap.get(dst) || 0) + 1);
    } else if (layers.eth) {
        src = layers.eth["eth.src"];
        dst = layers.eth["eth.dst"];
    }

    // Basic Info construction
    if (layers.http) {
        info = `${layers.http["http.request.method"] || 'RESPONSE'} ${layers.http["http.request.uri"] || ''}`;
    } else if (layers.dns) {
        // Checking for standard query name if available, heavily dependent on wireshark export detail
        const query = Object.keys(layers.dns).find(k => k.includes("qry.name"));
        if(query) info = `DNS Query: ${layers.dns[query]}`;
        else info = "DNS Transaction";
    } else if (layers.tcp) {
        info = `${layers.tcp["tcp.srcport"]} -> ${layers.tcp["tcp.dstport"]} [${proto}]`;
    } else if (layers.udp) {
        info = `${layers.udp["udp.srcport"]} -> ${layers.udp["udp.dstport"]} [${proto}]`;
    } else {
        info = `Len: ${frame["frame.len"]}`;
    }

    protocolMap.set(proto, (protocolMap.get(proto) || 0) + 1);

    processed.push({
      id: parseInt(frame["frame.number"]),
      time: frame["frame.time"],
      source: src,
      destination: dst,
      protocol: proto,
      length: parseInt(frame["frame.len"]),
      info: info,
      raw: item
    });
  });

  // Sort and format stats
  const protocolCounts = Array.from(protocolMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const topTalkers = Array.from(ipMap.entries())
    .map(([ip, count]) => ({ ip, count }))
    .sort((a, b) => b.count - a.count);

  const stats: NetworkStats = {
    totalPackets: processed.length,
    protocolCounts,
    topTalkers,
    startTime: processed[0]?.time || '',
    endTime: processed[processed.length - 1]?.time || '',
    suspiciousIPs: [] // To be filled by simple heuristic or AI
  };

  return { packets: processed, stats };
};