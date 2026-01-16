import React, { useState, useEffect, useMemo } from 'react';
import { 
    ArrowLeftRight, Search, Plus, Trash2, CheckCircle, 
    X, Save, Package, Building2, Store, Move, History,
    ArrowRight, AlertTriangle, Printer, Download, Eye,
    ChevronRight, Calendar, Info, RefreshCw, Minus
} from 'lucide-react';
import { Product, Branch, StockTransfer, StockTransferItem } from '../types';
import { productDB } from '../services/storageService';

const StockTransfers: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'NEW' | 'HISTORY'>('NEW');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    
    const [branches] = useState<Branch[]>(() => {
        const saved = localStorage.getItem('ferrecloud_branches');
        return saved ? JSON.parse(saved) : [
            { id: '1', code: 'SUC-001', name: 'Sucursal Central', type: 'SUCURSAL', active: true, address: '', phone: '', manager: '' },
            { id: '2', code: 'SUC-002', name: 'Sucursal Norte', type: 'SUCURSAL', active: true, address: '', phone: '', manager: '' },
            { id: '3', code: 'DEP-001', name: 'Depósito General', type: 'DEPOSITO', active: true, address: '', phone: '', manager: '' }
        ];
    });

    const [transfers, setTransfers] = useState<StockTransfer[]>(() => {
        const saved = localStorage.getItem('ferrecloud_stock_transfers');
        return saved ? JSON.parse(saved) : [];
    });

    const [sourceBranchId, setSourceBranchId] = useState('');
    const [destBranchId, setDestBranchId] = useState('');
    const [cart, setCart] = useState<StockTransferItem[]>([]);
    const [notes, setNotes] = useState('');
    const [isExecuting, setIsExecuting] = useState(false);

    useEffect(() => {
        localStorage.setItem('ferrecloud_stock_transfers', JSON.stringify(transfers));
    }, [transfers]);

    useEffect(() => {
        const search = async () => {
            if (searchTerm.trim().length > 2) {
                const results = await productDB.search(searchTerm);
                setSearchResults(results);
            } else {
                setSearchResults([]);
            }
        };
        const timer = setTimeout(search, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const addToCart = (product: Product) => {
        if (!sourceBranchId) {
            alert("Seleccione primero la sucursal de origen.");
            return;
        }
        
        const sourceStock = product.stockDetails.find(s => s.branchId === sourceBranchId)?.quantity || 0;
        // Si no hay stock específico en esa sucursal, usamos el stock principal como referencia si es la sucursal 1
        const availableInSource = sourceBranchId === '1' ? product.stockPrincipal : sourceStock;

        if (availableInSource <= 0) {
            alert("Este producto no tiene stock disponible en la sucursal de origen seleccionada.");
            return;
        }

        setCart(prev => {
            const exists = prev.find(i => i.productId === product.id);
            if (exists) return prev;
            return [...prev, { productId: product.id, productName: product.name, quantity: 1 }];
        });
        setSearchTerm('');
        setSearchResults([]);
    };

    const handleExecuteTransfer = async () => {
        if (!sourceBranchId || !destBranchId || cart.length === 0) return;
        if (sourceBranchId === destBranchId) {
            alert("Origen y Destino no pueden ser la misma sucursal.");
            return;
        }

        setIsExecuting(true);

        try {
            const sourceBranchName = branches.find(b => b.id === sourceBranchId)?.name || 'Origen';
            const destBranchName = branches.find(b => b.id === destBranchId)?.name || 'Destino';

            for (const item of cart) {
                const p = await productDB.getById(item.productId);
                if (p) {
                    // Actualizamos stockPrincipal si es sucursal 1, o buscamos en stockDetails
                    let newPrincipal = p.stockPrincipal;
                    let newDetails = [...p.stockDetails];

                    // Restar de origen
                    if (sourceBranchId === '1') {
                        newPrincipal = Math.max(0, newPrincipal - item.quantity);
                    } else {
                        newDetails = newDetails.map(sd => 
                            sd.branchId === sourceBranchId ? { ...sd, quantity: Math.max(0, sd.quantity - item.quantity) } : sd
                        );
                    }

                    // Sumar a destino
                    if (destBranchId === '1') {
                        newPrincipal = newPrincipal + item.quantity;
                    } else {
                        const existsInDest = newDetails.find(sd => sd.branchId === destBranchId);
                        if (existsInDest) {
                            newDetails = newDetails.map(sd => 
                                sd.branchId === destBranchId ? { ...sd, quantity: sd.quantity + item.quantity } : sd
                            );
                        } else {
                            newDetails.push({ branchId: destBranchId, branchName: destBranchName, quantity: item.quantity });
                        }
                    }

                    await productDB.save({
                        ...p,
                        stockPrincipal: newPrincipal,
                        stockDetails: newDetails,
                        stock: newPrincipal + newDetails.reduce((a, b) => a + b.quantity, 0)
                    });
                }
            }

            const newTransfer: StockTransfer = {
                id: `TR-${Date.now().toString().slice(-6)}`,
                date: new Date().toLocaleString(),
                sourceBranchId,
                sourceBranchName,
                destBranchId,
                destBranchName,
                items: [...cart],
                notes,
                status: 'COMPLETED'
            };

            setTransfers([newTransfer, ...transfers]);
            setCart([]);
            setSourceBranchId('');
            setDestBranchId('');
            setNotes('');
            alert("✅ Movimiento de mercadería realizado con éxito.");
        } catch (err) {
            console.error(err);
            alert("❌ Hubo un error al procesar el traslado.");
        } finally {
            setIsExecuting(false);
        }
    };

    return (
        <div className="p-6 h-full flex flex-col space-y-6 bg-slate-50 overflow-hidden font-sans">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Traslados de Mercadería</h2>
                    <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">Control de Stock por sucursales y depósitos</p>
                </div>
                <div className="flex bg-slate-100 rounded-2xl p-1 shadow-inner">
                    <button onClick={() => setActiveTab('NEW')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest ${activeTab === 'NEW' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400'}`}>Nueva Transferencia</button>
                    <button onClick={() => setActiveTab('HISTORY')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest ${activeTab === 'HISTORY' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400'}`}>Historial</button>
                </div>
            </div>

            {activeTab === 'NEW' ? (
                <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden animate-fade-in">
                    <div className="lg:w-1/3 space-y-4 flex flex-col">
                        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6 space-y-6">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><Move size={14} className="text-indigo-600"/> Origen y Destino</h3>
                            <div className="space-y-4">
                                <select className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl font-black text-xs uppercase outline-none" value={sourceBranchId} onChange={e => {setSourceBranchId(e.target.value); setCart([]);}}>
                                    <option value="">-- SELECCIONE ORIGEN --</option>
                                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                                <div className="flex justify-center"><ArrowRight className="text-slate-200 rotate-90 lg:rotate-0" size={24}/></div>
                                <select className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl font-black text-xs uppercase outline-none" value={destBranchId} onChange={e => setDestBranchId(e.target.value)}>
                                    <option value="">-- SELECCIONE DESTINO --</option>
                                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6 flex-1 flex flex-col overflow-hidden">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><Search size={14} className="text-indigo-600"/> Buscar Artículos</h3>
                            <input 
                                className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl font-black text-xs uppercase outline-none mb-4"
                                placeholder="NOMBRE O SKU..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                disabled={!sourceBranchId}
                            />
                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                                {searchResults.map(p => (
                                    <button key={p.id} onClick={() => addToCart(p)} className="w-full p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-400 hover:bg-indigo-50 transition-all flex justify-between items-center group text-left">
                                        <div className="flex-1 pr-2 min-w-0">
                                            <p className="font-black text-slate-800 uppercase text-[10px] truncate leading-tight mb-1">{p.name}</p>
                                            <p className="text-[9px] font-mono font-bold text-slate-400">SKU: {p.internalCodes[0]}</p>
                                        </div>
                                        <Plus size={16} className="text-indigo-200 group-hover:text-indigo-600"/>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="lg:flex-1 bg-white rounded-[3rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-900 text-white flex justify-between items-center shrink-0">
                            <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Package size={16} className="text-indigo-400"/> Lista de Envío</h3>
                            <span className="text-[10px] font-black bg-indigo-600 px-3 py-1 rounded-full uppercase tracking-widest">{cart.length} ITEMS</span>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b sticky top-0">
                                    <tr>
                                        <th className="px-6 py-4">Artículo</th>
                                        <th className="px-6 py-4 text-center">Cant.</th>
                                        <th className="px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {cart.map(item => (
                                        <tr key={item.productId} className="bg-white">
                                            <td className="px-6 py-4">
                                                <p className="font-black text-slate-800 text-[11px] uppercase truncate">{item.productName}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <input 
                                                    type="text" 
                                                    inputMode="decimal"
                                                    className="w-24 p-2 bg-slate-50 border rounded-xl font-black text-center text-indigo-700 outline-none" 
                                                    value={item.quantity.toString().replace('.', ',')} 
                                                    onChange={e => {
                                                        const val = parseFloat(e.target.value.replace(',', '.')) || 0;
                                                        setCart(prev => prev.map(it => it.productId === item.productId ? { ...it, quantity: val } : it));
                                                    }}
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => setCart(prev => prev.filter(i => i.productId !== item.productId))} className="p-2 text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {cart.length === 0 && (
                                        <tr><td colSpan={3} className="py-32 text-center text-slate-300 font-black uppercase tracking-widest opacity-30">Carrito de traslado vacío</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-8 bg-white border-t border-slate-100 shrink-0">
                            <button 
                                onClick={handleExecuteTransfer}
                                disabled={cart.length === 0 || isExecuting}
                                className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3">
                                {isExecuting ? <RefreshCw className="animate-spin" size={20}/> : <ArrowLeftRight size={20}/>}
                                PROCESAR MOVIMIENTO
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col animate-fade-in">
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-[9px] font-black text-slate-300 uppercase tracking-widest sticky top-0">
                                <tr>
                                    <th className="px-8 py-5">ID / Fecha</th>
                                    <th className="px-8 py-5">Ruta</th>
                                    <th className="px-8 py-5">Items</th>
                                    <th className="px-8 py-5 text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-[11px]">
                                {transfers.map(tr => (
                                    <tr key={tr.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-8 py-4">
                                            <p className="font-black text-slate-800">{tr.id}</p>
                                            <p className="text-[9px] font-bold text-slate-400">{tr.date}</p>
                                        </td>
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-3 font-bold text-slate-500 uppercase">
                                                <span>{tr.sourceBranchName}</span>
                                                <ArrowRight size={12} className="text-indigo-400"/>
                                                <span>{tr.destBranchName}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 font-black text-slate-900">{tr.items.length} ítems</td>
                                        <td className="px-8 py-4 text-center">
                                            <span className="px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-100 font-black uppercase text-[8px] tracking-widest">Ejecutado</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockTransfers;
