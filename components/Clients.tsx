
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    User, Plus, Search, FileText, Globe, X, Copy, MessageCircle, Key, 
    ExternalLink, History, Eye, ChevronRight, ShoppingBag, Receipt, 
    Printer, Mail, DollarSign, ArrowDownLeft, CheckCircle, Wallet, 
    CreditCard, Package, Info, CheckSquare, Square, ArrowRight, Scroll, Smartphone, Landmark, UserPlus, Loader2, Zap, Save,
    ShieldCheck, Link, Share2, Edit, Trash2, FileSpreadsheet, LayoutTemplate, ChevronLeft, MapPin, Users, Send, Download, AlertTriangle, Building,
    Calendar, Shield, Star, Gift, Sparkles, RefreshCw, Pencil, ArrowLeft,
    UserCheck, Phone, QrCode, Banknote, FileCheck, FileUp, Columns, Table as TableIcon, Hash, Tag, Notebook, Percent
} from 'lucide-react';
import { Client, CurrentAccountMovement, CompanyConfig, TaxCondition } from '../types';
import { fetchCompanyByCuit } from '../services/geminiService';

const Clients: React.FC<ClientsProps> = ({ initialClientId, onOpenPortal }) => {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isSearchingCuit, setIsSearchingCuit] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalTab, setModalTab] = useState<'GENERAL' | 'COMMERCIAL'>('GENERAL');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isImportMappingOpen, setIsImportMappingOpen] = useState(false);
  const [importRows, setImportRows] = useState<string[][]>([]);
  const [importMapping, setImportMapping] = useState<Record<string, number>>({});

  const [clients, setClients] = useState<Client[]>(() => {
      const saved = localStorage.getItem('ferrecloud_clients');
      return saved ? JSON.parse(saved) : [];
  });

  const companyConfig: CompanyConfig = useMemo(() => {
    const saved = localStorage.getItem('company_config');
    return saved ? JSON.parse(saved) : { 
        loyalty: { enabled: true, valuePerPoint: 2, minPointsToRedeem: 500 },
        paymentMethods: ['EFECTIVO', 'MERCADO_PAGO', 'TRANSFERENCIA', 'CHEQUE', 'E-CHEQ']
    };
  }, []);

  const [movements, setMovements] = useState<CurrentAccountMovement[]>(() => {
      const saved = localStorage.getItem('ferrecloud_movements');
      return saved ? JSON.parse(saved) : [];
  });

  const [clientForm, setClientForm] = useState<Partial<Client>>({
      id: '', number: '', name: '', razonSocial: '', fantasyName: '', cuit: '', taxCondition: 'Consumidor Final',
      locality: '', address: '', phone: '', email: '', description: '', balance: 0, limit: 100000, 
      points: 0, specialDiscount: 0, currency: 'ARS', contactName: '', portalEnabled: true
  });

  const [receiptForm, setReceiptForm] = useState({
      amount: 0,
      method: companyConfig.paymentMethods?.[0] || 'EFECTIVO',
      notes: ''
  });

  useEffect(() => {
      if (initialClientId) {
          const c = clients.find(cl => cl.id === initialClientId);
          if (c) {
              setSelectedClient(c);
              setIsHistoryOpen(true);
          }
      }
  }, [initialClientId, clients]);

  useEffect(() => { 
      localStorage.setItem('ferrecloud_clients', JSON.stringify(clients)); 
  }, [clients]);

  useEffect(() => {
      localStorage.setItem('ferrecloud_movements', JSON.stringify(movements));
  }, [movements]);

  const handleStartImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const content = event.target?.result as string;
        const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
        if (lines.length > 0) {
            const firstLine = lines[0];
            const separator = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';
            const rows = lines.map(line => line.split(separator).map(cell => cell.trim()));
            setImportRows(rows);
            setImportMapping({});
            setIsImportMappingOpen(true);
        }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const confirmImport = () => {
      if (importMapping.name === undefined || importMapping.cuit === undefined) {
          alert("Debes mapear al menos el Nombre y el CUIT.");
          return;
      }
      const currentCuits = new Set(clients.map(c => c.cuit.replace(/[^0-9]/g, '')));
      const newClients: Client[] = [];
      importRows.forEach((row, index) => {
          const name = row[importMapping.name];
          const cuit = row[importMapping.cuit];
          if (!name || !cuit || name.toLowerCase() === 'nombre' || name.toLowerCase() === 'razon social') return;
          const cleanCuit = cuit.replace(/[^0-9]/g, '');
          if (!currentCuits.has(cleanCuit)) {
              newClients.push({
                  ...clientForm,
                  id: `cli-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                  name: name.toUpperCase(),
                  cuit: cuit,
                  phone: importMapping.phone !== undefined ? row[importMapping.phone] : '',
                  address: importMapping.address !== undefined ? row[importMapping.address] : '',
                  email: importMapping.email !== undefined ? row[importMapping.email] : '',
                  balance: 0, points: 0, portalEnabled: true,
                  portalHash: `p-${Math.random().toString(36).substr(2, 6)}`
              } as Client);
              currentCuits.add(cleanCuit);
          }
      });
      setClients([...newClients, ...clients]);
      setIsImportMappingOpen(false);
  };

  const handleSearchCuit = async () => {
      if (!clientForm.cuit || clientForm.cuit.length < 8) return;
      setIsSearchingCuit(true);
      try {
          const data = await fetchCompanyByCuit(clientForm.cuit);
          if (data) setClientForm(prev => ({ 
              ...prev, 
              name: data.name || data.razonSocial || prev.name, 
              razonSocial: data.razonSocial || data.name || prev.razonSocial,
              address: data.address || data.domicilio || prev.address 
          }));
      } catch (err) { console.error(err); } finally { setIsSearchingCuit(false); }
  };

  const handleSaveClient = () => {
      if (!clientForm.name || !clientForm.cuit) {
          alert("Nombre y CUIT son obligatorios");
          return;
      }
      setClients(prev => {
          if (isEditing && clientForm.id) {
              return prev.map(c => c.id === clientForm.id ? { ...c, ...clientForm } as Client : c);
          } else {
              return [{...clientForm as Client, id: Date.now().toString(), balance: 0, points: 0, portalHash: `p-${Math.random().toString(36).substr(2, 5)}`}, ...prev];
          }
      });
      setIsNewClientModalOpen(false);
  };

  const handleRegisterReceipt = () => {
    if (!selectedClient || receiptForm.amount <= 0) return;
    const newBalance = selectedClient.balance - receiptForm.amount;
    const newMovement: CurrentAccountMovement = {
        id: `REC-${Date.now().toString().slice(-6)}`,
        clientId: selectedClient.id,
        date: new Date().toLocaleDateString(),
        voucherType: 'RECIBO DE PAGO',
        description: `Cobranza vía ${receiptForm.method}. ${receiptForm.notes}`,
        debit: 0,
        credit: receiptForm.amount,
        balance: newBalance
    };
    setMovements([newMovement, ...movements]);
    setClients(prev => prev.map(c => c.id === selectedClient.id ? { ...c, balance: newBalance } : c));
    setIsReceiptModalOpen(false);
  };

  const filteredClients = clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.cuit.includes(searchTerm));

  const CLIENT_FIELDS = [
      { key: 'name', label: 'Nombre / Razón Social', required: true },
      { key: 'cuit', label: 'CUIT / DNI', required: true },
      { key: 'phone', label: 'Teléfono', required: false },
      { key: 'address', label: 'Dirección', required: false },
      { key: 'email', label: 'Email', required: false }
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full flex flex-col space-y-6 animate-fade-in bg-slate-50 overflow-hidden">
        <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.txt" onChange={handleStartImport} />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-[2.5rem] border border-gray-200 shadow-sm gap-4 shrink-0">
            <div>
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                    <Users className="text-indigo-600"/> Fichero de Clientes
                </h2>
                <div className="relative mt-4 w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18}/>
                    <input type="text" placeholder="Nombre o CUIT..." className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-2xl text-xs font-bold outline-none border-2 border-transparent focus:border-indigo-500 uppercase" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
            </div>
            <div className="flex gap-3">
                <button onClick={() => fileInputRef.current?.click()} className="bg-indigo-50 text-indigo-600 px-6 py-3.5 rounded-2xl flex items-center gap-3 font-black border border-indigo-100 hover:bg-indigo-100 transition-all uppercase text-xs tracking-widest active:scale-95">
                    <FileUp size={20} /> Importar
                </button>
                <button onClick={() => { setModalTab('GENERAL'); setIsEditing(false); setClientForm({name: '', cuit: '', phone: '', address: '', limit: 100000, points: 0, portalEnabled: true, taxCondition: 'Consumidor Final', currency: 'ARS'}); setIsNewClientModalOpen(true); }} className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl flex items-center gap-3 font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase text-xs tracking-widest active:scale-95">
                    <Plus size={20} /> Nuevo Cliente
                </button>
            </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left">
                    <thead className="bg-slate-900 text-[10px] text-slate-300 uppercase font-black tracking-widest sticky top-0 z-10">
                        <tr>
                            <th className="px-8 py-5"># Nº / Razón Social</th>
                            <th className="px-8 py-5">Situación IVA</th>
                            <th className="px-8 py-5 text-right">Saldo</th>
                            <th className="px-8 py-5 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredClients.map(client => (
                            <tr key={client.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-11 h-11 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400 uppercase text-lg">{client.name.charAt(0)}</div>
                                        <div>
                                            <div className="font-black text-slate-800 text-sm uppercase tracking-tight leading-none mb-1.5">{client.name}</div>
                                            <div className="text-[10px] text-gray-400 font-mono font-bold tracking-tighter">Nº {client.number || '-'} • {client.cuit}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border">{client.taxCondition}</span>
                                </td>
                                <td className={`px-8 py-5 text-right font-black text-lg tracking-tighter ${client.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    ${client.balance.toLocaleString('es-AR')}
                                </td>
                                <td className="px-8 py-5 text-center">
                                    <div className="flex justify-center gap-2">
                                        <button onClick={() => { setIsEditing(true); setClientForm(client); setModalTab('GENERAL'); setIsNewClientModalOpen(true); }} className="p-3 bg-slate-100 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all active:scale-90"><Pencil size={18}/></button>
                                        <button onClick={() => onOpenPortal?.(client)} className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all active:scale-90"><Globe size={18}/></button>
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
                <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[95vh]">
                    <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg"><UserCheck size={24}/></div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tighter leading-none">{isEditing ? 'Ficha Cliente' : 'Nuevo Cliente'}</h3>
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Gestión de Cuenta y Datos Fiscales</p>
                            </div>
                        </div>
                        <button onClick={() => setIsNewClientModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28}/></button>
                    </div>

                    <div className="flex bg-slate-100 p-1 shrink-0">
                        <button onClick={() => setModalTab('GENERAL')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${modalTab === 'GENERAL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>1. Datos Generales</button>
                        <button onClick={() => setModalTab('COMMERCIAL')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${modalTab === 'COMMERCIAL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>2. Configuración Comercial</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-slate-50/30 custom-scrollbar">
                        {modalTab === 'GENERAL' ? (
                            <div className="space-y-6 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Número de Cliente</label>
                                        <div className="relative">
                                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                                            <input type="text" className="w-full pl-11 p-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none font-bold uppercase" value={clientForm.number} onChange={e => setClientForm({...clientForm, number: e.target.value})} placeholder="CLI-001..." />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Situación Tributaria</label>
                                        <select className="w-full p-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none font-bold" value={clientForm.taxCondition} onChange={e => setClientForm({...clientForm, taxCondition: e.target.value as TaxCondition})}>
                                            <option value="Consumidor Final">Consumidor Final</option>
                                            <option value="Responsable Inscripto">Responsable Inscripto</option>
                                            <option value="Monotributo">Monotributo</option>
                                            <option value="Exento">Exento</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">CUIT / DNI</label>
                                        <div className="flex gap-2">
                                            <input type="text" className="flex-1 p-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none font-bold tracking-widest" value={clientForm.cuit} onChange={e => setClientForm({...clientForm, cuit: e.target.value})} placeholder="30-..." />
                                            <button onClick={handleSearchCuit} className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 shadow-lg" disabled={isSearchingCuit}>
                                                {isSearchingCuit ? <RefreshCw className="animate-spin" size={20}/> : <Zap size={20}/>}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Razón Social</label>
                                        <input type="text" className="w-full p-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none font-bold uppercase" value={clientForm.razonSocial} onChange={e => setClientForm({...clientForm, razonSocial: e.target.value.toUpperCase(), name: e.target.value.toUpperCase()})} placeholder="Nombre legal..." />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre Fantasía</label>
                                        <input type="text" className="w-full p-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none font-bold uppercase" value={clientForm.fantasyName} onChange={e => setClientForm({...clientForm, fantasyName: e.target.value.toUpperCase()})} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Localidad</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                                            <input type="text" className="w-full pl-11 p-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none font-bold uppercase" value={clientForm.locality} onChange={e => setClientForm({...clientForm, locality: e.target.value})} />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Domicilio</label>
                                    <input type="text" className="w-full p-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none font-bold uppercase" value={clientForm.address} onChange={e => setClientForm({...clientForm, address: e.target.value})} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Teléfono</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                                            <input type="text" className="w-full pl-11 p-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none font-bold" value={clientForm.phone} onChange={e => setClientForm({...clientForm, phone: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-mail</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                                            <input type="email" className="w-full pl-11 p-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none font-bold" value={clientForm.email} onChange={e => setClientForm({...clientForm, email: e.target.value})} />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descripción / Notas</label>
                                    <textarea className="w-full p-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none font-medium h-24 resize-none" value={clientForm.description} onChange={e => setClientForm({...clientForm, description: e.target.value})} placeholder="Detalles internos sobre el cliente..." />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8 animate-fade-in">
                                <div className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">Descuento Especial (%)</label>
                                            <div className="relative">
                                                {/* Fix: Added missing Percent icon in the input field */}
                                                <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                                                <input type="number" className="w-full pl-11 p-4 bg-indigo-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-black text-xl text-indigo-700" value={clientForm.specialDiscount} onChange={e => setClientForm({...clientForm, specialDiscount: parseFloat(e.target.value) || 0})} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Moneda Predeterminada</label>
                                            <select className="w-full p-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none font-bold" value={clientForm.currency} onChange={e => setClientForm({...clientForm, currency: e.target.value})}>
                                                <option value="ARS">Pesos Argentinos ($)</option>
                                                <option value="USD">Dólar (U$D)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contacto del Cliente / Autorizado</label>
                                        <div className="relative">
                                            <Notebook className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                                            <input type="text" className="w-full pl-11 p-4 bg-white border border-gray-200 rounded-2xl outline-none font-bold uppercase" value={clientForm.contactName} onChange={e => setClientForm({...clientForm, contactName: e.target.value})} placeholder="Nombre de la persona de contacto..." />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Límite de Crédito ($)</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                                            <input type="number" className="w-full pl-11 p-4 bg-white border border-gray-200 rounded-2xl outline-none font-black text-xl" value={clientForm.limit} onChange={e => setClientForm({...clientForm, limit: parseFloat(e.target.value) || 0})} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-8 bg-white border-t border-gray-100 flex justify-end gap-4 shrink-0">
                        <button onClick={() => setIsNewClientModalOpen(false)} className="px-8 py-3 text-gray-400 font-black text-[10px] uppercase tracking-widest">Cancelar</button>
                        <button onClick={handleSaveClient} className="bg-slate-900 text-white px-12 py-4 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl flex items-center gap-3">
                            <Save size={18}/> {isEditing ? 'Guardar Cambios' : 'Registrar Cliente'}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

interface ClientsProps {
    initialClientId?: string;
    onOpenPortal?: (client: Client) => void;
}

export default Clients;
