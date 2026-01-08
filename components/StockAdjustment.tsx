
import React, { useState, useMemo, useEffect } from 'react';
// Added missing Trash2 import from lucide-react
import { 
    Search, Settings2, Package, Save, History, 
    AlertTriangle, RefreshCw, X, CheckCircle, 
    ArrowRight, Info, Database, Layers, Tag,
    Plus, Minus, Hash, ClipboardList, User, Trash2
} from 'lucide-react';
import { Product, StockAdjustmentLog } from '../types';
import { productDB } from '../services/storageService';

const StockAdjustment: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'ADJUST' | 'HISTORY'>('ADJUST');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Estados del formulario de ajuste
    const [adjustmentReason, setAdjustmentReason] = useState('CONTEO FISICO');
    const [adjustments, setAdjustments] = useState({
        principal: 0,
        deposito: 0,
        sucursal: 0
    });

    const [history, setHistory] = useState<StockAdjustmentLog[]>(() => {
        const saved = localStorage.getItem('ferrecloud_stock_logs');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('ferrecloud_stock_logs', JSON.stringify(history));
    }, [history]);

    const handleSearch = async () => {
        if (searchTerm.length < 3) return;
        const results = await productDB.search(searchTerm);
        if (results.length > 0) {
            // No seleccionamos automáticamente para dar opción a elegir de la lista si hay varios
        }
    };

    const [searchResults, setSearchResults] = useState<Product[]>([]);
    
    useEffect(() => {
        const search = async () => {
            if (searchTerm.length > 2) {
                const results = await productDB.search(searchTerm);
                setSearchResults(results);
            } else {
                setSearchResults([]);
            }
        };
        search();
    }, [searchTerm]);

    const selectProduct = (p: Product) => {
        setSelectedProduct(p);
        setAdjustments({
            principal: p.stockPrincipal || 0,
            deposito: p.stockDeposito || 0,
            sucursal: p.stockSucursal || 0
        });
        setSearchTerm('');
        setSearchResults([]);
    };

    const handleSaveAdjustment = async () => {
        if (!selectedProduct || !adjustmentReason) return;
        
        setIsProcessing(true);
        
        const logs: StockAdjustmentLog[] = [];
        const user = "ADMIN"; // Simulado

        const checkAdjustment = (loc: 'PRINCIPAL' | 'DEPOSITO' | 'SUCURSAL', oldVal: number, newVal: number) => {
            if (oldVal !== newVal) {
                logs.push({
                    id: `LOG-${Date.now()}-${Math.random()}`,
                    date: new Date().toLocaleString(),
                    productId: selectedProduct.id,
                    productName: selectedProduct.name,
                    location: loc,
                    oldQty: oldVal,
                    newQty: newVal,
                    reason: adjustmentReason.toUpperCase(),
                    user
                });
            }
        };

        checkAdjustment('PRINCIPAL', selectedProduct.stockPrincipal || 0, adjustments.principal);
        checkAdjustment('DEPOSITO', selectedProduct.stockDeposito || 0, adjustments.deposito);
        checkAdjustment('SUCURSAL', selectedProduct.stockSucursal || 0, adjustments.sucursal);

        if (logs.length === 0) {
            alert("No se detectaron cambios en las cantidades.");
            setIsProcessing(false);
            return;
        }

        const totalStock = adjustments.principal + adjustments.deposito + adjustments.sucursal;
        
        const updatedProduct: Product = {
            ...selectedProduct,
            stockPrincipal: adjustments.principal,
            stockDeposito: adjustments.deposito,
            stockSucursal: adjustments.sucursal,
            stock: totalStock
        };

        await productDB.save(updatedProduct);
        setHistory(prev => [...logs, ...prev]);
        
        setTimeout(() => {
            setIsProcessing(false);
            setSelectedProduct(null);
            alert("✅ Ajuste de stock aplicado y registrado en auditoría.");
        }, 800);
    };

    return (
        <div className="p-6 h-full flex flex-col space-y-6 bg-slate-50 overflow-hidden font-sans">
            
            {/* CABECERA */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 shrink-0">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-slate-900 text-indigo-400 rounded-3xl shadow-xl"><Settings2 size={32}/></div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Ajuste de Existencias</h2>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2 flex items-center gap-2">
                             Módulo de Corrección y Auditoría de Stock
                        </p>
                    </div>
                </div>

                <div className="flex bg-slate-100 rounded-2xl p-1.5 shadow-inner border border-slate-200">
                    <button onClick={() => setActiveTab('ADJUST')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest ${activeTab === 'ADJUST' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400'}`}>Realizar Ajuste</button>
                    <button onClick={() => setActiveTab('HISTORY')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest ${activeTab === 'HISTORY' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400'}`}>Auditoría</button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                {activeTab === 'ADJUST' && (
                    <div className="h-full flex flex-col space-y-6 animate-fade-in">
                        
                        {/* BUSCADOR */}
                        <div className="relative z-50">
                            <div className="bg-white p-4 rounded-3xl border-2 border-transparent focus-within:border-indigo-500 shadow-sm flex items-center gap-4 transition-all">
                                <Search className="text-slate-300" size={24}/>
                                <input 
                                    type="text" 
                                    placeholder="Escriba Nombre, Marca o SKU para ajustar..." 
                                    className="flex-1 outline-none font-black text-slate-800 uppercase text-lg tracking-tight"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                                {selectedProduct && (
                                    <button onClick={() => setSelectedProduct(null)} className="p-2 bg-slate-100 rounded-xl text-slate-400 hover:text-red-500 transition-colors">
                                        <X size={20}/>
                                    </button>
                                )}
                            </div>

                            {/* RESULTADOS BÚSQUEDA */}
                            {searchResults.length > 0 && (
                                <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-[2rem] shadow-2xl border border-slate-100 max-h-[400px] overflow-y-auto custom-scrollbar animate-fade-in p-2">
                                    {searchResults.map(p => (
                                        <div 
                                            key={p.id} 
                                            onClick={() => selectProduct(p)}
                                            className="p-5 hover:bg-indigo-50 border-b last:border-0 rounded-2xl transition-all cursor-pointer group flex justify-between items-center"
                                        >
                                            <div>
                                                <h4 className="font-black text-slate-800 uppercase text-sm leading-none mb-1.5 group-hover:text-indigo-600">{p.name}</h4>
                                                <div className="flex gap-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                    <span>SKU: {p.internalCodes[0]}</span>
                                                    <span>Marca: {p.brand}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[8px] font-black text-slate-300 uppercase mb-1">Stock Actual</p>
                                                <span className="bg-slate-900 text-white px-3 py-1 rounded-lg font-black text-xs">{p.stock}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {selectedProduct ? (
                            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in overflow-y-auto custom-scrollbar pr-2 pb-20">
                                
                                {/* PANEL DE DATOS PRODUCTO */}
                                <div className="lg:col-span-4 space-y-6">
                                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                                        <div className="absolute -top-10 -right-10 p-20 opacity-5 text-indigo-400"><Package size={200}/></div>
                                        <div className="relative z-10">
                                            <p className="text-indigo-400 text-[9px] font-black uppercase tracking-[0.3em] mb-4">Artículo Seleccionado</p>
                                            <h3 className="text-2xl font-black uppercase tracking-tight leading-tight mb-2">{selectedProduct.name}</h3>
                                            <p className="text-slate-500 font-bold text-xs uppercase mb-8">{selectedProduct.brand} • {selectedProduct.category}</p>
                                            
                                            <div className="space-y-4 pt-6 border-t border-white/10">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Stock Sistema</span>
                                                    <span className="text-2xl font-black">{selectedProduct.stock}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs font-bold text-slate-400 italic">
                                                    <span>Costo Unit.</span>
                                                    <span>${selectedProduct.costAfterDiscounts.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm space-y-4">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Motivo de la Corrección</label>
                                        <select 
                                            className="w-full p-4 bg-slate-50 border border-gray-100 rounded-2xl font-black text-xs uppercase outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                            value={adjustmentReason}
                                            onChange={e => setAdjustmentReason(e.target.value)}
                                        >
                                            <option value="CONTEO FISICO">Conteo Físico / Inventario</option>
                                            <option value="ROTURA">Rotura / Daño</option>
                                            <option value="ROBO / EXTRAVIO">Robo / Extravío</option>
                                            <option value="CONSUMO INTERNO">Consumo Interno</option>
                                            <option value="DEV. PROVEEDOR">Devolución a Proveedor</option>
                                            <option value="ERROR CARGA">Error de Carga Anterior</option>
                                        </select>
                                        <p className="text-[9px] text-slate-400 italic px-2">Este motivo se guardará en el libro de auditoría.</p>
                                    </div>
                                </div>

                                {/* PANEL DE AJUSTE POR UBICACIÓN */}
                                <div className="lg:col-span-8 flex flex-col space-y-6">
                                    <div className="bg-white rounded-[3rem] p-10 border border-gray-200 shadow-sm flex-1 space-y-10">
                                        <div className="flex justify-between items-center border-b pb-6">
                                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3"><Layers size={22} className="text-indigo-600"/> Ajuste por Ubicación</h3>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nuevo Total Calculado</p>
                                                <h4 className="text-3xl font-black text-indigo-600 tracking-tighter">
                                                    {(adjustments.principal + adjustments.deposito + adjustments.sucursal).toLocaleString()}
                                                </h4>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                            <AdjustmentField 
                                                label="Principal" 
                                                value={adjustments.principal} 
                                                current={selectedProduct.stockPrincipal || 0}
                                                color="indigo"
                                                onChange={v => setAdjustments({...adjustments, principal: v})} 
                                            />
                                            <AdjustmentField 
                                                label="Depósito" 
                                                value={adjustments.deposito} 
                                                current={selectedProduct.stockDeposito || 0}
                                                color="emerald"
                                                onChange={v => setAdjustments({...adjustments, deposito: v})} 
                                            />
                                            <AdjustmentField 
                                                label="Sucursal" 
                                                value={adjustments.sucursal} 
                                                current={selectedProduct.stockSucursal || 0}
                                                color="orange"
                                                onChange={v => setAdjustments({...adjustments, sucursal: v})} 
                                            />
                                        </div>

                                        <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 flex items-start gap-4">
                                            <AlertTriangle className="text-amber-600 shrink-0 mt-1" size={24}/>
                                            <div className="space-y-1">
                                                <h5 className="font-black text-amber-800 uppercase text-[10px] tracking-widest">Advertencia de Seguridad</h5>
                                                <p className="text-xs text-amber-700 leading-relaxed font-medium">Usted está modificando existencias de forma manual. Este ajuste impactará directamente en la valuación de su stock y será registrado con su usuario para auditoría.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={handleSaveAdjustment}
                                        disabled={isProcessing}
                                        className="w-full bg-slate-900 text-white py-8 rounded-[2.5rem] font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-indigo-600 active:scale-95 transition-all flex items-center justify-center gap-4 text-sm"
                                    >
                                        {isProcessing ? <RefreshCw className="animate-spin" size={24}/> : <CheckCircle size={24}/>}
                                        {isProcessing ? 'PROCESANDO IMPACTO...' : 'CONFIRMAR Y APLICAR AJUSTE'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 space-y-6">
                                <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-inner border border-slate-100">
                                    <Database size={64} className="opacity-20"/>
                                </div>
                                <div className="text-center space-y-2">
                                    <h4 className="text-xl font-black uppercase tracking-tighter">Esperando selección...</h4>
                                    <p className="text-sm font-medium uppercase tracking-widest max-w-xs mx-auto">Use el buscador superior para localizar el producto que desea corregir.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'HISTORY' && (
                    <div className="bg-white rounded-[3rem] border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full animate-fade-in">
                        <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0">
                            <h3 className="font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3"><History size={22} className="text-indigo-600"/> Libro de Auditoría de Stock</h3>
                            <button onClick={() => { if(confirm('¿Desea borrar el historial?')) setHistory([]); }} className="text-[9px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2 hover:underline">
                                {/* Added Trash2 to handle manual history clearance */}
                                <Trash2 size={14}/> Limpiar Registro
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest sticky top-0 z-10">
                                    <tr>
                                        <th className="px-8 py-5">Fecha / Hora</th>
                                        <th className="px-8 py-5">Artículo</th>
                                        <th className="px-8 py-5">Ubicación</th>
                                        <th className="px-8 py-5 text-center">Variación</th>
                                        <th className="px-8 py-5">Motivo</th>
                                        <th className="px-8 py-5">Usuario</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-[11px]">
                                    {history.length === 0 ? (
                                        <tr><td colSpan={6} className="py-40 text-center text-slate-300 font-black uppercase tracking-widest">Sin ajustes registrados</td></tr>
                                    ) : history.map(log => {
                                        const diff = log.newQty - log.oldQty;
                                        return (
                                            <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-8 py-5 font-bold text-slate-400">{log.date}</td>
                                                <td className="px-8 py-5">
                                                    <p className="font-black text-slate-800 uppercase truncate max-w-[200px]">{log.productName}</p>
                                                    <p className="text-[8px] text-gray-400 font-mono mt-0.5">ID: {log.productId.slice(-8)}</p>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className={`px-2 py-1 rounded-lg font-black text-[8px] uppercase border ${
                                                        log.location === 'PRINCIPAL' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                                        log.location === 'DEPOSITO' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                        'bg-orange-50 text-orange-700 border-orange-100'
                                                    }`}>
                                                        {log.location}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-slate-400 font-bold line-through">{log.oldQty}</span>
                                                        <ArrowRight size={10} className="text-slate-300 my-0.5"/>
                                                        <span className="font-black text-slate-900 text-sm">{log.newQty}</span>
                                                        <span className={`text-[8px] font-black uppercase mt-1 ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                            ({diff > 0 ? '+' : ''}{diff})
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-tighter">{log.reason}</span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-2 text-slate-500 font-bold">
                                                        <div className="w-6 h-6 bg-slate-200 rounded-lg flex items-center justify-center text-slate-500"><User size={12}/></div>
                                                        {log.user}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- COMPONENTE INTERNO: CAMPO DE AJUSTE ---
const AdjustmentField: React.FC<{ 
    label: string, 
    value: number, 
    current: number,
    color: 'indigo' | 'emerald' | 'orange',
    onChange: (v: number) => void 
}> = ({ label, value, current, color, onChange }) => {
    const colorClasses = {
        indigo: 'bg-indigo-50 border-indigo-100 text-indigo-900 focus-within:ring-indigo-500 ring-indigo-50',
        emerald: 'bg-emerald-50 border-emerald-100 text-emerald-900 focus-within:ring-emerald-500 ring-emerald-50',
        orange: 'bg-orange-50 border-orange-100 text-orange-900 focus-within:ring-orange-500 ring-orange-50'
    };

    const diff = value - current;

    return (
        <div className={`p-8 rounded-[2.5rem] border-2 transition-all flex flex-col space-y-6 ${colorClasses[color]}`}>
            <div className="flex justify-between items-start">
                <div>
                    <h5 className="font-black uppercase tracking-widest text-[11px] mb-1">{label}</h5>
                    <p className="text-[9px] font-bold opacity-40 uppercase">Existencia actual: {current}</p>
                </div>
                {diff !== 0 && (
                    <span className={`px-2 py-0.5 rounded-lg font-black text-[9px] uppercase ${diff > 0 ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                        {diff > 0 ? '+' : ''}{diff}
                    </span>
                )}
            </div>
            
            <div className="relative group">
                <input 
                    type="number" 
                    className="w-full bg-white/60 backdrop-blur-md p-6 rounded-[2rem] font-black text-5xl text-center outline-none transition-all shadow-inner focus:bg-white"
                    value={value}
                    onChange={e => onChange(parseFloat(e.target.value) || 0)}
                />
                <div className="absolute inset-y-0 left-4 flex flex-col justify-center space-y-2">
                    <button onClick={() => onChange(value + 1)} className="p-1 bg-white rounded-lg shadow-sm hover:scale-110 active:scale-95 transition-transform"><Plus size={16}/></button>
                    <button onClick={() => onChange(Math.max(0, value - 1))} className="p-1 bg-white rounded-lg shadow-sm hover:scale-110 active:scale-95 transition-transform"><Minus size={16}/></button>
                </div>
            </div>

            <div className="pt-2">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[8px] font-black uppercase opacity-40">Ubicación física</span>
                    <span className="text-[8px] font-black uppercase opacity-40">Diferencial</span>
                </div>
                <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-700 ${diff === 0 ? 'bg-slate-400' : diff > 0 ? 'bg-green-500' : 'bg-red-500'}`} 
                        style={{ width: '100%' }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

export default StockAdjustment;
