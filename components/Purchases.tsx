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
    onViewHistory?: (provider: Provider) => void;
}

const Purchases: React.FC<PurchasesProps> = ({ defaultTab = 'PURCHASES', onNavigateToPrices, onViewHistory }) => {
  const [activeTab, setActiveTab] = useState<'PURCHASES' | 'PROVIDERS'>(defaultTab as 'PURCHASES' | 'PROVIDERS');
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
      id: '', number: '', name: '', razonSocial: '', fantasyName: '', cuit: '', taxCondition: 'Responsable Inscripto',
      locality: '', address: '', phone: '', email: '', description: '', contact: '', balance: 0, 
      defaultDiscounts: [0, 0, 0], orderPhone: '', orderEmail: '', currencyQuoteId: ''
  });

  useEffect(() => {
      localStorage.setItem('ferrecloud_providers', JSON.stringify(providers));
      localStorage.setItem('ferrecloud_purchases', JSON.stringify(purchases));
  }, [providers, purchases]);

  const handleStartImportProviders = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const content = event.target?.result as string;
        const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
        
        if (lines.length > 0) {
            const firstLine = lines[0];
            const separator = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';
            const rows = lines.map(line => line.split(separator).map(cell => cell.trim().replace(/^"|"$/g, '')));
            setProvImportRows(rows);
            setProvImportMapping({});
            setIsProviderImportMappingOpen(true);
        }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const confirmProviderImport = () => {
    if (provImportMapping.name === undefined || provImportMapping.cuit === undefined) {
        alert("Debes mapear al menos el Nombre/Razón Social y el CUIT.");
        return;
    }

    const currentCuits = new Set(providers.map(p => p.cuit.replace(/[^0-9]/g, '')));
    const newProviders: Provider[] = [];

    provImportRows.forEach((row) => {
        const name = row[provImportMapping.name];
        const cuit = row[provImportMapping.cuit];
        
        if (!name || !cuit || name.toLowerCase() === 'razon social' || name.toLowerCase() === 'nombre') return;

        const cleanCuit = cuit.replace(/[^0-9]/g, '');
        if (!currentCuits.has(cleanCuit)) {
            newProviders.push({
                id: `prov-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                number: provImportMapping.number !== undefined ? row[provImportMapping.number] : '',
                name: name.toUpperCase(),
                razonSocial: name.toUpperCase(),
                fantasyName: provImportMapping.fantasyName !== undefined ? row[provImportMapping.fantasyName].toUpperCase() : '',
                cuit: cuit,
                taxCondition: (provImportMapping.taxCondition !== undefined ? row[provImportMapping.taxCondition] : 'Responsable Inscripto') as TaxCondition,
                locality: provImportMapping.locality !== undefined ? row[provImportMapping.locality] : '',
                address: provImportMapping.address !== undefined ? row[provImportMapping.address] : '',
                phone: provImportMapping.phone !== undefined ? row[provImportMapping.phone] : '',
                email: provImportMapping.email !== undefined ? row[provImportMapping.email] : '',
                description: provImportMapping.description !== undefined ? row[provImportMapping.description] : '',
                contact: provImportMapping.contact !== undefined ? row[provImportMapping.contact] : '',
                balance: 0,
                defaultDiscounts: [
                    provImportMapping.desc1 !== undefined ? (parseFloat(row[provImportMapping.desc1].replace(',', '.')) || 0) : 0,
                    provImportMapping.desc2 !== undefined ? (parseFloat(row[provImportMapping.desc2].replace(',', '.')) || 0) : 0,
                    provImportMapping.desc3 !== undefined ? (parseFloat(row[provImportMapping.desc3].replace(',', '.')) || 0) : 0,
                ],
                currencyQuoteId: ''
            });
            currentCuits.add(cleanCuit);
        }
    });

    if (newProviders.length === 0) {
        alert("No se encontraron proveedores nuevos para importar. Verifique si los CUIT ya existen.");
        return;
    }

    setProviders([...newProviders, ...providers]);
    setIsProviderImportMappingOpen(false);
    setProvImportRows([]);
    setProvImportMapping({});
  };

  const PROVIDER_FIELDS = [
      { key: 'name', label: 'Razón Social / Nombre', required: true },
      { key: 'cuit', label: 'CUIT', required: true },
      { key: 'number', label: 'Nº Proveedor', required: false },
      { key: 'fantasyName', label: 'Nombre Fantasía', required: false },
      { key: 'locality', label: 'Localidad', required: false },
      { key: 'address', label: 'Domicilio', required: false },
      { key: 'phone', label: 'Teléfono', required: false },
      { key: 'email', label: 'E-mail', required: false },
      { key: 'contact', label: 'Contacto / Vendedor', required: false },
      { key: 'desc1', label: 'Descuento 1 (%)', required: false },
      { key: 'desc2', label: 'Descuento 2 (%)', required: false },
      { key: 'desc3', label: 'Descuento 3 (%)', required: false },
      { key: 'description', label: 'Descripción', required: false }
  ];

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

  const deleteProvider = (id: string) => {
    if (confirm('¿Está seguro de eliminar este proveedor permanentemente?')) {
        setProviders(prev => prev.filter(p => p.id !== id));
    }
  };

  const filteredProviders = providers.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.cuit.includes(searchTerm));
  const filteredPurchases = purchases.filter(p => p.providerName.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.includes(searchTerm));

  const stats = useMemo(() => {
      const total = purchases.reduce((a,c) => a + c.total, 0);
      const pending = purchases.filter(p => p.status === 'PENDING').reduce((a,c) => a + c.total, 0);
      return { total, pending, count: purchases.length };
  }, [purchases]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full flex flex-col space-y-6 bg-slate-50 overflow-hidden">
      <input type="file" ref={providerImportRef} className="hidden" accept=".csv,.txt" onChange={handleStartImportProviders} />
      <input type="file" ref={invoiceFileRef} className="hidden" accept="image/*,application/pdf" />

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
        {activeTab === 'PURCHASES' ? (
            <div className="animate-fade-in flex flex-col flex-1 space-y-4 overflow-hidden">
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

                <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
                    <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center">
                        <div className="relative max-w-md w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16}/>
                            <input type="text" placeholder="Filtrar facturas o proveedores..." className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-[9px] font-black text-slate-300 uppercase tracking-widest sticky top-0 z-10">
                                <tr>
                                    <th className="px-8 py-5">Tipo / Nº Comprobante</th>
                                    <th className="px-8 py-5">Proveedor</th>
                                    <th className="px-8 py-5">Fecha</th>
                                    <th className="px-8 py-5 text-right">Monto Total</th>
                                    <th className="px-8 py-5 text-center">Estado</th>
                                    <th className="px-8 py-5"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-[11px]">
                                {filteredPurchases.map(purchase => (
                                    <tr key={purchase.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <p className="font-black text-slate-800 text-sm uppercase leading-none mb-1">{purchase.id}</p>
                                            <p className="text-[10px] text-indigo-500 font-bold uppercase">{purchase.type}</p>
                                        </td>
                                        <td className="px-8 py-5 font-black text-slate-600 uppercase">{purchase.providerName}</td>
                                        <td className="px-8 py-5 text-gray-400 font-bold">{purchase.date}</td>
                                        <td className="px-8 py-5 text-right font-black text-slate-900 text-lg">${purchase.total.toLocaleString('es-AR')}</td>
                                        <td className="px-8 py-5 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${purchase.status === 'PAID' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                                {purchase.status === 'PAID' ? 'PAGADA' : 'PENDIENTE'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button className="p-3 text-slate-300 hover:text-indigo-600 transition-colors"><Eye size={18}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        ) : (
            <div className="animate-fade-in flex flex-col flex-1 space-y-4 overflow-hidden">
                <div className="flex justify-between items-center bg-white p-4 rounded-[2rem] border border-gray-200 shadow-sm">
                    <div className="relative group flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-300 group-focus-within:text-ferre-orange transition-colors" size={18} />
                        <input type="text" placeholder="Filtrar proveedores..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl text-sm focus:bg-white focus:border-indigo-100 outline-none transition-all font-bold uppercase" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="flex gap-2 ml-4">
                        <button 
                            onClick={() => providerImportRef.current?.click()}
                            className="bg-indigo-50 text-indigo-600 px-6 py-3 rounded-2xl flex items-center gap-3 font-black border border-indigo-100 hover:bg-indigo-100 transition-all uppercase text-[10px] tracking-widest active:scale-95">
                            <FileUp size={18} /> Importación Inteligente
                        </button>
                        <button onClick={() => { setIsEditingProvider(false); setModalTab('GENERAL'); setProviderForm({name: '', cuit: '', contact: '', balance: 0, taxCondition: 'Responsable Inscripto', defaultDiscounts: [0,0,0]}); setIsProviderModalOpen(true); }} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all">
                            <Plus size={16} /> Nuevo Proveedor
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
                                                <button onClick={() => onViewHistory?.(prov)} className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-sm active:scale-90" title="Ver Cuenta Corriente"><History size={18}/></button>
                                                <button onClick={() => { setIsEditingProvider(true); setProviderForm(prov); setModalTab('GENERAL'); setIsProviderModalOpen(true); }} className="p-3 bg-slate-100 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all active:scale-90" title="Editar Proveedor"><Pencil size={18}/></button>
                                                <button onClick={() => deleteProvider(prov.id)} className="p-3 bg-red-50 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-90" title="Eliminar Proveedor"><Trash2 size={18}/></button>
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

      {isProviderImportMappingOpen && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-8 bg-indigo-600 text-white flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-white/20 rounded-2xl shadow-lg"><Columns size={24}/></div>
                          <div>
                              <h3 className="text-xl font-black uppercase tracking-tighter leading-none">Importación de Proveedores</h3>
                              <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mt-1">Asigne las columnas de su archivo a los campos del sistema</p>
                          </div>
                      </div>
                      <button onClick={() => setIsProviderImportMappingOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28}/></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-slate-50/30">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {PROVIDER_FIELDS.map(field => (
                              <div key={field.key} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                                  <div className="flex justify-between items-center">
                                      <label className={`text-[10px] font-black uppercase tracking-widest ${field.required ? 'text-indigo-600' : 'text-slate-400'}`}>
                                          {field.label} {field.required && '*'}
                                      </label>
                                      {provImportMapping[field.key] !== undefined && <CheckCircle size={14} className="text-green-500" />}
                                  </div>
                                  <select 
                                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                                      value={provImportMapping[field.key] ?? ""}
                                      onChange={e => {
                                          const val = e.target.value === "" ? undefined : parseInt(e.target.value);
                                          setProvImportMapping({ ...provImportMapping, [field.key]: val as any });
                                      }}
                                  >
                                      <option value="">-- No importar --</option>
                                      {provImportRows[0]?.map((col, idx) => (
                                          <option key={idx} value={idx}>Columna {idx + 1} ({col.slice(0, 20)}...)</option>
                                      ))}
                                  </select>
                              </div>
                          ))}
                      </div>
                  </div>

                  <div className="p-8 border-t border-slate-100 bg-white flex justify-end gap-4 shrink-0">
                      <button onClick={() => setIsProviderImportMappingOpen(false)} className="px-8 py-3 text-gray-400 font-black text-[10px] uppercase tracking-widest">Cancelar</button>
                      <button 
                          onClick={confirmProviderImport}
                          className="bg-indigo-600 text-white px-12 py-4 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-indigo-700 transition-all flex items-center gap-3 active:scale-95"
                      >
                          <Save size={18}/> Procesar e Importar Proveedores
                      </button>
                  </div>
              </div>
          </div>
      )}

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
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descripción</label>
                                <textarea className="w-full p-4 bg-white border border-gray-200 rounded-2xl h-24 resize-none" value={providerForm.description} onChange={e => setProviderForm({...providerForm, description: e.target.value})} />
                            </div>
                        </div>
                      ) : (
                        <div className="space-y-8 animate-fade-in">
                            <div className="bg-indigo-900 p-8 rounded-[2.5rem] text-white space-y-6 shadow-2xl">
                                <h4 className="text-xs font-black uppercase tracking-widest text-indigo-300">Esquema de Descuentos</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    {[0, 1, 2].map(idx => (
                                        <div key={idx} className="space-y-2">
                                            <label className="text-[9px] font-black uppercase opacity-60">Desc. {idx+1} (%)</label>
                                            <input type="number" className="w-full p-4 bg-white/10 border border-white/20 rounded-2xl font-black text-2xl outline-none" value={providerForm.defaultDiscounts?.[idx]} onChange={e => {
                                                const d = [...(providerForm.defaultDiscounts || [0,0,0])];
                                                d[idx] = parseFloat(e.target.value) || 0;
                                                setProviderForm({...providerForm, defaultDiscounts: d as [number, number, number]});
                                            }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                      )}
                  </div>

                  <div className="p-8 bg-slate-50 border-t border-gray-100 flex justify-end gap-4 shrink-0">
                      <button onClick={() => setIsProviderModalOpen(false)} className="px-8 py-3 text-gray-400 font-black text-[10px] uppercase tracking-widest">Cancelar</button>
                      <button onClick={handleSaveProvider} className="bg-slate-900 text-white px-12 py-4 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl flex items-center gap-3">
                          <SaveIcon size={18}/> {isEditingProvider ? 'Guardar Cambios' : 'Registrar Proveedor'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {isNewPurchaseModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                  <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                      <h3 className="font-black uppercase tracking-widest text-sm">Carga Inteligente Factura</h3>
                      <button onClick={() => setIsNewPurchaseModalOpen(false)}><X size={24}/></button>
                  </div>
                  <div className="p-10 text-center space-y-6">
                      <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner border border-indigo-100">
                          <Upload size={40} />
                      </div>
                      <div>
                          <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">Sube el Comprobante</h4>
                          <p className="text-xs text-slate-400 font-medium mt-2 leading-relaxed">Nuestra IA procesará automáticamente los ítems, costos y CUIT para cargarlo al libro de IVA.</p>
                      </div>
                      <button 
                        onClick={() => invoiceFileRef.current?.click()}
                        className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                          <Scan size={20}/> SELECCIONAR ARCHIVO
                      </button>
                      <p className="text-[8px] text-slate-300 font-black uppercase tracking-widest">SOPORTA PDF, JPG, PNG • MAX 10MB</p>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Purchases;
