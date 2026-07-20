import React, { useCallback, useState } from 'react';
import { Upload, FileJson, AlertTriangle } from 'lucide-react';

interface UploadSectionProps {
  onDataLoaded: (data: any) => void;
  isLoading: boolean;
}

const UploadSection: React.FC<UploadSectionProps> = ({ onDataLoaded, isLoading }) => {
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    if (file.type !== "application/json" && !file.name.endsWith('.json')) {
      setError("Por favor, envie um arquivo JSON exportado do Wireshark.");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (!Array.isArray(json)) {
          throw new Error("Formato inválido. Esperado um array de pacotes.");
        }
        onDataLoaded(json);
      } catch (err) {
        setError("Erro ao ler o arquivo JSON. Certifique-se que foi exportado corretamente do Wireshark.");
      }
    };
    reader.readAsText(file);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

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
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
      >
        <div className="flex flex-col items-center text-center space-y-4">
            {isLoading ? (
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400"></div>
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
                            className="hidden" 
                            accept=".json" 
                            onChange={(e) => e.target.files && handleFile(e.target.files[0])}
                        />
                    </label>
                </>
            )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-200">
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
            <li>Recomendamos arquivos menores que 50MB para melhor performance no navegador.</li>
        </ol>
      </div>
    </div>
  );
};

export default UploadSection;