
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Search, Plus, Package, X, Save, Globe, DollarSign, 
    Barcode, Pen, Trash2, Tag, Truck, Layers, Info, 
    Percent, Building2, Store, Activity, ChevronRight,
    AlertCircle, LayoutGrid, Database, Calculator
} from 'lucide-react';
import { Product, ProductStock } from '../types';

const Inventory: React.FC = () => {
  const initialProduct: Product = {
    id: '', internalCode: '', barcodes: [], providerCodes: [],
    name: '', brand: '', provider: '', description: '', category: 'General',
    measureUnitSale: 'Unidad', measureUnitPurchase: 'Unidad', conversionFactor: 1,
    purchaseCurrency: 'ARS', saleCurrency: 'ARS', vatRate: 21.0,
    listCost: 0, discounts: [0,0,0,0], costAfterDiscounts: 0, profitMargin: 30,
    priceNeto: 0, priceFinal: 0, stock: 0, 
    stockDetails: [],
    minStock: 0, desiredStock: 0, reorderPoint: 0, location: '',
    ecommerce: { mercadoLibre: false, tiendaNube: false, webPropia: false }
  };

  const [products, setProducts] = useState<Product[]>(() => {
      const saved = localStorage.getItem('ferrecloud_products');
      return saved ? JSON.parse(saved) : [];
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Product>(initialProduct);
  const [modalTab, setModalTab] = useState<'GENERAL' | 'PRICING' | 'STOCK'>('GENERAL');
  
  // Persistencia
  useEffect(() => {
    localStorage.setItem('ferrecloud_products', JSON.stringify(products));
  }, [products]);

  // Cálculos automáticos de costos y precios
  useEffect(() => {
    let cost = Number(formData.listCost) || 0;
    formData.discounts.forEach(d => {
        if (d > 0) cost = cost * (1 - d / 100);
    });
    const priceNeto = cost * (1 + (Number(formData.profitMargin) || 0) / 100);
    const priceFinal = priceNeto * (1 + (Number(formData.vatRate) || 0) / 100);

    setFormData(prev => ({
        ...prev,
        costAfterDiscounts: parseFloat(cost.toFixed(2)),
        priceNeto: parseFloat(priceNeto.toFixed(2)),
        priceFinal: parseFloat(priceFinal.toFixed(2))
    }));
  }, [formData.listCost, formData.discounts, formData.profitMargin, formData.vatRate]);

  const handleSaveProduct = () => {
    if (!formData.name || !formData.internalCode) {
        alert("Faltan datos obligatorios: Descripción y SKU Interno.");
        return;
    }

    const totalStock = formData.stockDetails.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
    const finalProduct = { ...formData, stock: totalStock };

    setProducts(prev => {
        const existingIndex = prev.findIndex(p => p.id === finalProduct.id);
        if (existingIndex >= 0) {
            const newProducts = [...prev];
            newProducts[existingIndex] = finalProduct;
            return newProducts;
        } else {
            return [finalProduct, ...prev];
        }
    });
    setIsModalOpen(false);
  };

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return products.filter(p => 
        p.name.toLowerCase().includes(term) || 
        p.internalCode.toLowerCase().includes(term) ||
        p.provider.toLowerCase().includes(term) ||
        p.brand.toLowerCase().includes(term)
    );
  }, [searchTerm, products]);

  const updateDiscount = (index: number, value: number) => {
    const newDiscounts = [...formData.discounts] as [number, number, number, number];
    newDiscounts[index] = value;
    setFormData({ ...formData, discounts: newDiscounts });
  };

  return (
    <div className="p-4 h-full flex flex-col max-w-full mx-auto space-y-3 bg-slate-50 overflow-hidden">
      {/* Header Compacto */}
      <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
          <div>
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                  <Database size={18} className="text-indigo-600"/> Catálogo de Artículos
              </h2>
              <p className="text-gray-400 font-bold text-[9px] uppercase tracking-widest">{products.length} REGISTROS ACTIVOS</p>
          </div>
          <button 
            onClick={() => { setFormData({...initialProduct, id: Date.now().toString()}); setModalTab('GENERAL'); setIsModalOpen(true); }} 
            className="bg-slate-900 text-white px-5 py-2 rounded-lg font-black shadow-lg flex items-center gap-2 transition-all uppercase text-[10px] tracking-widest hover:bg-slate-800 active:scale-95"
          >
              <Plus size={14} /> Alta de Artículo
          </button>
      </div>

      {/* Buscador Profesional */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-600 transition-colors" size={16} />
                <input 
                    type="text" 
                    placeholder="Búsqueda rápida por SKU, Descripción, Marca o Proveedor..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-transparent rounded-lg text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-100 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
      </div>

      {/* Tabla Densa de Datos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-900 sticky top-0 z-20 text-[9px] uppercase font-black text-slate-300 tracking-wider">
                    <tr>
                        <th className="px-4 py-3 border-r border-slate-800">Código SKU</th>
                        <th className="px-4 py-3 border-r border-slate-800">Descripción del Artículo</th>
                        <th className="px-4 py-3 border-r border-slate-800">Marca / Prov.</th>
                        <th className="px-4 py-3 text-right border-r border-slate-800">Stock</th>
                        <th className="px-4 py-3 text-right border-r border-slate-800">Costo Rep.</th>
                        <th className="px-4 py-3 text-right border-r border-slate-800">P. Venta Final</th>
                        <th className="px-4 py-3 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-[11px]">
                    {filteredProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="px-4 py-2.5 font-mono font-bold text-slate-500">{product.internalCode}</td>
                            <td className="px-4 py-2.5 font-black text-slate-800 uppercase leading-tight">{product.name}</td>
                            <td className="px-4 py-2.5">
                                <p className="text-gray-400 font-bold uppercase text-[9px]">{product.brand}</p>
                                <p className="text-slate-500 font-bold uppercase text-[9px]">{product.provider}</p>
                            </td>
                            <td className={`px-4 py-2.5 text-right font-black ${product.stock <= product.minStock ? 'text-red-600 bg-red-50/50' : 'text-slate-700'}`}>
                                {product.stock}
                            </td>
                            <td className="px-4 py-2.5 text-right font-bold text-slate-400">
                                ${product.costAfterDiscounts?.toLocaleString('es-AR')}
                            </td>
                            <td className="px-4 py-2.5 text-right font-black text-slate-900 bg-indigo-50/20">
                                ${product.priceFinal.toLocaleString('es-AR')}
                            </td>
                            <td className="px-4 py-2.5">
                                <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setFormData(product); setModalTab('GENERAL'); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all"><Pen size={14} /></button>
                                    <button onClick={() => setProducts(products.filter(p => p.id !== product.id))} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"><Trash2 size={14} /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {filteredProducts.length === 0 && (
                        <tr><td colSpan={7} className="py-20 text-center text-gray-400 italic">No se encontraron artículos con el criterio de búsqueda.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* Modal Técnico de Edición/Alta */}
      {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
                  <div className="p-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-3">
                          <Package size={20} className="text-indigo-400"/>
                          <h3 className="text-sm font-black uppercase tracking-widest">{formData.id ? 'Ficha Técnica: ' + formData.internalCode : 'Nuevo Ingreso al Sistema'}</h3>
                      </div>
                      <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors"><X size={20} /></button>
                  </div>

                  {/* Tabs del Modal */}
                  <div className="flex bg-slate-100 p-1 gap-1 border-b border-gray-200 shrink-0">
                      {[
                          { id: 'GENERAL', label: 'Datos Básicos', icon: Info },
                          { id: 'PRICING', label: 'Costos y Precios', icon: Calculator },
                          { id: 'STOCK', label: 'Stock / Sucursales', icon: Layers }
                      ].map(tab => (
                          <button 
                            key={tab.id} 
                            onClick={() => setModalTab(tab.id as any)} 
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${modalTab === tab.id ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-gray-400 hover:text-slate-600'}`}
                          >
                              <tab.icon size={14}/> {tab.label}
                          </button>
                      ))}
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">
                      {modalTab === 'GENERAL' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                              <div className="md:col-span-2">
                                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest">Descripción del Artículo</label>
                                  <input 
                                    className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 font-bold text-xs uppercase outline-none" 
                                    value={formData.name} 
                                    onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})}
                                    placeholder="EJ: TALADRO PERCUTOR BOSCH 13MM 600W"
                                  />
                              </div>
                              <div>
                                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest">SKU Interno / Código</label>
                                  <input className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 font-bold text-xs uppercase outline-none" value={formData.internalCode} onChange={e => setFormData({...formData, internalCode: e.target.value.toUpperCase()})}/>
                              </div>
                              <div>
                                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest">Marca</label>
                                  <input className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 font-bold text-xs uppercase outline-none" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value.toUpperCase()})}/>
                              </div>
                              <div>
                                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest">Proveedor</label>
                                  <input className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 font-bold text-xs uppercase outline-none" value={formData.provider} onChange={e => setFormData({...formData, provider: e.target.value.toUpperCase()})}/>
                              </div>
                              <div>
                                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest">Categoría</label>
                                  <input className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 font-bold text-xs uppercase outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value.toUpperCase()})}/>
                              </div>
                          </div>
                      )}

                      {modalTab === 'PRICING' && (
                          <div className="space-y-6 animate-fade-in">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="bg-slate-50 p-4 rounded-xl border border-gray-200 space-y-4">
                                      <div>
                                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest">Costo de Lista (Bruto)</label>
                                          <div className="relative">
                                              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-slate-400">$</span>
                                              <input type="number" className="w-full pl-8 p-2.5 border border-gray-200 rounded-lg font-black text-lg text-red-600 outline-none" value={formData.listCost} onChange={e => setFormData({...formData, listCost: parseFloat(e.target.value) || 0})}/>
                                          </div>
                                      </div>
                                      <div>
                                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Descuentos Proveedor (%)</label>
                                          <div className="grid grid-cols-4 gap-2">
                                              {formData.discounts.map((d, i) => (
                                                  <div key={i} className="relative">
                                                      <input type="number" className="w-full p-2 border border-gray-200 rounded text-center font-bold text-xs bg-white" value={d} onChange={e => updateDiscount(i, parseFloat(e.target.value) || 0)}/>
                                                      <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] text-gray-300">%</span>
                                                  </div>
                                              ))}
                                          </div>
                                      </div>
                                      <div className="pt-2 border-t border-dashed border-gray-300">
                                          <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-500">
                                              <span>Costo Final Neto:</span>
                                              <span className="text-sm text-slate-800">${formData.costAfterDiscounts.toLocaleString('es-AR')}</span>
                                          </div>
                                      </div>
                                  </div>

                                  <div className="bg-indigo-900 p-4 rounded-xl text-white space-y-4 shadow-xl">
                                      <div>
                                          <label className="block text-[10px] font-black text-indigo-300 uppercase mb-1 tracking-widest">Margen de Utilidad (%)</label>
                                          <input type="number" className="w-full p-2.5 bg-white/10 border border-white/20 rounded-lg font-black text-lg text-white outline-none" value={formData.profitMargin} onChange={e => setFormData({...formData, profitMargin: parseFloat(e.target.value) || 0})}/>
                                      </div>
                                      <div>
                                          <label className="block text-[10px] font-black text-indigo-300 uppercase mb-1 tracking-widest">Alicuota IVA (%)</label>
                                          <select className="w-full p-2.5 bg-white/10 border border-white/20 rounded-lg font-black text-xs text-white outline-none" value={formData.vatRate} onChange={e => setFormData({...formData, vatRate: parseFloat(e.target.value) as any})}>
                                              <option className="bg-slate-800" value={21}>21.0% (General)</option>
                                              <option className="bg-slate-800" value={10.5}>10.5% (Reducido)</option>
                                              <option className="bg-slate-800" value={27}>27.0% (Especial)</option>
                                              <option className="bg-slate-800" value={0}>0.0% (Exento)</option>
                                          </select>
                                      </div>
                                      <div className="pt-4 mt-2 border-t border-indigo-500/50">
                                          <label className="block text-[10px] font-black text-indigo-200 uppercase mb-1 tracking-widest text-right">Precio de Venta al Público</label>
                                          <p className="text-4xl font-black text-right tracking-tighter leading-none text-indigo-400">
                                              <span className="text-lg mr-1">$</span>
                                              {formData.priceFinal.toLocaleString('es-AR')}
                                          </p>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}

                      {modalTab === 'STOCK' && (
                          <div className="space-y-4 animate-fade-in">
                              <div className="grid grid-cols-3 gap-4 mb-6">
                                  <div className="bg-slate-50 p-3 rounded-lg border">
                                      <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Mínimo Crítico</label>
                                      <input type="number" className="w-full p-2 bg-white border border-gray-200 rounded font-black text-xs" value={formData.minStock} onChange={e => setFormData({...formData, minStock: parseInt(e.target.value) || 0})}/>
                                  </div>
                                  <div className="bg-slate-50 p-3 rounded-lg border">
                                      <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Punto Reposición</label>
                                      <input type="number" className="w-full p-2 bg-white border border-gray-200 rounded font-black text-xs" value={formData.reorderPoint} onChange={e => setFormData({...formData, reorderPoint: parseInt(e.target.value) || 0})}/>
                                  </div>
                                  <div className="bg-slate-50 p-3 rounded-lg border">
                                      <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Stock Objetivo</label>
                                      <input type="number" className="w-full p-2 bg-white border border-gray-200 rounded font-black text-xs" value={formData.desiredStock} onChange={e => setFormData({...formData, desiredStock: parseInt(e.target.value) || 0})}/>
                                  </div>
                              </div>
                              
                              <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest border-b pb-2 mb-3">Desglose por Sucursal / Depósito</h4>
                              <div className="space-y-2">
                                  {[
                                      { id: '1', name: 'Casa Central' },
                                      { id: '2', name: 'Depósito Norte' },
                                      { id: '3', name: 'E-commerce' }
                                  ].map(branch => {
                                      const current = formData.stockDetails.find(s => s.branchId === branch.id);
                                      return (
                                          <div key={branch.id} className="flex items-center justify-between p-3 bg-slate-50 border rounded-lg hover:border-indigo-200 transition-colors">
                                              <span className="text-xs font-bold text-slate-600 uppercase">{branch.name}</span>
                                              <input 
                                                type="number" 
                                                placeholder="0" 
                                                className="w-32 p-2 border border-gray-200 rounded font-black text-right text-xs bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                                value={current?.quantity || ''}
                                                onChange={e => {
                                                    const val = parseInt(e.target.value) || 0;
                                                    const details = [...formData.stockDetails];
                                                    const idx = details.findIndex(s => s.branchId === branch.id);
                                                    if (idx >= 0) details[idx].quantity = val;
                                                    else details.push({ branchId: branch.id, branchName: branch.name, quantity: val });
                                                    setFormData({...formData, stockDetails: details});
                                                }}
                                              />
                                          </div>
                                      )
                                  })}
                              </div>
                          </div>
                      )}
                  </div>

                  <div className="p-4 border-t border-gray-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                      <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-gray-600 transition-colors">Cancelar</button>
                      <button onClick={handleSaveProduct} className="bg-slate-900 text-white px-8 py-2.5 rounded-lg font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-slate-800 flex items-center gap-2 active:scale-95 transition-all">
                          <Save size={14}/> Registrar Cambios
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Inventory;
