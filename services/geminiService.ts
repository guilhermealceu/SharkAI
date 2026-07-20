import { GoogleGenAI } from "@google/genai";
import { NetworkStats, ProcessedPacket } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeNetworkTraffic = async (
  stats: NetworkStats,
  samplePackets: ProcessedPacket[],
  userFocus: string = ""
): Promise<string> => {
  try {
    const model = "gemini-3-flash-preview";
    
    // Construct a summarized prompt to avoid huge token usage
    const summary = JSON.stringify({
      totalPackets: stats.totalPackets,
      protocols: stats.protocolCounts.slice(0, 10), // Top 10 protocols
      topTalkers: stats.topTalkers.slice(0, 10), // Top 10 IPs
      timeRange: `${stats.startTime} - ${stats.endTime}`,
    }, null, 2);

    const packetSample = JSON.stringify(samplePackets.map(p => ({
      time: p.time,
      src: p.source,
      dst: p.destination,
      proto: p.protocol,
      info: p.info
    })), null, 2);

    const focusContext = userFocus.trim() 
      ? `\nFOCO ESPECÍFICO DO USUÁRIO: "${userFocus}".\nIMPORTANTE: Sua análise deve PRIORIZAR responder a esta questão ou foco específico do usuário. Use os dados para confirmar ou refutar a hipótese do usuário se aplicável.\n` 
      : "";

    const prompt = `
      Você é um Analista de Segurança Cibernética Sênior e Especialista em Redes.
      
      Analise o tráfego de rede abaixo e gere um RELATÓRIO EXECUTIVO OBJETIVO.
      
      ESTATÍSTICAS GERAIS:
      ${summary}
      
      AMOSTRA DE PACOTES:
      ${packetSample}
      
      ${focusContext}

      REGRAS DE FORMATAÇÃO:
      - Use Markdown.
      - Seja EXTREMAMENTE OBJETIVO. Evite introduções longas ou saudações.
      - Use Emojis como ícones de status (✅, ⚠️, 🚨, ℹ️).
      - Use tabelas ou listas curtas para dados técnicos.
      - Divida em seções claras:
        1. **Resumo de Status**: (Status geral da rede)
        2. **Descobertas Críticas**: (Apenas o que é realmente importante ou suspeito)
        3. **Análise de Protocolos**: (O que está dominando a rede e por quê)
        4. **Plano de Ação**: (Passos práticos e diretos)

      ESTILO: Moderno, técnico, direto ao ponto.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "Não foi possível gerar a análise.";
  } catch (error) {
    console.error("Erro na análise do Gemini:", error);
    return "Ocorreu um erro ao conectar com a IA. Verifique sua chave de API ou tente novamente mais tarde.";
  }
};