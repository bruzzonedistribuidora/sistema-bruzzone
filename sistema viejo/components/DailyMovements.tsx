
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Calendar, DollarSign, Filter, ArrowUpRight, ArrowDownLeft, X, Save } from 'lucide-react';
import { DailyExpense } from '../types';

const DailyMovements: React.FC = () => {
    const [movements, setMovements] = useState<DailyExpense[]>(() => {
        const saved = localStorage.getItem('daily_movements');
        return saved ? JSON.parse(saved) : [
            { id: '1', date: new Date().toISOString().split('T')[0], description: 'Alquiler Local Octubre', amount: 350000, category: 'FIXED', paymentMethod: 'TRANSFERENCIA', type: 'EXPENSE' },
            { id: '2', date: new Date().toISOString().split('T')[0], description: 'Compra Art. Limpieza', amount: 12500, category: 'VARIABLE', paymentMethod: 'EFECTIVO', type: 'EXPENSE' }
        ];
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<DailyExpense>>({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: 0,
        category: 'VARIABLE',
        paymentMethod: 'EFECTIVO',
        type: 'EXPENSE'
    });

    useEffect(() => {
        localStorage.setItem('daily_movements', JSON.stringify(movements));
    }, [movements]);

    const handleSave = () => {
        if (!formData.description || !formData.amount) return;
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
            type: 'EXPENSE'
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
                    <h2 className="text-2xl font-bold text-gray-800">Gastos y Movimientos Diarios</h2>
                    <p className="text-gray-500 text-sm">Registra salidas de dinero por mantenimiento, servicios y fijos.</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-ferre-orange text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-orange-600 transition-all">
                    <Plus size={20}/> Nuevo Movimiento
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-blue-500">
                    <p className="text-xs font-bold text-gray-400 uppercase">Gastos Fijos (Mes)</p>
                    <h3 className="text-2xl font-bold text-gray-800 mt-1">${totals.fixed.toLocaleString('es-AR')}</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-yellow-500">
                    <p className="text-xs font-bold text-gray-400 uppercase">Gastos Variables (Mes)</p>
                    <h3 className="text-2xl font-bold text-gray-800 mt-1">${totals.variable.toLocaleString('es-AR')}</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-red-500">
                    <p className="text-xs font-bold text-gray-400 uppercase">Total Egresos</p>
                    <h3 className="text-2xl font-bold text-red-600 mt-1">${(totals.fixed + totals.variable).toLocaleString('es-AR')}</h3>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
                <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                    <h4 className="font-bold text-gray-700">Historial de Movimientos</h4>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 sticky top-0 z-10 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3">Fecha</th>
                                <th className="px-6 py-3">Categoría</th>
                                <th className="px-6 py-3">Descripción</th>
                                <th className="px-6 py-3">Medio</th>
                                <th className="px-6 py-3 text-right">Monto</th>
                                <th className="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {movements.map(m => (
                                <tr key={m.id} className="hover:bg-gray-50 group">
                                    <td className="px-6 py-4 text-sm text-gray-600">{m.date}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${m.category === 'FIXED' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {m.category === 'FIXED' ? 'FIJO' : 'VARIABLE'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{m.description}</td>
                                    <td className="px-6 py-4 text-xs text-gray-500">{m.paymentMethod}</td>
                                    <td className={`px-6 py-4 text-right font-bold ${m.type === 'EXPENSE' ? 'text-red-600' : 'text-green-600'}`}>
                                        {m.type === 'EXPENSE' ? '-' : '+'}${m.amount.toLocaleString('es-AR')}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => deleteMovement(m.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 size={16}/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {movements.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-gray-400">Sin movimientos registrados.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL MOVIMIENTO */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                            <h3 className="font-bold text-lg flex items-center gap-2"><DollarSign/> Nuevo Gasto/Ingreso</h3>
                            <button onClick={() => setIsModalOpen(false)}><X/></button>
                        </div>
                        <div className="p-8 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo</label>
                                    <select className="w-full p-2 border rounded" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                                        <option value="EXPENSE">EGRESO (-)</option>
                                        <option value="INCOME">INGRESO (+)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoría</label>
                                    <select className="w-full p-2 border rounded" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})}>
                                        <option value="VARIABLE">Variable</option>
                                        <option value="FIXED">Fijo</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción</label>
                                <input type="text" className="w-full p-2 border rounded" placeholder="Ej: Pago de Luz, Flete..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Monto ($)</label>
                                    <input type="number" className="w-full p-2 border rounded font-bold" value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha</label>
                                    <input type="date" className="w-full p-2 border rounded" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Medio de Pago</label>
                                <select className="w-full p-2 border rounded" value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})}>
                                    <option value="EFECTIVO">Efectivo</option>
                                    <option value="TRANSFERENCIA">Transferencia</option>
                                    <option value="MERCADO_PAGO">Mercado Pago</option>
                                </select>
                            </div>
                            <button onClick={handleSave} className="w-full bg-ferre-orange text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-orange-600 flex items-center justify-center gap-2">
                                <Save size={20}/> Registrar Movimiento
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DailyMovements;
