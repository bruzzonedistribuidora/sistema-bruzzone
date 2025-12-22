
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Truck, Plus, Search, FileText, User, UserPlus, MoreVertical, 
    CreditCard, Calendar, X, Save, Percent, ArrowLeft, ArrowUpRight, 
    Wallet, CheckCircle, DollarSign, Printer, Download, Eye, Upload, 
    FileSpreadsheet, RefreshCw, Globe, Trash2, ShoppingCart, Package, 
    AlertTriangle, Edit, Box, Tag, Layers, Calculator, Landmark, 
    History, ArrowDownLeft, CheckSquare, Square, ArrowRight, Info, Scroll, Smartphone, Loader2, Zap, ShieldCheck, UserCheck, LayoutTemplate, MapPin
} from 'lucide-react';
import { Purchase, Provider, CurrentAccountMovement, Check } from '../types';
import { fetchCompanyByCuit } from '../services/geminiService';

interface PurchasesProps {
    defaultTab?: 'PURCHASES' | 'PROVIDERS';
}

const Purchases: React.FC<PurchasesProps> = ({ defaultTab = 'PURCHASES' }) => {
  const [activeTab, setActiveTab] = useState<'PURCHASES' | 'PROVIDERS'>(defaultTab);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [viewingVoucher, setViewingVoucher] = useState<CurrentAccountMovement | null>(null);

  const [isSearchingCuit, setIsSearchingCuit] = useState(false);
  const [providerModalTab, setProviderModalTab] = useState<'DATA' | 'AUTH'>('DATA');
  const [newAuthPerson, setNewAuthPerson] = useState('');

  // --- ESTADOS IMPORTACIÓN EXCEL PROVEEDORES ---
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importStep, setImportStep] = useState<1 | 2>(1);
  const [importMapping, setImportMapping] = useState<Record<string, number>>({});
  const [importFileName, setImportFileName] = useState('');
  const [mockImportData, setMockImportData] = useState<string[][]>([
      ['CUIT', 'RAZON SOCIAL', 'CONTACTO', 'DIRECCION', 'DTO1', 'DTO2', 'DTO3'],
      ['30-11223344-5', 'HERRAMIENTAS TOTAL', 'CARLOS RUIZ', 'AV CORRIENTES 1200', '10', '5', '0'],
      ['30-55667788-9', 'PINTURAS COLOR', 'ANA LOP.', 'CALLE 10 #445', '25', '0', '0']
  ]);

  const [checks, setChecks] = useState<Check[]>(() => {
      const saved = localStorage.getItem('ferrecloud_checks');
      return saved ? JSON.parse(saved) : [];
  });

  const availableChecks = useMemo(() => checks.filter(c => c.status === 'CARTERA'), [checks]);

  const [providers, setProviders] = useState<Provider[]>(() => {
    const saved = localStorage.getItem('ferrecloud_providers');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Herramientas Global SA', cuit: '30-11223344-5', contact: 'Roberto', balance: 150000, defaultDiscounts: [10, 5, 0], address: 'Av. Corrientes 4500', authorizedPersonnel: ['Carlos Ruiz (Ventas)', 'Marta Lopez (Logística)'] },
      { id: '2', name: 'Pinturas del Centro', cuit: '30-55667788-9', contact: 'Maria', balance: 0, defaultDiscounts: [25, 0, 0], address: 'Calle 10 #554', authorizedPersonnel: [] },
      { id: '3', name: 'Bulonera Industrial', cuit: '30-99887766-1', contact: 'Carlos', balance: 50000, defaultDiscounts: [0, 0, 0], address: 'Ruta 8 km 22', authorizedPersonnel: [] },
    ];
  });

  const [providerMovements, setProviderMovements] = useState<CurrentAccountMovement[]>(() => {
      const saved = localStorage.getItem('ferrecloud_provider_movements');
      return saved ? JSON.parse(saved) : [];
  });

  const [purchases, setPurchases] = useState<Purchase[]>(() => {
      const saved = localStorage.getItem('ferrecloud_purchases');
      return saved ? JSON.parse(saved) : [
          { id: 'FC-A-00124', providerId: '1', providerName: 'Herramientas Global SA', date: '2023-10-25', type: 'FACTURA_A', items: 5, total: 150000, status: 'PENDING' },
          { id: 'FC-A-00988', providerId: '2', providerName: 'Pinturas del Centro', date: '2023-10-20', type: 'FACTURA_A', items: 12, total: 45000, status: 'PAID' }
      ];
  });

  useEffect(() => {
    localStorage.setItem('ferrecloud_providers', JSON.stringify(providers));
    localStorage.setItem('ferrecloud_provider_movements', JSON.stringify(providerMovements));
    localStorage.setItem('ferrecloud_checks', JSON.stringify(checks));
    localStorage.setItem('ferrecloud_purchases', JSON.stringify(purchases));
  }, [providers, providerMovements, checks, purchases]);

  const [providerFormData, setProviderFormData] = useState<Partial<Provider>>({
      name: '', cuit: '', contact: '', balance: 0, defaultDiscounts: [0, 0, 0], address: '', authorizedPersonnel: []
  });

  const [paymentForm, setPaymentForm] = useState({
      amount: '',
      method: 'TRANSFERENCIA' as 'TRANSFERENCIA' | 'EFECTIVO' | 'CHEQUE_PROPIO' | 'CHEQUE_TERCERO',
      note: '',
      selectedPurchases: [] as string[],
      selectedCheckIds: [] as string[]
  });

  const currentMovements = useMemo(() => {
      return providerMovements
        .filter(m => m.providerId === selectedProvider?.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [providerMovements, selectedProvider]);

  const pendingPurchases = useMemo(() => {
      return currentMovements.filter(m => m.credit > 0);
  }, [currentMovements]);

  const handleSearchProviderCuit = async () => {
    if (!providerFormData.cuit || providerFormData.cuit.length < 8) {
        alert("Ingrese un CUIT válido.");
        return;
    }
    setIsSearchingCuit(true);
    try {
        const data = await fetchCompanyByCuit(providerFormData.cuit);
        if (data && data.name) {
            setProviderFormData(prev => ({
                ...prev,
                name: data.name,
                address: data.address || '',
                contact: data.contact || ''
            }));
        }
    } catch (err) { console.error(err); } finally { setIsSearchingCuit(false); }
  };

  const handleSaveProvider = () => {
      if (!providerFormData.name || !providerFormData.cuit) return;
      const newProvider: Provider = {
          ...providerFormData as Provider,
          id: Date.now().toString(),
          balance: 0,
          defaultDiscounts: providerFormData.defaultDiscounts || [0, 0, 0],
          authorizedPersonnel: providerFormData.authorizedPersonnel || []
      };
      setProviders([newProvider, ...providers]);
      setIsProviderModalOpen(false);
      setProviderFormData({ name: '', cuit: '', contact: '', balance: 0, defaultDiscounts: [0, 0, 0], address: '', authorizedPersonnel: [] });
      setProviderModalTab('DATA');
  };

  const addAuthorizedPerson = () => {
      if (!newAuthPerson.trim()) return;
      setProviderFormData(prev => ({
          ...prev,
          authorizedPersonnel: [...(prev.authorizedPersonnel || []), newAuthPerson.trim()]
      }));
      setNewAuthPerson('');
  };

  const removeAuthorizedPerson = (index: number) => {
      setProviderFormData(prev => ({
          ...prev,
          authorizedPersonnel: (prev.authorizedPersonnel || []).filter((_, i) => i !== index)
      }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
          setImportFileName(e.target.files[0].name);
          setImportStep(2);
      }
  };

  const executeImport = () => {
      const fieldKeys = ['cuit', 'name', 'contact', 'address', 'dto1', 'dto2', 'dto3'];
      const newProviders: Provider[] = mockImportData.slice(1).map(row => {
          const provider: any = { 
              id: Math.random().toString(), 
              balance: 0, 
              authorizedPersonnel: [],
              defaultDiscounts: [0, 0, 0]
          };
          fieldKeys.forEach(key => {
              if (importMapping[key] !== undefined) {
                  const val = row[importMapping[key]];
                  if (key === 'dto1') provider.defaultDiscounts[0] = parseFloat(val) || 0;
                  else if (key === 'dto2') provider.defaultDiscounts[1] = parseFloat(val) || 0;
                  else if (key === 'dto3') provider.defaultDiscounts[2] = parseFloat(val) || 0;
                  else provider[key] = val;
              }
          });
          return provider as Provider;
      });

      setProviders([...newProviders, ...providers]);
      setIsImportModalOpen(false);
      setImportStep(1);
      setImportMapping({});
      alert(`Se importaron ${newProviders.length} proveedores correctamente.`);
  };

  const handleAddPayment = () => {
      if (!selectedProvider || !paymentForm.amount) return;
      const amount = parseFloat(paymentForm.amount);
      const newBalance = selectedProvider.balance - amount;
      const isAdvance = paymentForm.selectedPurchases.length === 0;
      const descPrefix = isAdvance ? 'PAGO A CUENTA' : `PAGO FACTURAS (${paymentForm.selectedPurchases.join(', ')})`;

      const newMovement: CurrentAccountMovement = {
          id: `OP-${Date.now().toString().slice(-6)}`,
          date: new Date().toISOString().split('T')[0],
          voucherType: 'ORDEN DE PAGO',
          description: `${descPrefix} - ${paymentForm.method}`,
          debit: amount,
          credit: 0,
          balance: newBalance,
          providerId: selectedProvider.id
      };

      setProviderMovements([newMovement, ...providerMovements]);
      setProviders(prev => prev.map(p => p.id === selectedProvider.id ? {...p, balance: newBalance} : p));
      setIsPaymentModalOpen(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Compras y Proveedores</h2>
          <p className="text-gray-500 text-sm font-medium italic">Control de abastecimiento y gestión de deudas.</p>
        </div>
        
        <div className="flex bg-white rounded-2xl p-1 border border-gray-200 shadow-sm">
            <button onClick={() => setActiveTab('PURCHASES')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all tracking-widest ${activeTab === 'PURCHASES' ? 'bg-slate-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Facturas</button>
            <button onClick={() => setActiveTab('PROVIDERS')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all tracking-widest ${activeTab === 'PROVIDERS' ? 'bg-slate-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Proveedores</button>
        </div>
      </div>

      {activeTab === 'PURCHASES' ? (
          <div className="animate-fade-in flex flex-col flex-1 space-y-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-[2rem] border border-gray-200 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="Buscar por proveedor o ID..." className="pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl text-sm w-80 focus:bg-white focus:border-slate-800 outline-none transition-all font-bold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <button className="bg-slate-900 text-white px-8 py-3 rounded-2xl flex items-center gap-2 font-black text-xs uppercase tracking-widest shadow-xl active:scale-95">
                    <Plus size={18} /> Cargar Factura
                </button>
              </div>

              <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-[10px] text-gray-400 font-black uppercase tracking-widest border-b border-gray-100">
                            <tr>
                                <th className="px-8 py-5">Proveedor / Fecha</th>
                                <th className="px-8 py-5 text-right">Total</th>
                                <th className="px-8 py-5 text-center">Estado</th>
                                <th className="px-8 py-5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {purchases.filter(p => p.providerName.toLowerCase().includes(searchTerm.toLowerCase())).map(purchase => (
                                <tr key={purchase.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="font-black text-slate-800 text-sm uppercase tracking-tight mb-1">{purchase.providerName}</div>
                                        <div className="text-xs text-gray-400 font-bold">{purchase.date}</div>
                                    </td>
                                    <td className="px-8 py-5 text-right font-black text-slate-900">${purchase.total.toLocaleString('es-AR')}</td>
                                    <td className="px-8 py-5 text-center">
                                        <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${purchase.status === 'PAID' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                                            {purchase.status === 'PAID' ? 'PAGADA' : 'PENDIENTE'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <button className="p-2 text-gray-300 hover:text-slate-800 opacity-0 group-hover:opacity-100 transition-all"><Eye size={18}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
              </div>
          </div>
      ) : (
          <div className="animate-fade-in flex flex-col flex-1 space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-[2rem] border border-gray-200 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="Filtrar por razón social..." className="pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl text-sm w-80 focus:bg-white focus:border-slate-800 outline-none transition-all font-bold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setIsImportModalOpen(true)}
                        className="bg-white border-2 border-slate-100 text-slate-600 px-6 py-3 rounded-2xl flex items-center gap-2 font-black hover:bg-slate-50 transition-all uppercase text-xs tracking-widest shadow-sm">
                        <FileSpreadsheet size={18} /> Importar Excel
                    </button>
                    <button 
                        onClick={() => setIsProviderModalOpen(true)}
                        className="bg-ferre-orange text-white px-8 py-3 rounded-2xl flex items-center gap-2 hover:bg-orange-600 transition-all font-black text-xs uppercase tracking-widest shadow-xl shadow-orange-900/10 active:scale-95">
                        <UserPlus size={18} /> Nuevo Proveedor
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-[10px] text-gray-400 font-black uppercase tracking-widest border-b border-gray-100">
                            <tr>
                                <th className="px-8 py-5">Razón Social / CUIT</th>
                                <th className="px-8 py-5">Contacto</th>
                                <th className="px-8 py-5 text-right">Saldo de Cuenta</th>
                                <th className="px-8 py-5 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {providers.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(provider => (
                                <tr key={provider.id} className="hover:bg-slate-50/50 group transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="font-black text-slate-800 text-base uppercase tracking-tight leading-none mb-1">{provider.name}</div>
                                        <div className="text-xs text-gray-400 font-mono font-bold italic">{provider.cuit}</div>
                                    </td>
                                    <td className="px-8 py-5 text-sm font-medium text-slate-500 uppercase">{provider.contact || '-'}</td>
                                    <td className={`px-8 py-5 text-right font-black text-lg tracking-tighter ${provider.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        ${provider.balance.toLocaleString('es-AR')}
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <button onClick={() => { setSelectedProvider(provider); setIsHistoryOpen(true); }} className="bg-slate-900 text-white p-3 rounded-2xl hover:bg-slate-800 transition-all shadow-md group-hover:scale-105"><History size={18}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
      )}

      {/* MODAL: IMPORTACIÓN EXCEL PROVEEDORES */}
      {isImportModalOpen && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
                <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="p-8 border-b border-gray-100 bg-slate-900 text-white flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-500 text-white rounded-2xl shadow-lg"><FileSpreadsheet size={24}/></div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tighter leading-none">Importar Proveedores desde Excel</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sincronización de Agenda Comercial</p>
                            </div>
                        </div>
                        <button onClick={() => setIsImportModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28}/></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-10">
                        {importStep === 1 ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-6">
                                <div className="w-full max-w-md border-4 border-dashed border-slate-100 rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center hover:border-indigo-200 transition-all group relative">
                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} accept=".xlsx,.xls,.csv" />
                                    <div className="p-6 bg-slate-50 rounded-full text-slate-300 group-hover:text-indigo-500 transition-colors mb-4"><FileSpreadsheet size={64}/></div>
                                    <p className="text-xl font-black text-slate-800 uppercase tracking-tighter">Arrastra tu archivo Excel</p>
                                    <p className="text-sm text-slate-400 mt-2 font-medium">O haz clic para buscar</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-10 animate-fade-in">
                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex justify-between items-center">
                                    <p className="font-black text-slate-800 uppercase text-sm tracking-tight flex items-center gap-3"><CheckCircle className="text-green-600"/> {importFileName}</p>
                                    <button onClick={() => setImportStep(1)} className="text-[10px] font-black text-red-500 uppercase tracking-widest">Cambiar</button>
                                </div>

                                <div className="space-y-6">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><LayoutTemplate size={16}/> Mapeo de Columnas</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {[
                                            { key: 'cuit', label: 'CUIT (Obligatorio)', icon: FileText },
                                            { key: 'name', label: 'Razón Social', icon: User },
                                            { key: 'contact', label: 'Persona de Contacto', icon: UserCheck },
                                            { key: 'address', label: 'Dirección Comercial', icon: MapPin },
                                            { key: 'dto1', label: 'Descuento Base 1 (%)', icon: Percent },
                                            { key: 'dto2', label: 'Descuento Base 2 (%)', icon: Percent },
                                        ].map(field => (
                                            <div key={field.key} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3 group hover:border-indigo-200 transition-all">
                                                <div className="p-2 bg-slate-50 text-slate-400 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600"><field.icon size={16}/></div>
                                                <div className="flex-1">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{field.label}</p>
                                                    <select className="w-full bg-slate-100 border-none rounded-lg text-[11px] font-bold p-1 outline-none" value={importMapping[field.key] ?? ''} onChange={(e) => setImportMapping({...importMapping, [field.key]: parseInt(e.target.value)})}>
                                                        <option value="">-- Ignorar --</option>
                                                        {mockImportData[0].map((header, idx) => <option key={idx} value={idx}>{header}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-slate-900 p-8 rounded-[2rem] text-white">
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Previsualización de Datos</p>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-[11px]">
                                            <thead className="text-slate-500 border-b border-white/10">
                                                <tr>{mockImportData[0].map((h, i) => <th key={i} className="pb-3 px-2">{h}</th>)}</tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {mockImportData.slice(1, 3).map((row, idx) => (
                                                    <tr key={idx} className="text-slate-300">{row.map((cell, i) => <td key={i} className="py-3 px-2 font-medium">{cell}</td>)}</tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-8 border-t border-gray-100 bg-gray-50 flex justify-end gap-4">
                        <button onClick={() => setIsImportModalOpen(false)} className="px-8 py-3 font-black text-xs text-gray-400 hover:text-gray-600 uppercase tracking-widest">Cerrar</button>
                        {importStep === 2 && (
                            <button onClick={executeImport} className="bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-200 transition-all active:scale-95 flex items-center gap-3">
                                <CheckCircle size={18}/> Iniciar Importación
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )}

      {/* MODAL: ALTA PROVEEDOR (Existente) */}
      {isProviderModalOpen && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col">
                  <div className="p-8 border-b border-gray-100 bg-slate-900 text-white flex justify-between items-center">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-indigo-500 text-white rounded-2xl shadow-lg shadow-indigo-900/40">
                              <UserPlus size={24}/>
                          </div>
                          <div>
                              <h3 className="text-xl font-black uppercase tracking-tighter leading-none">Gestión Proveedor</h3>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Vínculo Comercial</p>
                          </div>
                      </div>
                      <button onClick={() => setIsProviderModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28}/></button>
                  </div>
                  
                  <div className="flex bg-slate-100 p-1 mx-8 mt-6 rounded-2xl">
                      <button onClick={() => setProviderModalTab('DATA')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${providerModalTab === 'DATA' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Datos Fiscales y Compras</button>
                      <button onClick={() => setProviderModalTab('AUTH')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${providerModalTab === 'AUTH' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Autorizados</button>
                  </div>

                  <div className="p-8 space-y-6">
                      {providerModalTab === 'DATA' ? (
                          <div className="space-y-4 animate-fade-in overflow-y-auto max-h-[50vh] pr-2 custom-scrollbar">
                                <div className="relative">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest ml-2">CUIT / Identificación Fiscal</label>
                                    <div className="flex gap-2">
                                        <input type="text" className="flex-1 p-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-mono text-gray-700 font-bold" value={providerFormData.cuit || ''} onChange={e => setProviderFormData({...providerFormData, cuit: e.target.value})} />
                                        <button onClick={handleSearchProviderCuit} disabled={isSearchingCuit} className="bg-indigo-600 text-white px-4 rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center disabled:opacity-50 min-w-[56px] shadow-lg shadow-indigo-200">
                                            {isSearchingCuit ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest ml-2">Razón Social</label>
                                    <input type="text" className="w-full p-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-slate-800 outline-none font-bold text-gray-700 uppercase" value={providerFormData.name || ''} onChange={e => setProviderFormData({...providerFormData, name: e.target.value})} />
                                </div>
                                <div className="p-4 bg-indigo-50/50 rounded-3xl border border-indigo-100 space-y-4">
                                    <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-2 flex items-center gap-2"><Percent size={14}/> Descuentos Base (%)</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[0, 1, 2].map(idx => (
                                            <div key={idx} className="relative group">
                                                <input type="number" className="w-full p-3 bg-white border-2 border-transparent rounded-2xl focus:border-indigo-600 outline-none font-black text-center text-indigo-700" value={providerFormData.defaultDiscounts?.[idx] || 0} onChange={e => {
                                                    const dCopy = [...(providerFormData.defaultDiscounts || [0, 0, 0])] as [number, number, number];
                                                    dCopy[idx] = parseFloat(e.target.value) || 0;
                                                    setProviderFormData({...providerFormData, defaultDiscounts: dCopy});
                                                }} />
                                                <Percent className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-200" size={10}/>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                          </div>
                      ) : (
                          <div className="space-y-6 animate-fade-in">
                                <div className="bg-slate-50 rounded-[2rem] border border-slate-100 p-6 min-h-[150px] max-h-[300px] overflow-y-auto space-y-2">
                                    {(providerFormData.authorizedPersonnel || []).map((person, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center group shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><UserCheck size={16}/></div>
                                                <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{person}</span>
                                            </div>
                                            <button onClick={() => removeAuthorizedPerson(idx)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"><Trash2 size={16}/></button>
                                        </div>
                                    ))}
                                </div>
                          </div>
                      )}
                      
                      <button onClick={handleSaveProvider} className="w-full bg-slate-900 text-white py-4 rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2">
                          <Save size={18}/> Guardar Proveedor
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL: CUENTA CORRIENTE (Existente) */}
      {isHistoryOpen && selectedProvider && (
            <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
                <div className="bg-white h-full w-full max-w-5xl shadow-2xl flex flex-col animate-slide-in-right">
                    <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-slate-900 text-white">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center font-black text-2xl uppercase">{selectedProvider.name.charAt(0)}</div>
                            <div><h3 className="font-black text-2xl uppercase tracking-tighter">{selectedProvider.name}</h3></div>
                        </div>
                        <button onClick={() => setIsHistoryOpen(false)} className="p-3 hover:bg-white/10 rounded-2xl"><X size={28}/></button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Purchases;
