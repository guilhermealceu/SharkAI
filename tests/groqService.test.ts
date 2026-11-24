import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeNetworkTraffic } from '../services/groqService.ts';
import { parseWiresharkJSON } from '../utils/packetUtils.ts';

const { packets, stats } = parseWiresharkJSON([{ _source: { layers: {
  frame: { 'frame.number': '1', 'frame.protocols': 'eth:ip:tcp:http' },
  ip: { 'ip.src': '10.0.0.1', 'ip.dst': '10.0.0.2' },
  http: { 'http.request.method': 'GET', 'http.request.uri': '/secret?token=private' },
} } }]);

test('requires key before making a request', async () => {
  await assert.rejects(analyzeNetworkTraffic(stats, packets, '', ''), /Informe sua chave/);
});

test('uses Groq and sends only allowed packet fields', async t => {
  t.mock.method(globalThis, 'fetch', async (url: string, options: RequestInit) => {
    assert.equal(url, 'https://api.groq.com/openai/v1/chat/completions');
    assert.equal((options.headers as Record<string, string>).Authorization, 'Bearer test-key');
    const body = JSON.parse(options.body as string);
    assert.equal(body.model, 'openai/gpt-oss-120b');
    const data = JSON.parse(body.messages[1].content);
    assert.equal(data.sample.length, 1);
    assert.ok(!JSON.stringify(data).includes('secret'));
    assert.ok(!JSON.stringify(data).includes('raw'));
    return Response.json({ choices: [{ message: { content: 'Relatório' } }] });
  });
  assert.equal(await analyzeNetworkTraffic(stats, packets, 'DNS', 'test-key'), 'Relatório');
});

test('shows recoverable errors for authentication, limits and empty results', async t => {
  for (const [status, expected] of [[401, /inválida/], [429, /Limite/], [500, /HTTP 500/]] as const) {
    const mock = t.mock.method(globalThis, 'fetch', async () => new Response('', { status }));
    await assert.rejects(analyzeNetworkTraffic(stats, packets, '', 'test-key'), expected);
    mock.mock.restore();
  }
  t.mock.method(globalThis, 'fetch', async () => Response.json({ choices: [] }));
  await assert.rejects(analyzeNetworkTraffic(stats, packets, '', 'test-key'), /vazia/);
});

test('handles network failures', async t => {
  t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('Failed to fetch'); });
  await assert.rejects(analyzeNetworkTraffic(stats, packets, '', 'test-key'), /conectar/);
});

test('explains inaccessible model errors without exposing API response data', async t => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({
    error: { code: 'model_not_found', message: 'private response details' },
  }, { status: 404 }));
  await assert.rejects(analyzeNetworkTraffic(stats, packets, '', 'test-key'), error => {
    assert.match((error as Error).message, /permissões de modelos/);
    assert.ok(!(error as Error).message.includes('private'));
    return true;
  });
});

test('handles non-JSON 404 responses', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response('Not Found', { status: 404 }));
  await assert.rejects(analyzeNetworkTraffic(stats, packets, '', 'test-key'), /recurso não encontrado/);
});
