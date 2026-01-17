import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    RefreshCw, Search, Layers, TrendingUp, Save, 
    Filter, Tag, Package, Building2, CheckCircle,
    Percent, DollarSign, ArrowRight, AlertTriangle,
    ChevronUp, ChevronDown, Calculator, Info, Eye, List
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
        // Escuchar el evento de actualización de productos para reflejar cambios externos
        window.addEventListener('ferrecloud_products_updated', loadProducts);
        return () => window.removeEventListener('ferrecloud_products_updated', loadProducts);
    }, [searchTerm]);

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
            // El evento 'ferrecloud_products_updated' se dispara dentro de productDB.saveBulk
            // lo que a su vez refrescará la lista local y activará la sincronización en la nube.
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
          {/* Header section */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 shrink-0">
              <div className="flex items-center gap-5">
                  <div className="p-4 bg-slate-900 text-indigo-400 rounded-3xl shadow-xl">
                      <TrendingUp size={32}/>
                  </div>
                  <div>
                      <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Actualización Masiva de Precios</h2>
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Ajuste global de márgenes y costos en el catálogo</p>
                  </div>
              </div>
              <button 
                  onClick={handleApplyUpdate}
                  disabled={isApplying || parseFloat(increasePercent) === 0 || filteredProducts.length === 0}
                  className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
              >
                  {isApplying ? <RefreshCw className="animate-spin" size={20}/> : <Save size={20}/>}
                  {isApplying ? 'Aplicando...' : 'Aplicar Aumento'}
              </button>
          </div>
    
          {/* Filters and search section */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 shrink-0">
              <div className="flex-1 relative group w-full max-w-xl">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={20}/>
                  <input 
                      type="text" 
                      placeholder="Buscar artículos por nombre o SKU..." 
                      className="w-full pl-12 pr-6 py-3.5 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl text-sm font-bold outline-none transition-all uppercase shadow-inner"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                  />
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                  <select className="bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-xl px-4 py-3 font-black uppercase text-[10px] tracking-widest outline-none shadow-sm cursor-pointer" value={filterBrand} onChange={e => setFilterBrand(e.target.value)}>
                      <option value="">Todas las Marcas</option>
                      {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                  </select>
                  <select className="bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-xl px-4 py-3 font-black uppercase text-[10px] tracking-widest outline-none shadow-sm cursor-pointer" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                      <option value="">Todas las Categorías</option>
                      {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                  <select className="bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-xl px-4 py-3 font-black uppercase text-[10px] tracking-widest outline-none shadow-sm cursor-pointer" value={filterProvider} onChange={e => setFilterProvider(e.target.value)}>
                      <option value="">Todos los Proveedores</option>
                      {providers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
              </div>
          </div>
    
          {/* Percentage input */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 shrink-0">
              <div className="flex items-center gap-4">
                  <DollarSign size={24} className="text-indigo-600"/>
                  <h3 className="text-lg font-black uppercase tracking-tight">Aumento de Precios por Porcentaje</h3>
              </div>
              <div className="relative group">
                  <input 
                      type="number" 
                      step="0.1" 
                      placeholder="Ej: 5.5"
                      className="w-40 pl-4 pr-10 py-3.5 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl text-lg font-black outline-none transition-all uppercase text-right"
                      value={increasePercent}
                      onChange={e => setIncreasePercent(e.target.value)}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg font-black">%</span>
              </div>
          </div>
    
          {/* Product list */}
          <div className="flex-1 overflow-hidden p-6 pb-24">
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <List size={14}/> {filteredProducts.length} Artículos en la selección
                      </h4>
                      <button onClick={loadProducts} disabled={isApplying} className="text-[9px] font-black text-indigo-600 uppercase flex items-center gap-1 hover:underline">
                        {isApplying ? <RefreshCw className="animate-spin" size={14}/> : <RefreshCw size={14}/>}
                        Refrescar
                      </button>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                      <table className="w-full text-left">
                          <thead className="bg-slate-900 text-[9px] font-black text-slate-300 uppercase tracking-widest sticky top-0 z-10">
                              <tr>
                                  <th className="px-6 py-4">Artículo / SKU</th>
                                  <th className="px-6 py-4 text-right">Costo Lista</th>
                                  <th className="px-6 py-4 text-right">Precio Final</th>
                                  <th className="px-6 py-4 text-center"></th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {filteredProducts.map(p => (
                                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                      <td className="px-6 py-4">
                                          <h4 className="font-black text-slate-800 uppercase text-xs truncate max-w-[280px]">{p.name}</h4>
                                          <p className="text-[9px] font-mono font-bold text-slate-400 uppercase mt-1">SKU: {p.internalCodes[0]}</p>
                                      </td>
                                      <td className="px-6 py-4 text-right font-bold text-slate-500">${p.listCost.toLocaleString()}</td>
                                      <td className="px-6 py-4 text-right font-black text-slate-900 text-sm">${p.priceFinal.toLocaleString()}</td>
                                      <td className="px-6 py-4 text-center">
                                          <button onClick={() => alert('Ver ficha')} className="p-2 bg-slate-100 text-slate-400 rounded-xl hover:text-indigo-600 transition-all">
                                              <Eye size={14}/>
                                          </button>
                                      </td>
                                  </tr>
                              ))}
                              {filteredProducts.length === 0 && (
                                <tr><td colSpan={4} className="py-20 text-center text-slate-300 font-black uppercase tracking-widest">No se encontraron artículos con estos filtros</td></tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
        </div>
    );
};

export default PriceUpdates;
