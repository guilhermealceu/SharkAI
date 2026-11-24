import type { CaptureData } from '../types';

export const MAX_CAPTURE_BYTES = 250 * 1024 * 1024;
export type ImportStage = 'reading' | 'processing';

export const importCapture = (file: File, signal: AbortSignal, onStage: (stage: ImportStage) => void): Promise<CaptureData> => {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_CAPTURE_BYTES) {
      reject(new Error('O limite de importação é 250 MB por arquivo.'));
      return;
    }
    if (signal.aborted) {
      reject(new DOMException('Importação cancelada.', 'AbortError'));
      return;
    }
    const worker = new Worker(new URL('../workers/captureWorker.ts', import.meta.url), { type: 'module' });
    const cleanup = () => {
      signal.removeEventListener('abort', abort);
      worker.terminate();
    };
    const abort = () => {
      cleanup();
      reject(new DOMException('Importação cancelada.', 'AbortError'));
    };
    signal.addEventListener('abort', abort, { once: true });
    worker.onmessage = event => {
      const message = event.data;
      if (message.type === 'stage') {
        onStage(message.stage);
      } else if (message.type === 'success') {
        cleanup();
        resolve(message.result);
      } else if (message.type === 'error') {
        cleanup();
        reject(new Error(message.message));
      }
    };
    worker.onerror = () => {
      cleanup();
      reject(new Error('Não foi possível processar a captura. Tente uma exportação menor ou feche outras abas para liberar memória.'));
    };
    try {
      worker.postMessage(file);
    } catch (error) {
      cleanup();
      reject(error);
    }
  });
};
