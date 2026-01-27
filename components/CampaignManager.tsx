import React, { useState } from 'react';
import { Send, Wand2, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import { Client, MessageTemplate } from '../types';
import { generateCampaignMessage } from '../services/geminiService';

interface CampaignManagerProps {
  clients: Client[];
}

export const CampaignManager: React.FC<CampaignManagerProps> = ({ clients }) => {
  const [selectedSegment, setSelectedSegment] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState<MessageTemplate | null>(null);
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  // Filter out "Unknown" or unsegmented groups effectively if needed, 
  // currently listing all unique segments
  const segments = Array.from(new Set(clients.map(c => c.segment))).filter(s => s !== 'Não Segmentado');

  const handleGenerate = async () => {
    if (!selectedSegment) return;
    setIsGenerating(true);
    setGeneratedMessage(null);
    setSendStatus('idle');

    try {
      const segmentClients = clients.filter(c => c.segment === selectedSegment);
      const message = await generateCampaignMessage(selectedSegment, segmentClients);
      setGeneratedMessage(message);
    } catch (e) {
      alert("Erro ao gerar mensagem. Verifique a chave de API.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = () => {
    setSendStatus('sending');
    // Simulate API call delay
    setTimeout(() => {
      setSendStatus('sent');
    }, 2000);
  };

  const getClientsInSegment = () => {
    return clients.filter(c => c.segment === selectedSegment);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Campanhas Inteligentes</h2>
        <p className="text-slate-500">Crie mensagens personalizadas para cada segmento usando IA.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Configuration */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">1. Selecione o Segmento</h3>
            
            {segments.length === 0 ? (
              <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg text-sm flex items-start">
                <AlertCircle size={16} className="mt-0.5 mr-2 flex-shrink-0" />
                Você precisa executar a segmentação no Dashboard primeiro para ter grupos disponíveis.
              </div>
            ) : (
              <div className="space-y-3">
                {segments.map(segment => (
                  <label 
                    key={segment} 
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all
                      ${selectedSegment === segment 
                        ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                        : 'border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    <input 
                      type="radio" 
                      name="segment" 
                      className="sr-only"
                      checked={selectedSegment === segment}
                      onChange={() => setSelectedSegment(segment)}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">{segment}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {clients.filter(c => c.segment === segment).length} destinatários
                      </div>
                    </div>
                    {selectedSegment === segment && <CheckCircle size={18} className="text-primary" />}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">2. Gerar Conteúdo</h3>
            <p className="text-sm text-slate-600 mb-4">
              O Agente Gemini analisará o perfil dos clientes selecionados para criar um tom de voz adequado.
            </p>
            <button
              onClick={handleGenerate}
              disabled={!selectedSegment || isGenerating}
              className="w-full flex items-center justify-center py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Wand2 className="animate-spin mr-2" size={18} />
                  Criando Copy...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2" size={18} />
                  Gerar com IA
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Panel: Preview & Action */}
        <div className="lg:col-span-2">
          {generatedMessage ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-slate-800">Preview da Mensagem</h3>
                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-md uppercase">
                  Rascunho
                </span>
              </div>
              
              <div className="p-6 flex-1 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Assunto</label>
                  <input 
                    type="text" 
                    value={generatedMessage.subject} 
                    readOnly
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-medium"
                  />
                </div>
                
                <div className="flex-1">
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Corpo do Email</label>
                   <textarea
                    value={generatedMessage.body}
                    readOnly
                    className="w-full h-64 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 leading-relaxed resize-none"
                   />
                </div>

                <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600 border border-slate-200">
                   <p><span className="font-semibold">Alvo:</span> {getClientsInSegment().length} contatos em "{selectedSegment}"</p>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-between items-center">
                 <button className="text-slate-500 hover:text-primary flex items-center text-sm font-medium">
                    <Copy size={16} className="mr-2" />
                    Copiar Texto
                 </button>

                 {sendStatus === 'sent' ? (
                   <button disabled className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg font-bold">
                     <CheckCircle size={20} className="mr-2" />
                     Enviado com Sucesso!
                   </button>
                 ) : (
                   <button 
                    onClick={handleSend}
                    disabled={sendStatus === 'sending'}
                    className="flex items-center px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold transition-colors shadow-sm disabled:opacity-70"
                   >
                     {sendStatus === 'sending' ? 'Enviando...' : (
                       <>
                         <Send size={18} className="mr-2" />
                         Disparar Campanha
                       </>
                     )}
                   </button>
                 )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
               <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                 <Wand2 size={32} className="text-slate-300" />
               </div>
               <h3 className="text-lg font-medium text-slate-600 mb-2">Aguardando Geração</h3>
               <p className="max-w-md">
                 Selecione um segmento ao lado e clique em "Gerar com IA" para criar uma mensagem personalizada.
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};