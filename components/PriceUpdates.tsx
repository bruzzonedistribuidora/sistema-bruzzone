
import React, { useState, useEffect, useMemo } from 'react';
import { 
    RefreshCw, Search, Layers, TrendingUp, Save, 
    Filter, Tag, Package, Building2, CheckCircle,
    Percent, DollarSign, ArrowRight, AlertTriangle,
    ChevronUp, ChevronDown, Calculator, Info
} from 'lucide-react';
import { Product, Brand, Category, Provider } from '../types';
import { productDB } from '../services/storageService';

// Component to handle massive price updates across the product catalog
const PriceUpdates: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [brands] = useState<Brand[]>(() => JSON.parse(localStorage.getItem('ferrecloud_brands') || '[]'));
    const [categories] = useState<Category[]>(() => JSON.parse(localStorage.getItem('ferrecloud_categories') || '[]'));
    const [providers] = useState<Provider[]>(() => JSON.parse(localStorage.getItem('ferrecloud_providers') || '[]'));

    const [filterBrand, setFilterBrand] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterProvider, setFilterProvider] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    
    const [increasePercent, setIncreasePercent] = useState<string>('');
    const [isApplying, setIsApplying] = useState(false);

    // Load products from IndexedDB on mount
    const loadProducts = async () => {
        const all = await productDB.getAll();
        setProducts(all);
    };

    useEffect(() => {
        loadProducts();
    }, []);

    // Derived state: products filtered by selected criteria
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesBrand = !filterBrand || p.brand === filterBrand;
            const matchesCategory = !filterCategory || p.category === filterCategory;
            const matchesProvider = !filterProvider || p.provider === filterProvider;
            const matchesSearch = !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 p.internalCodes.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()));
            
            return matchesBrand && matchesCategory && matchesProvider && matchesSearch;
        });
    }, [products, filterBrand, filterCategory, filterProvider, searchTerm]);

    // Handle the application of percentage increase to filtered products
    const handleApplyUpdate = async () => {
        const percent = parseFloat(increasePercent);
        if (isNaN(percent) || percent === 0) {
            alert("Por favor ingrese un porcentaje de aumento válido.");
            return;
        }

        if (filteredProducts.length === 0) {
            alert("No hay productos seleccionados por los filtros actuales.");
            return;
        }

        if (!confirm(`¿Confirmar aumento del ${percent}% a los ${filteredProducts.length} productos filtrados?`)) {
            return;
        }

        setIsApplying(true);
        
        const factor = 1 + (percent / 100);
        
        const updatedProducts = filteredProducts.map(p => {
            const newListCost = p.listCost * factor;
            const newCostAfterDiscounts = p.costAfterDiscounts * factor;
            const newPriceNeto = p.priceNeto * factor;
            const newPriceFinal = p.priceFinal * factor;

            return {
                ...p,
                listCost: parseFloat(newListCost.toFixed(4)),
                costAfterDiscounts: parseFloat(newCostAfterDiscounts.toFixed(4)),
                priceNeto: parseFloat(newPriceNeto.toFixed(2)),
                priceFinal: parseFloat(newPriceFinal.toFixed(2))
            };
        });

        try {
            await productDB.saveBulk(updatedProducts);
            await loadProducts();
            setIncreasePercent('');
            alert(`✅ Se actualizaron ${updatedProducts.length} productos correctamente.`);
        } catch (error) {
            console.error("Error updating prices:", error);
            alert("Error al actualizar precios.");
        } finally {
            setIsApplying(false);
        }
    };

    return (
        <div className="p-6 h-full flex flex-col space-y-6 bg-slate-50 overflow-hidden font-sans">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm shrink-0">
                <div className="flex items-center gap-5 mb-8">
                    <div className="p-4 bg-slate-900 text-indigo-400 rounded-3xl shadow-xl">
                        <TrendingUp size={32}/>
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Actualización de Precios</h2>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Gestión masiva de costos y márgenes por lotes</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Proveedor</label>
                        <select 
                            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-indigo-50 transition-all"
                            value={filterProvider}
                            onChange={e => setFilterProvider(e.target.value)}
                        >
                            <option value="">TODOS LOS PROVEEDORES</option>
                            {providers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Marca</label>
                        <select 
                            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-indigo-50 transition-all"
                            value={filterBrand}
                            onChange={e => setFilterBrand(e.target.value)}
                        >
                            <option value="">TODAS LAS MARCAS</option>
                            {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Categoría</label>
                        <select 
                            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-indigo-50 transition-all"
                            value={filterCategory}
                            onChange={e => setFilterCategory(e.target.value)}
                        >
                            <option value="">TODOS LOS RUBROS</option>
                            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Buscar</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14}/>
                            <input 
                                type="text" 
                                placeholder="Nombre o SKU..."
                                className="w-full pl-9 p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-indigo-50 transition-all"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Layers size={14}/> Vista Previa de Lote ({filteredProducts.length} ítems)
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-[9px] font-black text-slate-300 uppercase tracking-widest sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-4">Artículo / SKU</th>
                                    <th className="px-6 py-4">Marca</th>
                                    <th className="px-6 py-4 text-right">Costo Actual</th>
                                    <th className="px-6 py-4 text-right">Venta Actual</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-[11px]">
                                {filteredProducts.slice(0, 100).map(p => (
                                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-3">
                                            <p className="font-black text-slate-800 uppercase leading-none mb-1">{p.name}</p>
                                            <p className="text-[8px] text-indigo-500 font-mono font-bold uppercase">{p.internalCodes[0]}</p>
                                        </td>
                                        <td className="px-6 py-3 text-slate-500 font-bold uppercase">{p.brand}</td>
                                        <td className="px-6 py-3 text-right font-bold text-slate-400">${p.costAfterDiscounts.toLocaleString('es-AR')}</td>
                                        <td className="px-6 py-3 text-right font-black text-slate-900">${p.priceFinal.toLocaleString('es-AR')}</td>
                                    </tr>
                                ))}
                                {filteredProducts.length > 100 && (
                                    <tr>
                                        <td colSpan={4} className="p-4 text-center text-slate-300 font-bold text-[10px] uppercase">... y {filteredProducts.length - 100} productos más</td>
                                    </tr>
                                )}
                                {filteredProducts.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-24 text-center">
                                            <Package size={48} className="mx-auto text-slate-200 mb-2" strokeWidth={1}/>
                                            <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Sin productos para los filtros seleccionados</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="lg:col-span-4 flex flex-col space-y-6">
                    <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden flex-1 flex flex-col justify-center">
                        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                            <Calculator size={160}/>
                        </div>
                        <div className="relative z-10 space-y-8">
                            <div className="text-center">
                                <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Aumento de Costo (%)</p>
                                <div className="flex items-center justify-center gap-4">
                                    <span className="text-5xl font-black text-white">%</span>
                                    <input 
                                        type="number" 
                                        placeholder="0.0"
                                        className="w-40 bg-white/5 border-2 border-white/10 rounded-[2rem] p-6 font-black text-6xl text-center outline-none focus:bg-white/10 focus:border-indigo-500 transition-all"
                                        value={increasePercent}
                                        onChange={e => setIncreasePercent(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                                <h4 className="text-[9px] font-black uppercase tracking-widest text-indigo-300 flex items-center gap-2">
                                    <Info size={14}/> Impacto Proyectado
                                </h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-bold">
                                        <span className="text-slate-400">Items Afectados:</span>
                                        <span className="text-white">{filteredProducts.length}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold">
                                        <span className="text-slate-400">Variación Promedio:</span>
                                        <span className="text-green-400">{increasePercent || '0'}%</span>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={handleApplyUpdate}
                                disabled={isApplying || !increasePercent || filteredProducts.length === 0}
                                className="w-full bg-indigo-600 hover:bg-indigo-50 text-white py-6 rounded-3xl font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-900/50 transition-all active:scale-95 disabled:opacity-20 flex items-center justify-center gap-3 text-xs"
                            >
                                {isApplying ? <RefreshCw className="animate-spin" size={20}/> : <Save size={20}/>}
                                APLICAR CAMBIOS
                            </button>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-start gap-4">
                        <AlertTriangle className="text-amber-500 shrink-0 mt-1" size={20}/>
                        <div>
                            <h5 className="font-black text-slate-800 uppercase text-[9px] tracking-widest mb-1">Aviso Importante</h5>
                            <p className="text-[10px] text-slate-500 leading-relaxed font-medium italic">Al aplicar el aumento, se recalcularán los costos de lista, costos netos y precios de venta finales manteniendo los márgenes de utilidad y bonificaciones actuales de cada ficha.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PriceUpdates;
