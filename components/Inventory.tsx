
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    Search, Plus, Package, X, Save, 
    Barcode, Pen, Trash2, Tag, Layers, RefreshCw, 
    Truck, PlusCircle, CheckCircle, Hash,
    Boxes as BoxesIcon, PackagePlus, ShoppingCart, AlertCircle, Database,
    Calculator, MapPin, Percent, DollarSign, TrendingUp, Zap, List, PlusSquare,
    Ruler, Scale, Box, ShoppingBag, DatabaseZap, FileUp, Camera, Image as ImageIcon
} from 'lucide-react';
import { Product, Provider, Brand, Category, ComboItem } from '../types';
import { productDB, addToReplenishmentQueue } from '../services/storageService';
import InitialImport from './InitialImport';

const Inventory: React.FC = () => {
  const [inventoryTab, setInventoryTab] = useState<'PRODUCTS' | 'IMPORT'>('PRODUCTS');
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  
  const [comboSearch, setComboSearch] = useState('');
  const [comboResults, setComboResults] = useState<Product[]>([]);

  const [brands, setBrands] = useState<Brand[]>(() => JSON.parse(localStorage.getItem('ferrecloud_brands') || '[]'));
  const [providers, setProviders] = useState<Provider[]>(() => JSON.parse(localStorage.getItem('ferrecloud_providers') || '[]'));
  const [categories, setCategories] = useState<Category[]>(() => JSON.parse(localStorage.getItem('ferrecloud_categories') || '[]'));

  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialFormState: Partial<Product> = {
      name: '',
      brand: '',
      category: '',
      provider: '',
      location: '',
      internalCodes: [''],
      barcodes: [''],
      providerCodes: [''],
      listCost: 0,
      discounts: [0, 0, 0, 0],
      profitMargin: 30,
      vatRate: 21,
      stockPrincipal: 0,
      stockDeposito: 0,
      stockSucursal: 0,
      stockMinimo: 0,
      stockMaximo: 0,
      priceFinal: 0,
      measureUnitPurchase: 'UNIDAD',
      measureUnitSale: 'UNIDAD',
      purchasePackageQuantity: 1,
      salePackageQuantity: 1,
      conversionFactor: 1,
      ecommerce: { isPublished: false, imageUrl: '' },
      isCombo: false,
      comboItems: []
  };

  const [formData, setFormData] = useState<Partial<Product>>(initialFormState);

  const loadProducts = async () => {
      setIsLoading(true);
      try {
          const stats = await productDB.getStats();
          setTotalCount(stats.count);

          if (searchTerm.trim().length > 2) {
              const results = await productDB.search(searchTerm);
              setProducts(results);
          } else {
              const initial = await productDB.getAll(50);
              setProducts(initial);
          }
      } catch (err) {
          console.error(err);
      } finally {
          setIsLoading(false);
      }
  };

  useEffect(() => {
    loadProducts();
    const handleSync = () => loadProducts();
    window.addEventListener('ferrecloud_sync_pulse', handleSync);
    window.addEventListener('ferrecloud_products_updated', loadProducts);
    return () => {
        window.removeEventListener('ferrecloud_sync_pulse', handleSync);
        window.removeEventListener('ferrecloud_products_updated', loadProducts);
    };
  }, [searchTerm]);

  useEffect(() => {
      const search = async () => {
          if (comboSearch.length > 2) {
              const res = await productDB.search(comboSearch);
              setComboResults(res);
          } else setComboResults([]);
      };
      search();
  }, [comboSearch]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
          setFormData(prev => ({
              ...prev,
              ecommerce: { ...prev.ecommerce, imageUrl: ev.target?.result as string }
          }));
      };
      reader.readAsDataURL(file);
  };

  const addComboItem = (p: Product) => {
      const exists = formData.comboItems?.some(i => i.productId === p.id);
      if (exists) return;
      setFormData(prev => ({
          ...prev,
          comboItems: [...(prev.comboItems || []), { productId: p.id, productName: p.name, quantity: 1, unitCost: p.costAfterDiscounts }]
      }));
      setComboSearch('');
  };

  const removeComboItem = (pid: string) => {
      setFormData(prev => ({
          ...prev,
          comboItems: prev.comboItems?.filter(i => i.productId !== pid) || []
      }));
  };

  const calculatePrices = (data: Partial<Product>) => {
      const list = parseFloat(data.listCost as any) || 0;
      const d = data.discounts || [0, 0, 0, 0];
      const coef = (1 - (parseFloat(d[0] as any) || 0)/100) * 
                   (1 - (parseFloat(d[1] as any) || 0)/100) * 
                   (1 - (parseFloat(d[2] as any) || 0)/100) * 
                   (1 - (parseFloat(d[3] as any) || 0)/100);
      
      const netCost = list * coef;
      const margin = parseFloat(data.profitMargin as any) || 0;
      const priceNeto = netCost * (1 + margin/100);
      const vat = parseFloat(data.vatRate as any) || 21;
      const final = priceNeto * (1 + vat/100);

      return {
          costAfterDiscounts: parseFloat(netCost.toFixed(4)),
          priceNeto: parseFloat(priceNeto.toFixed(2)),
          priceFinal: parseFloat(final.toFixed(2))
      };
  };

  const updateField = (field: string, value: any) => {
      setFormData(prev => {
          let next = { ...prev };
          if (field.startsWith('d_')) {
              const idx = parseInt(field.split('_')[1]);
              const newDiscounts = [...(prev.discounts || [0,0,0,0])];
              newDiscounts[idx] = parseFloat(value) || 0;
              next.discounts = newDiscounts;
          } else {
              (next as any)[field] = value;
          }
          const updates = calculatePrices(next);
          return { ...next, ...updates };
      });
  };

  const handleSaveProduct = async () => {
      if (!formData.name || !formData.internalCodes?.[0]) {
          alert("Nombre y Código Interno son obligatorios.");
          return;
      }
      setIsLoading(true);
      const productToSave: Product = {
          ...formData,
          id: formData.id || `PROD-${Date.now()}`,
          name: formData.name.toUpperCase(),
          brand: (formData.brand || 'GENERICO').toUpperCase(),
          category: (formData.category || 'GENERAL').toUpperCase(),
          provider: (formData.provider || 'S/D').toUpperCase(),
          stock: (parseFloat(formData.stockPrincipal as any) || 0) + (parseFloat(formData.stockDeposito as any) || 0) + (parseFloat(formData.stockSucursal as any) || 0)
      } as Product;

      await productDB.save(productToSave);
      setIsModalOpen(false);
      await loadProducts();
      setIsLoading(false);
  };

  const quickAdd = (type: 'BRAND' | 'PROVIDER' | 'CATEGORY') => {
      const name = prompt(`Ingrese nueva ${type === 'BRAND' ? 'Marca' : type === 'CATEGORY' ? 'Categoría' : 'Proveedor'}:`);
      if (!name) return;
      const upper = name.toUpperCase();
      if (type === 'BRAND') {
          const next = [...brands, { id: Date.now().toString(), name: upper }];
          setBrands(next);
          localStorage.setItem('ferrecloud_brands', JSON.stringify(next));
          setFormData(prev => ({ ...prev, brand: upper }));
      } else if (type === 'CATEGORY') {
          const next = [...categories, { id: Date.now().toString(), name: upper }];
          setCategories(next);
          localStorage.setItem('ferrecloud_categories', JSON.stringify(next));
          setFormData(prev => ({ ...prev, category: upper }));
      } else {
          // Fix: cast defaultDiscounts to tuple [number, number, number] to match Provider type
          const next: Provider[] = [...providers, { id: Date.now().toString(), name: upper, cuit: '', contact: '', phone: '', email: '', address: '', balance: 0, defaultDiscounts: [0,0,0] as [number, number, number] }];
          setProviders(next);
          localStorage.setItem('ferrecloud_providers', JSON.stringify(next));
          setFormData(prev => ({ ...prev, provider: upper }));
      }
  };

  return (
    <div className="p-4 h-full flex flex-col space-y-4 bg-slate-100 overflow-hidden font-sans">
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm shrink-0 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-900 text-indigo-400 rounded-2xl shadow-lg"><BoxesIcon size={24}/></div>
              <div>
                  <h2 className="text-xl font-black uppercase tracking-tighter">Maestro de Artículos</h2>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Base de Datos: <span className="text-indigo-600">{totalCount.toLocaleString()} registros</span></p>
              </div>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setInventoryTab('PRODUCTS')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${inventoryTab === 'PRODUCTS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>Stock</button>
              <button onClick={() => setInventoryTab('IMPORT')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${inventoryTab === 'IMPORT' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>Importar Excel</button>
          </div>
          <button onClick={() => { setFormData(initialFormState); setIsModalOpen(true); }} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2">
              <PlusCircle size={16}/> Alta Manual
          </button>
      </div>

      <div className="flex-1 overflow-hidden">
          {inventoryTab === 'PRODUCTS' ? (
              <div className="h-full flex flex-col space-y-4">
                  <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm shrink-0 relative group">
                      <Search className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${isLoading ? 'text-indigo-500 animate-pulse' : 'text-slate-300'}`} size={20}/>
                      <input 
                        type="text" 
                        placeholder="BUSCAR POR NOMBRE, SKU O CÓDIGO DE BARRAS..." 
                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-xl font-black text-sm outline-none focus:bg-white focus:border-indigo-500 uppercase tracking-tight"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                      />
                  </div>

                  <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                      <div className="flex-1 overflow-y-auto custom-scrollbar">
                          <table className="w-full text-left">
                              <thead className="bg-slate-900 text-white sticky top-0 z-10 text-[9px] font-black uppercase tracking-widest">
                                  <tr>
                                      <th className="px-8 py-5">Artículo</th>
                                      <th className="px-8 py-5">Marca / Rubro</th>
                                      <th className="px-8 py-5 text-center">Stock</th>
                                      <th className="px-8 py-5 text-right">Precio Final</th>
                                      <th className="px-8 py-5 text-center">Acciones</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                  {products.map(p => (
                                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                          <td className="px-8 py-4">
                                              <p className="font-black text-slate-800 text-xs uppercase leading-none mb-1.5">{p.name}</p>
                                              <p className="text-[9px] font-mono font-bold text-indigo-600 uppercase">REF: {p.internalCodes?.[0]}</p>
                                          </td>
                                          <td className="px-8 py-4">
                                              <p className="text-[10px] font-black text-slate-500 uppercase">{p.brand} • {p.category}</p>
                                          </td>
                                          <td className={`px-8 py-4 text-center font-black text-lg tracking-tighter ${p.stock <= (p.reorderPoint || 0) ? 'text-red-500' : 'text-slate-900'}`}>
                                              {p.stock} {p.measureUnitSale}
                                          </td>
                                          <td className="px-8 py-4 text-right font-black text-slate-900 text-lg tracking-tighter">
                                              ${p.priceFinal?.toLocaleString()}
                                          </td>
                                          <td className="px-8 py-4 text-center">
                                              <div className="flex justify-center gap-1">
                                                  <button title="Vender ahora" onClick={() => { window.dispatchEvent(new CustomEvent('ferrecloud_add_to_pos', { detail: { product: p } })); }} className="p-2 text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"><ShoppingCart size={15}/></button>
                                                  <button title="Añadir a Reposición" onClick={() => addToReplenishmentQueue(p)} className="p-2 text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><Truck size={15}/></button>
                                                  <button title="Editar Ficha" onClick={() => { setFormData(p); setIsModalOpen(true); }} className="p-2 text-slate-400 bg-slate-50 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"><Pen size={15}/></button>
                                                  <button title="Eliminar" onClick={async () => { if(confirm('¿Eliminar?')) { await productDB.delete(p.id); loadProducts(); } }} className="p-2 text-red-400 bg-red-50 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"><Trash2 size={15}/></button>
                                              </div>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>
          ) : (
              <InitialImport onComplete={() => setInventoryTab('PRODUCTS')} />
          )}
      </div>

      {/* MODAL FICHA TÉCNICA PRO COMPLETA */}
      {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[95vh]">
                  <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-5">
                          <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg"><PackagePlus size={28}/></div>
                          <div>
                              <h3 className="text-xl font-black uppercase tracking-tighter leading-none">{formData.id ? 'Editar Artículo Maestro' : 'Nuevo Artículo'}</h3>
                              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Gestión Técnica y Comercial</p>
                          </div>
                      </div>
                      <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={32}/></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50 custom-scrollbar">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                          {/* COLUMNA IZQUIERDA: IDENTIDAD E IMAGEN */}
                          <div className="lg:col-span-4 space-y-6">
                              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm text-center">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Imagen del Producto</label>
                                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                                  <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-48 h-48 bg-slate-50 border-4 border-dashed border-slate-100 rounded-[2.5rem] mx-auto flex items-center justify-center relative group cursor-pointer hover:border-indigo-400 transition-all overflow-hidden"
                                  >
                                      {formData.ecommerce?.imageUrl ? (
                                          <img src={formData.ecommerce.imageUrl} className="w-full h-full object-cover" />
                                      ) : (
                                          <div className="flex flex-col items-center gap-2 text-slate-300">
                                              <Camera size={40} />
                                              <span className="text-[8px] font-black uppercase">Subir Imagen</span>
                                          </div>
                                      )}
                                      <div className="absolute inset-0 bg-indigo-600/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-black">CAMBIAR</div>
                                  </div>
                              </div>

                              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
                                  <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b pb-4">Logística y Unidades</h4>
                                  <div className="grid grid-cols-2 gap-4">
                                      <div>
                                          <label className="text-[9px] font-black text-slate-400 uppercase ml-1 block mb-1">Medida Compra</label>
                                          <select className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold uppercase" value={formData.measureUnitPurchase} onChange={e => updateField('measureUnitPurchase', e.target.value)}>
                                              <option value="UNIDAD">Unidad</option><option value="METRO">Metro</option><option value="KG">Kilogramo</option><option value="LITRO">Litro</option><option value="ROLLO">Rollo</option><option value="CAJA">Caja</option>
                                          </select>
                                      </div>
                                      <div>
                                          <label className="text-[9px] font-black text-slate-400 uppercase ml-1 block mb-1">Medida Venta</label>
                                          <select className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold uppercase" value={formData.measureUnitSale} onChange={e => updateField('measureUnitSale', e.target.value)}>
                                              <option value="UNIDAD">Unidad</option><option value="METRO">Metro</option><option value="KG">Kilogramo</option><option value="LITRO">Litro</option><option value="ROLLO">Rollo</option><option value="CAJA">Caja</option>
                                          </select>
                                      </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                      <div>
                                          <label className="text-[9px] font-black text-slate-400 uppercase ml-1 block mb-1">Stock Mínimo</label>
                                          <input type="number" className="w-full p-2.5 bg-red-50/30 border border-red-100 rounded-xl font-black text-red-600" value={formData.stockMinimo || ''} onChange={e => updateField('stockMinimo', e.target.value)} />
                                      </div>
                                      <div>
                                          <label className="text-[9px] font-black text-slate-400 uppercase ml-1 block mb-1">Stock Máximo</label>
                                          <input type="number" className="w-full p-2.5 bg-green-50/30 border border-green-100 rounded-xl font-black text-green-600" value={formData.stockMaximo || ''} onChange={e => updateField('stockMaximo', e.target.value)} />
                                      </div>
                                  </div>
                              </div>
                          </div>

                          {/* COLUMNA CENTRAL: DATOS PRINCIPALES Y COMBOS */}
                          <div className="lg:col-span-8 space-y-6">
                              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                                  <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b pb-4 flex items-center gap-2"><Tag size={14}/> Datos Identificatorios</h4>
                                  <div className="space-y-4">
                                      <div>
                                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-1">Nombre Comercial / Descripción del Producto</label>
                                          <input type="text" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black text-lg focus:bg-white focus:border-indigo-500 uppercase transition-all" value={formData.name} onChange={e => updateField('name', e.target.value)} />
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                          <div className="relative">
                                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-1">Marca</label>
                                              <div className="flex gap-2">
                                                  <select className="flex-1 p-3 bg-slate-50 border rounded-xl font-bold uppercase outline-none" value={formData.brand} onChange={e => updateField('brand', e.target.value)}>
                                                      <option value="">SELECCIONAR</option>
                                                      {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                                                  </select>
                                                  <button onClick={() => quickAdd('BRAND')} className="bg-slate-900 text-white p-3 rounded-xl hover:bg-indigo-600"><Plus size={16}/></button>
                                              </div>
                                          </div>
                                          <div>
                                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-1">Rubro / Categoría</label>
                                              <div className="flex gap-2">
                                                  <select className="flex-1 p-3 bg-slate-50 border rounded-xl font-bold uppercase outline-none" value={formData.category} onChange={e => updateField('category', e.target.value)}>
                                                      <option value="">SELECCIONAR</option>
                                                      {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                                  </select>
                                                  <button onClick={() => quickAdd('CATEGORY')} className="bg-slate-900 text-white p-3 rounded-xl hover:bg-indigo-600"><Plus size={16}/></button>
                                              </div>
                                          </div>
                                          <div>
                                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-1">Proveedor</label>
                                              <div className="flex gap-2">
                                                  <select className="flex-1 p-3 bg-slate-50 border rounded-xl font-bold uppercase outline-none" value={formData.provider} onChange={e => updateField('provider', e.target.value)}>
                                                      <option value="">SELECCIONAR</option>
                                                      {providers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                                  </select>
                                                  <button onClick={() => quickAdd('PROVIDER')} className="bg-slate-900 text-white p-3 rounded-xl hover:bg-indigo-600"><Plus size={16}/></button>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              </div>

                              {/* SECCIÓN COMBOS */}
                              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
                                  <div className="flex justify-between items-center border-b pb-4">
                                      <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2"><Layers size={14}/> Armado de Combo / Pack</h4>
                                      <div onClick={() => updateField('isCombo', !formData.isCombo)} className={`w-12 h-6 rounded-full relative cursor-pointer transition-all ${formData.isCombo ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isCombo ? 'right-1' : 'left-1'}`}></div>
                                      </div>
                                  </div>
                                  {formData.isCombo && (
                                      <div className="space-y-4 animate-fade-in">
                                          <div className="relative">
                                              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                                              <input type="text" placeholder="BUSCAR ARTÍCULO PARA AGREGAR AL COMBO..." className="w-full pl-12 p-3 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold uppercase text-xs" value={comboSearch} onChange={e => setComboSearch(e.target.value)} />
                                              {comboResults.length > 0 && (
                                                  <div className="absolute top-full left-0 w-full bg-white border rounded-2xl shadow-2xl mt-1 max-h-48 overflow-y-auto z-50 p-2">
                                                      {comboResults.map(r => (
                                                          <button key={r.id} onClick={() => addComboItem(r)} className="w-full text-left p-3 hover:bg-slate-50 border-b last:border-0 flex justify-between items-center group">
                                                              <span className="font-bold text-xs uppercase group-hover:text-indigo-600">{r.name}</span>
                                                              <Plus size={14} className="text-indigo-600"/>
                                                          </button>
                                                      ))}
                                                  </div>
                                              )}
                                          </div>
                                          <div className="space-y-2">
                                              {formData.comboItems?.map(item => (
                                                  <div key={item.productId} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                      <span className="text-[11px] font-black uppercase text-slate-600 flex-1">{item.productName}</span>
                                                      <div className="flex items-center gap-3">
                                                          <input type="number" className="w-16 p-1 border rounded font-black text-center text-xs" value={item.quantity} onChange={e => {
                                                              const next = formData.comboItems?.map(i => i.productId === item.productId ? {...i, quantity: parseInt(e.target.value)||1} : i);
                                                              setFormData({...formData, comboItems: next});
                                                          }} />
                                                          <button onClick={() => removeComboItem(item.productId)} className="text-red-300 hover:text-red-500"><Trash2 size={16}/></button>
                                                      </div>
                                                  </div>
                                              ))}
                                          </div>
                                      </div>
                                  )}
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="p-8 bg-white border-t border-slate-100 flex justify-end gap-4 shrink-0">
                      <button onClick={() => setIsModalOpen(false)} className="px-8 py-3 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors">Cancelar</button>
                      <button onClick={handleSaveProduct} disabled={isLoading} className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl flex items-center gap-3 hover:bg-indigo-600 transition-all active:scale-95">
                          {isLoading ? <RefreshCw className="animate-spin" size={18}/> : <Save size={18}/>} Guardar Ficha Completa
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Inventory;
