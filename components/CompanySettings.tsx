
import React, { useState, useEffect } from 'react';
import { 
    Save, Building2, CreditCard, Plus, Trash2, CheckCircle, 
    X, Edit2, RefreshCw, Camera,
    Percent, CreditCard as CardIcon, Zap, ChevronRight, Info,
    Calculator
} from 'lucide-react';
import { CompanyConfig, PaymentSystem, CreditInstallment } from '../types';

const CompanySettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'CARDS'>('GENERAL');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  
  // Inicialización ultra-segura para garantizar que paymentSystems siempre sea un array
  const [formData, setFormData] = useState<CompanyConfig>(() => {
      const saved = localStorage.getItem('company_config');
      const defaultData: CompanyConfig = {
          name: 'FERRETERIA BRUZZONE S.A.',
          fantasyName: 'Ferreteria Bruzzone',
          cuit: '30-12345678-9',
          taxCondition: 'Responsable Inscripto',
          iibb: '',
          startDate: '',
          address: '',
          city: '',
          zipCode: '',
          phone: '',
          email: '',
          web: '',
          logo: null,
          slogan: '',
          whatsappNumber: '',
          defaultProfitMargin: 30,
          paymentAccounts: [],
          paymentMethods: ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CTACTE'],
          paymentSystems: []
      };

      if (saved) {
          try {
              const parsed = JSON.parse(saved);
              // Forzamos que paymentSystems sea un array si no existe o es incorrecto
              return { 
                  ...defaultData, 
                  ...parsed, 
                  paymentSystems: Array.isArray(parsed.paymentSystems) ? parsed.paymentSystems : [] 
              };
          } catch (e) {
              return defaultData;
          }
      }
      return defaultData;
  });

  useEffect(() => {
      localStorage.setItem('company_config', JSON.stringify(formData));
      // Notificar a toda la aplicación del cambio
      window.dispatchEvent(new Event('company_config_updated'));
      window.dispatchEvent(new Event('storage'));
  }, [formData]);

  const addPaymentSystem = (e: React.MouseEvent) => {
      e.preventDefault();
      const name = prompt("Nombre de la plataforma (ej: Mercado Pago, Galicia Nave, Fiserv):");
      if (!name || name.trim() === "") return;
      
      const newSystem: PaymentSystem = {
          id: `sys-${Date.now()}`,
          name: name.toUpperCase().trim(),
          debitSurcharge: 0,
          creditInstallments: [
              { id: `inst-${Date.now()}`, installments: 1, surcharge: 0, label: '1 Pago' }
          ]
      };

      setFormData(prev => {
          const currentSystems = Array.isArray(prev.paymentSystems) ? prev.paymentSystems : [];
          return {
              ...prev,
              paymentSystems: [...currentSystems, newSystem]
          };
      });
      
      setSelectedSystemId(newSystem.id);
      alert(`Plataforma "${name.toUpperCase()}" agregada correctamente.`);
  };

  const deleteSystem = (id: string) => {
      if (confirm("¿Seguro desea eliminar esta plataforma de cobro?")) {
          setFormData(prev => ({
              ...prev,
              paymentSystems: (prev.paymentSystems || []).filter(s => s.id !== id)
          }));
          if (selectedSystemId === id) setSelectedSystemId(null);
      }
  };

  const syncAndApplyTaxes = (systemId: string) => {
      setIsSyncing(true);
      setTimeout(() => {
          setFormData(prev => ({
              ...prev,
              paymentSystems: (prev.paymentSystems || []).map(s => {
                  if (s.id === systemId) {
                      const updatedInstallments = s.creditInstallments.map(inst => {
                          if (inst.installments === 1) return inst;
                          // Cálculo real: Si el banco cobra X, sumamos 21% de IVA sobre el interés para el cliente
                          const cftReal = parseFloat((inst.surcharge * 1.21).toFixed(2));
                          return { ...inst, surcharge: cftReal, label: `${inst.installments} Cuotas (Costo Real)` };
                      });
                      return { ...s, creditInstallments: updatedInstallments };
                  }
                  return s;
              })
          }));
          setIsSyncing(false);
          alert("Tasas actualizadas: Se ha aplicado el 21% de IVA sobre los intereses bancarios.");
      }, 800);
  };

  const handleSave = () => {
      setIsLoading(true);
      setTimeout(() => {
          setIsLoading(false);
          alert('Configuración guardada con éxito.');
      }, 500);
  };

  const currentSystem = (formData.paymentSystems || []).find(s => s.id === selectedSystemId);

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto space-y-8 animate-fade-in bg-slate-50 pb-20">
        <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm">
            <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase leading-none">Mi Empresa</h2>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-2">Configuración fiscal y financiera</p>
            </div>
            <div className="flex gap-4">
                <div className="flex bg-slate-100 rounded-2xl p-1 shadow-inner">
                    <button type="button" onClick={() => setActiveTab('GENERAL')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'GENERAL' ? 'bg-white text-slate-900 shadow-md' : 'text-gray-400'}`}>General</button>
                    <button type="button" onClick={() => setActiveTab('CARDS')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'CARDS' ? 'bg-white text-slate-900 shadow-md' : 'text-gray-400'}`}>Intereses y Cuotas</button>
                </div>
                <button type="button" onClick={handleSave} className="bg-slate-900 text-white px-8 py-2 rounded-2xl font-black text-[10px] uppercase shadow-xl flex items-center gap-2 hover:bg-slate-800 transition-all">
                    <Save size={16}/> {isLoading ? 'Procesando...' : 'Guardar Cambios'}
                </button>
            </div>
        </div>

        {activeTab === 'GENERAL' && (
            <div className="bg-white p-10 rounded-[3rem] border border-gray-200 shadow-sm animate-fade-in space-y-8">
                <div className="flex items-center gap-6 border-b pb-8">
                    <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white relative group overflow-hidden shadow-lg">
                        {formData.logo ? (
                            <img src={formData.logo} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                            <Building2 size={40} />
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                            <Camera size={24} />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none mb-2">{formData.name}</h3>
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
                {/* LISTADO DE PLATAFORMAS */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm flex flex-col min-h-[400px]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Plataformas de Cobro</h3>
                            <button 
                                type="button" 
                                onClick={addPaymentSystem} 
                                className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg active:scale-95"
                                title="Agregar nueva plataforma"
                            >
                                <Plus size={20}/>
                            </button>
                        </div>
                        <div className="space-y-2 flex-1">
                            {(formData.paymentSystems || []).map(sys => (
                                <button 
                                    key={sys.id}
                                    type="button"
                                    onClick={() => setSelectedSystemId(sys.id)}
                                    className={`w-full p-4 rounded-2xl border-2 flex justify-between items-center transition-all ${selectedSystemId === sys.id ? 'border-indigo-600 bg-indigo-50/50 shadow-md' : 'border-slate-50 bg-white hover:border-slate-200'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${selectedSystemId === sys.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}><Zap size={16}/></div>
                                        <span className="font-black text-[11px] uppercase text-slate-700">{sys.name}</span>
                                    </div>
                                    <ChevronRight size={16} className={selectedSystemId === sys.id ? 'text-indigo-600' : 'text-slate-300'}/>
                                </button>
                            ))}
                            {(formData.paymentSystems || []).length === 0 && (
                                <div className="py-20 text-center flex flex-col items-center justify-center opacity-30">
                                    <CardIcon size={48} strokeWidth={1} className="mb-2"/>
                                    <p className="text-[10px] font-black uppercase tracking-widest">Haz clic en el (+) para agregar</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* DETALLE DE INTERESES */}
                <div className="lg:col-span-2">
                    {currentSystem ? (
                        <div className="bg-white p-10 rounded-[3rem] border border-gray-200 shadow-sm space-y-8 animate-fade-in">
                            <div className="flex justify-between items-center border-b pb-6">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">{currentSystem.name}</h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Configuración de recargos finales al cliente</p>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        type="button"
                                        onClick={() => syncAndApplyTaxes(currentSystem.id)} 
                                        disabled={isSyncing}
                                        className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all flex items-center gap-2 font-black text-[9px] uppercase tracking-widest border border-green-100 shadow-sm">
                                        {isSyncing ? <RefreshCw className="animate-spin" size={14}/> : <Calculator size={14}/>}
                                        Cálculo Fiscal (CFT)
                                    </button>
                                    <button type="button" onClick={() => deleteSystem(currentSystem.id)} className="p-3 text-red-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={20}/></button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Recargo en Débito (%)</label>
                                        <div className="flex items-center gap-3">
                                            <input 
                                                type="number" 
                                                className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-black text-2xl shadow-inner"
                                                value={currentSystem.debitSurcharge}
                                                onChange={e => {
                                                    const val = parseFloat(e.target.value) || 0;
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        paymentSystems: (prev.paymentSystems || []).map(s => s.id === currentSystem.id ? {...s, debitSurcharge: val} : s)
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
                                                <h4 className="text-[10px] font-black uppercase mb-1">Nota del Motor Financiero</h4>
                                                <p className="text-[10px] font-medium leading-relaxed italic">El sistema aplica los recargos sobre el total neto del POS. Asegúrese de incluir impuestos bancarios en estos coeficientes.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Planes de Crédito</label>
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                const inst = parseInt(prompt("Cantidad de Cuotas:") || "0");
                                                if(!inst) return;
                                                const sur = parseFloat(prompt("% de Recargo total para el cliente:") || "0");
                                                const newPlan = { id: `inst-${Date.now()}`, installments: inst, surcharge: sur, label: `${inst} Cuotas` };
                                                setFormData(prev => ({
                                                    ...prev,
                                                    paymentSystems: (prev.paymentSystems || []).map(s => s.id === currentSystem.id ? {...s, creditInstallments: [...s.creditInstallments, newPlan]} : s)
                                                }));
                                            }} className="text-indigo-600 font-black text-[10px] uppercase hover:underline">+ Añadir Cuotas</button>
                                    </div>
                                    <div className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-900 text-white text-[9px] font-black uppercase">
                                                <tr>
                                                    <th className="px-5 py-4">Descripción</th>
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
                                                                className="w-20 bg-slate-100 border-none rounded-lg p-2 text-right font-black text-xs text-indigo-600 focus:ring-1 focus:ring-indigo-500"
                                                                value={plan.surcharge}
                                                                onChange={e => {
                                                                    const val = parseFloat(e.target.value) || 0;
                                                                    const newInst = [...currentSystem.creditInstallments];
                                                                    newInst[idx].surcharge = val;
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        paymentSystems: (prev.paymentSystems || []).map(s => s.id === currentSystem.id ? {...s, creditInstallments: newInst} : s)
                                                                    }));
                                                                }}
                                                            />
                                                        </td>
                                                        <td className="px-5 py-4 text-right">
                                                            <button type="button" onClick={() => {
                                                                const newInst = currentSystem.creditInstallments.filter(i => i.id !== plan.id);
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    paymentSystems: (prev.paymentSystems || []).map(s => s.id === currentSystem.id ? {...s, creditInstallments: newInst} : s)
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
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                <CardIcon size={48} strokeWidth={1} className="mb-2"/>
                            </div>
                            <p className="font-black uppercase tracking-[0.2em] text-[10px]">Seleccioná una plataforma para editar recargos</p>
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

export default CompanySettings;
