
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Search, DollarSign, MessageCircle, Mail, History, Filter, 
    Download, AlertCircle, TrendingUp, Users, CheckCircle, 
    ChevronRight, Phone, Link2, ArrowUpRight, LayoutList, 
    PieChart, UserCheck, UserX, X, Save, Banknote, Smartphone as ECheqIcon,
    Landmark, CreditCard, FileText
} from 'lucide-react';
import { Client, CurrentAccountMovement, Check } from '../types';

interface ClientBalancesProps {
    onNavigateToHistory?: (client: Client) => void;
}

const ClientBalances: React.FC<ClientBalancesProps> = ({ onNavigateToHistory }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [clients, setClients] = useState<Client[]>(() => {
        const saved = localStorage.getItem('ferrecloud_clients');
        return saved ? JSON.parse(saved) : [];
    });

    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [selectedClientForReceipt, setSelectedClientForReceipt] = useState<Client | null>(null);
    const [receiptForm, setReceiptForm] = useState({
        amount: '',
        method: 'EFECTIVO',
        notes: '',
        checkNumber: '',
        checkBank: '',
        checkDueDate: new Date().toISOString().split('T')[0]
    });

    const [filterType, setFilterType] = useState<'ALL_DEBT' | 'HIGH_DEBT'>('ALL_DEBT');

    const clientsWithDebt = clients.filter(c => c.balance > 0);
    
    const filteredClients = clientsWithDebt.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || (c.cuit && c.cuit.includes(searchTerm));
        if (filterType === 'HIGH_DEBT') return matchesSearch && c.balance > 100000;
        return matchesSearch;
    }).sort((a, b) => b.balance - a.balance);

    const totalDebt = clientsWithDebt.reduce((acc, curr) => acc + curr.balance, 0);

    const handleSaveReceipt = () => {
        if (!selectedClientForReceipt || !receiptForm.amount) return;
        const amountNum = parseFloat(receiptForm.amount);
        
        const newBalance = selectedClientForReceipt.balance - amountNum;
        const receiptId = `REC-${Date.now().toString().slice(-6)}`;
        
        // 1. Actualizar saldo del cliente
        const updatedClients = clients.map(c => c.id === selectedClientForReceipt.id ? { ...c, balance: newBalance } : c);
        setClients(updatedClients);
        localStorage.setItem('ferrecloud_clients', JSON.stringify(updatedClients));

        // 2. Registrar movimiento en cuenta corriente
        const movements: CurrentAccountMovement[] = JSON.parse(localStorage.getItem('ferrecloud_movements') || '[]');
        movements.push({
            id: receiptId,
            clientId: selectedClientForReceipt.id,
            date: new Date().toLocaleDateString(),
            voucherType: 'RECIBO DE PAGO',
            description: `Cobro en ${receiptForm.method}. ${receiptForm.notes}`,
            debit: 0,
            credit: amountNum,
            balance: newBalance
        });
        localStorage.setItem('ferrecloud_movements', JSON.stringify(movements));

        // 3. Si es cheque, registrar en cartera
        if (receiptForm.method === 'CHEQUE' || receiptForm.method === 'E-CHEQ') {
            const checks: Check[] = JSON.parse(localStorage.getItem('ferrecloud_checks') || '[]');
            const newCheck: Check = {
                id: `C-${Date.now()}`,
                number: receiptForm.checkNumber || 'S/N',
                bank: receiptForm.checkBank || 'S/D',
                issuer: selectedClientForReceipt.name,
                amount: amountNum,
                dueDate: receiptForm.checkDueDate,
                status: 'PENDING',
                type: receiptForm.method === 'E-CHEQ' ? 'ECHEQ' : 'FISICO'
            };
            localStorage.setItem('ferrecloud_checks', JSON.stringify([newCheck, ...checks]));
        }

        setIsReceiptModalOpen(false);
        setSelectedClientForReceipt(null);
        setReceiptForm({ amount: '', method: 'EFECTIVO', notes: '', checkNumber: '', checkBank: '', checkDueDate: new Date().toISOString().split('T')[0] });
        alert("✅ Recibo emitido y saldo actualizado correctamente.");
    };

    return (
        <div className="flex h-full bg-slate-50 animate-fade-in overflow-hidden">
            <aside className="w-80 bg-white border-r border-gray-200 flex flex-col shrink-0">
                <div className="p-6 border-b border-gray-100 bg-slate-900 text-white">
                    <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                        <DollarSign className="text-green-400"/> Saldos Clientes
                    </h2>
                </div>

                <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="space-y-4">
                        <div className="bg-red-50 p-5 rounded-2xl border border-red-100">
                            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Deuda Exigible</p>
                            <h3 className="text-2xl font-black text-red-600 tracking-tighter">${totalDebt.toLocaleString('es-AR')}</h3>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Buscar Cliente</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                            <input 
                                type="text" 
                                placeholder="Nombre o CUIT..." 
                                className="w-full pl-10 pr-4 py-3 bg-slate-100 border-2 border-transparent rounded-xl focus:bg-white focus:border-indigo-500 outline-none text-sm font-bold text-slate-700 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </aside>

            <main className="flex-1 flex flex-col min-w-0 bg-white">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Cuentas Corrientes</h1>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Gestión de Cobranzas y Recibos</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 sticky top-0 z-10 border-b">
                            <tr>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Saldo Deudor</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Gestión Recibos</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredClients.map(client => (
                                <tr key={client.id} className="hover:bg-slate-50 transition-all">
                                    <td className="px-8 py-5">
                                        <p className="font-black text-slate-800 text-sm uppercase tracking-tight leading-none mb-1">{client.name}</p>
                                        <p className="text-[10px] text-slate-400 font-mono font-bold tracking-tighter">{client.cuit || 'S/C'}</p>
                                    </td>
                                    <td className="px-8 py-5 text-right font-black text-lg tracking-tighter text-red-600">
                                        ${(client.balance || 0).toLocaleString('es-AR')}
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <button 
                                            onClick={() => { setSelectedClientForReceipt(client); setIsReceiptModalOpen(true); }}
                                            className="bg-green-600 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-green-700 transition-all flex items-center gap-2 mx-auto">
                                            <CheckCircle size={14}/> Emitir Recibo
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* MODAL RECIBO PROFESIONAL */}
            {isReceiptModalOpen && selectedClientForReceipt && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[95vh]">
                        <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-widest">Recibo de Cobro</h3>
                                <p className="text-[10px] text-indigo-400 font-bold uppercase mt-1">Cliente: {selectedClientForReceipt.name}</p>
                            </div>
                            <button onClick={() => setIsReceiptModalOpen(false)}><X size={28}/></button>
                        </div>
                        <div className="p-10 space-y-6 overflow-y-auto custom-scrollbar bg-slate-50/50">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-2">Importe Recibido ($)</label>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    className="w-full p-5 bg-white border-2 border-slate-200 rounded-[2rem] focus:border-green-600 outline-none font-black text-4xl text-slate-800 text-center shadow-inner" 
                                    value={receiptForm.amount} 
                                    onChange={e => setReceiptForm({...receiptForm, amount: e.target.value})} 
                                    autoFocus 
                                />
                                <p className="text-center text-[10px] font-bold text-slate-400 uppercase mt-2">Deuda actual: ${selectedClientForReceipt.balance.toLocaleString()}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                {['EFECTIVO', 'TRANSFERENCIA', 'CHEQUE', 'E-CHEQ', 'TARJETA'].map(m => (
                                    <button 
                                        key={m}
                                        onClick={() => setReceiptForm({...receiptForm, method: m})}
                                        className={`py-3 rounded-xl font-black text-[9px] uppercase tracking-widest border-2 transition-all flex items-center justify-center gap-2 ${receiptForm.method === m ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md' : 'border-slate-200 bg-white text-slate-400'}`}>
                                        {m === 'EFECTIVO' && <Banknote size={14}/>}
                                        {m === 'TRANSFERENCIA' && <Landmark size={14}/>}
                                        {/* Added missing FileText import and usage for CHEQUE method */}
                                        {m === 'CHEQUE' && <FileText size={14}/>}
                                        {m === 'E-CHEQ' && <ECheqIcon size={14}/>}
                                        {m.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>

                            {(receiptForm.method === 'CHEQUE' || receiptForm.method === 'E-CHEQ') && (
                                <div className="space-y-4 p-6 bg-white rounded-[2rem] border border-indigo-100 shadow-sm animate-fade-in">
                                    <h4 className="text-[9px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2"><CreditCard size={14}/> Datos del Valor</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-xs uppercase" placeholder="Número" value={receiptForm.checkNumber} onChange={e => setReceiptForm({...receiptForm, checkNumber: e.target.value})} />
                                        <input className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-xs uppercase" placeholder="Banco" value={receiptForm.checkBank} onChange={e => setReceiptForm({...receiptForm, checkBank: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-[8px] font-black text-slate-400 uppercase ml-2">Vencimiento / Fecha Cobro</label>
                                        <input type="date" className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-xs" value={receiptForm.checkDueDate} onChange={e => setReceiptForm({...receiptForm, checkDueDate: e.target.value})} />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-2">Observaciones Internas</label>
                                <textarea 
                                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-xs uppercase h-24 resize-none" 
                                    placeholder="Ej: Pago parcial obra calle San Martin..." 
                                    value={receiptForm.notes}
                                    onChange={e => setReceiptForm({...receiptForm, notes: e.target.value})}
                                />
                            </div>

                            <button onClick={handleSaveReceipt} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-green-600 transition-all">
                                <Save size={20}/> Confirmar Recibo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientBalances;
