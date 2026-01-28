
import React, { useState, useRef } from 'react';
import { Search, Filter, Briefcase, Users, Building, Plus, Upload, X, Target, Zap } from 'lucide-react';
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws) as any[];

      const importedClients: Client[] = data.map((row: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: row['NOME'] || row['Nome'] || 'Sem Nome',
        company: row['EMPRESA'] || row['Empresa'] || 'Sem Empresa',
        industry: row['TIPO_TARIFA'] || row['Tipo Tarifa'] || 'Energia',
        email: row['EMAIL'] || row['Email'] || '',
        role: row['CARGO'] || row['Cargo'] || 'Contato',
        employees: Number(row['Funcionarios'] || row['Employees']) || 1,
        segment: 'Não Segmentado'
      }));

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
          <p className="text-slate-500">Gerencie e visualize seus leads detalhadamente.</p>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
           >
            <Upload size={18} className="mr-2" />
            Importar Excel
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls, .csv" className="hidden" />
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
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
            placeholder="Buscar por nome ou empresa..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-transparent bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Cliente</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Segmento & Racional</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Detalhes</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-center">Ações LIA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold mr-3">
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{client.name}</div>
                        <div className="text-sm text-slate-500">{client.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSegmentColor(client.segment)}`}>
                      {client.segment}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1 text-sm text-slate-600">
                      <div className="flex items-center"><Building size={14} className="mr-2 text-slate-400" />{client.company}</div>
                      <div className="flex items-center"><Briefcase size={14} className="mr-2 text-slate-400" />{client.industry}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => onQualify && onQualify(client.company)}
                      title="Qualificar com LIA"
                      className="inline-flex items-center justify-center p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                    >
                      <Zap size={18} className="fill-current" />
                      <span className="ml-2 text-xs font-bold hidden group-hover:inline">Qualificar</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Novo Cliente</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input name="name" value={newClient.name} onChange={handleInputChange} placeholder="Nome" className="w-full p-2 border rounded" required />
              <input name="company" value={newClient.company} onChange={handleInputChange} placeholder="Empresa" className="w-full p-2 border rounded" required />
              <input name="industry" value={newClient.industry} onChange={handleInputChange} placeholder="Indústria" className="w-full p-2 border rounded" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 p-2 border rounded">Cancelar</button>
                <button type="submit" className="flex-1 p-2 bg-primary text-white rounded">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
