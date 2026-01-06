
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    Search, Plus, Package, X, Save, Globe, DollarSign, 
    Barcode, Pen, Trash2, Tag, Truck, Layers, Info, 
    Percent, Building2, Store, Activity, ChevronRight,
    AlertCircle, LayoutGrid, Database, Calculator, ShoppingCart,
    Sparkles, RefreshCw, Hash, QrCode, Boxes, FileSpreadsheet,
    Download, UploadCloud, Phone, Mail, UserSearch, SearchCode,
    TrendingUp, FileUp, CheckCircle, ListFilter, PlusCircle,
    FileText, Zap, ChevronDown,
    // Add missing icon import
    Settings2
} from 'lucide-react';
import { Product, ProductStock, Brand, Category, ComboItem, Provider, CompanyConfig, Branch } from '../types';
import { searchVirtualInventory } from '../services/geminiService';
import { productDB } from '../services/storageService';

const Inventory: React.FC = () => {
  const [inventoryTab, setInventoryTab] = useState<'PRODUCTS' | 'BRANDS' | 'CATEGORIES' | 'PROVIDERS'>('PRODUCTS');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAiSearching, setIsAiSearching] = useState(false);

  // Estados de datos
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>(() => JSON.parse(localStorage.getItem('ferrecloud_brands') || '[]'));
  const [categories, setCategories] = useState<Category[]>(() => JSON.parse(localStorage.getItem('ferrecloud_categories') || '[]'));
  const [providers, setProviders] = useState<Provider[]>(() => JSON.parse(localStorage.getItem('ferrecloud_providers') || '[]'));
  const [branches] = useState<Branch[]>(() => JSON.parse(localStorage.getItem('ferrecloud_branches') || '[]'));

  const companyConfig: CompanyConfig = useMemo(() => {
    const saved = localStorage.getItem('company_config');
    return saved ? JSON.parse(saved) : {};
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'PRODUCT' | 'BRAND' | 'CATEGORY' | 'PROVIDER'>('PRODUCT');
  
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [modalTab, setModalTab] = useState<'GENERAL' | 'PRICING' | 'STOCK' | 'TECHNICAL'>('GENERAL');

  // CARGA INICIAL Y SINCRONIZACIÓN
  const loadProducts = async () => {
      if (searchTerm.trim().length > 2) {
          const results = await productDB.search(searchTerm);
          setProducts(results);
      } else {
          const initial = await productDB.getAll(100);
          setProducts(initial);
      }
  };

  useEffect(() => {
    loadProducts();
    const handleSync = () => loadProducts();
    window.addEventListener('ferrecloud_products_updated', handleSync);
    return () => window.removeEventListener('ferrecloud_products_updated', handleSync);
  }, [searchTerm]);

  // Lógica de Precios Detallada
  useEffect(() => {
    if (modalType !== 'PRODUCT') return;
    
    const listCost = Number(formData.listCost) || 0;
    const coefBonif = Number(formData.coeficienteBonificacionCosto) || 1;
    const costAfterDiscounts = listCost * coefBonif;
    
    const margin = Number(formData.profitMargin) || 0;
    const priceNeto = costAfterDiscounts * (1 + margin / 100);
    const vatRate = Number(formData.vatRate) || 21;
    const priceFinal = priceNeto * (1 + vatRate / 100);

    setFormData(prev => ({
        ...prev,
        costAfterDiscounts: parseFloat(costAfterDiscounts.toFixed(2)),
        priceNeto: parseFloat(priceNeto.toFixed(2)),
        priceFinal: parseFloat(priceFinal.toFixed(2))
    }));
  }, [formData.listCost, formData.coeficienteBonificacionCosto, formData.profitMargin, formData.vatRate, modalType]);

  const handleOpenModal = (type: typeof modalType, data?: any) => {
    setModalType(type);
    if (data) {
        setFormData(data);
    } else {
        if (type === 'PRODUCT') {
            setFormData({
                id: Date.now().toString(), 
                internalCodes: [''], 
                barcodes: [], 
                providerCodes: [''],
                otrosCodigos1: '', otrosCodigos2: '', otrosCodigos3: '',
                name: '', brand: '', provider: '', category: 'General',
                purchaseCurrency: 'ARS', saleCurrency: 'ARS', vatRate: 21.0,
                listCost: 0, coeficienteBonificacionCosto: 1, costAfterDiscounts: 0, 
                profitMargin: companyConfig.defaultProfitMargin || 30,
                priceNeto: 0, priceFinal: 0, stock: 0,
                stockMinimo: 0, stockMaximo: 0, reorderPoint: 0,
                tasa: 0, alicuotaImpuestoInterno: 0, 
                stockDetails: branches.map(b => ({ branchId: b.id, branchName: b.name, quantity: 0 })),
                isCombo: false, comboItems: [],
                ecommerce: { isPublished: false }
            });
            setModalTab('GENERAL');
        } else {
            setFormData({ id: Date.now().toString(), name: '' });
        }
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) return;
    if (modalType === 'PRODUCT') {
        await productDB.save(formData as Product);
    } else {
        // Handle brands/cats/provs...
    }
    setIsModalOpen(false);
  };

  return (
    <div className="p-4 h-full flex flex-col space-y-4 bg-slate-50 overflow-hidden font-sans">
      {/* Header remain mostly the same, focused on SEARCH and ADD */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm gap-4 shrink-0">
          <div>
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                  <Database size={28} className="text-indigo-600"/> Catálogo Maestro
              </h2>
              <div className="flex mt-4 bg-slate-100 p-1 rounded-2xl gap-1 border border-slate-200 shadow-inner">
                  {(['PRODUCTS', 'BRANDS', 'CATEGORIES', 'PROVIDERS'] as const).map((tab) => (
                      <button key={tab} onClick={() => { setInventoryTab(tab); setSearchTerm(''); }} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest ${inventoryTab === tab ? 'bg-white text-slate-900 shadow-md' : 'text-gray-400 hover:text-slate-600'}`}>
                        {tab === 'PRODUCTS' ? 'Artículos' : tab === 'BRANDS' ? 'Marcas' : tab === 'CATEGORIES' ? 'Rubros' : 'Proveedores'}
                      </button>
                  ))}
              </div>
          </div>
          
          <div className="flex gap-3">
              <button onClick={() => handleOpenModal(inventoryTab.slice(0, -1) as any)} className="bg-slate-900 text-white px-8 py-4 rounded-[2rem] font-black shadow-2xl flex items-center gap-3 transition-all hover:bg-slate-800 uppercase text-xs tracking-widest active:scale-95">
                  <Plus size={20} /> Nuevo Articulo
              </button>
          </div>
      </div>

      {/* SEARCH AREA */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-2 shrink-0 flex gap-2">
            <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={20} />
                <input 
                    type="text" 
                    placeholder="Búsqueda global entre 140.000 artículos (Nombre, SKU, Barras, OtrosCódigos)..."
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] text-sm font-bold outline-none focus:bg-white focus:border-indigo-100 transition-all uppercase" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                />
            </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-900 sticky top-0 z-20 text-[9px] uppercase font-black text-slate-300 tracking-wider">
                      <tr>
                          <th className="px-6 py-5">Identificación / Códigos</th>
                          <th className="px-6 py-5">Descripción Comercial</th>
                          <th className="px-6 py-5 text-center">Rubro / Marca</th>
                          <th className="px-6 py-5 text-right">Stock</th>
                          <th className="px-6 py-5 text-right bg-slate-800">Precio Venta</th>
                          <th className="px-6 py-5 text-center">Acciones</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                      {products.map(p => (
                          <tr key={p.id} className="hover:bg-indigo-50/20 transition-colors group">
                              <td className="px-6 py-5">
                                  <p className="font-mono font-black text-indigo-600">{p.internalCodes[0] || 'S/C'}</p>
                                  <p className="text-[8px] text-gray-400 font-bold uppercase mt-1">EAN: {p.barcodes?.[0] || '-'}</p>
                              </td>
                              <td className="px-6 py-5">
                                  <p className="font-black text-slate-800 uppercase leading-none mb-1.5">{p.name}</p>
                                  <p className="text-[9px] text-slate-400 font-bold uppercase truncate max-w-[200px]">{p.provider}</p>
                              </td>
                              <td className="px-6 py-5 text-center">
                                  <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-lg border text-[9px] font-black uppercase mb-1 block w-fit mx-auto">{p.category}</span>
                                  <span className="text-[8px] text-indigo-400 font-black uppercase tracking-widest">{p.brand}</span>
                              </td>
                              <td className="px-6 py-5 text-right font-black text-lg tracking-tighter">
                                  {p.stock?.toLocaleString()}
                              </td>
                              <td className="px-6 py-5 text-right font-black text-slate-900 bg-indigo-50/10">
                                  <p className="text-lg tracking-tighter text-indigo-700">${p.priceFinal?.toLocaleString('es-AR')}</p>
                              </td>
                              <td className="px-6 py-5">
                                  <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => handleOpenModal('PRODUCT', p)} className="p-3 bg-white text-indigo-600 rounded-xl shadow-sm border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all"><Pen size={14} /></button>
                                      <button onClick={async () => { if(confirm('¿Eliminar artículo?')) await productDB.delete(p.id); }} className="p-3 bg-white text-red-400 rounded-xl shadow-sm border border-red-100 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={14} /></button>
                                  </div>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>

      {/* MODAL EXTENDIDO CON LOS 30+ CAMPOS */}
      {isModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[95vh]">
                  <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-6">
                          <div className="p-4 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-900/50"><Package size={32}/></div>
                          <div>
                              <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">{formData.name || 'Nuevo Artículo'}</h3>
                              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-2">Ficha Técnica Centralizada</p>
                          </div>
                      </div>
                      <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-all"><X size={32} /></button>
                  </div>

                  <div className="flex bg-slate-100 p-1.5 gap-1 border-b border-slate-200 shrink-0">
                      {[
                        { id: 'GENERAL', label: 'Identificación', icon: Tag },
                        { id: 'PRICING', label: 'Costos y Rentabilidad', icon: DollarSign },
                        // FIX: Changed icon name from Settings2 (non-existent import previously) to Settings2 after fixing import
                        { id: 'TECHNICAL', label: 'Ferretería / Fiscal', icon: Settings2 },
                        { id: 'STOCK', label: 'Logística', icon: Boxes }
                      ].map(tab => (
                          <button key={tab.id} onClick={() => setModalTab(tab.id as any)} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all ${modalTab === tab.id ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                              <tab.icon size={16}/> {tab.label}
                          </button>
                      ))}
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 bg-slate-50/30 custom-scrollbar">
                      <div className="animate-fade-in">
                          {modalTab === 'GENERAL' && (
                              <div className="space-y-10">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                      <div className="space-y-6">
                                          <div>
                                              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Nombre Comercial (Sistema)</label>
                                              <input className="w-full p-4 bg-white border-2 border-transparent rounded-2xl font-black text-xl text-slate-800 uppercase shadow-sm focus:border-indigo-600 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} />
                                          </div>
                                          <div className="grid grid-cols-2 gap-4">
                                              <div>
                                                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Marca</label>
                                                  <select className="w-full p-4 bg-white border rounded-2xl font-bold uppercase text-xs" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})}>
                                                      <option value="">-- MARCA --</option>
                                                      {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                                                  </select>
                                              </div>
                                              <div>
                                                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Rubro / Categoría</label>
                                                  <select className="w-full p-4 bg-white border rounded-2xl font-bold uppercase text-xs" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                                      {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                                  </select>
                                              </div>
                                          </div>
                                          <div>
                                              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Proveedor Principal</label>
                                              <select className="w-full p-4 bg-white border rounded-2xl font-bold uppercase text-xs" value={formData.provider} onChange={e => setFormData({...formData, provider: e.target.value})}>
                                                  {providers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                              </select>
                                          </div>
                                      </div>

                                      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                                          <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b pb-4 flex items-center gap-2"><Barcode size={14}/> Codificación Múltiple</h4>
                                          <div className="grid grid-cols-2 gap-4">
                                              <div>
                                                  <label className="text-[9px] font-black text-slate-400 uppercase">CÓDIGO Propi</label>
                                                  <input className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-mono font-black text-indigo-600 uppercase outline-none" value={formData.internalCodes?.[0]} onChange={e => { const c = [...(formData.internalCodes || [])]; c[0] = e.target.value.toUpperCase(); setFormData({...formData, internalCodes: c}); }} />
                                              </div>
                                              <div>
                                                  <label className="text-[9px] font-black text-slate-400 uppercase">Cod PROV</label>
                                                  <input className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-mono font-bold uppercase outline-none" value={formData.providerCodes?.[0]} onChange={e => { const c = [...(formData.providerCodes || [])]; c[0] = e.target.value.toUpperCase(); setFormData({...formData, providerCodes: c}); }} />
                                              </div>
                                          </div>
                                          <div>
                                              <label className="text-[9px] font-black text-slate-400 uppercase">Código de Barras (EAN)</label>
                                              <input className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-mono font-bold uppercase outline-none" value={formData.barcodes?.[0]} onChange={e => { const c = [...(formData.barcodes || [])]; c[0] = e.target.value; setFormData({...formData, barcodes: c}); }} />
                                          </div>
                                          <div className="grid grid-cols-3 gap-2">
                                              <div>
                                                  <label className="text-[8px] font-black text-slate-400 uppercase">OtrosCod1</label>
                                                  <input className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold uppercase" value={formData.otrosCodigos1} onChange={e => setFormData({...formData, otrosCodigos1: e.target.value.toUpperCase()})} />
                                              </div>
                                              <div>
                                                  <label className="text-[8px] font-black text-slate-400 uppercase">OtrosCod2</label>
                                                  <input className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold uppercase" value={formData.otrosCodigos2} onChange={e => setFormData({...formData, otrosCodigos2: e.target.value.toUpperCase()})} />
                                              </div>
                                              <div>
                                                  <label className="text-[8px] font-black text-slate-400 uppercase">OtrosCod3</label>
                                                  <input className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold uppercase" value={formData.otrosCodigos3} onChange={e => setFormData({...formData, otrosCodigos3: e.target.value.toUpperCase()})} />
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          )}

                          {modalTab === 'PRICING' && (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                  <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-10">
                                      <div className="space-y-4">
                                          <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block ml-2">Análisis de Costo</label>
                                          <div className="grid grid-cols-2 gap-6">
                                              <div>
                                                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Precio Costo Lista</label>
                                                  <div className="relative group">
                                                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600" size={20}/>
                                                      <input type="number" className="w-full pl-11 p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-black text-2xl text-slate-800" value={formData.listCost} onChange={e => setFormData({...formData, listCost: parseFloat(e.target.value) || 0})} />
                                                  </div>
                                              </div>
                                              <div>
                                                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Coef. Bonif. Costo</label>
                                                  <div className="relative group">
                                                      <RefreshCw className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                                                      <input type="number" step="0.001" className="w-full pl-11 p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-black text-2xl text-indigo-600" value={formData.coeficienteBonificacionCosto} onChange={e => setFormData({...formData, coeficienteBonificacionCosto: parseFloat(e.target.value) || 1})} />
                                                  </div>
                                              </div>
                                          </div>
                                          <div className="bg-slate-900 p-6 rounded-[2rem] text-white flex justify-between items-center shadow-xl">
                                              <p className="text-[9px] font-black uppercase text-indigo-400">Costo Neto Resultante</p>
                                              <p className="text-3xl font-black tracking-tighter">${formData.costAfterDiscounts?.toLocaleString()}</p>
                                          </div>
                                      </div>

                                      <div className="space-y-4 pt-6 border-t border-slate-100">
                                          <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block ml-2">Cálculo de Utilidad</label>
                                          <div className="grid grid-cols-2 gap-6">
                                              <div>
                                                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Porcentaje Ganancia</label>
                                                  <div className="relative group">
                                                      <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                                                      <input type="number" className="w-full pl-11 p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-green-600 outline-none font-black text-2xl text-green-700" value={formData.profitMargin} onChange={e => setFormData({...formData, profitMargin: parseFloat(e.target.value) || 0})} />
                                                  </div>
                                              </div>
                                              <div>
                                                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Alícuota IVA %</label>
                                                  <select className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-black text-2xl text-slate-800" value={formData.vatRate} onChange={e => setFormData({...formData, vatRate: parseFloat(e.target.value)})}>
                                                      <option value={0}>0% (Exento)</option>
                                                      <option value={10.5}>10.5% (Reducido)</option>
                                                      <option value={21}>21.0% (General)</option>
                                                      <option value={27}>27.0% (Servicios)</option>
                                                  </select>
                                              </div>
                                          </div>
                                      </div>
                                  </div>

                                  <div className="bg-slate-950 p-12 rounded-[3.5rem] text-white shadow-2xl flex flex-col justify-center relative overflow-hidden">
                                      <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none"><Activity size={240}/></div>
                                      <div className="relative z-10 space-y-12">
                                          <div className="text-center space-y-2">
                                              <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em] mb-4">Precio Sugerido Venta Final</p>
                                              <div className="flex items-baseline justify-center gap-3">
                                                  <span className="text-4xl font-black text-indigo-500">$</span>
                                                  <h2 className="text-8xl font-black tracking-tighter leading-none text-white transition-all">{formData.priceFinal?.toLocaleString('es-AR')}</h2>
                                              </div>
                                              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-6">Basado en Neto: ${formData.priceNeto?.toLocaleString()}</p>
                                          </div>

                                          <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-10">
                                              <div className="bg-white/5 p-5 rounded-3xl border border-white/5">
                                                  <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Ganancia Bruta/Un</p>
                                                  <p className="text-xl font-black text-green-400">+${((formData.priceNeto || 0) - (formData.costAfterDiscounts || 0)).toLocaleString()}</p>
                                              </div>
                                              <div className="bg-white/5 p-5 rounded-3xl border border-white/5">
                                                  <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Divisa de Venta</p>
                                                  <p className="text-xl font-black text-slate-200">{formData.saleCurrency}</p>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          )}

                          {modalTab === 'TECHNICAL' && (
                              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-12">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                      <div className="space-y-6">
                                          {/* FIX: icon name changed after fixing import */}
                                          <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] border-b pb-4 flex items-center gap-2"><Settings2 size={16}/> Configuración Fiscal Detallada</h4>
                                          <div className="grid grid-cols-2 gap-6">
                                              <div>
                                                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Tasa Especial ($)</label>
                                                  <input type="number" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-xl" value={formData.tasa} onChange={e => setFormData({...formData, tasa: parseFloat(e.target.value) || 0})} />
                                              </div>
                                              <div>
                                                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Alícuota Imp. Interno (%)</label>
                                                  <input type="number" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-xl" value={formData.alicuotaImpuestoInterno} onChange={e => setFormData({...formData, alicuotaImpuestoInterno: parseFloat(e.target.value) || 0})} />
                                              </div>
                                          </div>
                                          <div>
                                              <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Detalle Otros Costos / Observaciones Técnicas</label>
                                              <textarea className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl h-32 font-bold text-xs uppercase" value={formData.detalleOtrosCostos} onChange={e => setFormData({...formData, detalleOtrosCostos: e.target.value.toUpperCase()})} placeholder="Especifique cargos adicionales de aduana, flete especial, etc..."/>
                                          </div>
                                      </div>

                                      <div className="space-y-6">
                                          <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] border-b pb-4 flex items-center gap-2"><Zap size={16}/> Modos de Vista y Listas</h4>
                                          <div className="space-y-4">
                                              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                  <p className="text-[10px] font-black text-slate-600 uppercase">Usa Porcentaje de Ganancia</p>
                                                  <div onClick={() => setFormData({...formData, usaPorcentaje: !formData.usaPorcentaje})} className={`w-12 h-6 rounded-full relative cursor-pointer transition-all ${formData.usaPorcentaje ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.usaPorcentaje ? 'right-1' : 'left-1'}`}></div>
                                                  </div>
                                              </div>
                                              <div>
                                                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Vincular a Lista Especial</label>
                                                  <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-xs uppercase" placeholder="CODIGO DE LISTA..." value={formData.listaCodigo} onChange={e => setFormData({...formData, listaCodigo: e.target.value.toUpperCase()})} />
                                              </div>
                                              <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100">
                                                  <p className="text-[9px] font-bold text-indigo-800 uppercase tracking-widest flex items-center gap-2 mb-2"><Info size={14}/> Precios Vista 1 y 2</p>
                                                  <div className="grid grid-cols-2 gap-4">
                                                      <div className="text-center bg-white p-3 rounded-xl border border-indigo-100">
                                                          <span className="text-[8px] font-black text-slate-400 uppercase">Margen Vista 1</span>
                                                          <p className="text-lg font-black text-indigo-700">{formData.profitMargin}%</p>
                                                      </div>
                                                      <div className="text-center bg-white p-3 rounded-xl border border-indigo-100">
                                                          <span className="text-[8px] font-black text-slate-400 uppercase">Precio Con Tasa</span>
                                                          <p className="text-lg font-black text-indigo-700">${formData.priceFinal?.toLocaleString()}</p>
                                                      </div>
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          )}

                          {modalTab === 'STOCK' && (
                              <div className="space-y-10 animate-fade-in">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center space-y-3">
                                          <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Alarma Stock Mínimo</p>
                                          <input type="number" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-red-600 outline-none font-black text-4xl text-center text-red-600" value={formData.stockMinimo} onChange={e => setFormData({...formData, stockMinimo: parseFloat(e.target.value) || 0})} />
                                      </div>
                                      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center space-y-3">
                                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Punto de Pedido</p>
                                          <input type="number" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-black text-4xl text-center text-indigo-600" value={formData.reorderPoint} onChange={e => setFormData({...formData, reorderPoint: parseFloat(e.target.value) || 0})} />
                                      </div>
                                      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center space-y-3">
                                          <p className="text-[10px] font-black text-green-400 uppercase tracking-widest">Stock Máximo / Ideal</p>
                                          <input type="number" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-green-600 outline-none font-black text-4xl text-center text-green-600" value={formData.stockMaximo} onChange={e => setFormData({...formData, stockMaximo: parseFloat(e.target.value) || 0})} />
                                      </div>
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>

                  <div className="p-8 bg-white border-t border-slate-100 flex justify-end gap-4 shrink-0">
                      <button onClick={() => setIsModalOpen(false)} className="px-10 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest">Cancelar</button>
                      <button onClick={handleSave} className="bg-slate-900 text-white px-16 py-4 rounded-[1.8rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-indigo-600 transition-all flex items-center gap-3">
                          <Save size={20}/> Aplicar Cambios al Catálogo
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Inventory;
