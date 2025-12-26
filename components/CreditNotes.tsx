
import React, { useState, useMemo } from 'react';
import { 
    RotateCcw, Search, Plus, Trash2, Save, FileX, 
    ArrowRight, CheckCircle, X, AlertTriangle, 
    Truck, Users, Package, ShoppingCart, Info,
    History, Receipt, Printer, ArrowDownLeft, ArrowUpRight
} from 'lucide-react';
import { CreditNote, InvoiceItem, Product, Client, Provider, Purchase } from '../types';

const CreditNotes: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'SALES' | 'PURCHASE'>('SALES');
    const [isNewNCModalOpen, setIsNewNCModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // --- CARGA DE DATOS ---
    const [clients] = useState<Client[]>(() => JSON.parse(localStorage.getItem('ferrecloud_clients') || '[]'));
    const [providers] = useState<Provider[]>(() => JSON.parse(localStorage.getItem('ferrecloud_providers') || '[]'));
    const [products] = useState<Product[]>(() => JSON.parse(localStorage.getItem('ferrecloud_products') || '[]'));
    const [ncHistory, setNcHistory] = useState<CreditNote[]>(() => {
        const saved = localStorage.getItem('ferrecloud_nc_history');
        return saved ? JSON.parse(saved) : [];
    });

    // --- ESTADO PARA NUEVA NC ---
    const [ncForm, setNcForm] = useState<Partial<CreditNote>>({
        type: 'SALES',
        date: new Date().toISOString().split('T')[0],
        items: [],
        reason: 'DEVOLUCION',
        returnToStock: true,
        total: 0
    });

    const [voucherSearch, setVoucherSearch] = useState('');
    const [foundVoucherItems, setFoundVoucherItems] = useState<InvoiceItem[]>([]);

    const handleSearchVoucher = () => {
        if (!voucherSearch) return;
        // Simulación: Buscamos en el historial de ventas o compras
        const mockItems: InvoiceItem[] = [
            { product: products[0] || {} as Product, quantity: 2, appliedPrice: 1500, subtotal: 3000 },
            { product: products[1] || {} as Product, quantity: 1, appliedPrice: 25000, subtotal: 25000 }
        ];
        setFoundVoucherItems(mockItems);
    };

    const addItemToNC = (item: InvoiceItem) => {
        setNcForm(prev => {
            const existing = prev.items?.find(i => i.product.id === item.product.id);
            if (existing) return prev;
            const newItems = [...(prev.items || []), { ...item, quantity: 1, subtotal: item.appliedPrice }];
            const newTotal = newItems.reduce((acc, curr) => acc + curr.subtotal, 0);
            return { ...prev, items: newItems, total: newTotal };
        });
    };

    const handleSaveNC = () => {
        if (!ncForm.targetId || ncForm.items?.length === 0) {
            alert("Seleccione un destinatario e ítems para la nota de crédito.");
            return;
        }

        const newNC: CreditNote = {
            ...ncForm as CreditNote,
            id: `NC-${activeTab === 'SALES' ? 'V' : 'C'}-${Math.floor(Math.random() * 10000)}`,
            type: activeTab
        };

        // 1. Persistencia de Historial
        const updatedHistory = [newNC, ...ncHistory];
        setNcHistory(updatedHistory);
        localStorage.setItem('ferrecloud_nc_history', JSON.stringify(updatedHistory));

        // 2. Impacto en Cuentas Corrientes
        if (activeTab === 'SALES') {
            const currentClients = JSON.parse(localStorage.getItem('ferrecloud_clients') || '[]');
            const updatedClients = currentClients.map((c: Client) => 
                c.id === newNC.targetId ? { ...c, balance: c.balance - newNC.total } : c
            );
            localStorage.setItem('ferrecloud_clients', JSON.stringify(updatedClients));
            
            // Agregar movimiento a Cta Cte
            const movements = JSON.parse(localStorage.getItem('ferrecloud_movements') || '[]');
            movements.push({
                id: `MOV-${Date.now()}`,
                clientId: newNC.targetId,
                date: newNC.date,
                voucherType: `NOTA DE CREDITO ${newNC.id}`,
                description: `Credito por ${newNC.reason.toLowerCase()}`,
                debit: 0,
                credit: newNC.total,
                balance: 0 // Se recalcula en la vista
            });
            localStorage.setItem('ferrecloud_movements', JSON.stringify(movements));
        } else {
            const currentProviders = JSON.parse(localStorage.getItem('ferrecloud_providers') || '[]');
            const updatedProviders = currentProviders.map((p: Provider) => 
                p.id === newNC.targetId ? { ...p, balance: p.balance - newNC.total } : p
            );
            localStorage.setItem('ferrecloud_providers', JSON.stringify(updatedProviders));
        }

        // 3. Impacto en Stock (Si corresponde)
        if (newNC.returnToStock) {
            const currentProducts = JSON.parse(localStorage.getItem('ferrecloud_products') || '[]');
            const updatedProducts = currentProducts.map((p: Product) => {
                const match = newNC.items.find(item => item.product.id === p.id);
                if (match) {
                    const adjustment = activeTab === 'SALES' ? match.quantity : -match.quantity;
                    return { ...p, stock: p.stock + adjustment };
                }
                return p;
            });
            localStorage.setItem('ferrecloud_products', JSON.stringify(updatedProducts));
        }

        setIsNewNCModalOpen(false);
        alert("Nota de Crédito emitida y saldos actualizados.");
        window.dispatchEvent(new Event('storage')); // Notificar a otros componentes
    };

    const filteredNC = ncHistory.filter(nc => 
        nc.type === activeTab && 
        (nc.targetName.toLowerCase().includes(searchTerm.toLowerCase()) || nc.id.includes(searchTerm))
    );

    return (
        <div className="p-6 max-w-7xl mx-auto h-full flex flex-col space-y-6 bg-slate-50 overflow-hidden font-sans">
            
            {/* CABECERA */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 shrink-0">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-slate-900 text-red-400 rounded-3xl shadow-xl">
                        <RotateCcw size={32}/>
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Notas de Crédito</h2>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Reversión de Comprobantes • Ajuste de Saldos
                        </p>
                    </div>
                </div>

                <div className="flex bg-slate-100 rounded-2xl p-1 shadow-inner">
                    <button onClick={() => setActiveTab('SALES')} className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase transition-all tracking-widest ${activeTab === 'SALES' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400 hover:text-slate-600'}`}>NC Ventas (Clientes)</button>
                    <button onClick={() => setActiveTab('PURCHASE')} className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase transition-all tracking-widest ${activeTab === 'PURCHASE' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400 hover:text-slate-600'}`}>NC Compras (Prov.)</button>
                </div>
            </div>

            <div className="flex justify-between items-center gap-4 shrink-0">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                    <input 
                        type="text" 
                        placeholder="Buscar por ID o Nombre..." 
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 font-bold text-sm transition-all shadow-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <button 
                    onClick={() => {
                        setNcForm({ type: activeTab, date: new Date().toISOString().split('T')[0], items: [], reason: 'DEVOLUCION', returnToStock: true, total: 0 });
                        setFoundVoucherItems([]);
                        setVoucherSearch('');
                        setIsNewNCModalOpen(true);
                    }}
                    className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all flex items-center gap-3">
                    <Plus size={16}/> Emitir Nota de Crédito
                </button>
            </div>

            {/* TABLA DE HISTORIAL */}
            <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900 text-[9px] font-black text-slate-300 uppercase tracking-widest sticky top-0 z-10">
                            <tr>
                                <th className="px-8 py-5">ID Comprobante</th>
                                <th className="px-8 py-5">Fecha</th>
                                <th className="px-8 py-5">{activeTab === 'SALES' ? 'Cliente' : 'Proveedor'}</th>
                                <th className="px-8 py-5">Motivo</th>
                                <th className="px-8 py-5 text-right">Importe Total</th>
                                <th className="px-8 py-5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-[11px]">
                            {filteredNC.length === 0 ? (
                                <tr><td colSpan={6} className="py-24 text-center text-slate-300 font-black uppercase tracking-widest">Sin registros encontrados</td></tr>
                            ) : filteredNC.map(nc => (
                                <tr key={nc.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-8 py-5">
                                        <p className="font-black text-slate-800 uppercase leading-none mb-1">{nc.id}</p>
                                        <p className="text-[8px] text-gray-400 font-mono font-bold">REF: {nc.relatedVoucherId}</p>
                                    </td>
                                    <td className="px-8 py-5 font-bold text-gray-400">{nc.date}</td>
                                    <td className="px-8 py-5 font-black text-slate-700 uppercase">{nc.targetName}</td>
                                    <td className="px-8 py-5">
                                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg font-black text-[9px] uppercase tracking-tighter">
                                            {nc.reason}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right font-black text-red-600 text-lg tracking-tighter">
                                        -${nc.total.toLocaleString('es-AR')}
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"><Printer size={18}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL: NUEVA NC */}
            {isNewNCModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh]">
                        <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-red-500 text-white rounded-2xl shadow-lg"><FileX size={24}/></div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tighter leading-none">Generar Nota de Crédito</h3>
                                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-1">
                                        {activeTab === 'SALES' ? 'Anulación de Venta / Devolución' : 'Crédito de Proveedor'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsNewNCModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-all"><X size={28}/></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50 custom-scrollbar space-y-8">
                            {/* PASO 1: VÍNCULO */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                        {activeTab === 'SALES' ? 'Seleccionar Cliente' : 'Seleccionar Proveedor'}
                                    </label>
                                    <select 
                                        className="w-full p-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-indigo-500 outline-none font-black text-xs uppercase"
                                        value={ncForm.targetId}
                                        onChange={e => {
                                            const list = activeTab === 'SALES' ? clients : providers;
                                            const target = list.find(x => x.id === e.target.value);
                                            setNcForm({...ncForm, targetId: e.target.value, targetName: target?.name || ''});
                                        }}
                                    >
                                        <option value="">-- SELECCIONAR --</option>
                                        {(activeTab === 'SALES' ? clients : providers).map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
                                    </select>
                                </div>
                                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Factura a Acreditar</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            placeholder="Nº Factura..." 
                                            className="flex-1 p-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-indigo-500 outline-none font-black text-xs uppercase"
                                            value={voucherSearch}
                                            onChange={e => setVoucherSearch(e.target.value)}
                                        />
                                        <button onClick={handleSearchVoucher} className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all"><Search size={16}/></button>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Motivo Legal</label>
                                    <select 
                                        className="w-full p-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-indigo-500 outline-none font-black text-xs uppercase"
                                        value={ncForm.reason}
                                        onChange={e => setNcForm({...ncForm, reason: e.target.value as any})}
                                    >
                                        <option value="DEVOLUCION">Devolución de Mercadería</option>
                                        <option value="ERROR_PRECIO">Diferencia de Precio</option>
                                        <option value="BONIFICACION">Bonificación Comercial</option>
                                        <option value="OTROS">Otros conceptos</option>
                                    </select>
                                </div>
                            </div>

                            {/* PASO 2: ÍTEMS */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden flex flex-col h-[400px]">
                                    <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ítems del Comprobante Original</h4>
                                        <span className="text-[8px] font-black text-indigo-500 uppercase">Haga clic para agregar</span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                                        {foundVoucherItems.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center p-10 text-center text-slate-300">
                                                <Receipt size={48} strokeWidth={1} className="mb-4 opacity-20"/>
                                                <p className="text-[11px] font-black uppercase">Busque una factura para ver sus ítems</p>
                                            </div>
                                        ) : foundVoucherItems.map((item, idx) => (
                                            <button key={idx} onClick={() => addItemToNC(item)} className="w-full p-4 border-b border-gray-50 hover:bg-indigo-50 transition-all flex justify-between items-center group">
                                                <div className="text-left">
                                                    <p className="font-black text-slate-800 text-xs uppercase leading-none mb-1">{item.product.name}</p>
                                                    <p className="text-[9px] text-gray-400 font-bold uppercase">Cant. Original: {item.quantity}</p>
                                                </div>
                                                <ArrowRight size={16} className="text-indigo-400 opacity-0 group-hover:opacity-100 transition-all"/>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden flex flex-col h-[400px] shadow-inner">
                                    <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest">Desglose de Nota de Crédito</h4>
                                        <span className="text-[10px] font-black text-red-400 uppercase">Total: ${ncForm.total?.toLocaleString('es-AR')}</span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                                        {ncForm.items?.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center p-10 text-center text-slate-300">
                                                <RotateCcw size={48} strokeWidth={1} className="mb-4 opacity-20"/>
                                                <p className="text-[11px] font-black uppercase">Sin ítems seleccionados para devolución</p>
                                            </div>
                                        ) : ncForm.items?.map((item, idx) => (
                                            <div key={idx} className="p-4 border-b border-gray-50 flex justify-between items-center animate-fade-in bg-red-50/20">
                                                <div className="flex-1">
                                                    <p className="font-black text-slate-800 text-xs uppercase">{item.product.name}</p>
                                                    <div className="flex items-center gap-4 mt-2">
                                                        <div className="flex items-center gap-2">
                                                            <label className="text-[8px] font-black text-gray-400 uppercase">Cant.</label>
                                                            <input 
                                                                type="number" 
                                                                className="w-16 p-1 text-center bg-white border border-slate-200 rounded-lg font-black text-xs" 
                                                                value={item.quantity} 
                                                                onChange={e => {
                                                                    const val = parseFloat(e.target.value) || 0;
                                                                    const newItems = [...(ncForm.items || [])];
                                                                    newItems[idx] = { ...item, quantity: val, subtotal: val * item.appliedPrice };
                                                                    setNcForm({ ...ncForm, items: newItems, total: newItems.reduce((a,c) => a + c.subtotal, 0) });
                                                                }}
                                                            />
                                                        </div>
                                                        <p className="text-[10px] font-black text-indigo-600">${item.subtotal.toLocaleString('es-AR')}</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => {
                                                    const newItems = ncForm.items?.filter((_, i) => i !== idx) || [];
                                                    setNcForm({...ncForm, items: newItems, total: newItems.reduce((a,c) => a + c.subtotal, 0)});
                                                }} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900 p-8 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl">
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-3">
                                        <div onClick={() => setNcForm({...ncForm, returnToStock: !ncForm.returnToStock})} className={`w-14 h-7 rounded-full relative transition-all cursor-pointer ${ncForm.returnToStock ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                                            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${ncForm.returnToStock ? 'right-1' : 'left-1'}`}></div>
                                        </div>
                                        <div>
                                            <p className="text-white text-xs font-black uppercase tracking-tight">Sincronizar Inventario</p>
                                            <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">{ncForm.returnToStock ? 'Reingresa mercadería al stock' : 'Solo ajuste contable de saldo'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="text-right">
                                        <p className="text-indigo-400 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Monto a Acreditar</p>
                                        <h4 className="text-4xl font-black text-white tracking-tighter leading-none">${ncForm.total?.toLocaleString('es-AR')}</h4>
                                    </div>
                                    <button onClick={handleSaveNC} className="bg-red-500 text-white px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-red-500/20 hover:bg-red-600 transition-all active:scale-95 flex items-center gap-3">
                                        <CheckCircle size={20}/> Confirmar Emisión
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreditNotes;
