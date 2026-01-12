
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Search, Plus, Package, X, Save, 
    Barcode, Pen, Trash2, Tag, Layers, RefreshCw, 
    Truck, PlusCircle, CheckCircle, Hash,
    Boxes as BoxesIcon, PackagePlus, ShoppingCart
} from 'lucide-react';
import { Product, Provider, Brand, Category } from '../types';
import { productDB, addToReplenishmentQueue } from '../services/storageService';
import InitialImport from './InitialImport';

const Inventory: React.FC = () => {
  const [inventoryTab, setInventoryTab] = useState<'PRODUCTS' | 'IMPORT' | 'PROVIDERS'>('PRODUCTS');
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>({});

  const loadProducts = async () => {
      setIsLoading(true);
      try {
          if (searchTerm.trim().length > 2) {
              const results = await productDB.search(searchTerm);
              setProducts(results);
          } else {
              // Carga inicial optimizada (primeros 100)
              const initial = await productDB.getAll(100);
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
    return () => window.removeEventListener('ferrecloud_sync_pulse', handleSync);
  }, [searchTerm]);

  const handleSaveProduct = async () => {
      if (!formData.name) return;
      setIsLoading(true);
      const productToSave: Product = {
          ...formData,
          id: formData.id || `PROD-${Date.now()}`,
          name: formData.name.toUpperCase(),
          stock: (formData.stockPrincipal || 0) + (formData.stockDeposito || 0)
      } as Product;

      await productDB.save(productToSave);
      setIsModalOpen(false);
      await loadProducts();
      setIsLoading(false);
  };

  return (
    <div className="p-4 h-full flex flex-col space-y-4 bg-slate-100 overflow-hidden">
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm shrink-0 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-900 text-indigo-400 rounded-2xl shadow-lg"><BoxesIcon size={24}/></div>
              <div>
                  <h2 className="text-xl font-black uppercase tracking-tighter">Maestro de Artículos</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Base de Datos de Alta Escala</p>
              </div>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setInventoryTab('PRODUCTS')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${inventoryTab === 'PRODUCTS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Stock</button>
              <button onClick={() => setInventoryTab('IMPORT')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${inventoryTab === 'IMPORT' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Importar</button>
          </div>
          <button onClick={() => { setFormData({name: '', internalCodes:[''], listCost:0, profitMargin:30, vatRate:21, stockPrincipal:0, stockDeposito:0}); setIsModalOpen(true); }} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2">
              <PlusCircle size={16}/> Nuevo Producto
          </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
          {inventoryTab === 'PRODUCTS' && (
              <div className="h-full flex flex-col space-y-4">
                  <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm shrink-0 relative group">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={20}/>
                      <input 
                        type="text" 
                        placeholder="BUSCAR EN 140,000 ARTÍCULOS (Nombre, SKU, Marca...)" 
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
                                      <th className="px-8 py-5">SKU / Artículo</th>
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
                                              <p className="text-[9px] font-mono font-bold text-indigo-600 uppercase tracking-tighter">REF: {p.internalCodes[0]}</p>
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
                                          <td className="px-8 py-4">
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
          )}
          {inventoryTab === 'IMPORT' && <InitialImport onComplete={() => setInventoryTab('PRODUCTS')} />}
      </div>

      {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col">
                  <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg"><Package size={24}/></div>
                          <h3 className="text-xl font-black uppercase tracking-tighter">Ficha Técnica de Artículo</h3>
                      </div>
                      <button onClick={() => setIsModalOpen(false)}><X size={28}/></button>
                  </div>
                  <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50/50">
                      <div className="space-y-4">
                          <div>
                              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Descripción Larga</label>
                              <input className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-black text-slate-800 uppercase focus:border-indigo-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                               <div>
                                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Costo Lista ($)</label>
                                  <input type="number" className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-black text-xl text-indigo-600" value={formData.listCost} onChange={e => setFormData({...formData, listCost: parseFloat(e.target.value) || 0})} />
                              </div>
                              <div>
                                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Margen (%)</label>
                                  <input type="number" className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-black text-xl text-emerald-600" value={formData.profitMargin} onChange={e => setFormData({...formData, profitMargin: parseFloat(e.target.value) || 0})} />
                              </div>
                          </div>
                      </div>
                      <div className="space-y-4 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-inner">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-4 flex items-center gap-2"><Hash size={14}/> Existencias</h4>
                          <div className="grid grid-cols-2 gap-6 pt-2">
                              <div>
                                  <label className="block text-[8px] font-black text-slate-500 uppercase mb-2">Stock Mostrador</label>
                                  <input type="number" className="w-full p-3 bg-slate-50 border rounded-xl font-black text-center" value={formData.stockPrincipal} onChange={e => setFormData({...formData, stockPrincipal: parseInt(e.target.value) || 0})} />
                              </div>
                              <div>
                                  <label className="block text-[8px] font-black text-slate-500 uppercase mb-2">Stock Depósito</label>
                                  <input type="number" className="w-full p-3 bg-slate-50 border rounded-xl font-black text-center" value={formData.stockDeposito} onChange={e => setFormData({...formData, stockDeposito: parseInt(e.target.value) || 0})} />
                              </div>
                          </div>
                      </div>
                  </div>
                  <div className="p-8 bg-white border-t border-slate-100 flex justify-end">
                      <button onClick={handleSaveProduct} className="bg-slate-900 text-white px-16 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-600 transition-all flex items-center gap-3">
                          <Save size={20}/> Guardar en Maestro
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Inventory;
