import React, { useState, useEffect } from 'react';
import { Wallet, ArrowUpRight, ArrowDownLeft, ArrowRightLeft, CreditCard, Banknote, DollarSign, Calendar, Lock, CheckCircle, FileText, Plus, X, Save, Calculator, AlertTriangle, QrCode, Scroll, Smartphone } from 'lucide-react';
import { CashRegister, Check, TreasuryMovement } from '../types';

const Treasury: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'CAJAS' | 'MOVIMIENTOS' | 'CHEQUES'>('CAJAS');

  // --- PERSISTENCE LOGIC ---
  const defaultRegisters: CashRegister[] = [
    { id: '1', name: 'Caja Central', balance: 154200, isOpen: true },
    { id: '2', name: 'Caja Mostrador 1', balance: 45000, isOpen: false },
    { id: '3', name: 'Caja Chica Administración', balance: 12000, isOpen: true },
  ];

  const [registers, setRegisters] = useState<CashRegister[]>(() => {
      const saved = localStorage.getItem('ferrecloud_registers');
      return saved ? JSON.parse(saved) : defaultRegisters;
  });

  const [movements, setMovements] = useState<TreasuryMovement[]>(() => {
      const saved = localStorage.getItem('ferrecloud_movements');
      return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
      localStorage.setItem('ferrecloud_registers', JSON.stringify(registers));
  }, [registers]);

  useEffect(() => {
      localStorage.setItem('ferrecloud_movements', JSON.stringify(movements));
  }, [movements]);

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

      setRegisters(prev => prev.map(r => {
          if (r.id === movementForm.cashRegisterId) {
              const newBalance = movementForm.type === 'INCOME' 
                  ? r.balance + amountVal 
                  : r.balance - amountVal;
              return { ...r, balance: newBalance };
          }
          return r;
      }));

      setMovementForm({ ...movementForm, amount: '', description: '' });
      alert("Movimiento registrado correctamente.");
  };

  // --- TRANSFER LOGIC ---
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferData, setTransferData] = useState({ fromId: '', toId: '', amount: '' });

  const handleTransfer = () => {
      const amount = parseFloat(transferData.amount);
      if (!transferData.fromId || !transferData.toId || isNaN(amount) || amount <= 0) {
          alert("Verifique los datos de la transferencia");
          return;
      }
      const sourceReg = registers.find(r => r.id === transferData.fromId);
      if (!sourceReg || sourceReg.balance < amount) {
          alert("Saldo insuficiente en la caja de origen");
          return;
      }

      setRegisters(prev => prev.map(r => {
          if (r.id === transferData.fromId) return { ...r, balance: r.balance - amount };
          if (r.id === transferData.toId) return { ...r, balance: r.balance + amount };
          return r;
      }));

      const commonDesc = `Transferencia interna de ${sourceReg.name} a ${registers.find(r=>r.id===transferData.toId)?.name}`;
      const outMov: TreasuryMovement = { id: `TR-OUT-${Date.now()}`, date: new Date().toLocaleString(), type: 'EXPENSE', subtype: 'RETIRO_SOCIO', paymentMethod: 'EFECTIVO', amount: amount, description: commonDesc, cashRegisterId: transferData.fromId };
      const inMov: TreasuryMovement = { id: `TR-IN-${Date.now()}`, date: new Date().toLocaleString(), type: 'INCOME', subtype: 'GASTO_VARIO', paymentMethod: 'EFECTIVO', amount: amount, description: commonDesc, cashRegisterId: transferData.toId };

      setMovements([inMov, outMov, ...movements]);
      setIsTransferModalOpen(false);
      setTransferData({ fromId: '', toId: '', amount: '' });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Tesorería y Finanzas</h2>
          <p className="text-gray-500 text-sm">Control de cajas y movimientos de fondos con guardado local.</p>
        </div>
        <div className="flex gap-4">
             {activeTab === 'CAJAS' && (
                <button onClick={() => setIsAddRegisterOpen(true)} className="bg-ferre-orange text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-600 transition-colors shadow-sm text-sm font-medium">
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
        <div className="space-y-6 animate-fade-in">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {registers.map(reg => (
                  <div key={reg.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all relative overflow-hidden">
                      <div className="flex justify-between items-start mb-4">
                          <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg"><Wallet size={24} /></div>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${reg.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {reg.isOpen ? 'ABIERTA' : 'CERRADA'}
                          </span>
                      </div>
                      <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wide">{reg.name}</h3>
                      <p className="text-3xl font-bold text-gray-800 mt-2">${reg.balance.toLocaleString('es-AR')}</p>
                      <div className="mt-6 flex gap-2">
                          <button onClick={() => setActiveTab('MOVIMIENTOS')} className="flex-1 text-xs bg-ferre-dark text-white hover:bg-slate-800 py-2 rounded font-medium">Ver Movimientos</button>
                      </div>
                  </div>
              ))}
           </div>
           <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-full"><ArrowRightLeft size={24} /></div>
                    <div>
                        <h4 className="font-bold text-gray-800">Transferencia entre Cajas</h4>
                        <p className="text-sm text-gray-500">Mover fondos de forma segura entre tus cuentas.</p>
                    </div>
                </div>
                <button onClick={() => setIsTransferModalOpen(true)} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Nueva Transferencia</button>
           </div>
        </div>
      )}

      {activeTab === 'MOVIMIENTOS' && (
        <div className="flex gap-6 h-full animate-fade-in">
            <div className="w-1/3 bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><FileText size={18} /> Nuevo Movimiento</h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setMovementForm({ ...movementForm, type: 'INCOME' })} className={`py-2 border-2 rounded-lg text-xs flex items-center justify-center gap-1 transition-colors ${movementForm.type === 'INCOME' ? 'border-green-500 bg-green-50 text-green-700 font-bold' : 'border-gray-200 text-gray-600'}`}>RECIBO</button>
                        <button onClick={() => setMovementForm({ ...movementForm, type: 'EXPENSE' })} className={`py-2 border-2 rounded-lg text-xs flex items-center justify-center gap-1 transition-colors ${movementForm.type === 'EXPENSE' ? 'border-red-500 bg-red-50 text-red-700 font-bold' : 'border-gray-200 text-gray-600'}`}>ORDEN PAGO</button>
                    </div>
                    <select className="w-full border border-gray-300 rounded p-2 text-sm bg-white" value={movementForm.cashRegisterId} onChange={(e) => setMovementForm({...movementForm, cashRegisterId: e.target.value})}>
                        {registers.map(reg => <option key={reg.id} value={reg.id}>{reg.name}</option>)}
                    </select>
                    <input type="number" className="w-full border border-gray-300 rounded p-2 text-sm outline-none font-bold" placeholder="Monto $" value={movementForm.amount} onChange={(e) => setMovementForm({...movementForm, amount: e.target.value})}/>
                    <textarea className="w-full border border-gray-300 rounded p-2 text-sm outline-none h-20" placeholder="Descripción..." value={movementForm.description} onChange={(e) => setMovementForm({...movementForm, description: e.target.value})}></textarea>
                    <button onClick={handleCreateMovement} className={`w-full text-white font-bold py-3 rounded-lg shadow-md ${movementForm.type === 'INCOME' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>Registrar</button>
                </div>
            </div>
            <div className="w-2/3 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-gray-700">Historial Reciente</div>
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left">
                        <tbody className="divide-y divide-gray-100">
                            {movements.map(mov => (
                                <tr key={mov.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-xs text-gray-500">{mov.date}</td>
                                    <td className="px-6 py-4 text-sm text-gray-800">{mov.description}</td>
                                    <td className={`px-6 py-4 text-sm font-bold text-right ${mov.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
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

      {/* Modals are simplified to keep length focused on persistence */}
      {isAddRegisterOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-sm">
                  <h3 className="font-bold mb-4">Nueva Caja</h3>
                  <input type="text" className="w-full p-2 border rounded mb-4" placeholder="Nombre" value={newRegisterName} onChange={e => setNewRegisterName(e.target.value)} />
                  <button onClick={handleAddRegister} className="w-full bg-ferre-orange text-white py-2 rounded font-bold">Crear</button>
                  <button onClick={() => setIsAddRegisterOpen(false)} className="w-full mt-2 text-gray-500 text-sm">Cancelar</button>
              </div>
          </div>
      )}
      
      {isTransferModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-md">
                  <h3 className="font-bold mb-4">Transferencia</h3>
                  <select className="w-full p-2 border rounded mb-2" value={transferData.fromId} onChange={e => setTransferData({...transferData, fromId: e.target.value})}>
                      <option value="">Origen...</option>
                      {registers.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                  <select className="w-full p-2 border rounded mb-2" value={transferData.toId} onChange={e => setTransferData({...transferData, toId: e.target.value})}>
                      <option value="">Destino...</option>
                      {registers.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                  <input type="number" className="w-full p-2 border rounded mb-4" placeholder="Monto" value={transferData.amount} onChange={e => setTransferData({...transferData, amount: e.target.value})} />
                  <button onClick={handleTransfer} className="w-full bg-blue-600 text-white py-2 rounded font-bold">Transferir</button>
                  <button onClick={() => setIsTransferModalOpen(false)} className="w-full mt-2 text-gray-500 text-sm">Cancelar</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default Treasury;