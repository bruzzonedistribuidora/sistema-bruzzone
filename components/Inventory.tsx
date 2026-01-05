import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    Search, Plus, Package, X, Save, Globe, DollarSign, 
    Barcode, Pen, Trash2, Tag, Truck, Layers, Info, 
    Percent, Building2, Store, Activity, ChevronRight,
    AlertCircle, LayoutGrid, Database, Calculator, ShoppingCart,
    Sparkles, RefreshCw, Hash, QrCode, Boxes, FileSpreadsheet,
    Download, UploadCloud, Phone, Mail, UserSearch, SearchCode,
    TrendingUp
} from 'lucide-react';
import { Product, ProductStock, Brand, Category, ComboItem, Provider, CompanyConfig, Branch } from '../types';
import { searchVirtualInventory } from '../services/geminiService';

const Inventory: React.FC = () => {
  const [inventoryTab, setInventoryTab] = useState<'PRODUCTS' | 'BRANDS' | 'CATEGORIES' | 'PROVIDERS'>('PRODUCTS');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAiSearching, setIsAiSearching] = useState(false);

  const companyConfig: CompanyConfig = useMemo(() => {
    const saved = localStorage.getItem('company_config');
    return saved ? JSON.parse(saved) : {};
  }, []);

  const getDefaultProfitMargin = (): number => companyConfig.defaultProfitMargin ?? 30;

  const initialProduct: Product = {
    id: '', internalCodes: [''], barcodes: [], providerCodes: [],
    name: '', brand: '', provider: '', description: '', category: 'General',
    measureUnitSale: 'Unidad', measureUnitPurchase: 'Unidad', conversionFactor: 1,
    purchaseCurrency: 'ARS', saleCurrency: 'ARS', vatRate: 21.0,
    listCost: 0, discounts: [0,0,0,0], costAfterDiscounts: 0, profitMargin: getDefaultProfitMargin(),
    priceNeto: 0, priceFinal: 0, stock: 0, stockDetails: [],
    minStock: 0, desiredStock: 0, reorderPoint: 0, location: '',
    ecommerce: { mercadoLibre: false, tiendaNube: false, webPropia: false },
    isCombo: false, comboItems: [], lastProviders: []
  };

  const [products, setProducts] = useState<Product[]>(() => {
      const saved = localStorage.getItem('ferrecloud_products');
      return saved ? JSON.parse(saved) : [];
  });

  const [brands, setBrands] = useState<Brand[]>(() => JSON.parse(localStorage.getItem('ferrecloud_brands') || '[]'));
  const [categories, setCategories] = useState<Category[]>(() => JSON.parse(localStorage.getItem('ferrecloud_categories') || '[]'));
  const [providers, setProviders] = useState<Provider[]>(() => JSON.parse(localStorage.getItem('ferrecloud_providers') || '[]'));
  const [branches] = useState<Branch[]>(() => JSON.parse(localStorage.getItem('ferrecloud_branches') || '[]'));

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Product>(initialProduct);
  const [modalTab, setModalTab] = useState<'GENERAL' | 'PRICING' | 'COMBO' | 'STOCK'>('GENERAL');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<'BRAND' | 'CATEGORY' | 'PROVIDER' | null>(null);
  const [quickAddValue, setQuickAddValue] = useState('');

  useEffect(() => {
    localStorage.setItem('ferrecloud_products', JSON.stringify(products));
    localStorage.setItem('ferrecloud_brands', JSON.stringify(brands));
    localStorage.setItem('ferrecloud_categories', JSON.stringify(categories));
    localStorage.setItem('ferrecloud_providers', JSON.stringify(providers));
  }, [products, brands, categories, providers]);

  // Cálculo dinámico de precios
  useEffect(() => {
    let cost = formData.isCombo 
        ? (formData.comboItems || []).reduce((acc, item) => acc + (item.unitCost * item.quantity), 0)
        : Number(formData.listCost) || 0;
    
    if (!formData.isCombo) {
        formData.discounts.forEach(d => { if (d > 0) cost = cost * (1 - d / 100); });
    }

    const priceNeto = cost * (1 + (Number(formData.profitMargin) || 0) / 100);
    const priceFinal = priceNeto * (1 + (Number(formData.vatRate) || 0) / 100);

    setFormData(prev => ({
        ...prev,
        costAfterDiscounts: parseFloat(cost.toFixed(2)),
        priceNeto: parseFloat(priceNeto.toFixed(2)),
        priceFinal: parseFloat(priceFinal.toFixed(2))
    }));
  }, [formData.listCost, formData.discounts, formData.profitMargin, formData.vatRate, formData.isCombo, formData.comboItems]);

  // Búsqueda optimizada (Slicing) para 140k ítems
  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return products.slice(0, 100);
    return products.filter(p => 
        p.name.toLowerCase().includes(term) || 
        p.internalCodes.some(c => c.toLowerCase().includes(term)) ||
        p.barcodes.some(c => c.toLowerCase().includes(term))
    ).slice(0, 100);
  }, [searchTerm, products]);

  const handleAiSearch = async () => {
      if (!searchTerm || searchTerm.length < 3) return;
      setIsAiSearching(true);
      try {
          const results = await searchVirtualInventory(searchTerm);
          if (results.length > 0) {
              // Fusionar resultados con los locales si no existen
              setProducts(prev => {
                  const newProds = results.filter(r => !prev.some(p => p.id === r.id));
                  return [...newProds, ...prev];
              });
              alert(`IA encontró ${results.length} coincidencias adicionales en el catálogo virtual.`);
          }
      } finally {
          setIsAiSearching(false);
      }
  };

  const handleSaveProduct = () => {
    if (!formData.name || !formData.internalCodes[0]) {
        alert("Faltan campos obligatorios.");
        return;
    }
    const totalStock = formData.stockDetails.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
    const finalProduct = { ...formData, stock: totalStock };
    setProducts(prev => {
        const idx = prev.findIndex(p => p.id === finalProduct.id);
        if (idx >= 0) { const next = [...prev]; next[idx] = finalProduct; return next; }
        return [finalProduct, ...prev];
    });
    setIsModalOpen(false);
  };

  return (
    <div className="p-4 h-full flex flex-col space-y-3 bg-slate-50 overflow-hidden animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm gap-4 shrink-0">
          <div>
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                  <Database size={28} className="text-indigo-600"/> Inventario Maestro
              </h2>
              <div className="flex mt-4 bg-slate-100 p-1.5 rounded-2xl gap-1 border border-slate-200 shadow-inner">
                  {['PRODUCTS', 'BRANDS', 'CATEGORIES', 'PROVIDERS'].map((tab: any) => (
                      <button key={tab} onClick={() => { setInventoryTab(tab); setSearchTerm(''); }} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest ${inventoryTab === tab ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                        {tab === 'PRODUCTS' ? 'Artículos' : tab === 'BRANDS' ? 'Marcas' : tab === 'CATEGORIES' ? 'Categorías' : 'Proveedores'}
                      </button>
                  ))}
              </div>
          </div>
          
          <div className="flex gap-3">
              <button onClick={() => {
                  setFormData({...initialProduct, id: Date.now().toString(), stockDetails: branches.map(b => ({ branchId: b.id, branchName: b.name, quantity: 0 }))});
                  setModalTab('GENERAL');
                  setIsModalOpen(true);
              }} className="bg-slate-900 text-white px-8 py-4 rounded-[1.5rem] font-black shadow-2xl shadow-slate-900/20 flex items-center gap-3 transition-all hover:bg-slate-800 uppercase text-xs tracking-widest active:scale-95">
                  <Plus size={20} /> Nuevo Artículo
              </button>
          </div>
      </div>

      <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-200 p-2 shrink-0 flex gap-2">
            <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={20} />
                <input 
                    type="text" 
                    placeholder={`Buscar entre ${products.length.toLocaleString()} artículos por SKU o Nombre...`} 
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-100 transition-all uppercase" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                />
            </div>
            <button 
                onClick={handleAiSearch}
                disabled={isAiSearching || searchTerm.length < 3}
                className="bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-30 shadow-lg shadow-indigo-200">
                {isAiSearching ? <RefreshCw size={18} className="animate-spin"/> : <Sparkles size={18}/>}
                <span className="hidden md:inline">Búsqueda IA</span>
            </button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto custom-scrollbar">
            {inventoryTab === 'PRODUCTS' && (
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-900 sticky top-0 z-20 text-[9px] uppercase font-black text-slate-300 tracking-wider">
                        <tr>
                            <th className="px-6 py-4">SKU / Barras</th>
                            <th className="px-6 py-4">Descripción del Artículo</th>
                            <th className="px-6 py-4 text-center">Categoría</th>
                            <th className="px-6 py-4 text-right">Stock Total</th>
                            <th className="px-6 py-4 text-right">Precio Venta</th>
                            <th className="px-6 py-4 text-center">Gestión</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                        {filteredProducts.map((p) => (
                            <tr key={p.id} className="hover:bg-indigo-50/20 transition-colors group">
                                <td className="px-6 py-4 font-mono font-bold text-indigo-600">{p.internalCodes[0] || 'S/C'}</td>
                                <td className="px-6 py-4">
                                    <p className="font-black text-slate-800 uppercase leading-none mb-1.5">{p.name}</p>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{p.brand}</p>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase">{p.category}</span>
                                </td>
                                <td className={`px-6 py-4 text-right font-black text-lg tracking-tighter ${p.stock <= p.reorderPoint ? 'text-red-600' : 'text-slate-700'}`}>
                                    {p.stock.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-right font-black text-slate-900 bg-indigo-50/30">
                                    <p className="text-lg tracking-tighter">${p.priceFinal.toLocaleString('es-AR')}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setFormData(p); setModalTab('GENERAL'); setIsModalOpen(true); }} className="p-2.5 bg-white text-indigo-600 rounded-xl shadow-sm border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all"><Pen size={14} /></button>
                                        <button onClick={() => setProducts(products.filter(x => x.id !== p.id))} className="p-2.5 bg-white text-red-400 rounded-xl shadow-sm border border-red-100 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
      </div>

      {/* MODAL DETALLE PRODUCTO */}
      {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh]">
                  <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-4">
                          <div className={`p-4 rounded-3xl ${formData.isCombo ? 'bg-purple-500 shadow-purple-900/20' : 'bg-indigo-600 shadow-indigo-900/20'} shadow-2xl`}><Package size={28}/></div>
                          <div>
                              <h3 className="text-xl font-black uppercase tracking-tighter leading-none">{formData.name || 'Nuevo Artículo'}</h3>
                              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">ID: {formData.id}</p>
                          </div>
                      </div>
                      <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-all"><X size={32} /></button>
                  </div>

                  <div className="flex bg-slate-100 p-1.5 gap-1 border-b border-slate-200 shrink-0">
                      {['GENERAL', 'PRICING', 'COMBO', 'STOCK'].map(tab => (
                          <button key={tab} onClick={() => setModalTab(tab as any)} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${modalTab === tab ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                              <span className="hidden sm:inline">{tab === 'GENERAL' ? 'Ficha Técnica' : tab === 'PRICING' ? 'Costos y Venta' : tab === 'COMBO' ? 'Componentes' : 'Distribución Stock'}</span>
                          </button>
                      ))}
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 bg-slate-50/30 custom-scrollbar">
                      {modalTab === 'GENERAL' && (
                          <div className="space-y-10 animate-fade-in">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                  <div className="space-y-6">
                                      <div>
                                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Descripción del Producto</label>
                                          <input className="w-full p-4 bg-white border-2 border-transparent rounded-2xl font-black text-lg text-slate-800 uppercase shadow-sm focus:border-indigo-600 outline-none transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} />
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                          <div>
                                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Marca</label>
                                              <select className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold uppercase text-xs" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})}>
                                                  <option value="">-- SELECCIONAR --</option>
                                                  {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                                              </select>
                                          </div>
                                          <div>
                                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Categoría</label>
                                              <select className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold uppercase text-xs" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                              </select>
                                          </div>
                                      </div>
                                  </div>
                                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                                      <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b pb-4 flex items-center gap-2"><Barcode size={14}/> Codificación</h4>
                                      <div className="space-y-4">
                                          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                              <span className="text-[9px] font-black text-slate-400 uppercase">SKU Interno:</span>
                                              <input className="bg-transparent border-b border-indigo-200 font-mono font-black text-indigo-600 text-right uppercase outline-none" value={formData.internalCodes[0]} onChange={e => { const c = [...formData.internalCodes]; c[0] = e.target.value.toUpperCase(); setFormData({...formData, internalCodes: c}); }} />
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}

                      {modalTab === 'PRICING' && (
                          <div className="animate-fade-in space-y-8">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                  <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
                                      <div className="space-y-2">
                                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Costo Bruto de Lista</label>
                                          <div className="relative">
                                              <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={32}/>
                                              <input type="number" className="w-full pl-14 p-6 bg-slate-50 border-2 border-transparent rounded-[2rem] focus:bg-white focus:border-indigo-600 outline-none font-black text-5xl text-slate-800 transition-all" value={formData.listCost} onChange={e => setFormData({...formData, listCost: parseFloat(e.target.value) || 0})} />
                                          </div>
                                      </div>
                                      <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                                          <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Costo Neto Final:</span>
                                          <span className="text-3xl font-black text-indigo-600">${formData.costAfterDiscounts.toLocaleString('es-AR')}</span>
                                      </div>
                                  </div>

                                  <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl space-y-10 relative overflow-hidden flex flex-col justify-center">
                                      {/* Added missing TrendingUp icon */}
                                      <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><TrendingUp size={200}/></div>
                                      <div className="relative z-10 flex flex-col items-center">
                                          <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em] mb-4">Margen de Utilidad (%)</p>
                                          <input type="number" className="w-48 p-6 bg-white/5 border-2 border-white/10 rounded-3xl font-black text-6xl text-center outline-none focus:bg-white/10 focus:border-indigo-500 transition-all" value={formData.profitMargin} onChange={e => setFormData({...formData, profitMargin: parseFloat(e.target.value) || 0})} />
                                      </div>
                                      <div className="relative z-10 text-center border-t border-white/10 pt-8">
                                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Precio de Venta Final (IVA Inc.)</p>
                                          <h4 className="text-7xl font-black text-green-400 tracking-tighter">${formData.priceFinal.toLocaleString('es-AR')}</h4>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}
                  </div>

                  <div className="p-8 bg-white border-t border-slate-100 flex justify-end gap-4 shrink-0">
                      <button onClick={() => setIsModalOpen(false)} className="px-10 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest">Cancelar</button>
                      <button onClick={handleSaveProduct} className="bg-slate-900 text-white px-16 py-4 rounded-[1.8rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-indigo-600 transition-all active:scale-95 flex items-center gap-3">
                          <Save size={20}/> Guardar Cambios
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Inventory;
