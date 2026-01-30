
import React, { useState, useRef } from 'react';
import { Search, Filter, Briefcase, Users, Building, Plus, Upload, X, Target, Zap, FileSpreadsheet, Info } from 'lucide-react';
import { Client } from '../types';
import * as XLSX from 'xlsx';

interface ClientListProps {
  clients: Client[];
  setClients: (clients: Client[]) => void;
  onQualify?: (companyName: string) => void;
}

export const ClientList: React.FC<ClientListProps> = ({ clients, setClients, onQualify }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newClient, setNewClient] = useState<Partial<Client>>({
    name: '', email: '', company: '', role: '', industry: '', employees: 0, segment: 'Não Segmentado'
  });

  const segments = Array.from(new Set(clients.map(c => c.segment)));

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          client.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSegment = selectedSegment === 'all' || client.segment === selectedSegment;
    return matchesSearch && matchesSegment;
  });

  const getSegmentColor = (segment: string) => {
    switch(segment) {
      case 'Não Segmentado': return 'bg-gray-100 text-gray-600';
      default: return 'bg-indigo-50 text-indigo-700 border border-indigo-100';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewClient(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name || !newClient.company) return;

    const clientToAdd: Client = {
      id: Math.random().toString(36).substr(2, 9),
      name: newClient.name!,
      email: newClient.email || '',
      company: newClient.company!,
      role: newClient.role || '',
      industry: newClient.industry || 'Outros',
      employees: Number(newClient.employees) || 1,
      segment: 'Não Segmentado',
      ...newClient as any
    };

    setClients([clientToAdd, ...clients]);
    setIsModalOpen(false);
    setNewClient({
      name: '', email: '', company: '', role: '', industry: '', employees: 0, segment: 'Não Segmentado'
    });
  };

  const isCnpj = (val: any) => {
    if (!val) return false;
    const str = String(val).replace(/[^\d]/g, '');
    return str.length === 14;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      
      // Lemos como matriz 2D para detectar cabeçalhos manualmente
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
      if (rows.length === 0) return;

      const firstRow = rows[0];
      const knownHeaders = ['NOME', 'EMPRESA', 'CNPJ', 'RAZAO', 'CARGO', 'EMAIL', 'INDUSTRIA'];
      
      // Detectar se a primeira linha é cabeçalho
      const hasHeader = firstRow.some(cell => 
        typeof cell === 'string' && knownHeaders.some(h => cell.toUpperCase().includes(h))
      );

      let dataToProcess = hasHeader ? rows.slice(1) : rows;
      let headerMap: Record<string, number> = {};

      if (hasHeader) {
        firstRow.forEach((cell, idx) => {
          if (cell) headerMap[String(cell).toUpperCase().trim()] = idx;
        });
      }

      const importedClients: Client[] = dataToProcess.map((row) => {
        let name = 'Sem Nome';
        let company = 'Sem Empresa';
        let industry = 'Geral';
        let email = '';
        let role = 'Lead';

        if (hasHeader) {
          // Mapeamento dinâmico baseado no cabeçalho encontrado
          const cnpjIdx = headerMap['CNPJ'];
          const nameIdx = headerMap['NOME'] || headerMap['NAME'] || headerMap['CONTATO'];
          const companyIdx = headerMap['EMPRESA'] || headerMap['COMPANY'] || headerMap['RAZÃO SOCIAL'] || headerMap['RAZAO SOCIAL'];
          const emailIdx = headerMap['EMAIL'];
          const roleIdx = headerMap['CARGO'] || headerMap['ROLE'];
          const indIdx = headerMap['INDÚSTRIA'] || headerMap['INDUSTRIA'] || headerMap['SETOR'];

          const cnpjVal = cnpjIdx !== undefined ? row[cnpjIdx] : null;
          company = String(row[companyIdx] || cnpjVal || 'Sem Empresa');
          name = String(row[nameIdx] || (cnpjVal ? `Lead CNPJ: ${cnpjVal}` : 'Sem Nome'));
          email = String(row[emailIdx] || '');
          role = String(row[roleIdx] || 'Lead');
          industry = String(row[indIdx] || 'Geral');
        } else {
          // Se não tem cabeçalho, verificamos se é uma lista de CNPJs ou se a primeira coluna é o dado principal
          const firstCell = row[0];
          if (isCnpj(firstCell)) {
            company = String(firstCell);
            name = `Lead CNPJ: ${firstCell}`;
          } else {
            company = String(firstCell || 'Sem Empresa');
            name = `Importado: ${company}`;
          }
        }

        return {
          id: Math.random().toString(36).substr(2, 9),
          name,
          company,
          industry,
          email,
          role,
          employees: 0,
          segment: 'Não Segmentado'
        };
      }).filter(c => c.company !== 'undefined' && c.company !== 'null' && c.company !== '');

      if (importedClients.length > 0) {
        setClients([...importedClients, ...clients]);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Carteira de Clientes</h2>
          <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
            <Info size={14} className="text-primary" />
            <span>Suporta planilhas completas ou apenas lista de CNPJs (coluna A).</span>
          </div>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
           >
            <FileSpreadsheet size={18} className="mr-2 text-green-600" />
            Importar Excel
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls, .csv" className="hidden" />
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus size={18} className="mr-2" />
            Novo Cliente
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome, empresa ou CNPJ..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-transparent bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative w-full md:w-64">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <select
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none bg-white"
            value={selectedSegment}
            onChange={(e) => setSelectedSegment(e.target.value)}
          >
            <option value="all">Todos os Segmentos</option>
            {segments.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Lead / Contato</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Segmento IA</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Empresa / CNPJ</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold mr-3">
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">{client.name}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">{client.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getSegmentColor(client.segment)}`}>
                      {client.segment}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center text-sm font-medium text-slate-700">
                        <Building size={14} className="mr-2 text-slate-300" />
                        {client.company}
                      </div>
                      <div className="flex items-center text-[11px] text-slate-400">
                        <Briefcase size={12} className="mr-2" />
                        {client.industry}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => onQualify && onQualify(client.company)}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-sm font-bold text-xs"
                    >
                      <Zap size={14} className="fill-current text-yellow-300" />
                      QUALIFICAR LIA
                    </button>
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Users size={48} className="opacity-10 mb-2" />
                      <p className="font-medium">Nenhum lead disponível.</p>
                      <p className="text-sm">Importe uma planilha para popular sua base de prospecção.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Novo Lead</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-full transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome do Contato</label>
                <input name="name" value={newClient.name} onChange={handleInputChange} placeholder="Ex: Diretor de Compras" className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Empresa ou CNPJ</label>
                <input name="company" value={newClient.company} onChange={handleInputChange} placeholder="Razão Social ou 00.000.000/0001-00" className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Indústria (Opcional)</label>
                <input name="industry" value={newClient.industry} onChange={handleInputChange} placeholder="Ex: Agronegócio" className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
              </div>
              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 font-bold text-slate-600 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 p-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 font-bold shadow-lg shadow-primary/20 transition-all transform active:scale-95">Salvar Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
