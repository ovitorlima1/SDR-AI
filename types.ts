export enum SegmentType {
  ENTERPRISE_TECH = 'Enterprise Tech',
  SMB_RETAIL = 'SMB Retail',
  FINTECH_GROWTH = 'Fintech Growth',
  HEALTHCARE_SERVICES = 'Healthcare Services',
  UNKNOWN = 'Não Segmentado'
}

export interface Client {
  id: string;
  name: string;
  company: string;
  role: string;
  industry: string;
  employees: number;
  lastContact?: string;
  segment: string; // Dynamic string to allow AI to define new segments or map to known ones
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

export interface BilliScore {
  score: number;
  max: number;
  reasoning: string;
}

export interface BilliAnalysis {
  companyName: string;
  sector: string;
  billiTotalScore: number; // 0-12
  profileCode: 'A' | 'B' | 'C' | 'D';
  profileName: string; // e.g. "Arquiteto Financeiro"
  axes: {
    maturity: BilliScore; // 0-4
    energy: BilliScore; // 0-3
    capital: BilliScore; // 0-3
    language: BilliScore; // 0-2
  };
  narrative: string;
  action: string;
  sources?: { title: string; uri: string }[];
}

export type ViewState = 'dashboard' | 'clients' | 'campaigns' | 'qualifier';