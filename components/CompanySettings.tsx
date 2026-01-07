
import React, { useState, useEffect, useRef } from 'react';
import { 
    Save, Building2, CreditCard, Plus, Trash2, CheckCircle, 
    X, Edit2, RefreshCw, Camera, Upload,
    Percent, Zap, ChevronRight, Info,
    Calculator, Smartphone, Landmark, Globe, Search, Link2, ExternalLink,
    MapPin, Mail, Phone, Hash, FileText, Calendar, Wallet, QrCode,
    CheckSquare, Square, ToggleRight, ToggleLeft, Layout, Type, Image as ImageIcon
} from 'lucide-react';
import { CompanyConfig, PaymentSystem, PaymentAccount, TaxCondition } from '../types';
import { fetchLatestFinancingRates } from '../services/geminiService';

const CompanySettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'FISCAL' | 'PAYMENTS' | 'CARDS'>('GENERAL');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  const [lastSources, setLastSources] = useState<{title: string, uri: string}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<CompanyConfig>(() => {
      const saved = localStorage.getItem('company_config');
      const defaultData: CompanyConfig = {
          name: 'FERRETERIA BRUZZONE S.A.',
          fantasyName: 'Ferreteria Bruzzone',
          slogan: 'Líderes en herramientas y construcción',
          cuit: '30-12345678-9',
          taxCondition: 'Responsable Inscripto',
          iibb: '901-123456-1',
          startDate: '2024-01-01',
          address: 'Av. del Libertador 1200',
          city: 'Buenos Aires',
          zipCode: '1000',
          phone: '011 4455-6677',
          email: 'contacto@ferrebruzzone.com.ar',
          web: 'www.ferrebruzzone.com.ar',
          logo: null,
          whatsappNumber: '5491144556677',
          defaultProfitMargin: 30,
          paymentAccounts: [],
          paymentMethods: ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CTACTE'],
          paymentSystems: [],
          headerDisplayMode: 'BOTH'
      };

      if (saved) {
          try {
              const parsed = JSON.parse(saved);
              return { ...defaultData, ...parsed };
          } catch (e) { return defaultData; }
      }
      return defaultData;
  });

  useEffect(() => {
      localStorage.setItem('company_config', JSON.stringify(formData));
      window.dispatchEvent(new Event('company_config_updated'));
      window.dispatchEvent(new Event('storage'));
  }, [formData]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => setFormData(prev => ({ ...prev, logo: event.target?.result as string }));
      reader.readAsDataURL(file);
  };

  const togglePaymentMethod = (method: string) => {
      setFormData(prev => {
          const current = prev.paymentMethods || [];
          const next = current.includes(method) 
            ? current.filter(m => m !== method) 
            : [...current, method];
          return { ...prev, paymentMethods: next };
      });
  };

  const addBankAccount = () => {
      const newAcc: PaymentAccount = {
          id: `acc-${Date.now()}`,
          type: 'BANK',
          bankName: 'NUEVO BANCO',
          alias: '',
          cbu: '',
          owner: formData.name,
          active: true
      };
      setFormData(prev => ({ ...prev, paymentAccounts: [...(prev.paymentAccounts || []), newAcc] }));
  };

  const updateBankAccount = (id: string, updates: Partial<PaymentAccount>) => {
      setFormData(prev => ({
          ...prev,
          paymentAccounts: prev.paymentAccounts.map(a => a.id === id ? { ...a, ...updates } : a)
      }));
  };

  const handleSyncWithAI = async (systemId: string) => {
      const system = formData.paymentSystems?.find(s => s.id === systemId);
      if (!system) return;
      setIsAiSearching(true);
      try {
          const result = await fetchLatestFinancingRates(system.name, system.ratesUrl);
          setFormData(prev => ({
              ...prev,
              paymentSystems: prev.paymentSystems?.map(s => s.id === systemId ? { ...s, creditInstallments: result.installments } : s)
          }));
          setLastSources(result.sources);
          alert(`Tasas actualizadas para ${system.name}`);
      } catch (error) {
          alert("Error al sincronizar con IA");
      } finally { setIsAiSearching(false); }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto space-y-8 animate-fade-in bg-slate-50 pb-20">
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />

        <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm shrink-0">
            <div className="flex items-center gap-5">
                <div className="p-4 bg-slate-900 text-indigo-400 rounded-3xl shadow-xl"><Building2 size={32}/></div>
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase leading-none">Mi Empresa</h2>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-2">Configuración Central del Sistema</p>
                </div>
            </div>
            <div className="flex bg-slate-100 rounded-2xl p-1.5 shadow-inner border border-slate-200">
                <button onClick={() => setActiveTab('GENERAL')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'GENERAL' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400'}`}>Identidad</button>
                <button onClick={() => setActiveTab('FISCAL')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'FISCAL' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400'}`}>Fiscal</button>
                <button onClick={() => setActiveTab('PAYMENTS')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'PAYMENTS' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400'}`}>Cobros</button>
                <button onClick={() => setActiveTab('CARDS')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'CARDS' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400'}`}>Tarjetas</button>
            </div>
        </div>

        {activeTab === 'GENERAL' && (
            <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-10 rounded-[3rem] border border-gray-200 shadow-sm text-center">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-8">Imagen de Marca</label>
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-56 h-56 bg-slate-50 border-4 border-dashed border-slate-100 rounded-[3.5rem] mx-auto flex items-center justify-center relative group cursor-pointer hover:border-indigo-400 transition-all overflow-hidden"
                        >
                            {formData.logo ? (
                                <img src={formData.logo} alt="Logo" className="w-full h-full object-contain p-6" />
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-slate-300 group-hover:text-indigo-500">
                                    <Camera size={48} />
                                    <span className="text-[10px] font-black uppercase">Subir Logo</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-indigo-600/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white font-black text-xs uppercase">Cambiar</div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[3rem] border border-gray-200 shadow-sm space-y-6">
                        <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest border-b pb-4 flex items-center gap-2">
                            <Layout size={16} className="text-indigo-600"/> Visualización en Menú
                        </h3>
                        <div className="grid grid-cols-1 gap-2">
                            {[
                                { id: 'LOGO', label: 'Solo Logo', icon: ImageIcon },
                                { id: 'NAME', label: 'Solo Nombre', icon: Type },
                                { id: 'BOTH', label: 'Logo y Nombre', icon: Layout }
                            ].map(option => (
                                <button 
                                    key={option.id}
                                    onClick={() => setFormData({...formData, headerDisplayMode: option.id as any})}
                                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${formData.headerDisplayMode === option.id ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-slate-50 hover:border-slate-200 bg-white text-slate-400'}`}
                                >
                                    <option.icon size={18} />
                                    <span className="text-xs font-black uppercase tracking-tight">{option.label}</span>
                                    {formData.headerDisplayMode === option.id && <CheckCircle size={16} className="ml-auto text-indigo-600" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-10 rounded-[3rem] border border-gray-200 shadow-sm space-y-6">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b pb-4 flex items-center gap-2">
                            <Zap size={18} className="text-indigo-600"/> Nombre y Slogan
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-2">Nombre Comercial</label>
                                <input className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black text-xl uppercase outline-none focus:bg-white focus:border-indigo-500" value={formData.fantasyName} onChange={e => setFormData({...formData, fantasyName: e.target.value.toUpperCase()})} />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-2">Slogan del Local</label>
                                <input className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold text-slate-500 italic outline-none focus:bg-white focus:border-indigo-500" value={formData.slogan} onChange={e => setFormData({...formData, slogan: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-10 rounded-[3rem] border border-gray-200 shadow-sm space-y-6">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b pb-4 flex items-center gap-2">
                            <MapPin size={18} className="text-red-500"/> Ubicación y Contacto
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-2">Dirección Local</label>
                                <input className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold text-sm" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-2">Ciudad</label>
                                <input className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold text-sm" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-2">Teléfono Ventas</label>
                                <input className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold text-sm" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-2">WhatsApp (Formato Internacional)</label>
                                <input className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold text-sm text-green-600" placeholder="54911..." value={formData.whatsappNumber} onChange={e => setFormData({...formData, whatsappNumber: e.target.value})} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'FISCAL' && (
            <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-[3rem] border border-gray-200 shadow-sm space-y-8">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b pb-4 flex items-center gap-2">
                        <Landmark size={18} className="text-indigo-600"/> Identificación Legal (ARCA)
                    </h3>
                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-2">Razón Social</label>
                            <input className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black text-lg uppercase outline-none focus:bg-white focus:border-indigo-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-2">CUIT</label>
                                <input className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black tracking-tighter" value={formData.cuit} onChange={e => setFormData({...formData, cuit: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-2">Ingresos Brutos (IIBB)</label>
                                <input className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold" value={formData.iibb} onChange={e => setFormData({...formData, iibb: e.target.value})} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-2">Condición IVA</label>
                                <select className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold" value={formData.taxCondition} onChange={e => setFormData({...formData, taxCondition: e.target.value as TaxCondition})}>
                                    <option value="Responsable Inscripto">Responsable Inscripto</option>
                                    <option value="Monotributo">Monotributo</option>
                                    <option value="Exento">Exento</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-2">Inicio Actividades</label>
                                <input type="date" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl space-y-8 flex flex-col justify-center">
                    <div className="text-center space-y-4">
                        <div className="w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center mx-auto"><Calculator size={40} className="text-indigo-400"/></div>
                        <h4 className="text-2xl font-black uppercase tracking-tighter">Utilidad Operativa</h4>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed">Este es el margen que el sistema sugerirá al cargar productos nuevos.</p>
                    </div>
                    <div className="relative">
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] block text-center mb-4">Margen Ganancia Global</label>
                        <div className="flex items-center justify-center gap-4">
                             <span className="text-4xl font-black text-white">%</span>
                             <input type="number" className="w-48 p-6 bg-white/5 border-2 border-white/10 rounded-[2.5rem] font-black text-6xl text-center outline-none focus:bg-white/10 focus:border-indigo-500" value={formData.defaultProfitMargin} onChange={e => setFormData({...formData, defaultProfitMargin: parseFloat(e.target.value) || 0})} />
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'PAYMENTS' && (
            <div className="animate-fade-in space-y-8">
                <div className="bg-white p-10 rounded-[3rem] border border-gray-200 shadow-sm space-y-8">
                    <div className="flex justify-between items-center border-b pb-6">
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                            <Landmark size={24} className="text-indigo-600"/> Cuentas para Transferencias
                        </h3>
                        <button onClick={addBankAccount} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2 hover:bg-slate-800">
                            <Plus size={16}/> Añadir Cuenta
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {formData.paymentAccounts?.map(acc => (
                            <div key={acc.id} className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200 relative group">
                                <button onClick={() => setFormData(prev => ({...prev, paymentAccounts: prev.paymentAccounts.filter(a => a.id !== acc.id)}))} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="flex gap-4 mb-4">
                                        <button onClick={() => updateBankAccount(acc.id, {type: 'BANK'})} className={`flex-1 py-2 rounded-xl font-black text-[9px] uppercase border transition-all ${acc.type === 'BANK' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400'}`}>BANCO</button>
                                        <button onClick={() => updateBankAccount(acc.id, {type: 'VIRTUAL_WALLET'})} className={`flex-1 py-2 rounded-xl font-black text-[9px] uppercase border transition-all ${acc.type === 'VIRTUAL_WALLET' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-slate-400'}`}>BILLETERA</button>
                                    </div>
                                    <input className="w-full p-3 bg-white border border-slate-200 rounded-xl font-black text-xs uppercase" placeholder="NOMBRE ENTIDAD (EJ: BANCO GALICIA)" value={acc.bankName} onChange={e => updateBankAccount(acc.id, {bankName: e.target.value.toUpperCase()})} />
                                    <input className="w-full p-3 bg-white border border-slate-200 rounded-xl font-black text-xs" placeholder="ALIAS DE LA CUENTA" value={acc.alias} onChange={e => updateBankAccount(acc.id, {alias: e.target.value})} />
                                    <input className="w-full p-3 bg-white border border-slate-200 rounded-xl font-black text-xs font-mono" placeholder="CBU / CVU" value={acc.cbu} onChange={e => updateBankAccount(acc.id, {cbu: e.target.value})} />
                                </div>
                            </div>
                        ))}
                        {formData.paymentAccounts?.length === 0 && (
                            <div className="col-span-2 py-20 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] text-slate-300">
                                <Wallet size={48} className="mx-auto mb-3 opacity-20"/>
                                <p className="font-black uppercase text-[10px] tracking-widest">No hay cuentas bancarias cargadas</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[3rem] border border-gray-200 shadow-sm space-y-6">
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter border-b pb-6">Métodos de Pago Habilitados (POS)</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CTACTE', 'CHEQUE', 'E-CHEQ'].map(m => (
                            <button 
                                key={m}
                                onClick={() => togglePaymentMethod(m)}
                                className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 ${formData.paymentMethods?.includes(m) ? 'border-indigo-600 bg-indigo-50 shadow-lg scale-105' : 'border-slate-50 bg-white text-slate-300'}`}>
                                {formData.paymentMethods?.includes(m) ? <CheckSquare size={24} className="text-indigo-600"/> : <Square size={24}/>}
                                <span className={`text-[10px] font-black uppercase tracking-widest ${formData.paymentMethods?.includes(m) ? 'text-indigo-900' : 'text-slate-400'}`}>{m.replace('_', ' ')}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'CARDS' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in pb-10">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm space-y-6">
                        <div className="flex justify-between items-center border-b pb-4">
                            <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Plataformas</h3>
                            <button onClick={() => {
                                const name = prompt("Nombre plataforma:");
                                if(name) setFormData(prev => ({...prev, paymentSystems: [...(prev.paymentSystems||[]), {id: `sys-${Date.now()}`, name: name.toUpperCase(), debitSurcharge: 0, ratesUrl: '', creditInstallments: []}]}));
                            }} className="p-2 bg-indigo-600 text-white rounded-xl shadow-md"><Plus size={18}/></button>
                        </div>
                        <div className="space-y-2">
                            {formData.paymentSystems?.map(sys => (
                                <button key={sys.id} onClick={() => setSelectedSystemId(sys.id)} className={`w-full p-4 rounded-2xl border-2 flex justify-between items-center transition-all ${selectedSystemId === sys.id ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-50 bg-white'}`}>
                                    <span className="font-black text-[11px] uppercase text-slate-700">{sys.name}</span>
                                    <ChevronRight size={16} className={selectedSystemId === sys.id ? 'text-indigo-600' : 'text-slate-300'}/>
                                </button>
                            ))}
                        </div>
                        {selectedSystemId && (
                            <button onClick={() => handleSyncWithAI(selectedSystemId)} disabled={isAiSearching} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-indigo-700 flex items-center justify-center gap-3">
                                {isAiSearching ? <RefreshCw className="animate-spin" size={16}/> : <Globe size={16}/>}
                                {isAiSearching ? 'Escaneando Tasas...' : 'Sincronizar con IA'}
                            </button>
                        )}
                        {/* Fix: Added display of AI grounding sources for finance rates as required */}
                        {lastSources.length > 0 && (
                            <div className="mt-4 p-4 bg-blue-50 rounded-2xl border border-blue-100 animate-fade-in">
                                <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                    <Info size={10}/> Fuentes de información IA:
                                </p>
                                <div className="space-y-1">
                                    {lastSources.map((s, idx) => (
                                        <a key={idx} href={s.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[9px] font-bold text-blue-600 hover:underline">
                                            <ExternalLink size={10}/> {s.title}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-2">
                    {selectedSystemId ? (
                        <div className="bg-white p-10 rounded-[3rem] border border-gray-200 shadow-sm space-y-8 animate-fade-in">
                            <div className="flex justify-between items-center border-b pb-6">
                                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">{formData.paymentSystems?.find(s => s.id === selectedSystemId)?.name}</h3>
                                <button onClick={() => setFormData(prev => ({...prev, paymentSystems: prev.paymentSystems.filter(s => s.id !== selectedSystemId)}))} className="p-3 text-red-400 hover:text-red-600 transition-colors"><Trash2 size={20}/></button>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">URL de Tasas Oficiales</label>
                                    <input className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold text-xs" value={formData.paymentSystems?.find(s => s.id === selectedSystemId)?.ratesUrl} onChange={e => setFormData(prev => ({...prev, paymentSystems: prev.paymentSystems.map(s => s.id === selectedSystemId ? {...s, ratesUrl: e.target.value} : s)}))} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Recargo Débito (%)</label>
                                    <input type="number" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black text-2xl text-indigo-600" value={formData.paymentSystems?.find(s => s.id === selectedSystemId)?.debitSurcharge} onChange={e => setFormData(prev => ({...prev, paymentSystems: prev.paymentSystems.map(s => s.id === selectedSystemId ? {...s, debitSurcharge: parseFloat(e.target.value) || 0} : s)}))} />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-slate-200 text-center text-slate-300">
                             <CreditCard size={64} className="mx-auto mb-4 opacity-20"/>
                             <p className="font-black uppercase tracking-widest text-xs">Selecciona una plataforma para editar sus cuotas</p>
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

export default CompanySettings;
