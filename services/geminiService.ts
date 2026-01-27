import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Client, SegmentAnalysis, MessageTemplate, BilliAnalysis } from '../types';

// Initialize the Gemini AI client
// NOTE: In a real production app, ensure API_KEY is set in your environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const MODEL_NAME = 'gemini-3-flash-preview';

export const analyzeSegments = async (clients: Client[]): Promise<SegmentAnalysis[]> => {
  // Minimize payload size
  const simplifiedClients = clients.map(c => ({
    id: c.id,
    company: c.company,
    industry: c.industry,
    role: c.role,
    employees: c.employees
  }));

  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        segmentName: { type: Type.STRING },
        description: { type: Type.STRING },
        suggestedStrategy: { type: Type.STRING },
        clientIds: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING } 
        }
      },
      required: ['segmentName', 'description', 'suggestedStrategy', 'clientIds']
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Você é um especialista em SDR (Sales Development). Analise a seguinte lista de clientes e agrupe-os em 3 a 5 segmentos estratégicos baseados em indústria, tamanho (número de funcionários) e cargo do contato.
      
      Dados dos clientes: ${JSON.stringify(simplifiedClients)}
      
      Retorne APENAS o JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: "Você é um agente de vendas experiente focado em segmentação de mercado e Account Based Marketing (ABM)."
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as SegmentAnalysis[];
    }
    return [];
  } catch (error) {
    console.error("Error analyzing segments:", error);
    throw new Error("Falha ao analisar segmentos com Gemini.");
  }
};

export const generateCampaignMessage = async (segment: string, clients: Client[]): Promise<MessageTemplate> => {
  // Context for the AI
  const context = clients.slice(0, 5).map(c => `${c.role} na ${c.company} (${c.industry})`).join(', ');

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      subject: { type: Type.STRING },
      body: { type: Type.STRING },
      segmentName: { type: Type.STRING }
    },
    required: ['subject', 'body', 'segmentName']
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Crie um modelo de e-mail frio (cold mail) curto e persuasivo para o segmento: "${segment}".
      
      O público alvo inclui perfis como: ${context}.
      
      O objetivo é agendar uma demonstração da nossa solução de otimização de vendas. Use tom profissional mas próximo.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as MessageTemplate;
    }
    throw new Error("Resposta vazia do modelo");
  } catch (error) {
    console.error("Error generating message:", error);
    throw new Error("Falha ao gerar mensagem com Gemini.");
  }
};

export const qualifyCompany = async (companyName: string): Promise<BilliAnalysis> => {
  // Schema for the Billi/GEM Analysis
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      companyName: { type: Type.STRING },
      sector: { type: Type.STRING },
      billiTotalScore: { type: Type.INTEGER, description: "Total score from 0 to 12" },
      profileCode: { type: Type.STRING, enum: ['A', 'B', 'C', 'D'] },
      profileName: { type: Type.STRING },
      axes: {
        type: Type.OBJECT,
        properties: {
          maturity: {
            type: Type.OBJECT,
            properties: { score: { type: Type.INTEGER }, max: { type: Type.INTEGER }, reasoning: { type: Type.STRING } }
          },
          energy: {
            type: Type.OBJECT,
            properties: { score: { type: Type.INTEGER }, max: { type: Type.INTEGER }, reasoning: { type: Type.STRING } }
          },
          capital: {
            type: Type.OBJECT,
            properties: { score: { type: Type.INTEGER }, max: { type: Type.INTEGER }, reasoning: { type: Type.STRING } }
          },
          language: {
            type: Type.OBJECT,
            properties: { score: { type: Type.INTEGER }, max: { type: Type.INTEGER }, reasoning: { type: Type.STRING } }
          }
        },
        required: ['maturity', 'energy', 'capital', 'language']
      },
      narrative: { type: Type.STRING },
      action: { type: Type.STRING }
    },
    required: ['companyName', 'sector', 'billiTotalScore', 'profileCode', 'profileName', 'axes', 'narrative', 'action']
  };

  try {
    // We use search grounding to get real public data
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Você é o BILLI · Lead Intelligence Agent.
      Sua missão é qualificar a empresa "${companyName}" usando APENAS dados públicos (Search).
      
      SISTEMA DE PONTUAÇÃO (Billi Fit Score - 0 a 12):
      
      1. MATURIDADE (0-4 pts):
         - Porte médio/grande (+1)
         - >5 anos operação (+1)
         - Estrutura admin/financeira clara (+1)
         - Área financeira explícita (+1)
      
      2. ENERGIA (0-3 pts):
         - Setor intensivo em energia (+2)
         - Operação física relevante (+1)
      
      3. CAPITAL (0-3 pts):
         - Notícias de financiamento estruturado/M&A (+2)
         - Uso de incentivos/BNDES/FIDC (+1)
         - Se capital próprio/orgânico apenas (0)
      
      4. LINGUAGEM (0-2 pts):
         - Fala em "eficiência", "margem", "previsibilidade" (+1)
         - Fala em "planejamento", "governança" (+1)
      
      CLASSIFICAÇÃO FINAL:
      0-3 pts: C (Pagador Reativo)
      4-6 pts: D (Oportunista de Caixa)
      7-9 pts: A (Guardião do Caixa)
      10-12 pts: B (Arquiteto Financeiro - IDEAL)
      
      Busque informações sobre: Setor, Tamanho, Processos (Jusbrasil, News, Linkedin, Site), Prêmios, ESG.
      `,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const output = response.text ? JSON.parse(response.text) as BilliAnalysis : null;

    if (!output) throw new Error("Falha na análise.");

    // Extract sources if available
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources: { title: string; uri: string }[] = [];
    
    if (groundingChunks) {
      groundingChunks.forEach(chunk => {
        if (chunk.web?.uri) {
          sources.push({
            title: chunk.web.title || new URL(chunk.web.uri).hostname,
            uri: chunk.web.uri
          });
        }
      });
    }

    return { ...output, sources: sources.slice(0, 5) }; // Limit sources

  } catch (error) {
    console.error("Error qualifying lead:", error);
    throw new Error("Falha ao qualificar lead com Gemini.");
  }
};