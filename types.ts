
export interface Client {
  id: string;
  name: string;
  company: string;
  role: string;
  industry: string;
  employees: number;
  lastContact?: string;
  segment: string;
  aiRationale?: string;
  email: string;
}

export interface SegmentAnalysis {
  segmentName: string;
  description: string;
  suggestedStrategy: string;
  clientIds: string[];
}

export interface MessageTemplate {
  subject: string;
  body: string;
  segmentName: string;
}

export interface BilliAnalysis {
  identification: {
    razaoSocial: string;
    cnpj: string;
    cnae: string;
    localizacao: string;
    ecossistema: string;
  };
  eixos: {
    eixo1: { sinais: string[]; veredito: string };
    eixo2: { sinais: string[]; veredito: string };
  };
  scoring: {
    maturity: { evidence: string; points: number };
    energy: { evidence: string; points: number };
    capital: { evidence: string; points: number };
    language: { evidence: string; points: number };
    total: number;
  };
  profile: {
    code: string;
    name: string;
    reason: string;
    pain: string;
    opportunity: string;
  };
  nextSteps: {
    donts: string[];
    do: {
      narrative: string;
      trigger: string;
    };
  };
  sources?: { title: string; uri: string }[];
}

export type ViewState = 'dashboard' | 'clients' | 'campaigns' | 'qualifier';
