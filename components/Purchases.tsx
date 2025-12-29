
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
    Tag as TagIcon, Barcode, Store, Building2, ExternalLink, ShoppingCart, FileUp, Columns, Table as TableIcon, Hash, Notebook, ListOrdered,
    // Added missing Users icon
    Users
} from 'lucide-react';
import { Purchase, Provider, Product, PurchaseItem, ProductStock, CompanyConfig, ViewState, CurrencyQuote, ProductProviderHistory, TaxCondition } from '../types';
import { fetchCompanyByCuit, analyzeInvoice } from '../services/geminiService';
import Replenishment from './Replenishment';
import Shortages from './Shortages';

interface PurchasesProps {
    defaultTab?: 'PURCHASES' | 'PROVIDERS' | 'REPLENISHMENT' | 'SHORTAGES';
    onNavigateToPrices?: () => void;
    onViewHistory?: (provider: Provider) => void;
}

const Purchases: React.FC<PurchasesProps> = ({ defaultTab = 'PURCHASES', onNavigateToPrices, onViewHistory }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalTab, setModalTab] = useState<'GENERAL' | 'COMMERCIAL'>('GENERAL');
  
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const companyConfig: CompanyConfig = useMemo(() => {
    const saved = localStorage.getItem('company_config');
    return saved ? JSON.parse(saved) : {};
  }, []);

  const [isNewPurchaseModalOpen, setIsNewPurchaseModalOpen] = useState(false);
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [isEditingProvider, setIsEditingProvider] = useState(false);
  const [isSearchingCuit, setIsSearchingCuit] = useState(false);
  
  const providerImportRef = useRef<HTMLInputElement>(null);
  const invoiceFileRef = useRef<HTMLInputElement>(null);
  
  const [isProviderImportMappingOpen, setIsProviderImportMappingOpen] = useState(false);
  const [provImportRows, setProvImportRows] = useState<string[][]>([]);
  const [provImportMapping, setProvImportMapping] = useState<Record<string, number>>({});

  const [providers, setProviders] = useState<Provider[]>(() => {
    const saved = localStorage.getItem('ferrecloud_providers');
    return saved ? JSON.parse(saved) : [];
  });

  const [purchases, setPurchases] = useState<Purchase[]>(() => {
      const saved = localStorage.getItem('ferrecloud_purchases');
      return saved ? JSON.parse(saved) : [
          { id: 'FAC-00214', providerId: '1', providerName: 'Herramientas Global SA', date: '2023-10-25', type: 'Factura A', items: 12, total: 125400, status: 'PAID' },
          { id: 'FAC-99022', providerId: '2', providerName: 'Pinturas del Centro', date: '2023-10-26', type: 'Factura A', items: 5, total: 45000, status: 'PENDING' }
      ];
  });

  const [providerForm, setProviderForm] = useState<Partial<Provider>>({
      name: '', cuit: '', taxCondition: 'Responsable Inscripto', balance: 0, defaultDiscounts: [0, 0, 0]
  });

  useEffect(() => {
      localStorage.setItem('ferrecloud_providers', JSON.stringify(providers));
      localStorage.setItem('ferrecloud_purchases', JSON.stringify(purchases));
  }, [providers, purchases]);

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
            return [{...providerForm as Provider, id: Date.now().toString()}, ...prev];
        }
    });
    setIsProviderModalOpen(false);
  };

  const filteredProviders = providers.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.cuit.includes(searchTerm));
  const filteredPurchases = purchases.filter(p => p.providerName.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.includes(searchTerm));

  const stats = useMemo(() => {
      const total = purchases.reduce((a,c) => a + c.total, 0);
      const pending = purchases.filter(p => p.status === 'PENDING').reduce((a,c) => a + c.total, 0);
      return { total, pending };
  }, [purchases]);

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
      {/* Pestañas de Compras */}
      <div className="bg-white border-b border-gray-200 px-6 shrink-0 z-20">
        <div className="flex gap-2 h-14 items-end">
            {[
                { id: 'PURCHASES', label: 'Libro Compras', icon: Receipt },
                { id: 'PROVIDERS', label: 'Proveedores', icon: Users },
                { id: 'REPLENISHMENT', label: 'Pedidos Prov.', icon: ShoppingCart },
                { id: 'SHORTAGES', label: 'Faltantes', icon: AlertTriangle }
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-t-2xl font-black text-[10px] uppercase tracking-widest transition-all border-x border-t ${
                        activeTab === tab.id 
                        ? 'bg-slate-50 border-gray-200 text-indigo-600 -mb-px shadow-[0_-5px_15px_rgba(0,0,0,0.03)]' 
                        : 'bg-white border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                >
                    <tab.icon size={16} />
                    {tab.label}
                </button>
            ))}
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 overflow-y-auto custom-scrollbar">
            {activeTab === 'PURCHASES' && (
                <div className="p-8 animate-fade-in space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
                        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-6">
                            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><Receipt size={24}/></div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Compras Mes</p>
                                <h4 className="text-2xl font-black text-slate-800">${stats.total.toLocaleString('es-AR')}</h4>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-6">
                            <div className="p-4 bg-red-50 text-red-600 rounded-2xl"><AlertTriangle size={24}/></div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Facturas Pendientes</p>
                                <h4 className="text-2xl font-black text-red-600">${stats.pending.toLocaleString('es-AR')}</h4>
                            </div>
                        </div>
                        <div className="flex items-center justify-end">
                            <button onClick={() => setIsNewPurchaseModalOpen(true)} className="bg-slate-900 text-white px-10 py-4 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl flex items-center gap-3 active:scale-95 transition-all">
                                <FileUp size={20} className="text-indigo-400"/> Cargar Factura IA
                            </button>
                        </div>
                    </div>
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-[9px] font-black text-slate-300 uppercase tracking-widest">
                                <tr>
                                    <th className="px-8 py-5">Nº Comprobante</th>
                                    <th className="px-8 py-5">Proveedor</th>
                                    <th className="px-8 py-5">Fecha</th>
                                    <th className="px-8 py-5 text-right">Total</th>
                                    <th className="px-8 py-5 text-center">Estado</th>
                                    <th className="px-8 py-5"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-[11px]">
                                {filteredPurchases.map(purchase => (
                                    <tr key={purchase.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-8 py-5 font-black text-slate-800 text-sm">{purchase.id}</td>
                                        <td className="px-8 py-5 font-black text-slate-600 uppercase">{purchase.providerName}</td>
                                        <td className="px-8 py-5 text-gray-400 font-bold">{purchase.date}</td>
                                        <td className="px-8 py-5 text-right font-black text-slate-900">${purchase.total.toLocaleString('es-AR')}</td>
                                        <td className="px-8 py-5 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${purchase.status === 'PAID' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                                {purchase.status === 'PAID' ? 'PAGADA' : 'PENDIENTE'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right"><button className="p-3 text-slate-300 hover:text-indigo-600"><Eye size={18}/></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'PROVIDERS' && (
                <div className="p-8 animate-fade-in space-y-6">
                    <div className="flex justify-between items-center bg-white p-4 rounded-[2rem] border border-gray-200 shadow-sm">
                        <div className="relative group flex-1 max-w-md">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
                            <input type="text" placeholder="Filtrar proveedores..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl text-sm focus:bg-white focus:border-indigo-100 outline-none transition-all font-bold uppercase" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <button onClick={() => { setIsEditingProvider(false); setProviderForm({name: '', cuit: '', balance: 0, defaultDiscounts: [0,0,0]}); setIsProviderModalOpen(true); }} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest shadow-xl ml-4">
                            <Plus size={16} /> Nuevo Proveedor
                        </button>
                    </div>
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-[9px] font-black text-slate-300 uppercase tracking-widest">
                                <tr>
                                    <th className="px-8 py-5">Razón Social / CUIT</th>
                                    <th className="px-8 py-5 text-right">Saldo</th>
                                    <th className="px-8 py-5 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredProviders.map(prov => (
                                    <tr key={prov.id} className="hover:bg-slate-50">
                                        <td className="px-8 py-5">
                                            <p className="font-black text-slate-800 text-sm uppercase leading-none mb-1">{prov.name}</p>
                                            <p className="text-[10px] text-gray-400 font-mono font-bold">{prov.cuit}</p>
                                        </td>
                                        <td className={`px-8 py-5 text-right font-black text-xl tracking-tighter ${prov.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>${prov.balance.toLocaleString('es-AR')}</td>
                                        <td className="px-8 py-5 flex justify-center gap-2">
                                            <button onClick={() => onViewHistory?.(prov)} className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-sm"><History size={18}/></button>
                                            <button onClick={() => { setIsEditingProvider(true); setProviderForm(prov); setIsProviderModalOpen(true); }} className="p-3 bg-slate-100 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white"><Pencil size={18}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'REPLENISHMENT' && <Replenishment />}
            {activeTab === 'SHORTAGES' && <Shortages />}
        </div>
      </div>

      {/* Modales de Proveedor y Factura (Similares al anterior) */}
      {isProviderModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col">
                  <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-indigo-500 rounded-2xl"><UserSearch size={24}/></div>
                          <h3 className="text-xl font-black uppercase tracking-tighter leading-none">{isEditingProvider ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>
                      </div>
                      <button onClick={() => setIsProviderModalOpen(false)}><X size={28}/></button>
                  </div>
                  <div className="p-10 space-y-6 bg-white overflow-y-auto">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">CUIT</label>
                            <div className="flex gap-2">
                                <input type="text" className="flex-1 p-4 bg-slate-50 border rounded-2xl font-black" value={providerForm.cuit} onChange={e => setProviderForm({...providerForm, cuit: e.target.value})} />
                                <button onClick={handleSearchCuit} className="p-4 bg-indigo-600 text-white rounded-2xl"><Zap size={20}/></button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Razón Social</label>
                            <input type="text" className="w-full p-4 bg-slate-50 border rounded-2xl font-black uppercase" value={providerForm.name} onChange={e => setProviderForm({...providerForm, name: e.target.value.toUpperCase()})} />
                        </div>
                      </div>
                      <button onClick={handleSaveProvider} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
                          <Save size={18}/> {isEditingProvider ? 'Guardar Cambios' : 'Registrar Proveedor'}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Purchases;
