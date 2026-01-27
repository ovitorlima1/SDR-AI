import React, { useState } from 'react';
import { Search, Loader2, Zap, Building2, TrendingUp, MessageSquare, ExternalLink, Shield, Briefcase, PlayCircle, AlertCircle } from 'lucide-react';
import { BilliAnalysis } from '../types';
import { qualifyCompany } from '../services/geminiService';

export const LeadQualifier: React.FC = () => {
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BilliAnalysis | null>(null);

  const handleQualify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;

    setLoading(true);
    setResult(null);
    try {
      const data = await qualifyCompany(companyName);
      setResult(data);
    } catch (error) {
      alert("Erro ao qualificar empresa. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const getProfileColor = (code: string) => {
    switch (code) {
      case 'A': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'B': return 'bg-indigo-100 text-indigo-800 border-indigo-200'; // Ideal
      case 'C': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'D': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const ScoreBar = ({ score, max }: { score: number, max: number }) => (
    <div className="flex gap-1 h-2 mt-2">
      {[...Array(max)].map((_, i) => (
        <div 
          key={i} 
          className={`flex-1 rounded-full ${i < score ? 'bg-primary' : 'bg-slate-200'}`}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="text-center md:text-left">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center md:justify-start justify-center gap-2">
          <Zap className="text-yellow-500 fill-yellow-500" />
          Qualificador BILLI
        </h2>
        <p className="text-slate-500">Análise profunda de leads usando dados públicos e inteligência artificial.</p>
      </div>

      {/* Input Section */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <form onSubmit={handleQualify} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Digite o nome da empresa (ex: Weg, Nubank, Localiza...)"
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/50 text-lg"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !companyName}
            className="px-8 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[160px]"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={20} />
                Analisando...
              </>
            ) : (
              'Qualificar Lead'
            )}
          </button>
        </form>
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
          <Shield size={12} />
          <span>Apenas dados públicos são consultados. Nenhuma base sigilosa é acessada.</span>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Main Score Card */}
          <div className="md:col-span-1 space-y-6">
            <div className={`p-6 rounded-xl border-2 ${getProfileColor(result.profileCode).replace('bg-', 'bg-opacity-20 ')} shadow-sm relative overflow-hidden`}>
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="text-9xl font-black">{result.profileCode}</span>
              </div>
              
              <div className="relative z-10">
                <p className="text-sm font-bold uppercase tracking-wider opacity-70">Perfil Identificado</p>
                <h3 className="text-3xl font-bold mt-1 mb-1">{result.profileName}</h3>
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-xs font-semibold px-2 py-1 bg-white/50 rounded-md">
                    Score: {result.billiTotalScore}/12
                  </span>
                  {result.profileCode === 'B' && (
                    <span className="text-xs font-bold px-2 py-1 bg-green-500 text-white rounded-md flex items-center gap-1">
                      <Zap size={10} fill="currentColor" /> IDEAL
                    </span>
                  )}
                </div>

                <div className="bg-white/60 p-4 rounded-lg backdrop-blur-sm">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <MessageSquare size={16} /> Narrativa Sugerida
                  </h4>
                  <p className="text-sm italic text-slate-700">"{result.narrative}"</p>
                </div>

                <div className="mt-4 p-4 bg-slate-900 text-white rounded-lg shadow-lg">
                  <h4 className="font-bold text-sm mb-1 flex items-center gap-2 text-green-400">
                    <PlayCircle size={16} /> Próximo Passo
                  </h4>
                  <p className="text-sm">{result.action}</p>
                </div>
              </div>
            </div>

            {/* Sources */}
            {result.sources && result.sources.length > 0 && (
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Fontes da Análise</h4>
                <div className="space-y-2">
                  {result.sources.map((source, idx) => (
                    <a 
                      key={idx} 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-blue-600 hover:underline truncate"
                    >
                      <ExternalLink size={10} />
                      <span className="truncate">{source.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Detailed Breakdown */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="font-bold text-slate-800 text-lg">Detalhamento dos Eixos</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Maturity */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 text-slate-700 font-semibold">
                    <Building2 size={18} className="text-indigo-500" />
                    Maturidade
                  </div>
                  <span className="font-bold text-slate-900">{result.axes.maturity.score}/{result.axes.maturity.max}</span>
                </div>
                <ScoreBar score={result.axes.maturity.score} max={result.axes.maturity.max} />
                <p className="text-xs text-slate-500 mt-3 leading-relaxed">{result.axes.maturity.reasoning}</p>
              </div>

              {/* Energy */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 text-slate-700 font-semibold">
                    <Zap size={18} className="text-yellow-500" />
                    Energia & Infra
                  </div>
                  <span className="font-bold text-slate-900">{result.axes.energy.score}/{result.axes.energy.max}</span>
                </div>
                <ScoreBar score={result.axes.energy.score} max={result.axes.energy.max} />
                <p className="text-xs text-slate-500 mt-3 leading-relaxed">{result.axes.energy.reasoning}</p>
              </div>

              {/* Capital */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 text-slate-700 font-semibold">
                    <TrendingUp size={18} className="text-green-500" />
                    Relação c/ Capital
                  </div>
                  <span className="font-bold text-slate-900">{result.axes.capital.score}/{result.axes.capital.max}</span>
                </div>
                <ScoreBar score={result.axes.capital.score} max={result.axes.capital.max} />
                <p className="text-xs text-slate-500 mt-3 leading-relaxed">{result.axes.capital.reasoning}</p>
              </div>

              {/* Language */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 text-slate-700 font-semibold">
                    <MessageSquare size={18} className="text-purple-500" />
                    Linguagem Estratégica
                  </div>
                  <span className="font-bold text-slate-900">{result.axes.language.score}/{result.axes.language.max}</span>
                </div>
                <ScoreBar score={result.axes.language.score} max={result.axes.language.max} />
                <p className="text-xs text-slate-500 mt-3 leading-relaxed">{result.axes.language.reasoning}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex gap-3">
              <AlertCircle className="text-slate-400 shrink-0" size={20} />
              <div>
                <h4 className="text-sm font-semibold text-slate-700">Sobre o Setor</h4>
                <p className="text-sm text-slate-600">
                  Empresa identificada como atuante em: <span className="font-medium text-slate-900">{result.sector}</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!result && !loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 opacity-50 pointer-events-none select-none">
          <div className="bg-gray-50 h-32 rounded-lg border border-gray-200"></div>
          <div className="bg-gray-50 h-32 rounded-lg border border-gray-200"></div>
          <div className="bg-gray-50 h-32 rounded-lg border border-gray-200"></div>
          <div className="bg-gray-50 h-32 rounded-lg border border-gray-200"></div>
        </div>
      )}
    </div>
  );
};