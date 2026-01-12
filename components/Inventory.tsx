
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Search, Plus, Package, X, Save, 
    Barcode, Pen, Trash2, Tag, Layers, RefreshCw, 
    Truck, PlusCircle, CheckCircle, Hash,
    Boxes as BoxesIcon, PackagePlus, ShoppingCart, AlertCircle, Database,
    Calculator, MapPin, Percent, DollarSign,
    // Added missing TrendingUp and Zap icons to resolve errors on lines 337 and 358
    TrendingUp, Zap
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

  // ESTADO DEL FORMULARIO COMPLETO
  const [formData, setFormData] = useState<Partial<Product>>({
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
      stockMinimo: 0,
      stockMaximo: 0,
      priceFinal: 0
  });

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

  // LÓGICA DE CÁLCULO DE PRECIOS
  const calculatePrices = (data: Partial<Product>) => {
      const list = data.listCost || 0;
      const d = data.discounts || [0, 0, 0, 0];
      // Aplicar cadena de descuentos: Costo * (1-d1) * (1-d2)...
      const coef = (1 - (d[0] || 0)/100) * (1 - (d[1] || 0)/100) * (1 - (d[2] || 0)/100) * (1 - (d[3] || 0)/100);
      const netCost = list * coef;
      const margin = data.profitMargin || 0;
      const priceNeto = netCost * (1 + margin/100);
      const vat = data.vatRate || 21;
      const final = priceNeto * (1 + vat/100);

      return {
          costAfterDiscounts: parseFloat(netCost.toFixed(4)),
          priceNeto: parseFloat(priceNeto.toFixed(2)),
          priceFinal: parseFloat(final.toFixed(2))
      };
  };

  const updateField = (field: keyof Product | 'd0' | 'd1' | 'd2' | 'd3', value: any) => {
      setFormData(prev => {
          let next = { ...prev };
          
          if (field.toString().startsWith('d')) {
              const idx = parseInt(field.toString().charAt(1));
              const newDiscounts = [...(prev.discounts || [0,0,0,0])];
              newDiscounts[idx] = parseFloat(value) || 0;
              next.discounts = newDiscounts;
          } else {
              (next as any)[field] = value;
          }

          // Recalcular precios si cambian costos o márgenes
          const updates = calculatePrices(next);
          return { ...next, ...updates };
      });
  };

  const handleSaveProduct = async () => {
      if (!formData.name || !formData.internalCodes?.[0]) {
          alert("El nombre y el código interno son obligatorios.");
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
          location: (formData.location || '').toUpperCase(),
          stock: (formData.stockPrincipal || 0) + (formData.stockDeposito || 0),
          stockSucursal: formData.stockSucursal || 0,
          stockDetails: formData.stockDetails || [],
          internalCodes: formData.internalCodes || [''],
          barcodes: formData.barcodes || [''],
          providerCodes: formData.providerCodes || [''],
          isCombo: formData.isCombo || false,
          comboItems: formData.comboItems || [],
          purchaseCurrency: 'ARS',
          saleCurrency: 'ARS',
          ecommerce: formData.ecommerce || { isPublished: false }
      } as Product;

      await productDB.save(productToSave);
      setIsModalOpen(false);
      await loadProducts();
      setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
      if (confirm('¿Eliminar este artículo del catálogo maestro?')) {
          // Implementación de borrado en storageService si fuera necesario
          alert("Funcionalidad de borrado físico protegida en esta versión.");
      }
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
          <button onClick={() => { setFormData({name: '', internalCodes:[''], barcodes:[''], providerCodes:[''], listCost:0, discounts:[0,0,0,0], profitMargin:30, vatRate:21, stockPrincipal:0, stockDeposito:0, stockMinimo:0, stockMaximo:0, brand:'', category:'', provider:'', location:''}); setIsModalOpen(true); }} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2">
              <PlusCircle size={16}/> Alta de Artículo
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
                                              <div className="flex justify-center gap-2">
                                                  <button onClick={() => { window.dispatchEvent(new CustomEvent('ferrecloud_add_to_pos', { detail: { product: p } })); }} className="p-2 text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"><ShoppingCart size={16}/></button>
                                                  <button onClick={() => { setFormData(p); setIsModalOpen(true); }} className="p-2 text-slate-400 bg-slate-50 rounded-xl hover:bg-slate-900 hover:text-white transition-all"><Pen size={16}/></button>
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

      {/* MODAL FICHA TÉCNICA PRO */}
      {isModalOpen && (
          <div className="fixed inset-0 z-[300] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[95vh]">
                  <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg"><Package size={24}/></div>
                          <div>
                              <h3 className="text-xl font-black uppercase tracking-tighter leading-none">Ficha Maestra de Artículo</h3>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gestión Técnica y Comercial</p>
                          </div>
                      </div>
                      <button onClick={() => setIsModalOpen(false)}><X size={28}/></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50 custom-scrollbar space-y-8">
                      {/* SECCION 1: IDENTIFICACION */}
                      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                          <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b pb-3 flex items-center gap-2"><Tag size={14}/> Identificación y Clasificación</h4>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                              <div className="md:col-span-2">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">Descripción Comercial</label>
                                  <input className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black text-sm uppercase focus:bg-white focus:border-indigo-500 outline-none transition-all" value={formData.name} onChange={e => updateField('name', e.target.value)} />
                              </div>
                              <div>
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">Marca</label>
                                  <input className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black text-sm uppercase focus:bg-white focus:border-indigo-500 outline-none transition-all" value={formData.brand} onChange={e => updateField('brand', e.target.value)} />
                              </div>
                              <div>
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">Rubro / Categoría</label>
                                  <input className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black text-sm uppercase focus:bg-white focus:border-indigo-500 outline-none transition-all" value={formData.category} onChange={e => updateField('category', e.target.value)} />
                              </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div>
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-1">Proveedor Principal</label>
                                  <input className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black text-sm uppercase focus:bg-white focus:border-indigo-500 outline-none transition-all" value={formData.provider} onChange={e => updateField('provider', e.target.value)} />
                              </div>
                              <div className="md:col-span-2">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">Ubicación Física (Ej: Pasillo A, Estante 4)</label>
                                  <div className="relative">
                                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                                      <input className="w-full pl-12 p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black text-sm uppercase focus:bg-white focus:border-indigo-500 outline-none transition-all" value={formData.location} onChange={e => updateField('location', e.target.value)} />
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* SECCION 2: CODIGOS */}
                      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                          <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b pb-3 flex items-center gap-2"><Hash size={14}/> Códigos Cruzados</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Código Propio (SKU)</label>
                                  <input className="w-full p-4 bg-indigo-50/50 border-2 border-transparent rounded-2xl font-mono font-black text-indigo-700 text-sm focus:bg-white focus:border-indigo-500 outline-none" value={formData.internalCodes?.[0]} onChange={e => updateField('internalCodes', [e.target.value])} />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Código de Barras (EAN)</label>
                                  <div className="relative">
                                      <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                                      <input className="w-full pl-12 p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-mono font-black text-sm focus:bg-white focus:border-indigo-500 outline-none" value={formData.barcodes?.[0]} onChange={e => updateField('barcodes', [e.target.value])} />
                                  </div>
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Código de Proveedor</label>
                                  <input className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-mono font-black text-sm focus:bg-white focus:border-indigo-500 outline-none" value={formData.providerCodes?.[0]} onChange={e => updateField('providerCodes', [e.target.value])} />
                              </div>
                          </div>
                      </div>

                      {/* SECCION 3: COSTOS Y DESCUENTOS */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl space-y-6">
                              <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-white/5 pb-3 flex items-center gap-2"><Calculator size={14}/> Estructura de Costos</h4>
                              <div className="space-y-6">
                                  <div>
                                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2 block mb-2">Precio de Lista (Bruto)</label>
                                      <div className="relative">
                                          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={24}/>
                                          <input type="number" className="w-full pl-12 p-5 bg-white/5 border-2 border-white/10 rounded-[1.8rem] font-black text-3xl outline-none focus:border-indigo-500" value={formData.listCost} onChange={e => updateField('listCost', e.target.value)} />
                                      </div>
                                  </div>
                                  <div className="space-y-4">
                                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Cadena de Bonificaciones (%)</label>
                                      <div className="grid grid-cols-4 gap-3">
                                          {[0, 1, 2, 3].map(i => (
                                              <div key={i} className="relative group">
                                                  <input type="number" className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-center font-black text-indigo-400 outline-none focus:bg-white/10 focus:border-indigo-500" value={formData.discounts?.[i]} onChange={e => updateField(`d${i}` as any, e.target.value)} />
                                                  <span className="absolute -top-2 left-2 bg-slate-900 px-1 text-[7px] font-black text-slate-500">DESC {i+1}</span>
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                                  <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                                      <span className="text-[10px] font-black text-slate-500 uppercase">Costo Neto Resultante:</span>
                                      <span className="text-2xl font-black text-indigo-400">${formData.costAfterDiscounts?.toLocaleString()}</span>
                                  </div>
                              </div>
                          </div>

                          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                              <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b pb-3 flex items-center gap-2"><TrendingUp size={14}/> Configuración de Venta</h4>
                              <div className="space-y-6">
                                  <div className="grid grid-cols-2 gap-6">
                                      <div>
                                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-2">Utilidad (%)</label>
                                          <div className="relative">
                                              <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                                              <input type="number" className="w-full pl-12 p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black text-xl text-indigo-600 outline-none focus:bg-white focus:border-indigo-500" value={formData.profitMargin} onChange={e => updateField('profitMargin', e.target.value)} />
                                          </div>
                                      </div>
                                      <div>
                                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-2">Tasa IVA (%)</label>
                                          <select className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black text-xl outline-none focus:bg-white focus:border-indigo-500" value={formData.vatRate} onChange={e => updateField('vatRate', e.target.value)}>
                                              <option value={21}>21.0%</option>
                                              <option value={10.5}>10.5%</option>
                                              <option value={27}>27.0%</option>
                                              <option value={0}>Exento</option>
                                          </select>
                                      </div>
                                  </div>
                                  <div className="bg-indigo-600 p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden">
                                      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none"><Zap size={100}/></div>
                                      <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2 opacity-60">Precio de Venta Final (PVP)</p>
                                      <div className="flex items-center gap-3">
                                          <span className="text-4xl font-black tracking-tighter">$</span>
                                          <input 
                                              type="number" 
                                              className="bg-transparent border-b-4 border-white/20 text-5xl font-black tracking-tighter outline-none focus:border-white w-full transition-all" 
                                              value={formData.priceFinal}
                                              onChange={e => {
                                                  const val = parseFloat(e.target.value) || 0;
                                                  // Si cambia el precio final manualmente, calculamos el margen hacia atrás
                                                  const netCost = formData.costAfterDiscounts || 1;
                                                  const priceNeto = val / (1 + (formData.vatRate || 21) / 100);
                                                  const newMargin = ((priceNeto - netCost) / netCost) * 100;
                                                  setFormData({...formData, priceFinal: val, priceNeto: parseFloat(priceNeto.toFixed(2)), profitMargin: parseFloat(newMargin.toFixed(2))});
                                              }}
                                          />
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* SECCION 4: STOCKS */}
                      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                          <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b pb-3 flex items-center gap-2"><BoxesIcon size={14}/> Gestión de Inventario</h4>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-2">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block text-center">Mínimo (Alerta)</label>
                                  <input type="number" className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-black text-center text-red-500 text-xl shadow-sm" value={formData.stockMinimo} onChange={e => updateField('stockMinimo', e.target.value)} />
                              </div>
                              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-2">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block text-center">Máximo (Deseado)</label>
                                  <input type="number" className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-black text-center text-indigo-600 text-xl shadow-sm" value={formData.stockMaximo} onChange={e => updateField('stockMaximo', e.target.value)} />
                              </div>
                              <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 space-y-2">
                                  <label className="text-[9px] font-black text-indigo-600 uppercase tracking-widest block text-center">Stock Local</label>
                                  <input type="number" className="w-full p-4 bg-white border border-indigo-200 rounded-2xl font-black text-center text-slate-900 text-2xl shadow-sm" value={formData.stockPrincipal} onChange={e => updateField('stockPrincipal', e.target.value)} />
                              </div>
                              <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 space-y-2">
                                  <label className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block text-center">Stock Depósito</label>
                                  <input type="number" className="w-full p-4 bg-white border border-emerald-200 rounded-2xl font-black text-center text-slate-900 text-2xl shadow-sm" value={formData.stockDeposito} onChange={e => updateField('stockDeposito', e.target.value)} />
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="p-8 border-t bg-white flex justify-between items-center shrink-0">
                      <button onClick={() => setIsModalOpen(false)} className="px-10 py-4 font-black uppercase text-[11px] text-slate-400 hover:text-slate-600 tracking-widest transition-all">Descartar</button>
                      <button onClick={handleSaveProduct} className="bg-slate-900 text-white px-20 py-5 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:bg-indigo-600 transition-all active:scale-95 flex items-center justify-center gap-3">
                          <Save size={20}/> Guardar Artículo Maestro
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Inventory;
