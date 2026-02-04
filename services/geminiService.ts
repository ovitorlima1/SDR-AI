
import { GoogleGenAI, Type } from "@google/genai";
import { Client, SegmentAnalysis, MessageTemplate, BilliAnalysis } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = 'gemini-3-flash-preview';

// Função utilitária para retry com backoff exponencial
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 2000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const isRateLimit = error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED');
      
      if (isRateLimit && i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        console.warn(`Taxa de limite atingida. Tentando novamente em ${delay}ms... (Tentativa ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export const analyzeSegments = async (clients: Client[]): Promise<SegmentAnalysis[]> => {
  const companyList = clients.map(c => ({ id: c.id, company: c.company }));

  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        clientId: { type: Type.STRING },
        segmentName: { type: Type.STRING },
        category: { type: Type.STRING, description: "Deve ser: Indústria, Serviços ou Comércio" },
        state: { type: Type.STRING, description: "Sigla do Estado (UF)" },
        cnae: { type: Type.STRING, description: "Código CNAE encontrado na web" },
        profile: { type: Type.STRING, description: "Perfil: Gestor, Pagador, Arquiteto Financeiro ou Oportunista" },
        description: { type: Type.STRING }
      },
      required: ['clientId', 'segmentName', 'category', 'state', 'cnae', 'profile', 'description']
    }
  };

  return withRetry(async () => {
    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Você é um Analista de Inteligência de Mercado. 
        Para cada empresa da lista abaixo, use o Google Search para encontrar seu CNAE principal, Localização (Estado) e Atividade Real.
        Com base no CNAE e atividade, classifique em:
        - Categoria: Indústria, Serviços ou Comércio.
        - Perfil: Gestor (conservador), Pagador (focado em fluxo), Arquiteto Financeiro (estratégico/ideal) ou Oportunista.
        
        Lista de empresas: ${JSON.stringify(companyList)}`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: schema
        }
      });
      return response.text ? JSON.parse(response.text) : [];
    } catch (error) {
      console.error("Erro na segmentação:", error);
      throw error;
    }
  });
};

export const generateCampaignMessage = async (segment: string, filterContext: string, clients: Client[]): Promise<MessageTemplate> => {
  const context = clients.slice(0, 3).map(c => `${c.role} na ${c.company} (${c.category})`).join(', ');
  const schema = {
    type: Type.OBJECT,
    properties: {
      subject: { type: Type.STRING },
      body: { type: Type.STRING },
      segmentName: { type: Type.STRING }
    },
    required: ['subject', 'body', 'segmentName']
  };

  return withRetry(async () => {
    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Crie um cold mail focado no perfil "${segment}" e contexto de filtros "${filterContext}". Alvos de exemplo: ${context}. Use uma abordagem de "Arquiteto Financeiro".`,
        config: { responseMimeType: "application/json", responseSchema: schema }
      });
      return JSON.parse(response.text || '{}');
    } catch (error) {
      throw new Error("Falha ao gerar mensagem.");
    }
  });
};

export const qualifyCompany = async (companyOrCnpj: string): Promise<BilliAnalysis> => {
  // Limpa caracteres especiais se parecer um CNPJ para teste
  const cleanInput = companyOrCnpj.replace(/[^\d]/g, '');
  const isCnpjInput = cleanInput.length === 14; 
  const searchTerm = isCnpjInput ? cleanInput.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") : companyOrCnpj;

  const schema = {
    type: Type.OBJECT,
    properties: {
      identification: {
        type: Type.OBJECT,
        properties: {
          razaoSocial: { type: Type.STRING, description: "A Razão Social EXATA registrada na Receita Federal para este CNPJ." },
          cnpj: { type: Type.STRING, description: "O CNPJ exato validado." },
          cnae: { type: Type.STRING, description: "Código e descrição do CNAE principal" },
          localizacao: { type: Type.STRING, description: "Cidade e Estado (UF)" },
          ecossistema: { type: Type.STRING, description: "Resumo do mercado de atuação" }
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

  const prompt = isCnpjInput 
    ? `AUDITORIA CADASTRAL OBRIGATÓRIA:
       O usuário forneceu o CNPJ: "${searchTerm}".
       1. Pesquise EXATAMENTE este CNPJ no Google.
       2. Extraia a Razão Social OFICIAL vinculada a este número específico em sites como Casa dos Dados, Econodata ou CNPJ.biz.
       3. ATENÇÃO: Se o CNPJ "${searchTerm}" pertencer à empresa "X", você DEVE retornar "X" como Razão Social. Não retorne nomes de filiais ou empresas similares se o número não bater.
       4. Realize a análise estratégica baseada APENAS nesta empresa encontrada.`
    : `BUSCA DE EMPRESA ESPECÍFICA:
       O usuário buscou: "${searchTerm}".
       1. Encontre o CNPJ da MATRIZ ATIVA desta empresa.
       2. Use o Google Search para confirmar qual é a Razão Social correta.
       3. Se houver homônimos (como "Zion Church" vs "Associação Igreja Cristã Zion"), verifique os resultados de busca para ver qual é a entidade principal ou liste a mais relevante.
       4. Retorne o CNPJ e Razão Social que formam um par VERDADEIRO na Receita Federal.`;

  return withRetry(async () => {
    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: schema,
          systemInstruction: `Você é o BILLI, um auditor de dados corporativos focado em VERACIDADE.
          Regra de Ouro: A integridade do par (Razão Social <-> CNPJ) é absoluta.
          
          - Se o input for um CNPJ, a Razão Social retornada DEVE ser a proprietária legal desse documento. Não invente.
          - Se o input for um Nome, encontre o CNPJ real. Se não encontrar com certeza, use "Não identificado" no CNPJ, mas não invente números.
          - Exemplo de Erro a Evitar: Associar o CNPJ da "Matriz" ao nome de uma "Filial" diferente, ou associar o CNPJ de uma empresa a outra com nome parecido.
          - Valide seus dados com os snippets de busca retornados.`
        }
      });

      const output = JSON.parse(response.text || '{}') as BilliAnalysis;
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(c => ({ title: c.web?.title || 'Fonte', uri: c.web?.uri || '' })).filter(s => s.uri) || [];

      return { ...output, sources: sources.slice(0, 5) };
    } catch (error) {
      console.error(error);
      throw new Error("Falha na qualificação.");
    }
  });
};
