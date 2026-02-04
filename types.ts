
export interface Client {
  id: string;
  name: string;
  company: string;
  cnpj?: string; // Adicionado campo CNPJ
  role: string;
  industry: string;
  employees: number;
  lastContact?: string;
  segment: string;
  category: 'Indústria' | 'Serviços' | 'Comércio' | 'Não Definido';
  state: string;
  cnae?: string;
  profile?: string; // Gestor, Pagador, Arquiteto Financeiro, etc.
  aiRationale?: string;
  email: string;
  tariffType?: string; // Ex: A4 - THS_VERDE, OPT B2, etc.
}

export interface SegmentAnalysis {
  clientId: string;
  segmentName: string;
  category: 'Indústria' | 'Serviços' | 'Comércio';
  state: string;
  cnae: string;
  profile: string;
  description: string;
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
