import { test } from 'node:test';
import assert from 'node:assert/strict';
import { importCapture, MAX_CAPTURE_BYTES } from '../services/captureService.ts';

test('rejects captures above 250 MB before allocating a worker', async () => {
  assert.equal(MAX_CAPTURE_BYTES, 250 * 1024 * 1024);
  const file = { size: MAX_CAPTURE_BYTES + 1 } as File;
  await assert.rejects(importCapture(file, new AbortController().signal, () => {}), /250 MB/);
});

test('honors cancellation before reading the file', async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(importCapture({ size: 1 } as File, controller.signal, () => {}), { name: 'AbortError' });
});
