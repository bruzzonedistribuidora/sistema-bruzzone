import React, { useState, useMemo, useEffect } from 'react';
import { 
    Search, Save, X, Layers, CheckCircle, Trash2, Filter, 
    ArrowRight, Info, AlertTriangle, Package, Tag, Building2, 
    Percent, DollarSign, RefreshCw, Smartphone, Plus, CheckSquare, Square,
    ChevronRight, Boxes, ListFilter, Zap, ChevronUp, ChevronDown,
    Calculator
} from 'lucide-react';
import { Product, Brand, Category, Provider } from '../types';
import { productDB } from '../services/storageService';

const MassProductUpdate: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [brands] = useState<Brand[]>(() => JSON.parse(localStorage.getItem('ferrecloud_brands') || '[]'));
    const [categories] = useState<Category[]>(() => JSON.parse(localStorage.getItem('ferrecloud_categories') || '[]'));
    const [providers] = useState<Provider[]>(() => JSON.parse(localStorage.getItem('ferrecloud_providers') || '[]'));

    const [searchTerm, setSearchTerm] = useState('');
    const [searchCode, setSearchCode] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

    const [massForm, setMassForm] = useState({
        brand: '',
        category: '',
        provider: '',
        reorderPoint: '',
        stockMaximo: '',
        // Nuevos campos para bonificaciones
        disc1: '',
        disc2: '',
        disc3: '',
        disc4: ''
    });

    const [isApplying, setIsApplying] = useState(false);

    const loadProducts = async () => {
        const all = await productDB.getAll();
        setProducts(all);
    };

    useEffect(() => {
        loadProducts();
        const handleUpdate = () => loadProducts();
        window.addEventListener('ferrecloud_products_updated', handleUpdate);
        return () => window.removeEventListener('ferrecloud_products_updated', handleUpdate);
    }, []);

    const filteredAndSortedProducts = useMemo(() => {
        let items = products.filter(p => {
            const matchName = !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchCode = !searchCode || 
                (p.internalCodes && p.internalCodes.some(c => c.toLowerCase().includes(searchCode.toLowerCase()))) ||
                (p.barcodes && p.barcodes.some(c => c.toLowerCase().includes(searchCode.toLowerCase())));
            return matchName && matchCode;
        });

        items.sort((a, b) => {
            let aValue: any;
            let bValue: any;

            switch (sortConfig.key) {
                case 'code':
                    aValue = a.internalCodes?.[0] || '';
                    bValue = b.internalCodes?.[0] || '';
                    break;
                case 'name':
                    aValue = (a.name || '').toLowerCase();
                    bValue = (b.name || '').toLowerCase();
                    break;
                case 'brand':
                    aValue = (a.brand || '').toLowerCase();
                    bValue = (b.brand || '').toLowerCase();
                    break;
                case 'category':
                    aValue = (a.category || '').toLowerCase();
                    bValue = (b.category || '').toLowerCase();
                    break;
                case 'provider':
                    aValue = (a.provider || '').toLowerCase();
                    bValue = (b.provider || '').toLowerCase();
                    break;
                case 'reorderPoint':
                    aValue = a.reorderPoint || 0;
                    bValue = b.reorderPoint || 0;
                    break;
                default:
                    aValue = ''; bValue = '';
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return items.slice(0, 200);
    }, [products, searchTerm, searchCode, sortConfig]);

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: string) => {
        if (sortConfig.key !== key) return <div className="w-4 h-4 opacity-20"><ChevronUp size={12}/></div>;
        return sortConfig.direction === 'asc' ? <ChevronUp size={12} className="text-indigo-400"/> : <ChevronDown size={12} className="text-indigo-400"/>;
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredAndSortedProducts.length && filteredAndSortedProducts.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredAndSortedProducts.map(p => p.id)));
        }
    };

    const toggleSelectOne = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const handleApplyMassChanges = async () => {
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

        // Lógica de cálculo de bonificación masiva
        const d1 = parseFloat(massForm.disc1) || 0;
        const d2 = parseFloat(massForm.disc2) || 0;
        const d3 = parseFloat(massForm.disc3) || 0;
        const d4 = parseFloat(massForm.disc4) || 0;
        
        const changeDiscounts = massForm.disc1 !== '' || massForm.disc2 !== '' || massForm.disc3 !== '' || massForm.disc4 !== '';
        const newCoef = changeDiscounts ? (1 - d1/100) * (1 - d2/100) * (1 - d3/100) * (1 - d4/100) : null;

        const updatedProducts = products.filter(p => selectedIds.has(p.id)).map(p => {
            const finalBrand = massForm.brand || p.brand;
            const finalCategory = massForm.category || p.category;
            const finalProvider = massForm.provider || p.provider;
            const finalReorderPoint = massForm.reorderPoint !== '' ? parseFloat(massForm.reorderPoint) : p.reorderPoint;
            const finalStockMaximo = massForm.stockMaximo !== '' ? parseFloat(massForm.stockMaximo) : p.stockMaximo;
            
            // Si hay cambio de descuentos, recalculamos costos y precios
            let finalCoef = p.coeficienteBonificacionCosto || 1;
            let finalDiscounts = p.discounts || [0, 0, 0, 0];

            if (changeDiscounts) {
                finalCoef = newCoef!;
                finalDiscounts = [d1, d2, d3, d4];
            }

            const costAfterDiscounts = p.listCost * finalCoef;
            const priceNeto = costAfterDiscounts * (1 + (p.profitMargin || 30) / 100);
            const priceFinal = priceNeto * (1 + (p.vatRate || 21) / 100);

            return {
                ...p,
                brand: finalBrand,
                category: finalCategory,
                provider: finalProvider,
                reorderPoint: finalReorderPoint,
                stockMaximo: finalStockMaximo,
                discounts: finalDiscounts,
                coeficienteBonificacionCosto: finalCoef,
                costAfterDiscounts: parseFloat(costAfterDiscounts.toFixed(2)),
                priceNeto: parseFloat(priceNeto.toFixed(2)),
                priceFinal: parseFloat(priceFinal.toFixed(2))
            };
        });

        await productDB.saveBulk(updatedProducts);
        
        setIsApplying(false);
        setSelectedIds(new Set());
        setMassForm({ brand: '', category: '', provider: '', reorderPoint: '', stockMaximo: '', disc1: '', disc2: '', disc3: '', disc4: '' });
        alert("Cambios masivos aplicados con éxito. Se han recalculado costos y precios finales.");
    };

    return (
        <div className="p-4 md:p-6 h-full flex flex-col space-y-4 bg-slate-50 overflow-hidden font-sans">
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

            <div className="flex-1 bg-white border border-gray-200 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col">
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4 w-10 text-center">
                                    <button onClick={toggleSelectAll} className="hover:scale-110 transition-transform">
                                        {selectedIds.size === filteredAndSortedProducts.length && filteredAndSortedProducts.length > 0 ? <CheckSquare size={18} className="text-indigo-400"/> : <Square size={18} className="text-slate-500"/>}
                                    </button>
                                </th>
                                <th className="px-4 py-4 cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => requestSort('code')}>
                                    <div className="flex items-center gap-2">Cód. SKU {getSortIcon('code')}</div>
                                </th>
                                <th className="px-4 py-4 cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => requestSort('name')}>
                                    <div className="flex items-center gap-2">Descripción Comercial {getSortIcon('name')}</div>
                                </th>
                                <th className="px-4 py-4 cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => requestSort('brand')}>
                                    <div className="flex items-center gap-2">Marca {getSortIcon('brand')}</div>
                                </th>
                                <th className="px-4 py-4 cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => requestSort('category')}>
                                    <div className="flex items-center gap-2">Categoría {getSortIcon('category')}</div>
                                </th>
                                <th className="px-4 py-4 cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => requestSort('provider')}>
                                    <div className="flex items-center gap-2">Proveedor Actual {getSortIcon('provider')}</div>
                                </th>
                                <th className="px-4 py-4 text-right">Bonif. Actual</th>
                            </tr>
                        </thead>
                        <tbody className="text-[11px] font-medium text-slate-700 divide-y divide-gray-100">
                            {filteredAndSortedProducts.map(p => (
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
                                    <td className="px-4 py-3 text-right">
                                        <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded">
                                            {p.discounts?.filter(d => d > 0).join('+') || '0%'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl space-y-8 shrink-0 relative overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    <div className="md:col-span-1">
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
                        <input type="number" className="w-full bg-white/10 border border-white/10 rounded-xl p-3 text-xs font-black outline-none" placeholder="Mantener" value={massForm.reorderPoint} onChange={e => setMassForm({...massForm, reorderPoint: e.target.value})}/>
                    </div>
                    <div>
                        <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Stock Deseado</label>
                        <input type="number" className="w-full bg-white/10 border border-white/10 rounded-xl p-3 text-xs font-black outline-none" placeholder="Mantener" value={massForm.stockMaximo} onChange={e => setMassForm({...massForm, stockMaximo: e.target.value})}/>
                    </div>
                </div>

                <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Calculator size={16} className="text-indigo-400"/>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Actualización Masiva de Bonificaciones (Cadena de Descuentos)</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(num => (
                            <div key={num} className="space-y-1">
                                <label className="text-[8px] font-black text-slate-500 uppercase ml-2 tracking-widest">Desc. {num} (%)</label>
                                <div className="relative">
                                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={12}/>
                                    <input 
                                        type="number" 
                                        placeholder="0"
                                        className="w-full pl-8 p-3 bg-white/5 border border-white/10 rounded-xl text-sm font-black text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                        value={massForm[`disc${num}` as keyof typeof massForm]}
                                        onChange={e => setMassForm({...massForm, [`disc${num}`]: e.target.value})}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="bg-indigo-500/10 p-4 rounded-2xl flex items-start gap-3 border border-indigo-500/20">
                        <Info size={16} className="text-indigo-400 shrink-0 mt-0.5"/>
                        <p className="text-[9px] text-indigo-300 font-medium leading-relaxed uppercase">
                            Si completa estos campos, el sistema sobrescribirá las bonificaciones actuales de los productos seleccionados y recalculará automáticamente los costos netos y precios finales basados en la lista de precios base.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-white/10">
                    <button 
                        onClick={handleApplyMassChanges}
                        disabled={selectedIds.size === 0 || isApplying}
                        className="bg-indigo-500 hover:bg-indigo-400 text-white px-12 py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95 disabled:opacity-20 flex items-center gap-3 text-xs"
                    >
                        {isApplying ? <RefreshCw className="animate-spin" size={18}/> : <CheckCircle size={18}/>}
                        {isApplying ? 'Procesando cambios...' : `Impactar Cambios en ${selectedIds.size} Artículos`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MassProductUpdate;
