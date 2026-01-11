
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    Search, Plus, Package, X, Save, DollarSign, 
    Barcode, Pen, Trash2, Tag, Layers, Info, 
    Percent, Activity, Database, Boxes, RefreshCw, 
    Settings2, Zap, Calculator, ShoppingCart, ChevronRight,
    Truck, ListFilter, FileUp, PlusCircle, CheckCircle, Hash,
    PlusSquare, MinusCircle, Scaling, ChevronUp, ChevronDown, Download, FileSpreadsheet,
    PackagePlus, Link2, Upload, Ruler, Building2, Store, Globe, ArrowRight, TrendingUp,
    Scale, Boxes as BoxesIcon, Plus as PlusIcon, Minus as MinusIcon,
    MapPin
} from 'lucide-react';
import { Product, Provider, Brand, Category, ViewState } from '../types';
import { productDB, addToReplenishmentQueue } from '../services/storageService';
import Providers from './Providers';
import InitialImport from './InitialImport';

const Inventory: React.FC = () => {
  const [inventoryTab, setInventoryTab] = useState<'PRODUCTS' | 'IMPORT' | 'BRANDS' | 'CATEGORIES' | 'PROVIDERS'>('PRODUCTS');
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  const [isSaving, setIsSaving] = useState(false);
  
  const [brands, setBrands] = useState<Brand[]>(() => JSON.parse(localStorage.getItem('ferrecloud_brands') || '[]'));
  const [categories, setCategories] = useState<Category[]>(() => JSON.parse(localStorage.getItem('ferrecloud_categories') || '[]'));
  const [providers] = useState<Provider[]>(() => JSON.parse(localStorage.getItem('ferrecloud_providers') || '[]'));
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [modalTab, setModalTab] = useState<'GENERAL' | 'CODES' | 'PRICING' | 'STOCK' | 'TECHNICAL'>('GENERAL');

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
          if (arr.length <= 1 && field === 'internalCodes') return prev; // Siempre debe haber un SKU
          arr.splice(index, 1);
          return { ...prev, [field]: arr };
      });
  };

  const handlePedir = (p: Product) => {
      if (addToReplenishmentQueue(p)) {
          alert(`✅ ${p.name} agregado a la lista de faltantes.`);
      }
  };

  const handleSaveProduct = async () => {
      if (!formData.name) return alert("El nombre es obligatorio");
      
      setIsSaving(true);
      try {
          const productToSave: Product = {
              ...formData,
              id: formData.id || `PROD-${Date.now()}`,
              name: formData.name.toUpperCase(),
              internalCodes: (formData.internalCodes || ['']).filter(c => c.trim() !== ''),
              barcodes: (formData.barcodes || []).filter(c => c.trim() !== ''),
              providerCodes: (formData.providerCodes || []).filter(c => c.trim() !== ''),
              stock: (formData.stockPrincipal || 0) + (formData.stockDeposito || 0) + (formData.stockSucursal || 0),
              ecommerce: formData.ecommerce || { isPublished: false }
          } as Product;

          if (productToSave.internalCodes.length === 0) {
              productToSave.internalCodes = [`SKU-${Date.now().toString().slice(-6)}`];
          }

          await productDB.save(productToSave);
          setIsModalOpen(false);
          setFormData({});
          await loadProducts();
      } catch (err) {
          alert("Error al guardar el artículo");
      } finally {
          setIsSaving(false);
      }
  };

  return (
    <div className="p-4 h-full flex flex-col space-y-4 bg-slate-200 overflow-hidden font-sans">
      <div className="bg-white p-5 rounded-[2.5rem] border border-slate-300 shadow-xl shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-900 text-indigo-400 rounded-2xl shadow-lg"><BoxesIcon size={28}/></div>
                <div>
                    <h2 className="text-2xl font-black text-slate-950 uppercase tracking-tighter leading-none">Inventario Maestro</h2>
                    <p className="text-slate-600 text-[11px] font-black uppercase tracking-[0.2em] mt-2">Gestión Pro: 140.000 Artículos</p>
                </div>
            </div>

            <div className="flex bg-slate-100 rounded-2xl p-1 border border-slate-300 shadow-inner">
                <button onClick={() => setInventoryTab('PRODUCTS')} className={`px-6 py-3 rounded-xl text-[11px] font-black uppercase transition-all tracking-widest ${inventoryTab === 'PRODUCTS' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500'}`}>Artículos</button>
                <button onClick={() => setInventoryTab('IMPORT')} className={`px-6 py-3 rounded-xl text-[11px] font-black uppercase transition-all tracking-widest ${inventoryTab === 'IMPORT' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500'}`}>Carga Masiva</button>
                <button onClick={() => setInventoryTab('PROVIDERS')} className={`px-6 py-3 rounded-xl text-[11px] font-black uppercase transition-all tracking-widest ${inventoryTab === 'PROVIDERS' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500'}`}>Proveedores</button>
            </div>

            <button onClick={() => { setFormData({name: '', brand: '', category: '', provider: '', internalCodes: [''], barcodes: [], providerCodes: [], vatRate: 21, profitMargin: 30, discounts: [0,0,0,0], purchaseCurrency: 'ARS', saleCurrency: 'ARS', measureUnitPurchase: 'UNIDAD', measureUnitSale: 'UNIDAD', conversionFactor: 1, purchasePackageQuantity: 1, stockPrincipal: 0, stockDeposito: 0, stockSucursal: 0}); setModalTab('GENERAL'); setIsModalOpen(true); }} className="bg-indigo-600 text-white px-8 py-4 rounded-[1.8rem] font-black shadow-2xl flex items-center gap-3 hover:bg-indigo-700 transition-all uppercase text-xs tracking-widest">
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
                        <input type="text" placeholder="Buscar por Nombre, Marca, SKU, Barras o Código de Proveedor..." className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-[1.5rem] text-sm font-black outline-none focus:bg-white focus:border-indigo-500 transition-all uppercase placeholder:text-slate-300" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>

                <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-300 flex-1 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse table-fixed">
                            <thead className="bg-slate-900 sticky top-0 z-20 text-[11px] uppercase font-black text-slate-300 tracking-widest">
                                <tr>
                                    <th className="w-[15%] px-6 py-5 border-r border-slate-800">SKU / Ref</th>
                                    <th className="w-[30%] px-6 py-5 border-r border-slate-800">Descripción</th>
                                    <th className="w-[15%] px-6 py-5 border-r border-slate-800">Marca / Rubro</th>
                                    <th className="w-[10%] px-6 py-5 text-center border-r border-slate-800">Stock</th>
                                    <th className="w-[10%] px-6 py-5 text-right border-r border-slate-800">PVP Final</th>
                                    <th className="w-[20%] px-6 py-5 text-center">Gestión</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {sortedProducts.map(p => (
                                    <tr key={p.id} className="hover:bg-indigo-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-mono font-black text-indigo-700 text-xs truncate">{p.internalCodes?.[0] || 'S/C'}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase truncate">{p.barcodes?.[0] || 'SIN EAN'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-black uppercase text-slate-950 text-xs truncate">{p.name}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase truncate">Prov: {p.provider || 'S/D'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-black text-slate-600 text-[10px] uppercase truncate">{p.brand || 'GENÉRICO'}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase truncate">{p.category || 'SIN RUBRO'}</p>
                                        </td>
                                        <td className={`px-6 py-4 text-center font-black text-lg tracking-tighter ${p.stock <= (p.stockMinimo || 0) ? 'text-red-500' : 'text-slate-900'}`}>{p.stock}</td>
                                        <td className="px-6 py-4 text-right font-black text-slate-950 text-lg tracking-tighter bg-slate-50/50">${p.priceFinal?.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center gap-1.5">
                                                <button 
                                                    onClick={() => handlePedir(p)}
                                                    className="p-2.5 text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100 flex flex-col items-center group"
                                                    title="Pedir Reposición">
                                                    <Truck size={14}/>
                                                    <span className="text-[7px] font-black uppercase mt-0.5 group-hover:block">Pedir</span>
                                                </button>
                                                <button onClick={() => { setFormData(p); setModalTab('GENERAL'); setIsModalOpen(true); }} className="p-2.5 text-indigo-700 bg-indigo-50 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100"><Pen size={14}/></button>
                                                <button onClick={async () => { if(confirm('¿Eliminar definitivamente?')) await productDB.delete(p.id); }} className="p-2.5 text-red-300 bg-red-50 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-50"><Trash2 size={14}/></button>
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
        {inventoryTab === 'PROVIDERS' && <Providers />}
      </div>
      {/* ... resto del componente modal omitido por brevedad pero se asume existente ... */}
    </div>
  );
};

export default Inventory;
