
import React, { useState } from 'react';
import { Wallet, ArrowUpRight, ArrowDownLeft, ArrowRightLeft, CreditCard, Banknote, DollarSign, Calendar, Lock, CheckCircle, FileText, Plus, X, Save, Calculator, AlertTriangle, QrCode, Scroll, Smartphone } from 'lucide-react';
import { CashRegister, Check, TreasuryMovement } from '../types';

const Treasury: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'CAJAS' | 'MOVIMIENTOS' | 'CHEQUES'>('CAJAS');

  // MOCK DATA
  const [registers, setRegisters] = useState<CashRegister[]>([
    { id: '1', name: 'Caja Central', balance: 154200, isOpen: true },
    { id: '2', name: 'Caja Mostrador 1', balance: 45000, isOpen: false },
    { id: '3', name: 'Caja Chica Administración', balance: 12000, isOpen: true },
  ]);

  const [movements, setMovements] = useState<TreasuryMovement[]>([
    { id: 'M-001', date: '2023-10-26 10:30', type: 'INCOME', subtype: 'VENTA', paymentMethod: 'EFECTIVO', amount: 12500, description: 'Venta #FC-2024-002', cashRegisterId: '1' },
    { id: 'M-002', date: '2023-10-26 11:15', type: 'EXPENSE', subtype: 'GASTO_VARIO', paymentMethod: 'EFECTIVO', amount: 2500, description: 'Compra insumos limpieza', cashRegisterId: '3' },
    { id: 'M-003', date: '2023-10-26 12:00', type: 'INCOME', subtype: 'COBRO_CTACTE', paymentMethod: 'TRANSFERENCIA', amount: 50000, description: 'Recibo #REC-005 Constructora Norte', cashRegisterId: '1' },
    { id: 'M-004', date: '2023-10-26 12:30', type: 'INCOME', subtype: 'VENTA', paymentMethod: 'MERCADO_PAGO', amount: 25000, description: 'Venta #FC-2024-003', cashRegisterId: '1' },
    { id: 'M-005', date: '2023-10-26 13:00', type: 'INCOME', subtype: 'VENTA', paymentMethod: 'CHEQUE', amount: 15000, description: 'Venta #FC-2024-004', cashRegisterId: '1' },
  ]);

  const [checks] = useState<Check[]>([
    { id: 'CH-5542', bank: 'Banco Galicia', number: '55421100', amount: 125000, paymentDate: '2023-11-15', status: 'CARTERA', origin: 'Constructora Del Norte' },
    { id: 'CH-9921', bank: 'Banco Macro', number: '99213322', amount: 45000, paymentDate: '2023-10-30', status: 'DEPOSITADO', origin: 'Juan Perez' },
  ]);

  // --- ADD REGISTER LOGIC ---
  const [isAddRegisterOpen, setIsAddRegisterOpen] = useState(false);
  const [newRegisterName, setNewRegisterName] = useState('');
  const [newRegisterBalance, setNewRegisterBalance] = useState(0);

  const handleAddRegister = () => {
      if (!newRegisterName) return;
      const newReg: CashRegister = {
          id: Date.now().toString(),
          name: newRegisterName,
          balance: newRegisterBalance,
          isOpen: true
      };
      setRegisters([...registers, newReg]);
      setIsAddRegisterOpen(false);
      setNewRegisterName('');
      setNewRegisterBalance(0);
  };

  // --- NEW MOVEMENT FORM STATE ---
  const [movementForm, setMovementForm] = useState({
      type: 'INCOME' as 'INCOME' | 'EXPENSE',
      subtype: 'VENTA',
      paymentMethod: 'EFECTIVO' as TreasuryMovement['paymentMethod'],
      amount: '',
      description: '',
      cashRegisterId: '1'
  });

  const handleCreateMovement = () => {
      if (!movementForm.amount || !movementForm.description) {
          alert("Ingrese monto y descripción");
          return;
      }
      
      const amountVal = parseFloat(movementForm.amount);
      
      const newMov: TreasuryMovement = {
          id: `M-${Date.now()}`,
          date: new Date().toLocaleString(),
          type: movementForm.type,
          subtype: movementForm.subtype as any,
          paymentMethod: movementForm.paymentMethod,
          amount: amountVal,
          description: movementForm.description,
          cashRegisterId: movementForm.cashRegisterId
      };

      setMovements([newMov, ...movements]);

      // Update Register Balance
      setRegisters(prev => prev.map(r => {
          if (r.id === movementForm.cashRegisterId) {
              const newBalance = movementForm.type === 'INCOME' 
                  ? r.balance + amountVal 
                  : r.balance - amountVal;
              return { ...r, balance: newBalance };
          }
          return r;
      }));

      // Reset Form
      setMovementForm({ ...movementForm, amount: '', description: '' });
      alert("Movimiento registrado correctamente.");
  };

  // --- TRANSFER LOGIC ---
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferData, setTransferData] = useState({
      fromId: '',
      toId: '',
      amount: ''
  });

  const handleTransfer = () => {
      const amount = parseFloat(transferData.amount);
      if (!transferData.fromId || !transferData.toId || isNaN(amount) || amount <= 0) {
          alert("Verifique los datos de la transferencia");
          return;
      }
      if (transferData.fromId === transferData.toId) {
          alert("La caja de origen y destino no pueden ser la misma");
          return;
      }

      // Check balance
      const sourceReg = registers.find(r => r.id === transferData.fromId);
      if (!sourceReg || sourceReg.balance < amount) {
          alert("Saldo insuficiente en la caja de origen");
          return;
      }

      // Update Registers
      setRegisters(prev => prev.map(r => {
          if (r.id === transferData.fromId) return { ...r, balance: r.balance - amount };
          if (r.id === transferData.toId) return { ...r, balance: r.balance + amount };
          return r;
      }));

      // Log Movements (One Expense, One Income)
      const commonDesc = `Transferencia interna de ${sourceReg.name} a ${registers.find(r=>r.id===transferData.toId)?.name}`;
      
      const outMov: TreasuryMovement = {
          id: `TR-OUT-${Date.now()}`, date: new Date().toLocaleString(), type: 'EXPENSE', subtype: 'RETIRO_SOCIO', // Using existing types for simplicity or add TRANSFER type
          paymentMethod: 'EFECTIVO', amount: amount, description: commonDesc, cashRegisterId: transferData.fromId
      };
      const inMov: TreasuryMovement = {
          id: `TR-IN-${Date.now()}`, date: new Date().toLocaleString(), type: 'INCOME', subtype: 'GASTO_VARIO', // Using existing types for simplicity
          paymentMethod: 'EFECTIVO', amount: amount, description: commonDesc, cashRegisterId: transferData.toId
      };

      setMovements([inMov, outMov, ...movements]);
      setIsTransferModalOpen(false);
      setTransferData({ fromId: '', toId: '', amount: '' });
      alert("Transferencia realizada con éxito.");
  };

  // --- OPEN/CLOSE REGISTER LOGIC ---
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [selectedRegister, setSelectedRegister] = useState<CashRegister | null>(null);
  const [closureValues, setClosureValues] = useState({
      EFECTIVO: { system: 0, real: 0 },
      MERCADO_PAGO: { system: 0, real: 0 },
      TRANSFERENCIA: { system: 0, real: 0 },
      CHEQUE: { system: 0, real: 0 },
      ECHEQ: { system: 0, real: 0 }
  });

  const handleOpenRegister = (registerId: string) => {
      if(confirm('¿Confirmar apertura de caja?')) {
          setRegisters(prev => prev.map(r => r.id === registerId ? { ...r, isOpen: true } : r));
      }
  };

  const openCloseModal = (register: CashRegister) => {
      // Calculate System Totals based on movements for this register
      const relevantMovements = movements.filter(m => m.cashRegisterId === register.id);
      
      const newClosureValues = {
          EFECTIVO: { system: 0, real: 0 },
          MERCADO_PAGO: { system: 0, real: 0 },
          TRANSFERENCIA: { system: 0, real: 0 },
          CHEQUE: { system: 0, real: 0 },
          ECHEQ: { system: 0, real: 0 }
      };

      // Add dummy starting balance to Cash for realism
      newClosureValues.EFECTIVO.system += 5000; 

      relevantMovements.forEach(m => {
          if (m.type === 'INCOME') {
              if (newClosureValues[m.paymentMethod]) {
                  newClosureValues[m.paymentMethod].system += m.amount;
              }
          } else {
              // Expense usually only cash or transfer
              if (m.paymentMethod === 'EFECTIVO' || m.paymentMethod === 'TRANSFERENCIA') {
                  newClosureValues[m.paymentMethod].system -= m.amount;
              }
          }
      });

      // Pre-fill real with system (user will edit)
      Object.keys(newClosureValues).forEach(key => {
          newClosureValues[key as keyof typeof newClosureValues].real = newClosureValues[key as keyof typeof newClosureValues].system;
      });

      setClosureValues(newClosureValues);
      setSelectedRegister(register);
      setIsCloseModalOpen(true);
  };

  const handleRealValueChange = (method: keyof typeof closureValues, value: number) => {
      setClosureValues(prev => ({
          ...prev,
          [method]: { ...prev[method], real: value }
      }));
  };

  const handleConfirmClose = () => {
      if (!selectedRegister) return;
      setRegisters(prev => prev.map(r => r.id === selectedRegister.id ? { ...r, isOpen: false } : r));
      setIsCloseModalOpen(false);
      alert(`Caja "${selectedRegister.name}" cerrada correctamente.`);
  };

  const getTotalDifference = () => {
      let totalDiff = 0;
      (Object.keys(closureValues) as Array<keyof typeof closureValues>).forEach(key => {
          totalDiff += (closureValues[key].real - closureValues[key].system);
      });
      return totalDiff;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Tesorería y Finanzas</h2>
          <p className="text-gray-500 text-sm">Control de cajas, bancos, cheques y movimientos de fondos.</p>
        </div>
        <div className="flex gap-4">
             {activeTab === 'CAJAS' && (
                <button 
                    onClick={() => setIsAddRegisterOpen(true)}
                    className="bg-ferre-orange text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-600 transition-colors shadow-sm text-sm font-medium">
                    <Plus size={16} /> Nueva Caja
                </button>
             )}
            <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
            <button onClick={() => setActiveTab('CAJAS')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'CAJAS' ? 'bg-yellow-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>Cajas</button>
            <button onClick={() => setActiveTab('MOVIMIENTOS')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'MOVIMIENTOS' ? 'bg-yellow-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>Ordenes y Recibos</button>
            <button onClick={() => setActiveTab('CHEQUES')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'CHEQUES' ? 'bg-yellow-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>Cartera de Cheques</button>
            </div>
        </div>
      </div>

      {activeTab === 'CAJAS' && (
        <div className="space-y-6">
           {/* Cards Cajas */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {registers.map(reg => (
                  <div key={reg.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all relative overflow-hidden">
                      <div className={`absolute top-0 right-0 w-20 h-20 bg-yellow-400 rounded-bl-full opacity-10 -mr-4 -mt-4`}></div>
                      <div className="flex justify-between items-start mb-4">
                          <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg">
                              <Wallet size={24} />
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${reg.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {reg.isOpen ? 'ABIERTA' : 'CERRADA'}
                          </span>
                      </div>
                      <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wide">{reg.name}</h3>
                      <p className="text-3xl font-bold text-gray-800 mt-2">${reg.balance.toLocaleString('es-AR')}</p>
                      
                      <div className="mt-6 flex gap-2">
                          {reg.isOpen ? (
                            <button 
                                onClick={() => openCloseModal(reg)}
                                className="flex-1 text-xs bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 py-2 rounded font-medium flex items-center justify-center gap-1 transition-colors">
                                <Lock size={12}/> Arqueo / Cierre
                            </button>
                          ) : (
                            <button 
                                onClick={() => handleOpenRegister(reg.id)}
                                className="flex-1 text-xs bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 py-2 rounded font-medium flex items-center justify-center gap-1 transition-colors">
                                <CheckCircle size={12}/> Abrir Caja
                            </button>
                          )}
                          <button 
                            onClick={() => setActiveTab('MOVIMIENTOS')}
                            className="flex-1 text-xs bg-ferre-dark text-white hover:bg-slate-800 py-2 rounded font-medium">
                              Ver Movimientos
                          </button>
                      </div>
                  </div>
              ))}
           </div>
           
           {/* Transfer Quick Action */}
           <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                        <ArrowRightLeft size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800">Transferencia entre Cajas</h4>
                        <p className="text-sm text-gray-500">Mover efectivo de caja recaudadora a caja central.</p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsTransferModalOpen(true)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                    Nueva Transferencia
                </button>
           </div>
        </div>
      )}

      {activeTab === 'MOVIMIENTOS' && (
        <div className="flex gap-6 h-full">
            {/* New Movement Form */}
            <div className="w-1/3 bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <FileText size={18} /> Nuevo Movimiento
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Tipo de Comprobante</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                onClick={() => setMovementForm({ ...movementForm, type: 'INCOME' })}
                                className={`py-2 border-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors ${movementForm.type === 'INCOME' ? 'border-green-500 bg-green-50 text-green-700 font-bold' : 'border-gray-200 hover:border-green-200 text-gray-600'}`}>
                                <ArrowDownLeft size={16}/> RECIBO (Ingreso)
                            </button>
                            <button 
                                onClick={() => setMovementForm({ ...movementForm, type: 'EXPENSE' })}
                                className={`py-2 border-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors ${movementForm.type === 'EXPENSE' ? 'border-red-500 bg-red-50 text-red-700 font-bold' : 'border-gray-200 hover:border-red-200 text-gray-600'}`}>
                                <ArrowUpRight size={16}/> ORDEN PAGO (Egreso)
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Caja Afectada</label>
                        <select 
                            className="w-full border border-gray-300 rounded p-2 text-sm bg-white outline-none focus:border-yellow-500"
                            value={movementForm.cashRegisterId}
                            onChange={(e) => setMovementForm({...movementForm, cashRegisterId: e.target.value})}
                        >
                            {registers.map(reg => (
                                <option key={reg.id} value={reg.id}>{reg.name} (Saldo: ${reg.balance})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Concepto</label>
                        <select 
                            className="w-full border border-gray-300 rounded p-2 text-sm bg-white outline-none focus:border-yellow-500"
                            value={movementForm.subtype}
                            onChange={(e) => setMovementForm({...movementForm, subtype: e.target.value as any})}
                        >
                            <option value="VENTA">Venta</option>
                            <option value="COBRO_CTACTE">Cobro a Cliente (Cta Cte)</option>
                            <option value="PAGO_PROVEEDOR">Pago a Proveedor</option>
                            <option value="GASTO_VARIO">Gasto Vario / Insumos</option>
                            <option value="RETIRO_SOCIO">Retiro de Socio / Capital</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Monto</label>
                        <div className="relative">
                             <DollarSign size={14} className="absolute left-3 top-3 text-gray-400"/>
                             <input 
                                type="number" 
                                className="w-full border border-gray-300 rounded p-2 pl-8 text-sm outline-none focus:border-yellow-500 font-bold" 
                                placeholder="0.00" 
                                value={movementForm.amount}
                                onChange={(e) => setMovementForm({...movementForm, amount: e.target.value})}
                             />
                        </div>
                    </div>
                    <div>
                         <label className="block text-xs font-bold text-gray-600 mb-1">Descripción / Referencia</label>
                         <textarea 
                            className="w-full border border-gray-300 rounded p-2 text-sm outline-none h-20 focus:border-yellow-500" 
                            placeholder="Detalle del movimiento..."
                            value={movementForm.description}
                            onChange={(e) => setMovementForm({...movementForm, description: e.target.value})}
                         ></textarea>
                    </div>
                    <button 
                        onClick={handleCreateMovement}
                        className={`w-full text-white font-bold py-3 rounded-lg mt-2 shadow-md transition-colors ${movementForm.type === 'INCOME' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                        Registrar Movimiento
                    </button>
                </div>
            </div>

            <div className="w-2/3 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-gray-700">Últimos Movimientos</div>
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200 sticky top-0">
                            <tr>
                                <th className="px-6 py-3">Fecha</th>
                                <th className="px-6 py-3">Tipo</th>
                                <th className="px-6 py-3">Medio</th>
                                <th className="px-6 py-3">Descripción</th>
                                <th className="px-6 py-3 text-right">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {movements.map(mov => (
                                <tr key={mov.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-3 text-sm text-gray-600">{mov.date}</td>
                                    <td className="px-6 py-3">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${mov.type === 'INCOME' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {mov.subtype.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-xs text-gray-500 uppercase font-medium">{mov.paymentMethod.replace('_', ' ')}</td>
                                    <td className="px-6 py-3 text-sm text-gray-800">{mov.description}</td>
                                    <td className={`px-6 py-3 text-sm font-bold text-right ${mov.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                                        {mov.type === 'INCOME' ? '+' : '-'}${mov.amount.toLocaleString('es-AR')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'CHEQUES' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                 <h3 className="font-bold text-gray-800">Cartera de Cheques de Terceros</h3>
                 <button className="bg-ferre-dark text-white px-4 py-2 rounded-lg text-sm font-medium">Ingresar Cheque</button>
             </div>
             <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr>
                        <th className="px-6 py-3">Banco / Nro</th>
                        <th className="px-6 py-3">Emisor / Origen</th>
                        <th className="px-6 py-3">Fecha Pago</th>
                        <th className="px-6 py-3">Estado</th>
                        <th className="px-6 py-3 text-right">Monto</th>
                        <th className="px-6 py-3 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {checks.map(check => (
                        <tr key={check.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                                <div className="font-bold text-gray-800 text-sm">{check.bank}</div>
                                <div className="font-mono text-xs text-gray-500">{check.number}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">{check.origin}</td>
                            <td className="px-6 py-4 text-sm text-gray-600 flex items-center gap-2">
                                <Calendar size={14}/> {check.paymentDate}
                            </td>
                            <td className="px-6 py-4">
                                 <span className={`text-xs font-bold px-2 py-1 rounded-full ${check.status === 'CARTERA' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {check.status}
                                 </span>
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-gray-800">${check.amount.toLocaleString('es-AR')}</td>
                            <td className="px-6 py-4 text-center">
                                <button className="text-blue-600 hover:text-blue-800 text-xs font-medium border border-blue-200 bg-blue-50 px-2 py-1 rounded">Depositar / Usar</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
             </table>
        </div>
      )}

      {/* --- MODAL NUEVA CAJA --- */}
      {isAddRegisterOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
                  <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
                      <h3 className="font-bold text-gray-800">Nueva Caja</h3>
                      <button onClick={() => setIsAddRegisterOpen(false)}><X size={20} className="text-gray-400 hover:text-gray-600"/></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Nombre Identificatorio</label>
                          <input type="text" className="w-full p-2 border rounded focus:ring-1 focus:ring-ferre-orange outline-none" placeholder="Ej: Caja Sucursal 2" value={newRegisterName} onChange={e => setNewRegisterName(e.target.value)} />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Saldo Inicial (Efectivo)</label>
                          <input type="number" className="w-full p-2 border rounded focus:ring-1 focus:ring-ferre-orange outline-none" placeholder="0.00" value={newRegisterBalance} onChange={e => setNewRegisterBalance(parseFloat(e.target.value))} />
                      </div>
                      <button onClick={handleAddRegister} className="w-full bg-ferre-orange text-white py-2 rounded-lg font-bold hover:bg-orange-600 mt-2">Crear Caja</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- MODAL TRANSFERENCIA --- */}
      {isTransferModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                  <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-blue-600 text-white">
                      <h3 className="font-bold text-lg flex items-center gap-2"><ArrowRightLeft size={20}/> Nueva Transferencia</h3>
                      <button onClick={() => setIsTransferModalOpen(false)}><X size={20} className="text-blue-200 hover:text-white"/></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Caja Origen (Sale dinero)</label>
                          <select 
                            className="w-full p-2 border border-gray-300 rounded text-sm bg-white"
                            value={transferData.fromId}
                            onChange={(e) => setTransferData({...transferData, fromId: e.target.value})}
                          >
                              <option value="">Seleccionar Origen...</option>
                              {registers.map(r => (
                                  <option key={r.id} value={r.id}>{r.name} (${r.balance.toLocaleString()})</option>
                              ))}
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Caja Destino (Entra dinero)</label>
                          <select 
                            className="w-full p-2 border border-gray-300 rounded text-sm bg-white"
                            value={transferData.toId}
                            onChange={(e) => setTransferData({...transferData, toId: e.target.value})}
                          >
                              <option value="">Seleccionar Destino...</option>
                              {registers.map(r => (
                                  <option key={r.id} value={r.id}>{r.name} (${r.balance.toLocaleString()})</option>
                              ))}
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Monto a Transferir</label>
                          <div className="relative">
                              <DollarSign size={14} className="absolute left-3 top-3 text-gray-400"/>
                              <input 
                                type="number" 
                                className="w-full p-2 pl-8 border border-gray-300 rounded font-bold text-lg focus:ring-1 focus:ring-blue-500 outline-none" 
                                placeholder="0.00"
                                value={transferData.amount}
                                onChange={(e) => setTransferData({...transferData, amount: e.target.value})}
                              />
                          </div>
                      </div>
                      <button 
                        onClick={handleTransfer}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-md mt-2 transition-colors">
                          Confirmar Transferencia
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* --- MODAL CIERRE DE CAJA --- */}
      {isCloseModalOpen && selectedRegister && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-auto">
                  <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-slate-900 text-white rounded-t-xl">
                      <div>
                        <h3 className="font-bold text-lg flex items-center gap-2"><Lock size={18}/> Arqueo y Cierre de Caja</h3>
                        <p className="text-xs text-gray-400">{selectedRegister.name} | {new Date().toLocaleDateString()}</p>
                      </div>
                      <button onClick={() => setIsCloseModalOpen(false)}><X size={20} className="text-gray-400 hover:text-white"/></button>
                  </div>
                  
                  <div className="p-6">
                      <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg mb-6 text-sm text-blue-800 flex items-center gap-2">
                          <Calculator size={16}/>
                          El sistema ha calculado los totales según las ventas y cobros registrados hoy. Por favor, ingrese los valores reales (contados) para validar el cierre.
                      </div>

                      <table className="w-full text-left mb-6">
                          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                              <tr>
                                  <th className="px-4 py-3">Medio de Pago</th>
                                  <th className="px-4 py-3 text-right">Sistema (Esperado)</th>
                                  <th className="px-4 py-3 text-right bg-yellow-50/50">Recuento Real</th>
                                  <th className="px-4 py-3 text-right">Diferencia</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-sm">
                              {(Object.keys(closureValues) as Array<keyof typeof closureValues>).map(method => (
                                  <tr key={method}>
                                      <td className="px-4 py-3 font-medium text-gray-700">{(method as string).replace('_', ' ')}</td>
                                      <td className="px-4 py-3 text-right text-gray-500">${closureValues[method].system.toLocaleString('es-AR')}</td>
                                      <td className="px-4 py-3 text-right bg-yellow-50/50">
                                          <input 
                                            type="number" 
                                            className="w-28 text-right p-1 border border-gray-300 rounded focus:ring-1 focus:ring-ferre-orange outline-none bg-white"
                                            value={closureValues[method].real}
                                            onChange={(e) => handleRealValueChange(method, parseFloat(e.target.value) || 0)}
                                          />
                                      </td>
                                      <td className={`px-4 py-3 text-right font-bold ${
                                          (closureValues[method].real - closureValues[method].system) === 0 ? 'text-gray-400' : 
                                          (closureValues[method].real - closureValues[method].system) > 0 ? 'text-green-600' : 'text-red-600'
                                      }`}>
                                          ${(closureValues[method].real - closureValues[method].system).toLocaleString('es-AR')}
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>

                      <div className="flex justify-end items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="text-right">
                              <p className="text-xs font-bold text-gray-500 uppercase">Diferencia Total</p>
                              <p className={`text-xl font-bold ${getTotalDifference() === 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {getTotalDifference() > 0 ? '+' : ''}${getTotalDifference().toLocaleString('es-AR')}
                              </p>
                          </div>
                          <div className="h-8 w-px bg-gray-300"></div>
                          <button 
                            onClick={handleConfirmClose}
                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-red-900/20">
                              <Lock size={18}/> Confirmar Cierre del Día
                          </button>
                      </div>
                      {getTotalDifference() !== 0 && (
                          <div className="mt-2 text-xs text-center text-red-500 flex items-center justify-center gap-1">
                              <AlertTriangle size={12}/> Se registrará un movimiento de ajuste automático por la diferencia.
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Treasury;
