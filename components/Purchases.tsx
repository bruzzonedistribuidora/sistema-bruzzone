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
    Tag as TagIcon, Barcode, Store, Building2, ExternalLink, ShoppingCart, FileUp, Columns, Table as TableIcon
} from 'lucide-react';
import { Purchase, Provider, Product, PurchaseItem, ProductStock, CompanyConfig, ViewState, CurrencyQuote, ProductProviderHistory } from '../types';
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
  
  const companyConfig: CompanyConfig = useMemo(() => {
    const saved = localStorage.getItem('company_config');
    return saved ? JSON.parse(saved) : {};
  }, []);

  const currencies: CurrencyQuote[] = useMemo(() => companyConfig.currencies || [], [companyConfig]);

  const [isNewPurchaseModalOpen, setIsNewPurchaseModalOpen] = useState(false);
  const [loadMode, setLoadMode] = useState<'SELECT' | 'IA' | 'MANUAL'>('SELECT');
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [shouldUpdateCosts, setShouldUpdateCosts] = useState(true);
  const [scannedItems, setScannedItems] = useState<any[]>([]);
  const [invoiceMetadata, setInvoiceMetadata] = useState<any>({
      providerId: '',
      providerName: '',
      numeroFactura: '',
      fecha: new Date().toISOString().split('T')[0],
      totalFactura: 0,
      cuitProveedor: '',
      descuentoGlobal: 0
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const providerImportRef = useRef<HTMLInputElement>(null);

  // Estados para el Asistente de Importación de Proveedores
  const [isProviderImportMappingOpen, setIsProviderImportMappingOpen] = useState(false);
  const [provImportRows, setProvImportRows] = useState<string[][]>([]);
  const [provImportMapping, setProvImportMapping] = useState<Record<string, number>>({});

  // Fix: Added missing state 'selectedProviderForHistory' to resolve the 'Cannot find name' error on line 359.
  const [selectedProviderForHistory, setSelectedProviderForHistory] = useState<Provider | null>(null);

  const [products, setProducts] = useState<Product[]>(() => {
      const saved = localStorage.getItem('ferrecloud_products');
      return saved ? JSON.parse(saved) : [];
  });

  const [providers, setProviders] = useState<Provider[]>(() => {
    const saved = localStorage.getItem('ferrecloud_providers');
    return saved ? JSON.parse(saved) : [];
  });

  const [purchases, setPurchases] = useState<Purchase[]>(() => {
      const saved = localStorage.getItem('ferrecloud_purchases');
      return saved ? JSON.parse(saved) : [];
  });

  const [payments, setPayments] = useState<ProviderPayment[]>(() => {
      const saved = localStorage.getItem('ferrecloud_provider_payments');
      return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
      localStorage.setItem('ferrecloud_providers', JSON.stringify(providers));
  }, [providers]);

  useEffect(() => {
      localStorage.setItem('ferrecloud_provider_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('ferrecloud_purchases', JSON.stringify(purchases));
  }, [purchases]);

  const handleStartImportProviders = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const content = event.target?.result as string;
        const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
        
        if (lines.length > 0) {
            // Detección inteligente de separador
            const firstLine = lines[0];
            const commas = (firstLine.match(/,/g) || []).length;
            const semicolons = (firstLine.match(/;/g) || []).length;
            const separator = semicolons > commas ? ';' : ',';

            const rows = lines.map(line => line.split(separator).map(cell => cell.trim()));
            
            setProvImportRows(rows);
            setProvImportMapping({}); // Limpiar mapeo
            setIsProviderImportMappingOpen(true);
        }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const confirmProviderImport = () => {
    if (provImportMapping.name === undefined || provImportMapping.cuit === undefined) {
        alert("Debes mapear al menos el Nombre y el CUIT.");
        return;
    }

    const currentCuits = new Set(providers.map(p => p.cuit.replace(/[^0-9]/g, '')));
    const newProviders: Provider[] = [];

    provImportRows.forEach((row, index) => {
        const name = row[provImportMapping.name];
        const cuit = row[provImportMapping.cuit];
        
        if (!name || !cuit || name.toLowerCase() === 'razon social' || name.toLowerCase() === 'nombre') return;

        const cleanCuit = cuit.replace(/[^0-9]/g, '');
        if (!currentCuits.has(cleanCuit)) {
            newProviders.push({
                id: `prov-${Date.now()}-${Math.random()}`,
                name: name.toUpperCase(),
                cuit: cuit,
                contact: provImportMapping.contact !== undefined ? row[provImportMapping.contact] : '',
                address: provImportMapping.address !== undefined ? row[provImportMapping.address] : '',
                orderPhone: provImportMapping.orderPhone !== undefined ? row[provImportMapping.orderPhone] : '',
                orderEmail: provImportMapping.orderEmail !== undefined ? row[provImportMapping.orderEmail] : '',
                balance: 0,
                defaultDiscounts: [0, 0, 0],
                currencyQuoteId: ''
            });
            currentCuits.add(cleanCuit);
        }
    });

    if (newProviders.length === 0) {
      alert("No se encontraron proveedores nuevos.");
      return;
    }

    setProviders([...newProviders, ...providers]);
    setIsProviderImportMappingOpen(false);
    setProvImportRows([]);
    setProvImportMapping({});
    alert(`Importación finalizada. Se procesaron ${newProviders.length} proveedores nuevos.`);
  };

  const PROVIDER_FIELDS = [
      { key: 'name', label: 'Razón Social', required: true },
      { key: 'cuit', label: 'CUIT', required: true },
      { key: 'contact', label: 'Persona de Contacto', required: false },
      { key: 'address', label: 'Dirección Comercial', required: false },
      { key: 'orderPhone', label: 'WhatsApp Pedidos', required: false },
      { key: 'orderEmail', label: 'Email Pedidos', required: false }
  ];

  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [isEditingProvider, setIsEditingProvider] = useState(false);
  const [isSearchingCuit, setIsSearchingCuit] = useState(false);
  const [providerForm, setProviderForm] = useState<Partial<Provider>>({
      name: '', cuit: '', contact: '', address: '', balance: 0, defaultDiscounts: [0, 0, 0], orderPhone: '', orderEmail: '', currencyQuoteId: ''
  });

  const handleSearchCuit = async () => {
    if (!providerForm.cuit || providerForm.cuit.length < 8) return;
    setIsSearchingCuit(true);
    try {
        const data = await fetchCompanyByCuit(providerForm.cuit);
        if (data) setProviderForm(prev => ({ ...prev, name: data.name, address: data.address || '', contact: data.phone || '' }));
    } catch (err) { alert("No se pudo conectar con el servicio de consulta fiscal."); } finally { setIsSearchingCuit(false); }
  };

  const handleSaveProvider = () => {
    if (!providerForm.name || !providerForm.cuit) { alert("Nombre y CUIT son obligatorios."); return; }
    setProviders(prev => {
        if (isEditingProvider && providerForm.id) {
            return prev.map(p => p.id === providerForm.id ? { ...p, ...providerForm } as Provider : p);
        } else {
            return [{...providerForm as Provider, id: Date.now().toString(), balance: 0, defaultDiscounts: providerForm.defaultDiscounts || [0,0,0]}, ...prev];
        }
    });
    setIsProviderModalOpen(false);
    setProviderForm({ name: '', cuit: '', contact: '', address: '', balance: 0, defaultDiscounts: [0, 0, 0], orderPhone: '', orderEmail: '', currencyQuoteId: '' });
  };

  const deleteProvider = (id: string) => {
    if (confirm('¿Desea eliminar este proveedor?')) setProviders(prev => prev.filter(p => p.id !== id));
  };

  const filteredProviders = providers.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.cuit.includes(searchTerm));

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full flex flex-col space-y-6 bg-slate-50 overflow-hidden">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" />
      <input type="file" ref={providerImportRef} className="hidden" accept=".csv,.txt" onChange={handleStartImportProviders} />

      <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] border border-gray-200 shadow-sm shrink-0">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
              <Truck size={28} className="text-indigo-600"/> Compras y Abastecimiento
          </h2>
          <p className="text-gray-400 text-xs font-black uppercase tracking-widest mt-1 italic">Mapeo de Facturas con IA Vision y Gestión Fiscal</p>
        </div>
        
        <div className="flex bg-slate-100 rounded-2xl p-1 shadow-inner">
            <button onClick={() => setActiveTab('PURCHASES')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest ${activeTab === 'PURCHASES' ? 'bg-white text-slate-900 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>Libro Compras</button>
            <button onClick={() => setActiveTab('PROVIDERS')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest ${activeTab === 'PROVIDERS' ? 'bg-white text-slate-900 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>Fichero Proveedores</button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 space-y-4">
        {activeTab === 'PURCHASES' ? (
            <div className="animate-fade-in flex flex-col flex-1 space-y-4 overflow-hidden">
                <div className="flex justify-between items-center bg-white p-4 rounded-[2rem] border border-gray-200 shadow-sm">
                    <div className="relative group flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
                        <input type="text" placeholder="Buscar por proveedor o ID..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl text-sm focus:bg-white focus:border-indigo-100 outline-none transition-all font-bold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="flex gap-2 ml-4">
                        <button 
                            onClick={() => onNavigateToPrices?.()}
                            className="bg-slate-100 text-slate-600 px-6 py-3 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest hover:bg-white border border-slate-200 transition-all">
                            <Layers size={16} /> Listas y Precios
                        </button>
                        <button 
                            onClick={() => setIsNewPurchaseModalOpen(true)}
                            className="bg-indigo-600 text-white px-8 py-3 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all hover:bg-indigo-700">
                            <Plus size={16} /> Cargar Comprobante
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-[9px] font-black text-slate-300 uppercase tracking-widest sticky top-0 z-10">
                                <tr>
                                    <th className="px-8 py-5">Comprobante / Proveedor</th>
                                    <th className="px-8 py-5 text-right">Importe Neto</th>
                                    <th className="px-8 py-5 text-center">Estado Pago</th>
                                    <th className="px-8 py-5"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {purchases.filter(p => p.providerName.toLowerCase().includes(searchTerm.toLowerCase())).map(purchase => (
                                    <tr key={purchase.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="font-black text-slate-800 text-sm uppercase tracking-tight leading-none mb-1">{purchase.providerName}</div>
                                            <div className="text-[10px] text-gray-400 font-mono font-bold">{purchase.id} • {purchase.date}</div>
                                        </td>
                                        <td className="px-8 py-5 text-right font-black text-slate-900 text-lg tracking-tighter">${purchase.total.toLocaleString('es-AR')}</td>
                                        <td className="px-8 py-5 text-center">
                                            <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${purchase.status === 'PAID' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                                {purchase.status === 'PAID' ? 'LIQUIDADA' : 'CTACTE PENDIENTE'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button className="p-3 bg-slate-50 text-slate-300 hover:text-slate-800 hover:bg-white rounded-xl transition-all shadow-sm group-hover:scale-105"><Eye size={18}/></button>
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
                        <input type="text" placeholder="Filtrar por razón social..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl text-sm focus:bg-white focus:border-indigo-100 outline-none transition-all font-bold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="flex gap-2 ml-4">
                        <button 
                            onClick={() => providerImportRef.current?.click()}
                            className="bg-indigo-50 text-indigo-600 px-6 py-3.5 rounded-2xl flex items-center gap-3 font-black border border-indigo-100 hover:bg-indigo-100 transition-all uppercase text-[10px] tracking-widest active:scale-95">
                            <FileUp size={16} /> Importación Inteligente
                        </button>
                        <button 
                            className="bg-indigo-600 text-white px-8 py-3 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-900/10 active:scale-95 transition-all hover:bg-indigo-700">
                            <DollarSign size={16} /> Orden de Pago
                        </button>
                        <button 
                            onClick={() => { setIsEditingProvider(false); setProviderForm({name: '', cuit: '', contact: '', address: '', balance: 0, defaultDiscounts: [0,0,0], orderPhone: '', orderEmail: '', currencyQuoteId: ''}); setIsProviderModalOpen(true); }}
                            className="bg-ferre-orange text-white px-8 py-3 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-orange-900/10 active:scale-95 transition-all hover:bg-orange-600">
                            <UserPlus size={16} /> Nuevo Proveedor
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-[9px] font-black text-slate-300 uppercase tracking-widest sticky top-0 z-10">
                                <tr>
                                    <th className="px-8 py-5">Proveedor / CUIT</th>
                                    <th className="px-8 py-5">Moneda</th>
                                    <th className="px-8 py-5 text-right">Saldo Adeudado</th>
                                    <th className="px-8 py-5 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredProviders.map(prov => (
                                    <tr key={prov.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 text-lg uppercase">{prov.name.charAt(0)}</div>
                                                <div>
                                                    <p className="font-black text-slate-800 text-sm uppercase tracking-tight leading-none mb-1">{prov.name}</p>
                                                    <p className="text-[10px] text-indigo-500 font-mono font-bold italic">{prov.cuit}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-green-50 text-green-600 rounded-lg">
                                                    <DollarSign size={14}/>
                                                </div>
                                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">
                                                    {currencies.find(c => c.id === prov.currencyQuoteId)?.name || 'Dólar Standard'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className={`px-8 py-5 text-right font-black text-xl tracking-tighter ${prov.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            ${prov.balance.toLocaleString('es-AR')}
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => { setSelectedProviderForHistory(prov); }} className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 shadow-sm transition-all"><History size={18}/></button>
                                                <button onClick={() => { setIsEditingProvider(true); setProviderForm(prov); setIsProviderModalOpen(true); }} className="p-3 bg-slate-100 text-indigo-600 border border-indigo-100 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all"><Pencil size={18}/></button>
                                                <button onClick={() => deleteProvider(prov.id)} className="p-3 bg-red-50 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18}/></button>
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

      {/* MODAL: ASISTENTE DE IMPORTACIÓN DE PROVEEDORES */}
      {isProviderImportMappingOpen && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-8 bg-indigo-600 text-white flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-white/20 rounded-2xl shadow-lg"><Columns size={24}/></div>
                          <div>
                              <h3 className="text-xl font-black uppercase tracking-tighter leading-none">Mapeo de Proveedores</h3>
                              <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mt-1">Asigne las columnas de su archivo a los campos de Proveedor</p>
                          </div>
                      </div>
                      <button onClick={() => setIsProviderImportMappingOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28}/></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-slate-50/30">
                      {provImportRows[0]?.length === 1 && (
                          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3 text-amber-800">
                              <AlertTriangle size={20} className="shrink-0" />
                              <p className="text-xs font-bold">Solo se detectó una columna. Asegúrese de que el archivo CSV esté separado por comas o puntos y comas.</p>
                          </div>
                      )}

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

                      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                          <div className="p-4 bg-slate-900 text-white flex items-center gap-2">
                              <TableIcon size={14} className="text-indigo-400"/>
                              <h4 className="text-[10px] font-black uppercase tracking-widest">Vista previa del archivo (Primeras 5 filas)</h4>
                          </div>
                          <div className="overflow-x-auto">
                              <table className="w-full text-left">
                                  <thead className="bg-slate-50 border-b">
                                      <tr>
                                          {provImportRows[0]?.map((_, idx) => (
                                              <th key={idx} className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase text-center border-r last:border-0">Col {idx + 1}</th>
                                          ))}
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y text-[10px]">
                                      {provImportRows.slice(0, 5).map((row, rIdx) => (
                                          <tr key={rIdx}>
                                              {row.map((cell, cIdx) => (
                                                  <td key={cIdx} className="px-4 py-2 text-slate-600 font-medium truncate max-w-[150px] border-r last:border-0">{cell}</td>
                                              ))}
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  </div>

                  <div className="p-8 border-t border-slate-100 bg-white flex justify-end gap-4 shrink-0">
                      <button onClick={() => setIsProviderImportMappingOpen(false)} className="px-8 py-3 text-gray-400 font-black text-[10px] uppercase tracking-widest">Cancelar</button>
                      <button 
                          onClick={confirmProviderImport}
                          className="bg-indigo-600 text-white px-12 py-4 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-indigo-700 transition-all flex items-center gap-3"
                      >
                          <Save size={18}/> Procesar e Importar Proveedores
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL: PROVEEDOR (ALTA/EDICION) */}
      {isProviderModalOpen && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                  <div className="p-8 border-b border-gray-100 bg-slate-900 text-white flex justify-between items-center">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-ferre-orange text-white rounded-2xl shadow-lg"><UserSearch size={24}/></div>
                          <div>
                              <h3 className="text-xl font-black uppercase tracking-tighter leading-none">{isEditingProvider ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sincronización con Base de Datos Fiscal</p>
                          </div>
                      </div>
                      <button onClick={() => setIsProviderModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28}/></button>
                  </div>
                  
                  <div className="p-10 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                      <div className="space-y-4">
                          <div className="relative">
                              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-2 tracking-widest">CUIT / Identificación Fiscal</label>
                              <div className="flex gap-2">
                                  <input 
                                      type="text" 
                                      className="flex-1 p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-ferre-orange outline-none font-black text-slate-800 tracking-widest" 
                                      placeholder="30-XXXXXXXX-X"
                                      value={providerForm.cuit}
                                      onChange={e => setProviderForm({...providerForm, cuit: e.target.value})}
                                  />
                                  <button onClick={handleSearchCuit} disabled={isSearchingCuit} className="bg-indigo-600 text-white px-5 rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center disabled:opacity-50 shadow-lg shadow-indigo-100 min-w-[64px]">
                                      {isSearchingCuit ? <Loader2 size={24} className="animate-spin" /> : <Zap size={24} className="fill-white" />}
                                  </button>
                              </div>
                          </div>
                          <div>
                              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-2 tracking-widest">Razón Social</label>
                              <input type="text" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-ferre-orange outline-none font-black text-slate-800 uppercase" value={providerForm.name} onChange={e => setProviderForm({...providerForm, name: e.target.value.toUpperCase()})} />
                          </div>
                          <div>
                              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-2 tracking-widest">Cotización Predeterminada</label>
                              <select className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-green-600 outline-none font-bold text-slate-700" value={providerForm.currencyQuoteId} onChange={e => setProviderForm({...providerForm, currencyQuoteId: e.target.value})}>
                                  <option value="">USAR DÓLAR STANDARD</option>
                                  {currencies.map(c => <option key={c.id} value={c.id}>{c.name} (${c.value})</option>)}
                              </select>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-2 tracking-widest flex items-center gap-1"><MessageCircle size={10} className="text-green-600"/> WhatsApp Pedidos</label>
                                  <input type="text" placeholder="+54911..." className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-green-600 outline-none font-bold text-slate-700" value={providerForm.orderPhone} onChange={e => setProviderForm({...providerForm, orderPhone: e.target.value})} />
                              </div>
                              <div>
                                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-2 tracking-widest flex items-center gap-1"><Mail size={10} className="text-indigo-600"/> Email Pedidos</label>
                                  <input type="email" placeholder="pedidos@empresa.com" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-bold text-slate-700" value={providerForm.orderEmail} onChange={e => setProviderForm({...providerForm, orderEmail: e.target.value})} />
                              </div>
                          </div>
                      </div>

                      <div className="p-8 bg-slate-50 border-t border-gray-100 flex justify-end gap-4 shrink-0">
                          <button onClick={() => setIsProviderModalOpen(false)} className="px-8 py-3 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-gray-600 transition-colors">Cancelar</button>
                          <button onClick={handleSaveProvider} className="bg-slate-900 text-white px-12 py-4 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-3 hover:bg-slate-800 transition-all active:scale-95">
                              {isEditingProvider ? <SaveIcon size={18}/> : <Plus size={18}/>} 
                              {isEditingProvider ? 'Guardar Cambios' : 'Registrar Proveedor'}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Purchases;
