import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseWiresharkJSON } from '../utils/packetUtils.ts';
import { formatRate, groupProtocols, matchesPacketFilter } from '../utils/dashboardUtils.ts';

const frame = (epoch: string | undefined, length = '100', layers = {}) => ({ _source: { layers: {
  frame: { 'frame.time_epoch': epoch, 'frame.len': length, 'frame.protocols': 'eth:ip:tcp' },
  ip: { 'ip.src': '192.0.2.1', 'ip.dst': '192.0.2.2' }, ...layers,
} } });

test('calculates bytes, true time extent and empty traffic intervals', () => {
  const { stats } = parseWiresharkJSON([frame('103', '200'), frame('100'), frame(undefined, '50')]);
  assert.equal(stats.totalBytes, 350);
  assert.equal(stats.durationSeconds, 3);
  assert.equal(stats.timedPackets, 2);
  assert.equal(stats.averageBitsPerSecond, 800);
  assert.deepEqual(stats.timeline.map(b => b.bytes), [100, 0, 0, 200]);
  assert.equal(stats.topTalkers[0].bytes, 350);
  assert.equal(stats.topTalkers[0].sentBytes, 350);
  assert.equal(stats.topTalkers[0].receivedBytes, 0);
});

test('handles absent and identical times without inventing a transfer rate', () => {
  const absent = parseWiresharkJSON([frame(undefined)]).stats;
  assert.equal(absent.durationSeconds, null);
  assert.equal(absent.averageBitsPerSecond, null);
  assert.deepEqual(absent.timeline, []);
  const identical = parseWiresharkJSON([frame('100'), frame('100')]).stats;
  assert.equal(identical.durationSeconds, 0);
  assert.equal(identical.averageBitsPerSecond, null);
});

test('bounds long captures and conserves all bytes and packets', () => {
  const { stats } = parseWiresharkJSON([frame('0'), frame('86400')]);
  assert.ok(stats.timeline.length <= 120);
  assert.equal(stats.timeline.reduce((sum, b) => sum + b.bytes, 0), 200);
  assert.equal(stats.timeline.reduce((sum, b) => sum + b.packets, 0), 2);
});

test('never mixes relative and absolute time bases', () => {
  const relative = frame(undefined);
  relative._source.layers.frame['frame.time_relative'] = '0';
  const { stats } = parseWiresharkJSON([frame('1720000000'), relative]);
  assert.equal(stats.timedPackets, 1);
  assert.equal(stats.durationSeconds, 0);
});

test('formats low transfer rates without invalid units', () => {
  assert.equal(formatRate(0.5), '0,5 bit/s');
  assert.equal(formatRate(1000), '1 kbit/s');
  assert.equal(formatRate(null), 'Indisponível');
});

test('detects nested retransmission flags once per packet and DNS response errors', () => {
  const { packets, stats } = parseWiresharkJSON([
    frame('0', '100', { tcp: { 'tcp.analysis': { 'tcp.analysis.flags': { 'tcp.analysis.retransmission': '', 'tcp.analysis.fast_retransmission': '' } } } }),
    frame('1', '100', { dns: { 'dns.flags': { 'dns.flags.response': '1', 'dns.flags.rcode': ['3'] } } }),
    frame('2', '100', { dns: { 'dns.flags.response': '1', 'dns.flags.rcode': '0' } }),
    frame('3', '100', { dns: { 'dns.flags.response': '0', 'dns.flags.rcode': '3' } }),
  ]);
  assert.equal(stats.retransmissions, 1);
  assert.equal(stats.dnsErrors, 1);
  assert.equal(stats.dnsResponses, 2);
  assert.equal(packets.filter(p => matchesPacketFilter(p, { kind: 'retransmission' })).length, 1);
  assert.equal(packets.filter(p => matchesPacketFilter(p, { kind: 'dnsError' })).length, 1);
});

test('groups every omitted protocol and filters IPs exactly', () => {
  const counts = Array.from({ length: 10 }, (_, i) => ({ name: `P${i}`, value: 10 - i }));
  const grouped = groupProtocols(counts);
  assert.equal(grouped.length, 8);
  assert.equal(grouped.at(-1)!.value, 6);
  assert.equal(grouped.reduce((sum, p) => sum + p.value, 0), 55);
  const { packets } = parseWiresharkJSON([frame('0')]);
  assert.equal(matchesPacketFilter(packets[0], { kind: 'ip', value: '192.0.2.1' }), true);
  assert.equal(matchesPacketFilter(packets[0], { kind: 'ip', value: '192.0.2' }), false);
  assert.equal(matchesPacketFilter(packets[0], { kind: 'protocol', value: 'TCP' }), true);
  assert.equal(matchesPacketFilter(packets[0], { kind: 'other', protocols: ['TCP'] }), false);
});
