import React, { useState } from 'react';
import { 
  Wallet, ArrowRightLeft, History, Landmark, CreditCard, 
  Bell, Plus, Filter, MoreVertical, TrendingUp, TrendingDown,
  X, CheckCircle2, AlertCircle, Building2, Smartphone
} from 'lucide-react';

interface Box {
  id: string;
  name: string;
  balance: number;
  type: 'efectivo' | 'banco' | 'virtual';
}

interface CashMovement {
  id: string;
  date: string;
  box: string;
  desc: string;
  amount: number;
  type: 'in' | 'out';
}

// Fix: Changed from default export to named export for the Cashier component
export const Cashier: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'movimientos' | 'cartera' | 'config'>('movimientos');
  const [showCreateBoxModal, setShowCreateBoxModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Dynamic Boxes State
  const [boxes, setBoxes] = useState<Box[]>([
    { id: '1', name: 'Caja Mostrador 01', balance: 142500, type: 'efectivo' },
    { id: '2', name: 'Caja Administración', balance: 1205000, type: 'efectivo' },
    { id: '3', name: 'Banco Nación', balance: 450000, type: 'banco' },
  ]);

  // Movements State
  const [movements, setMovements] = useState<CashMovement[]>([
    { id: 'm1', date: 'Hoy 14:20', box: 'Caja Mostrador 01', desc: 'Venta #4829 - Efectivo', amount: 4500, type: 'in' },
    { id: 'm2', date: 'Hoy 11:15', box: 'Caja Administración', desc: 'Pago Proveedor Sinteplast - Transf.', amount: 85000, type: 'out' },
  ]);

  // Transfer Form State
  const [transferData, setTransferData] = useState({
    originId: '',
    destinationId: '',
    amount: 0,
    note: ''
  });

  // Create Box Form State
  const [newBoxData, setNewBoxData] = useState<Partial<Box>>({
    name: '',
    balance: 0,
    type: 'efectivo'
  });

  const handleCreateBox = () => {
    if (!newBoxData.name) return;
    const newBox: Box = {
      id: Date.now().toString(),
      name: newBoxData.name,
      balance: newBoxData.balance || 0,
      type: newBoxData.type as any || 'efectivo'
    };
    setBoxes([...boxes, newBox]);
    setShowCreateBoxModal(false);
    setNewBoxData({ name: '', balance: 0, type: 'efectivo' });
  };

  const handleTransfer = () => {
    const { originId, destinationId, amount } = transferData;
    if (!originId || !destinationId || amount <= 0 || originId === destinationId) {
      alert("Verifique los datos de la transferencia");
      return;
    }

    const originBox = boxes.find(b => b.id === originId);
    if (originBox && originBox.balance < amount) {
      alert("Saldo insuficiente en la caja de origen");
      return;
    }

    // Update box balances
    setBoxes(boxes.map(b => {
      if (b.id === originId) return { ...b, balance: b.balance - amount };
      if (b.id === destinationId) return { ...b, balance: b.balance + amount };
      return b;
    }));

    // Record movements
    const dateStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const originName = boxes.find(b => b.id === originId)?.name;
    const destName = boxes.find(b => b.id === destinationId)?.name;

    const outMov: CashMovement = {
      id: `tout-${Date.now()}`,
      date: `Hoy ${dateStr}`,
      box: originName || '',
      desc: `Transferencia a ${destName} ${transferData.note ? `(${transferData.note})` : ''}`,
      amount: amount,
      type: 'out'
    };

    const inMov: CashMovement = {
      id: `tin-${Date.now()}`,
      date: `Hoy ${dateStr}`,
      box: destName || '',
      desc: `Transferencia desde ${originName} ${transferData.note ? `(${transferData.note})` : ''}`,
      amount: amount,
      type: 'in'
    };

    setMovements([outMov, inMov, ...movements]);
    setShowTransferModal(false);
    setTransferData({ originId: '', destinationId: '', amount: 0, note: '' });
  };

  const totalConsolidated = boxes.reduce((acc, box) => acc + box.balance, 0);

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Cajas y Tesorería</h1>
          <p className="text-slate-500">Gestiona tus fondos, realiza transferencias internas y controla movimientos.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowTransferModal(true)}
            className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all text-slate-700 shadow-sm"
          >
            <ArrowRightLeft className="w-5 h-5 text-orange-600" /> Transferir Fondos
          </button>
          <button 
            onClick={() => setShowCreateBoxModal(true)}
            className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-700 shadow-lg shadow-orange-600/20"
          >
            <Plus className="w-5 h-5" /> Crear Nueva Caja
          </button>
        </div>
      </header>

      <div className="flex gap-4 border-b border-slate-200">
        {[
          { id: 'movimientos', label: 'Cajas y Movimientos', icon: Wallet },
          { id: 'cartera', label: 'Cartera de Cheques', icon: Landmark },
          { id: 'config', label: 'Formas de Cobro/Pago', icon: CreditCard },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 ${
              activeTab === tab.id ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'movimientos' && (
        <div className="space-y-6">
          {/* Box List Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {boxes.map(box => (
              <div key={box.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl ${
                    box.type === 'banco' ? 'bg-blue-100 text-blue-600' : 
                    box.type === 'virtual' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'
                  }`}>
                    {box.type === 'banco' ? <Building2 className="w-5 h-5" /> : 
                     box.type === 'virtual' ? <Smartphone className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
                  </div>
                  <button className="text-slate-300 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{box.type}</p>
                <h4 className="font-bold text-slate-800 text-lg mb-1">{box.name}</h4>
                <p className="text-2xl font-black text-slate-900">${box.balance.toLocaleString()}</p>
                <div className="mt-4 pt-4 border-t border-slate-50 flex gap-2">
                  <button className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-[10px] font-bold text-slate-600 transition-colors uppercase">Historial</button>
                  <button className="flex-1 py-2 bg-orange-50 hover:bg-orange-100 rounded-xl text-[10px] font-bold text-orange-600 transition-colors uppercase">Arqueo</button>
                </div>
              </div>
            ))}
            
            <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 shadow-xl text-white flex flex-col justify-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tesorería General</p>
              <p className="text-xs text-slate-500 mb-2">Total Consolidado de Cajas</p>
              <h3 className="text-3xl font-black text-orange-500">${totalConsolidated.toLocaleString()}</h3>
              <div className="mt-4 flex items-center gap-2 text-[10px] text-green-400 font-bold uppercase">
                <TrendingUp className="w-3 h-3" /> Fondos Operativos 100%
              </div>
            </div>
          </div>

          {/* Last Movements Table */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
              <h4 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <History className="w-5 h-5 text-orange-600" /> Registro de Movimientos Recientes
              </h4>
              <div className="flex gap-2">
                <button className="p-2 text-slate-400 hover:text-orange-600 hover:bg-white rounded-xl transition-all"><Filter className="w-5 h-5" /></button>
                <button className="px-4 py-2 bg-white text-xs font-bold text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all">Ver Todo</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-4">Fecha / Hora</th>
                    <th className="px-8 py-4">Caja Afectada</th>
                    <th className="px-8 py-4">Concepto / Referencia</th>
                    <th className="px-8 py-4 text-right">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.map((m) => (
                    <tr key={m.id} className="text-sm hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5 text-slate-500 font-medium">{m.date}</td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-600 uppercase">
                          {m.box}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-slate-700 font-medium">{m.desc}</td>
                      <td className={`px-8 py-5 text-right font-black text-lg ${m.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                        {m.type === 'in' ? '+' : '-'} ${Math.abs(m.amount).toLocaleString()}
                        {m.type === 'in' ? <TrendingUp className="inline w-4 h-4 ml-2" /> : <TrendingDown className="inline w-4 h-4 ml-2" />}
                      </td>
                    </tr>
                  ))}
                  {movements.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center">
                        <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Sin movimientos registrados</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW BOX */}
      {showCreateBoxModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-600/20">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Crear Nueva Caja</h2>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Alta de punto de tesorería</p>
                </div>
              </div>
              <button onClick={() => setShowCreateBoxModal(false)} className="p-2 hover:bg-white border border-transparent hover:border-slate-200 rounded-xl transition-all text-slate-400">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre de la Caja / Cuenta</label>
                <input 
                  type="text"
                  placeholder="Ej: Caja Sucursal Norte, Banco Galicia, etc."
                  className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-slate-800 bg-slate-50/50 shadow-sm"
                  value={newBoxData.name}
                  onChange={(e) => setNewBoxData({...newBoxData, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Fondo</label>
                  <select 
                    className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-slate-800 bg-slate-50/50 shadow-sm"
                    value={newBoxData.type}
                    onChange={(e) => setNewBoxData({...newBoxData, type: e.target.value as any})}
                  >
                    <option value="efectivo">Efectivo / Físico</option>
                    <option value="banco">Cuenta Bancaria</option>
                    <option value="virtual">Billetera Virtual</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Saldo Inicial ($)</label>
                  <input 
                    type="number"
                    placeholder="0.00"
                    className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-black text-orange-600 bg-slate-50/50 shadow-sm"
                    value={newBoxData.balance || ''}
                    onChange={(e) => setNewBoxData({...newBoxData, balance: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button 
                onClick={() => setShowCreateBoxModal(false)}
                className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-500 hover:bg-white transition-all uppercase text-xs tracking-widest"
              >
                Cancelar
              </button>
              <button 
                onClick={handleCreateBox}
                className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black shadow-xl shadow-orange-600/20 hover:bg-orange-500 transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-widest"
              >
                Guardar Caja <CheckCircle2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TRANSFER FUNDS */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-orange-600 text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 text-white rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <ArrowRightLeft className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">Transferencia Interna</h2>
                  <p className="text-orange-100 text-[10px] font-bold uppercase tracking-widest mt-1">Movimiento de fondos entre cajas</p>
                </div>
              </div>
              <button onClick={() => setShowTransferModal(false)} className="p-2 hover:bg-orange-700 rounded-xl transition-all text-white/70 hover:text-white">
                <X className="w-7 h-7" />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6 relative">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Origen de Fondos</label>
                  <select 
                    className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-slate-800 bg-slate-50 shadow-sm"
                    value={transferData.originId}
                    onChange={(e) => setTransferData({...transferData, originId: e.target.value})}
                  >
                    <option value="">Seleccione Origen</option>
                    {boxes.map(b => (
                      <option key={b.id} value={b.id}>{b.name} (${b.balance.toLocaleString()})</option>
                    ))}
                  </select>
                </div>
                
                <div className="absolute left-1/2 top-[60%] -translate-x-1/2 -translate-y-1/2 z-10 p-2 bg-orange-600 text-white rounded-full border-4 border-white shadow-xl">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Destino de Fondos</label>
                  <select 
                    className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-slate-800 bg-slate-50 shadow-sm"
                    value={transferData.destinationId}
                    onChange={(e) => setTransferData({...transferData, destinationId: e.target.value})}
                  >
                    <option value="">Seleccione Destino</option>
                    {boxes.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Monto a Transferir ($)</label>
                <input 
                  type="number"
                  placeholder="0.00"
                  className="w-full px-6 py-5 border border-slate-200 rounded-[1.5rem] focus:ring-2 focus:ring-orange-500 outline-none font-black text-3xl text-center text-slate-900 bg-slate-50 shadow-inner"
                  value={transferData.amount || ''}
                  onChange={(e) => setTransferData({...transferData, amount: parseFloat(e.target.value) || 0})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Motivo / Nota (Opcional)</label>
                <input 
                  type="text"
                  placeholder="Ej: Reposición de caja chica, Cierre de día, etc."
                  className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-medium text-slate-700 bg-slate-50 shadow-sm"
                  value={transferData.note}
                  onChange={(e) => setTransferData({...transferData, note: e.target.value})}
                />
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button 
                onClick={() => setShowTransferModal(false)}
                className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl">Cancelar</button>
              <button 
                onClick={handleTransfer}
                className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black shadow-xl shadow-orange-600/20 hover:bg-orange-500 transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-widest"
              >
                Confirmar Transferencia <CheckCircle2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Fix: Removed the default export statement
// export default Cashier;
