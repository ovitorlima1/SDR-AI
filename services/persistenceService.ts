
import { Client, SegmentAnalysis } from '../types';
import { supabase } from './supabase';

/**
 * Converte dados do Supabase (snake_case) para o formato do App (camelCase)
 */
const mapDBToClient = (dbData: any): Client => ({
  id: dbData.id,
  name: dbData.name,
  company: dbData.company,
  cnpj: dbData.cnpj, // Mapeando CNPJ do banco
  role: dbData.role,
  industry: dbData.industry,
  employees: dbData.employees,
  segment: dbData.segment,
  category: dbData.category,
  state: dbData.state,
  cnae: dbData.cnae,
  profile: dbData.profile,
  aiRationale: dbData.ai_rationale,
  email: dbData.email,
  tariffType: dbData.tariff_type,
  lastContact: dbData.created_at
});

/**
 * Busca os clientes do banco de dados (limitado a 1000 por padrão pela API)
 */
export const fetchClientsFromDB = async (): Promise<Client[]> => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1000);

  if (error) {
    console.error("Erro ao buscar clientes:", error);
    return [];
  }
  return (data || []).map(mapDBToClient);
};

/**
 * Busca o total absoluto de leads no banco de dados, sem limites de linha.
 */
export const fetchTotalClientsCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true });
  
  if (error) {
    console.error("Erro ao contar leads:", error);
    return 0;
  }
  return count || 0;
};

/**
 * Salva novos clientes em lote no banco
 */
export const saveClientsToDB = async (clients: Partial<Client>[]) => {
  const { data, error } = await supabase
    .from('clients')
    .insert(clients.map(c => ({
      name: c.name || 'Sem Nome',
      company: c.company || 'Sem Empresa',
      cnpj: c.cnpj || null, // Enviando CNPJ para o Supabase
      role: c.role || 'Lead',
      industry: c.industry || 'Geral',
      employees: c.employees || 0,
      segment: c.segment || 'Não Segmentado',
      category: c.category || 'Não Definido',
      state: c.state || '',
      cnae: c.cnae || '',
      profile: c.profile || '',
      ai_rationale: c.aiRationale || '',
      email: c.email || '',
      tariff_type: c.tariffType || '' // Enviando Tipo de Tarifa
    })));

  if (error) throw error;
  return data;
};

/**
 * Atualiza um cliente específico após análise de IA
 */
export const updateClientAIResult = async (clientId: string, analysis: SegmentAnalysis) => {
  const { error } = await supabase
    .from('clients')
    .update({
      segment: analysis.segmentName,
      category: analysis.category,
      state: analysis.state,
      cnae: analysis.cnae,
      profile: analysis.profile,
      ai_rationale: analysis.description
    })
    .eq('id', clientId);

  if (error) console.error("Erro ao atualizar cliente:", error);
};

/**
 * REGISTRO GLOBAL DE INTELIGÊNCIA (CACHE)
 */
export const saveToIntelligenceRegistry = async (analysis: SegmentAnalysis, companyName: string) => {
  const key = companyName.toLowerCase().trim();
  
  const { error } = await supabase
    .from('intelligence_registry')
    .upsert({
      company_key: key,
      segment: analysis.segmentName,
      category: analysis.category,
      state: analysis.state,
      cnae: analysis.cnae,
      profile: analysis.profile,
      ai_rationale: analysis.description,
      last_updated: new Date().toISOString()
    });

  if (error) console.error("Erro ao salvar no cache de inteligência:", error);
};

/**
 * Tenta buscar inteligência pré-existente para uma empresa
 */
export const findExistingIntelligence = async (companyName: string) => {
  const key = companyName.toLowerCase().trim();
  const { data, error } = await supabase
    .from('intelligence_registry')
    .select('*')
    .eq('company_key', key)
    .maybeSingle();

  if (error || !data) return null;
  return data;
};

/**
 * Estatísticas do banco (empresas já mapeadas)
 */
export const getDBStats = async () => {
  const { count, error } = await supabase
    .from('intelligence_registry')
    .select('*', { count: 'exact', head: true });
  
  return error ? 0 : count || 0;
};
