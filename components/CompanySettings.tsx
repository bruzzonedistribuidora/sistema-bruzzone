
import React, { useState, useEffect, useRef } from 'react';
import { 
    Save, Building2, CreditCard, Plus, Trash2, CheckCircle, 
    X, Landmark, Smartphone, Edit2, RefreshCw, Camera,
    Percent, ListPlus, CreditCard as CardIcon, Zap, ChevronRight, Info,
    ArrowDownToLine, Calculator
} from 'lucide-react';
import { CompanyConfig, PaymentSystem, CreditInstallment } from '../types';

const CompanySettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'PAYMENTS' | 'CARDS' | 'WHATSAPP'>('GENERAL');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CompanyConfig>(() => {
      const saved = localStorage.getItem('company_config');
      const config = saved ? JSON.parse(saved) : {
          name: 'FERRETERIA BRUZZONE S.A.',
          fantasyName: 'Ferreteria Bruzzone',
          cuit: '30-12345678-9',
          taxCondition: 'Responsable Inscripto',
          paymentMethods: ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CTACTE'],
          paymentSystems: []
      };
      if (!config.paymentSystems) config.paymentSystems = [];
      return config;
  });

  useEffect(() => {
      localStorage.setItem('company_config', JSON.stringify(formData));
      window.dispatchEvent(new Event('company_config_updated'));
  }, [formData]);

  const addPaymentSystem = () => {
      const name = prompt("Nombre de la plataforma (ej: Mercado Pago, Fiserv, Nave):");
      if (!name) return;
      
      const newSystem: PaymentSystem = {
          id: `sys-${Date.now()}`,
          name: name.toUpperCase(),
          debitSurcharge: 0,
          creditInstallments: [
              { id: `inst-${Date.now()}`, installments: 1, surcharge: 0, label: '1 Pago' }
          ]
      };

      setFormData(prev => ({
          ...prev,
          paymentSystems: [...(prev.paymentSystems || []), newSystem]
      }));
      setSelectedSystemId(newSystem.id);
  };

  const deleteSystem = (id: string) => {
      if (confirm("¿Seguro desea eliminar esta plataforma de cobro?")) {
          setFormData(prev => ({
              ...prev,
              paymentSystems: prev.paymentSystems?.filter(s => s.id !== id) || []
          }));
          if (selectedSystemId === id) setSelectedSystemId(null);
      }
  };

  const syncAndApplyTaxes = (systemId: string) => {
      setIsSyncing(true);
      // Simula el cálculo de CFT (Costo Financiero Total) sumando el 21% de IVA sobre el interés bancario
      setTimeout(() => {
          setFormData(prev => ({
              ...prev,
              paymentSystems: prev.paymentSystems?.map(s => {
                  if (s.id === systemId) {
                      const updatedInstallments = s.creditInstallments.map(inst => {
                          if (inst.installments === 1) return inst;
                          // Cálculo real: Si el banco cobra 15%, el cliente debe pagar 15 * 1.21 = 18.15% para que recibas el 100% neto
                          const cftReal = parseFloat((inst.surcharge * 1.21).toFixed(2));
                          return { ...inst, surcharge: cftReal, label: `${inst.installments} Cuotas (CFT Inc.)` };
                      });
                      return { ...s, creditInstallments: updatedInstallments };
                  }
                  return s;
              }) || []
          }));
          setIsSyncing(false);
          alert("Tasas actualizadas: Se ha aplicado el 21% de IVA sobre los intereses para obtener el CFT final.");
      }, 1000);
  };

  const handleSave = () => {
      setIsLoading(true);
      setTimeout(() => {
          setIsLoading(false);
          alert('Cambios aplicados correctamente.');
      }, 500);
  };

  const currentSystem = formData.paymentSystems?.find(s => s.id === selectedSystemId);

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto space-y-8 animate-fade-in bg-slate-50 pb-20">
        <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm">
            <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Configuración del Sistema</h2>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Gestión integral de finanzas y empresa</p>
            </div>
            <div className="flex gap-4">
                <div className="flex bg-slate-100 rounded-2xl p-1 shadow-inner">
                    <button onClick={() => setActiveTab('GENERAL')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'GENERAL' ? 'bg-white text-slate-900 shadow-md' : 'text-gray-400'}`}>Mi Empresa</button>
                    <button onClick={() => setActiveTab('CARDS')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'CARDS' ? 'bg-white text-slate-900 shadow-md' : 'text-gray-400'}`}>Intereses / Tarjetas</button>
                </div>
                <button onClick={handleSave} className="bg-slate-900 text-white px-8 py-2 rounded-2xl font-black text-[10px] uppercase shadow-xl flex items-center gap-2 hover:bg-slate-800 transition-all">
                    <Save size={16}/> {isLoading ? 'Procesando...' : 'Guardar Configuración'}
                </button>
            </div>
        </div>

        {activeTab === 'CARDS' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                {/* LISTA DE PLATAFORMAS */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Sistemas de Cobro</h3>
                            <button onClick={addPaymentSystem} className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"><Plus size={18}/></button>
                        </div>
                        <div className="space-y-2 flex-1 min-h-[200px]">
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
                            {formData.paymentSystems?.length === 0 && (
                                <p className="text-center text-gray-300 py-10 font-bold uppercase text-[10px]">No hay sistemas agregados</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* EDITOR DE TASAS */}
                <div className="lg:col-span-2">
                    {currentSystem ? (
                        <div className="bg-white p-10 rounded-[3rem] border border-gray-200 shadow-sm space-y-8 animate-fade-in">
                            <div className="flex justify-between items-center border-b pb-6">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">{currentSystem.name}</h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Gestión de recargos finales al cliente</p>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => syncAndApplyTaxes(currentSystem.id)} 
                                        disabled={isSyncing}
                                        title="Aplica +21% de IVA sobre las tasas actuales para obtener el recargo real"
                                        className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all flex items-center gap-2 font-black text-[9px] uppercase tracking-widest border border-green-100">
                                        {isSyncing ? <RefreshCw className="animate-spin" size={14}/> : <Calculator size={14}/>}
                                        Aplicar IVA a Tasas
                                    </button>
                                    <button onClick={() => deleteSystem(currentSystem.id)} className="p-3 text-red-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={20}/></button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Recargo en Débito (%)</label>
                                        <div className="flex items-center gap-3">
                                            <input 
                                                type="number" 
                                                className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-green-500 outline-none font-black text-2xl"
                                                value={currentSystem.debitSurcharge}
                                                onChange={e => {
                                                    const val = parseFloat(e.target.value) || 0;
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        paymentSystems: prev.paymentSystems?.map(s => s.id === currentSystem.id ? {...s, debitSurcharge: val} : s) || []
                                                    }));
                                                }}
                                            />
                                            <Percent size={24} className="text-slate-300"/>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100">
                                        <div className="flex gap-4 items-start text-amber-800">
                                            <Info size={24} className="shrink-0"/>
                                            <div>
                                                <h4 className="text-[10px] font-black uppercase mb-1">Nota Fiscal</h4>
                                                <p className="text-[10px] font-medium leading-relaxed italic">Recordá que los bancos suelen informarte la tasa sin IVA. El sistema te permite sumar el impuesto automáticamente para no perder margen.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Planes de Crédito</label>
                                        <button onClick={() => {
                                            const inst = parseInt(prompt("Cantidad de Cuotas:") || "0");
                                            if(!inst) return;
                                            const sur = parseFloat(prompt("% de Recargo Base (del banco):") || "0");
                                            const newPlan = { id: `inst-${Date.now()}`, installments: inst, surcharge: sur, label: `${inst} Cuotas` };
                                            setFormData(prev => ({
                                                ...prev,
                                                paymentSystems: prev.paymentSystems?.map(s => s.id === currentSystem.id ? {...s, creditInstallments: [...s.creditInstallments, newPlan]} : s) || []
                                            }));
                                        }} className="text-indigo-600 font-black text-[10px] uppercase hover:underline">+ Agregar Plan</button>
                                    </div>
                                    <div className="border border-slate-100 rounded-3xl overflow-hidden shadow-inner">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-900 text-white text-[9px] font-black uppercase">
                                                <tr>
                                                    <th className="px-5 py-4">Cuotas</th>
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
                                                                        paymentSystems: prev.paymentSystems?.map(s => s.id === currentSystem.id ? {...s, creditInstallments: newInst} : s) || []
                                                                    }));
                                                                }}
                                                            />
                                                        </td>
                                                        <td className="px-5 py-4 text-right">
                                                            <button onClick={() => {
                                                                const newInst = currentSystem.creditInstallments.filter(i => i.id !== plan.id);
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    paymentSystems: prev.paymentSystems?.map(s => s.id === currentSystem.id ? {...s, creditInstallments: newInst} : s) || []
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
                                <CardIcon size={48} className="opacity-20"/>
                            </div>
                            <p className="font-black uppercase tracking-[0.2em] text-[10px]">Seleccioná un sistema para editar tasas</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {activeTab === 'GENERAL' && (
            <div className="bg-white p-10 rounded-[3rem] border border-gray-200 shadow-sm animate-fade-in space-y-8">
                <div className="flex items-center gap-6 border-b pb-8">
                    <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white relative group overflow-hidden">
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
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Nombre de Fantasía</label>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold uppercase outline-none focus:ring-2 focus:ring-indigo-500" value={formData.fantasyName} onChange={e => setFormData({...formData, fantasyName: e.target.value.toUpperCase()})} />
                    </div>
                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">WhatsApp Comercial</label>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-green-500" value={formData.whatsappNumber} onChange={e => setFormData({...formData, whatsappNumber: e.target.value})} />
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default CompanySettings;
