import React, { useEffect, useRef, useState } from 'react';
import { Upload, FileJson, AlertTriangle } from 'lucide-react';
import { importCapture, MAX_CAPTURE_BYTES, type ImportStage } from '../services/captureService';
import type { CaptureData } from '../types';

interface UploadSectionProps {
  onDataLoaded: (data: CaptureData) => void;
  isLoading: boolean;
}

const UploadSection: React.FC<UploadSectionProps> = ({ onDataLoaded, isLoading }) => {
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [isReading, setIsReading] = useState(false);
  const reading = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const [stage, setStage] = useState<ImportStage>('reading');
  useEffect(() => () => controller.current?.abort(), []);
  const busy = isLoading || isReading;

  const handleFile = async (file?: File) => {
    if (!file || reading.current || isLoading) return;
    if (!file.name.toLowerCase().endsWith('.json')) {
      setError('Envie um arquivo JSON exportado do Wireshark.');
      return;
    }
    if (file.size > MAX_CAPTURE_BYTES) {
      setError('O limite de importação é 250 MB por arquivo.');
      return;
    }
    reading.current = true;
    setIsReading(true);
    setError(null);
    const request = new AbortController();
    controller.current = request;
    setStage('reading');
    try {
      const data = await importCapture(file, request.signal, setStage);
      if (!request.signal.aborted) onDataLoaded(data);
    } catch (err) {
      if (!request.signal.aborted) setError(err instanceof Error ? err.message : 'Não foi possível ler o arquivo.');
    } finally {
      reading.current = false;
      setIsReading(false);
      controller.current = null;
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    void handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 animate-fade-in">
        <div className="max-w-2xl w-full text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
                Análise de Rede <span className="text-cyan-400">Inteligente</span>
            </h1>
            <p className="text-slate-400 text-lg">
                Importe seus dados do Wireshark e deixe a IA encontrar as ameaças para você.
            </p>
        </div>

      <div 
        className={`w-full max-w-2xl p-12 rounded-3xl border-2 border-dashed transition-all duration-300 backdrop-blur-sm
          ${isDragging 
            ? 'border-cyan-400 bg-cyan-400/10' 
            : 'border-slate-700 bg-slate-800/50 hover:border-cyan-500/50'
          }`}
        onDragOver={(e) => { e.preventDefault(); if (!busy) setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
      >
        <div className="flex flex-col items-center text-center space-y-4">
            {busy ? (
                <div role="status" className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400"></div>
                    <p className="text-slate-300">{stage === 'reading' ? 'Lendo arquivo…' : 'Processando pacotes…'}</p>
                    <button className="text-sm text-cyan-300 underline" onClick={() => controller.current?.abort()}>Cancelar importação</button>
                </div>
            ) : (
                <>
                    <div className="p-4 rounded-full bg-slate-800 ring-1 ring-slate-700">
                        <Upload className="w-10 h-10 text-cyan-400" />
                    </div>
                    <div>
                        <p className="text-xl font-medium text-white">Arraste seu arquivo JSON aqui</p>
                        <p className="text-slate-400 mt-2">ou clique para selecionar</p>
                    </div>
                    <label className="cursor-pointer">
                        <span className="px-6 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-medium transition-colors shadow-lg shadow-cyan-500/20">
                            Selecionar Arquivo
                        </span>
                        <input 
                            type="file" 
                            className="sr-only" 
                            aria-label="Selecionar arquivo JSON do Wireshark"
                            disabled={busy}
                            accept=".json" 
                            onChange={(e) => { void handleFile(e.target.files?.[0]); e.target.value = ''; }}
                        />
                    </label>
                </>
            )}
        </div>
      </div>

      {error && (
        <div role="alert" className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-200">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-12 bg-slate-800/50 p-6 rounded-xl max-w-2xl w-full border border-slate-700">
        <h3 className="text-white font-semibold flex items-center gap-2 mb-3">
            <FileJson className="w-5 h-5 text-yellow-400" />
            Como exportar do Wireshark?
        </h3>
        <ol className="list-decimal list-inside text-slate-400 space-y-2 text-sm">
            <li>Abra sua captura (.pcap) no Wireshark.</li>
            <li>Vá em <span className="text-cyan-300 font-mono">File &gt; Export Packet Dissections &gt; As JSON...</span></li>
            <li>Salve o arquivo e arraste-o para a área acima.</li>
            <li>Limite: 250 MB por arquivo. O tempo depende do tamanho da captura.</li>
        </ol>
      </div>
    </div>
  );
};

export default UploadSection;
