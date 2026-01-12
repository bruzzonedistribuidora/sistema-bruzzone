
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
      {/* ... (Modal de ficha tecnica se mantiene igual) */}
    </div>
  );
};

export default Inventory;
