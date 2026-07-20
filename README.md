# 🦈 SharkAI - Analisador de Rede Inteligente

O **SharkAI** é uma ferramenta moderna e poderosa para análise de tráfego de rede que combina a precisão do Wireshark com a inteligência do Google Gemini. Importe seus arquivos de captura, visualize estatísticas detalhadas e receba insights automáticos sobre segurança e anomalias.

![SharkAI Preview](https://picsum.photos/seed/sharkai/1200/600)

## 🚀 Funcionalidades

- **📁 Importação Simplificada**: Suporte total para arquivos JSON exportados diretamente do Wireshark.
- **📊 Dashboard Interativo**: Visualização de distribuição de protocolos e "Top Talkers" (IPs mais ativos) usando gráficos dinâmicos.
- **🛡️ Análise com IA**: Integração com o modelo **Gemini 3 Flash** para detectar anomalias, explicar protocolos e sugerir melhorias de segurança.
- **🔍 Filtro em Tempo Real**: Busque por IPs, protocolos ou informações específicas na lista de pacotes.
- **💡 Foco Personalizado**: Peça para a IA analisar problemas específicos (ex: "Por que meu Wi-Fi está lento?" ou "Investigar tráfego na porta 443").
- **🌑 Interface Cyberpunk**: Design escuro otimizado para profissionais de TI e entusiastas de segurança.

## 🛠️ Tecnologias Utilizadas

- **Frontend**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/)
- **IA**: [Google Gemini API (@google/genai)](https://ai.google.dev/)
- **Gráficos**: [Recharts](https://recharts.org/)
- **Ícones**: [Lucide React](https://lucide.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)

## 📖 Como Usar

### 1. Exportando do Wireshark
Para usar o SharkAI, você precisa exportar sua captura do Wireshark no formato JSON:
1. Abra seu arquivo `.pcap` ou faça uma captura ao vivo no Wireshark.
2. Vá em **File > Export Packet Dissections > As JSON...**
3. Salve o arquivo.
4. Arraste e solte o arquivo salvo na tela inicial do SharkAI.

### 2. Configuração da API Key
Para habilitar a análise inteligente, você precisa de uma chave de API do Google Gemini:
1. Obtenha sua chave em [Google AI Studio](https://aistudio.google.com/).
2. Crie um arquivo `.env` na raiz do projeto (ou use as configurações do ambiente).
3. Adicione a chave: `GEMINI_API_KEY=sua_chave_aqui`.

### 3. Instalação e Execução
```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Gerar build de produção
npm run build
```

## 📂 Estrutura do Projeto

- `/components`: Componentes de UI (Dashboard, Upload, etc).
- `/services`: Integração com a API do Gemini.
- `/utils`: Utilitários para parsing de pacotes e cálculos.
- `/types.ts`: Definições de tipos TypeScript para os pacotes do Wireshark.

## 🛡️ Segurança e Privacidade
O processamento dos pacotes ocorre localmente no seu navegador. Apenas um resumo estatístico e uma pequena amostra de pacotes (sem dados sensíveis de payload, apenas cabeçalhos) são enviados para a API do Gemini para análise, garantindo que seus dados permaneçam seguros.

---
Desenvolvido com ❤️ para a comunidade de Redes e Segurança.
