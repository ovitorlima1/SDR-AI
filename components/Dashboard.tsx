import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Users, PieChart as PieChartIcon, Target, Loader2 } from 'lucide-react';
import { Client } from '../types';

interface DashboardProps {
  clients: Client[];
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ clients, onAnalyze, isAnalyzing }) => {
  const totalClients = clients.length;
  const segmentedClients = clients.filter(c => c.segment !== 'Não Segmentado').length;
  
  // Prepare data for charts
  const segmentData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    clients.forEach(c => {
      counts[c.segment] = (counts[c.segment] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [clients]);

  const industryData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    clients.forEach(c => {
      counts[c.industry] = (counts[c.industry] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [clients]);

  const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Visão Geral</h2>
          <p className="text-slate-500">Acompanhe a segmentação da sua base de leads.</p>
        </div>
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="animate-spin mr-2" size={18} />
              Processando IA...
            </>
          ) : (
            <>
              <PieChartIcon className="mr-2" size={18} />
              Executar Segmentação
            </>
          )}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total de Leads</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalClients}</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
              <Users size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Segmentados</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{segmentedClients}</h3>
            </div>
            <div className="p-3 bg-green-50 rounded-lg text-green-600">
              <PieChartIcon size={24} />
            </div>
          </div>
          <div className="mt-4 w-full bg-slate-100 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${(segmentedClients / totalClients) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Oportunidades</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">Alta</h3>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
              <Target size={24} />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">Baseado na atividade recente</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Distribuição por Segmento</h3>
          <div className="h-64">
            {segmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={segmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {segmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                Sem dados de segmentação
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Distribuição por Indústria</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={industryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 12}} interval={0} height={50} tickFormatter={(val) => val.slice(0, 10) + (val.length > 10 ? '...' : '')} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};