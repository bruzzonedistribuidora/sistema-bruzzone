
import React, { useState, useMemo, useEffect } from 'react';
import { 
    Search, Save, X, Layers, CheckCircle, Trash2, Filter, 
    ArrowRight, Info, AlertTriangle, Package, Tag, Building2, 
    Percent, DollarSign, RefreshCw, Smartphone, Plus, CheckSquare, Square,
    ChevronRight, Boxes, ListFilter, Zap
} from 'lucide-react';
import { Product, Brand, Category, Provider } from '../types';

const MassProductUpdate: React.FC = () => {
    // --- DATOS MAESTROS ---
    const [products, setProducts] = useState<Product[]>(() => {
        const saved = localStorage.getItem('ferrecloud_products');
        return saved ? JSON.parse(saved) : [];
    });

    const [brands] = useState<Brand[]>(() => JSON.parse(localStorage.getItem('ferrecloud_brands') || '[]'));
    const [categories] = useState<Category[]>(() => JSON.parse(localStorage.getItem('ferrecloud_categories') || '[]'));
    const [providers] = useState<Provider[]>(() => JSON.parse(localStorage.getItem('ferrecloud_providers') || '[]'));

    // --- FILTROS DE BÚSQUEDA ---
    const [searchTerm, setSearchTerm] = useState('');
    const [searchCode, setSearchCode] = useState('');
    
    // --- ESTADO DE SELECCIÓN ---
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // --- ESTADO DE CAMBIOS MASIVOS ---
    const [massForm, setMassForm] = useState({
        brand: '',
        category: '',
        provider: '',
        reorderPoint: '',
        desiredStock: ''
    });

    const [isApplying, setIsApplying] = useState(false);

    // --- LÓGICA DE FILTRADO ---
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchName = !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchCode = !searchCode || 
                p.internalCodes.some(c => c.toLowerCase().includes(searchCode.toLowerCase())) ||
                p.barcodes.some(c => c.toLowerCase().includes(searchCode.toLowerCase()));
            return matchName && matchCode;
        });
    }, [products, searchTerm, searchCode]);

    // --- MANEJADORES DE SELECCIÓN ---
    const toggleSelectAll = () => {
        if (selectedIds.size === filteredProducts.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredProducts.map(p => p.id)));
        }
    };

    const toggleSelectOne = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    // --- APLICAR CAMBIOS ---
    const handleApplyMassChanges = () => {
        if (selectedIds.size === 0) {
            alert("Seleccione al menos un artículo para modificar.");
            return;
        }

        const hasAnyChange = Object.values(massForm).some(v => v !== '');
        if (!hasAnyChange) {
            alert("Seleccione al menos un atributo para cambiar.");
            return;
        }

        if (!confirm(`¿Confirmar actualización masiva de ${selectedIds.size} artículos?`)) return;

        setIsApplying(true);

        setTimeout(() => {
            const updatedProducts = products.map(p => {
                if (selectedIds.has(p.id)) {
                    return {
                        ...p,
                        brand: massForm.brand || p.brand,
                        category: massForm.category || p.category,
                        provider: massForm.provider || p.provider,
                        reorderPoint: massForm.reorderPoint !== '' ? parseFloat(massForm.reorderPoint) : p.reorderPoint,
                        desiredStock: massForm.desiredStock !== '' ? parseFloat(massForm.desiredStock) : p.desiredStock
                    };
                }
                return p;
            });

            setProducts(updatedProducts);
            localStorage.setItem('ferrecloud_products', JSON.stringify(updatedProducts));
            
            setIsApplying(false);
            setSelectedIds(new Set());
            setMassForm({ brand: '', category: '', provider: '', reorderPoint: '', desiredStock: '' });
            alert("Cambios masivos aplicados con éxito.");
        }, 800);
    };

    return (
        <div className="p-4 md:p-6 h-full flex flex-col space-y-4 bg-slate-50 overflow-hidden font-sans">
            
            {/* CABECERA Y BUSCADORES */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-gray-200 shadow-sm shrink-0">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                        <Layers className="text-indigo-600"/> Modificación Masiva de Artículos
                    </h2>
                    <div className="flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100">
                        <span className="text-[10px] font-black text-indigo-600 uppercase">Seleccionados:</span>
                        <span className="bg-indigo-600 text-white px-3 py-0.5 rounded-full text-xs font-black">{selectedIds.size}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar por Descripción..." 
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-100 shadow-sm transition-all uppercase"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="relative group">
                        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar por Código (SKU / Barras)..." 
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-100 shadow-sm transition-all uppercase"
                            value={searchCode}
                            onChange={e => setSearchCode(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* TABLA DE RESULTADOS */}
            <div className="flex-1 bg-white border border-gray-200 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col">
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4 w-10 text-center">
                                    <button onClick={toggleSelectAll} className="hover:scale-110 transition-transform">
                                        {selectedIds.size === filteredProducts.length && filteredProducts.length > 0 ? <CheckSquare size={18} className="text-indigo-400"/> : <Square size={18} className="text-slate-500"/>}
                                    </button>
                                </th>
                                <th className="px-4 py-4">Cód. SKU</th>
                                <th className="px-4 py-4">Descripción Comercial</th>
                                <th className="px-4 py-4">Marca</th>
                                <th className="px-4 py-4">Categoría</th>
                                <th className="px-4 py-4">Proveedor Actual</th>
                                <th className="px-4 py-4 text-center">P. Pedido</th>
                            </tr>
                        </thead>
                        <tbody className="text-[11px] font-medium text-slate-700 divide-y divide-gray-100">
                            {filteredProducts.map(p => (
                                <tr key={p.id} className={`hover:bg-indigo-50/30 transition-colors group ${selectedIds.has(p.id) ? 'bg-indigo-50/50' : ''}`}>
                                    <td className="px-6 py-3 text-center">
                                        <button onClick={() => toggleSelectOne(p.id)} className="hover:scale-110 transition-transform">
                                            {selectedIds.has(p.id) ? <CheckSquare size={18} className="text-indigo-600"/> : <Square size={18} className="text-slate-200"/>}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 font-mono font-bold text-indigo-600">{p.internalCodes[0]}</td>
                                    <td className="px-4 py-3 font-black uppercase text-slate-800">{p.name}</td>
                                    <td className="px-4 py-3 uppercase text-slate-500">{p.brand}</td>
                                    <td className="px-4 py-3 uppercase text-slate-500">{p.category}</td>
                                    <td className="px-4 py-3 uppercase text-slate-400 font-bold">{p.provider}</td>
                                    <td className="px-4 py-3 text-center font-black text-slate-900">{p.reorderPoint}</td>
                                </tr>
                            ))}
                            {filteredProducts.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="py-20 text-center text-slate-300 font-black uppercase tracking-widest italic">
                                        No se encontraron artículos con los filtros actuales
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* PANEL DE ACCIÓN MASIVA (CONSOLA) */}
            <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl space-y-6 shrink-0 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><RefreshCw size={180}/></div>
                
                <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-2">
                    <Zap className="text-indigo-400" size={20}/>
                    <h3 className="text-sm font-black uppercase tracking-widest">Aplicar nuevos valores a la selección</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    <div>
                        <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Nueva Marca</label>
                        <select 
                            className="w-full bg-white/10 border border-white/10 rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all uppercase"
                            value={massForm.brand}
                            onChange={e => setMassForm({...massForm, brand: e.target.value})}
                        >
                            <option value="" className="text-slate-900">-- No cambiar --</option>
                            {brands.map(b => <option key={b.id} value={b.name} className="text-slate-900">{b.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Nueva Categoría</label>
                        <select 
                            className="w-full bg-white/10 border border-white/10 rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all uppercase"
                            value={massForm.category}
                            onChange={e => setMassForm({...massForm, category: e.target.value})}
                        >
                            <option value="" className="text-slate-900">-- No cambiar --</option>
                            {categories.map(c => <option key={c.id} value={c.name} className="text-slate-900">{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Nuevo Proveedor</label>
                        <select 
                            className="w-full bg-white/10 border border-white/10 rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all uppercase"
                            value={massForm.provider}
                            onChange={e => setMassForm({...massForm, provider: e.target.value})}
                        >
                            <option value="" className="text-slate-900">-- No cambiar --</option>
                            {providers.map(p => <option key={p.id} value={p.name} className="text-slate-900">{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Punto de Pedido</label>
                        <input 
                            type="number" 
                            placeholder="Ej: 10" 
                            className="w-full bg-white/10 border border-white/10 rounded-xl p-3 text-xs font-black outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-center"
                            value={massForm.reorderPoint}
                            onChange={e => setMassForm({...massForm, reorderPoint: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Stock Deseado</label>
                        <input 
                            type="number" 
                            placeholder="Ej: 50" 
                            className="w-full bg-white/10 border border-white/10 rounded-xl p-3 text-xs font-black outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-center"
                            value={massForm.desiredStock}
                            onChange={e => setMassForm({...massForm, desiredStock: e.target.value})}
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-white/10">
                    <button 
                        onClick={handleApplyMassChanges}
                        disabled={selectedIds.size === 0 || isApplying}
                        className="bg-indigo-500 hover:bg-indigo-400 text-white px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl transition-all active:scale-95 disabled:opacity-20 flex items-center gap-3"
                    >
                        {isApplying ? <RefreshCw className="animate-spin" size={18}/> : <CheckCircle size={18}/>}
                        {isApplying ? 'Procesando cambios...' : `Actualizar ${selectedIds.size} Artículos`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MassProductUpdate;
