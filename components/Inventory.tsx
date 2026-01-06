
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    Search, Plus, Package, X, Save, Globe, DollarSign, 
    Barcode, Pen, Trash2, Tag, Truck, Layers, Info, 
    Percent, Building2, Store, Activity, ChevronRight,
    AlertCircle, LayoutGrid, Database, Calculator, ShoppingCart,
    Sparkles, RefreshCw, Hash, QrCode, Boxes, FileSpreadsheet,
    Download, UploadCloud, Phone, Mail, UserSearch, SearchCode,
    TrendingUp, FileUp, CheckCircle, ListFilter, PlusCircle
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
  
  const [formData, setFormData] = useState<Product | any>({});
  const [modalTab, setModalTab] = useState<'GENERAL' | 'PRICING' | 'COMBO' | 'STOCK'>('GENERAL');
  const [newBarcode, setNewBarcode] = useState('');

  // CARGA INICIAL Y SINCRONIZACIÓN CON LIMITADOR
  const loadProducts = async () => {
      if (searchTerm.trim().length > 2) {
          const results = await productDB.search(searchTerm);
          setProducts(results);
      } else {
          // Si no hay búsqueda, solo mostrar los últimos 100 para no explotar la RAM
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

  useEffect(() => {
    localStorage.setItem('ferrecloud_brands', JSON.stringify(brands));
    localStorage.setItem('ferrecloud_categories', JSON.stringify(categories));
    localStorage.setItem('ferrecloud_providers', JSON.stringify(providers));
  }, [brands, categories, providers]);

  // Lógica de Precios para Productos
  useEffect(() => {
    if (modalType !== 'PRODUCT') return;
    let cost = formData.isCombo 
        ? (formData.comboItems || []).reduce((acc, item) => acc + (item.unitCost * item.quantity), 0)
        : Number(formData.listCost) || 0;
    
    if (!formData.isCombo && formData.discounts) {
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
  }, [formData.listCost, formData.discounts, formData.profitMargin, formData.vatRate, formData.isCombo, formData.comboItems, modalType]);

  const filteredData = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (inventoryTab === 'PRODUCTS') return products; // Ya vienen filtrados de la DB
    if (inventoryTab === 'BRANDS') return brands.filter(b => b.name.toLowerCase().includes(term));
    if (inventoryTab === 'CATEGORIES') return categories.filter(c => c.name.toLowerCase().includes(term));
    if (inventoryTab === 'PROVIDERS') return providers.filter(p => p.name.toLowerCase().includes(term) || p.cuit.includes(term));
    return [];
  }, [searchTerm, inventoryTab, products, brands, categories, providers]);

  const handleOpenModal = (type: typeof modalType, data?: any) => {
    setModalType(type);
    setNewBarcode('');
    if (data) {
        setFormData(data);
    } else {
        if (type === 'PRODUCT') {
            setFormData({
                id: Date.now().toString(), internalCodes: [''], barcodes: [], providerCodes: [''],
                name: '', brand: '', provider: '', description: '', category: 'General',
                measureUnitSale: 'Unidad', measureUnitPurchase: 'Unidad', conversionFactor: 1,
                purchaseCurrency: 'ARS', saleCurrency: 'ARS', vatRate: 21.0,
                listCost: 0, discounts: [0,0,0,0], costAfterDiscounts: 0, profitMargin: companyConfig.defaultProfitMargin || 30,
                priceNeto: 0, priceFinal: 0, stock: 0, stockDetails: branches.map(b => ({ branchId: b.id, branchName: b.name, quantity: 0 })),
                minStock: 0, desiredStock: 0, reorderPoint: 0, location: '', isCombo: false, comboItems: [],
                ecommerce: { isPublished: false }
            });
            setModalTab('GENERAL');
        } else if (type === 'BRAND' || type === 'CATEGORY') {
            setFormData({ id: Date.now().toString(), name: '' });
        } else if (type === 'PROVIDER') {
            setFormData({ id: Date.now().toString(), name: '', cuit: '', phone: '', email: '', balance: 0, defaultDiscounts: [0,0,0] });
        }
    }
    setIsModalOpen(true);
  };

  const addBarcode = () => {
      if (!newBarcode.trim()) return;
      if (formData.barcodes?.includes(newBarcode.trim())) {
          alert("Este código ya está asignado al producto.");
          return;
      }
      setFormData({ ...formData, barcodes: [...(formData.barcodes || []), newBarcode.trim()] });
      setNewBarcode('');
  };

  const handleSave = async () => {
    if (!formData.name) return;
    if (modalType === 'PRODUCT') {
        const totalStock = formData.stockDetails?.reduce((acc: number, curr: any) => acc + (Number(curr.quantity) || 0), 0) || 0;
        const finalProduct = { ...formData, stock: totalStock };
        await productDB.save(finalProduct);
    } else if (modalType === 'BRAND') {
        setBrands(prev => prev.some(b => b.id === formData.id) ? prev.map(b => b.id === formData.id ? formData : b) : [formData, ...prev]);
    } else if (modalType === 'CATEGORY') {
        setCategories(prev => prev.some(c => c.id === formData.id) ? prev.map(c => c.id === formData.id ? formData : c) : [formData, ...prev]);
    } else if (modalType === 'PROVIDER') {
        setProviders(prev => prev.some(p => p.id === formData.id) ? prev.map(p => p.id === formData.id ? formData : p) : [formData, ...prev]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (item: any) => {
      if (!confirm('¿Seguro desea eliminar este elemento?')) return;
      if (inventoryTab === 'PRODUCTS') {
          await productDB.delete(item.id);
      } else if (inventoryTab === 'BRANDS') {
          setBrands(brands.filter(x => x.id !== item.id));
      } else if (inventoryTab === 'CATEGORIES') {
          setCategories(categories.filter(x => x.id !== item.id));
      } else if (inventoryTab === 'PROVIDERS') {
          setProviders(providers.filter(x => x.id !== item.id));
      }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          const content = event.target?.result as string;
          const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
          if (lines.length < 1) return;
          const newItems: any[] = [];
          const separator = lines[0].includes(';') ? ';' : ',';
          lines.forEach((line, idx) => {
              const parts = line.split(separator).map(p => p.trim().toUpperCase());
              if (!parts[0]) return;
              if (inventoryTab === 'BRANDS' || inventoryTab === 'CATEGORIES') {
                  if (![...brands, ...categories].some(x => x.name === parts[0])) {
                      newItems.push({ id: `imp-${Date.now()}-${idx}`, name: parts[0] });
                  }
              } else if (inventoryTab === 'PROVIDERS') {
                  newItems.push({ id: `prov-${Date.now()}-${idx}`, name: parts[0], cuit: parts[1] || '00-00000000-0', phone: parts[2] || '', balance: 0, defaultDiscounts: [0,0,0] });
              }
          });
          if (inventoryTab === 'BRANDS') setBrands(prev => [...newItems, ...prev]);
          if (inventoryTab === 'CATEGORIES') setCategories(prev => [...newItems, ...prev]);
          if (inventoryTab === 'PROVIDERS') setProviders(prev => [...newItems, ...prev]);
          alert(`Importación exitosa: Se agregaron ${newItems.length} registros.`);
      };
      reader.readAsText(file);
      e.target.value = '';
  };

  return (
    <div className="p-4 h-full flex flex-col space-y-3 bg-slate-50 overflow-hidden animate-fade-in">
      <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.txt" onChange={handleFileImport} />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm gap-4 shrink-0">
          <div>
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                  <Database size={28} className="text-indigo-600"/> Inventario Maestro
              </h2>
              <div className="flex mt-4 bg-slate-100 p-1.5 rounded-2xl gap-1 border border-slate-200 shadow-inner">
                  {(['PRODUCTS', 'BRANDS', 'CATEGORIES', 'PROVIDERS'] as const).map((tab) => (
                      <button key={tab} onClick={() => { setInventoryTab(tab); setSearchTerm(''); }} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest ${inventoryTab === tab ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                        {tab === 'PRODUCTS' ? 'Artículos' : tab === 'BRANDS' ? 'Marcas' : tab === 'CATEGORIES' ? 'Categorías' : 'Proveedores'}
                      </button>
                  ))}
              </div>
          </div>
          
          <div className="flex gap-3">
              {inventoryTab !== 'PRODUCTS' && (
                  <button onClick={() => fileInputRef.current?.click()} className="bg-indigo-50 text-indigo-600 px-6 py-4 rounded-[1.5rem] font-black border border-indigo-100 flex items-center gap-3 transition-all hover:bg-indigo-100 uppercase text-[10px] tracking-widest">
                      <FileUp size={18} /> Carga Excel
                  </button>
              )}
              <button onClick={() => handleOpenModal(inventoryTab.slice(0, -1) as any)} className="bg-slate-900 text-white px-8 py-4 rounded-[1.5rem] font-black shadow-2xl shadow-slate-900/20 flex items-center gap-3 transition-all hover:bg-slate-800 uppercase text-xs tracking-widest active:scale-95">
                  <Plus size={20} /> Nuevo {inventoryTab === 'PRODUCTS' ? 'Artículo' : inventoryTab === 'BRANDS' ? 'Marca' : inventoryTab === 'CATEGORIES' ? 'Categoría' : 'Proveedor'}
              </button>
          </div>
      </div>

      <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-200 p-2 shrink-0 flex gap-2">
            <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={20} />
                <input 
                    type="text" 
                    placeholder={inventoryTab === 'PRODUCTS' ? "Escriba al menos 3 caracteres para buscar entre 140k artículos..." : "Filtrar..."}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-100 transition-all uppercase" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                />
            </div>
            {inventoryTab === 'PRODUCTS' && (
                <button onClick={async () => {
                    if (searchTerm.length < 3) { alert("Escribe al menos 3 caracteres."); return; }
                    setIsAiSearching(true);
                    try {
                        const res = await searchVirtualInventory(searchTerm);
                        setProducts(prev => [...res.filter(r => !prev.some(p => p.id === r.id)), ...prev]);
                    } finally { setIsAiSearching(false); }
                }} className="bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                    {isAiSearching ? <RefreshCw size={18} className="animate-spin"/> : <Sparkles size={18}/>}
                    <span className="hidden md:inline">Sugerencias IA</span>
                </button>
            )}
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-900 sticky top-0 z-20 text-[9px] uppercase font-black text-slate-300 tracking-wider">
                    {inventoryTab === 'PRODUCTS' ? (
                        <tr>
                            <th className="px-6 py-4">SKU / Barras</th>
                            <th className="px-6 py-4">Descripción del Artículo</th>
                            <th className="px-6 py-4 text-center">Categoría</th>
                            <th className="px-6 py-4 text-right">Stock Total</th>
                            <th className="px-6 py-4 text-right">Precio Venta</th>
                            <th className="px-6 py-4 text-center">Gestión</th>
                        </tr>
                    ) : inventoryTab === 'PROVIDERS' ? (
                        <tr>
                            <th className="px-6 py-4">Razón Social</th>
                            <th className="px-6 py-4">CUIT</th>
                            <th className="px-6 py-4">Teléfono</th>
                            <th className="px-8 py-4 text-right">Saldo</th>
                            <th className="px-6 py-4 text-center">Gestión</th>
                        </tr>
                    ) : (
                        <tr>
                            <th className="px-6 py-4">Nombre de la Entidad</th>
                            <th className="px-6 py-4">ID de Sistema</th>
                            <th className="px-6 py-4 text-center">Gestión</th>
                        </tr>
                    )}
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                    {filteredData.map((item: any) => (
                        <tr key={item.id} className="hover:bg-indigo-50/20 transition-colors group">
                            {inventoryTab === 'PRODUCTS' ? (
                                <>
                                    <td className="px-6 py-4 font-mono font-bold text-indigo-600">
                                        <div className="flex flex-col gap-1">
                                            <span>{item.internalCodes?.[0] || 'S/C'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-black text-slate-800 uppercase leading-none mb-1.5">{item.name}</p>
                                        <div className="flex gap-2">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.brand}</p>
                                            {item.provider && <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">• {item.provider}</p>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase">{item.category}</span>
                                    </td>
                                    <td className={`px-6 py-4 text-right font-black text-lg tracking-tighter ${item.stock <= item.reorderPoint ? 'text-red-600' : 'text-slate-700'}`}>
                                        {item.stock?.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right font-black text-slate-900 bg-indigo-50/30">
                                        <p className="text-lg tracking-tighter">${item.priceFinal?.toLocaleString('es-AR')}</p>
                                    </td>
                                </>
                            ) : inventoryTab === 'PROVIDERS' ? (
                                <>
                                    <td className="px-6 py-4 font-black uppercase text-slate-800">{item.name}</td>
                                    <td className="px-6 py-4 font-mono text-slate-500">{item.cuit}</td>
                                    <td className="px-6 py-4 font-bold text-indigo-600">{item.phone || '-'}</td>
                                    <td className="px-6 py-4 text-right font-black text-slate-900">${item.balance?.toLocaleString()}</td>
                                </>
                            ) : (
                                <>
                                    <td className="px-6 py-4 font-black uppercase text-slate-800">{item.name}</td>
                                    <td className="px-6 py-4 font-mono text-slate-400 text-[9px]">{item.id}</td>
                                </>
                            )}
                            <td className="px-6 py-4">
                                <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleOpenModal(inventoryTab.slice(0, -1) as any, item)} className="p-2.5 bg-white text-indigo-600 rounded-xl shadow-sm border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all"><Pen size={14} /></button>
                                    <button onClick={() => handleDelete(item)} className="p-2.5 bg-white text-red-400 rounded-xl shadow-sm border border-red-100 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={14} /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {/* MODAL UNIFICADO */}
      {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
              <div className={`bg-white rounded-[3rem] shadow-2xl w-full overflow-hidden flex flex-col max-h-[95vh] ${modalType === 'PRODUCT' ? 'max-w-5xl' : 'max-w-md'}`}>
                  <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-4">
                          <div className="p-4 bg-indigo-600 rounded-3xl shadow-2xl shadow-indigo-900/20"><Package size={28}/></div>
                          <div>
                              <h3 className="text-xl font-black uppercase tracking-tighter leading-none">{formData.name || `Nuevo ${modalType}`}</h3>
                              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">ID: {formData.id}</p>
                          </div>
                      </div>
                      <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-all"><X size={32} /></button>
                  </div>

                  {modalType === 'PRODUCT' && (
                      <div className="flex bg-slate-100 p-1.5 gap-1 border-b border-slate-200 shrink-0">
                          {['GENERAL', 'PRICING', 'COMBO', 'STOCK'].map(tab => (
                              <button key={tab} onClick={() => setModalTab(tab as any)} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${modalTab === tab ? 'bg-white text-indigo-600 shadow-md border border-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}>
                                  <span className="hidden sm:inline">{tab === 'GENERAL' ? 'Ficha Técnica' : tab === 'PRICING' ? 'Costos y Venta' : tab === 'COMBO' ? 'Componentes' : 'Distribución Stock'}</span>
                              </button>
                          ))}
                      </div>
                  )}

                  <div className="flex-1 overflow-y-auto p-10 bg-slate-50/30 custom-scrollbar">
                      {modalType === 'PRODUCT' ? (
                          <div className="space-y-10 animate-fade-in">
                               {modalTab === 'GENERAL' && (
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                       <div className="space-y-6">
                                           <div>
                                               <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Descripción Comercial</label>
                                               <input className="w-full p-4 bg-white border-2 border-transparent rounded-2xl font-black text-lg text-slate-800 uppercase shadow-sm focus:border-indigo-600 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} />
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
                                                   <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Categoría</label>
                                                   <select className="w-full p-4 bg-white border rounded-2xl font-bold uppercase text-xs" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                                       {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                                   </select>
                                               </div>
                                           </div>
                                       </div>

                                       <div className="space-y-6">
                                           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                                               <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b pb-4 flex items-center gap-2"><Barcode size={14}/> Codificación</h4>
                                               <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                   <span className="text-[9px] font-black text-slate-400 uppercase">SKU:</span>
                                                   <input className="bg-transparent border-b border-indigo-200 font-mono font-black text-indigo-600 text-right uppercase outline-none" value={formData.internalCodes?.[0]} onChange={e => { const c = [...(formData.internalCodes || [])]; c[0] = e.target.value.toUpperCase(); setFormData({...formData, internalCodes: c}); }} />
                                               </div>
                                           </div>
                                       </div>
                                   </div>
                               )}
                               {modalTab === 'PRICING' && (
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                       <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
                                           <div className="space-y-2">
                                               <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-2">Costo Bruto</label>
                                               <div className="relative">
                                                   <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={32}/>
                                                   <input type="number" className="w-full pl-14 p-6 bg-slate-50 border-2 border-transparent rounded-[2rem] focus:bg-white focus:border-indigo-600 outline-none font-black text-5xl text-slate-800" value={formData.listCost} onChange={e => setFormData({...formData, listCost: parseFloat(e.target.value) || 0})} />
                                               </div>
                                           </div>
                                       </div>
                                       <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl space-y-10 flex flex-col justify-center">
                                           <div className="text-center border-t border-white/10 pt-8">
                                               <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Venta Final</p>
                                               <h4 className="text-6xl font-black text-green-400 tracking-tighter">${formData.priceFinal?.toLocaleString()}</h4>
                                           </div>
                                       </div>
                                   </div>
                               )}
                          </div>
                      ) : (
                          <div className="space-y-6">
                               <div>
                                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nombre / Razón Social</label>
                                   <input className="w-full p-4 bg-white border-2 border-transparent rounded-2xl font-black text-slate-800 uppercase shadow-sm focus:border-indigo-600 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} autoFocus />
                               </div>
                          </div>
                      )}
                  </div>

                  <div className="p-8 bg-white border-t border-slate-100 flex justify-end gap-4 shrink-0">
                      <button onClick={() => setIsModalOpen(false)} className="px-10 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest">Cancelar</button>
                      <button onClick={handleSave} className="bg-slate-900 text-white px-16 py-4 rounded-[1.8rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-indigo-600 transition-all flex items-center gap-3">
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
