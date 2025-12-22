
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Truck, Plus, Search, FileText, User, UserPlus, MoreVertical, 
    CreditCard, Calendar, X, Save, Percent, ArrowLeft, ArrowUpRight, 
    Wallet, CheckCircle, DollarSign, Printer, Download, Eye, Upload, 
    FileSpreadsheet, RefreshCw, Globe, Trash2, ShoppingCart, Package, 
    AlertTriangle, Edit, Box, Tag, Layers, Calculator, Landmark, 
    History, ArrowDownLeft, CheckSquare, Square, ArrowRight, Info, Scroll, Smartphone, Loader2, Zap, ShieldCheck, UserCheck
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
        } else {
            alert("No se obtuvieron datos para este CUIT. Ingrese los datos manualmente.");
        }
    } catch (err) {
        console.error(err);
        alert("Error de conexión al buscar CUIT.");
    } finally {
        setIsSearchingCuit(false);
    }
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

  const toggleCheckSelection = (check: Check) => {
      setPaymentForm(prev => {
          const isSelected = prev.selectedCheckIds.includes(check.id);
          const newList = isSelected 
            ? prev.selectedCheckIds.filter(id => id !== check.id)
            : [...prev.selectedCheckIds, check.id];
          
          const newTotal = isSelected 
            ? (parseFloat(prev.amount) || 0) - check.amount
            : (parseFloat(prev.amount) || 0) + check.amount;

          return { ...prev, selectedCheckIds: newList, amount: Math.max(0, newTotal).toString() };
      });
  };

  const handleAddPayment = () => {
      if (!selectedProvider || !paymentForm.amount) return;

      const amount = parseFloat(paymentForm.amount);
      const newBalance = selectedProvider.balance - amount;
      
      const isAdvance = paymentForm.selectedPurchases.length === 0;
      const descPrefix = isAdvance ? 'PAGO A CUENTA (ADELANTO)' : `PAGO FACTURAS (${paymentForm.selectedPurchases.join(', ')})`;

      if (paymentForm.method === 'CHEQUE_TERCERO') {
          setChecks(prev => prev.map(c => 
              paymentForm.selectedCheckIds.includes(c.id) 
              ? { ...c, status: 'ENTREGADO', destination: selectedProvider.name } 
              : c
          ));
      }

      const newMovement: CurrentAccountMovement = {
          id: `OP-${Date.now().toString().slice(-6)}`,
          date: new Date().toISOString().split('T')[0],
          voucherType: 'ORDEN DE PAGO',
          description: `${descPrefix} - ${paymentForm.method}${paymentForm.note ? ': ' + paymentForm.note : ''}`,
          debit: amount,
          credit: 0,
          balance: newBalance,
          providerId: selectedProvider.id
      };

      setProviderMovements([newMovement, ...providerMovements]);
      const updatedProvider = { ...selectedProvider, balance: newBalance };
      setProviders(prev => prev.map(p => p.id === updatedProvider.id ? updatedProvider : p));
      setSelectedProvider(updatedProvider);
      
      setIsPaymentModalOpen(false);
      setPaymentForm({ amount: '', method: 'TRANSFERENCIA', note: '', selectedPurchases: [], selectedCheckIds: [] });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Compras y Proveedores</h2>
          <p className="text-gray-500 text-sm font-medium italic">Control de abastecimiento y gestión de deudas.</p>
        </div>
        
        <div className="flex bg-white rounded-2xl p-1 border border-gray-200 shadow-sm">
            <button 
                onClick={() => setActiveTab('PURCHASES')}
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all tracking-widest ${activeTab === 'PURCHASES' ? 'bg-slate-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
                Facturas
            </button>
            <button 
                onClick={() => setActiveTab('PROVIDERS')}
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all tracking-widest ${activeTab === 'PROVIDERS' ? 'bg-slate-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
                Proveedores
            </button>
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
                                <th className="px-8 py-5">Comprobante</th>
                                <th className="px-8 py-5 text-center">Items</th>
                                <th className="px-8 py-5 text-right">Total</th>
                                <th className="px-8 py-5 text-center">Estado</th>
                                <th className="px-8 py-5 text-center"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {purchases.filter(p => p.providerName.toLowerCase().includes(searchTerm.toLowerCase())).map(purchase => (
                                <tr key={purchase.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="font-black text-slate-800 text-sm uppercase tracking-tight mb-1">{purchase.providerName}</div>
                                        <div className="text-xs text-gray-400 font-bold">{purchase.date}</div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-black">{purchase.type.replace('_', ' ')}</span>
                                            <span className="text-xs font-mono font-bold text-gray-400">{purchase.id}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-center text-sm font-bold text-gray-500">{purchase.items}</td>
                                    <td className="px-8 py-5 text-right font-black text-slate-900">${purchase.total.toLocaleString('es-AR')}</td>
                                    <td className="px-8 py-5 text-center">
                                        <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${purchase.status === 'PAID' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                                            {purchase.status === 'PAID' ? 'PAGADA' : 'PENDIENTE'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <button className="p-2 text-gray-300 hover:text-slate-800 transition-all opacity-0 group-hover:opacity-100"><Eye size={18}/></button>
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
                <button 
                    onClick={() => setIsProviderModalOpen(true)}
                    className="bg-ferre-orange text-white px-8 py-3 rounded-2xl flex items-center gap-2 hover:bg-orange-600 transition-all font-black text-xs uppercase tracking-widest shadow-xl shadow-orange-900/10 active:scale-95">
                    <UserPlus size={18} /> Nuevo Proveedor
                </button>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-[10px] text-gray-400 font-black uppercase tracking-widest border-b border-gray-100">
                            <tr>
                                <th className="px-8 py-5">Razón Social / CUIT</th>
                                <th className="px-8 py-5">Contacto Principal</th>
                                <th className="px-8 py-5">Personal Autorizado</th>
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
                                    <td className="px-8 py-5">
                                        <div className="flex -space-x-2">
                                            {(provider.authorizedPersonnel || []).slice(0, 3).map((person, i) => (
                                                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-600 uppercase" title={person}>
                                                    {person.charAt(0)}
                                                </div>
                                            ))}
                                            {(provider.authorizedPersonnel || []).length > 3 && (
                                                <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-900 flex items-center justify-center text-[10px] font-black text-white">
                                                    +{(provider.authorizedPersonnel || []).length - 3}
                                                </div>
                                            )}
                                            {(!provider.authorizedPersonnel || provider.authorizedPersonnel.length === 0) && (
                                                <span className="text-[10px] text-gray-300 font-bold italic">Sin registros</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className={`px-8 py-5 text-right font-black text-lg tracking-tighter ${provider.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        ${provider.balance.toLocaleString('es-AR')}
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <button 
                                            onClick={() => { setSelectedProvider(provider); setIsHistoryOpen(true); }}
                                            className="bg-slate-900 text-white p-3 rounded-2xl hover:bg-slate-800 transition-all shadow-md group-hover:scale-105"
                                            title="Ver Cuenta Corriente"
                                        >
                                            <History size={18}/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
      )}

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
                      <button 
                        onClick={() => setProviderModalTab('DATA')}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${providerModalTab === 'DATA' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                        Datos Fiscales y Compras
                      </button>
                      <button 
                        onClick={() => setProviderModalTab('AUTH')}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${providerModalTab === 'AUTH' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                        Autorizados
                      </button>
                  </div>

                  <div className="p-8 space-y-6">
                      {providerModalTab === 'DATA' ? (
                          <div className="space-y-4 animate-fade-in overflow-y-auto max-h-[50vh] pr-2 custom-scrollbar">
                                <div className="relative">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest ml-2">CUIT / Identificación Fiscal</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            className="flex-1 p-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-mono text-gray-700 font-bold" 
                                            placeholder="30-xxxxxxxx-x"
                                            value={providerFormData.cuit || ''} 
                                            onChange={e => setProviderFormData({...providerFormData, cuit: e.target.value})} 
                                        />
                                        <button 
                                            onClick={handleSearchProviderCuit}
                                            disabled={isSearchingCuit}
                                            className="bg-indigo-600 text-white px-4 rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center disabled:opacity-50 min-w-[56px] shadow-lg shadow-indigo-200">
                                            {isSearchingCuit ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} />}
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-indigo-500 font-bold mt-1 uppercase tracking-tighter flex items-center gap-1 ml-2">
                                        <Zap size={10}/> Buscar datos fiscales con IA
                                    </p>
                                </div>
                                
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest ml-2">Razón Social</label>
                                    <input type="text" className="w-full p-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-slate-800 outline-none font-bold text-gray-700 uppercase" value={providerFormData.name || ''} onChange={e => setProviderFormData({...providerFormData, name: e.target.value})} />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest ml-2">Dirección Comercial</label>
                                    <input type="text" className="w-full p-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-slate-800 outline-none font-bold text-gray-700 uppercase" value={providerFormData.address || ''} onChange={e => setProviderFormData({...providerFormData, address: e.target.value})} />
                                </div>

                                <div className="p-4 bg-indigo-50/50 rounded-3xl border border-indigo-100 space-y-4">
                                    <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-2 flex items-center gap-2">
                                        <Percent size={14}/> Descuentos Base (%)
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[0, 1, 2].map(idx => (
                                            <div key={idx} className="relative group">
                                                <input 
                                                    type="number" 
                                                    placeholder={`Dto ${idx + 1}`}
                                                    className="w-full p-3 bg-white border-2 border-transparent rounded-2xl focus:border-indigo-600 outline-none font-black text-center text-indigo-700" 
                                                    value={providerFormData.defaultDiscounts?.[idx] || 0} 
                                                    onChange={e => {
                                                        const dCopy = [...(providerFormData.defaultDiscounts || [0, 0, 0])] as [number, number, number];
                                                        dCopy[idx] = parseFloat(e.target.value) || 0;
                                                        setProviderFormData({...providerFormData, defaultDiscounts: dCopy});
                                                    }} 
                                                />
                                                <Percent className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-200 group-focus-within:text-indigo-600" size={10}/>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest italic ml-2">Estos descuentos se aplicarán automáticamente a sus productos.</p>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest ml-2">Persona de Contacto (Titular)</label>
                                    <input type="text" className="w-full p-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-slate-800 outline-none font-bold text-gray-700" value={providerFormData.contact || ''} onChange={e => setProviderFormData({...providerFormData, contact: e.target.value})} />
                                </div>
                          </div>
                      ) : (
                          <div className="space-y-6 animate-fade-in">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest ml-2">Añadir Persona Autorizada</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            className="flex-1 p-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-bold text-gray-700" 
                                            placeholder="Nombre completo y función..."
                                            value={newAuthPerson}
                                            onChange={e => setNewAuthPerson(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && addAuthorizedPerson()}
                                        />
                                        <button onClick={addAuthorizedPerson} className="bg-indigo-50 text-indigo-600 px-4 rounded-2xl hover:bg-indigo-100 transition-all font-black text-xs uppercase tracking-widest border border-indigo-100">AÑADIR</button>
                                    </div>
                                </div>

                                <div className="bg-slate-50 rounded-[2rem] border border-slate-100 p-6 min-h-[150px] max-h-[300px] overflow-y-auto space-y-2">
                                    {(providerFormData.authorizedPersonnel || []).map((person, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center group shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><UserCheck size={16}/></div>
                                                <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{person}</span>
                                            </div>
                                            <button onClick={() => removeAuthorizedPerson(idx)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1">
                                                <Trash2 size={16}/>
                                            </button>
                                        </div>
                                    ))}
                                    {(providerFormData.authorizedPersonnel || []).length === 0 && (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-300 py-10">
                                            <ShieldCheck size={32} className="opacity-20 mb-2"/>
                                            <p className="text-xs font-bold uppercase tracking-widest">Sin personal registrado</p>
                                        </div>
                                    )}
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

      {isHistoryOpen && selectedProvider && (
            <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
                <div className="bg-white h-full w-full max-w-5xl shadow-2xl flex flex-col animate-slide-in-right">
                    <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-slate-900 text-white">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center font-black text-2xl uppercase">
                                {selectedProvider.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-black text-2xl uppercase tracking-tighter">{selectedProvider.name}</h3>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-xs text-slate-400 font-mono uppercase tracking-widest">Cuenta Proveedor</span>
                                    <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                                    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">{selectedProvider.cuit}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setIsPaymentModalOpen(true)}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 transition-all">
                                <DollarSign size={18}/> REGISTRAR PAGO
                            </button>
                            <button onClick={() => { setIsHistoryOpen(false); setViewingVoucher(null); }} className="p-3 hover:bg-white/10 rounded-2xl">
                                <X size={28}/>
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/50">
                        <div className="p-8 bg-white border-b border-gray-100 shadow-sm flex items-center justify-between">
                            <div className="bg-red-50 p-6 rounded-3xl border border-red-100 w-1/2 shadow-inner">
                                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Total Adeudado</p>
                                <p className="text-4xl font-black text-red-600 tracking-tighter">${selectedProvider.balance.toLocaleString('es-AR')}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Días desde última compra</p>
                                <p className="text-xl font-bold text-slate-500 italic">2 días</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 relative">
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-900 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                        <tr>
                                            <th className="px-6 py-4">Fecha / ID</th>
                                            <th className="px-6 py-4">Comprobante / Concepto</th>
                                            <th className="px-6 py-4 text-right text-indigo-400">Pagos (Debe -)</th>
                                            <th className="px-6 py-4 text-right">Compras (Haber +)</th>
                                            <th className="px-6 py-4 text-right text-white">Saldo Deuda</th>
                                            <th className="px-6 py-4 text-center">Ver</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 text-sm">
                                        {currentMovements.map(m => (
                                            <tr key={m.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-5">
                                                    <div className="font-bold text-slate-700">{m.date}</div>
                                                    <div className="text-[10px] font-mono font-black text-slate-400 uppercase">{m.id}</div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${m.debit > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>
                                                            {m.debit > 0 ? <ArrowUpRight size={16}/> : <ShoppingCart size={16}/>}
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-slate-800 uppercase text-xs tracking-tight">{m.voucherType}</div>
                                                            <div className="text-[11px] text-gray-400 font-medium truncate max-w-xs">{m.description}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right font-bold text-indigo-600">{m.debit > 0 ? `$${m.debit.toLocaleString('es-AR')}` : '-'}</td>
                                                <td className="px-6 py-5 text-right font-bold text-red-500">{m.credit > 0 ? `$${m.credit.toLocaleString('es-AR')}` : '-'}</td>
                                                <td className="px-6 py-5 text-right font-black text-slate-900">${m.balance.toLocaleString('es-AR')}</td>
                                                <td className="px-6 py-5 text-center">
                                                    <button onClick={() => setViewingVoucher(m)} className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all shadow-sm">
                                                        <Eye size={20}/>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {isPaymentModalOpen && selectedProvider && (
            <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
                <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col my-8">
                    <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-slate-900 text-white">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-500 text-white rounded-2xl shadow-lg">
                                <DollarSign size={24}/>
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tighter leading-none">Registrar Pago</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Egreso de Fondos / Endoso de Valores</p>
                            </div>
                        </div>
                        <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28}/></button>
                    </div>

                    <div className="p-8 space-y-8 custom-scrollbar">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Info size={14}/> Imputar a Facturas Pendientes</h4>
                            <div className="space-y-2 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner">
                                {pendingPurchases.length > 0 ? pendingPurchases.map(v => (
                                    <div key={v.id} onClick={() => {
                                        const isSelected = paymentForm.selectedPurchases.includes(v.id);
                                        const newList = isSelected ? paymentForm.selectedPurchases.filter(x => x !== v.id) : [...paymentForm.selectedPurchases, v.id];
                                        setPaymentForm({...paymentForm, selectedPurchases: newList, amount: isSelected ? paymentForm.amount : v.credit.toString()});
                                    }} className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${paymentForm.selectedPurchases.includes(v.id) ? 'bg-white border-indigo-600 shadow-md' : 'bg-transparent border-transparent hover:bg-white/50'}`}>
                                        <div className="flex items-center gap-4">
                                            {paymentForm.selectedPurchases.includes(v.id) ? <CheckSquare className="text-indigo-600"/> : <Square className="text-gray-300"/>}
                                            <div><p className="text-xs font-black text-gray-800 uppercase">{v.voucherType} - {v.id}</p><p className="text-[10px] text-gray-400 font-bold uppercase">{v.date}</p></div>
                                        </div>
                                        <p className="font-black text-red-600">${v.credit.toLocaleString()}</p>
                                    </div>
                                )) : (
                                    <p className="p-8 text-center text-xs text-gray-400 font-bold uppercase italic">No hay compras pendientes</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Importe a Pagar ($)</label>
                            <input type="number" className="w-full p-6 bg-indigo-50 border-2 border-indigo-100 rounded-[2rem] focus:bg-white focus:border-indigo-600 outline-none text-4xl font-black text-indigo-700 tracking-tighter transition-all" placeholder="0.00" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
                        </div>

                        <div className="grid grid-cols-4 gap-3">
                            {[
                                { id: 'TRANSFERENCIA', icon: Landmark, label: 'Transf.' },
                                { id: 'EFECTIVO', icon: Wallet, label: 'Efectivo' },
                                { id: 'CHEQUE_TERCERO', icon: Scroll, label: 'Valores' },
                                { id: 'CHEQUE_PROPIO', icon: CreditCard, label: 'Cheque P.' }
                            ].map(m => (
                                <button key={m.id} onClick={() => setPaymentForm({...paymentForm, method: m.id as any})} className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${paymentForm.method === m.id ? 'border-orange-600 bg-orange-50 text-orange-700 shadow-sm' : 'border-gray-100 text-gray-400 hover:bg-gray-50 shadow-sm'}`}>
                                    <m.icon size={20}/>
                                    <span className="text-[9px] font-black uppercase tracking-widest">{m.label}</span>
                                </button>
                            ))}
                        </div>

                        {paymentForm.method === 'CHEQUE_TERCERO' && (
                            <div className="p-6 bg-orange-50 border-2 border-orange-100 rounded-[2.5rem] space-y-4 animate-fade-in shadow-inner">
                                <h4 className="text-[10px] font-black text-orange-700 uppercase tracking-widest flex items-center gap-2">
                                    <Scroll size={14}/> Cartera de Valores (Disponibles: {availableChecks.length})
                                </h4>
                                <div className="space-y-2 max-h-56 overflow-y-auto p-1">
                                    {availableChecks.length > 0 ? availableChecks.map(check => (
                                        <div key={check.id} onClick={() => toggleCheckSelection(check)} className={`bg-white p-4 rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center ${paymentForm.selectedCheckIds.includes(check.id) ? 'border-orange-500 shadow-md ring-4 ring-orange-50' : 'border-transparent hover:border-orange-200'}`}>
                                            <div className="flex items-center gap-3">
                                                {paymentForm.selectedCheckIds.includes(check.id) ? <CheckSquare className="text-orange-600"/> : <Square className="text-gray-300"/>}
                                                <div>
                                                    <p className="text-xs font-black text-slate-800 uppercase leading-none mb-1">{check.bank}</p>
                                                    <p className="text-[9px] font-mono text-slate-400 uppercase">Nº {check.number} | Vence: {check.paymentDate}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-slate-900">${check.amount.toLocaleString()}</p>
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">ORIGEN: {check.origin}</p>
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-center py-8 text-xs text-orange-400 font-bold uppercase italic">Sin cheques disponibles en cartera</p>
                                    )}
                                </div>
                                {paymentForm.selectedCheckIds.length > 0 && (
                                    <p className="text-[10px] text-center text-orange-600 font-bold uppercase tracking-wider">Monto acumulado por cheques: ${parseFloat(paymentForm.amount).toLocaleString('es-AR')}</p>
                                )}
                            </div>
                        )}

                        <button onClick={handleAddPayment} disabled={!paymentForm.amount} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-6 rounded-[2.5rem] shadow-2xl transition-all active:scale-95 disabled:opacity-20 flex items-center justify-center gap-3 uppercase tracking-widest text-sm">
                            <CheckCircle size={24}/> EMITIR ORDEN DE PAGO
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Purchases;
