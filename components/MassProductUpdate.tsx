import React, { useState, useMemo, useEffect } from 'react';
import { 
    Search, Save, X, Layers, CheckCircle, Trash2, Filter, 
    ArrowRight, Info, AlertTriangle, Package, Tag, Building2, 
    Percent, DollarSign, RefreshCw, Smartphone, Plus, CheckSquare, Square,
    ChevronRight, Boxes, ListFilter, Zap, ChevronUp, ChevronDown,
    Calculator, Trash, Check as CheckIcon
} from 'lucide-react';
import { Product, Brand, Category, Provider } from '../types';
import { productDB } from '../services/storageService';

const MassProductUpdate: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [brands] = useState<Brand[]>(() => JSON.parse(localStorage.getItem('ferrecloud_brands') || '[]'));
    const [categories] = useState<Category[]>(() => JSON.parse(localStorage.getItem('ferrecloud_categories') || '[]'));
    const [providers] = useState<Provider[]>(() => JSON.parse(localStorage.getItem('ferrecloud_providers') || '[]'));

    // Filtros de búsqueda (Bloque Superior)
    const [searchName, setSearchName] = useState('');
    const [searchCode, setSearchCode] = useState('');
    const [searchBrand, setSearchBrand] = useState('');
    const [searchCategory, setSearchCategory] = useState('');
    const [searchProvider, setSearchProvider] = useState('');
    
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [tempChanges, setTempChanges] = useState<Record<string, Partial<Product>>>({});

    // Atributos a cambiar (Bloque Medio)
    const [massForm, setMassForm] = useState({
        brand: '',
        category: '',
        provider: '',
        reorderPoint: '',
        stockMaximo: '',
        profitMargin: '',
        vatRate: '',
        purchasePackageQuantity: ''
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

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchName = !searchName || p.name.toLowerCase().includes(searchName.toLowerCase());
            const matchCode = !searchCode || 
                (p.internalCodes && p.internalCodes.some(c => c.toLowerCase().includes(searchCode.toLowerCase())));
            const matchBrand = !searchBrand || p.brand === searchBrand;
            const matchCategory = !searchCategory || p.category === searchCategory;
            const matchProvider = !searchProvider || p.provider === searchProvider;
            
            return matchName && matchCode && matchBrand && matchCategory && matchProvider;
        });
    }, [products, searchName, searchCode, searchBrand, searchCategory, searchProvider]);

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredProducts.length && filteredProducts.length > 0) {
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

    const handleApplyMassChanges = () => {
        if (selectedIds.size === 0) {
            alert("Seleccione al menos un artículo en la grilla.");
            return;
        }

        const nextTemp = { ...tempChanges };
        selectedIds.forEach(id => {
            const p = products.find(prod => prod.id === id);
            if (!p) return;

            const updates: any = {};
            if (massForm.brand) updates.brand = massForm.brand;
            if (massForm.category) updates.category = massForm.category;
            if (massForm.provider) updates.provider = massForm.provider;
            if (massForm.reorderPoint !== '') updates.reorderPoint = parseFloat(massForm.reorderPoint);
            if (massForm.stockMaximo !== '') updates.stockMaximo = parseFloat(massForm.stockMaximo);
            if (massForm.profitMargin !== '') updates.profitMargin = parseFloat(massForm.profitMargin);
            if (massForm.vatRate !== '') updates.vatRate = parseFloat(massForm.vatRate);
            if (massForm.purchasePackageQuantity !== '') updates.purchasePackageQuantity = parseFloat(massForm.purchasePackageQuantity);

            nextTemp[id] = { ...(nextTemp[id] || {}), ...updates };
        });

        setTempChanges(nextTemp);
        alert(`Aplicado a ${selectedIds.size} ítems. Presione 'Guardar' para persistir.`);
    };

    const handleSaveToDB = async () => {
        const idsToUpdate = Object.keys(tempChanges);
        if (idsToUpdate.length === 0) {
            alert("No hay cambios pendientes para guardar.");
            return;
        }

        setIsApplying(true);
        const updatedProducts = products.filter(p => idsToUpdate.includes(p.id)).map(p => {
            const updates = tempChanges[p.id];
            const updated = { ...p, ...updates };
            
            // Recalcular precios si cambió el margen o el IVA
            if (updates.profitMargin || updates.vatRate) {
                const priceNeto = updated.costAfterDiscounts * (1 + (updated.profitMargin || 0) / 100);
                const priceFinal = priceNeto * (1 + (updated.vatRate || 21) / 100);
                updated.priceNeto = parseFloat(priceNeto.toFixed(2));
                updated.priceFinal = parseFloat(priceFinal.toFixed(2));
            }
            
            return updated;
        });

        await productDB.saveBulk(updatedProducts);
        setTempChanges({});
        await loadProducts();
        setIsApplying(false);
        alert("✅ Cambios guardados exitosamente en la base de datos.");
    };

    return (
        <div className="h-full bg-slate-300 p-2 flex flex-col space-y-2 font-sans overflow-hidden border-4 border-slate-400">
            
            {/* BLOQUE 1: FILTROS DE BUSQUEDA */}
            <div className="bg-slate-200 border border-slate-500 p-3 rounded shadow-sm">
                <div className="flex items-center gap-2 mb-2 border-b border-slate-400 pb-1">
                    <span className="text-[10px] font-black uppercase text-slate-600">Filtros de busqueda</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-2">
                    <div className="flex items-center gap-2">
                        <label className="w-20 text-right text-[11px] font-bold">Nombre:</label>
                        <input className="flex-1 border border-slate-400 bg-white p-1 text-xs uppercase" value={searchName} onChange={e => setSearchName(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="w-20 text-right text-[11px] font-bold">Codigo:</label>
                        <input className="flex-1 border border-slate-400 bg-white p-1 text-xs" value={searchCode} onChange={e => setSearchCode(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="w-20 text-right text-[11px] font-bold">Marca:</label>
                        <select className="flex-1 border border-slate-400 bg-white p-1 text-xs uppercase" value={searchBrand} onChange={e => setSearchBrand(e.target.value)}>
                            <option value="">TODAS</option>
                            {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="w-20 text-right text-[11px] font-bold">Rubro:</label>
                        <select className="flex-1 border border-slate-400 bg-white p-1 text-xs uppercase" value={searchCategory} onChange={e => setSearchCategory(e.target.value)}>
                            <option value="">TODOS</option>
                            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="w-20 text-right text-[11px] font-bold">Proveedor:</label>
                        <select className="flex-1 border border-slate-400 bg-white p-1 text-xs uppercase" value={searchProvider} onChange={e => setSearchProvider(e.target.value)}>
                            <option value="">TODOS</option>
                            {providers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-4 col-span-2 pl-24">
                        <label className="flex items-center gap-1 text-[10px] font-bold"><input type="checkbox" className="w-3 h-3" /> Sincroniza Online</label>
                        <label className="flex items-center gap-1 text-[10px] font-bold"><input type="checkbox" className="w-3 h-3" /> Tiene Foto</label>
                        <label className="flex items-center gap-1 text-[10px] font-bold"><input type="checkbox" className="w-3 h-3" /> Con Stock</label>
                    </div>
                    <div className="flex justify-end">
                        <button onClick={loadProducts} className="bg-slate-100 border-2 border-slate-500 px-6 py-1 font-bold text-xs hover:bg-slate-200 flex items-center gap-2">
                            <Search size={14}/> Buscar
                        </button>
                    </div>
                </div>
            </div>

            {/* BLOQUE 2: ATRIBUTOS A CAMBIAR */}
            <div className="bg-slate-200 border border-slate-500 p-3 rounded shadow-sm">
                <div className="flex items-center gap-2 mb-2 border-b border-slate-400 pb-1">
                    <span className="text-[10px] font-black uppercase text-slate-600">Seleccione los productos y atributos a cambiar</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-2">
                    <div className="flex items-center gap-2">
                        <label className="w-20 text-right text-[11px] font-bold">Marca:</label>
                        <select className="flex-1 border border-slate-400 bg-white p-1 text-xs uppercase" value={massForm.brand} onChange={e => setMassForm({...massForm, brand: e.target.value})}>
                            <option value="">-- NO CAMBIAR --</option>
                            {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="w-20 text-right text-[11px] font-bold">Rubro:</label>
                        <select className="flex-1 border border-slate-400 bg-white p-1 text-xs uppercase" value={massForm.category} onChange={e => setMassForm({...massForm, category: e.target.value})}>
                            <option value="">-- NO CAMBIAR --</option>
                            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="w-20 text-right text-[11px] font-bold">Proveedor:</label>
                        <select className="flex-1 border border-slate-400 bg-white p-1 text-xs uppercase" value={massForm.provider} onChange={e => setMassForm({...massForm, provider: e.target.value})}>
                            <option value="">-- NO CAMBIAR --</option>
                            {providers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="w-20 text-right text-[11px] font-bold">IVA:</label>
                        <select className="flex-1 border border-slate-400 bg-white p-1 text-xs" value={massForm.vatRate} onChange={e => setMassForm({...massForm, vatRate: e.target.value})}>
                            <option value="">-- NO CAMBIAR --</option>
                            <option value="21">21.0%</option>
                            <option value="10.5">10.5%</option>
                            <option value="0">EXENTO</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="w-20 text-right text-[11px] font-bold">P.Pedido:</label>
                        <div className="flex items-center gap-1 flex-1">
                             <input type="checkbox" className="w-3 h-3" />
                             <input type="number" className="flex-1 border border-slate-400 bg-white p-1 text-xs text-right" value={massForm.reorderPoint} onChange={e => setMassForm({...massForm, reorderPoint: e.target.value})} />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="w-20 text-right text-[11px] font-bold">Stock Des.:</label>
                        <div className="flex items-center gap-1 flex-1">
                             <input type="checkbox" className="w-3 h-3" />
                             <input type="number" className="flex-1 border border-slate-400 bg-white p-1 text-xs text-right" value={massForm.stockMaximo} onChange={e => setMassForm({...massForm, stockMaximo: e.target.value})} />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="w-20 text-right text-[11px] font-bold">% Ganancia:</label>
                        <input type="number" className="flex-1 border border-slate-400 bg-white p-1 text-xs text-right text-indigo-700 font-bold" value={massForm.profitMargin} onChange={e => setMassForm({...massForm, profitMargin: e.target.value})} />
                    </div>
                    <div className="flex justify-end">
                        <button onClick={handleApplyMassChanges} className="bg-slate-100 border-2 border-green-700 text-green-800 px-6 py-1 font-black text-xs hover:bg-green-50 flex items-center gap-2 shadow-sm">
                            <CheckIcon size={14}/> Aplicar
                        </button>
                    </div>
                </div>
            </div>

            {/* BLOQUE 3: GRILLA RESULTADOS */}
            <div className="flex-1 bg-white border border-slate-500 overflow-hidden flex flex-col rounded-sm">
                <div className="overflow-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-max">
                        <thead className="bg-slate-800 text-white text-[10px] font-black uppercase sticky top-0 z-10">
                            <tr className="divide-x divide-slate-600">
                                <th className="p-2 w-10 text-center">
                                    <button onClick={toggleSelectAll} className="w-4 h-4 bg-white border border-slate-400 rounded flex items-center justify-center">
                                        {selectedIds.size > 0 && <div className="w-2 h-2 bg-indigo-600"></div>}
                                    </button>
                                </th>
                                <th className="p-2">Codigo</th>
                                <th className="p-2">Nombre</th>
                                <th className="p-2 text-center">Stock Cal.</th>
                                <th className="p-2 text-center">Pto.Pedido</th>
                                <th className="p-2 text-center">Stock Deseado</th>
                                <th className="p-2">Marca</th>
                                <th className="p-2">Rubro</th>
                                <th className="p-2">Proveedor</th>
                                <th className="p-2 text-right">Ganancia</th>
                            </tr>
                        </thead>
                        <tbody className="text-[11px] divide-y divide-slate-200">
                            {filteredProducts.map(p => {
                                const changes = tempChanges[p.id] || {};
                                return (
                                    <tr key={p.id} className={`hover:bg-yellow-50 transition-colors divide-x divide-slate-100 ${selectedIds.has(p.id) ? 'bg-blue-50' : ''}`}>
                                        <td className="p-2 text-center">
                                            <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelectOne(p.id)} />
                                        </td>
                                        <td className="p-2 font-bold text-indigo-700">{p.internalCodes[0]}</td>
                                        <td className="p-2 font-bold uppercase truncate max-w-[300px]">{p.name}</td>
                                        <td className="p-2 text-center font-black text-slate-500">{p.stock}</td>
                                        <td className="p-2 text-center font-bold">
                                            {changes.reorderPoint !== undefined ? <span className="text-green-600">{changes.reorderPoint}</span> : p.reorderPoint}
                                        </td>
                                        <td className="p-2 text-center font-bold">
                                            {changes.stockMaximo !== undefined ? <span className="text-green-600">{changes.stockMaximo}</span> : p.stockMaximo}
                                        </td>
                                        <td className={`p-2 uppercase font-bold ${changes.brand ? 'text-green-600' : 'text-slate-400'}`}>
                                            {changes.brand || p.brand}
                                        </td>
                                        <td className={`p-2 uppercase font-bold ${changes.category ? 'text-green-600' : 'text-slate-400'}`}>
                                            {changes.category || p.category}
                                        </td>
                                        <td className={`p-2 uppercase font-bold ${changes.provider ? 'text-green-600' : 'text-slate-400'}`}>
                                            {changes.provider || p.provider}
                                        </td>
                                        <td className={`p-2 text-right font-black ${changes.profitMargin ? 'text-green-600' : 'text-slate-900'}`}>
                                            {changes.profitMargin || p.profitMargin}%
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredProducts.length === 0 && (
                                <tr><td colSpan={10} className="p-20 text-center text-slate-300 font-black uppercase tracking-widest">No hay artículos para los filtros seleccionados</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* BARRA DE ACCIONES INFERIOR */}
            <div className="bg-slate-200 border-t-2 border-slate-500 p-2 flex justify-between items-center shrink-0">
                <button 
                    onClick={() => { if(confirm('¿Eliminar seleccionados?')) setSelectedIds(new Set()); }}
                    className="flex items-center gap-2 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded font-bold text-[10px] uppercase hover:bg-red-200"
                >
                    <Trash size={14}/> Eliminar productos seleccionados
                </button>
                
                <div className="flex gap-2">
                    <button 
                        onClick={handleSaveToDB} 
                        disabled={isApplying || Object.keys(tempChanges).length === 0}
                        className="bg-slate-800 text-white border-b-4 border-slate-900 px-10 py-2 rounded font-black text-xs uppercase flex items-center gap-2 hover:bg-slate-700 active:translate-y-1 transition-all disabled:opacity-30 shadow-lg"
                    >
                        {isApplying ? <RefreshCw className="animate-spin" size={14}/> : <Save size={16}/>} Guardar
                    </button>
                    <button 
                        onClick={() => { setTempChanges({}); setSelectedIds(new Set()); }}
                        className="bg-slate-100 border-2 border-slate-500 px-8 py-2 rounded font-black text-xs uppercase hover:bg-slate-200 shadow-sm"
                    >
                        <X size={16}/> Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MassProductUpdate;
