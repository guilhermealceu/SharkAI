import { parseWiresharkJSON } from '../utils/packetUtils';

self.onmessage = async (event: MessageEvent<File>) => {
  try {
    self.postMessage({ type: 'stage', stage: 'reading' });
    const text = await event.data.text();
    self.postMessage({ type: 'stage', stage: 'processing' });
    const result = parseWiresharkJSON(JSON.parse(text.replace(/^\uFEFF/, '')));
    self.postMessage({ type: 'success', result });
  } catch (error) {
    self.postMessage({
      type: 'error',
      message: error instanceof SyntaxError ? 'JSON inválido. Confira a exportação do Wireshark.'
        : error instanceof Error ? error.message : 'Não foi possível processar a captura.',
    });
  }
};
