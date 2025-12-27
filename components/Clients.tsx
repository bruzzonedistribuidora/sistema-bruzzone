
import React, { useState, useEffect, useMemo } from 'react';
import { 
    User, Plus, Search, FileText, Globe, X, Copy, MessageCircle, Key, 
    ExternalLink, History, Eye, ChevronRight, ShoppingBag, Receipt, 
    Printer, Mail, DollarSign, ArrowDownLeft, CheckCircle, Wallet, 
    CreditCard, Package, Info, CheckSquare, Square, ArrowRight, Scroll, Smartphone, Landmark, UserPlus, Loader2, Zap, Save,
    ShieldCheck, Link, Share2, Edit, Trash2, FileSpreadsheet, LayoutTemplate, ChevronLeft, MapPin, Users, Send, Download, AlertTriangle, Building,
    Calendar, Shield, Star, Gift, Sparkles, RefreshCw, Pencil
} from 'lucide-react';
import { Client, CurrentAccountMovement, CompanyConfig } from '../types';
import { fetchCompanyByCuit } from '../services/geminiService';

interface ClientsProps {
    initialClientId?: string;
    onOpenPortal?: (client: Client) => void;
}

const Clients: React.FC<ClientsProps> = ({ initialClientId, onOpenPortal }) => {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isSearchingCuit, setIsSearchingCuit] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [clients, setClients] = useState<Client[]>(() => {
      const saved = localStorage.getItem('ferrecloud_clients');
      return saved ? JSON.parse(saved) : [
        { id: '1', name: 'Constructora del Norte', cuit: '30-12345678-9', phone: '11-4455-6677', address: 'Av. Libertador 1200', balance: 540000, limit: 1000000, points: 12500, portalEnabled: true, portalHash: 'C-D-N-2024' },
        { id: '2', name: 'Juan Perez', cuit: '20-11223344-5', phone: '11-2233-4455', address: 'Calle Falsa 123', balance: 15000, limit: 50000, points: 450, portalEnabled: false }
      ];
  });

  const companyConfig: CompanyConfig = useMemo(() => {
    const saved = localStorage.getItem('company_config');
    return saved ? JSON.parse(saved) : { loyalty: { enabled: true, valuePerPoint: 2, minPointsToRedeem: 500 } };
  }, []);

  const [movements, setMovements] = useState<CurrentAccountMovement[]>(() => {
      const saved = localStorage.getItem('ferrecloud_movements');
      return saved ? JSON.parse(saved) : [];
  });

  const [clientForm, setClientForm] = useState<Partial<Client>>({
      id: '', name: '', cuit: '', phone: '', balance: 0, limit: 100000, points: 0, address: '', email: '', portalEnabled: true
  });

  useEffect(() => { localStorage.setItem('ferrecloud_clients', JSON.stringify(clients)); }, [clients]);
  useEffect(() => { localStorage.setItem('ferrecloud_movements', JSON.stringify(movements)); }, [movements]);

  const handleSearchCuit = async () => {
      if (!clientForm.cuit || clientForm.cuit.length < 8) return;
      setIsSearchingCuit(true);
      try {
          const data = await fetchCompanyByCuit(clientForm.cuit);
          if (data) setClientForm(prev => ({ ...prev, name: data.name || data.razonSocial, address: data.address || data.domicilio || '' }));
      } catch (err) { console.error(err); } finally { setIsSearchingCuit(false); }
  };

  const handleSaveClient = () => {
      if (!clientForm.name || !clientForm.cuit) return;
      setClients(prev => {
          if (isEditing && clientForm.id) {
              return prev.map(c => c.id === clientForm.id ? { ...c, ...clientForm } as Client : c);
          } else {
              return [{...clientForm as Client, id: Date.now().toString(), balance: 0, points: 0, portalHash: `p-${Math.random().toString(36).substr(2, 5)}`}, ...prev];
          }
      });
      setIsNewClientModalOpen(false);
  };

  const filteredClients = useMemo(() => {
    return clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.cuit.includes(searchTerm));
  }, [clients, searchTerm]);

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col space-y-6 animate-fade-in">
        <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] border border-gray-200 shadow-sm">
            <div>
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Fichero de Clientes</h2>
                <div className="relative mt-4 w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16}/>
                    <input type="text" placeholder="Buscar..." className="w-full pl-10 p-2 bg-slate-50 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-indigo-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
            </div>
            <button onClick={() => { setIsEditing(false); setClientForm({name: '', cuit: '', phone: '', address: '', limit: 100000, points: 0, portalEnabled: true}); setIsNewClientModalOpen(true); }} className="bg-ferre-orange text-white px-8 py-3 rounded-2xl flex items-center gap-3 font-black shadow-xl shadow-orange-100 hover:bg-orange-600 transition-all uppercase text-xs tracking-widest">
                <Plus size={18} /> Nuevo Cliente
            </button>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left">
                    <thead className="bg-slate-900 text-[10px] text-slate-300 uppercase font-black tracking-widest sticky top-0 z-10">
                        <tr>
                            <th className="px-8 py-5">Razón Social / CUIT</th>
                            <th className="px-8 py-5 text-right">Saldo Actual</th>
                            <th className="px-8 py-5 text-right">Puntos</th>
                            <th className="px-8 py-5 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredClients.map(client => (
                            <tr key={client.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400">{client.name.charAt(0)}</div>
                                        <div>
                                            <div className="font-black text-slate-800 text-sm uppercase tracking-tight">{client.name}</div>
                                            <div className="text-[10px] text-gray-400 font-mono">{client.cuit}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className={`px-8 py-5 text-right font-black text-lg ${client.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    ${client.balance.toLocaleString('es-AR')}
                                </td>
                                <td className="px-8 py-5 text-right font-black text-indigo-600">
                                    {client.points || 0} PTS
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex justify-center gap-2">
                                        <button onClick={() => { setSelectedClient(client); setIsHistoryOpen(true); }} className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all"><History size={16}/></button>
                                        <button onClick={() => { setIsEditing(true); setClientForm(client); setIsNewClientModalOpen(true); }} className="p-2.5 bg-slate-100 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"><Pencil size={16}/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {isNewClientModalOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
                <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col">
                    <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                        <h3 className="text-xl font-black uppercase tracking-tighter">{isEditing ? 'Editar Ficha' : 'Nueva Alta de Cliente'}</h3>
                        <button onClick={() => setIsNewClientModalOpen(false)}><X size={28}/></button>
                    </div>
                    <div className="p-10 space-y-6 bg-slate-50/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-1">
                                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">CUIT / DNI</label>
                                <div className="flex gap-2">
                                    <input type="text" className="flex-1 p-3 bg-white border border-gray-200 rounded-xl focus:border-indigo-500 outline-none font-bold" value={clientForm.cuit} onChange={e => setClientForm({...clientForm, cuit: e.target.value})} />
                                    <button onClick={handleSearchCuit} className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition-all">
                                        {isSearchingCuit ? <RefreshCw className="animate-spin" size={16}/> : <Zap size={16}/>}
                                    </button>
                                </div>
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Razón Social</label>
                                <input type="text" className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:border-indigo-500 outline-none font-bold uppercase" value={clientForm.name} onChange={e => setClientForm({...clientForm, name: e.target.value.toUpperCase()})} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Domicilio</label>
                                <input type="text" className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:border-indigo-500 outline-none font-bold" value={clientForm.address} onChange={e => setClientForm({...clientForm, address: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Límite de Crédito ($)</label>
                                <input type="number" className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:border-indigo-500 outline-none font-black text-indigo-600" value={clientForm.limit} onChange={e => setClientForm({...clientForm, limit: parseFloat(e.target.value) || 0})} />
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl">
                                <div onClick={() => setClientForm({...clientForm, portalEnabled: !clientForm.portalEnabled})} className={`w-10 h-5 rounded-full relative transition-all cursor-pointer ${clientForm.portalEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${clientForm.portalEnabled ? 'right-1' : 'left-1'}`}></div>
                                </div>
                                <span className="text-[9px] font-black text-slate-500 uppercase">Habilitar Portal QR</span>
                            </div>
                        </div>
                        <button onClick={handleSaveClient} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
                            <Save size={18}/> {isEditing ? 'Guardar Cambios' : 'Registrar Cliente'}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Clients;
