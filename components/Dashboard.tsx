
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from 'recharts';
import { Users, PieChart as PieChartIcon, Target, Loader2, Search, CheckCircle2, Zap, BrainCircuit } from 'lucide-react';
import { Client } from '../types';

interface DashboardProps {
  clients: Client[];
  totalLeadsOverride?: number;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  progress?: { current: number; total: number };
  registryCount?: number;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  clients, 
  totalLeadsOverride, 
  onAnalyze, 
  isAnalyzing, 
  progress, 
  registryCount = 0 
}) => {
  const totalLeads = totalLeadsOverride !== undefined ? totalLeadsOverride : clients.length;
  const enrichedClients = clients.filter(c => c.segment !== 'Não Segmentado').length;
  const clientsWithTariff = clients.filter(c => c.tariffType && c.tariffType.trim() !== '').length;
  
  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9'];

  const profileData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    const analyzed = clients.filter(c => c.profile);
    analyzed.forEach(c => {
      if (c.profile) counts[c.profile] = (counts[c.profile] || 0) + 1;
    });
    
    const total = analyzed.length;
    return Object.entries(counts).map(([name, value]) => ({ 
      name, 
      value,
      percentage: total > 0 ? ((value / total) * 100).toFixed(1) : 0
    }));
  }, [clients]);

  const categoryData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    const analyzed = clients.filter(c => c.category && c.category !== 'Não Definido');
    analyzed.forEach(c => {
      if (c.category) counts[c.category] = (counts[c.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [clients]);

  const tariffData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    const withTariff = clients.filter(c => c.tariffType && c.tariffType.trim() !== '');
    withTariff.forEach(c => {
      if (c.tariffType) counts[c.tariffType] = (counts[c.tariffType] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [clients]);

  const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, value, name, percentage } = props;
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 25;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="#475569" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-[10px] font-bold"
      >
        {`${name}: ${value} (${percentage}%)`}
      </text>
    );
  };

  const percentProgress = progress && progress.total > 0 
    ? Math.round((progress.current / progress.total) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Inteligência de Base</h2>
          <p className="text-slate-500 flex items-center gap-2">
            Segmentação via CNAE e Perfil de Público.
            <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter border border-indigo-100">
              <BrainCircuit size={10} /> {registryCount} Empresas no Cérebro
            </span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={onAnalyze}
            disabled={isAnalyzing || clients.length === 0}
            className={`flex items-center px-6 py-3 rounded-xl transition-all shadow-lg disabled:opacity-50 ${isAnalyzing ? 'bg-amber-500 text-slate-900' : 'bg-primary text-slate-900 hover:bg-primary/90 font-bold'}`}
          >
            {isAnalyzing ? (
              <><Loader2 className="animate-spin mr-2" /> Processando Inteligência...</>
            ) : (
              <><Search className="mr-2" size={18} /> Mapear Base de Leads</>
            )}
          </button>
          
          {isAnalyzing && progress && (
            <div className="w-64 space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <span>Progresso da Base</span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 transition-all duration-500 ease-out"
                  style={{ width: `${percentProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total leads (Banco)</p>
          <h3 className="text-3xl font-black text-slate-900 mt-1">{totalLeads.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Amostra Mapeada</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-black text-green-600 mt-1">{enrichedClients}</h3>
            <span className="text-xs font-bold text-slate-400 mb-1">
              {clients.length > 0 ? Math.round((enrichedClients/clients.length)*100) : 0}%
            </span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-slate-500">Tarifas (Amostra)</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-black text-amber-600 mt-1">{clientsWithTariff}</h3>
            <span className="text-xs font-bold text-slate-400 mb-1">Empresas</span>
          </div>
        </div>
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cérebro Global</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-black text-primary mt-1">{registryCount.toLocaleString()}</h3>
            <span className="text-xs font-bold text-slate-500 mb-1">Empresas</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Gráficos permanecem usando 'clients' pois representam a amostra carregada */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[480px] flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 uppercase mb-2 flex items-center gap-2">
            <Target size={18} className="text-primary" /> Perfis de Público (Mindset)
          </h3>
          <p className="text-xs text-slate-400 mb-4 font-medium italic">Dados da amostra atual</p>
          <div className="flex-1 overflow-visible">
            {profileData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ left: 40, right: 40, top: 20, bottom: 20 }}>
                  <Pie 
                    data={profileData} 
                    innerRadius={50} 
                    outerRadius={75} 
                    paddingAngle={5} 
                    dataKey="value"
                    label={renderCustomizedLabel}
                    labelLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                  >
                    {profileData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: '20px', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-300 text-sm italic text-center px-10">Aguardando mapeamento...</div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[480px] flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 uppercase mb-2 flex items-center gap-2">
            <Zap size={18} className="text-amber-500" /> Tipos de Tarifa
          </h3>
          <p className="text-xs text-slate-400 mb-4 font-medium italic">Distribuição na amostra</p>
          <div className="flex-1 overflow-visible">
            {tariffData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tariffData} layout="vertical" margin={{ left: 10, right: 100, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 9, fontWeight: 'bold', fill: '#64748b'}} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={24}>
                    <LabelList 
                      dataKey="value" 
                      position="right" 
                      offset={10}
                      style={{ fill: '#b45309', fontSize: '10px', fontWeight: 'bold' }} 
                      formatter={(val: number) => `${val}`}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-300 text-sm italic text-center px-10">Importe dados para visualizar as tarifas.</div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[480px] flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 uppercase mb-2 flex items-center gap-2">
            <PieChartIcon size={18} className="text-indigo-500" /> Categorias por Setor
          </h3>
          <p className="text-xs text-slate-400 mb-4 font-medium italic">Distribuição de atuação</p>
          <div className="flex-1">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ left: 10, right: 100, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 10, fontWeight: 'bold', fill: '#64748b'}} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={24}>
                    <LabelList 
                      dataKey="value" 
                      position="right" 
                      offset={10}
                      style={{ fill: '#475569', fontSize: '10px', fontWeight: 'bold' }} 
                      formatter={(val: number) => `${val}`}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-300 text-sm italic text-center px-10">Mapeie os CNAEs para classificar.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
