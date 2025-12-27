
import React, { useState, useEffect } from 'react';
import { 
    Save, Building2, CreditCard, Plus, Trash2, CheckCircle, 
    X, Edit2, RefreshCw, Camera,
    Percent, CreditCard as CardIcon, Zap, ChevronRight, Info,
    Calculator, Smartphone, Landmark, Download, UploadCloud
} from 'lucide-react';
import { CompanyConfig, PaymentSystem, CreditInstallment } from '../types';

const PLATFORM_TEMPLATES: Record<string, Partial<PaymentSystem>> = {
    'GALICIA NAVE': {
        name: 'GALICIA NAVE',
        debitSurcharge: 0.8,
        creditInstallments: [
            { id: 'n1', installments: 1, surcharge: 0, label: '1 Pago' },
            { id: 'n3', installments: 3, surcharge: 14.5, label: '3 Cuotas Nave' },
            { id: 'n6', installments: 6, surcharge: 28.2, label: '6 Cuotas Nave' },
            { id: 'n9', installments: 9, surcharge: 42.1, label: '9 Cuotas Nave' },
            { id: 'n12', installments: 12, surcharge: 58.4, label: '12 Cuotas Nave' },
        ]
    },
    'MERCADO PAGO': {
        name: 'MERCADO PAGO',
        debitSurcharge: 3.5,
        creditInstallments: [
            { id: 'm1', installments: 1, surcharge: 0, label: '1 Pago' },
            { id: 'm3', installments: 3, surcharge: 12.0, label: '3 Cuotas MP' },
            { id: 'm6', installments: 6, surcharge: 24.5, label: '6 Cuotas MP' },
        ]
    }
};

const CompanySettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'CARDS'>('GENERAL');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  
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

  const addFromTemplate = (templateKey: string) => {
      const template = PLATFORM_TEMPLATES[templateKey];
      const newSystem: PaymentSystem = {
          id: `sys-${Date.now()}`,
          name: template.name!,
          debitSurcharge: template.debitSurcharge || 0,
          creditInstallments: template.creditInstallments!.map(ci => ({...ci, id: `inst-${Math.random()}`}))
      };

      setFormData(prev => ({
          ...prev,
          paymentSystems: [...(prev.paymentSystems || []), newSystem]
      }));
      setSelectedSystemId(newSystem.id);
      alert(`Plataforma ${templateKey} agregada con esquema de cuotas oficial.`);
  };

  const addManualSystem = () => {
      const name = prompt("Nombre de la plataforma manual:");
      if (!name) return;
      const newSystem: PaymentSystem = {
          id: `sys-${Date.now()}`,
          name: name.toUpperCase(),
          debitSurcharge: 0,
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

  const applyIvaToInterests = (systemId: string) => {
      setIsSyncing(true);
      setTimeout(() => {
          setFormData(prev => ({
              ...prev,
              paymentSystems: prev.paymentSystems?.map(s => {
                  if (s.id === systemId) {
                      return {
                          ...s,
                          creditInstallments: s.creditInstallments.map(inst => {
                              if (inst.installments === 1) return inst;
                              // Coeficiente bancario + 21% de IVA sobre el interes
                              const finalSurcharge = parseFloat((inst.surcharge * 1.21).toFixed(2));
                              return { ...inst, surcharge: finalSurcharge, label: `${inst.installments} Cuotas (Inc. IVA)` };
                          })
                      };
                  }
                  return s;
              })
          }));
          setIsSyncing(false);
          alert("Tasas recalculadas: Se ha sumado el 21% de IVA sobre los intereses para cubrir el costo bancario real.");
      }, 600);
  };

  const currentSystem = formData.paymentSystems?.find(s => s.id === selectedSystemId);

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto space-y-8 animate-fade-in bg-slate-50 pb-20">
        <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm">
            <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase leading-none">Mi Empresa</h2>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-2">Finanzas y Configuración de Cobros</p>
            </div>
            <div className="flex gap-4">
                <div className="flex bg-slate-100 rounded-2xl p-1 shadow-inner">
                    <button onClick={() => setActiveTab('GENERAL')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'GENERAL' ? 'bg-white text-slate-900 shadow-md' : 'text-gray-400'}`}>General</button>
                    <button onClick={() => setActiveTab('CARDS')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'CARDS' ? 'bg-white text-slate-900 shadow-md' : 'text-gray-400'}`}>Intereses y Cuotas</button>
                </div>
                <button onClick={() => alert('Configuración guardada.')} className="bg-slate-900 text-white px-8 py-2 rounded-2xl font-black text-[10px] uppercase shadow-xl flex items-center gap-2 hover:bg-slate-800 transition-all">
                    <Save size={16}/> Guardar Cambios
                </button>
            </div>
        </div>

        {activeTab === 'GENERAL' && (
            <div className="bg-white p-10 rounded-[3rem] border border-gray-200 shadow-sm animate-fade-in space-y-8">
                <div className="flex items-center gap-6 border-b pb-8">
                    <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white relative group overflow-hidden shadow-lg">
                        {formData.logo ? <img src={formData.logo} alt="Logo" className="w-full h-full object-contain" /> : <Building2 size={40} />}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"><Camera size={24} /></div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-2">{formData.name}</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{formData.taxCondition} • CUIT {formData.cuit}</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Nombre de Fantasía</label>
                        <input className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold uppercase outline-none focus:bg-white focus:border-indigo-500 transition-all" value={formData.fantasyName} onChange={e => setFormData({...formData, fantasyName: e.target.value.toUpperCase()})} />
                    </div>
                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">WhatsApp Comercial</label>
                        <input className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:bg-white focus:border-green-500 transition-all" value={formData.whatsappNumber} onChange={e => setFormData({...formData, whatsappNumber: e.target.value})} />
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'CARDS' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                {/* PANEL DE SELECCIÓN */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Sistemas Activos</h3>
                            <button onClick={addManualSystem} className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200"><Plus size={18}/></button>
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

                        <div className="pt-6 border-t space-y-3">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Auto-Sincronizar Esquemas</p>
                            <button onClick={() => addFromTemplate('GALICIA NAVE')} className="w-full py-4 bg-indigo-50 text-indigo-700 rounded-2xl font-black text-[10px] uppercase border border-indigo-100 hover:bg-indigo-100 flex items-center justify-center gap-3">
                                <Landmark size={16}/> Cargar Galicia Nave
                            </button>
                            <button onClick={() => addFromTemplate('MERCADO PAGO')} className="w-full py-4 bg-yellow-50 text-yellow-700 rounded-2xl font-black text-[10px] uppercase border border-yellow-100 hover:bg-yellow-100 flex items-center justify-center gap-3">
                                <Smartphone size={16}/> Cargar Mercado Pago
                            </button>
                        </div>
                    </div>
                </div>

                {/* DETALLE DEL SISTEMA */}
                <div className="lg:col-span-2">
                    {currentSystem ? (
                        <div className="bg-white p-10 rounded-[3rem] border border-gray-200 shadow-sm space-y-8 animate-fade-in">
                            <div className="flex justify-between items-center border-b pb-6">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">{currentSystem.name}</h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Configuración de Cuotas e IVA sobre Interés</p>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => applyIvaToInterests(currentSystem.id)} 
                                        disabled={isSyncing}
                                        className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all flex items-center gap-2 font-black text-[9px] uppercase border border-green-100">
                                        {isSyncing ? <RefreshCw className="animate-spin" size={14}/> : <Calculator size={14}/>}
                                        Sincronizar IVA 21%
                                    </button>
                                    <button onClick={() => deleteSystem(currentSystem.id)} className="p-3 text-red-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={20}/></button>
                                </div>
                            </div>

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

                                    <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100">
                                        <div className="flex gap-4 items-start text-blue-800">
                                            <Info size={24} className="shrink-0"/>
                                            <div>
                                                <h4 className="text-[10px] font-black uppercase mb-1 tracking-widest">Motor de Cálculo</h4>
                                                <p className="text-[10px] font-medium leading-relaxed italic">El botón "Sincronizar IVA 21%" calcula automáticamente el Costo Financiero Total (CFT) sumando el impuesto sobre el interés que te cobra el banco.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Planes de Crédito</label>
                                        <button onClick={() => {
                                            const inst = parseInt(prompt("Cantidad de Cuotas:") || "0");
                                            if(!inst) return;
                                            const sur = parseFloat(prompt("% Recargo Banco (sin IVA):") || "0");
                                            const newPlan = { id: `inst-${Date.now()}`, installments: inst, surcharge: sur, label: `${inst} Cuotas` };
                                            setFormData(prev => ({
                                                ...prev,
                                                paymentSystems: prev.paymentSystems?.map(s => s.id === currentSystem.id ? {...s, creditInstallments: [...s.creditInstallments, newPlan]} : s)
                                            }));
                                        }} className="text-indigo-600 font-black text-[10px] uppercase hover:underline">+ Añadir Cuota</button>
                                    </div>
                                    <div className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-900 text-white text-[9px] font-black uppercase">
                                                <tr>
                                                    <th className="px-5 py-4">Planes</th>
                                                    <th className="px-5 py-4 text-right">Recargo %</th>
                                                    <th className="px-5 py-4"></th>
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
                                                            }} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
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
                            <p className="font-black uppercase tracking-[0.2em] text-[10px]">Selecciona o Carga una plataforma para editar cuotas</p>
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

export default CompanySettings;
