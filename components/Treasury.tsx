
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Wallet, ArrowUpRight, ArrowDownLeft, ArrowRightLeft, CreditCard, 
    Banknote, DollarSign, Calendar, Lock, CheckCircle, FileText, 
    Plus, X, Save, Calculator, AlertTriangle, QrCode, Scroll, 
    Smartphone, Search, Filter, History, Truck, MoreVertical, 
    ArrowDownRight, Landmark, Receipt, Info, LogOut, LogIn, Download,
    RotateCcw, Send, Building, LockKeyhole, Unlock, CheckCircle2, XCircle,
    Printer
} from 'lucide-react';
import { CashRegister, Check, TreasuryMovement } from '../types';

const Treasury: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'CAJAS' | 'MOVIMIENTOS' | 'CHEQUES' | 'BANCOS'>('CAJAS');
  
  const [registers, setRegisters] = useState<CashRegister[]>(() => {
    const saved = localStorage.getItem('ferrecloud_registers');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Caja Mostrador Principal', balance: 154200, isOpen: true },
      { id: '2', name: 'Caja Administración', balance: 45000, isOpen: true },
      { id: '3', name: 'Caja Sucursal Norte', balance: 12000, isOpen: false },
    ];
  });

  const [movements, setMovements] = useState<TreasuryMovement[]>(() => {
    const saved = localStorage.getItem('ferrecloud_treasury_movements');
    return saved ? JSON.parse(saved) : [];
  });

  const [checks, setChecks] = useState<Check[]>(() => {
      const saved = localStorage.getItem('ferrecloud_checks');
      return saved ? JSON.parse(saved) : [];
  });

  // Modal y Estados de Visualización
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [selectedRegisterForHistory, setSelectedRegisterForHistory] = useState<CashRegister | null>(null);
  const [manualForm, setManualForm] = useState<Partial<TreasuryMovement>>({
      type: 'INCOME', subtype: 'GASTO_VARIO', paymentMethod: 'EFECTIVO', amount: 0, description: '', cashRegisterId: '1'
  });

  useEffect(() => {
    localStorage.setItem('ferrecloud_registers', JSON.stringify(registers));
    localStorage.setItem('ferrecloud_treasury_movements', JSON.stringify(movements));
    localStorage.setItem('ferrecloud_checks', JSON.stringify(checks));
  }, [registers, movements, checks]);

  // Lógica mejorada de Apertura/Cierre
  const toggleRegisterStatus = (id: string) => {
      const reg = registers.find(r => r.id === id);
      if (!reg) return;

      const action = reg.isOpen ? 'CIERRE' : 'APERTURA';
      if (!confirm(`¿Confirmar ${action} de ${reg.name}?`)) return;

      setRegisters(prev => prev.map(r => {
          if (r.id === id) {
              const newState = !r.isOpen;
              // Registrar evento en el log de movimientos para trazabilidad
              const auditEvent: TreasuryMovement = {
                  id: `LOG-${Date.now()}`,
                  date: new Date().toLocaleString(),
                  type: 'INCOME', // No afecta saldo real
                  subtype: 'GASTO_VARIO',
                  paymentMethod: 'EFECTIVO',
                  amount: 0,
                  description: `*** ${action} DE CAJA - SALDO: $${r.balance.toLocaleString()} ***`,
                  cashRegisterId: r.id
              };
              setMovements(m => [auditEvent, ...m]);
              return { ...r, isOpen: newState };
          }
          return r;
      }));
  };

  const handleAddMovement = () => {
      if (!manualForm.amount || !manualForm.description || !manualForm.cashRegisterId) {
          alert("Faltan datos obligatorios.");
          return;
      }

      const reg = registers.find(r => r.id === manualForm.cashRegisterId);
      if (!reg?.isOpen) {
          alert("Error: La caja seleccionada se encuentra CERRADA. Debe abrirla para operar.");
          return;
      }

      const newMov: TreasuryMovement = {
          ...manualForm as TreasuryMovement,
          id: `M-${Date.now()}`,
          date: new Date().toLocaleString()
      };

      setMovements([newMov, ...movements]);
      setRegisters(prev => prev.map(r => {
          if (r.id === manualForm.cashRegisterId) {
              const impact = newMov.type === 'INCOME' ? newMov.amount : -newMov.amount;
              return { ...r, balance: r.balance + impact };
          }
          return r;
      }));
      setIsManualEntryOpen(false);
      setManualForm({ ...manualForm, amount: 0, description: '' });
  };

  const registerMovements = useMemo(() => {
      if (!selectedRegisterForHistory) return [];
      return movements.filter(m => m.cashRegisterId === selectedRegisterForHistory.id);
  }, [movements, selectedRegisterForHistory]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 h-full flex flex-col bg-slate-50 overflow-hidden font-sans">
      
      <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] border border-gray-200 shadow-sm shrink-0">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
              <Wallet className="text-indigo-600"/> Tesorería y Fondos
          </h2>
          <p className="text-gray-400 text-xs font-black uppercase tracking-widest mt-1 italic">Control de Efectivo, Valores y Arqueos</p>
        </div>
        <div className="flex bg-slate-100 rounded-2xl p-1 shadow-inner">
            <button onClick={() => setActiveTab('CAJAS')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest ${activeTab === 'CAJAS' ? 'bg-white text-slate-900 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>Puntos de Efectivo</button>
            <button onClick={() => setActiveTab('CHEQUES')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest ${activeTab === 'CHEQUES' ? 'bg-white text-slate-900 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>Cartera Valores</button>
            <button onClick={() => setActiveTab('MOVIMIENTOS')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest ${activeTab === 'MOVIMIENTOS' ? 'bg-white text-slate-900 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>Libro Diario</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
          
          {activeTab === 'CAJAS' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in pb-10">
                  {registers.map(reg => (
                      <div key={reg.id} className={`bg-white rounded-[2.5rem] p-8 border transition-all duration-300 relative group flex flex-col ${reg.isOpen ? 'border-gray-200 shadow-sm' : 'border-red-100 bg-red-50/20 grayscale-[0.3]'}`}>
                          <div className="flex justify-between items-start mb-8">
                              <div className={`p-4 rounded-3xl transition-all ${reg.isOpen ? 'bg-indigo-50 text-indigo-600 shadow-lg shadow-indigo-100' : 'bg-red-100 text-red-600'}`}>
                                  {reg.isOpen ? <Unlock size={28}/> : <LockKeyhole size={28}/>}
                              </div>
                              <div className="text-right">
                                  <h4 className="font-black text-slate-800 uppercase tracking-tight text-lg leading-none mb-1.5">{reg.name}</h4>
                                  <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border ${reg.isOpen ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                      {reg.isOpen ? 'OPERATIVA' : 'CERRADA'}
                                  </span>
                              </div>
                          </div>
                          
                          <div className="mb-10">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Saldo en Caja</p>
                              <p className={`text-4xl font-black tracking-tighter ${reg.isOpen ? 'text-slate-900' : 'text-slate-400'}`}>
                                  ${reg.balance.toLocaleString('es-AR')}
                              </p>
                          </div>

                          <div className="mt-auto grid grid-cols-2 gap-3">
                              <button 
                                  onClick={() => { setManualForm({...manualForm, cashRegisterId: reg.id}); setIsManualEntryOpen(true); }}
                                  disabled={!reg.isOpen}
                                  className={`py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${reg.isOpen ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}>
                                  <Plus size={14}/> Movimiento
                              </button>
                              <button 
                                onClick={() => setSelectedRegisterForHistory(reg)}
                                className="bg-slate-100 text-slate-500 hover:bg-white hover:text-indigo-600 border border-slate-200 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                                  <History size={16}/> Historial
                              </button>
                          </div>

                          <button 
                            onClick={() => toggleRegisterStatus(reg.id)}
                            className={`mt-4 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${reg.isOpen ? 'text-red-400 border-red-100 hover:bg-red-50' : 'text-green-600 border-green-200 bg-green-50 hover:bg-green-100'}`}>
                              {reg.isOpen ? <><XCircle size={14}/> Realizar Arqueo y Cerrar</> : <><CheckCircle2 size={14}/> Abrir Punto de Venta</>}
                          </button>
                      </div>
                  ))}
              </div>
          )}

          {activeTab === 'MOVIMIENTOS' && (
              <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden animate-fade-in flex flex-col flex-1 min-h-[500px]">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
                      <h3 className="font-black text-slate-800 uppercase tracking-tighter">Libro de Caja Unificado</h3>
                      <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border border-indigo-100 px-4 py-2 rounded-xl hover:bg-indigo-50 transition-all flex items-center gap-2">
                          <Download size={14}/> Excel / CSV
                      </button>
                  </div>
                  <div className="overflow-x-auto">
                      <table className="w-full text-left">
                          <thead className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.2em] sticky top-0">
                              <tr>
                                  <th className="px-8 py-5">Fecha / Auditoría</th>
                                  <th className="px-8 py-5">Caja</th>
                                  <th className="px-8 py-5">Concepto</th>
                                  <th className="px-8 py-5">Medio</th>
                                  <th className="px-8 py-5 text-right">Monto</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {movements.length === 0 ? (
                                  <tr><td colSpan={5} className="py-32 text-center text-slate-300 font-black uppercase tracking-widest">No se registran movimientos en el período</td></tr>
                              ) : movements.map(m => (
                                  <tr key={m.id} className={`hover:bg-slate-50 transition-colors ${m.description.includes('***') ? 'bg-slate-50/50 italic' : ''}`}>
                                      <td className="px-8 py-5 text-[11px] font-bold text-slate-400">{m.date}</td>
                                      <td className="px-8 py-5">
                                          <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-lg uppercase">
                                              {registers.find(r => r.id === m.cashRegisterId)?.name || 'S/D'}
                                          </span>
                                      </td>
                                      <td className="px-8 py-5 font-black text-slate-800 uppercase text-[11px] tracking-tight">{m.description}</td>
                                      <td className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase">{m.paymentMethod}</td>
                                      <td className={`px-8 py-5 text-right font-black text-lg tracking-tighter ${m.amount === 0 ? 'text-slate-300' : m.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                                          {m.amount === 0 ? '-' : (m.type === 'INCOME' ? '+' : '-') + '$' + m.amount.toLocaleString('es-AR')}
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}
      </div>

      {/* MODAL: MOVIMIENTO MANUAL */}
      {isManualEntryOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                  <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg"><ArrowRightLeft size={24}/></div>
                          <div>
                              <h3 className="font-black uppercase tracking-tighter text-xl">Nueva Operación</h3>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ingreso / Egreso a Caja</p>
                          </div>
                      </div>
                      <button onClick={() => setIsManualEntryOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28}/></button>
                  </div>
                  <div className="p-10 space-y-8 bg-slate-50/50">
                      <div className="grid grid-cols-2 gap-4">
                          <button onClick={() => setManualForm({...manualForm, type: 'INCOME'})} className={`py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${manualForm.type === 'INCOME' ? 'border-green-600 bg-green-50 text-green-700 shadow-md shadow-green-100' : 'border-gray-200 bg-white text-gray-400'}`}>Ingreso (+)</button>
                          <button onClick={() => setManualForm({...manualForm, type: 'EXPENSE'})} className={`py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${manualForm.type === 'EXPENSE' ? 'border-red-600 bg-red-50 text-red-700 shadow-md shadow-red-100' : 'border-gray-200 bg-white text-gray-400'}`}>Egreso (-)</button>
                      </div>
                      <div className="space-y-4">
                          <div>
                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-2">Detalle de la Operación</label>
                              <input type="text" className="w-full p-4 bg-white border border-gray-200 rounded-2xl outline-none font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all uppercase" placeholder="Ej: Pago Flete, Venta Mostrador..." value={manualForm.description} onChange={e => setManualForm({...manualForm, description: e.target.value.toUpperCase()})} />
                          </div>
                          <div>
                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-2">Importe Final ($)</label>
                              <input type="number" className="w-full p-5 bg-white border border-gray-200 rounded-3xl outline-none font-black text-3xl text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all" value={manualForm.amount || ''} onChange={e => setManualForm({...manualForm, amount: parseFloat(e.target.value) || 0})} placeholder="0.00" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Caja</label>
                                  <select className="w-full p-3 bg-white border border-gray-200 rounded-xl font-black text-xs outline-none" value={manualForm.cashRegisterId} onChange={e => setManualForm({...manualForm, cashRegisterId: e.target.value})}>
                                      {registers.map(r => <option key={r.id} value={r.id} disabled={!r.isOpen}>{r.name} {!r.isOpen ? '(CERRADA)' : ''}</option>)}
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Medio</label>
                                  <select className="w-full p-3 bg-white border border-gray-200 rounded-xl font-black text-xs outline-none" value={manualForm.paymentMethod} onChange={e => setManualForm({...manualForm, paymentMethod: e.target.value as any})}>
                                      <option value="EFECTIVO">Efectivo</option>
                                      <option value="TRANSFERENCIA">Transferencia</option>
                                      <option value="MERCADO_PAGO">Mercado Pago</option>
                                  </select>
                              </div>
                          </div>
                      </div>
                      <button onClick={handleAddMovement} className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all active:scale-95">Validar y Registrar</button>
                  </div>
              </div>
          </div>
      )}

      {/* DRAWER: HISTORIAL DETALLADO POR CAJA */}
      {selectedRegisterForHistory && (
          <div className="fixed inset-0 z-[250] flex justify-end bg-slate-950/70 backdrop-blur-sm animate-fade-in">
              <div className="bg-white h-full w-full max-w-2xl shadow-2xl flex flex-col animate-slide-in-right">
                  <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-6">
                          <div className="w-16 h-16 bg-white/10 rounded-[1.8rem] flex items-center justify-center text-white shadow-xl">
                              <History size={32}/>
                          </div>
                          <div>
                              <h3 className="text-2xl font-black uppercase tracking-tighter">{selectedRegisterForHistory.name}</h3>
                              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Historial de Operaciones Localizadas</p>
                          </div>
                      </div>
                      <button onClick={() => setSelectedRegisterForHistory(null)} className="p-3 hover:bg-white/10 rounded-2xl transition-all"><X size={32}/></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50 custom-scrollbar space-y-8">
                      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between">
                          <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Saldo en este Punto</p>
                              <p className="text-4xl font-black text-slate-900 tracking-tighter">${selectedRegisterForHistory.balance.toLocaleString('es-AR')}</p>
                          </div>
                          <div className={`px-4 py-2 rounded-2xl border font-black text-[10px] uppercase tracking-widest ${selectedRegisterForHistory.isOpen ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                              {selectedRegisterForHistory.isOpen ? 'OPERATIVA' : 'CERRADA'}
                          </div>
                      </div>

                      <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                          <div className="p-6 border-b border-gray-100 bg-slate-50/50">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Scroll size={14}/> Movimientos del Punto</h4>
                          </div>
                          <div className="overflow-x-auto">
                              <table className="w-full text-left">
                                  <thead className="bg-white text-[9px] font-black text-gray-400 uppercase tracking-widest border-b">
                                      <tr>
                                          <th className="px-6 py-4">Fecha</th>
                                          <th className="px-6 py-4">Detalle</th>
                                          <th className="px-6 py-4 text-right">Monto</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-50 text-[11px]">
                                      {registerMovements.length === 0 ? (
                                          <tr><td colSpan={3} className="py-20 text-center text-gray-300 font-black uppercase">Sin registros en este punto de efectivo</td></tr>
                                      ) : registerMovements.map(m => (
                                          <tr key={m.id} className={`hover:bg-slate-50 transition-colors ${m.description.includes('***') ? 'bg-slate-50 italic' : ''}`}>
                                              <td className="px-6 py-4 font-bold text-gray-400">{m.date.split(',')[1] || m.date}</td>
                                              <td className="px-6 py-4 font-black text-slate-700 uppercase">{m.description}</td>
                                              <td className={`px-6 py-4 text-right font-black ${m.amount === 0 ? 'text-slate-300' : m.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                                                  {m.amount === 0 ? '-' : (m.type === 'INCOME' ? '+' : '-') + '$' + m.amount.toLocaleString('es-AR')}
                                              </td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  </div>
                  
                  <div className="p-8 border-t border-gray-100 bg-white">
                      <button onClick={() => window.print()} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
                          <Printer size={18}/> Imprimir Arqueo de Punto
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Treasury;
