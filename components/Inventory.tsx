
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Search, Plus, Package, X, Save, DollarSign, 
    Barcode, Pen, Trash2, Tag, Layers, Info, 
    Percent, Activity, Database, Boxes, RefreshCw, 
    Settings2, Zap, Calculator, ShoppingCart, ChevronRight,
    Truck, ListFilter, FileUp, PlusCircle, CheckCircle, Hash,
    PlusSquare, MinusCircle, Scaling, ChevronUp, ChevronDown, Download, FileSpreadsheet,
    PackagePlus, Link2, Upload, Ruler, Building2, Store, Globe, ArrowRight, TrendingUp,
    Scale, Boxes as BoxesIcon, Plus as PlusIcon, Minus as MinusIcon,
    MapPin, AlertTriangle, ImageIcon
} from 'lucide-react';
import { Product, Provider, Brand, Category } from '../types';
import { productDB, addToReplenishmentQueue } from '../services/storageService';
import Providers from './Providers';
import InitialImport from './InitialImport';

const Inventory: React.FC = () => {
  const [inventoryTab, setInventoryTab] = useState<'PRODUCTS' | 'IMPORT' | 'BRANDS' | 'CATEGORIES' | 'PROVIDERS'>('PRODUCTS');
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [brands, setBrands] = useState<Brand[]>(() => JSON.parse(localStorage.getItem('ferrecloud_brands') || '[]'));
  const [categories, setCategories] = useState<Category[]>(() => JSON.parse(localStorage.getItem('ferrecloud_categories') || '[]'));
  const [providers, setProviders] = useState<Provider[]>(() => JSON.parse(localStorage.getItem('ferrecloud_providers') || '[]'));
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [modalTab, setModalTab] = useState<'GENERAL' | 'CODES' | 'PRICING' | 'STOCK'>('GENERAL');

  const loadProducts = async () => {
      setIsLoading(true);
      try {
          if (searchTerm.trim().length > 2) {
              const results = await productDB.search(searchTerm);
              setProducts(results);
          } else {
              // Cargar primeros 150 para asegurar visibilidad inmediata
              const initial = await productDB.getAll(150);
              setProducts(initial);
          }
      } catch (err) {
          console.error("Error cargando productos:", err);
      } finally {
          setIsLoading(false);
      }
  };

  useEffect(() => {
    loadProducts();
    const handleSync = () => loadProducts();
    window.addEventListener('ferrecloud_products_updated', handleSync);
    window.addEventListener('ferrecloud_sync_pulse', handleSync);
    return () => {
        window.removeEventListener('ferrecloud_products_updated', handleSync);
        window.removeEventListener('ferrecloud_sync_pulse', handleSync);
    };
  }, [searchTerm]);

  const sortedProducts = useMemo(() => {
    let sortableItems = [...products];
    sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key as keyof Product] || '';
        let bValue = b[sortConfig.key as keyof Product] || '';
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });
    return sortableItems;
  }, [products, sortConfig]);

  const handleQuickAddBrand = () => {
      const name = window.prompt("Ingrese el nombre de la nueva MARCA:");
      if (name && name.trim()) {
          const newBrand = { id: `brand-${Date.now()}`, name: name.toUpperCase().trim() };
          const updated = [...brands, newBrand];
          setBrands(updated);
          localStorage.setItem('ferrecloud_brands', JSON.stringify(updated));
          setFormData(prev => ({ ...prev, brand: newBrand.name }));
      }
  };

  const handleQuickAddCategory = () => {
      const name = window.prompt("Ingrese el nombre del nuevo RUBRO / CATEGORÍA:");
      if (name && name.trim()) {
          const newCat = { id: `cat-${Date.now()}`, name: name.toUpperCase().trim() };
          const updated = [...categories, newCat];
          setCategories(updated);
          localStorage.setItem('ferrecloud_categories', JSON.stringify(updated));
          setFormData(prev => ({ ...prev, category: newCat.name }));
      }
  };

  const handleQuickAddProvider = () => {
      const name = window.prompt("Ingrese la Razón Social del nuevo PROVEEDOR:");
      if (name && name.trim()) {
          const newProv = { id: `prov-${Date.now()}`, name: name.toUpperCase().trim(), cuit: '00-00000000-0', balance: 0, defaultDiscounts: [0,0,0], contact: '' } as Provider;
          const updated = [...providers, newProv];
          setProviders(updated);
          localStorage.setItem('ferrecloud_providers', JSON.stringify(updated));
          setFormData(prev => ({ ...prev, provider: newProv.name }));
      }
  };

  const updatePricing = (updates: Partial<Product>) => {
      setFormData(prev => {
          const next = { ...prev, ...updates };
          const listCost = next.listCost || 0;
          const ds = next.discounts || [0, 0, 0, 0];
          const coef = ds.reduce((acc, d) => acc * (1 - (d / 100)), 1);
          const factor = next.conversionFactor || 1;
          const unitCostBase = (listCost * coef) * factor;
          const margin = next.profitMargin || 30;
          const priceNeto = unitCostBase * (1 + (margin / 100));
          const vat = next.vatRate || 21;
          const priceFinal = priceNeto * (1 + (vat / 100));

          return {
              ...next,
              costAfterDiscounts: parseFloat((listCost * coef).toFixed(4)),
              priceNeto: parseFloat(priceNeto.toFixed(2)),
              priceFinal: parseFloat(priceFinal.toFixed(2))
          };
      });
  };

  const handleArrayUpdate = (field: 'internalCodes' | 'barcodes' | 'providerCodes', index: number, value: string) => {
      setFormData(prev => {
          const arr = [...(prev[field] || [''])];
          arr[index] = value.toUpperCase();
          return { ...prev, [field]: arr };
      });
  };

  const addArrayItem = (field: 'internalCodes' | 'barcodes' | 'providerCodes') => {
      setFormData(prev => ({ ...prev, [field]: [...(prev[field] || []), ''] }));
  };

  const removeArrayItem = (field: 'internalCodes' | 'barcodes' | 'providerCodes', index: number) => {
      setFormData(prev => {
          const arr = [...(prev[field] || [])];
          if (arr.length <= 1 && field === 'internalCodes') return prev; 
          arr.splice(index, 1);
          return { ...prev, [field]: arr };
      });
  };

  const handleSaveProduct = async () => {
      if (!formData.name) return alert("El nombre es obligatorio");
      
      setIsSaving(true);
      try {
          const productToSave: Product = {
              ...formData,
              id: formData.id || `PROD-${Date.now()}`,
              name: (formData.name || '').toUpperCase(),
              internalCodes: (formData.internalCodes || ['']).filter(c => c.trim() !== ''),
              barcodes: (formData.barcodes || []).filter(c => c.trim() !== ''),
              providerCodes: (formData.providerCodes || []).filter(c => c.trim() !== ''),
              stockPrincipal: formData.stockPrincipal || 0,
              stockDeposito: formData.stockDeposito || 0,
              stockSucursal: formData.stockSucursal || 0,
              stock: (formData.stockPrincipal || 0) + (formData.stockDeposito || 0) + (formData.stockSucursal || 0),
              ecommerce: formData.ecommerce || { isPublished: false },
              isCombo: formData.isCombo || false,
              comboItems: formData.comboItems || [],
              stockDetails: formData.stockDetails || [],
              listCost: formData.listCost || 0,
              discounts: formData.discounts || [0,0,0,0],
              profitMargin: formData.profitMargin || 30,
              vatRate: formData.vatRate || 21,
              measureUnitPurchase: formData.measureUnitPurchase || 'UNIDAD',
              measureUnitSale: formData.measureUnitSale || 'UNIDAD',
              conversionFactor: formData.conversionFactor || 1,
              purchaseCurrency: formData.purchaseCurrency || 'ARS',
              saleCurrency: formData.saleCurrency || 'ARS'
          } as Product;

          await productDB.save(productToSave);
          
          // Trigger de sincronización automática a la red
          window.dispatchEvent(new CustomEvent('ferrecloud_sync_request', { 
            detail: { type: 'STOCK_ADJUST', data: productToSave } 
          }));

          setIsModalOpen(false);
          setFormData({});
          await loadProducts();
      } catch (err) {
          console.error(err);
          alert("Error al guardar el artículo");
      } finally {
          setIsSaving(false);
      }
  };

  const openNewProduct = () => {
      setFormData({
          name: '', brand: '', category: '', provider: '', 
          internalCodes: [''], barcodes: [], providerCodes: [], 
          vatRate: 21, profitMargin: 30, discounts: [0,0,0,0], 
          purchaseCurrency: 'ARS', saleCurrency: 'ARS', 
          measureUnitPurchase: 'UNIDAD', measureUnitSale: 'UNIDAD', 
          conversionFactor: 1, purchasePackageQuantity: 1, 
          stockPrincipal: 0, stockDeposito: 0, stockSucursal: 0,
          costAfterDiscounts: 0, priceNeto: 0, priceFinal: 0, listCost: 0
      }); 
      setModalTab('GENERAL'); 
      setIsModalOpen(true);
  };

  return (
    <div className="p-4 h-full flex flex-col space-y-4 bg-slate-200 overflow-hidden font-sans">
      <div className="bg-white p-5 rounded-[2.5rem] border border-slate-300 shadow-xl shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-900 text-indigo-400 rounded-2xl shadow-lg"><BoxesIcon size={28}/></div>
                <div>
                    <h2 className="text-2xl font-black text-slate-950 uppercase tracking-tighter leading-none">Maestro de Artículos</h2>
                    <p className="text-slate-600 text-[11px] font-black uppercase tracking-[0.2em] mt-2">Inventario Local Sincronizado</p>
                </div>
            </div>

            <div className="flex bg-slate-100 rounded-2xl p-1 border border-slate-300 shadow-inner">
                <button onClick={() => setInventoryTab('PRODUCTS')} className={`px-6 py-3 rounded-xl text-[11px] font-black uppercase transition-all tracking-widest ${inventoryTab === 'PRODUCTS' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-600 hover:bg-white/50'}`}>Artículos</button>
                <button onClick={() => setInventoryTab('IMPORT')} className={`px-6 py-3 rounded-xl text-[11px] font-black uppercase transition-all tracking-widest ${inventoryTab === 'IMPORT' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-600 hover:bg-white/50'}`}>Carga Masiva</button>
                <button onClick={() => setInventoryTab('PROVIDERS')} className={`px-6 py-3 rounded-xl text-[11px] font-black uppercase transition-all tracking-widest ${inventoryTab === 'PROVIDERS' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-600 hover:bg-white/50'}`}>Proveedores</button>
            </div>

            <button onClick={openNewProduct} className="bg-indigo-600 text-white px-8 py-4 rounded-[1.8rem] font-black shadow-2xl flex items-center gap-3 hover:bg-indigo-700 transition-all uppercase text-xs tracking-widest active:scale-95">
                <PlusCircle size={20} /> Nuevo Artículo
            </button>
          </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {inventoryTab === 'PRODUCTS' && (
            <div className="h-full flex flex-col space-y-4 animate-fade-in">
                <div className="bg-white rounded-3xl shadow-lg border border-slate-300 p-3 shrink-0 flex gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input type="text" placeholder="Buscar por Nombre, Marca, SKU..." className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-[1.5rem] text-sm font-black outline-none focus:bg-white focus:border-indigo-500 transition-all uppercase" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <button onClick={loadProducts} className="bg-slate-900 text-white px-6 rounded-[1.5rem] hover:bg-slate-800 transition-all flex items-center gap-2">
                        <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-300 flex-1 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse table-fixed">
                            <thead className="bg-slate-900 text-white sticky top-0 z-20 text-[11px] uppercase font-black tracking-widest">
                                <tr>
                                    <th className="w-[15%] px-6 py-5 border-r border-slate-800">SKU / Ref</th>
                                    <th className="w-[30%] px-6 py-5 border-r border-slate-800">Descripción Comercial</th>
                                    <th className="w-[15%] px-6 py-5 border-r border-slate-800">Marca / Rubro</th>
                                    <th className="w-[10%] px-6 py-5 text-center border-r border-slate-800">Stock</th>
                                    <th className="w-[10%] px-6 py-5 text-right border-r border-slate-800">PVP Final</th>
                                    <th className="w-[20%] px-6 py-5 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {sortedProducts.length > 0 ? (
                                    sortedProducts.map(p => (
                                        <tr key={p.id} className="hover:bg-indigo-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-mono font-black text-indigo-700 text-xs truncate">{p.internalCodes?.[0] || 'S/C'}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-black uppercase text-slate-950 text-xs truncate">{p.name}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-black text-slate-600 text-[10px] uppercase truncate">{p.brand || 'GENÉRICO'} • {p.category}</p>
                                            </td>
                                            <td className={`px-6 py-4 text-center font-black text-lg tracking-tighter ${p.stock <= (p.stockMinimo || 0) ? 'text-red-500' : 'text-slate-900'}`}>{p.stock}</td>
                                            <td className="px-6 py-4 text-right font-black text-slate-950 text-lg tracking-tighter bg-slate-50/50">${p.priceFinal?.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center gap-1.5">
                                                    <button onClick={() => { setFormData(p); setModalTab('GENERAL'); setIsModalOpen(true); }} className="p-2.5 text-indigo-700 bg-indigo-50 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100"><Pen size={14}/></button>
                                                    <button onClick={async () => { if(confirm('¿Eliminar definitivamente?')) { await productDB.delete(p.id); loadProducts(); } }} className="p-2.5 text-red-300 bg-red-50 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-50"><Trash2 size={14}/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="py-40 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-30">
                                                <RefreshCw className={`text-slate-400 ${isLoading ? 'animate-spin' : ''}`} size={64} />
                                                <p className="font-black uppercase text-xs tracking-widest">{isLoading ? 'Cargando Base de Datos...' : 'No se encontraron artículos'}</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}
        {inventoryTab === 'IMPORT' && <InitialImport onComplete={() => setInventoryTab('PRODUCTS')} />}
        {inventoryTab === 'PROVIDERS' && <Providers />}
      </div>

      {isModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh]">
                  <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-5">
                          <div className="p-4 bg-indigo-500 rounded-3xl shadow-xl"><Package size={32}/></div>
                          <div>
                              <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">{formData.id ? 'Editar Ficha' : 'Nuevo Artículo Pro'}</h3>
                              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-2">Configuración Maestra de Producto</p>
                          </div>
                      </div>
                      <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white/10 rounded-full transition-all"><X size={32}/></button>
                  </div>

                  <div className="flex bg-slate-100 p-1.5 shrink-0 border-b border-slate-200">
                      {(['GENERAL', 'CODES', 'PRICING', 'STOCK'] as const).map(tab => (
                          <button key={tab} onClick={() => setModalTab(tab)} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${modalTab === tab ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                              {tab === 'GENERAL' ? 'Identidad' : tab === 'CODES' ? 'Códigos / Barras' : tab === 'PRICING' ? 'Precios & Márgenes' : 'Existencias'}
                          </button>
                      ))}
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50 custom-scrollbar space-y-8">
                      {modalTab === 'GENERAL' && (
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 animate-fade-in">
                              <div className="md:col-span-8 space-y-6">
                                  <div>
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Nombre del Producto (Descripción Larga)</label>
                                      <input className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-black text-slate-800 uppercase focus:border-indigo-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="EJ: PINZA UNIVERSAL 8 AISLADA..." />
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-6">
                                      <div className="space-y-2">
                                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block">Marca</label>
                                          <div className="flex gap-2">
                                              <select className="flex-1 p-4 bg-white border-2 border-slate-200 rounded-2xl font-bold uppercase outline-none focus:border-indigo-500" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})}>
                                                  <option value="">GENÉRICO / SIN MARCA</option>
                                                  {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                                              </select>
                                              <button onClick={handleQuickAddBrand} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all shadow-md"><Plus size={20}/></button>
                                          </div>
                                      </div>
                                      <div className="space-y-2">
                                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block">Rubro / Categoría</label>
                                          <div className="flex gap-2">
                                              <select className="flex-1 p-4 bg-white border-2 border-slate-200 rounded-2xl font-bold uppercase outline-none focus:border-indigo-500" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                                  <option value="">GENERAL</option>
                                                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                              </select>
                                              <button onClick={handleQuickAddCategory} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all shadow-md"><Plus size={20}/></button>
                                          </div>
                                      </div>
                                  </div>

                                  <div className="space-y-2">
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block">Proveedor Designado</label>
                                      <div className="flex gap-2">
                                          <select className="flex-1 p-4 bg-white border-2 border-slate-200 rounded-2xl font-bold uppercase outline-none focus:border-indigo-500" value={formData.provider} onChange={e => setFormData({...formData, provider: e.target.value})}>
                                              <option value="">SIN PROVEEDOR</option>
                                              {providers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                          </select>
                                          <button onClick={handleQuickAddProvider} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all shadow-md"><Plus size={20}/></button>
                                      </div>
                                  </div>

                                  <div className="grid grid-cols-3 gap-6 bg-white p-6 rounded-[2.5rem] border border-slate-200">
                                      <div>
                                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Unidad Compra</label>
                                          <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs" value={formData.measureUnitPurchase} onChange={e => setFormData({...formData, measureUnitPurchase: e.target.value})}>
                                              <option value="UNIDAD">UNIDAD</option>
                                              <option value="CAJA">CAJA</option>
                                              <option value="BOLSA">BOLSA</option>
                                              <option value="PACK">PACK</option>
                                              <option value="KILO">KILO</option>
                                              <option value="METRO">METRO</option>
                                          </select>
                                      </div>
                                      <div>
                                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Unidad Venta</label>
                                          <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs" value={formData.measureUnitSale} onChange={e => setFormData({...formData, measureUnitSale: e.target.value})}>
                                              <option value="UNIDAD">UNIDAD</option>
                                              <option value="KILO">KILO</option>
                                              <option value="METRO">METRO</option>
                                              <option value="LITRO">LITRO</option>
                                          </select>
                                      </div>
                                      <div>
                                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Factor Conversión</label>
                                          <div className="relative">
                                              <Scaling className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14}/>
                                              <input type="number" step="0.0001" className="w-full pl-9 p-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-indigo-600 outline-none" value={formData.conversionFactor} onChange={e => updatePricing({conversionFactor: parseFloat(e.target.value) || 1})} />
                                          </div>
                                      </div>
                                  </div>
                              </div>
                              <div className="md:col-span-4 bg-slate-900 p-10 rounded-[3rem] text-white flex flex-col justify-center items-center text-center space-y-6 shadow-2xl border border-white/5">
                                  <div className="w-40 h-40 bg-white/5 border-4 border-dashed border-white/10 rounded-[3rem] flex items-center justify-center text-white/10 group hover:border-indigo-500 transition-all cursor-pointer">
                                      <ImageIcon size={64}/>
                                  </div>
                                  <div>
                                      <h4 className="font-black uppercase tracking-widest text-xs">Foto de Catálogo</h4>
                                      <p className="text-[10px] text-white/30 uppercase mt-2">Sincronizado con Tienda Nube y ML</p>
                                  </div>
                              </div>
                          </div>
                      )}

                      {modalTab === 'CODES' && (
                          <div className="space-y-8 animate-fade-in">
                              <CodeManager label="SKUs Internos / Referencias" icon={Hash} items={formData.internalCodes || []} onAdd={() => addArrayItem('internalCodes')} onUpdate={(i, v) => handleArrayUpdate('internalCodes', i, v)} onRemove={(i) => removeArrayItem('internalCodes', i)} />
                              <CodeManager label="Códigos de Barras (EAN13 / UPC)" icon={Barcode} items={formData.barcodes || []} onAdd={() => addArrayItem('barcodes')} onUpdate={(i, v) => handleArrayUpdate('barcodes', i, v)} onRemove={(i) => removeArrayItem('barcodes', i)} />
                              <CodeManager label="Códigos del Proveedor" icon={Truck} items={formData.providerCodes || []} onAdd={() => addArrayItem('providerCodes')} onUpdate={(i, v) => handleArrayUpdate('providerCodes', i, v)} onRemove={(i) => removeArrayItem('providerCodes', i)} />
                          </div>
                      )}

                      {modalTab === 'PRICING' && (
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-fade-in">
                              <div className="lg:col-span-7 bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
                                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b pb-4 flex items-center gap-2"><Truck size={16} className="text-indigo-600"/> Estructura de Costos</h4>
                                  
                                  <div className="grid grid-cols-2 gap-6">
                                      <div className="col-span-2">
                                          <label className="text-[9px] font-black text-slate-400 uppercase mb-2 ml-2 block">Costo de Lista Unitario ($)</label>
                                          <input type="number" className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[2rem] font-black text-slate-900 text-3xl focus:bg-white focus:border-indigo-500 outline-none transition-all" value={formData.listCost || ''} onChange={e => updatePricing({listCost: parseFloat(e.target.value) || 0})} placeholder="0.00" />
                                      </div>
                                      <div className="col-span-2 space-y-3">
                                          <label className="text-[9px] font-black text-slate-400 uppercase mb-1 ml-2 block">Bonificaciones del Proveedor (%)</label>
                                          <div className="grid grid-cols-4 gap-3">
                                              {[0, 1, 2, 3].map(i => (
                                                  <div key={i} className="space-y-1">
                                                      <span className="text-[8px] font-black text-slate-300 uppercase ml-2">D{i+1}</span>
                                                      <input type="number" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-black text-emerald-600 text-center focus:bg-white" value={formData.discounts?.[i] || ''} onChange={e => { const ds = [...(formData.discounts || [0,0,0,0])]; ds[i] = parseFloat(e.target.value) || 0; updatePricing({discounts: ds}); }} />
                                                  </div>
                                              ))}
                                          </div>
                                      </div>
                                  </div>

                                  <div className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100 flex justify-between items-center shadow-inner">
                                      <div>
                                          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-1">Costo Neto (Reposición):</span>
                                          <p className="text-3xl font-black text-slate-900">${formData.costAfterDiscounts?.toLocaleString()}</p>
                                      </div>
                                      <div className="text-right">
                                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Neto Gravado:</span>
                                          <p className="text-xl font-black text-slate-700">${formData.priceNeto?.toLocaleString()}</p>
                                      </div>
                                  </div>
                              </div>

                              <div className="lg:col-span-5 bg-slate-950 p-10 rounded-[4rem] text-white shadow-2xl space-y-10 flex flex-col justify-center relative overflow-hidden">
                                  <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><Zap size={200}/></div>
                                  <div className="text-center space-y-4 relative z-10">
                                      <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em]">Precio de Venta Final</p>
                                      <h4 className="text-7xl font-black tracking-tighter leading-none">${formData.priceFinal?.toLocaleString()}</h4>
                                      <div className="inline-flex items-center gap-2 bg-white/5 px-4 py-1.5 rounded-full border border-white/10">
                                          <span className="text-[10px] font-black text-slate-400 uppercase">PVP sugerido</span>
                                      </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/5 relative z-10">
                                      <div>
                                          <label className="text-[9px] font-black text-indigo-400 uppercase block mb-3 text-center tracking-widest">Margen Utilidad (%)</label>
                                          <input type="number" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-black text-center text-3xl text-white outline-none focus:bg-white/10 focus:border-indigo-500" value={formData.profitMargin || ''} onChange={e => updatePricing({profitMargin: parseFloat(e.target.value) || 0})} />
                                      </div>
                                      <div>
                                          <label className="text-[9px] font-black text-indigo-400 uppercase block mb-3 text-center tracking-widest">Alícuota IVA (%)</label>
                                          <select className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-black text-center text-xl" value={formData.vatRate} onChange={e => updatePricing({vatRate: parseFloat(e.target.value)})}>
                                              <option value="21" className="text-slate-900 font-bold">21%</option>
                                              <option value="10.5" className="text-slate-900 font-bold">10.5%</option>
                                              <option value="0" className="text-slate-900 font-bold">0%</option>
                                          </select>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}

                      {modalTab === 'STOCK' && (
                          <div className="space-y-10 animate-fade-in">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                  <StockInput label="Mostrador / Local" value={formData.stockPrincipal || 0} onChange={v => setFormData({...formData, stockPrincipal: v})} color="bg-indigo-50 border-indigo-100 text-indigo-700" />
                                  <StockInput label="Depósito General" value={formData.stockDeposito || 0} onChange={v => setFormData({...formData, stockDeposito: v})} color="bg-emerald-50 border-emerald-100 text-emerald-700" />
                                  <StockInput label="Sucursales" value={formData.stockSucursal || 0} onChange={v => setFormData({...formData, stockSucursal: v})} color="bg-orange-50 border-orange-100 text-orange-700" />
                              </div>
                              
                              <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-12 relative overflow-hidden">
                                  <div className="absolute top-0 right-0 p-8 opacity-5"><AlertTriangle size={150}/></div>
                                  <div>
                                      <h4 className="text-[11px] font-black text-red-500 uppercase tracking-widest mb-6 flex items-center gap-2"><Activity size={16}/> Control de Alertas</h4>
                                      <div className="space-y-6">
                                          <div>
                                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Stock Mínimo (Alerta Roja)</label>
                                              <input type="number" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black text-red-500 focus:bg-white focus:border-red-500 outline-none" value={formData.stockMinimo || ''} onChange={e => setFormData({...formData, stockMinimo: parseFloat(e.target.value) || 0})} />
                                          </div>
                                          <div>
                                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Punto de Re-pedido (Aviso)</label>
                                              <input type="number" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black text-orange-500 focus:bg-white focus:border-orange-500 outline-none" value={formData.reorderPoint || ''} onChange={e => setFormData({...formData, reorderPoint: parseFloat(e.target.value) || 0})} />
                                          </div>
                                      </div>
                                  </div>
                                  <div className="flex flex-col justify-center bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100">
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Total en Sistema</p>
                                      <h3 className="text-6xl font-black text-slate-900 tracking-tighter">
                                          {(formData.stockPrincipal || 0) + (formData.stockDeposito || 0) + (formData.stockSucursal || 0)}
                                      </h3>
                                      <p className="text-[10px] font-bold text-indigo-600 uppercase mt-4">Unidades consolidadas</p>
                                  </div>
                              </div>
                          </div>
                      )}
                  </div>

                  <div className="p-8 bg-white border-t border-slate-200 flex justify-between items-center shrink-0">
                      <button onClick={() => setIsModalOpen(false)} className="px-8 py-3 text-slate-400 font-black uppercase text-xs tracking-widest hover:text-slate-600">Cancelar Operación</button>
                      <button onClick={handleSaveProduct} disabled={isSaving} className="bg-slate-900 text-white px-20 py-5 rounded-[2rem] font-black uppercase text-sm tracking-[0.3em] shadow-2xl flex items-center gap-4 hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50">
                          {isSaving ? <RefreshCw className="animate-spin" size={24}/> : <Save size={24}/>} GUARDAR EN MAESTRO
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

// --- COMPONENTES ATÓMICOS PARA EL MODAL ---

const CodeManager: React.FC<{ label: string, icon: any, items: string[], onAdd: () => void, onUpdate: (i: number, v: string) => void, onRemove: (i: number) => void }> = ({ label, icon: Icon, items, onAdd, onUpdate, onRemove }) => (
    <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
        <div className="flex justify-between items-center border-b pb-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Icon size={14} className="text-indigo-500"/> {label}</h4>
            <button onClick={onAdd} className="text-[10px] font-black text-indigo-600 uppercase flex items-center gap-1 hover:underline"><Plus size={14}/> Añadir</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {items.map((item, idx) => (
                <div key={idx} className="relative group">
                    <input className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black text-xs uppercase focus:bg-white focus:border-indigo-500 outline-none shadow-inner" value={item} onChange={e => onUpdate(idx, e.target.value)} />
                    <button onClick={() => onRemove(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={12}/></button>
                </div>
            ))}
            {items.length === 0 && <p className="text-[10px] text-slate-300 italic py-2">Sin registros activos.</p>}
        </div>
    </div>
);

const StockInput: React.FC<{ label: string, value: number, onChange: (v: number) => void, color: string }> = ({ label, value, onChange, color }) => (
    <div className={`p-8 rounded-[2.5rem] border-2 flex flex-col space-y-6 transition-all ${color}`}>
        <p className="text-[11px] font-black uppercase tracking-widest opacity-60 text-center">{label}</p>
        <div className="flex items-center gap-4">
            <button onClick={() => onChange(Math.max(0, value - 1))} className="p-3 bg-white/50 rounded-xl hover:bg-white transition-all shadow-sm"><MinusIcon size={20}/></button>
            <input type="number" className="flex-1 bg-transparent text-center font-black text-5xl outline-none tracking-tighter" value={value} onChange={e => onChange(parseFloat(e.target.value) || 0)} />
            <button onClick={() => onChange(value + 1)} className="p-3 bg-white/50 rounded-xl hover:bg-white transition-all shadow-sm"><PlusIcon size={20}/></button>
        </div>
    </div>
);

export default Inventory;
