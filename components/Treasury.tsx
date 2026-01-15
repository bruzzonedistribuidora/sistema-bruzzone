import React, { useState, useEffect, useMemo } from 'react';
import { 
    Wallet, ArrowUpRight, ArrowDownLeft, ArrowRightLeft, CreditCard, 
    Banknote, DollarSign, Calendar, Lock, CheckCircle, FileText, 
    Plus, X, Save, Calculator, AlertTriangle, QrCode, Scroll, 
    Smartphone, Search, Filter, History, Truck, MoreVertical, 
    ArrowDownRight, Landmark, Receipt, Info, LogOut, LogIn, Download,
    RotateCcw, Send, Building, LockKeyhole, Unlock, CheckCircle2, XCircle,
    Printer, Smartphone as ECheqIcon, ShieldCheck, Trash2, ArrowRight
} from 'lucide-react';
import { CashRegister, Check, TreasuryMovement } from '../types';

const Treasury: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'CAJAS' | 'MOVIMIENTOS' | 'CHEQUES'>('CAJAS');
  
  const [registers, setRegisters] = useState<CashRegister[]>(() => {
    const saved = localStorage.getItem('ferrecloud_registers');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Caja Mostrador Principal', balance: 154200, isOpen: true },
      { id: '2', name: 'Caja Administración', balance: 45000, isOpen: true },
    ];
  });

  const [movements, setMovements] = useState<TreasuryMovement[]>(() => {
    const saved = localStorage.getItem('ferrecloud_treasury_movements');
    return saved ? JSON.parse(saved) : [];
  });

  const [checks, setChecks] = useState<Check[]>([]);

  // Estados para Nuevos Modales
  const [isNewRegisterModalOpen, setIsNewRegisterModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [isCheckModalOpen, setIsCheckModalOpen] = useState(false);

  // Formularios
  const [newRegisterForm, setNewRegisterForm] = useState({ name: '', initialBalance: 0 });
  const [transferForm, setTransferForm] = useState({ sourceId: '', destId: '', amount: 0, notes: '' });
  const [manualForm, setManualForm] = useState<Partial<TreasuryMovement>>({
      type: 'INCOME', subtype: 'GASTO_VARIO', paymentMethod: 'EFECTIVO', amount: 0, description: '', cashRegisterId: '1'
  });
  const [checkForm, setCheckForm] = useState<Partial<Check>>({
      number: '', bank: '', issuer: '', amount: 0, dueDate: new Date().toISOString().split('T')[0], type: 'FISICO', status: 'PENDING'
  });

  const [checkFilter, setCheckFilter] = useState<'PENDING' | 'DEPOSITED' | 'REJECTED' | 'ALL'>('PENDING');

  useEffect(() => {
    const savedChecks = localStorage.getItem('ferrecloud_checks');
    setChecks(savedChecks ? JSON.parse(savedChecks) : []);
  }, []);

  useEffect(() => {
    localStorage.setItem('ferrecloud_registers', JSON.stringify(registers));
    localStorage.setItem('ferrecloud_treasury_movements', JSON.stringify(movements));
    localStorage.setItem('ferrecloud_checks', JSON.stringify(checks));
    // Emitir evento para sincronización en la nube
    window.dispatchEvent(new Event('ferrecloud_request_pulse'));
  }, [registers, movements, checks]);

  const handleCreateRegister = () => {
    if (!newRegisterForm.name) return;
    const newReg: CashRegister = {
        id: `reg-${Date.now()}`,
        name: newRegisterForm.name.toUpperCase(),
        balance: newRegisterForm.initialBalance,
        isOpen: true
    };
    setRegisters([...registers, newReg]);
    setIsNewRegisterModalOpen(false);
    setNewRegisterForm({ name: '', initialBalance: 0 });

    // Auditoría de creación
    const log: TreasuryMovement = {
        id: `LOG-NEW-${Date.now()}`,
        date: new Date().toLocaleString(),
        type: 'INCOME',
        subtype: 'APERTURA',
        paymentMethod: 'EFECTIVO',
        amount: newRegisterForm.initialBalance,
        description: `*** APERTURA NUEVA CAJA: ${newReg.name} ***`,
        cashRegisterId: newReg.id
    };
    setMovements([log, ...movements]);
  };

  const handleTransfer = () => {
    const { sourceId, destId, amount, notes } = transferForm;
    if (!sourceId || !destId || amount <= 0) return;
    if (sourceId === destId) {
        alert("Origen y destino deben ser diferentes.");
        return;
    }

    const source = registers.find(r => r.id === sourceId);
    const dest = registers.find(r => r.id === destId);

    if (!source?.isOpen || !dest?.isOpen) {
        alert("Ambas cajas deben estar ABIERTAS para realizar la transferencia.");
        return;
    }

    if (source.balance < amount) {
        alert("Saldo insuficiente en la caja de origen.");
        return;
    }

    const opId = `TR-${Date.now()}`;
    const date = new Date().toLocaleString();

    // 1. Actualizar saldos
    setRegisters(prev => prev.map(r => {
        if (r.id === sourceId) return { ...r, balance: r.balance - amount };
        if (r.id === destId) return { ...r, balance: r.balance + amount };
        return r;
    }));

    // 2. Registrar movimientos cruzados
    const movSource: TreasuryMovement = {
        id: `${opId}-S`,
        date,
        type: 'EXPENSE',
        subtype: 'TRANSFERENCIA',
        paymentMethod: 'EFECTIVO',
        amount,
        description: `TRASLADO A ${dest.name}. ${notes}`.toUpperCase(),
        cashRegisterId: sourceId
    };

    const movDest: TreasuryMovement = {
        id: `${opId}-D`,
        date,
        type: 'INCOME',
        subtype: 'TRANSFERENCIA',
        paymentMethod: 'EFECTIVO',
        amount,
        description: `INGRESO DESDE ${source.name}. ${notes}`.toUpperCase(),
        cashRegisterId: destId
    };

    setMovements([movSource, movDest, ...movements]);
    setIsTransferModalOpen(false);
    setTransferForm({ sourceId: '', destId: '', amount: 0, notes: '' });
    alert("✅ Transferencia realizada con éxito.");
  };

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
      
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-6 rounded-[2.5rem] border border-gray-200 shadow-sm shrink-0 gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
              <Wallet className="text-indigo-600"/> Tesorería y Fondos
          </h2>
          <div className="flex gap-4 mt-2">
            <button onClick={() => setIsNewRegisterModalOpen(true)} className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">
                <Plus size={14}/> Nueva Caja
            </button>
            <button onClick={() => setIsTransferModalOpen(true)} className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline">
                <ArrowRightLeft size={14}/> Transferir
            </button>
          </div>
        </div>
        <div className="flex bg-slate-100 rounded-2xl p-1 shadow-inner w-full lg:w-auto overflow-x-auto no-scrollbar">
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
                          <h4 className="font-black text-slate-800 uppercase tracking-tight text-lg leading-none mb-4 truncate">{reg.name}</h4>
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
                  <button onClick={() => setIsNewRegisterModalOpen(true)} className="border-4 border-dashed border-slate-200 rounded-[2.5rem] p-8 flex flex-col items-center justify-center gap-4 text-slate-300 hover:border-indigo-400 hover:text-indigo-500 hover:bg-white transition-all group min-h-[300px]">
                      <Plus size={48} className="group-hover:rotate-90 transition-transform"/>
                      <span className="font-black uppercase tracking-widest text-[10px]">Crear Nueva Caja</span>
                  </button>
              </div>
          )}

          {activeTab === 'CHEQUES' && (
              <div className="flex flex-col space-y-6 animate-fade-in pb-10 h-full">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="bg-indigo-600 p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
                          <Landmark className="absolute -right-4 -bottom-4 opacity-10" size={100}/>
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Total en Cartera</p>
                          <h3 className="text-3xl font-black tracking-tighter mt-1">${totalInChecks.toLocaleString('es-AR')}</h3>
                      </div>
                      <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm flex flex-col justify-center gap-4">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Filtro de Estado</label>
                          <div className="flex gap-2 overflow-x-auto no-scrollbar">
                              {(['PENDING', 'DEPOSITED', 'REJECTED', 'ALL'] as const).map(f => (
                                  <button key={f} onClick={() => setCheckFilter(f)} className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase border transition-all whitespace-nowrap ${checkFilter === f ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-white'}`}>
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
                                      <tr key={check.id} className="hover:bg-slate-50 transition-colors group">
                                          <td className="px-8 py-6">
                                              <div className="flex items-center gap-4">
                                                  <div className={`p-2.5 rounded-xl ${check.type === 'ECHEQ' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                                      {check.type === 'ECHEQ' ? <ECheqIcon size={20}/> : <Banknote size={20}/>}
                                                  </div>
                                                  <div>
                                                      <p className="font-black text-slate-800 text-sm uppercase tracking-tight">{check.number}</p>
                                                  </div>
                                              </div>
                                          </td>
                                          <td className="px-8 py-6">
                                              <p className="font-black text-slate-600 text-xs uppercase leading-none mb-1">{check.bank}</p>
                                              <p className="text-[10px] text-slate-400 font-bold uppercase">{check.issuer}</p>
                                          </td>
                                          <td className="px-8 py-6 text-slate-500 text-xs font-bold">{check.dueDate}</td>
                                          <td className="px-8 py-6 text-right font-black text-slate-900">${check.amount.toLocaleString('es-AR')}</td>
                                          <td className="px-8 py-6">
                                              <div className="flex items-center justify-center gap-2">
                                                  {check.status === 'PENDING' && (
                                                      <button onClick={() => updateCheckStatus(check.id, 'DEPOSITED')} className="p-2.5 text-green-600 bg-green-50 hover:bg-green-600 hover:text-white rounded-xl transition-all border border-green-100">
                                                          <CheckCircle size={16}/>
                                                      </button>
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
                  </div>
                  <div className="overflow-x-auto custom-scrollbar">
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
                              {movements.map(m => (
                                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                                      <td className="px-8 py-5 text-[11px] font-bold text-slate-400">{m.date}</td>
                                      <td className="px-8 py-5 text-[10px] font-black uppercase truncate max-w-[150px]">
                                          {registers.find(r => r.id === m.cashRegisterId)?.name || 'S/D'}
                                      </td>
                                      <td className="px-8 py-5 font-black text-slate-800 uppercase text-[11px]">{m.description}</td>
                                      <td className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase">{m.paymentMethod}</td>
                                      <td className={`px-8 py-5 text-right font-black text-lg tracking-tighter ${m.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                                          {m.type === 'INCOME' ? '+' : '-'}${m.amount.toLocaleString('es-AR')}
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}
      </div>

      {/* MODAL: NUEVA CAJA */}
      {isNewRegisterModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                  <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg"><Plus size={24}/></div>
                          <h3 className="font-black uppercase tracking-tighter text-xl">Nueva Caja</h3>
                      </div>
                      <button onClick={() => setIsNewRegisterModalOpen(false)}><X size={28}/></button>
                  </div>
                  <div className="p-10 space-y-6 bg-slate-50/50">
                      <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-2">Nombre Identificatorio</label>
                          <input type="text" className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl outline-none font-black text-slate-800 uppercase focus:border-indigo-600 transition-all" placeholder="EJ: CAJA-05, TALLER, COBRO-WEB" value={newRegisterForm.name} onChange={e => setNewRegisterForm({...newRegisterForm, name: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-2">Saldo Inicial de Apertura ($)</label>
                          <input type="number" className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl outline-none font-black text-2xl text-indigo-600 text-center" value={newRegisterForm.initialBalance || ''} onChange={e => setNewRegisterForm({...newRegisterForm, initialBalance: parseFloat(e.target.value) || 0})} />
                      </div>
                      <button onClick={handleCreateRegister} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3">
                          <Save size={20}/> Habilitar Caja
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL: TRANSFERENCIA */}
      {isTransferModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                  <div className="p-8 bg-emerald-600 text-white flex justify-between items-center">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-white/20 rounded-2xl shadow-lg"><ArrowRightLeft size={24}/></div>
                          <h3 className="font-black uppercase tracking-tighter text-xl">Traslado de Fondos</h3>
                      </div>
                      <button onClick={() => setIsTransferModalOpen(false)}><X size={28}/></button>
                  </div>
                  <div className="p-10 space-y-6 bg-slate-50/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Caja Origen</label>
                              <select className="w-full p-4 bg-white border border-gray-200 rounded-2xl font-black text-[10px] uppercase outline-none focus:ring-2 focus:ring-emerald-500" value={transferForm.sourceId} onChange={e => setTransferForm({...transferForm, sourceId: e.target.value})}>
                                  <option value="">-- ORIGEN --</option>
                                  {registers.map(r => <option key={r.id} value={r.id} disabled={!r.isOpen}>{r.name} - ${r.balance.toLocaleString()}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Caja Destino</label>
                              <select className="w-full p-4 bg-white border border-gray-200 rounded-2xl font-black text-[10px] uppercase outline-none focus:ring-2 focus:ring-emerald-500" value={transferForm.destId} onChange={e => setTransferForm({...transferForm, destId: e.target.value})}>
                                  <option value="">-- DESTINO --</option>
                                  {registers.map(r => <option key={r.id} value={r.id} disabled={!r.isOpen}>{r.name} - ${r.balance.toLocaleString()}</option>)}
                              </select>
                          </div>
                      </div>
                      <div className="flex items-center justify-center p-4">
                        <ArrowRight size={24} className="text-emerald-500 rotate-90 md:rotate-0"/>
                      </div>
                      <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Importe a Transferir ($)</label>
                          <input type="number" className="w-full p-5 bg-white border-2 border-emerald-500 rounded-[2rem] font-black text-4xl text-center text-emerald-700 outline-none" placeholder="0.00" value={transferForm.amount || ''} onChange={e => setTransferForm({...transferForm, amount: parseFloat(e.target.value) || 0})} />
                      </div>
                      <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Notas (Opcional)</label>
                          <input type="text" className="w-full p-4 bg-white border border-gray-200 rounded-2xl outline-none font-bold uppercase text-xs" placeholder="EJ: REFUERZO DE CAMBIO, PAGO PROVEEDOR..." value={transferForm.notes} onChange={e => setTransferForm({...transferForm, notes: e.target.value})} />
                      </div>
                      <button onClick={handleTransfer} className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black uppercase shadow-2xl hover:bg-emerald-600 transition-all active:scale-95">Efectivizar Transferencia</button>
                  </div>
              </div>
          </div>
      )}

      {isCheckModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                  <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-white/20 rounded-2xl shadow-lg"><Landmark size={24}/></div>
                          <h3 className="font-black uppercase tracking-tighter text-xl">Ingreso de Valor</h3>
                      </div>
                      <button onClick={() => setIsCheckModalOpen(false)}><X size={28}/></button>
                  </div>
                  <div className="p-10 space-y-6 bg-slate-50/50 overflow-y-auto">
                      <div className="grid grid-cols-2 gap-4">
                          <button onClick={() => setCheckForm({...checkForm, type: 'FISICO'})} className={`py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${checkForm.type === 'FISICO' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md' : 'border-gray-200 bg-white text-gray-400'}`}>Cheque Físico</button>
                          <button onClick={() => setCheckForm({...checkForm, type: 'ECHEQ'})} className={`py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${checkForm.type === 'ECHEQ' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md' : 'border-gray-200 bg-white text-gray-400'}`}>E-Cheq Digital</button>
                      </div>
                      <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                              <input type="text" className="w-full p-4 bg-white border border-gray-200 rounded-2xl outline-none font-bold uppercase" placeholder="Número" value={checkForm.number} onChange={e => setCheckForm({...checkForm, number: e.target.value})} />
                              <input type="text" className="w-full p-4 bg-white border border-gray-200 rounded-2xl outline-none font-bold uppercase" placeholder="Banco" value={checkForm.bank} onChange={e => setCheckForm({...checkForm, bank: e.target.value})} />
                          </div>
                          <input type="text" className="w-full p-4 bg-white border border-gray-200 rounded-2xl outline-none font-bold uppercase" placeholder="Librador / Emisor" value={checkForm.issuer} onChange={e => setCheckForm({...checkForm, issuer: e.target.value})} />
                          <div className="grid grid-cols-2 gap-4">
                              <input type="number" className="w-full p-4 bg-white border border-gray-200 rounded-2xl outline-none font-black text-xl text-indigo-600" placeholder="Monto" value={checkForm.amount || ''} onChange={e => setCheckForm({...checkForm, amount: parseFloat(e.target.value) || 0})} />
                              <input type="date" className="w-full p-4 bg-white border border-gray-200 rounded-2xl outline-none font-bold" value={checkForm.dueDate} onChange={e => setCheckForm({...checkForm, dueDate: e.target.value})} />
                          </div>
                      </div>
                      <button onClick={handleAddCheck} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
                          <Save size={20}/> Registrar Valor
                      </button>
                  </div>
              </div>
          </div>
      )}

      {isManualEntryOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                  <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-indigo-500 text-white rounded-2xl shadow-lg"><ArrowRightLeft size={24}/></div>
                          <h3 className="font-black uppercase tracking-tighter text-xl">Nueva Operación de Caja</h3>
                      </div>
                      <button onClick={() => setIsManualEntryOpen(false)}><X size={28}/></button>
                  </div>
                  <div className="p-10 space-y-6 bg-slate-50/50">
                      <div className="grid grid-cols-2 gap-4">
                          <button onClick={() => setManualForm({...manualForm, type: 'INCOME'})} className={`py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${manualForm.type === 'INCOME' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 bg-white text-gray-400'}`}>Ingreso (+)</button>
                          <button onClick={() => setManualForm({...manualForm, type: 'EXPENSE'})} className={`py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${manualForm.type === 'EXPENSE' ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-200 bg-white text-gray-400'}`}>Egreso (-)</button>
                      </div>
                      <div className="space-y-4">
                          <input type="text" className="w-full p-4 bg-white border border-gray-200 rounded-2xl outline-none font-bold uppercase" placeholder="Descripción..." value={manualForm.description} onChange={e => setManualForm({...manualForm, description: e.target.value.toUpperCase()})} />
                          <input type="number" className="w-full p-5 bg-white border border-gray-200 rounded-3xl outline-none font-black text-3xl text-slate-900" value={manualForm.amount || ''} onChange={e => setManualForm({...manualForm, amount: parseFloat(e.target.value) || 0})} placeholder="0.00" />
                          <div className="grid grid-cols-2 gap-4">
                              <select className="w-full p-3 bg-white border border-gray-200 rounded-xl font-black text-xs outline-none" value={manualForm.cashRegisterId} onChange={e => setManualForm({...manualForm, cashRegisterId: e.target.value})}>
                                  {registers.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                              </select>
                              <select className="w-full p-3 bg-white border border-gray-200 rounded-xl font-black text-xs outline-none" value={manualForm.paymentMethod} onChange={e => setManualForm({...manualForm, paymentMethod: e.target.value as any})}>
                                  <option value="EFECTIVO">Efectivo</option>
                                  <option value="TRANSFERENCIA">Transferencia</option>
                              </select>
                          </div>
                      </div>
                      <button onClick={handleAddMovement} className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black uppercase shadow-2xl hover:bg-slate-800 transition-all">Registrar Movimiento</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Treasury;
