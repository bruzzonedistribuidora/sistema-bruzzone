
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Search, Plus, Package, X, Save, 
    Barcode, Pen, Trash2, Tag, Layers, RefreshCw, 
    Truck, PlusCircle, CheckCircle, Hash,
    Boxes as BoxesIcon, PackagePlus, ShoppingCart, AlertCircle, Database,
    Calculator, MapPin, Percent, DollarSign, TrendingUp, Zap, List, PlusSquare,
    Ruler, Scale, Box, ShoppingBag, DatabaseZap, FileUp
} from 'lucide-react';
import { Product, Provider, Brand, Category } from '../types';
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
      ecommerce: { isPublished: false }
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

  const handleDeleteProduct = async (id: string, name: string) => {
      if (window.confirm(`¿ESTÁ SEGURO? Se eliminará permanentemente: ${name.toUpperCase()}\nEsta acción no se puede deshacer.`)) {
          await productDB.delete(id);
          await loadProducts();
      }
  };

  const handleAddToReplenishment = (p: Product) => {
      if (addToReplenishmentQueue(p)) {
          alert(`✅ ${p.name} añadido a la cola de reposición.`);
      } else {
          alert(`⚠️ Este artículo ya está en la lista de pedidos pendientes.`);
      }
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

  const updateArrayField = (field: 'internalCodes' | 'barcodes' | 'providerCodes', index: number, value: string) => {
      setFormData(prev => {
          const arr = [...(prev[field] || [''])];
          arr[index] = value;
          return { ...prev, [field]: arr };
      });
  };

  const addArrayItem = (field: 'internalCodes' | 'barcodes' | 'providerCodes') => {
      setFormData(prev => ({ ...prev, [field]: [...(prev[field] || []), ''] }));
  };

  const removeArrayItem = (field: 'internalCodes' | 'barcodes' | 'providerCodes', index: number) => {
      setFormData(prev => {
          const arr = (prev[field] || ['']).filter((_, i) => i !== index);
          return { ...prev, [field]: arr.length ? arr : [''] };
      });
  };

  const handleSaveProduct = async () => {
      if (!formData.name || !formData.internalCodes?.[0]) {
          alert("El nombre y al menos un código interno son obligatorios.");
          return;
      }
      setIsLoading(true);
      
      const brandUpper = (formData.brand || 'GENERICO').toUpperCase();
      if (brandUpper !== 'GENERICO' && !brands.some(b => b.name === brandUpper)) {
          const newBrand = { id: `brand-${Date.now()}`, name: brandUpper };
          const updatedBrands = [...brands, newBrand];
          setBrands(updatedBrands);
          localStorage.setItem('ferrecloud_brands', JSON.stringify(updatedBrands));
      }

      const providerUpper = (formData.provider || 'S/D').toUpperCase();
      if (providerUpper !== 'S/D' && !providers.some(p => p.name === providerUpper)) {
          const newProvider = { id: `prov-${Date.now()}`, name: providerUpper, balance: 0, cuit: '', contact: '', defaultDiscounts: [0,0,0] } as Provider;
          const updatedProviders = [...providers, newProvider];
          setProviders(updatedProviders);
          localStorage.setItem('ferrecloud_providers', JSON.stringify(updatedProviders));
      }

      const productToSave: Product = {
          ...formData,
          id: formData.id || `PROD-${Date.now()}`,
          name: formData.name.toUpperCase(),
          brand: brandUpper,
          category: (formData.category || 'GENERAL').toUpperCase(),
          provider: providerUpper,
          internalCodes: formData.internalCodes?.filter(c => c.trim() !== '') || [''],
          barcodes: formData.barcodes?.filter(c => c.trim() !== '') || [],
          providerCodes: formData.providerCodes?.filter(c => c.trim() !== '') || [],
          purchasePackageQuantity: parseFloat(formData.purchasePackageQuantity as any) || 1,
          salePackageQuantity: parseFloat(formData.salePackageQuantity as any) || 1,
          stock: (parseFloat(formData.stockPrincipal as any) || 0) + (parseFloat(formData.stockDeposito as any) || 0) + (parseFloat(formData.stockSucursal as any) || 0)
      } as Product;

      await productDB.save(productToSave);
      setIsModalOpen(false);
      await loadProducts();
      setIsLoading(false);
  };

  return (
    <div className="p-4 h-full flex flex-col space-y-4 bg-slate-100 overflow-hidden font-sans">
      {/* HEADER */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm shrink-0 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-900 text-indigo-400 rounded-2xl shadow-lg"><BoxesIcon size={24}/></div>
              <div>
                  <h2 className="text-xl font-black uppercase tracking-tighter">Maestro de Artículos</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Database size={10} className="text-indigo-500" />
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Base de Datos: <span className="text-indigo-600">{totalCount.toLocaleString()} registros</span></p>
                  </div>
              </div>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setInventoryTab('PRODUCTS')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${inventoryTab === 'PRODUCTS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>Stock</button>
              <button onClick={() => setInventoryTab('IMPORT')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${inventoryTab === 'IMPORT' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>Importar Excel</button>
          </div>
          <div className="flex gap-2">
            <button 
                onClick={() => setInventoryTab('IMPORT')}
                className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2">
                <DatabaseZap size={16} className="text-indigo-400"/> Importación Inicial
            </button>
            <button onClick={() => { setFormData(initialFormState); setIsModalOpen(true); }} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2">
                <PlusCircle size={16}/> Alta Manual
            </button>
          </div>
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
                                      <th className="px-8 py-5">Código / Artículo</th>
                                      <th className="px-8 py-5">Marca / Rubro</th>
                                      <th className="px-8 py-5 text-center">Stock Total</th>
                                      <th className="px-8 py-5 text-right">Precio Final</th>
                                      <th className="px-8 py-5 text-center">Acciones</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                  {products.map(p => (
                                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                          <td className="px-8 py-4">
                                              <p className="font-black text-slate-800 text-xs uppercase leading-none mb-1.5">{p.name}</p>
                                              <p className="text-[9px] font-mono font-bold text-indigo-600 uppercase tracking-tighter">REF: {p.internalCodes?.[0]}</p>
                                          </td>
                                          <td className="px-8 py-4">
                                              <p className="text-[10px] font-black text-slate-500 uppercase">{p.brand} • {p.category}</p>
                                          </td>
                                          <td className={`px-8 py-4 text-center font-black text-lg tracking-tighter ${p.stock <= (p.reorderPoint || 0) ? 'text-red-500' : 'text-slate-900'}`}>
                                              {p.stock}
                                          </td>
                                          <td className="px-8 py-4 text-right font-black text-slate-900 text-lg tracking-tighter">
                                              ${p.priceFinal?.toLocaleString()}
                                          </td>
                                          <td className="px-8 py-4 text-center">
                                              <div className="flex justify-center gap-1">
                                                  <button title="Vender ahora" onClick={() => { window.dispatchEvent(new CustomEvent('ferrecloud_add_to_pos', { detail: { product: p } })); }} className="p-2 text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"><ShoppingCart size={15}/></button>
                                                  <button title="Añadir a Reposición" onClick={() => handleAddToReplenishment(p)} className="p-2 text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><Truck size={15}/></button>
                                                  <button title="Editar Ficha" onClick={() => { setFormData(p); setIsModalOpen(true); }} className="p-2 text-slate-400 bg-slate-50 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"><Pen size={15}/></button>
                                                  <button title="Eliminar Definitivamente" onClick={() => handleDeleteProduct(p.id, p.name)} className="p-2 text-red-400 bg-red-50 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"><Trash2 size={15}/></button>
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

      {/* MODAL FICHA TÉCNICA (Se mantiene la estructura existente con los campos mapeados) */}
      {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh]">
                  <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-5">
                          <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg"><PackagePlus size={28}/></div>
                          <div>
                              <h3 className="text-xl font-black uppercase tracking-tighter leading-none">{formData.id ? 'Editar Artículo Maestro' : 'Nuevo Artículo'}</h3>
                              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Gestión Técnica de Inventario</p>
                          </div>
                      </div>
                      <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={32}/></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50 custom-scrollbar">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                          {/* COLUMNA IDENTIDAD */}
                          <div className="lg:col-span-8 space-y-6">
                              <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                                  <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b pb-4 flex items-center gap-2"><Tag size={14}/> Datos Identificatorios</h4>
                                  <div className="space-y-4">
                                      <div>
                                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-1">Nombre Comercial / Descripción del Producto</label>
                                          <input type="text" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black text-lg focus:bg-white focus:border-indigo-500 uppercase transition-all" value={formData.name} onChange={e => updateField('name', e.target.value)} />
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                          <div>
                                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-1">Marca</label>
                                              <input type="text" className="w-full p-3 bg-slate-50 border-2 border-transparent rounded-xl font-bold uppercase" value={formData.brand} onChange={e => updateField('brand', e.target.value)} />
                                          </div>
                                          <div>
                                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-1">Categoría / Rubro</label>
                                              <input type="text" className="w-full p-3 bg-slate-50 border-2 border-transparent rounded-xl font-bold uppercase" value={formData.category} onChange={e => updateField('category', e.target.value)} />
                                          </div>
                                          <div>
                                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-1">Proveedor Principal</label>
                                              <input type="text" className="w-full p-3 bg-slate-50 border-2 border-transparent rounded-xl font-bold uppercase" value={formData.provider} onChange={e => updateField('provider', e.target.value)} />
                                          </div>
                                      </div>
                                  </div>
                              </div>

                              {/* PANEL CODIGOS */}
                              <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                                  <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b pb-4 flex items-center gap-2"><Barcode size={14}/> Codificación y Trazabilidad</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                                      <div className="space-y-3">
                                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Códigos Propios (SKU)</p>
                                          {formData.internalCodes?.map((c, i) => (
                                              <div key={i} className="flex gap-1">
                                                  <input className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-mono font-bold" value={c} onChange={e => updateArrayField('internalCodes', i, e.target.value)} />
                                                  <button onClick={() => removeArrayItem('internalCodes', i)} className="p-1 text-red-300 hover:text-red-500"><X size={14}/></button>
                                              </div>
                                          ))}
                                          <button onClick={() => addArrayItem('internalCodes')} className="text-[8px] font-black text-indigo-500 uppercase hover:underline">+ Agregar SKU</button>
                                      </div>
                                      <div className="space-y-3">
                                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Códigos de Barras (EAN)</p>
                                          {formData.barcodes?.map((c, i) => (
                                              <div key={i} className="flex gap-1">
                                                  <input className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-mono font-bold" value={c} onChange={e => updateArrayField('barcodes', i, e.target.value)} />
                                                  <button onClick={() => removeArrayItem('barcodes', i)} className="p-1 text-red-300 hover:text-red-500"><X size={14}/></button>
                                              </div>
                                          ))}
                                          <button onClick={() => addArrayItem('barcodes')} className="text-[8px] font-black text-indigo-500 uppercase hover:underline">+ Agregar EAN</button>
                                      </div>
                                      <div className="space-y-3">
                                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Códigos Proveedor</p>
                                          {formData.providerCodes?.map((c, i) => (
                                              <div key={i} className="flex gap-1">
                                                  <input className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-mono font-bold" value={c} onChange={e => updateArrayField('providerCodes', i, e.target.value)} />
                                                  <button onClick={() => removeArrayItem('providerCodes', i)} className="p-1 text-red-300 hover:text-red-500"><X size={14}/></button>
                                              </div>
                                          ))}
                                          <button onClick={() => addArrayItem('providerCodes')} className="text-[8px] font-black text-indigo-500 uppercase hover:underline">+ Agregar Cód. Prov.</button>
                                      </div>
                                  </div>
                              </div>
                          </div>

                          {/* COLUMNA ECONOMICA Y STOCK */}
                          <div className="lg:col-span-4 space-y-6">
                              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl space-y-8">
                                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-white/10 pb-4">Costos y Precios</h4>
                                  <div className="space-y-6">
                                      <div>
                                          <label className="text-[9px] font-black text-slate-500 uppercase ml-2 block mb-1">Costo de Lista ($)</label>
                                          <input type="number" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-black text-2xl text-white outline-none focus:ring-2 focus:ring-indigo-600" value={formData.listCost || ''} onChange={e => updateField('listCost', e.target.value)} />
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                          <div>
                                              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 block mb-1">Margen (%)</label>
                                              <input type="number" className="w-full p-3 bg-white/5 border border-white/10 rounded-xl font-black text-white" value={formData.profitMargin || ''} onChange={e => updateField('profitMargin', e.target.value)} />
                                          </div>
                                          <div>
                                              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 block mb-1">IVA (%)</label>
                                              <select className="w-full p-3 bg-white/5 border border-white/10 rounded-xl font-black text-white" value={formData.vatRate} onChange={e => updateField('vatRate', e.target.value)}>
                                                  <option value="21">21%</option>
                                                  <option value="10.5">10.5%</option>
                                                  <option value="0">0% (Exento)</option>
                                              </select>
                                          </div>
                                      </div>
                                      <div className="pt-6 border-t border-white/10">
                                          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1 text-center">Precio de Venta Final</p>
                                          <p className="text-5xl font-black text-center tracking-tighter text-white leading-none">${formData.priceFinal?.toLocaleString()}</p>
                                      </div>
                                  </div>
                              </div>

                              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b pb-4 flex items-center gap-2"><RefreshCw size={14}/> Existencias</h4>
                                  <div className="grid grid-cols-2 gap-4">
                                      <div>
                                          <label className="text-[8px] font-black text-slate-400 uppercase ml-1 block mb-1">Mostrador</label>
                                          <input type="number" className="w-full p-2.5 bg-slate-50 border rounded-xl font-black text-slate-800" value={formData.stockPrincipal || ''} onChange={e => updateField('stockPrincipal', e.target.value)} />
                                      </div>
                                      <div>
                                          <label className="text-[8px] font-black text-slate-400 uppercase ml-1 block mb-1">Depósito</label>
                                          <input type="number" className="w-full p-2.5 bg-slate-50 border rounded-xl font-black text-slate-800" value={formData.stockDeposito || ''} onChange={e => updateField('stockDeposito', e.target.value)} />
                                      </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                      <div>
                                          <label className="text-[8px] font-black text-red-400 uppercase ml-1 block mb-1">Mínimo (Alerta)</label>
                                          <input type="number" className="w-full p-2.5 bg-red-50/50 border border-red-100 rounded-xl font-black text-red-600" value={formData.stockMinimo || ''} onChange={e => updateField('stockMinimo', e.target.value)} />
                                      </div>
                                      <div>
                                          <label className="text-[8px] font-black text-indigo-400 uppercase ml-1 block mb-1">Pto. Pedido</label>
                                          <input type="number" className="w-full p-2.5 bg-indigo-50/50 border border-indigo-100 rounded-xl font-black text-indigo-600" value={formData.reorderPoint || ''} onChange={e => updateField('reorderPoint', e.target.value)} />
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="p-8 bg-white border-t border-slate-100 flex justify-end gap-4 shrink-0">
                      <button onClick={() => setIsModalOpen(false)} className="px-8 py-3 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors">Cancelar</button>
                      <button onClick={handleSaveProduct} disabled={isLoading} className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl flex items-center gap-3 hover:bg-indigo-600 transition-all active:scale-95">
                          {isLoading ? <RefreshCw className="animate-spin" size={18}/> : <Save size={18}/>} Guardar Ficha Maestra
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Inventory;
