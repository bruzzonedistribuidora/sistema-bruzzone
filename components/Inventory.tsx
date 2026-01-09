
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Search, Plus, Package, X, Save, DollarSign, 
    Barcode, Pen, Trash2, Tag, Layers, Info, 
    Percent, Activity, Database, Boxes, RefreshCw, 
    Settings2, Zap, Calculator, ShoppingCart, ChevronRight,
    Truck, ListFilter, FileUp, PlusCircle, CheckCircle, Hash,
    PlusSquare, MinusCircle, Scaling, ChevronUp, ChevronDown, Download, FileSpreadsheet,
    PackagePlus, Link2
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
  
  const [brands, setBrands] = useState<Brand[]>(() => JSON.parse(localStorage.getItem('ferrecloud_brands') || '[]'));
  const [categories, setCategories] = useState<Category[]>(() => JSON.parse(localStorage.getItem('ferrecloud_categories') || '[]'));
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEntityModalOpen, setIsEntityModalOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<{type: 'BRAND' | 'CATEGORY', active: boolean}>({type: 'BRAND', active: false});
  
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [entityForm, setEntityForm] = useState<{id?: string, name: string}>({ name: '' });
  const [quickAddName, setQuickAddName] = useState('');
  const [modalTab, setModalTab] = useState<'GENERAL' | 'PRICING' | 'STOCK' | 'TECHNICAL'>('GENERAL');

  const [bulkCost, setBulkCost] = useState<number>(0);

  const providers: Provider[] = useMemo(() => JSON.parse(localStorage.getItem('ferrecloud_providers') || '[]'), []);
  const branches: Branch[] = useMemo(() => JSON.parse(localStorage.getItem('ferrecloud_branches') || '[]'), []);

  useEffect(() => { localStorage.setItem('ferrecloud_brands', JSON.stringify(brands)); }, [brands]);
  useEffect(() => { localStorage.setItem('ferrecloud_categories', JSON.stringify(categories)); }, [categories]);

  const loadProducts = async () => {
      if (searchTerm.trim().length > 2) {
          const results = await productDB.search(searchTerm);
          setProducts(results);
      } else {
          const initial = await productDB.getAll(150);
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
        let aValue: any;
        let bValue: any;

        switch (sortConfig.key) {
            case 'code':
                aValue = a.internalCodes?.[0] || '';
                bValue = b.internalCodes?.[0] || '';
                break;
            case 'name':
                aValue = (a.name || '').toLowerCase();
                bValue = (b.name || '').toLowerCase();
                break;
            case 'category':
                aValue = (a.category || '').toLowerCase();
                bValue = (b.category || '').toLowerCase();
                break;
            case 'stock':
                aValue = a.stock || 0;
                bValue = b.stock || 0;
                break;
            case 'price':
                aValue = a.priceFinal || 0;
                bValue = b.priceFinal || 0;
                break;
            default:
                aValue = a[sortConfig.key as keyof Product] || '';
                bValue = b[sortConfig.key as keyof Product] || '';
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });
    return sortableItems;
  }, [products, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return <div className="w-3 h-3 opacity-20"><ChevronUp size={12}/></div>;
    return sortConfig.direction === 'asc' ? <ChevronUp size={12} className="text-indigo-400"/> : <ChevronDown size={12} className="text-indigo-400"/>;
  };

  const handlePedir = (p: Product) => {
      if (addToReplenishmentQueue(p)) {
          alert(`Articulo ${p.name} agregado.`);
      }
  };

  const handleDeleteProduct = async (p: Product) => {
      if (confirm(`¿Eliminar "${p.name}"?`)) {
          await productDB.delete(p.id);
      }
  };

  const handleExportCatalog = async () => {
      setIsExporting(true);
      try {
          const all = await productDB.getAll();
          if (all.length === 0) return;

          const headers = ["SKU", "ARTICULO", "MARCA", "PVP FINAL", "STOCK"];
          const csvRows = all.map(p => [p.internalCodes[0] || '', p.name, p.brand, p.priceFinal, p.stock]);

          let csvContent = "\uFEFF" + headers.join(";") + "\n";
          csvRows.forEach(row => { csvContent += row.join(";") + "\n"; });

          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.setAttribute("href", url);
          link.setAttribute("download", `CATALOGO.csv`);
          link.click();
      } finally { setIsExporting(false); }
  };

  useEffect(() => {
    const listCost = Number(formData.listCost) || 0;
    const d1 = Number(formData.discounts?.[0]) || 0;
    const d2 = Number(formData.discounts?.[1]) || 0;
    const d3 = Number(formData.discounts?.[2]) || 0;
    const coefBonif = (1 - d1/100) * (1 - d2/100) * (1 - d3/100);
    const costAfterDiscounts = listCost * coefBonif;
    const margin = Number(formData.profitMargin) || 0;
    const priceNeto = costAfterDiscounts * (1 + margin / 100);
    const vatRate = Number(formData.vatRate) || 0;
    const priceFinal = priceNeto * (1 + vatRate / 100);
    const totalStock = Number(formData.stockPrincipal || 0) + Number(formData.stockDeposito || 0) + Number(formData.stockSucursal || 0);

    setFormData(prev => ({ ...prev, coeficienteBonificacionCosto: parseFloat(coefBonif.toFixed(5)), costAfterDiscounts: parseFloat(costAfterDiscounts.toFixed(2)), priceNeto: parseFloat(priceNeto.toFixed(2)), priceFinal: parseFloat(priceFinal.toFixed(2)), stock: totalStock }));
  }, [formData.listCost, formData.discounts, formData.profitMargin, formData.vatRate, formData.stockPrincipal, formData.stockDeposito, formData.stockSucursal]);

  const handleOpenModal = (p?: Product) => {
    if (p) {
        setFormData({ ...p, internalCodes: p.internalCodes || [''], barcodes: p.barcodes || [''], providerCodes: p.providerCodes || [''], discounts: p.discounts || [0, 0, 0, 0] });
    } else {
        setFormData({ id: Date.now().toString(), internalCodes: [''], barcodes: [''], providerCodes: [''], purchasePackageQuantity: 1, name: '', brand: '', provider: '', category: '', listCost: 0, profitMargin: 30, vatRate: 21, stock: 0, stockPrincipal: 0, stockDeposito: 0, stockSucursal: 0, discounts: [0, 0, 0, 0] });
    }
    setModalTab('GENERAL');
    setIsModalOpen(true);
  };

  return (
    <div className="p-3 h-full flex flex-col space-y-3 bg-slate-50 overflow-hidden font-sans">
      <div className="bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-900 text-indigo-400 rounded-xl"><Boxes size={24}/></div>
                <div>
                    <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Stock</h2>
                    <p className="text-slate-400 text-[8px] font-bold uppercase tracking-widest leading-none">Catálogo Maestro</p>
                </div>
            </div>

            <div className="flex bg-slate-100 rounded-xl p-1 shadow-inner border border-slate-200">
                <button onClick={() => setInventoryTab('PRODUCTS')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${inventoryTab === 'PRODUCTS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>Artículos</button>
                <button onClick={() => setInventoryTab('BRANDS')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${inventoryTab === 'BRANDS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>Marcas</button>
                <button onClick={() => setInventoryTab('CATEGORIES')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${inventoryTab === 'CATEGORIES' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>Rubros</button>
            </div>

            <div className="flex gap-2">
                <button onClick={() => inventoryTab === 'PRODUCTS' ? handleOpenModal() : setIsEntityModalOpen(true)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black shadow-lg flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all uppercase text-[9px] tracking-widest active:scale-95">
                    <Plus size={14} /> Nuevo {inventoryTab === 'PRODUCTS' ? 'Artículo' : 'Rubro'}
                </button>
            </div>
          </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {inventoryTab === 'PRODUCTS' && (
            <div className="h-full flex flex-col space-y-3 animate-fade-in">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2 shrink-0 flex gap-2">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={16} />
                        <input type="text" placeholder="Buscar artículo..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-transparent rounded-xl text-[11px] font-bold outline-none focus:bg-white focus:border-indigo-100 transition-all uppercase" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse table-fixed">
                            <thead className="bg-slate-900 sticky top-0 z-20 text-[9px] uppercase font-black text-slate-300 tracking-wider">
                                <tr>
                                    <th className="w-[12%] px-4 py-3 cursor-pointer hover:bg-slate-800" onClick={() => requestSort('code')}>SKU {getSortIcon('code')}</th>
                                    <th className="w-[45%] px-4 py-3 cursor-pointer hover:bg-slate-800" onClick={() => requestSort('name')}>Descripción {getSortIcon('name')}</th>
                                    <th className="w-[15%] px-4 py-3 cursor-pointer hover:bg-slate-800 text-center" onClick={() => requestSort('stock')}>Stock {getSortIcon('stock')}</th>
                                    <th className="w-[18%] px-4 py-3 cursor-pointer hover:bg-slate-700 text-right bg-slate-800" onClick={() => requestSort('price')}>PVP Final {getSortIcon('price')}</th>
                                    <th className="w-[10%] px-4 py-3 text-center">Gestión</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sortedProducts.map(p => (
                                    <tr key={p.id} className="hover:bg-indigo-50/20 transition-colors group">
                                        <td className="px-4 py-2.5"><p className="font-mono font-black text-indigo-700 text-[10px] bg-indigo-50/50 px-1.5 py-0.5 rounded border border-indigo-100/50 truncate">{p.internalCodes?.[0] || 'S/C'}</p></td>
                                        <td className="px-4 py-2.5">
                                            <p className="font-black text-slate-800 uppercase text-xs truncate leading-tight">{p.name}</p>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{p.brand} • {p.provider}</p>
                                        </td>
                                        <td className="px-4 py-2.5 text-center">
                                            <span className={`text-sm font-black tracking-tighter ${p.stock <= (p.stockMinimo || 0) ? 'text-red-600' : 'text-slate-900'}`}>{p.stock}</span>
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-black text-slate-900 bg-indigo-50/5">
                                            <p className="text-sm tracking-tighter text-indigo-800 font-black">${p.priceFinal?.toLocaleString('es-AR')}</p>
                                        </td>
                                        <td className="px-4 py-2.5 text-center">
                                            <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleOpenModal(p)} className="p-1.5 text-indigo-600 bg-indigo-50 rounded hover:bg-indigo-600 hover:text-white transition-all"><Pen size={12}/></button>
                                                <button onClick={() => handleDeleteProduct(p)} className="p-1.5 text-red-400 bg-red-50 rounded hover:bg-red-600 hover:text-white transition-all"><Trash2 size={12}/></button>
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
        {inventoryTab === 'PROVIDERS' && <Providers />}
      </div>
    </div>
  );
};

export default Inventory;
