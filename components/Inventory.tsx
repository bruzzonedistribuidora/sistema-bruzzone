
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    Search, Plus, Package, X, Save, 
    Barcode, Pen, Trash2, Tag, Layers, RefreshCw, 
    Truck, PlusCircle, CheckCircle, Hash,
    Boxes as BoxesIcon, PackagePlus, ShoppingCart, AlertCircle, Database,
    Calculator, MapPin, Percent, DollarSign, TrendingUp, Zap, List, PlusSquare,
    Ruler, Scale, Box, ShoppingBag, DatabaseZap, FileUp, Camera, Image as ImageIcon,
    History, Link2, Info, ChevronRight, ListPlus
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
  
  const [brands, setBrands] = useState<Brand[]>(() => JSON.parse(localStorage.getItem('ferrecloud_brands') || '[]'));
  const [providers, setProviders] = useState<Provider[]>(() => JSON.parse(localStorage.getItem('ferrecloud_providers') || '[]'));
  const [categories, setCategories] = useState<Category[]>(() => JSON.parse(localStorage.getItem('ferrecloud_categories') || '[]'));

  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialFormState: Partial<Product> = {
      name: '',
      brand: '',
      category: '',
      provider: '',
      internalCodes: [''],
      barcodes: [],
      providerCodes: [''],
      otrosCodigos1: '',
      otrosCodigos2: '',
      otrosCodigos3: '',
      otrosCodigos4: '',
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
      conversionFactor: 1,
      ecommerce: { isPublished: false, imageUrl: '' },
      isCombo: false,
      comboItems: []
  };

  const [formData, setFormData] = useState<Partial<Product>>(initialFormState);
  const [newBarcode, setNewBarcode] = useState('');

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
      } catch (err) { console.error(err); } finally { setIsLoading(false); }
  };

  useEffect(() => {
    loadProducts();
    const handleUpdate = () => loadProducts();
    window.addEventListener('ferrecloud_products_updated', handleUpdate);
    return () => window.removeEventListener('ferrecloud_products_updated', handleUpdate);
  }, [searchTerm]);

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

  const addBarcode = () => {
    if (!newBarcode.trim()) return;
    const current = formData.barcodes || [];
    if (!current.includes(newBarcode.trim())) {
        setFormData({ ...formData, barcodes: [...current, newBarcode.trim()] });
    }
    setNewBarcode('');
  };

  const handleSaveProduct = async () => {
      if (!formData.name || !formData.internalCodes?.[0]) {
          alert("Nombre y Código SKU son obligatorios.");
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
                  <h2 className="text-xl font-black uppercase tracking-tighter">Inventario Maestro</h2>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{totalCount.toLocaleString()} artículos activos</p>
              </div>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setInventoryTab('PRODUCTS')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${inventoryTab === 'PRODUCTS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>Stock</button>
              <button onClick={() => setInventoryTab('IMPORT')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${inventoryTab === 'IMPORT' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>Importar Excel</button>
          </div>
          <button onClick={() => { setFormData(initialFormState); setIsModalOpen(true); }} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] shadow-lg hover:bg-indigo-600 transition-all flex items-center gap-2">
              <Plus size={16}/> Alta de Artículo
          </button>
      </div>

      <div className="flex-1 overflow-hidden">
          {inventoryTab === 'PRODUCTS' ? (
              <div className="h-full flex flex-col space-y-4">
                  <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm shrink-0 relative">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                      <input 
                        type="text" 
                        placeholder="BUSCAR POR NOMBRE, MARCA O CUALQUIER CÓDIGO..." 
                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-xl font-black text-sm outline-none focus:bg-white focus:border-indigo-500 uppercase transition-all"
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
                                      <th className="px-8 py-5">Codificación</th>
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
                                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.brand} • {p.category}</p>
                                          </td>
                                          <td className="px-8 py-4">
                                              <p className="text-[9px] font-mono font-bold text-indigo-600 uppercase">INT: {p.internalCodes?.[0]}</p>
                                              <p className="text-[9px] font-mono font-bold text-emerald-600 uppercase">PROV: {p.providerCodes?.[0] || '---'}</p>
                                          </td>
                                          <td className={`px-8 py-4 text-center font-black text-lg tracking-tighter ${p.stock <= (p.reorderPoint || 0) ? 'text-red-500' : 'text-slate-900'}`}>
                                              {p.stock}
                                          </td>
                                          <td className="px-8 py-4 text-right font-black text-slate-900 text-lg tracking-tighter">
                                              ${p.priceFinal?.toLocaleString()}
                                          </td>
                                          <td className="px-8 py-4 text-center">
                                              <div className="flex justify-center gap-1">
                                                  <button title="Editar Ficha" onClick={() => { setFormData(p); setIsModalOpen(true); }} className="p-2 text-slate-400 bg-slate-50 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"><Pen size={15}/></button>
                                                  <button title="Añadir a Reposición" onClick={() => addToReplenishmentQueue(p)} className="p-2 text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><Truck size={15}/></button>
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

      {/* MODAL FICHA TÉCNICA FERRETERA */}
      {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[95vh]">
                  <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-5">
                          <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg"><PackagePlus size={28}/></div>
                          <div>
                              <h3 className="text-xl font-black uppercase tracking-tighter leading-none">{formData.id ? 'Ficha de Artículo' : 'Nuevo Ingreso Maestro'}</h3>
                              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Configuración Técnica, Fiscal y Comercial</p>
                          </div>
                      </div>
                      <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={32}/></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 custom-scrollbar">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                          
                          {/* BLOQUE 1: IDENTIDAD Y CLASIFICACIÓN */}
                          <div className="lg:col-span-12 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                              <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] border-b pb-4 flex items-center gap-2"><Tag size={14}/> 1. Identidad y Rubro</h4>
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                  <div className="md:col-span-6">
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-1">Nombre Comercial / Descripción del Producto</label>
                                      <input type="text" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black text-lg focus:bg-white focus:border-indigo-500 uppercase transition-all" value={formData.name} onChange={e => updateField('name', e.target.value)} placeholder="EJ: TALADRO PERCUTOR 13MM 750W" />
                                  </div>
                                  <div className="md:col-span-2">
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-1">Marca</label>
                                      <div className="flex gap-2">
                                          <select className="flex-1 p-4 bg-slate-50 border rounded-2xl font-bold uppercase outline-none" value={formData.brand} onChange={e => updateField('brand', e.target.value)}>
                                              <option value="">SELECCIONAR</option>
                                              {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                                          </select>
                                          <button onClick={() => quickAdd('BRAND')} className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-indigo-600"><Plus size={16}/></button>
                                      </div>
                                  </div>
                                  <div className="md:col-span-2">
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-1">Rubro</label>
                                      <div className="flex gap-2">
                                          <select className="flex-1 p-4 bg-slate-50 border rounded-2xl font-bold uppercase outline-none" value={formData.category} onChange={e => updateField('category', e.target.value)}>
                                              <option value="">SELECCIONAR</option>
                                              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                          </select>
                                          <button onClick={() => quickAdd('CATEGORY')} className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-indigo-600"><Plus size={16}/></button>
                                      </div>
                                  </div>
                                  <div className="md:col-span-2">
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-1">Proveedor Principal</label>
                                      <div className="flex gap-2">
                                          <select className="flex-1 p-4 bg-slate-50 border rounded-2xl font-bold uppercase outline-none" value={formData.provider} onChange={e => updateField('provider', e.target.value)}>
                                              <option value="">SELECCIONAR</option>
                                              {providers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                          </select>
                                          <button onClick={() => quickAdd('PROVIDER')} className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-indigo-600 transition-all"><Plus size={16}/></button>
                                      </div>
                                  </div>
                              </div>
                          </div>

                          {/* BLOQUE 2: CODIFICACIÓN Y RELACIONES */}
                          <div className="lg:col-span-6 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                              <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] border-b pb-4 flex items-center gap-2"><Barcode size={14}/> 2. Códigos de Control</h4>
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-1">Código SKU Interno</label>
                                      <input type="text" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black text-indigo-600 focus:bg-white focus:border-indigo-500" value={formData.internalCodes?.[0]} onChange={e => updateField('internalCodes', [e.target.value.toUpperCase()])} />
                                  </div>
                                  <div>
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-1">Código del Proveedor</label>
                                      <input type="text" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black text-emerald-600 focus:bg-white focus:border-indigo-500" value={formData.providerCodes?.[0]} onChange={e => updateField('providerCodes', [e.target.value.toUpperCase()])} />
                                  </div>
                              </div>
                              
                              <div>
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-1">Códigos de Barras (Múltiples EAN)</label>
                                  <div className="flex gap-2 mb-3">
                                      <input type="text" className="flex-1 p-3 bg-slate-50 border rounded-xl font-bold font-mono" placeholder="Escanear o tipear..." value={newBarcode} onChange={e => setNewBarcode(e.target.value)} onKeyDown={e => e.key === 'Enter' && addBarcode()} />
                                      <button onClick={addBarcode} className="bg-slate-900 text-white px-4 rounded-xl"><Plus size={16}/></button>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                      {formData.barcodes?.map((bc, idx) => (
                                          <span key={idx} className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-100 font-mono text-[10px] font-bold flex items-center gap-2">
                                              {bc} <X size={12} className="cursor-pointer hover:text-red-500" onClick={() => updateField('barcodes', formData.barcodes?.filter(b => b !== bc))} />
                                          </span>
                                      ))}
                                  </div>
                              </div>

                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-dashed">
                                  {['1', '2', '3', '4'].map(num => (
                                      <div key={num}>
                                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-1">Cód. Extra {num}</label>
                                          <input type="text" className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold text-[10px] uppercase" value={(formData as any)[`otrosCodigos${num}`]} onChange={e => updateField(`otrosCodigos${num}`, e.target.value.toUpperCase())} />
                                      </div>
                                  ))}
                              </div>
                          </div>

                          {/* BLOQUE 3: COSTOS, IVA Y PRECIO VENTA */}
                          <div className="lg:col-span-6 bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl space-y-6 text-white relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-8 opacity-5"><Calculator size={120}/></div>
                              <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] border-b border-white/10 pb-4 flex items-center gap-2"><DollarSign size={14}/> 3. Precios e Impuestos</h4>
                              
                              <div className="grid grid-cols-2 gap-6">
                                  <div>
                                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 block mb-1">Costo de Lista ($)</label>
                                      <input type="number" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-black text-2xl text-white outline-none focus:bg-white/10" value={formData.listCost || ''} onChange={e => updateField('listCost', e.target.value)} />
                                  </div>
                                  <div>
                                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 block mb-1">IVA (%)</label>
                                      <select className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-black text-xl outline-none" value={formData.vatRate} onChange={e => updateField('vatRate', e.target.value)}>
                                          <option value="21" className="text-slate-900">21.0%</option>
                                          <option value="10.5" className="text-slate-900">10.5%</option>
                                          <option value="0" className="text-slate-900">0.0% (Exento)</option>
                                      </select>
                                  </div>
                              </div>

                              <div className="grid grid-cols-3 gap-3">
                                  {[0, 1, 2].map(idx => (
                                      <div key={idx}>
                                          <label className="text-[8px] font-black text-slate-500 uppercase ml-1 block mb-1">Bonif {idx + 1} %</label>
                                          <input type="number" className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl font-bold text-center text-indigo-300" value={formData.discounts?.[idx] || ''} onChange={e => updateField(`d_${idx}`, e.target.value)} />
                                      </div>
                                  ))}
                              </div>

                              <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                                  <div>
                                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Utilidad Deseada (%)</p>
                                      <input type="number" className="w-32 p-3 bg-white/10 border border-indigo-500/30 rounded-xl font-black text-2xl mt-1" value={formData.profitMargin} onChange={e => updateField('profitMargin', e.target.value)} />
                                  </div>
                                  <div className="text-right">
                                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">PRECIO VENTA FINAL</p>
                                      <h3 className="text-5xl font-black tracking-tighter text-green-400">${formData.priceFinal?.toLocaleString('es-AR')}</h3>
                                  </div>
                              </div>
                          </div>

                          {/* BLOQUE 4: LOGÍSTICA Y COMPRA ANTERIOR */}
                          <div className="lg:col-span-12 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] border-b pb-4 flex items-center gap-2"><History size={14}/> 4. Referencia de Compra</h4>
                                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase">Último Costo Pagado</p>
                                            <p className="text-xl font-black text-slate-700">$---</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-slate-400 uppercase">Fecha Últ. Compra</p>
                                            <p className="text-xs font-bold text-slate-500">Nunca</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                                        <Info size={16} className="text-indigo-600" />
                                        <p className="text-[9px] font-black text-indigo-700 uppercase leading-relaxed">
                                            Este campo se actualiza automáticamente al procesar facturas de compra con IA o carga manual.
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] border-b pb-4 flex items-center gap-2"><Scale size={14}/> 5. Stock y Unidades</h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase ml-1 block mb-1">U. Medida</label>
                                            <select className="w-full p-3 bg-slate-50 border rounded-xl font-bold uppercase" value={formData.measureUnitSale} onChange={e => updateField('measureUnitSale', e.target.value)}>
                                                <option value="UNIDAD">Unidad</option><option value="METRO">Metro</option><option value="KG">Kilo</option><option value="CAJA">Caja</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase ml-1 block mb-1">Stock Mínimo</label>
                                            <input type="number" className="w-full p-3 bg-red-50/50 border border-red-100 rounded-xl font-black text-red-600 text-center" value={formData.stockMinimo || ''} onChange={e => updateField('stockMinimo', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase ml-1 block mb-1">Stock Máximo</label>
                                            <input type="number" className="w-full p-3 bg-green-50/50 border border-green-100 rounded-xl font-black text-green-600 text-center" value={formData.stockMaximo || ''} onChange={e => updateField('stockMaximo', e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                          </div>
                      </div>
                  </div>

                  <div className="p-8 bg-white border-t border-slate-100 flex justify-end gap-4 shrink-0">
                      <button onClick={() => setIsModalOpen(false)} className="px-8 py-3 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors">Descartar Cambios</button>
                      <button onClick={handleSaveProduct} disabled={isLoading} className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl flex items-center gap-3 hover:bg-indigo-600 transition-all active:scale-95">
                          {isLoading ? <RefreshCw className="animate-spin" size={18}/> : <Save size={18}/>} Confirmar y Guardar
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Inventory;
