
import React, { useState, useEffect, useMemo } from 'react';
import { 
    ArrowLeftRight, Search, Plus, Trash2, CheckCircle, 
    X, Save, Package, Building2, Store, Move, History,
    ArrowRight, AlertTriangle, Printer, Download, Eye,
    ChevronRight, Calendar, Info, RefreshCw
} from 'lucide-react';
import { Product, Branch, StockTransfer, StockTransferItem } from '../types';

const StockTransfers: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'NEW' | 'HISTORY'>('NEW');
    
    const [products, setProducts] = useState<Product[]>(() => {
        const saved = localStorage.getItem('ferrecloud_products');
        return saved ? JSON.parse(saved) : [];
    });

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
    const [searchTerm, setSearchTerm] = useState('');
    const [notes, setNotes] = useState('');
    const [isExecuting, setIsExecuting] = useState(false);

    useEffect(() => {
        localStorage.setItem('ferrecloud_stock_transfers', JSON.stringify(transfers));
        localStorage.setItem('ferrecloud_products', JSON.stringify(products));
    }, [transfers, products]);

    const filteredProducts = useMemo(() => {
        if (!searchTerm.trim()) return [];
        return products.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            p.internalCodes.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()))
        ).slice(0, 8);
    }, [searchTerm, products]);

    const addToCart = (product: Product) => {
        if (!sourceBranchId) {
            alert("Seleccione primero la sucursal de origen.");
            return;
        }
        
        const sourceStock = product.stockDetails.find(s => s.branchId === sourceBranchId)?.quantity || 0;
        if (sourceStock <= 0) {
            alert("Este producto no tiene stock disponible en la sucursal de origen seleccionada.");
            return;
        }

        setCart(prev => {
            const exists = prev.find(i => i.productId === product.id);
            if (exists) return prev;
            return [...prev, { productId: product.id, productName: product.name, quantity: 1 }];
        });
        setSearchTerm('');
    };

    const updateCartQty = (id: string, qty: number) => {
        const product = products.find(p => p.id === id);
        if (!product) return;

        const sourceStock = product.stockDetails.find(s => s.branchId === sourceBranchId)?.quantity || 0;
        
        if (qty > sourceStock) {
            alert(`No puedes transferir más de las ${sourceStock} unidades disponibles en origen.`);
            return;
        }

        setCart(prev => prev.map(item => item.productId === id ? { ...item, quantity: Math.max(1, qty) } : item));
    };

    const handleExecuteTransfer = () => {
        if (!sourceBranchId || !destBranchId || cart.length === 0) return;
        if (sourceBranchId === destBranchId) {
            alert("Origen y Destino no pueden ser la misma sucursal.");
            return;
        }

        setIsExecuting(true);

        setTimeout(() => {
            const sourceBranchName = branches.find(b => b.id === sourceBranchId)?.name || 'Origen';
            const destBranchName = branches.find(b => b.id === destBranchId)?.name || 'Destino';

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

            const updatedProducts = products.map(p => {
                const transferItem = cart.find(i => i.productId === p.id);
                if (transferItem) {
                    const newStockDetails = p.stockDetails.map(sd => {
                        if (sd.branchId === sourceBranchId) {
                            return { ...sd, quantity: sd.quantity - transferItem.quantity };
                        }
                        if (sd.branchId === destBranchId) {
                            return { ...sd, quantity: sd.quantity + transferItem.quantity };
                        }
                        return sd;
                    });
                    
                    if (!newStockDetails.some(sd => sd.branchId === destBranchId)) {
                        newStockDetails.push({ branchId: destBranchId, branchName: destBranchName, quantity: transferItem.quantity });
                    }

                    return { ...p, stockDetails: newStockDetails };
                }
                return p;
            });

            setProducts(updatedProducts);
            setTransfers([newTransfer, ...transfers]);
            
            setCart([]);
            setSourceBranchId('');
            setDestBranchId('');
            setNotes('');
            setIsExecuting(false);
            alert("Movimiento de mercadería realizado con éxito.");
        }, 1000);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto h-full flex flex-col space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Movimientos entre Sucursales</h2>
                    <p className="text-gray-500 font-medium text-sm">Gestiona traslados de mercadería y controla el stock individual de cada depósito.</p>
                </div>
                <div className="flex bg-white rounded-2xl p-1.5 border border-gray-200 shadow-sm">
                    <button onClick={() => setActiveTab('NEW')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all tracking-widest ${activeTab === 'NEW' ? 'bg-slate-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Nueva Transferencia</button>
                    <button onClick={() => setActiveTab('HISTORY')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all tracking-widest ${activeTab === 'HISTORY' ? 'bg-slate-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Historial</button>
                </div>
            </div>

            {activeTab === 'NEW' && (
                <div className="flex flex-col lg:flex-row gap-8 animate-fade-in flex-1">
                    <div className="w-full lg:w-2/5 space-y-6">
                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-200 p-8 space-y-6">
                            <h3 className="font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3"><Move size={22} className="text-indigo-600"/> Ruta del Traslado</h3>
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-2">Sucursal de Origen</label>
                                    <select className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-bold text-slate-700 transition-all" value={sourceBranchId} onChange={(e) => {setSourceBranchId(e.target.value); setCart([]);}}>
                                        <option value="">-- Seleccione Origen --</option>
                                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-2">Sucursal de Destino</label>
                                    <select className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-bold text-slate-700 transition-all" value={destBranchId} onChange={(e) => setDestBranchId(e.target.value)}>
                                        <option value="">-- Seleccione Destino --</option>
                                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-200 p-8 space-y-6">
                            <h3 className="font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3"><Search size={22} className="text-indigo-600"/> Buscar Artículos</h3>
                            <input 
                                type="text"
                                placeholder="Nombre o código SKU..."
                                disabled={!sourceBranchId}
                                className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-bold text-slate-700 text-sm transition-all disabled:opacity-50"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar p-1">
                                    {filteredProducts.map(p => (
                                        <button key={p.id} onClick={() => addToCart(p)} className="w-full p-4 rounded-2xl border-2 border-gray-50 hover:border-indigo-100 hover:bg-indigo-50/50 flex justify-between items-center transition-all">
                                            <div className="text-left">
                                                <p className="font-black text-slate-800 text-xs uppercase truncate leading-none mb-1">{p.name}</p>
                                                <p className="text-[10px] text-gray-400 font-mono font-bold">{p.internalCodes[0]}</p>
                                            </div>
                                            <div className="text-right text-[10px] font-black uppercase text-indigo-600">Stock: {p.stockDetails.find(s => s.branchId === sourceBranchId)?.quantity || 0}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col space-y-6">
                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-1">
                            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-slate-900 text-white">
                                <h3 className="font-black text-xl uppercase tracking-tighter">Ítems a Trasladar</h3>
                                <span className="text-[10px] font-black bg-white/10 px-3 py-1 rounded-full uppercase">{cart.length} ÍTEMS</span>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                        <tr>
                                            <th className="px-8 py-5">Descripción / SKU</th>
                                            <th className="px-8 py-5 text-center">Cant.</th>
                                            <th className="px-8 py-5 text-center"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {cart.map(item => (
                                            <tr key={item.productId}>
                                                <td className="px-8 py-6">
                                                    <p className="font-black text-slate-800 text-sm uppercase leading-none mb-1">{item.productName}</p>
                                                    <p className="text-[10px] text-gray-400 font-mono font-bold">Ref: {products.find(p => p.id === item.productId)?.internalCodes[0]}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <input type="number" className="w-24 p-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-black text-center" value={item.quantity} onChange={(e) => updateCartQty(item.productId, parseInt(e.target.value) || 1)}/>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <button onClick={() => setCart(cart.filter(i => i.productId !== item.productId))} className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"><Trash2 size={20}/></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-8 border-t border-gray-100 bg-gray-50/50">
                                <button onClick={handleExecuteTransfer} disabled={!sourceBranchId || !destBranchId || cart.length === 0 || isExecuting} className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black uppercase shadow-2xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-20 flex items-center justify-center gap-3">
                                    {isExecuting ? <RefreshCw className="animate-spin" size={24}/> : <CheckCircle size={24}/>}
                                    {isExecuting ? 'PROCESANDO...' : 'EJECUTAR TRASLADO'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockTransfers;
