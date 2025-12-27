
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Calendar, DollarSign, Filter, ArrowUpRight, ArrowDownLeft, X, Save, Wallet } from 'lucide-react';
import { DailyExpense, CashRegister } from '../types';

const DailyMovements: React.FC = () => {
    // --- CARGA DE CAJAS (Compartidas con Treasury) ---
    const [registers] = useState<CashRegister[]>(() => {
        const saved = localStorage.getItem('ferrecloud_registers');
        return saved ? JSON.parse(saved) : [
            { id: '1', name: 'Caja Mostrador Principal', balance: 154200, isOpen: true },
            { id: '2', name: 'Caja Administración', balance: 45000, isOpen: true },
            { id: '3', name: 'Caja Sucursal Norte', balance: 12000, isOpen: false },
        ];
    });

    const [movements, setMovements] = useState<DailyExpense[]>(() => {
        const saved = localStorage.getItem('daily_movements');
        return saved ? JSON.parse(saved) : [
            { id: '1', date: new Date().toISOString().split('T')[0], description: 'Alquiler Local Octubre', amount: 350000, category: 'FIXED', paymentMethod: 'TRANSFERENCIA', type: 'EXPENSE', cashRegisterId: '2' },
            { id: '2', date: new Date().toISOString().split('T')[0], description: 'Compra Art. Limpieza', amount: 12500, category: 'VARIABLE', paymentMethod: 'EFECTIVO', type: 'EXPENSE', cashRegisterId: '1' }
        ];
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<DailyExpense & { cashRegisterId: string }>>({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: 0,
        category: 'VARIABLE',
        paymentMethod: 'EFECTIVO',
        type: 'EXPENSE',
        cashRegisterId: registers[0]?.id || ''
    });

    useEffect(() => {
        localStorage.setItem('daily_movements', JSON.stringify(movements));
    }, [movements]);

    const handleSave = () => {
        if (!formData.description || !formData.amount || !formData.cashRegisterId) {
            alert("Por favor complete descripción, monto y seleccione una caja.");
            return;
        }
        const newMovement: DailyExpense = {
            ...formData as DailyExpense,
            id: Date.now().toString()
        };
        setMovements([newMovement, ...movements]);
        setIsModalOpen(false);
        setFormData({
            date: new Date().toISOString().split('T')[0],
            description: '',
            amount: 0,
            category: 'VARIABLE',
            paymentMethod: 'EFECTIVO',
            type: 'EXPENSE',
            cashRegisterId: registers[0]?.id || ''
        });
    };

    const deleteMovement = (id: string) => {
        if (confirm('¿Eliminar este movimiento?')) {
            setMovements(movements.filter(m => m.id !== id));
        }
    };

    const totals = movements.reduce((acc, m) => {
        if (m.type === 'EXPENSE') {
            if (m.category === 'FIXED') acc.fixed += m.amount;
            else acc.variable += m.amount;
        } else {
            acc.income += m.amount;
        }
        return acc;
    }, { fixed: 0, variable: 0, income: 0 });

    return (
        <div className="p-8 max-w-7xl mx-auto h-full flex flex-col space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Gastos y Movimientos Diarios</h2>
                    <p className="text-gray-500 text-sm font-medium italic">Registra salidas de dinero por mantenimiento, servicios y costos fijos.</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-ferre-orange text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-orange-900/10 hover:bg-orange-600 transition-all uppercase text-xs tracking-widest">
                    <Plus size={20}/> Nuevo Movimiento
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 border-l-4 border-l-blue-500">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gastos Fijos (Mes)</p>
                    <h3 className="text-3xl font-black text-slate-800 tracking-tighter mt-1">${totals.fixed.toLocaleString('es-AR')}</h3>
                </div>
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 border-l-4 border-l-yellow-500">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gastos Variables (Mes)</p>
                    <h3 className="text-3xl font-black text-slate-800 tracking-tighter mt-1">${totals.variable.toLocaleString('es-AR')}</h3>
                </div>
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 border-l-4 border-l-red-500">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Egresos</p>
                    <h3 className="text-3xl font-black text-red-600 tracking-tighter mt-1">${(totals.fixed + totals.variable).toLocaleString('es-AR')}</h3>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
                <div className="p-6 bg-gray-50/50 border-b border-gray-200 flex justify-between items-center">
                    <h4 className="font-black text-slate-800 uppercase tracking-tighter text-sm">Historial de Movimientos</h4>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 sticky top-0 z-10 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-200">
                            <tr>
                                <th className="px-8 py-4">Fecha</th>
                                <th className="px-8 py-4">Categoría</th>
                                <th className="px-8 py-4">Descripción</th>
                                <th className="px-8 py-4">Caja Origen</th>
                                <th className="px-8 py-4">Medio</th>
                                <th className="px-8 py-4 text-right">Monto</th>
                                <th className="px-8 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {movements.map(m => (
                                <tr key={m.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-8 py-5 text-sm font-bold text-slate-400">{m.date}</td>
                                    <td className="px-8 py-5">
                                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter border ${m.category === 'FIXED' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'}`}>
                                            {m.category === 'FIXED' ? 'FIJO' : 'VARIABLE'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-sm font-black text-slate-800 uppercase tracking-tight">{m.description}</td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                                            <Wallet size={12} className="text-slate-300"/>
                                            {(m as any).cashRegisterId ? registers.find(r => r.id === (m as any).cashRegisterId)?.name : 'Sin Caja'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-[10px] text-gray-400 font-black uppercase tracking-widest">{m.paymentMethod}</td>
                                    <td className={`px-8 py-5 text-right font-black text-lg tracking-tighter ${m.type === 'EXPENSE' ? 'text-red-600' : 'text-green-600'}`}>
                                        {m.type === 'EXPENSE' ? '-' : '+'}${m.amount.toLocaleString('es-AR')}
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button onClick={() => deleteMovement(m.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-white rounded-xl transition-all shadow-sm opacity-0 group-hover:opacity-100">
                                            <Trash2 size={16}/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {movements.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="py-24 text-center text-slate-300 font-black uppercase tracking-widest">Sin movimientos registrados</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL MOVIMIENTO */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                        <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-500 text-white rounded-2xl shadow-lg"><DollarSign size={24}/></div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tighter leading-none">Registrar Movimiento</h3>
                                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-1">Ingreso o Egreso Administrativo</p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28}/></button>
                        </div>
                        
                        <div className="p-10 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Tipo de Operación</label>
                                    <select className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-bold text-slate-700" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                                        <option value="EXPENSE">EGRESO (-)</option>
                                        <option value="INCOME">INGRESO (+)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Categoría</label>
                                    <select className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-bold text-slate-700" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})}>
                                        <option value="VARIABLE">Gasto Variable</option>
                                        <option value="FIXED">Costo Fijo</option>
                                    </select>
                                </div>
                            </div>

                            {/* NUEVO CAMPO: SELECCIÓN DE CAJA */}
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Caja de Origen / Destino</label>
                                <div className="relative group">
                                    <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-600 transition-colors" size={18}/>
                                    <select 
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-black text-slate-800 uppercase transition-all" 
                                        value={formData.cashRegisterId} 
                                        onChange={e => setFormData({...formData, cashRegisterId: e.target.value})}
                                    >
                                        <option value="">-- SELECCIONAR CAJA --</option>
                                        {registers.map(reg => (
                                            <option key={reg.id} value={reg.id} disabled={!reg.isOpen}>
                                                {reg.name} {!reg.isOpen ? '(CERRADA)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Descripción del Gasto / Ingreso</label>
                                <input type="text" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-bold text-slate-700 uppercase" placeholder="Ej: Pago de Luz, Flete, etc..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Monto ($)</label>
                                    <input type="number" className="w-full p-4 bg-indigo-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-black text-2xl text-indigo-700" value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Fecha</label>
                                    <input type="date" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-bold text-slate-700" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Medio de Pago</label>
                                <select className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-bold text-slate-700" value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})}>
                                    <option value="EFECTIVO">Efectivo</option>
                                    <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                                    <option value="MERCADO_PAGO">Billetera Virtual (MP)</option>
                                </select>
                            </div>

                            <button onClick={handleSave} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-3">
                                <Save size={20}/> Efectivizar Registro
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DailyMovements;
