import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseWiresharkJSON, samplePackets } from '../utils/packetUtils.ts';

const packet = (frame = {}, layers = {}) => ({ _source: { layers: {
  frame: { 'frame.number': '1', 'frame.len': '60', 'frame.protocols': 'eth:ip:tcp', 'frame.time': 'now', ...frame },
  ip: { 'ip.src': '10.0.0.1', 'ip.dst': '10.0.0.2' }, ...layers,
} } });

test('rejects invalid and empty captures', () => {
  for (const input of [null, {}, [], [null, {}, { _source: {} }]]) {
    assert.throws(() => parseWiresharkJSON(input));
  }
});

test('normalizes arrays, IPv6 and malformed numeric fields', () => {
  const result = parseWiresharkJSON([null, packet(
    { 'frame.number': ['4'], 'frame.len': 'invalid', 'frame.protocols': ['eth:ipv6:udp:dns'] },
    { ip: undefined, ipv6: { 'ipv6.src': ['::1'], 'ipv6.dst': '::2' } },
  )]);
  assert.equal(result.packets[0].id, 4);
  assert.equal(result.packets[0].length, 0);
  assert.equal(result.packets[0].source, '::1');
  assert.deepEqual(result.stats.protocolCounts, [{ name: 'DNS', value: 1 }]);
  assert.equal(result.stats.topTalkers.length, 2);
});

test('counts self traffic once and never includes missing IPs', () => {
  const { stats } = parseWiresharkJSON([
    packet({}, { ip: { 'ip.src': '10.0.0.1', 'ip.dst': '10.0.0.1' } }),
    packet({}, { ip: {} }),
  ]);
  assert.deepEqual(stats.topTalkers, [{ ip: '10.0.0.1', count: 1, bytes: 60, sentBytes: 60, receivedBytes: 60 }]);
});

test('samples whole capture without mutation or duplicates', () => {
  const { packets } = parseWiresharkJSON(Array.from({ length: 101 }, (_, i) => packet({ 'frame.number': String(i + 1) })));
  const original = packets.map(p => p.id);
  const sample = samplePackets(packets);
  assert.equal(sample.length, 30);
  assert.equal(new Set(sample).size, 30);
  assert.equal(sample[0].id, 1);
  assert.equal(sample.at(-1)!.id, 101);
  assert.deepEqual(packets.map(p => p.id), original);
  assert.equal(samplePackets(packets.slice(0, 2)).length, 2);
  assert.deepEqual(samplePackets(packets, 0), []);
});
