
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    User, Plus, Search, FileText, Globe, X, Copy, MessageCircle, Key, 
    ExternalLink, History, Eye, ChevronRight, ShoppingBag, Receipt, 
    Printer, Mail, DollarSign, ArrowDownLeft, CheckCircle, Wallet, 
    CreditCard, Package, Info, CheckSquare, Square, ArrowRight, Scroll, Smartphone, Landmark, UserPlus, Loader2, Zap, Save,
    ShieldCheck, Link, Share2, Edit, Trash2, FileSpreadsheet, LayoutTemplate, ChevronLeft, MapPin, Users, Send, Download, AlertTriangle, Building,
    Calendar, Shield, Star, Gift, Sparkles, RefreshCw, Pencil, ArrowLeft,
    UserCheck, Phone, QrCode, Banknote, FileCheck, FileUp, Columns, Table as TableIcon, Hash, Tag, Notebook, Percent, Settings2,
    ToggleLeft, ToggleRight, List
} from 'lucide-react';
import { Client, CurrentAccountMovement, CompanyConfig, TaxCondition, AuthorizedContact, PriceList } from '../types';
import { fetchCompanyByCuit } from '../services/geminiService';

interface ClientsProps {
    initialClientId?: string;
    onOpenPortal?: (client: Client) => void;
}

const Clients: React.FC<ClientsProps> = ({ initialClientId, onOpenPortal }) => {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isSearchingCuit, setIsSearchingCuit] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalTab, setModalTab] = useState<'GENERAL' | 'CLIENT' | 'CONTACTS' | 'MOVEMENTS'>('GENERAL');
  
  // Filtro de movimientos
  const [movDateStart, setMovDateStart] = useState('');
  const [movDateEnd, setMovDateEnd] = useState('');
  const [movSearch, setMovSearch] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [clients, setClients] = useState<Client[]>(() => {
      const saved = localStorage.getItem('ferrecloud_clients');
      return saved ? JSON.parse(saved) : [];
  });

  const [priceLists] = useState<PriceList[]>(() => {
      const saved = localStorage.getItem('ferrecloud_price_lists');
      return saved ? JSON.parse(saved) : [{id: '1', name: 'Lista 1 - General', active: true, type: 'BASE'}];
  });

  const [allMovements] = useState<CurrentAccountMovement[]>(() => {
      const saved = localStorage.getItem('ferrecloud_movements');
      return saved ? JSON.parse(saved) : [];
  });

  const [clientForm, setClientForm] = useState<Partial<Client>>({
      id: '', number: '', firstName: '', lastName: '', name: '', fantasyName: '', cuit: '', taxCondition: 'Consumidor Final',
      locality: '', address: '', phone: '', email: '', description: '', balance: 0, limit: 100000, 
      isLimitEnabled: false, isCurrentAccountActive: true, useAdvance: false, points: 0, 
      specialDiscount: 0, priceListId: '1', defaultPaymentMethod: 'EFECTIVO', authorizedContacts: []
  });

  useEffect(() => { 
      localStorage.setItem('ferrecloud_clients', JSON.stringify(clients)); 
  }, [clients]);

  const handleSearchCuit = async () => {
      const rawCuit = (clientForm.cuit || '').toString().trim();
      const cleanCuit = rawCuit.replace(/\D/g, '');
      if (cleanCuit.length < 10) return;

      setIsSearchingCuit(true);
      try {
          const formattedCuitForSearch = cleanCuit.length === 11 
            ? `${cleanCuit.slice(0,2)}-${cleanCuit.slice(2,10)}-${cleanCuit.slice(10)}`
            : cleanCuit;

          const data = await fetchCompanyByCuit(formattedCuitForSearch);
          if (data && data.razonSocial) {
              setClientForm(prev => ({ 
                  ...prev, 
                  name: data.razonSocial.toUpperCase(), 
                  fantasyName: data.razonSocial.toUpperCase(),
                  address: data.domicilio ? data.domicilio.toUpperCase() : prev.address,
                  taxCondition: (data.condicionIva as TaxCondition) || prev.taxCondition,
                  cuit: formattedCuitForSearch 
              }));
          }
      } catch (err) { console.error(err); } finally { setIsSearchingCuit(false); }
  };

  const handleSaveClient = () => {
      const finalName = clientForm.firstName && clientForm.lastName 
          ? `${clientForm.lastName}, ${clientForm.firstName}` 
          : (clientForm.name || clientForm.fantasyName || 'SIN NOMBRE');

      const dataToSave = { ...clientForm, name: finalName.toUpperCase() };

      setClients(prev => {
          if (isEditing && clientForm.id) {
              return prev.map(c => c.id === clientForm.id ? { ...c, ...dataToSave } as Client : c);
          } else {
              return [{...dataToSave as Client, id: `cli-${Date.now()}`, portalHash: `p-${Math.random().toString(36).substr(2, 5)}`}, ...prev];
          }
      });
      setIsNewClientModalOpen(false);
  };

  const addContact = () => {
      const newContact: AuthorizedContact = { id: `cont-${Date.now()}`, name: '', dni: '', relation: '' };
      setClientForm(prev => ({ ...prev, authorizedContacts: [...(prev.authorizedContacts || []), newContact] }));
  };

  const updateContact = (id: string, field: keyof AuthorizedContact, value: string) => {
      setClientForm(prev => ({
          ...prev,
          authorizedContacts: (prev.authorizedContacts || []).map(c => c.id === id ? { ...c, [field]: value.toUpperCase() } : c)
      }));
  };

  const filteredMovements = useMemo(() => {
      if (!isEditing || !clientForm.id) return [];
      return allMovements
          .filter(m => m.clientId === clientForm.id)
          .filter(m => !movSearch || m.description.toLowerCase().includes(movSearch.toLowerCase()) || m.voucherType.toLowerCase().includes(movSearch.toLowerCase()))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allMovements, clientForm.id, isEditing, movSearch]);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.cuit.includes(searchTerm) ||
    c.number?.includes(searchTerm)
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full flex flex-col space-y-6 animate-fade-in bg-slate-50 overflow-hidden">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-[2.5rem] border border-gray-200 shadow-sm gap-4 shrink-0">
            <div>
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                    <Users className="text-indigo-600"/> Gestión de Clientes
                </h2>
                <div className="relative mt-4 w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18}/>
                    <input type="text" placeholder="Nombre, CUIT o Nº Cliente..." className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-2xl text-xs font-bold outline-none border-2 border-transparent focus:border-indigo-500 uppercase" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
            </div>
            <div className="flex gap-3">
                <button onClick={() => { setModalTab('GENERAL'); setIsEditing(false); setClientForm({name: '', firstName: '', lastName: '', fantasyName: '', cuit: '', phone: '', email: '', address: '', balance: 0, limit: 100000, points: 0, isCurrentAccountActive: true, isLimitEnabled: false, taxCondition: 'Consumidor Final', authorizedContacts: []}); setIsNewClientModalOpen(true); }} className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl flex items-center gap-3 font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase text-xs tracking-widest active:scale-95">
                    <Plus size={20} /> Nuevo Cliente
                </button>
            </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left">
                    <thead className="bg-slate-900 text-[10px] text-slate-300 uppercase font-black tracking-widest sticky top-0 z-10">
                        <tr>
                            <th className="px-8 py-5"># Nº / Cliente</th>
                            <th className="px-8 py-5">Datos Contacto</th>
                            <th className="px-8 py-5 text-right">Saldo Deudor</th>
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
                                            <div className="text-[10px] text-gray-400 font-mono font-bold tracking-tighter">ID: {client.number || client.cuit} • {client.taxCondition}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase"><Phone size={12}/> {client.phone || '-'}</div>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 lowercase"><Mail size={12}/> {client.email || '-'}</div>
                                    </div>
                                </td>
                                <td className={`px-8 py-5 text-right font-black text-lg tracking-tighter ${client.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    ${client.balance.toLocaleString('es-AR')}
                                </td>
                                <td className="px-8 py-5 text-center">
                                    <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setIsEditing(true); setClientForm(client); setModalTab('GENERAL'); setIsNewClientModalOpen(true); }} className="p-3 bg-slate-100 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all active:scale-90"><Pencil size={18}/></button>
                                        <button onClick={() => onOpenPortal?.(client)} className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all active:scale-90"><Globe size={18}/></button>
                                        <button onClick={() => setClients(prev => prev.filter(c => c.id !== client.id))} className="p-3 bg-red-50 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all active:scale-90"><Trash2 size={18}/></button>
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
                <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh]">
                    <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg"><UserCheck size={24}/></div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tighter leading-none">{isEditing ? 'Expediente de Cliente' : 'Nuevo Cliente Maestro'}</h3>
                            </div>
                        </div>
                        <button onClick={() => setIsNewClientModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28}/></button>
                    </div>

                    <div className="flex bg-slate-100 p-1 shrink-0 overflow-x-auto no-scrollbar">
                        {[
                            { id: 'GENERAL', label: 'Datos Generales', icon: User },
                            { id: 'CLIENT', label: 'Comercial & CC', icon: DollarSign },
                            { id: 'CONTACTS', label: 'Contactos Autorizados', icon: Users },
                            { id: 'MOVEMENTS', label: 'Historial de Ventas', icon: History }
                        ].map(tab => (
                            <button 
                                key={tab.id}
                                onClick={() => setModalTab(tab.id as any)} 
                                className={`flex-1 min-w-[150px] py-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${modalTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                                <tab.icon size={14}/> {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-10 bg-slate-50/30 custom-scrollbar">
                        
                        {/* TAB GENERAL */}
                        {modalTab === 'GENERAL' && (
                            <div className="space-y-8 animate-fade-in">
                                <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                                    <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b pb-3 flex items-center gap-2"><Info size={14}/> Identificación del Cliente</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Nº Cliente Interno</label>
                                            <input type="text" className="w-full p-4 bg-slate-50 border border-gray-200 rounded-2xl font-black text-indigo-600" value={clientForm.number} onChange={e => setClientForm({...clientForm, number: e.target.value})} placeholder="C-0001" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">CUIT / Identificación</label>
                                            <div className="flex gap-2">
                                                <input type="text" className="flex-1 p-4 bg-slate-50 border border-gray-200 rounded-2xl font-black" value={clientForm.cuit} onChange={e => setClientForm({...clientForm, cuit: e.target.value})} placeholder="30-..." />
                                                <button onClick={handleSearchCuit} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all shadow-md" disabled={isSearchingCuit}>
                                                    {isSearchingCuit ? <RefreshCw className="animate-spin" size={20}/> : <Zap size={20}/>}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre</label>
                                            <input type="text" className="w-full p-4 bg-slate-50 border border-gray-200 rounded-2xl font-bold uppercase" value={clientForm.firstName} onChange={e => setClientForm({...clientForm, firstName: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Apellido</label>
                                            <input type="text" className="w-full p-4 bg-slate-50 border border-gray-200 rounded-2xl font-bold uppercase" value={clientForm.lastName} onChange={e => setClientForm({...clientForm, lastName: e.target.value})} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre Fantasía / Razón Social Completa</label>
                                        <input type="text" className="w-full p-4 bg-slate-50 border border-gray-200 rounded-2xl font-black uppercase" value={clientForm.fantasyName} onChange={e => setClientForm({...clientForm, fantasyName: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Situación Tributaria</label>
                                        <select className="w-full p-4 bg-slate-50 border border-gray-200 rounded-2xl font-bold" value={clientForm.taxCondition} onChange={e => setClientForm({...clientForm, taxCondition: e.target.value as any})}>
                                            <option value="Consumidor Final">Consumidor Final</option>
                                            <option value="Responsable Inscripto">Responsable Inscripto</option>
                                            <option value="Monotributo">Monotributo</option>
                                            <option value="Exento">Exento</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                                        <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b pb-3 flex items-center gap-2"><Phone size={14}/> Contacto & Localización</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Teléfono (WhatsApp)</label>
                                                <input type="text" className="w-full p-4 bg-slate-50 border border-gray-200 rounded-2xl font-bold" value={clientForm.phone} onChange={e => setClientForm({...clientForm, phone: e.target.value})} placeholder="54911..." />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                                                <input type="email" className="w-full p-4 bg-slate-50 border border-gray-200 rounded-2xl font-bold lowercase" value={clientForm.email} onChange={e => setClientForm({...clientForm, email: e.target.value})} placeholder="ejemplo@mail.com" />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Domicilio Fiscal/Comercial</label>
                                                <input type="text" className="w-full p-4 bg-slate-50 border border-gray-200 rounded-2xl font-bold uppercase" value={clientForm.address} onChange={e => setClientForm({...clientForm, address: e.target.value})} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col">
                                        <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b pb-3 flex items-center gap-2"><Notebook size={14}/> Descripción Adicional</h4>
                                        <textarea className="flex-1 w-full p-4 bg-slate-50 border border-gray-200 rounded-2xl font-medium text-xs mt-4 resize-none" value={clientForm.description} onChange={e => setClientForm({...clientForm, description: e.target.value})} placeholder="Notas internas sobre el cliente..."></textarea>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB CLIENTE (COMERCIAL) */}
                        {modalTab === 'CLIENT' && (
                            <div className="space-y-8 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                                        <div className="flex justify-between items-center border-b pb-3">
                                            <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2"><Landmark size={14}/> Crédito & Cta Cte</h4>
                                            <div onClick={() => setClientForm({...clientForm, isCurrentAccountActive: !clientForm.isCurrentAccountActive})} className={`w-10 h-5 rounded-full relative cursor-pointer transition-all ${clientForm.isCurrentAccountActive ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${clientForm.isCurrentAccountActive ? 'right-1' : 'left-1'}`}></div>
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">Habilitar Límite de Crédito</p>
                                                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Controlar tope de deuda</p>
                                                </div>
                                                <button onClick={() => setClientForm({...clientForm, isLimitEnabled: !clientForm.isLimitEnabled})}>
                                                    {clientForm.isLimitEnabled ? <ToggleRight className="text-indigo-600" size={32}/> : <ToggleLeft className="text-slate-300" size={32}/>}
                                                </button>
                                            </div>
                                            {clientForm.isLimitEnabled && (
                                                <div>
                                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Monto Límite ($)</label>
                                                    <input type="number" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black text-indigo-600 text-xl outline-none focus:bg-white focus:border-indigo-500" value={clientForm.limit} onChange={e => setClientForm({...clientForm, limit: parseFloat(e.target.value) || 0})} />
                                                </div>
                                            )}
                                            <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                                                <div onClick={() => setClientForm({...clientForm, useAdvance: !clientForm.useAdvance})} className={`w-10 h-5 rounded-full relative cursor-pointer transition-all ${clientForm.useAdvance ? 'bg-orange-500' : 'bg-slate-300'}`}>
                                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${clientForm.useAdvance ? 'right-1' : 'left-1'}`}></div>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-orange-800 uppercase tracking-tight">Utilizar Anticipos</p>
                                                    <p className="text-[8px] text-orange-400 font-bold uppercase tracking-widest">Permitir saldos a favor</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                                        <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b pb-3 flex items-center gap-2"><Tag size={14}/> Precios & Descuentos</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Lista de Precio Asignada</label>
                                                <select className="w-full p-4 bg-slate-50 border border-gray-200 rounded-2xl font-bold uppercase text-xs" value={clientForm.priceListId} onChange={e => setClientForm({...clientForm, priceListId: e.target.value})}>
                                                    {priceLists.map(list => <option key={list.id} value={list.id}>{list.name}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Descuento Global Adicional (%)</label>
                                                <div className="relative group">
                                                    <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                                                    <input type="number" className="w-full pl-10 p-4 bg-slate-50 border border-gray-200 rounded-2xl font-black text-indigo-600 outline-none focus:bg-white" value={clientForm.specialDiscount} onChange={e => setClientForm({...clientForm, specialDiscount: parseFloat(e.target.value) || 0})} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Forma de Pago Predeterminada</label>
                                                <select className="w-full p-4 bg-slate-50 border border-gray-200 rounded-2xl font-bold uppercase text-xs" value={clientForm.defaultPaymentMethod} onChange={e => setClientForm({...clientForm, defaultPaymentMethod: e.target.value})}>
                                                    <option value="EFECTIVO">EFECTIVO</option>
                                                    <option value="CTACTE">CUENTA CORRIENTE</option>
                                                    <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                                                    <option value="TARJETA">TARJETA</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB CONTACTOS */}
                        {modalTab === 'CONTACTS' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Personas Autorizadas para Retiro/Firma</h4>
                                    <button onClick={addContact} className="bg-slate-900 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg"><Plus size={14}/> Añadir Contacto</button>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    {(clientForm.authorizedContacts || []).map(contact => (
                                        <div key={contact.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                                                <input className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold uppercase" placeholder="Nombre y Apellido" value={contact.name} onChange={e => updateContact(contact.id, 'name', e.target.value)} />
                                                <input className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold" placeholder="DNI / Documento" value={contact.dni} onChange={e => updateContact(contact.id, 'dni', e.target.value)} />
                                                <input className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold uppercase" placeholder="Relación (Ej: Chofer, Esposa)" value={contact.relation} onChange={e => updateContact(contact.id, 'relation', e.target.value)} />
                                            </div>
                                            <button onClick={() => setClientForm({...clientForm, authorizedContacts: (clientForm.authorizedContacts || []).filter(c => c.id !== contact.id)})} className="p-3 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18}/></button>
                                        </div>
                                    ))}
                                    {(clientForm.authorizedContacts || []).length === 0 && (
                                        <div className="py-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-100 text-slate-300">
                                            <Users size={48} className="mx-auto mb-3 opacity-20"/>
                                            <p className="font-black uppercase text-[10px] tracking-widest">Sin contactos autorizados registrados</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TAB MOVIMIENTOS */}
                        {/* Fix: Changed check from 'MOVIMIENTOS' to 'MOVEMENTS' to correctly match the defined state type. */}
                        {modalTab === 'MOVEMENTS' && (
                            <div className="space-y-6 animate-fade-in flex flex-col h-full overflow-hidden">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                                    <div className="md:col-span-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Filtrar por Concepto o Comprobante</label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14}/>
                                            <input type="text" className="w-full pl-9 p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none uppercase" value={movSearch} onChange={e => setMovSearch(e.target.value)} placeholder="Ej: Factura, Pago, Remito..." />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Período</label>
                                        <div className="flex gap-2">
                                            <input type="date" className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold" />
                                            <input type="date" className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 overflow-hidden flex flex-col shadow-inner">
                                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest sticky top-0 z-10">
                                                <tr>
                                                    <th className="px-6 py-4">Fecha</th>
                                                    <th className="px-6 py-4">Comprobante</th>
                                                    <th className="px-6 py-4 text-right">Debe (+)</th>
                                                    <th className="px-6 py-4 text-right">Haber (-)</th>
                                                    <th className="px-6 py-4 text-right">Saldo</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 text-[11px]">
                                                {filteredMovements.map(m => (
                                                    <tr key={m.id} className="hover:bg-indigo-50/20 transition-all">
                                                        <td className="px-6 py-4 font-bold text-slate-400">{m.date}</td>
                                                        <td className="px-6 py-4">
                                                            <p className="font-black text-slate-800 uppercase leading-none mb-1">{m.voucherType}</p>
                                                            <p className="text-[9px] text-gray-400 font-medium lowercase truncate max-w-[200px]">{m.description}</p>
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-black text-red-600">{m.debit > 0 ? `$${m.debit.toLocaleString('es-AR')}` : '-'}</td>
                                                        <td className="px-6 py-4 text-right font-black text-green-600">{m.credit > 0 ? `$${m.credit.toLocaleString('es-AR')}` : '-'}</td>
                                                        <td className="px-6 py-4 text-right font-black text-slate-900">${m.balance.toLocaleString('es-AR')}</td>
                                                    </tr>
                                                ))}
                                                {filteredMovements.length === 0 && (
                                                    <tr><td colSpan={5} className="py-20 text-center text-slate-300 font-black uppercase tracking-widest">No se registran ventas ni movimientos</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-8 bg-white border-t border-gray-100 flex justify-between items-center shrink-0">
                        <div className="flex gap-4">
                            <button onClick={() => setIsNewClientModalOpen(false)} className="px-8 py-3 text-gray-400 font-black text-[10px] uppercase tracking-widest">Cancelar</button>
                        </div>
                        <button onClick={handleSaveClient} className="bg-slate-900 text-white px-16 py-4 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl flex items-center gap-3 hover:bg-indigo-600 transition-all active:scale-95">
                            <Save size={18}/> {isEditing ? 'Actualizar Ficha Maestra' : 'Guardar Nuevo Cliente'}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Clients;
