
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Client, SegmentAnalysis, MessageTemplate, BilliAnalysis } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
const MODEL_NAME = 'gemini-3-flash-preview';

export const analyzeSegments = async (clients: Client[]): Promise<SegmentAnalysis[]> => {
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
        clientIds: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ['segmentName', 'description', 'suggestedStrategy', 'clientIds']
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Você é um especialista em SDR. Analise e segmente: ${JSON.stringify(simplifiedClients)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });
    return response.text ? JSON.parse(response.text) : [];
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const generateCampaignMessage = async (segment: string, clients: Client[]): Promise<MessageTemplate> => {
  const context = clients.slice(0, 5).map(c => `${c.role} na ${c.company}`).join(', ');
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
      contents: `Crie um cold mail para o segmento "${segment}". Alvos: ${context}`,
      config: { responseMimeType: "application/json", responseSchema: schema }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    throw new Error("Falha ao gerar mensagem.");
  }
};

export const qualifyCompany = async (companyName: string): Promise<BilliAnalysis> => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      identification: {
        type: Type.OBJECT,
        properties: {
          razaoSocial: { type: Type.STRING },
          cnpj: { type: Type.STRING },
          cnae: { type: Type.STRING },
          localizacao: { type: Type.STRING },
          ecossistema: { type: Type.STRING }
        },
        required: ['razaoSocial', 'cnpj', 'cnae', 'localizacao', 'ecossistema']
      },
      eixos: {
        type: Type.OBJECT,
        properties: {
          eixo1: {
            type: Type.OBJECT,
            properties: { sinais: { type: Type.ARRAY, items: { type: Type.STRING } }, veredito: { type: Type.STRING } }
          },
          eixo2: {
            type: Type.OBJECT,
            properties: { sinais: { type: Type.ARRAY, items: { type: Type.STRING } }, veredito: { type: Type.STRING } }
          }
        },
        required: ['eixo1', 'eixo2']
      },
      scoring: {
        type: Type.OBJECT,
        properties: {
          maturity: { type: Type.OBJECT, properties: { evidence: { type: Type.STRING }, points: { type: Type.INTEGER } } },
          energy: { type: Type.OBJECT, properties: { evidence: { type: Type.STRING }, points: { type: Type.INTEGER } } },
          capital: { type: Type.OBJECT, properties: { evidence: { type: Type.STRING }, points: { type: Type.INTEGER } } },
          language: { type: Type.OBJECT, properties: { evidence: { type: Type.STRING }, points: { type: Type.INTEGER } } },
          total: { type: Type.INTEGER }
        },
        required: ['maturity', 'energy', 'capital', 'language', 'total']
      },
      profile: {
        type: Type.OBJECT,
        properties: {
          code: { type: Type.STRING },
          name: { type: Type.STRING },
          reason: { type: Type.STRING },
          pain: { type: Type.STRING },
          opportunity: { type: Type.STRING }
        },
        required: ['code', 'name', 'reason', 'pain', 'opportunity']
      },
      nextSteps: {
        type: Type.OBJECT,
        properties: {
          donts: { type: Type.ARRAY, items: { type: Type.STRING } },
          do: { type: Type.OBJECT, properties: { narrative: { type: Type.STRING }, trigger: { type: Type.STRING } } }
        },
        required: ['donts', 'do']
      }
    },
    required: ['identification', 'eixos', 'scoring', 'profile', 'nextSteps']
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Você é o BILLI · Lead Intelligence Agent (LIA). 
      Sua missão é gerar um relatório de qualificação detalhado para a empresa "${companyName}" baseado nos 5 eixos do PDF de referência.
      
      REGRAS DE ANÁLISE:
      1. IDENTIFICAÇÃO: Busque Razão Social Real, CNPJ base, CNAE principal e secundários relevantes, Localização e Ecossistema (sócios, holdings).
      2. EIXO 1 (Futuro): Analise se a empresa emite Warrant (sinal de antecipação), se é indústria que compra safra (previsibilidade).
      3. EIXO 2 (Decisão): Verifique se verticalizou (Indústria/Logística), se tem CAPEX alto ou se é apenas trading.
      4. SCORING (0-12): 
         A. Estrutura/Maturidade (3 pts)
         B. Intensidade Energética (3 pts)
         C. Relação com Capital (3 pts)
         D. Linguagem/Estratégia (3 pts)
      5. PERFIL: Identifique se é "ARQUITETO FINANCEIRO" (O ideal), "Guardião", "Oportunista" ou "Pagador".
      6. PRÓXIMOS PASSOS: Liste o que NÃO fazer (ex: falar de economia de energia pequena) e o que FAZER (narrativa de eficiência de margem).`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: "Você é um agente LIA especializado em inteligência de mercado para o agronegócio e indústria intensiva em capital."
      }
    });

    const output = JSON.parse(response.text || '{}') as BilliAnalysis;
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources = groundingChunks?.map(c => ({ title: c.web?.title || 'Fonte', uri: c.web?.uri || '' })).filter(s => s.uri) || [];

    return { ...output, sources: sources.slice(0, 5) };
  } catch (error) {
    console.error(error);
    throw new Error("Falha na qualificação LIA.");
  }
};
