
import React, { useState, useEffect, useRef } from 'react';
import { 
    Save, Building2, CreditCard, Plus, Trash2, CheckCircle, 
    X, Edit2, RefreshCw, Camera, Upload,
    Percent, CreditCard as CardIcon, Zap, ChevronRight, Info,
    Calculator, Smartphone, Landmark, Globe, Search, Link2, ExternalLink,
    MapPin, Mail, Phone, Hash, FileText
} from 'lucide-react';
import { CompanyConfig, PaymentSystem, CreditInstallment, TaxCondition } from '../types';
import { fetchLatestFinancingRates } from '../services/geminiService';

const CompanySettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'CARDS'>('GENERAL');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  const [lastSources, setLastSources] = useState<{title: string, uri: string}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<CompanyConfig>(() => {
      const saved = localStorage.getItem('company_config');
      const defaultData: CompanyConfig = {
          name: 'FERRETERIA BRUZZONE S.A.',
          fantasyName: 'Ferreteria Bruzzone',
          cuit: '30-12345678-9',
          taxCondition: 'Responsable Inscripto',
          iibb: '', startDate: '', address: '', city: '', zipCode: '', phone: '', email: '', web: '', logo: null, slogan: '', whatsappNumber: '', defaultProfitMargin: 30, paymentAccounts: [], paymentMethods: ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CTACTE'],
          paymentSystems: []
      };

      if (saved) {
          try {
              const parsed = JSON.parse(saved);
              return { 
                  ...defaultData, 
                  ...parsed, 
                  paymentSystems: Array.isArray(parsed.paymentSystems) ? parsed.paymentSystems : [] 
              };
          } catch (e) { return defaultData; }
      }
      return defaultData;
  });

  useEffect(() => {
      localStorage.setItem('company_config', JSON.stringify(formData));
      window.dispatchEvent(new Event('company_config_updated'));
      window.dispatchEvent(new Event('storage'));
  }, [formData]);

  const handleSyncWithAI = async (systemId: string) => {
      const system = formData.paymentSystems?.find(s => s.id === systemId);
      if (!system) return;

      setIsAiSearching(true);
      try {
          const result = await fetchLatestFinancingRates(system.name, system.ratesUrl);
          setFormData(prev => ({
              ...prev,
              paymentSystems: prev.paymentSystems?.map(s => {
                  if (s.id === systemId) {
                      return { ...s, creditInstallments: result.installments };
                  }
                  return s;
              })
          }));
          setLastSources(result.sources);
          alert(`Sincronización exitosa para ${system.name}.`);
      } catch (error) {
          alert("Error al buscar las tasas en la web.");
      } finally {
          setIsAiSearching(false);
      }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          const base64 = event.target?.result as string;
          setFormData(prev => ({ ...prev, logo: base64 }));
      };
      reader.readAsDataURL(file);
  };

  const addManualSystem = () => {
      const name = prompt("Ingrese nombre de la plataforma:");
      if (!name) return;
      const newSystem: PaymentSystem = {
          id: `sys-${Date.now()}`,
          name: name.toUpperCase().trim(),
          debitSurcharge: 0,
          ratesUrl: '',
          creditInstallments: [{ id: `inst-${Date.now()}`, installments: 1, surcharge: 0, label: '1 Pago' }]
      };
      setFormData(prev => ({ ...prev, paymentSystems: [...(prev.paymentSystems || []), newSystem] }));
      setSelectedSystemId(newSystem.id);
  };

  const deleteSystem = (id: string) => {
      if (confirm("¿Eliminar plataforma?")) {
          setFormData(prev => ({ ...prev, paymentSystems: prev.paymentSystems?.filter(s => s.id !== id) }));
          if (selectedSystemId === id) setSelectedSystemId(null);
      }
  };

  const currentSystem = formData.paymentSystems?.find(s => s.id === selectedSystemId);

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto space-y-8 animate-fade-in bg-slate-50 pb-20">
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleLogoUpload} 
        />

        <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm">
            <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase leading-none">Configuración de Empresa</h2>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-2">Identidad, Fiscalidad y Sistemas de Pago</p>
            </div>
            <div className="flex gap-4">
                <div className="flex bg-slate-100 rounded-2xl p-1 shadow-inner">
                    <button onClick={() => setActiveTab('GENERAL')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'GENERAL' ? 'bg-white text-slate-900 shadow-md' : 'text-gray-400'}`}>Datos Identidad</button>
                    <button onClick={() => setActiveTab('CARDS')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'CARDS' ? 'bg-white text-slate-900 shadow-md' : 'text-gray-400'}`}>Intereses y Cuotas</button>
                </div>
                <button onClick={() => alert('¡Configuración guardada con éxito!')} className="bg-slate-900 text-white px-8 py-2 rounded-2xl font-black text-[10px] uppercase shadow-xl flex items-center gap-2 hover:bg-slate-800 transition-all active:scale-95">
                    <Save size={16}/> Guardar Cambios
                </button>
            </div>
        </div>

        {activeTab === 'GENERAL' && (
            <div className="animate-fade-in space-y-8">
                {/* SECCIÓN 1: IDENTIDAD VISUAL Y LEGAL */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 bg-white p-8 rounded-[3rem] border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Logo Corporativo</label>
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-48 h-48 bg-slate-50 border-4 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center relative group cursor-pointer hover:border-indigo-300 transition-all overflow-hidden shadow-inner"
                        >
                            {formData.logo ? (
                                <img src={formData.logo} alt="Logo" className="w-full h-full object-contain p-4 transition-transform group-hover:scale-105" />
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <div className="p-4 bg-white rounded-2xl shadow-sm text-slate-300 group-hover:text-indigo-400 transition-colors">
                                        <Camera size={32} />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Subir Imagen</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-indigo-600/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Upload size={32} className="text-white" />
                            </div>
                        </div>
                        <p className="text-[9px] text-slate-400 font-medium mt-6 leading-relaxed uppercase">Haga clic para cambiar el logo.<br/>Recomendado: PNG fondo transparente.</p>
                        {formData.logo && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); setFormData({...formData, logo: null}); }}
                                className="mt-4 text-[9px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest"
                            >
                                Eliminar Logo
                            </button>
                        )}
                    </div>

                    <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-gray-200 shadow-sm space-y-8">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b pb-4">
                            <Building2 size={18} className="text-indigo-600"/> Datos Legales y Comerciales
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                                    <FileText size={12}/> Razón Social
                                </label>
                                <input 
                                    className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold uppercase outline-none focus:bg-white focus:border-indigo-500 transition-all text-sm" 
                                    placeholder="EJ: FERRETERIA BRUZZONE S.R.L."
                                    value={formData.name} 
                                    onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                                    <Zap size={12}/> Nombre de Fantasía
                                </label>
                                <input 
                                    className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold uppercase outline-none focus:bg-white focus:border-indigo-500 transition-all text-sm" 
                                    placeholder="EJ: BRUZZONE FERRETERÍA"
                                    value={formData.fantasyName} 
                                    onChange={e => setFormData({...formData, fantasyName: e.target.value.toUpperCase()})} 
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                                    <Hash size={12}/> CUIT
                                </label>
                                <input 
                                    className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-mono font-black outline-none focus:bg-white focus:border-indigo-500 transition-all text-sm" 
                                    placeholder="30-XXXXXXXX-X"
                                    value={formData.cuit} 
                                    onChange={e => setFormData({...formData, cuit: e.target.value})} 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                                    <Landmark size={12}/> Condición IVA
                                </label>
                                <select 
                                    className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all text-sm"
                                    value={formData.taxCondition}
                                    onChange={e => setFormData({...formData, taxCondition: e.target.value as TaxCondition})}
                                >
                                    <option value="Responsable Inscripto">Responsable Inscripto</option>
                                    <option value="Monotributo">Monotributo</option>
                                    <option value="Exento">Exento</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                                    <Hash size={12}/> Ingresos Brutos (IIBB)
                                </label>
                                <input 
                                    className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all text-sm" 
                                    placeholder="901-XXXXXX-X"
                                    value={formData.iibb} 
                                    onChange={e => setFormData({...formData, iibb: e.target.value})} 
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECCIÓN 2: CONTACTO Y UBICACIÓN */}
                <div className="bg-white p-10 rounded-[3.5rem] border border-gray-200 shadow-sm space-y-8">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b pb-4">
                        <MapPin size={18} className="text-red-500"/> Información de Contacto y Ubicación
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Dirección Fiscal / Local</label>
                            <input className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all text-sm" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Ciudad</label>
                            <input className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all text-sm" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Código Postal</label>
                            <input className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all text-sm" value={formData.zipCode} onChange={e => setFormData({...formData, zipCode: e.target.value})} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2"><Phone size={12}/> Teléfono Fijo</label>
                            <input className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all text-sm" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2"><Smartphone size={12} className="text-green-500"/> WhatsApp Ventas</label>
                            <input className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:bg-white focus:border-green-500 transition-all text-sm" value={formData.whatsappNumber} onChange={e => setFormData({...formData, whatsappNumber: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2"><Mail size={12}/> Email Corporativo</label>
                            <input className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all text-sm" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2"><Globe size={12}/> Sitio Web</label>
                            <input className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all text-sm" value={formData.web} onChange={e => setFormData({...formData, web: e.target.value})} />
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'CARDS' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Sistemas de Financiación</h3>
                            <button onClick={addManualSystem} className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-md transition-all active:scale-95"><Plus size={18}/></button>
                        </div>
                        
                        <div className="space-y-2">
                            {formData.paymentSystems?.map(sys => (
                                <button 
                                    key={sys.id}
                                    onClick={() => setSelectedSystemId(sys.id)}
                                    className={`w-full p-4 rounded-2xl border-2 flex justify-between items-center transition-all ${selectedSystemId === sys.id ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-50 bg-white hover:border-slate-200'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${selectedSystemId === sys.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}><Zap size={16}/></div>
                                        <span className="font-black text-[11px] uppercase text-slate-700">{sys.name}</span>
                                    </div>
                                    <ChevronRight size={16} className={selectedSystemId === sys.id ? 'text-indigo-600' : 'text-slate-300'}/>
                                </button>
                            ))}
                        </div>

                        {currentSystem && (
                            <div className="pt-6 border-t border-slate-100 space-y-3">
                                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] text-center mb-2">Automatización Inteligente</p>
                                <button 
                                    onClick={() => handleSyncWithAI(currentSystem.id)} 
                                    disabled={isAiSearching}
                                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
                                    {isAiSearching ? <RefreshCw className="animate-spin" size={16}/> : <Globe size={16}/>}
                                    {isAiSearching ? 'Navegando Tasas Oficiales...' : `Sincronizar ${currentSystem.name} con IA`}
                                </button>
                                <p className="text-[8px] text-slate-400 text-center font-medium px-4">Utiliza Google Search o la URL provista para extraer coeficientes vigentes.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-2">
                    {currentSystem ? (
                        <div className="bg-white p-10 rounded-[3rem] border border-gray-200 shadow-sm space-y-8 animate-fade-in">
                            <div className="flex justify-between items-center border-b pb-6">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">{currentSystem.name}</h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Esquema de Cuotas e Intereses</p>
                                </div>
                                <button onClick={() => deleteSystem(currentSystem.id)} className="p-3 text-red-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={20}/></button>
                            </div>

                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">
                                    <Link2 size={12} className="text-indigo-600"/> Link de Tasas Oficiales (Opcional)
                                </label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="Pegar URL aquí (ej: https://galicianave.com.ar/tasas...)"
                                        className="flex-1 p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-bold text-slate-700 text-xs"
                                        value={currentSystem.ratesUrl || ''}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setFormData(prev => ({
                                                ...prev,
                                                paymentSystems: prev.paymentSystems?.map(s => s.id === currentSystem.id ? {...s, ratesUrl: val} : s)
                                            }));
                                        }}
                                    />
                                    {currentSystem.ratesUrl && (
                                        <a href={currentSystem.ratesUrl} target="_blank" rel="noreferrer" className="p-4 bg-slate-100 text-slate-400 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                                            <ExternalLink size={20}/>
                                        </a>
                                    )}
                                </div>
                            </div>

                            {lastSources.length > 0 && (
                                <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 space-y-3">
                                    <h4 className="text-[10px] font-black text-indigo-700 uppercase tracking-widest flex items-center gap-2"><Link2 size={14}/> Fuentes Web Utilizadas por IA</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {lastSources.map((s, idx) => (
                                            <a key={idx} href={s.uri} target="_blank" rel="noreferrer" className="bg-white px-3 py-1 rounded-full text-[9px] font-black text-indigo-500 border border-indigo-200 hover:bg-indigo-600 hover:text-white transition-all">
                                                {s.title.slice(0, 30)}...
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Recargo Débito (%)</label>
                                        <div className="flex items-center gap-3">
                                            <input 
                                                type="number" 
                                                className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-black text-2xl"
                                                value={currentSystem.debitSurcharge}
                                                onChange={e => {
                                                    const val = parseFloat(e.target.value) || 0;
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        paymentSystems: prev.paymentSystems?.map(s => s.id === currentSystem.id ? {...s, debitSurcharge: val} : s)
                                                    }));
                                                }}
                                            />
                                            <Percent size={24} className="text-slate-300"/>
                                        </div>
                                    </div>
                                    <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex gap-4 items-start text-blue-800">
                                        <Info size={24} className="shrink-0"/>
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase mb-1">Nota sobre Coeficientes</h4>
                                            <p className="text-[10px] font-medium leading-relaxed italic">Los intereses aquí configurados se aplicarán sobre el precio final en el punto de venta (POS).</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Planes Detectados</label>
                                        <button onClick={() => {
                                            const inst = parseInt(prompt("Cantidad de Cuotas:") || "0");
                                            if(!inst) return;
                                            const sur = parseFloat(prompt("% Recargo:") || "0");
                                            const newPlan = { id: `inst-${Date.now()}`, installments: inst, surcharge: sur, label: `${inst} Cuotas` };
                                            setFormData(prev => ({
                                                ...prev,
                                                paymentSystems: prev.paymentSystems?.map(s => s.id === currentSystem.id ? {...s, creditInstallments: [...s.creditInstallments, newPlan]} : s)
                                            }));
                                        }} className="text-indigo-600 font-black text-[10px] uppercase hover:underline">+ Agregar Manual</button>
                                    </div>
                                    <div className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-900 text-white text-[9px] font-black uppercase">
                                                <tr>
                                                    <th className="px-5 py-4">Planes</th>
                                                    <th className="px-5 py-4 text-right">Recargo %</th>
                                                    <th className="px-5 py-4 w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {currentSystem.creditInstallments.map((plan, idx) => (
                                                    <tr key={plan.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-5 py-4 font-bold text-xs uppercase text-slate-700">{plan.label}</td>
                                                        <td className="px-5 py-4 text-right">
                                                            <input 
                                                                type="number"
                                                                className="w-20 bg-slate-100 border-none rounded-lg p-2 text-right font-black text-xs text-indigo-600"
                                                                value={plan.surcharge}
                                                                onChange={e => {
                                                                    const val = parseFloat(e.target.value) || 0;
                                                                    const newInst = [...currentSystem.creditInstallments];
                                                                    newInst[idx].surcharge = val;
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        paymentSystems: prev.paymentSystems?.map(s => s.id === currentSystem.id ? {...s, creditInstallments: newInst} : s)
                                                                    }));
                                                                }}
                                                            />
                                                        </td>
                                                        <td className="px-5 py-4 text-right">
                                                            <button onClick={() => {
                                                                const newInst = currentSystem.creditInstallments.filter(i => i.id !== plan.id);
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    paymentSystems: prev.paymentSystems?.map(s => s.id === currentSystem.id ? {...s, creditInstallments: newInst} : s)
                                                                }));
                                                            }} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                            <CardIcon size={48} className="opacity-20 mb-4"/>
                            <p className="font-black uppercase tracking-[0.2em] text-[10px]">Selecciona o crea una plataforma para sincronizar sus tasas</p>
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

export default CompanySettings;
