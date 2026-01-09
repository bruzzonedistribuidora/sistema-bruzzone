
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    Search, Plus, Package, X, Save, DollarSign, 
    Barcode, Pen, Trash2, Tag, Layers, Info, 
    Percent, Activity, Database, Boxes, RefreshCw, 
    Settings2, Zap, Calculator, ShoppingCart, ChevronRight,
    Truck, ListFilter, FileUp, PlusCircle, CheckCircle, Hash,
    PlusSquare, MinusCircle, Scaling, ChevronUp, ChevronDown, Download, FileSpreadsheet,
    PackagePlus, Link2, Upload
} from 'lucide-react';
import { Product, Provider, CompanyConfig, Branch, Brand, Category } from '../types';
import { productDB, addToReplenishmentQueue } from '../services/storageService';
import Providers from './Providers';

const Inventory: React.FC = () => {
  const [inventoryTab, setInventoryTab] = useState<'PRODUCTS' | 'BRANDS' | 'CATEGORIES' | 'PROVIDERS'>('PRODUCTS');
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [brands, setBrands] = useState<Brand[]>(() => JSON.parse(localStorage.getItem('ferrecloud_brands') || '[]'));
  const [categories, setCategories] = useState<Category[]>(() => JSON.parse(localStorage.getItem('ferrecloud_categories') || '[]'));
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEntityModalOpen, setIsEntityModalOpen] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [modalTab, setModalTab] = useState<'GENERAL' | 'PRICING' | 'STOCK' | 'TECHNICAL'>('GENERAL');

  const providers: Provider[] = useMemo(() => JSON.parse(localStorage.getItem('ferrecloud_providers') || '[]'), []);

  useEffect(() => { localStorage.setItem('ferrecloud_brands', JSON.stringify(brands)); }, [brands]);
  useEffect(() => { localStorage.setItem('ferrecloud_categories', JSON.stringify(categories)); }, [categories]);

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

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = (sortConfig.key === key && sortConfig.direction === 'asc') ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };

  const handlePedir = (p: Product) => {
      if (addToReplenishmentQueue(p)) {
          alert(`Articulo ${p.name} agregado a la cola de reposición.`);
      }
  };

  const handleSaveProduct = async () => {
      if (!formData.name) return;
      setIsSaving(true);
      try {
          // Aseguramos estructura básica de ecommerce si no existe
          const productToSave: Product = {
              ...formData,
              id: formData.id || Date.now().toString(),
              ecommerce: formData.ecommerce || { isPublished: false },
              internalCodes: formData.internalCodes || ['S/C'],
              barcodes: formData.barcodes || [],
              providerCodes: formData.providerCodes || [],
              discounts: formData.discounts || [0,0,0,0],
              comboItems: formData.comboItems || [],
              stockDetails: formData.stockDetails || []
          } as Product;

          await productDB.save(productToSave);
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

  // --- FUNCIONES DE IMPORT/EXPORT PARA MARCAS Y RUBROS ---
  const exportEntities = (type: 'BRANDS' | 'CATEGORIES') => {
    const data = type === 'BRANDS' ? brands : categories;
    const headers = "ID;NOMBRE\n";
    const csv = data.map(item => `${item.id};${item.name}`).join("\n");
    const blob = new Blob(["\uFEFF" + headers + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${type}_EXPORT.csv`;
    link.click();
  };

  const importEntities = (e: React.ChangeEvent<HTMLInputElement>, type: 'BRANDS' | 'CATEGORIES') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        const content = event.target?.result as string;
        const lines = content.split("\n").slice(1);
        const newItems = lines.map(line => {
            const [id, name] = line.split(";");
            if (!name) return null;
            return { id: id || Date.now().toString() + Math.random(), name: name.trim().toUpperCase() };
        }).filter(Boolean) as any[];

        if (type === 'BRANDS') setBrands(prev => [...prev, ...newItems]);
        else setCategories(prev => [...prev, ...newItems]);
        alert(`Importación de ${type} completada.`);
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-3 h-full flex flex-col space-y-3 bg-slate-50 overflow-hidden font-sans">
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-900 text-indigo-400 rounded-xl"><Boxes size={20}/></div>
                <div>
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-tighter">Inventario Maestro</h2>
                    <p className="text-slate-400 text-[8px] font-bold uppercase tracking-widest leading-none">Gestión de 140k Artículos</p>
                </div>
            </div>

            <div className="flex bg-slate-100 rounded-xl p-0.5 border border-slate-200">
                <button onClick={() => setInventoryTab('PRODUCTS')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${inventoryTab === 'PRODUCTS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>Artículos</button>
                <button onClick={() => setInventoryTab('BRANDS')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${inventoryTab === 'BRANDS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>Marcas</button>
                <button onClick={() => setInventoryTab('CATEGORIES')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${inventoryTab === 'CATEGORIES' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>Rubros</button>
                <button onClick={() => setInventoryTab('PROVIDERS')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${inventoryTab === 'PROVIDERS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>Proveedores</button>
            </div>

            <div className="flex gap-2">
                {(inventoryTab === 'BRANDS' || inventoryTab === 'CATEGORIES') && (
                    <div className="flex gap-1 mr-2 border-r pr-2">
                        <button onClick={() => exportEntities(inventoryTab)} className="p-2 text-slate-500 hover:text-indigo-600" title="Exportar CSV"><Download size={14}/></button>
                        <label className="p-2 text-slate-500 hover:text-indigo-600 cursor-pointer" title="Importar CSV">
                            <Upload size={14}/>
                            <input type="file" className="hidden" accept=".csv" onChange={(e) => importEntities(e, inventoryTab)} />
                        </label>
                    </div>
                )}
                <button onClick={() => { setFormData({}); setIsModalOpen(true); }} className="bg-slate-900 text-white px-4 py-2 rounded-xl font-black shadow-lg flex items-center gap-2 hover:bg-indigo-600 transition-all uppercase text-[9px] tracking-widest">
                    <Plus size={14} /> Nuevo
                </button>
            </div>
          </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {inventoryTab === 'PRODUCTS' && (
            <div className="h-full flex flex-col space-y-2 animate-fade-in">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1.5 shrink-0 flex gap-2">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                        <input type="text" placeholder="Buscar artículo..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-transparent rounded-xl text-[10px] font-bold outline-none focus:bg-white focus:border-indigo-100 transition-all uppercase" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse table-fixed">
                            <thead className="bg-slate-900 sticky top-0 z-20 text-[8px] uppercase font-black text-slate-300 tracking-wider">
                                <tr>
                                    <th className="w-[15%] px-4 py-3 cursor-pointer" onClick={() => requestSort('internalCodes')}>SKU</th>
                                    <th className="w-[35%] px-4 py-3 cursor-pointer" onClick={() => requestSort('name')}>Descripción</th>
                                    <th className="w-[12%] px-4 py-3 text-center cursor-pointer" onClick={() => requestSort('stock')}>Stock</th>
                                    <th className="w-[15%] px-4 py-3 text-right cursor-pointer" onClick={() => requestSort('priceFinal')}>PVP Final</th>
                                    <th className="w-[23%] px-4 py-3 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sortedProducts.map(p => (
                                    <tr key={p.id} className="hover:bg-slate-50 transition-colors text-[10px]">
                                        <td className="px-4 py-2 font-mono font-bold text-indigo-600 truncate">{p.internalCodes?.[0]}</td>
                                        <td className="px-4 py-2 font-black uppercase text-slate-700 truncate">{p.name}</td>
                                        <td className="px-4 py-2 text-center font-bold">{p.stock}</td>
                                        <td className="px-4 py-2 text-right font-black text-slate-900">${p.priceFinal?.toLocaleString()}</td>
                                        <td className="px-4 py-2">
                                            <div className="flex justify-center gap-1.5">
                                                <button onClick={() => handlePedir(p)} className="p-1.5 text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-600 hover:text-white transition-all" title="Pedir Reposición"><Truck size={12}/></button>
                                                <button onClick={() => { setFormData(p); setIsModalOpen(true); }} className="p-1.5 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-600 hover:text-white transition-all" title="Editar"><Pen size={12}/></button>
                                                <button onClick={async () => { if(confirm('¿Eliminar?')) await productDB.delete(p.id); }} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={12}/></button>
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
        {inventoryTab === 'BRANDS' && (
            <div className="bg-white rounded-2xl border p-4 h-full overflow-y-auto custom-scrollbar animate-fade-in">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {brands.map(b => (
                        <div key={b.id} className="p-3 bg-slate-50 border rounded-xl flex justify-between items-center group">
                            <span className="text-[10px] font-black uppercase truncate">{b.name}</span>
                            <button onClick={() => setBrands(brands.filter(x => x.id !== b.id))} className="text-slate-200 group-hover:text-red-500"><X size={12}/></button>
                        </div>
                    ))}
                </div>
            </div>
        )}
        {inventoryTab === 'CATEGORIES' && (
            <div className="bg-white rounded-2xl border p-4 h-full overflow-y-auto custom-scrollbar animate-fade-in">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {categories.map(c => (
                        <div key={c.id} className="p-3 bg-slate-50 border rounded-xl flex justify-between items-center group">
                            <span className="text-[10px] font-black uppercase truncate">{c.name}</span>
                            <button onClick={() => setCategories(categories.filter(x => x.id !== c.id))} className="text-slate-200 group-hover:text-red-500"><X size={12}/></button>
                        </div>
                    ))}
                </div>
            </div>
        )}
        {inventoryTab === 'PROVIDERS' && <Providers />}
      </div>

      {isModalOpen && (
          <div className="fixed inset-0 z-[300] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
                      <div className="flex items-center gap-3">
                          <Package size={20}/>
                          <h3 className="text-xs font-black uppercase tracking-widest">{formData.id ? 'Ficha de Artículo' : 'Nuevo Artículo'}</h3>
                      </div>
                      <button onClick={() => setIsModalOpen(false)}><X size={20}/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar bg-slate-50">
                      <div className="bg-white p-5 rounded-2xl border space-y-4">
                          <label className="text-[9px] font-black uppercase text-slate-400">Descripción Principal</label>
                          <input className="w-full p-3 bg-slate-50 border rounded-xl font-black text-xs uppercase" placeholder="EJ: MARTILLO BOLITA 500GR..." value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} />
                          
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="text-[8px] font-black uppercase text-slate-400 block mb-1">Código SKU</label>
                                  <input className="w-full p-2 bg-slate-50 border rounded-lg font-mono text-[10px] font-bold uppercase" value={formData.internalCodes?.[0] || ''} onChange={e => setFormData({...formData, internalCodes: [e.target.value.toUpperCase()]})} />
                              </div>
                              <div>
                                  <label className="text-[8px] font-black uppercase text-slate-400 block mb-1">Stock Actual</label>
                                  <input type="number" className="w-full p-2 bg-slate-50 border rounded-lg font-black text-xs" value={formData.stock || 0} onChange={e => setFormData({...formData, stock: parseFloat(e.target.value) || 0})} />
                              </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="text-[8px] font-black uppercase text-slate-400 block mb-1">Precio Final ($)</label>
                                  <input type="number" className="w-full p-3 bg-indigo-50 border-indigo-200 border rounded-xl font-black text-lg text-indigo-600" value={formData.priceFinal || 0} onChange={e => setFormData({...formData, priceFinal: parseFloat(e.target.value) || 0})} />
                              </div>
                              <div>
                                  <label className="text-[8px] font-black uppercase text-slate-400 block mb-1">Marca</label>
                                  <select className="w-full p-3 bg-slate-50 border rounded-xl font-black text-[10px] uppercase" value={formData.brand || ''} onChange={e => setFormData({...formData, brand: e.target.value})}>
                                      <option value="">-- SELECCIONE --</option>
                                      {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                                  </select>
                              </div>
                          </div>
                      </div>
                  </div>
                  <div className="p-5 border-t bg-white flex justify-end gap-3">
                      <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-slate-400 font-black text-[10px] uppercase">Cancelar</button>
                      <button onClick={handleSaveProduct} disabled={isSaving} className="bg-slate-900 text-white px-10 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-2 hover:bg-indigo-600 transition-all">
                          {isSaving ? <RefreshCw className="animate-spin" size={14}/> : <Save size={14}/>} Guardar Cambios
                      </button>
                  </div>
              </div>
          </div>
      )}

      {isEntityModalOpen && (
          <div className="fixed inset-0 z-[300] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden">
                  <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                      <h3 className="text-[10px] font-black uppercase tracking-widest">Añadir {inventoryTab === 'BRANDS' ? 'Marca' : 'Rubro'}</h3>
                      <button onClick={() => setIsEntityModalOpen(false)}><X size={16}/></button>
                  </div>
                  <div className="p-5 space-y-4">
                      <input 
                        className="w-full p-3 bg-slate-100 border rounded-xl outline-none font-black text-xs uppercase" 
                        placeholder="Nombre..." 
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                const val = (e.target as HTMLInputElement).value;
                                if (inventoryTab === 'BRANDS') setBrands([...brands, { id: Date.now().toString(), name: val.toUpperCase() }]);
                                else setCategories([...categories, { id: Date.now().toString(), name: val.toUpperCase() }]);
                                setIsEntityModalOpen(false);
                            }
                        }}
                      />
                      <p className="text-[8px] text-slate-400 uppercase text-center">Presione ENTER para guardar</p>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Inventory;
