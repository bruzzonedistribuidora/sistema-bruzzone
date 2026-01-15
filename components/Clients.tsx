
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    User, Plus, Search, FileText, Globe, X, Copy, MessageCircle, Key, 
    ExternalLink, History, Eye, ChevronRight, ShoppingBag, Receipt, 
    Printer, Mail, DollarSign, ArrowDownLeft, CheckCircle, Wallet, 
    CreditCard, Package, Info, CheckSquare, Square, ArrowRight, Scroll, Smartphone, Landmark, UserCheck, Phone, QrCode, Banknote, FileCheck, FileUp, Columns, Table as TableIcon, Hash, Tag, Notebook, Percent, Settings2,
    ToggleLeft, ToggleRight, List,
    Zap, RefreshCw, Save, Trash2, Pencil, MapPin, Users
} from 'lucide-react';
import { Client, CurrentAccountMovement, CompanyConfig, TaxCondition, AuthorizedContact, PriceList } from '../types';
import { fetchCompanyByCuit } from '../services/geminiService';

interface ClientsProps {
    initialClientId?: string;
    onOpenPortal?: (client: Client) => void;
    onOpenBalances?: () => void;
}

const Clients: React.FC<ClientsProps> = ({ initialClientId, onOpenPortal, onOpenBalances }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isSearchingCuit, setIsSearchingCuit] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [modalTab, setModalTab] = useState<'GENERAL' | 'CLIENT' | 'CONTACTS' | 'MOVEMENTS'>('GENERAL');
  
  const loadClients = () => {
    const saved = localStorage.getItem('ferrecloud_clients');
    setClients(saved ? JSON.parse(saved) : []);
  };

  useEffect(() => { 
    loadClients();
    window.addEventListener('storage', loadClients);
    window.addEventListener('ferrecloud_sync_pulse', loadClients);
    return () => {
      window.removeEventListener('storage', loadClients);
      window.removeEventListener('ferrecloud_sync_pulse', loadClients);
    };
  }, []);

  const filteredClients = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return clients;
    return clients.filter(c => 
        (c.name || '').toLowerCase().includes(term) || 
        (c.cuit || '').includes(term) ||
        (c.number || '').includes(term)
    );
  }, [clients, searchTerm]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full flex flex-col space-y-6 animate-fade-in bg-slate-50 overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-[2.5rem] border border-gray-200 shadow-sm gap-4 shrink-0">
            <div>
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                    <Users className="text-indigo-600"/> Gestión de Clientes
                </h2>
                <div className="relative mt-4 w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18}/>
                    <input 
                        type="text" 
                        placeholder="Buscar por Nombre, CUIT..." 
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-2xl text-xs font-black outline-none border-2 border-transparent focus:border-indigo-500 uppercase" 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                    />
                </div>
            </div>
            <button onClick={() => { setEditingClient(null); setIsEditing(false); setIsNewClientModalOpen(true); }} className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl flex items-center gap-3 font-black shadow-xl hover:bg-indigo-700 transition-all uppercase text-xs tracking-widest">
                <Plus size={20} /> Nuevo Cliente
            </button>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left">
                    <thead className="bg-slate-900 text-[10px] text-slate-300 uppercase font-black tracking-widest sticky top-0 z-10">
                        <tr>
                            <th className="px-8 py-5">Cliente</th>
                            <th className="px-8 py-5 text-right">Saldo</th>
                            <th className="px-8 py-5 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredClients.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="py-32 text-center">
                                    <div className="flex flex-col items-center opacity-20">
                                        <Users size={64} strokeWidth={1} className="mb-4" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">No hay clientes registrados</p>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredClients.map(client => (
                            <tr key={client.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-8 py-5">
                                    <div className="font-black text-slate-800 text-sm uppercase leading-none mb-1.5">{client.name}</div>
                                    <div className="text-[10px] text-gray-400 font-mono tracking-tighter">CUIT: {client.cuit || 'S/C'}</div>
                                </td>
                                <td className={`px-8 py-5 text-right font-black text-lg tracking-tighter ${client.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    ${client.balance.toLocaleString('es-AR')}
                                </td>
                                <td className="px-8 py-5 text-center">
                                    <div className="flex justify-center gap-2">
                                        <button onClick={onOpenBalances} title="Ver Cuenta Corriente" className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all"><DollarSign size={18}/></button>
                                        <button onClick={() => onOpenPortal?.(client)} className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all"><Globe size={18}/></button>
                                        <button onClick={() => { setEditingClient(client); setIsEditing(true); setIsNewClientModalOpen(true); }} className="p-3 bg-slate-100 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all"><Pencil size={18}/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default Clients;
