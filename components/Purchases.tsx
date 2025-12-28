
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    Truck, Plus, Search, FileText, User, UserPlus, MoreVertical, 
    CreditCard, Calendar, X, Save, Percent, ArrowLeft, ArrowUpRight, 
    Wallet, CheckCircle, DollarSign, Printer, Download, Eye, Upload, 
    FileSpreadsheet, RefreshCw, Globe, Trash2, ShoppingBag, Package, 
    AlertTriangle, Edit, Box, Tag, Layers, Calculator, Landmark, 
    History, ArrowDownLeft, CheckSquare, Square, ArrowRight, Info, Scroll, Smartphone, Loader2, Zap, Save as SaveIcon,
    ShieldCheck, UserCheck, LayoutTemplate, MapPin,
    Scan, Camera, FileCheck, AlertOctagon, Scale, Pencil, UserSearch, Receipt, Send, Scissors, Ban, Mail, MessageCircle, Minus, PlusCircle,
    Tag as TagIcon, Barcode, Store, Building2, ExternalLink, ShoppingCart, FileUp, Columns, Table as TableIcon, Hash, Notebook
} from 'lucide-react';
import { Purchase, Provider, Product, PurchaseItem, ProductStock, CompanyConfig, ViewState, CurrencyQuote, ProductProviderHistory, TaxCondition } from '../types';
import { fetchCompanyByCuit, analyzeInvoice } from '../services/geminiService';

interface ProviderPayment {
    id: string;
    providerId: string;
    date: string;
    amount: number;
    method: string;
    reference: string;
    notes: string;
}

interface PurchasesProps {
    defaultTab?: 'PURCHASES' | 'PROVIDERS';
    onNavigateToPrices?: () => void;
}

const Purchases: React.FC<PurchasesProps> = ({ defaultTab = 'PURCHASES', onNavigateToPrices }) => {
  const [activeTab, setActiveTab] = useState<'PURCHASES' | 'PROVIDERS'>(defaultTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalTab, setModalTab] = useState<'GENERAL' | 'COMMERCIAL'>('GENERAL');
  
  const companyConfig: CompanyConfig = useMemo(() => {
    const saved = localStorage.getItem('company_config');
    return saved ? JSON.parse(saved) : {};
  }, []);

  const currencies: CurrencyQuote[] = useMemo(() => companyConfig.currencies || [], [companyConfig]);

  const [isNewPurchaseModalOpen, setIsNewPurchaseModalOpen] = useState(false);
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [isEditingProvider, setIsEditingProvider] = useState(false);
  const [isSearchingCuit, setIsSearchingCuit] = useState(false);
  
  const providerImportRef = useRef<HTMLInputElement>(null);
  const [isProviderImportMappingOpen, setIsProviderImportMappingOpen] = useState(false);
  const [provImportRows, setProvImportRows] = useState<string[][]>([]);
  const [provImportMapping, setProvImportMapping] = useState<Record<string, number>>({});

  const [providers, setProviders] = useState<Provider[]>(() => {
    const saved = localStorage.getItem('ferrecloud_providers');
    return saved ? JSON.parse(saved) : [];
  });

  const [providerForm, setProviderForm] = useState<Partial<Provider>>({
      id: '', number: '', name: '', razonSocial: '', fantasyName: '', cuit: '', taxCondition: 'Responsable Inscripto',
      locality: '', address: '', phone: '', email: '', description: '', contact: '', balance: 0, 
      defaultDiscounts: [0, 0, 0], orderPhone: '', orderEmail: '', currencyQuoteId: ''
  });

  useEffect(() => {
      localStorage.setItem('ferrecloud_providers', JSON.stringify(providers));
  }, [providers]);

  const handleSearchCuit = async () => {
    if (!providerForm.cuit || providerForm.cuit.length < 8) return;
    setIsSearchingCuit(true);
    try {
        const data = await fetchCompanyByCuit(providerForm.cuit);
        if (data) setProviderForm(prev => ({ 
            ...prev, 
            name: data.name || data.razonSocial || prev.name, 
            razonSocial: data.razonSocial || data.name || prev.razonSocial,
            address: data.address || data.domicilio || prev.address 
        }));
    } catch (err) { alert("Error en consulta AFIP."); } finally { setIsSearchingCuit(false); }
  };

  const handleSaveProvider = () => {
    if (!providerForm.name || !providerForm.cuit) { alert("Nombre y CUIT son obligatorios."); return; }
    setProviders(prev => {
        if (isEditingProvider && providerForm.id) {
            return prev.map(p => p.id === providerForm.id ? { ...p, ...providerForm } as Provider : p);
        } else {
            return [{...providerForm as Provider, id: Date.now().toString(), balance: 0}, ...prev];
        }
    });
    setIsProviderModalOpen(false);
  };

  const filteredProviders = providers.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.cuit.includes(searchTerm));

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full flex flex-col space-y-6 bg-slate-50 overflow-hidden">
      <input type="file" ref={providerImportRef} className="hidden" accept=".csv,.txt" />

      <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] border border-gray-200 shadow-sm shrink-0">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
              <Truck size={28} className="text-indigo-600"/> Compras y Proveedores
          </h2>
        </div>
        <div className="flex bg-slate-100 rounded-2xl p-1 shadow-inner">
            <button onClick={() => setActiveTab('PURCHASES')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest ${activeTab === 'PURCHASES' ? 'bg-white text-slate-900 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>Libro Compras</button>
            <button onClick={() => setActiveTab('PROVIDERS')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest ${activeTab === 'PROVIDERS' ? 'bg-white text-slate-900 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>Fichero Proveedores</button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 space-y-4">
        {activeTab === 'PROVIDERS' && (
            <div className="animate-fade-in flex flex-col flex-1 space-y-4 overflow-hidden">
                <div className="flex justify-between items-center bg-white p-4 rounded-[2rem] border border-gray-200 shadow-sm">
                    <div className="relative group flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-300 group-focus-within:text-ferre-orange transition-colors" size={18} />
                        <input type="text" placeholder="Filtrar proveedores..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl text-sm focus:bg-white focus:border-indigo-100 outline-none transition-all font-bold uppercase" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="flex gap-2 ml-4">
                        <button onClick={() => { setIsEditingProvider(false); setModalTab('GENERAL'); setProviderForm({name: '', cuit: '', contact: '', taxCondition: 'Responsable Inscripto', defaultDiscounts: [0,0,0]}); setIsProviderModalOpen(true); }} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all">
                            <UserPlus size={16} /> Nuevo Proveedor
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-[9px] font-black text-slate-300 uppercase tracking-widest sticky top-0 z-10">
                                <tr>
                                    <th className="px-8 py-5"># Nº / Razón Social</th>
                                    <th className="px-8 py-5">Contacto</th>
                                    <th className="px-8 py-5 text-right">Saldo</th>
                                    <th className="px-8 py-5 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredProviders.map(prov => (
                                    <tr key={prov.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <p className="font-black text-slate-800 text-sm uppercase leading-none mb-1">{prov.name}</p>
                                            <p className="text-[10px] text-indigo-500 font-mono font-bold">Nº {prov.number || '-'} • {prov.cuit}</p>
                                        </td>
                                        <td className="px-8 py-5 text-xs font-bold text-slate-500">{prov.contact}</td>
                                        <td className={`px-8 py-5 text-right font-black text-xl tracking-tighter ${prov.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>${prov.balance.toLocaleString('es-AR')}</td>
                                        <td className="px-8 py-5">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => { setIsEditingProvider(true); setProviderForm(prov); setModalTab('GENERAL'); setIsProviderModalOpen(true); }} className="p-3 bg-slate-100 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all"><Pencil size={18}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}
      </div>

      {isProviderModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[95vh]">
                  <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-ferre-orange text-white rounded-2xl shadow-lg"><UserSearch size={24}/></div>
                          <div>
                              <h3 className="text-xl font-black uppercase tracking-tighter leading-none">{isEditingProvider ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configuración Fiscal y Comercial</p>
                          </div>
                      </div>
                      <button onClick={() => setIsProviderModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28}/></button>
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
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Número de Proveedor</label>
                                    <div className="relative">
                                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                                        <input type="text" className="w-full pl-11 p-4 bg-white border border-gray-200 rounded-2xl outline-none font-bold uppercase" value={providerForm.number} onChange={e => setProviderForm({...providerForm, number: e.target.value})} placeholder="P-001..." />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Situación Tributaria</label>
                                    <select className="w-full p-4 bg-white border border-gray-200 rounded-2xl outline-none font-bold" value={providerForm.taxCondition} onChange={e => setProviderForm({...providerForm, taxCondition: e.target.value as TaxCondition})}>
                                        <option value="Responsable Inscripto">Responsable Inscripto</option>
                                        <option value="Monotributo">Monotributo</option>
                                        <option value="Exento">Exento</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">CUIT</label>
                                    <div className="flex gap-2">
                                        <input type="text" className="flex-1 p-4 bg-white border border-gray-200 rounded-2xl outline-none font-bold tracking-widest" value={providerForm.cuit} onChange={e => setProviderForm({...providerForm, cuit: e.target.value})} placeholder="30-..." />
                                        <button onClick={handleSearchCuit} className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg" disabled={isSearchingCuit}>
                                            {isSearchingCuit ? <RefreshCw className="animate-spin" size={20}/> : <Zap size={20}/>}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Razón Social</label>
                                    <input type="text" className="w-full p-4 bg-white border border-gray-200 rounded-2xl outline-none font-bold uppercase" value={providerForm.razonSocial} onChange={e => setProviderForm({...providerForm, razonSocial: e.target.value.toUpperCase(), name: e.target.value.toUpperCase()})} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre Fantasía</label>
                                    <input type="text" className="w-full p-4 bg-white border border-gray-200 rounded-2xl outline-none font-bold uppercase" value={providerForm.fantasyName} onChange={e => setProviderForm({...providerForm, fantasyName: e.target.value.toUpperCase()})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Localidad</label>
                                    <input type="text" className="w-full p-4 bg-white border border-gray-200 rounded-2xl outline-none font-bold uppercase" value={providerForm.locality} onChange={e => setProviderForm({...providerForm, locality: e.target.value})} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Domicilio</label>
                                <input type="text" className="w-full p-4 bg-white border border-gray-200 rounded-2xl outline-none font-bold uppercase" value={providerForm.address} onChange={e => setProviderForm({...providerForm, address: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Teléfono</label>
                                    <input type="text" className="w-full p-4 bg-white border border-gray-200 rounded-2xl outline-none font-bold" value={providerForm.phone} onChange={e => setProviderForm({...providerForm, phone: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-mail</label>
                                    <input type="email" className="w-full p-4 bg-white border border-gray-200 rounded-2xl outline-none font-bold" value={providerForm.email} onChange={e => setProviderForm({...providerForm, email: e.target.value})} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descripción</label>
                                <textarea className="w-full p-4 bg-white border border-gray-200 rounded-2xl h-24 resize-none" value={providerForm.description} onChange={e => setProviderForm({...providerForm, description: e.target.value})} />
                            </div>
                        </div>
                      ) : (
                        <div className="space-y-8 animate-fade-in">
                            <div className="bg-indigo-900 p-8 rounded-[2.5rem] text-white space-y-6 shadow-2xl">
                                <h4 className="text-xs font-black uppercase tracking-widest text-indigo-300">Esquema de Descuentos en Cascada</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    {[0, 1, 2].map(idx => (
                                        <div key={idx} className="space-y-2">
                                            <label className="text-[9px] font-black uppercase opacity-60">Desc. {idx+1} (%)</label>
                                            <input type="number" className="w-full p-4 bg-white/10 border border-white/20 rounded-2xl font-black text-2xl outline-none focus:bg-white/20" value={providerForm.defaultDiscounts?.[idx]} onChange={e => {
                                                const d = [...(providerForm.defaultDiscounts || [0,0,0])];
                                                d[idx] = parseFloat(e.target.value) || 0;
                                                setProviderForm({...providerForm, defaultDiscounts: d as [number, number, number]});
                                            }} />
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] italic opacity-50">Se aplicarán automáticamente al cargar facturas o actualizar listas de este proveedor.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cotización Predeterminada</label>
                                    <select className="w-full p-4 bg-white border border-gray-200 rounded-2xl outline-none font-bold text-slate-700" value={providerForm.currencyQuoteId} onChange={e => setProviderForm({...providerForm, currencyQuoteId: e.target.value})}>
                                        <option value="">ARS - Pesos Argentinos</option>
                                        {currencies.map(c => <option key={c.id} value={c.id}>{c.name} (${c.value})</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Persona de Contacto</label>
                                    <div className="relative">
                                        <Notebook className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                                        <input type="text" className="w-full pl-11 p-4 bg-white border border-gray-200 rounded-2xl outline-none font-bold uppercase" value={providerForm.contact} onChange={e => setProviderForm({...providerForm, contact: e.target.value})} placeholder="Ej: Vendedor Asignado..." />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">WhatsApp Pedidos</label>
                                    <input type="text" className="w-full p-4 bg-white border border-gray-200 rounded-2xl outline-none font-bold" value={providerForm.orderPhone} onChange={e => setProviderForm({...providerForm, orderPhone: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Pedidos</label>
                                    <input type="email" className="w-full p-4 bg-white border border-gray-200 rounded-2xl outline-none font-bold" value={providerForm.orderEmail} onChange={e => setProviderForm({...providerForm, orderEmail: e.target.value})} />
                                </div>
                            </div>
                        </div>
                      )}
                  </div>

                  <div className="p-8 bg-slate-50 border-t border-gray-100 flex justify-end gap-4 shrink-0">
                      <button onClick={() => setIsProviderModalOpen(false)} className="px-8 py-3 text-gray-400 font-black text-[10px] uppercase tracking-widest">Cancelar</button>
                      <button onClick={handleSaveProvider} className="bg-slate-900 text-white px-12 py-4 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl flex items-center gap-3 active:scale-95 transition-all">
                          <SaveIcon size={18}/> {isEditingProvider ? 'Guardar Cambios' : 'Registrar Proveedor'}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Purchases;
