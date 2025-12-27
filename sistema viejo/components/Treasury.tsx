import React, { useState, useEffect, useMemo } from 'react';
import { 
    Wallet, ArrowUpRight, ArrowDownLeft, ArrowRightLeft, CreditCard, 
    Banknote, DollarSign, Calendar, Lock, CheckCircle, FileText, 
    Plus, X, Save, Calculator, AlertTriangle, QrCode, Scroll, 
    Smartphone, Search, Filter, History, Truck, MoreVertical, 
    ArrowDownRight, Landmark, Receipt, Info, LogOut, LogIn, Download,
    RotateCcw, Send, Building
} from 'lucide-react';
import { CashRegister, Check, TreasuryMovement } from '../types';

const Treasury: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'CAJAS' | 'MOVIMIENTOS' | 'CHEQUES'>('CAJAS');
  
  // --- PERSISTENCIA: CAJAS ---
  const [registers, setRegisters] = useState<CashRegister[]>(() => {
    const saved = localStorage.getItem('ferrecloud_registers');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Caja Mostrador Principal', balance: 154200, isOpen: true },
      { id: '2', name: 'Caja Administración', balance: 45000, isOpen: true },
      { id: '3', name: 'Caja Sucursal Norte', balance: 12000, isOpen: false },
    ];
  });

  // --- PERSISTENCIA: MOVIMIENTOS ---
  const [movements, setMovements] = useState<TreasuryMovement[]>(() => {
    const saved = localStorage.getItem('ferrecloud_treasury_movements');
    return saved ? JSON.parse(saved) : [
      { id: 'M-1', date: '2023-10-27 10:30', type: 'INCOME', subtype: 'VENTA', paymentMethod: 'EFECTIVO', amount: 12500, description: 'Venta Mostrador #0001', cashRegisterId: '1' },
      { id: 'M-2', date: '2023-10-27 11:15', type: 'EXPENSE', subtype: 'PAGO_PROVEEDOR', paymentMethod: 'EFECTIVO', amount: 5000, description: 'Pago flete HG', cashRegisterId: '1' }
    ];
  });

  // --- PERSISTENCIA: CHEQUES ---
  const [checks, setChecks] = useState<Check[]>(() => {
      const saved = localStorage.getItem('ferrecloud_checks');
      return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('ferrecloud_registers', JSON.stringify(registers));
    localStorage.setItem('ferrecloud_treasury_movements', JSON.stringify(movements));
    localStorage.setItem('ferrecloud_checks', JSON.stringify(checks));
  }, [registers, movements, checks]);

  // --- ESTADOS DE UI ---
  const [checkSearch, setCheckSearch] = useState('');
  const [checkStatusFilter, setCheckStatusFilter] = useState<'ALL' | 'CARTERA' | 'ENTREGADO' | 'RECHAZADO' | 'DEPOSITADO'>('CARTERA');
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [isNewCheckModalOpen, setIsNewCheckModalOpen] = useState(false);
  const [isEndorseModalOpen, setIsEndorseModalOpen] = useState(false);
  const [selectedCheckForAction, setSelectedCheckForAction] = useState<Check | null>(null);

  const [manualForm, setManualForm] = useState<Partial<TreasuryMovement>>({
      type: 'INCOME', subtype: 'GASTO_VARIO', paymentMethod: 'EFECTIVO', amount: 0, description: '', cashRegisterId: '1'
  });

  const [checkForm, setCheckForm] = useState<Partial<Check>>({
      type: 'FISICO', bank: '', number: '', amount: 0, paymentDate: new Date().toISOString().split('T')[0], origin: ''
  });

  const [endorseData, setEndorseData] = useState({ destination: '' });

  // --- FILTROS ---
  const filteredChecks = useMemo(() => {
      return checks.filter(c => {
          const matchStatus = checkStatusFilter === 'ALL' || c.status === checkStatusFilter;
          const matchSearch = c.bank.toLowerCase().includes(checkSearch.toLowerCase()) || 
                             c.origin.toLowerCase().includes(checkSearch.toLowerCase()) ||
                             c.number.includes(checkSearch);
          return matchStatus && matchSearch;
      }).sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime());
  }, [checks, checkSearch, checkStatusFilter]);

  const sortedMovements = useMemo(() => {
      return [...movements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [movements]);

  // --- HANDLERS ---
  const handleAddManualMovement = () => {
      if (!manualForm.amount || !manualForm.description) return;

      const newMov: TreasuryMovement = {
          ...manualForm as TreasuryMovement,
          id: `M-${Date.now()}`,
          date: new Date().toLocaleString()
      };

      setMovements([newMov, ...movements]);
      setRegisters(prev => prev.map(reg => {
          if (reg.id === manualForm.cashRegisterId) {
              const impact = newMov.type === 'INCOME' ? newMov.amount : -newMov.amount;
              return { ...reg, balance: reg.balance + impact };
          }
          return reg;
      }));

      setIsManualEntryOpen(false);
      setManualForm({ type: 'INCOME', subtype: 'GASTO_VARIO', paymentMethod: 'EFECTIVO', amount: 0, description: '', cashRegisterId: '1' });
  };

  const handleSaveNewCheck = () => {
      if (!checkForm.bank || !checkForm.number || !checkForm.amount) return;
      const newCheck: Check = {
          ...checkForm as Check,
          id: `CH-${Date.now()}`,
          entryDate: new Date().toISOString().split('T')[0],
          status: 'CARTERA'
      };
      setChecks([newCheck, ...checks]);
      setIsNewCheckModalOpen(false);
      setCheckForm({ type: 'FISICO', bank: '', number: '', amount: 0, paymentDate: new Date().toISOString().split('T')[0], origin: '' });
  };

  const handleDepositCheck = (id: string) => {
      if (!confirm("¿Desea marcar este cheque como DEPOSITADO? Se quitará de la cartera activa.")) return;
      setChecks(prev => prev.map(c => c.id === id ? { ...c, status: 'DEPOSITADO' } : c));
  };

  const handleOpenEndorse = (check: Check) => {
      setSelectedCheckForAction(check);
      setIsEndorseModalOpen(true);
  };

  const confirmEndorse = () => {
      if (!selectedCheckForAction || !endorseData.destination) return;
      setChecks(prev => prev.map(c => 
          c.id === selectedCheckForAction.id 
          ? { ...c, status: 'ENTREGADO', destination: endorseData.destination } 
          : c
      ));
      setIsEndorseModalOpen(false);
      setSelectedCheckForAction(null);
      setEndorseData({ destination: '' });
  };

  const handleToggleRegister = (reg: CashRegister) => {
      setRegisters(prev => prev.map(r => r.id === reg.id ? { ...r, isOpen: !r.isOpen } : r));
      alert(`Caja "${reg.name}" ${!reg.isOpen ? 'ABIERTA' : 'CERRADA'} correctamente.`);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Tesorería y Gestión de Efectivo</h2>
          <p className="text-gray-500 text-sm font-medium italic">Control centralizado de flujos monetarios y arqueo de cajas.</p>
        </div>
        <div className="flex bg-white rounded-2xl p-1.5 border border-gray-200 shadow-sm">
            <button onClick={() => setActiveTab('CAJAS')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all tracking-widest ${activeTab === 'CAJAS' ? 'bg-slate-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Cajas</button>
            <button onClick={() => setActiveTab('MOVIMIENTOS')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all tracking-widest ${activeTab === 'MOVIMIENTOS' ? 'bg-slate-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Movimientos</button>
            <button onClick={() => setActiveTab('CHEQUES')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all tracking-widest ${activeTab === 'CHEQUES' ? 'bg-slate-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Cheques</button>
        </div>
      </div>

      {/* --- TAB: CAJAS --- */}
      {activeTab === 'CAJAS' && (
          <div className="space-y-6 animate-fade-in flex-1 overflow-y-auto pb-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {registers.map(reg => (
                      <div key={reg.id} className={`bg-white rounded-[2.5rem] border-2 transition-all p-8 flex flex-col shadow-sm relative overflow-hidden group ${reg.isOpen ? 'border-indigo-100' : 'border-gray-100 opacity-80'}`}>
                          {!reg.isOpen && <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                              <span className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Lock size={12}/> Caja Cerrada</span>
                          </div>}
                          
                          <div className="flex justify-between items-start mb-8">
                                <div className={`p-4 rounded-3xl ${reg.isOpen ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                                    <Wallet size={32}/>
                                </div>
                                <div className="flex flex-col items-end">
                                    <h4 className="font-black text-slate-800 uppercase tracking-tighter text-lg">{reg.name}</h4>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ID: #{reg.id}</p>
                                </div>
                          </div>

                          <div className="mb-10">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Efectivo Disponible</p>
                              <p className={`text-5xl font-black tracking-tighter ${reg.isOpen ? 'text-slate-900' : 'text-slate-400'}`}>
                                  ${reg.balance.toLocaleString('es-AR')}
                              </p>
                          </div>

                          <div className="grid grid-cols-2 gap-3 relative z-20">
                                <button 
                                    // Fix: Replaced undefined setSelectedReg with setManualForm to update the targeted register ID
                                    onClick={() => { setManualForm(prev => ({ ...prev, cashRegisterId: reg.id })); setIsManualEntryOpen(true); }}
                                    disabled={!reg.isOpen}
                                    className="bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl disabled:opacity-20">
                                    <ArrowRightLeft size={16}/> Movimiento
                                </button>
                                <button 
                                    onClick={() => handleToggleRegister(reg)}
                                    className={`py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 border-2 ${reg.isOpen ? 'border-red-100 text-red-600 hover:bg-red-50' : 'border-green-100 text-green-600 hover:bg-green-50'}`}>
                                    {reg.isOpen ? <><LogOut size={16}/> Cierre</> : <><LogIn size={16}/> Abrir</>}
                                </button>
                          </div>
                      </div>
                  ))}
                  
                  <button className="border-4 border-dashed border-gray-100 rounded-[2.5rem] flex flex-col items-center justify-center text-gray-300 hover:border-indigo-100 hover:text-indigo-200 transition-all group min-h-[350px]">
                      <div className="p-4 bg-gray-50 rounded-full group-hover:bg-indigo-50 transition-colors mb-4">
                          <Plus size={48}/>
                      </div>
                      <span className="font-black uppercase tracking-widest text-sm">Habilitar Nueva Caja</span>
                  </button>
              </div>

              <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white flex flex-col md:flex-row items-center justify-between shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><Banknote size={200}/></div>
                  <div className="relative z-10">
                      <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-1">Consolidado General</p>
                      <h3 className="text-xl font-bold uppercase tracking-tight text-slate-300">Total en Efectivo (Todas las Cajas)</h3>
                      <p className="text-6xl font-black tracking-tighter mt-2">${registers.reduce((a,c) => a + c.balance, 0).toLocaleString('es-AR')}</p>
                  </div>
                  <div className="flex gap-4 mt-8 md:mt-0 relative z-10">
                      <button className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">Ver Libro de Caja</button>
                      <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all">Arqueo General</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- TAB: MOVIMIENTOS --- */}
      {activeTab === 'MOVIMIENTOS' && (
          <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden flex flex-col flex-1 animate-fade-in">
              <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6 bg-gray-50/50">
                  <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                      <input type="text" placeholder="Filtrar por descripción o ID..." className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-slate-900 font-bold text-sm transition-all" />
                  </div>
                  <div className="flex gap-2">
                      <button className="bg-white border border-gray-200 p-3 rounded-2xl text-slate-400 hover:text-slate-800 transition-all"><Filter size={20}/></button>
                      <button className="bg-white border border-gray-200 p-3 rounded-2xl text-slate-400 hover:text-slate-800 transition-all"><Download size={20}/></button>
                  </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-left">
                      <thead className="bg-gray-50 sticky top-0 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                          <tr>
                              <th className="px-8 py-5">Fecha / ID</th>
                              <th className="px-8 py-5">Tipo / Concepto</th>
                              <th className="px-8 py-5">Descripción</th>
                              <th className="px-8 py-5">Medio</th>
                              <th className="px-8 py-5 text-right">Importe</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          {sortedMovements.map(m => (
                              <tr key={m.id} className="hover:bg-slate-50/50 transition-colors group">
                                  <td className="px-8 py-6">
                                      <p className="text-sm font-bold text-slate-700 leading-none mb-1">{m.date}</p>
                                      <p className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-widest">{m.id}</p>
                                  </td>
                                  <td className="px-8 py-6">
                                      <div className="flex items-center gap-3">
                                          <div className={`p-2 rounded-xl ${m.type === 'INCOME' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                              {m.type === 'INCOME' ? <ArrowDownLeft size={16}/> : <ArrowUpRight size={16}/>}
                                          </div>
                                          <div>
                                              <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-none mb-1">{m.subtype.replace('_', ' ')}</p>
                                              <p className="text-[9px] text-gray-400 font-bold uppercase">Caja: {registers.find(r => r.id === m.cashRegisterId)?.name || 'Caja Principal'}</p>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="px-8 py-6 text-sm font-medium text-slate-500 uppercase max-w-xs truncate">{m.description}</td>
                                  <td className="px-8 py-6">
                                      <div className="flex items-center gap-2">
                                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.paymentMethod.replace('_', ' ')}</span>
                                      </div>
                                  </td>
                                  <td className={`px-8 py-6 text-right font-black text-xl tracking-tighter ${m.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                                      {m.type === 'INCOME' ? '+' : '-'}${m.amount.toLocaleString('es-AR')}
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* --- TAB: CHEQUES --- */}
      {activeTab === 'CHEQUES' && (
        <div className="space-y-6 animate-fade-in flex-1 overflow-y-auto pb-10">
             <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                <div className="flex gap-10">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total en Cartera</p>
                        <p className="text-3xl font-black text-slate-800 tracking-tighter">${checks.filter(c => c.status === 'CARTERA').reduce((acc, c) => acc + c.amount, 0).toLocaleString('es-AR')}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Próximos Vencimientos</p>
                        <p className="text-3xl font-black text-orange-600 tracking-tighter">${checks.filter(c => c.status === 'CARTERA' && (new Date(c.paymentDate).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000)).reduce((acc, c) => acc + c.amount, 0).toLocaleString('es-AR')}</p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsNewCheckModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center gap-3 transition-all active:scale-95">
                    <Plus size={20}/> Cargar Cheque Manual
                </button>
             </div>

             <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden flex flex-col flex-1">
                 <div className="p-8 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center gap-4">
                     <div className="relative flex-1 max-w-md">
                         <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                         <input type="text" placeholder="Buscar por banco, origen o número..." className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm" value={checkSearch} onChange={e => setCheckSearch(e.target.value)} />
                     </div>
                     <div className="flex bg-white p-1.5 rounded-xl border border-gray-200">
                         {['ALL', 'CARTERA', 'DEPOSITADO', 'ENTREGADO', 'RECHAZADO'].map(st => (
                             <button key={st} onClick={() => setCheckStatusFilter(st as any)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${checkStatusFilter === st ? 'bg-slate-900 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}>
                                 {st === 'ALL' ? 'Todos' : st}
                             </button>
                         ))}
                     </div>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-[10px] text-gray-400 uppercase font-black tracking-widest border-b border-gray-100">
                            <tr>
                                <th className="px-8 py-5">Banco / Nro / Tipo</th>
                                <th className="px-8 py-5">Origen (Cliente)</th>
                                <th className="px-8 py-5">Vencimiento</th>
                                <th className="px-8 py-5">Estado</th>
                                <th className="px-8 py-5 text-right">Importe</th>
                                <th className="px-8 py-5 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredChecks.map(check => (
                                <tr key={check.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-2xl ${check.type === 'ECHEQ' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>
                                                {check.type === 'ECHEQ' ? <Smartphone size={20}/> : <Scroll size={20}/>}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-800 uppercase tracking-tight text-sm leading-none mb-1">{check.bank}</p>
                                                <p className="text-[10px] text-gray-400 font-mono font-bold uppercase">Nro: {check.number}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="text-xs font-black text-slate-600 uppercase tracking-tight">{check.origin}</div>
                                        {check.issuerCuit && <div className="text-[10px] text-gray-400 font-mono font-bold">CUIT: {check.issuerCuit}</div>}
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-gray-400"/>
                                            <span className={`text-sm font-bold ${new Date(check.paymentDate).getTime() < new Date().getTime() && check.status === 'CARTERA' ? 'text-red-600 underline' : 'text-slate-600'}`}>{check.paymentDate}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${
                                            check.status === 'CARTERA' ? 'bg-green-50 text-green-700 border-green-100' : 
                                            check.status === 'ENTREGADO' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 
                                            check.status === 'DEPOSITADO' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                                            'bg-red-50 text-red-700 border-red-100'
                                        }`}>
                                            {check.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <p className="text-2xl font-black text-slate-900 tracking-tighter">${check.amount.toLocaleString('es-AR')}</p>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        {check.status === 'CARTERA' ? (
                                            <div className="flex justify-center gap-2">
                                                <button 
                                                    onClick={() => handleDepositCheck(check.id)}
                                                    className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition-all shadow-md"
                                                    title="Depositar en cuenta bancaria"
                                                >
                                                    <Landmark size={18}/>
                                                </button>
                                                <button 
                                                    onClick={() => handleOpenEndorse(check)}
                                                    className="bg-slate-900 text-white p-2.5 rounded-xl hover:bg-slate-800 transition-all shadow-md"
                                                    title="Usar / Endosar para pago"
                                                >
                                                    <Send size={18}/>
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                {check.status === 'ENTREGADO' ? (
                                                    <><Truck size={14} className="text-indigo-400 mb-1"/> {check.destination}</>
                                                ) : <span className="text-gray-200">SIN ACCIONES</span>}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
             </div>
        </div>
      )}

      {/* --- MODAL: CARGA DE CHEQUE MANUAL --- */}
      {isNewCheckModalOpen && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                  <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-white/20 rounded-2xl"><Scroll size={24}/></div>
                          <div>
                            <h3 className="font-black text-xl uppercase tracking-tighter leading-none">Cargar Nuevo Valor</h3>
                            <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mt-1">Ingreso Manual a Cartera</p>
                          </div>
                      </div>
                      <button onClick={() => setIsNewCheckModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28}/></button>
                  </div>
                  <div className="p-10 space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                          <button 
                            onClick={() => setCheckForm({...checkForm, type: 'FISICO'})}
                            className={`p-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${checkForm.type === 'FISICO' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-100 text-gray-400 hover:bg-gray-50'}`}>
                            <Scroll size={16}/> Cheque Físico
                          </button>
                          <button 
                            onClick={() => setCheckForm({...checkForm, type: 'ECHEQ'})}
                            className={`p-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${checkForm.type === 'ECHEQ' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-100 text-gray-400 hover:bg-gray-50'}`}>
                            <Smartphone size={16}/> E-Cheq
                          </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Banco Emisor</label>
                              <input type="text" className="w-full p-4 bg-gray-50 border-gray-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-600" placeholder="Ej: Galicia" value={checkForm.bank} onChange={e => setCheckForm({...checkForm, bank: e.target.value})} />
                          </div>
                          <div>
                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Número</label>
                              <input type="text" className="w-full p-4 bg-gray-50 border-gray-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-600" placeholder="00000000" value={checkForm.number} onChange={e => setCheckForm({...checkForm, number: e.target.value})} />
                          </div>
                      </div>

                      <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Origen (Quién lo entrega)</label>
                          <input type="text" className="w-full p-4 bg-gray-50 border-gray-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-600" placeholder="Nombre del cliente o razón social" value={checkForm.origin} onChange={e => setCheckForm({...checkForm, origin: e.target.value})} />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Importe ($)</label>
                              <input type="number" className="w-full p-4 bg-indigo-50 border-indigo-100 rounded-2xl font-black text-2xl text-indigo-700 outline-none" placeholder="0.00" value={checkForm.amount} onChange={e => setCheckForm({...checkForm, amount: parseFloat(e.target.value) || 0})} />
                          </div>
                          <div>
                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Vencimiento</label>
                              <input type="date" className="w-full p-4 bg-gray-50 border-gray-100 rounded-2xl font-bold text-slate-700 outline-none" value={checkForm.paymentDate} onChange={e => setCheckForm({...checkForm, paymentDate: e.target.value})} />
                          </div>
                      </div>

                      <button onClick={handleSaveNewCheck} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all active:scale-95">Ingresar a Cartera</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- MODAL: ENDOSO / USAR CHEQUE --- */}
      {isEndorseModalOpen && selectedCheckForAction && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                  <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-indigo-500 text-white rounded-2xl"><Send size={24}/></div>
                          <div>
                            <h3 className="font-black text-xl uppercase tracking-tighter leading-none">Endosar Valor</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Salida de Cartera</p>
                          </div>
                      </div>
                      <button onClick={() => setIsEndorseModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28}/></button>
                  </div>
                  <div className="p-10 space-y-6">
                      <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Resumen del Valor</p>
                          <p className="font-black text-indigo-900 text-lg uppercase tracking-tight">{selectedCheckForAction.bank} - Nº {selectedCheckForAction.number}</p>
                          <p className="text-2xl font-black text-indigo-700 mt-2">${selectedCheckForAction.amount.toLocaleString('es-AR')}</p>
                      </div>

                      <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Destinatario (Endosado a:)</label>
                          <div className="relative">
                              <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18}/>
                              <input 
                                type="text" 
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-gray-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-600" 
                                placeholder="Ej: Herramientas Global SA / Pago Flete" 
                                value={endorseData.destination} 
                                onChange={e => setEndorseData({...endorseData, destination: e.target.value})} 
                              />
                          </div>
                          <p className="text-[10px] text-gray-400 mt-2 italic px-2">Esta acción registrará el egreso del cheque del sistema.</p>
                      </div>

                      <button onClick={confirmEndorse} className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all active:scale-95">Confirmar Endoso y Salida</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- MODAL: MOVIMIENTO MANUAL (Cajas) --- */}
      {isManualEntryOpen && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                  <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-indigo-500 text-white rounded-2xl"><ArrowRightLeft size={24}/></div>
                          <div>
                            <h3 className="font-black text-xl uppercase tracking-tighter leading-none">Registrar Movimiento</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ajuste de Saldo Manual</p>
                          </div>
                      </div>
                      <button onClick={() => setIsManualEntryOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28}/></button>
                  </div>
                  
                  <div className="p-10 space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                          <button 
                            onClick={() => setManualForm({...manualForm, type: 'INCOME'})}
                            className={`p-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${manualForm.type === 'INCOME' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-100 text-gray-400 hover:bg-gray-50'}`}>
                            <ArrowDownLeft size={16}/> Ingreso (+)
                          </button>
                          <button 
                            onClick={() => setManualForm({...manualForm, type: 'EXPENSE'})}
                            className={`p-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${manualForm.type === 'EXPENSE' ? 'border-red-50 text-red-700' : 'border-gray-100 text-gray-400 hover:bg-gray-50'}`}>
                            <ArrowUpRight size={16}/> Egreso (-)
                          </button>
                      </div>

                      <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Caja de Destino / Origen</label>
                          <select className="w-full p-4 bg-gray-50 border-gray-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-slate-900" value={manualForm.cashRegisterId} onChange={e => setManualForm({...manualForm, cashRegisterId: e.target.value})}>
                              {registers.filter(r => r.isOpen).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                          </select>
                      </div>

                      <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Concepto del Movimiento</label>
                          <select className="w-full p-4 bg-gray-50 border-gray-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-slate-900" value={manualForm.subtype} onChange={e => setManualForm({...manualForm, subtype: e.target.value as any})}>
                              <option value="GASTO_VARIO">Gasto Vario / Reparaciones</option>
                              <option value="RETIRO_SOCIO">Retiro de Socio / Dueño</option>
                              <option value="PAGO_PROVEEDOR">Pago a Proveedor (Efectivo)</option>
                              <option value="COBRO_CTACTE">Cobranza Cliente</option>
                              <option value="OTRO">Otros Ajustes</option>
                          </select>
                      </div>

                      <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Importe ($)</label>
                          <input type="number" className={`w-full p-4 border-2 rounded-2xl font-black text-3xl tracking-tighter outline-none focus:ring-4 focus:ring-slate-50 transition-all ${manualForm.type === 'INCOME' ? 'border-green-100 text-green-700' : 'border-red-100 text-red-700'}`} placeholder="0.00" value={manualForm.amount} onChange={e => setManualForm({...manualForm, amount: parseFloat(e.target.value) || 0})} />
                      </div>

                      <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Motivo / Descripción</label>
                          <input type="text" className="w-full p-4 bg-gray-50 border-gray-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-slate-900" placeholder="Especifique el motivo del movimiento..." value={manualForm.description} onChange={e => setManualForm({...manualForm, description: e.target.value})} />
                      </div>

                      <button onClick={handleAddManualMovement} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all active:scale-95">Efectivizar Movimiento</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Treasury;
