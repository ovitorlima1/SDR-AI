
import { Client, SegmentAnalysis, Campaign } from '../types';
import { supabase } from './supabase';

/**
 * Converte dados do Supabase (snake_case - Tabela Nova) para o formato do App (camelCase)
 */
const mapDBToClient = (dbData: any): Client => ({
  id: dbData.id,
  
  // Campos Principais da Tabela Energia
  cnpj: dbData.cnpj,
  name: dbData.nome || 'Sem Nome',
  company: dbData.nome || 'Sem Empresa', // Usamos Nome como Empresa principal
  municipio: dbData.municipio,
  endereco: dbData.endereco,
  clienteLivre: dbData.cliente_livre,
  microGerador: dbData.micro_gerador,
  nivelTensao: dbData.nivel_tensao,
  classePrincipal: dbData.classe_principal,
  industry: dbData.classe_principal || 'Geral', // Alias
  subclasse: dbData.subclasse,
  potencia: dbData.potencia,
  tipoTarifa: dbData.tipo_tarifa,
  tariffType: dbData.tipo_tarifa, // Alias
  tipoCliente: dbData.tipo_cliente,
  dataDe: dbData.data_de,
  dataAte: dbData.data_ate,
  contratoAtivo: dbData.contrato_ativo,
  telFixo: dbData.tel_fixo,
  telMovel: dbData.tel_movel,
  email: dbData.email || '',
  
  // Inteligência
  cnae: dbData.cnae,
  profile: dbData.tipo_perfil, // O "TIPO_PERFIL" do banco é o nosso profile
  segment: dbData.tipo_perfil || 'Não Segmentado', // Visualmente é o segmento
  aiRationale: dbData.ai_rationale,
  
  // Derivados / Placeholders
  role: 'Decisor',
  employees: 0,
  category: deriveCategory(dbData.classe_principal),
  state: extractState(dbData.municipio),
  lastContact: dbData.created_at
});

// Helper simples para tentar extrair UF do município (Ex: "São Paulo - SP")
const extractState = (municipio?: string) => {
  if (!municipio) return '';
  const parts = municipio.split('-');
  return parts.length > 1 ? parts[parts.length - 1].trim() : '';
};

// Helper para categorizar macro setor baseado na classe principal da energia
const deriveCategory = (classe?: string): 'Indústria' | 'Serviços' | 'Comércio' | 'Não Definido' => {
  if (!classe) return 'Não Definido';
  const c = classe.toLowerCase();
  if (c.includes('industrial') || c.includes('fabricação')) return 'Indústria';
  if (c.includes('comercial') || c.includes('varejo')) return 'Comércio';
  if (c.includes('rural')) return 'Indústria'; // Agronegócio tratado como indústria produtiva aqui
  return 'Serviços';
};

export interface CampaignFilters {
  profile?: string;
  state?: string;
  category?: string;
}

/**
 * Busca leads que ainda não foram segmentados (tipo_perfil nulo)
 */
export const fetchPendingClients = async (limit: number): Promise<Client[]> => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .or('tipo_perfil.is.null,tipo_perfil.eq.,tipo_perfil.eq.Não Segmentado')
    .limit(limit);

  if (error) {
    console.error("Erro ao buscar leads pendentes:", error);
    return [];
  }
  return (data || []).map(mapDBToClient);
};

/**
 * Busca os clientes do banco de dados
 */
export const fetchClientsFromDB = async (): Promise<Client[]> => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20000);

  if (error) {
    console.error("Erro ao buscar clientes:", error);
    return [];
  }
  return (data || []).map(mapDBToClient);
};

export const fetchTotalClientsCount = async (): Promise<number> => {
  const { count, error } = await supabase.from('clients').select('*', { count: 'exact', head: true });
  return error ? 0 : (count || 0);
};

export const fetchTotalPendingCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .or('tipo_perfil.is.null,tipo_perfil.eq.,tipo_perfil.eq.Não Segmentado');
  return error ? 0 : (count || 0);
};

// Helper robusto para tratar datas vindas do Excel
const formatDateForDB = (dateStr: string | number | undefined): string | null => {
  if (!dateStr) return null;
  const strVal = String(dateStr).trim();
  if (!strVal) return null;

  // 1. Verifica se é um número (Excel Serial Date ou Lixo numérico)
  // O erro '2958465' é um número muito alto, provavelmente um ID ou telefone no campo errado.
  // Datas razoáveis em Excel (1900-2100) ficam entre ~1 e ~73000.
  if (!isNaN(Number(strVal))) {
    const num = Number(strVal);
    // Filtro de segurança: Aceita apenas serial dates entre ano 1950 (18264) e 2050 (54789)
    // Se for 2958465, cai fora.
    if (num > 18000 && num < 60000) {
       try {
         // Conversão Excel Serial -> JS Date
         // (Valor - 25569) * 86400 * 1000
         const excelDate = new Date((num - 25569) * 86400 * 1000);
         // Ajuste de fuso horário simples para pegar a data YYYY-MM-DD correta
         return excelDate.toISOString().split('T')[0];
       } catch (e) {
         return null;
       }
    } else {
      // Valor numérico fora de range (provavelmente ID ou lixo)
      return null;
    }
  }

  // 2. Tenta parsear string formato brasileiro DD/MM/YYYY
  if (strVal.includes('/')) {
    const parts = strVal.split('/');
    if (parts.length === 3) {
      // Assume DD/MM/YYYY ou DD/MM/YY
      let day = parseInt(parts[0]);
      let month = parseInt(parts[1]);
      let year = parseInt(parts[2]);

      // Corrige ano de 2 dígitos
      if (year < 100) year += 2000;

      // Validação básica
      if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
        return null;
      }
      
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // 3. Tenta formato ISO ou padrão do Date.parse
  const date = new Date(strVal);
  if (!isNaN(date.getTime())) {
    const y = date.getFullYear();
    if (y > 1900 && y < 2100) {
      return date.toISOString().split('T')[0];
    }
  }

  // Se nada funcionou, retorna null para não quebrar o insert
  return null;
};

/**
 * Salva novos clientes importados do Excel
 */
export const saveClientsToDB = async (clients: Partial<Client>[]) => {
  const { data, error } = await supabase
    .from('clients')
    .insert(clients.map(c => ({
      nome: c.name,
      cnpj: c.cnpj || null,
      municipio: c.municipio,
      endereco: c.endereco,
      cliente_livre: c.clienteLivre,
      micro_gerador: c.microGerador,
      nivel_tensao: c.nivelTensao,
      classe_principal: c.classePrincipal,
      subclasse: c.subclasse,
      potencia: c.potencia,
      tipo_tarifa: c.tipoTarifa,
      tipo_cliente: c.tipoCliente,
      data_de: formatDateForDB(c.dataDe),
      data_ate: formatDateForDB(c.dataAte),
      contrato_ativo: c.contratoAtivo,
      tel_fixo: c.telFixo,
      tel_movel: c.telMovel,
      email: c.email,
      tipo_perfil: c.profile || 'Não Segmentado', // Inicializa
      cnae: c.cnae
    })));

  if (error) throw error;
  return data;
};

/**
 * Atualiza o cliente após a IA rodar
 */
export const updateClientAIResult = async (clientId: string, analysis: SegmentAnalysis) => {
  const updates: any = {
    tipo_perfil: analysis.profile, // Salva o perfil no banco
    cnae: analysis.cnae,
    ai_rationale: analysis.description
  };

  if (analysis.foundCnpj && analysis.foundCnpj.length > 5) {
    updates.cnpj = analysis.foundCnpj;
  }

  if (analysis.foundCompany && analysis.foundCompany.length > 2) {
    updates.nome = analysis.foundCompany;
  }

  const { error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', clientId);

  if (error) console.error("Erro ao atualizar cliente:", error);
};

export const fetchCampaignAudienceCount = async (filters: CampaignFilters): Promise<number> => {
  let query = supabase.from('clients').select('*', { count: 'exact', head: true });

  if (filters.profile) {
    query = query.eq('tipo_perfil', filters.profile);
  }
  if (filters.state && filters.state !== 'all') {
    query = query.ilike('municipio', `%${filters.state}%`);
  }
  if (filters.category && filters.category !== 'all') {
    if (filters.category === 'Indústria') query = query.ilike('classe_principal', '%ind%');
    else if (filters.category === 'Comércio') query = query.ilike('classe_principal', '%comercial%');
    else query = query.not('classe_principal', 'ilike', '%ind%').not('classe_principal', 'ilike', '%comercial%');
  }

  const { count, error } = await query;
  return error ? 0 : (count || 0);
};

export const fetchCampaignSampleClients = async (filters: CampaignFilters, limit: number): Promise<Client[]> => {
  let query = supabase.from('clients').select('*').limit(limit);

  if (filters.profile) {
    query = query.eq('tipo_perfil', filters.profile);
  }
  if (filters.state && filters.state !== 'all') {
    query = query.ilike('municipio', `%${filters.state}%`);
  }
  if (filters.category && filters.category !== 'all') {
    if (filters.category === 'Indústria') query = query.ilike('classe_principal', '%ind%');
    else if (filters.category === 'Comércio') query = query.ilike('classe_principal', '%comercial%');
    else query = query.not('classe_principal', 'ilike', '%ind%').not('classe_principal', 'ilike', '%comercial%');
  }

  const { data, error } = await query;
  if (error) return [];
  return (data || []).map(mapDBToClient);
};

// --- FUNÇÕES DE CAMPANHA ---

export const createCampaign = async (campaign: Omit<Campaign, 'id' | 'createdAt'>) => {
  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      name: campaign.name,
      segment_profile: campaign.segmentProfile,
      segment_region: campaign.segmentRegion,
      segment_category: campaign.segmentCategory,
      total_leads: campaign.totalLeads,
      email_subject: campaign.subject,
      email_body: campaign.body,
      status: campaign.status
    })
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar campanha:", error);
    throw error;
  }
  return data;
};

export const fetchLatestCampaign = async (): Promise<Campaign | null> => {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') console.error("Erro ao buscar campanha:", error); // PGRST116 é 'nenhum resultado', ok ignorar
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    segmentProfile: data.segment_profile,
    segmentRegion: data.segment_region,
    segmentCategory: data.segment_category,
    totalLeads: data.total_leads,
    subject: data.email_subject,
    body: data.email_body,
    status: data.status as any,
    createdAt: data.created_at
  };
};
