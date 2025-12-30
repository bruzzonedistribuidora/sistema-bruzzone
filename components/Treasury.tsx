
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Wallet, ArrowUpRight, ArrowDownLeft, ArrowRightLeft, CreditCard, 
    Banknote, DollarSign, Calendar, Lock, CheckCircle, FileText, 
    Plus, X, Save, Calculator, AlertTriangle, QrCode, Scroll, 
    Smartphone, Search, Filter, History, Truck, MoreVertical, 
    ArrowDownRight, Landmark, Receipt, Info, LogOut, LogIn, Download,
    RotateCcw, Send, Building, LockKeyhole, Unlock, CheckCircle2, XCircle,
    Printer, Smartphone as ECheqIcon, ShieldCheck, Trash2
} from 'lucide-react';
import { CashRegister, Check, TreasuryMovement } from '../types';

const Treasury: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'CAJAS' | 'MOVIMIENTOS' | 'CHEQUES'>('CAJAS');
  
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
      return saved ? JSON.parse(saved) : [
          { id: '1', number: '0012458', bank: 'Galicia', issuer: 'Juan Perez', amount: 45000, dueDate: '2023-11-15', status: 'PENDING', type: 'FISICO' },
          { id: '2', number: 'ECH-9902', bank: 'Santander', issuer: 'Constructora S.A.', amount: 125000, dueDate: '2023-12-01', status: 'PENDING', type: 'ECHEQ' },
      ];
  });

  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [isCheckModalOpen, setIsCheckModalOpen] = useState(false);
  const [selectedRegisterForHistory, setSelectedRegisterForHistory] = useState<CashRegister | null>(null);
  const [checkFilter, setCheckFilter] = useState<'PENDING' | 'DEPOSITED' | 'REJECTED' | 'ALL'>('PENDING');

  const [manualForm, setManualForm] = useState<Partial<TreasuryMovement>>({
      type: 'INCOME', subtype: 'GASTO_VARIO', paymentMethod: 'EFECTIVO', amount: 0, description: '', cashRegisterId: '1'
  });

  const [checkForm, setCheckForm] = useState<Partial<Check>>({
      number: '', bank: '', issuer: '', amount: 0, dueDate: new Date().toISOString().split('T')[0], type: 'FISICO', status: 'PENDING'
  });

  useEffect(() => {
    localStorage.setItem('ferrecloud_registers', JSON.stringify(registers));
    localStorage.setItem('ferrecloud_treasury_movements', JSON.stringify(movements));
    localStorage.setItem('ferrecloud_checks', JSON.stringify(checks));
  }, [registers, movements, checks]);

  const toggleRegisterStatus = (id: string) => {
      const reg = registers.find(r => r.id === id);
      if (!reg) return;

      const action = reg.isOpen ? 'CIERRE' : 'APERTURA';
      if (!confirm(`¿Confirmar ${action} de ${reg.name}?`)) return;

      setRegisters(prev => prev.map(r => {
          if (r.id === id) {
              const newState = !r.isOpen;
              const auditEvent: TreasuryMovement = {
                  id: `LOG-${Date.now()}`,
                  date: new Date().toLocaleString(),
                  type: 'INCOME',
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
          alert("Error: La caja seleccionada se encuentra CERRADA.");
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
  };

  const handleAddCheck = () => {
      if (!checkForm.number || !checkForm.amount) return;
      const newCheck: Check = {
          ...checkForm as Check,
          id: `C-${Date.now()}`
      };
      setChecks([newCheck, ...checks]);
      setIsCheckModalOpen(false);
      setCheckForm({ number: '', bank: '', issuer: '', amount: 0, dueDate: new Date().toISOString().split('T')[0], type: 'FISICO', status: 'PENDING' });
  };

  const updateCheckStatus = (id: string, status: Check['status']) => {
      setChecks(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  };

  const filteredChecks = useMemo(() => {
      return checks.filter(c => checkFilter === 'ALL' || c.status === checkFilter);
  }, [checks, checkFilter]);

  const totalInChecks = useMemo(() => {
      return checks.filter(c => c.status === 'PENDING').reduce((acc, curr) => acc + curr.amount, 0);
  }, [checks]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 h-full flex flex-col bg-slate-50 overflow-hidden font-sans">
      
      <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] border border-gray-200 shadow-sm shrink-0">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
              <Wallet className="text-indigo-600"/> Tesorería y Fondos
          </h2>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1 italic">Gestión de Efectivo y Valores</p>
        </div>
        <div className="flex bg-slate-100 rounded-2xl p-1 shadow-inner">
            <button onClick={() => setActiveTab('CAJAS')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest ${activeTab === 'CAJAS' ? 'bg-white text-slate-900 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>Cajas</button>
            <button onClick={() => setActiveTab('CHEQUES')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest ${activeTab === 'CHEQUES' ? 'bg-white text-slate-900 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>Cartera Valores</button>
            <button onClick={() => setActiveTab('MOVIMIENTOS')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest ${activeTab === 'MOVIMIENTOS' ? 'bg-white text-slate-900 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>Movimientos</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
          
          {activeTab === 'CAJAS' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in pb-10">
                  {registers.map(reg => (
                      <div key={reg.id} className={`bg-white rounded-[2.5rem] p-8 border transition-all duration-300 flex flex-col ${reg.isOpen ? 'border-gray-200 shadow-sm' : 'border-red-100 bg-red-50/20'}`}>
                          <div className="flex justify-between items-start mb-8">
                              <div className={`p-4 rounded-3xl ${reg.isOpen ? 'bg-indigo-50 text-indigo-600 shadow-lg' : 'bg-red-100 text-red-600'}`}>
                                  {reg.isOpen ? <Unlock size={28}/> : <LockKeyhole size={28}/>}
                              </div>
                              <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border ${reg.isOpen ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                  {reg.isOpen ? 'OPERATIVA' : 'CERRADA'}
                              </span>
                          </div>
                          <h4 className="font-black text-slate-800 uppercase tracking-tight text-lg leading-none mb-4">{reg.name}</h4>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo en Caja</p>
                          <p className={`text-4xl font-black tracking-tighter mb-10 ${reg.isOpen ? 'text-slate-900' : 'text-slate-400'}`}>
                              ${reg.balance.toLocaleString('es-AR')}
                          </p>
                          <div className="mt-auto flex flex-col gap-2">
                              <button onClick={() => { setManualForm({...manualForm, cashRegisterId: reg.id}); setIsManualEntryOpen(true); }} disabled={!reg.isOpen} className="w-full bg-slate-900 text-white py-3 rounded-2xl font-black text-[10px] uppercase shadow-xl disabled:opacity-30">Nuevo Movimiento</button>
                              <button onClick={() => toggleRegisterStatus(reg.id)} className={`w-full py-2 rounded-xl font-black text-[9px] uppercase border transition-all ${reg.isOpen ? 'text-red-400 border-red-100 hover:bg-red-50' : 'text-green-600 border-green-200'}`}>
                                  {reg.isOpen ? 'Cerrar Caja' : 'Abrir Caja'}
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
          )}

          {activeTab === 'CHEQUES' && (
              <div className="flex flex-col space-y-6 animate-fade-in pb-10 h-full">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="bg-indigo-600 p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
                          <Landmark className="absolute -right-4 -bottom-4 opacity-10" size={100}/>
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Total en Cartera</p>
                          <h3 className="text-3xl font-black tracking-tighter mt-1">${totalInChecks.toLocaleString('es-AR')}</h3>
                          <p className="text-[9px] font-bold mt-2 uppercase">Vencimientos Próximos: 3</p>
                      </div>
                      <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm flex flex-col justify-center gap-4">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Filtro de Estado</label>
                          <div className="flex gap-2">
                              {(['PENDING', 'DEPOSITED', 'REJECTED', 'ALL'] as const).map(f => (
                                  <button key={f} onClick={() => setCheckFilter(f)} className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase border transition-all ${checkFilter === f ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-white'}`}>
                                      {f === 'PENDING' ? 'En Cartera' : f === 'DEPOSITED' ? 'Depositado' : f === 'REJECTED' ? 'Rechazado' : 'Todo'}
                                  </button>
                              ))}
                          </div>
                      </div>
                      <div className="md:col-span-2 flex items-center justify-end pr-2">
                          <button onClick={() => setIsCheckModalOpen(true)} className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl flex items-center gap-3 active:scale-95 transition-all">
                              <Plus size={20} className="text-green-400"/> Recibir Nuevo Valor
                          </button>
                      </div>
                  </div>

                  <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden flex flex-col flex-1">
                      <div className="overflow-x-auto custom-scrollbar">
                          <table className="w-full text-left">
                              <thead className="bg-slate-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">
                                  <tr>
                                      <th className="px-8 py-5">Tipo / Nº de Cheque</th>
                                      <th className="px-8 py-5">Banco / Emisor</th>
                                      <th className="px-8 py-5">Vencimiento</th>
                                      <th className="px-8 py-5 text-right">Monto</th>
                                      <th className="px-8 py-5 text-center">Gestión</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                  {filteredChecks.length === 0 ? (
                                      <tr><td colSpan={5} className="py-24 text-center text-slate-300 font-black uppercase tracking-widest">Sin valores en esta categoría</td></tr>
                                  ) : filteredChecks.map(check => (
                                      <tr key={check.id} className="hover:bg-slate-50/50 transition-colors group">
                                          <td className="px-8 py-6">
                                              <div className="flex items-center gap-4">
                                                  <div className={`p-2.5 rounded-xl ${check.type === 'ECHEQ' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                                      {check.type === 'ECHEQ' ? <ECheqIcon size={20}/> : <Banknote size={20}/>}
                                                  </div>
                                                  <div>
                                                      <p className="font-black text-slate-800 text-sm uppercase tracking-tight">{check.number}</p>
                                                      <span className="text-[8px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-widest border border-slate-200">{check.type}</span>
                                                  </div>
                                              </div>
                                          </td>
                                          <td className="px-8 py-6">
                                              <p className="font-black text-slate-600 text-xs uppercase leading-none mb-1">{check.bank}</p>
                                              <p className="text-[10px] text-slate-400 font-bold uppercase">{check.issuer}</p>
                                          </td>
                                          <td className="px-8 py-6">
                                              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                                                  <Calendar size={14} className="text-slate-300"/>
                                                  {check.dueDate}
                                              </div>
                                          </td>
                                          <td className="px-8 py-6 text-right">
                                              <p className="text-xl font-black text-slate-900 tracking-tighter">${check.amount.toLocaleString('es-AR')}</p>
                                          </td>
                                          <td className="px-8 py-6">
                                              <div className="flex items-center justify-center gap-2">
                                                  {check.status === 'PENDING' && (
                                                      <>
                                                        <button onClick={() => updateCheckStatus(check.id, 'DEPOSITED')} className="p-2.5 text-green-600 bg-green-50 hover:bg-green-600 hover:text-white rounded-xl transition-all border border-green-100" title="Marcar como Depositado">
                                                            <Landmark size={16}/>
                                                        </button>
                                                        <button onClick={() => updateCheckStatus(check.id, 'REJECTED')} className="p-2.5 text-red-600 bg-red-50 hover:bg-red-600 hover:text-white rounded-xl transition-all border border-red-100" title="Rechazado">
                                                            <AlertTriangle size={16}/>
                                                        </button>
                                                      </>
                                                  )}
                                                  <button onClick={() => setChecks(checks.filter(c => c.id !== check.id))} className="p-2.5 text-slate-300 hover:text-red-500 transition-all">
                                                      <Trash2 size={16}/>
                                                  </button>
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
                                  <th className="px-8 py-5">Fecha</th>
                                  <th className="px-8 py-5">Caja</th>
                                  <th className="px-8 py-5">Concepto</th>
                                  <th className="px-8 py-5">Medio</th>
                                  <th className="px-8 py-5 text-right">Monto</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {movements.length === 0 ? (
                                  <tr><td colSpan={5} className="py-32 text-center text-slate-300 font-black uppercase tracking-widest">No se registran movimientos</td></tr>
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

      {/* MODAL: CHEQUE / E-CHEQ */}
      {isCheckModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                  <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-white/20 rounded-2xl shadow-lg"><Landmark size={24}/></div>
                          <div>
                              <h3 className="font-black uppercase tracking-tighter text-xl">Ingreso de Valor</h3>
                              <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mt-1">Gestión de Cartera</p>
                          </div>
                      </div>
                      <button onClick={() => setIsCheckModalOpen(false)}><X size={28}/></button>
                  </div>
                  <div className="p-10 space-y-6 bg-slate-50/50">
                      <div className="grid grid-cols-2 gap-4">
                          <button onClick={() => setCheckForm({...checkForm, type: 'FISICO'})} className={`py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${checkForm.type === 'FISICO' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md' : 'border-gray-200 bg-white text-gray-400'}`}>Cheque Físico</button>
                          <button onClick={() => setCheckForm({...checkForm, type: 'ECHEQ'})} className={`py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${checkForm.type === 'ECHEQ' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md' : 'border-gray-200 bg-white text-gray-400'}`}>E-Cheq Digital</button>
                      </div>
                      <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-2">Nº de Cheque</label>
                                  <input type="text" className="w-full p-4 bg-white border border-gray-200 rounded-2xl outline-none font-bold uppercase" value={checkForm.number} onChange={e => setCheckForm({...checkForm, number: e.target.value})} />
                              </div>
                              <div>
                                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-2">Banco</label>
                                  <input type="text" className="w-full p-4 bg-white border border-gray-200 rounded-2xl outline-none font-bold uppercase" value={checkForm.bank} onChange={e => setCheckForm({...checkForm, bank: e.target.value})} />
                              </div>
                          </div>
                          <div>
                              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-2">Librador / Emisor</label>
                              <input type="text" className="w-full p-4 bg-white border border-gray-200 rounded-2xl outline-none font-bold uppercase" value={checkForm.issuer} onChange={e => setCheckForm({...checkForm, issuer: e.target.value})} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-2">Importe ($)</label>
                                  <input type="number" className="w-full p-4 bg-white border border-gray-200 rounded-2xl outline-none font-black text-xl text-indigo-600" value={checkForm.amount || ''} onChange={e => setCheckForm({...checkForm, amount: parseFloat(e.target.value) || 0})} />
                              </div>
                              <div>
                                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-2">Vencimiento</label>
                                  <input type="date" className="w-full p-4 bg-white border border-gray-200 rounded-2xl outline-none font-bold" value={checkForm.dueDate} onChange={e => setCheckForm({...checkForm, dueDate: e.target.value})} />
                              </div>
                          </div>
                      </div>
                      <button onClick={handleAddCheck} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
                          <Save size={20}/> Registrar en Cartera
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL MOVIMIENTO (EXISTENTE) */}
      {isManualEntryOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-lg overflow-hidden flex flex-col">
                  <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg"><ArrowRightLeft size={24}/></div>
                          <div>
                              <h3 className="font-black uppercase tracking-tighter text-xl">Nueva Operación</h3>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ingreso / Egreso a Caja</p>
                          </div>
                      </div>
                      <button onClick={() => setIsManualEntryOpen(false)}><X size={28}/></button>
                  </div>
                  <div className="p-10 space-y-6 bg-slate-50/50">
                      <div className="grid grid-cols-2 gap-4">
                          <button onClick={() => setManualForm({...manualForm, type: 'INCOME'})} className={`py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${manualForm.type === 'INCOME' ? 'border-green-600 bg-green-50 text-green-700 shadow-md' : 'border-gray-200 bg-white text-gray-400'}`}>Ingreso (+)</button>
                          <button onClick={() => setManualForm({...manualForm, type: 'EXPENSE'})} className={`py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${manualForm.type === 'EXPENSE' ? 'border-red-600 bg-red-50 text-red-700 shadow-md' : 'border-gray-200 bg-white text-gray-400'}`}>Egreso (-)</button>
                      </div>
                      <div className="space-y-4">
                          <input type="text" className="w-full p-4 bg-white border border-gray-200 rounded-2xl outline-none font-bold uppercase" placeholder="Descripción..." value={manualForm.description} onChange={e => setManualForm({...manualForm, description: e.target.value.toUpperCase()})} />
                          <input type="number" className="w-full p-5 bg-white border border-gray-200 rounded-3xl outline-none font-black text-3xl text-slate-900" value={manualForm.amount || ''} onChange={e => setManualForm({...manualForm, amount: parseFloat(e.target.value) || 0})} placeholder="0.00" />
                          <div className="grid grid-cols-2 gap-4">
                              <select className="w-full p-3 bg-white border border-gray-200 rounded-xl font-black text-xs outline-none" value={manualForm.cashRegisterId} onChange={e => setManualForm({...manualForm, cashRegisterId: e.target.value})}>
                                  {registers.map(r => <option key={r.id} value={r.id} disabled={!r.isOpen}>{r.name}</option>)}
                              </select>
                              <select className="w-full p-3 bg-white border border-gray-200 rounded-xl font-black text-xs outline-none" value={manualForm.paymentMethod} onChange={e => setManualForm({...manualForm, paymentMethod: e.target.value as any})}>
                                  <option value="EFECTIVO">Efectivo</option>
                                  <option value="TRANSFERENCIA">Transferencia</option>
                                  <option value="MERCADO_PAGO">Mercado Pago</option>
                              </select>
                          </div>
                      </div>
                      <button onClick={handleAddMovement} className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all">Validar y Registrar</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Treasury;
