
import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, CheckSquare, Square, ShoppingCart, ArrowRight, BarChart3, Filter, Search, Plus, Trash2, X, ChevronUp, ChevronDown } from 'lucide-react';
import { Product, ReplenishmentItem } from '../types';

interface ShortagesProps {
    onGenerateOrders?: (items: ReplenishmentItem[]) => void;
}

const Shortages: React.FC<ShortagesProps> = ({ onGenerateOrders }) => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [shortages, setShortages] = useState<Product[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [manualReorders, setManualReorders] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
      const savedProducts = localStorage.getItem('ferrecloud_products');
      const products: Product[] = savedProducts ? JSON.parse(savedProducts) : [];
      setAllProducts(products);

      const savedManual = localStorage.getItem('ferrecloud_manual_shortages');
      const manualIds: string[] = savedManual ? JSON.parse(savedManual) : [];
      setManualReorders(manualIds);

      const stockShortages = products.filter(p => p.stock <= p.reorderPoint);
      const manualItems = products.filter(p => manualIds.includes(p.id) && !stockShortages.some(s => s.id === p.id));
      
      const combined = [...stockShortages, ...manualItems];
      setShortages(combined);
      
      const criticalIds = combined.filter(p => p.stock <= (p.stockMinimo || 0) || manualIds.includes(p.id)).map(p => p.id);
      setSelectedIds(criticalIds);
  }, []);

  const sortedShortages = useMemo(() => {
      let items = [...shortages];
      items.sort((a, b) => {
          let aValue: any;
          let bValue: any;

          switch (sortConfig.key) {
              case 'name':
                  aValue = (a.name || '').toLowerCase();
                  bValue = (b.name || '').toLowerCase();
                  break;
              case 'sku':
                  aValue = (a.internalCodes?.[0] || '').toLowerCase();
                  bValue = (b.internalCodes?.[0] || '').toLowerCase();
                  break;
              case 'stock':
                  aValue = a.stock || 0;
                  bValue = b.stock || 0;
                  break;
              case 'toOrder':
                  aValue = Math.max(1, (a.stockMaximo || 0) - a.stock);
                  bValue = Math.max(1, (b.stockMaximo || 0) - b.stock);
                  break;
              default:
                  aValue = ''; bValue = '';
          }

          if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
      });
      return items;
  }, [shortages, sortConfig]);

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

  const toggleSelection = (id: string) => {
      setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
      if (selectedIds.length === shortages.length) {
          setSelectedIds([]);
      } else {
          setSelectedIds(shortages.map(p => p.id));
      }
  };

  const calculateTotalCost = () => {
      return shortages
        .filter(p => selectedIds.includes(p.id))
        .reduce((acc, p) => acc + (Math.max(1, (p.stockMaximo || 0) - p.stock) * p.listCost), 0);
  };

  const filteredSearch = allProducts.filter(p => 
      !shortages.some(s => s.id === p.id) && 
      (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
       p.internalCodes.some(c => c.toLowerCase().includes(searchTerm.toLowerCase())) ||
       p.brand.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddManualProduct = (product: Product) => {
      setShortages(prev => [...prev, product]);
      setManualReorders(prev => {
          const next = [...prev, product.id];
          localStorage.setItem('ferrecloud_manual_shortages', JSON.stringify(next));
          return next;
      });
      setSelectedIds(prev => [...prev, product.id]);
      setSearchTerm('');
      setShowSearchResults(false);
  };

  const handleRemoveFromList = (id: string) => {
      setShortages(prev => prev.filter(p => p.id !== id));
      setSelectedIds(prev => prev.filter(x => x !== id));
      setManualReorders(prev => {
          const next = prev.filter(x => x !== id);
          localStorage.setItem('ferrecloud_manual_shortages', JSON.stringify(next));
          return next;
      });
  };

  const handleGenerateOrders = () => {
      if (selectedIds.length === 0) return;
      const itemsToOrder = shortages.filter(p => selectedIds.includes(p.id));
      const replenishmentItems: ReplenishmentItem[] = itemsToOrder.map(product => ({
              product: product,
              quantity: Math.max(1, (product.stockMaximo || 0) - product.stock),
              selectedProviderId: 'P1', 
              selectedProviderName: product.provider
      }));
      localStorage.removeItem('ferrecloud_manual_shortages');
      if (onGenerateOrders) onGenerateOrders(replenishmentItems);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><AlertTriangle className="text-ferre-orange"/> Faltantes y Reposición</h2>
          <p className="text-gray-500 text-sm">Análisis de stock bajo reorden y pedidos manuales.</p>
        </div>
        <div className="flex gap-4">
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 flex items-center gap-3 shadow-sm text-right">
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Reposición Estimada</p>
                    <p className="font-bold text-xl text-gray-800">${calculateTotalCost().toLocaleString('es-AR')}</p>
                </div>
            </div>
            <button onClick={handleGenerateOrders} disabled={selectedIds.length === 0} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2 rounded-lg font-bold shadow-md flex items-center gap-2 disabled:opacity-50">
                <ShoppingCart size={18}/> Armar Pedido ({selectedIds.length})
            </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 relative">
          <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Agregar producto manualmente..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setShowSearchResults(true); }} onFocus={() => setShowSearchResults(true)}/>
          </div>
          {showSearchResults && searchTerm && (
              <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-xl shadow-2xl mt-1 max-h-60 overflow-y-auto z-50 p-2">
                  {filteredSearch.map(p => (
                      <button key={p.id} onClick={() => handleAddManualProduct(p)} className="w-full text-left px-4 py-3 hover:bg-indigo-50 rounded-lg border-b last:border-0 border-gray-50 flex justify-between items-center">
                          <div>
                              <div className="font-bold text-gray-800 text-sm">{p.name}</div>
                              <div className="text-xs text-gray-500 font-mono">{p.internalCodes[0]} • {p.brand}</div>
                          </div>
                          <Plus size={18} className="text-gray-300"/>
                      </button>
                  ))}
              </div>
          )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest sticky top-0 z-10 shadow-sm">
                      <tr>
                          <th className="px-6 py-4 w-12 text-center">
                              <button onClick={toggleSelectAll}>{selectedIds.length === shortages.length && shortages.length > 0 ? <CheckSquare size={18} className="text-indigo-600"/> : <Square size={18} className="text-gray-400"/>}</button>
                          </th>
                          <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSort('name')}>
                              <div className="flex items-center gap-2">Artículo / SKU {getSortIcon('name')}</div>
                          </th>
                          <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors text-center" onClick={() => requestSort('stock')}>
                              <div className="flex items-center justify-center gap-2">Stock {getSortIcon('stock')}</div>
                          </th>
                          <th className="px-6 py-4 cursor-pointer hover:bg-indigo-100 transition-colors text-center text-indigo-800 font-bold bg-indigo-50" onClick={() => requestSort('toOrder')}>
                              <div className="flex items-center justify-center gap-2">A Pedir {getSortIcon('toOrder')}</div>
                          </th>
                          <th className="px-6 py-4 text-center">Acciones</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {sortedShortages.map(product => (
                          <tr key={product.id} className={`hover:bg-gray-50 group ${selectedIds.includes(product.id) ? 'bg-indigo-50/30' : ''}`}>
                              <td className="px-6 py-4 text-center">
                                  <button onClick={() => toggleSelection(product.id)}>{selectedIds.includes(product.id) ? <CheckSquare size={18} className="text-indigo-600"/> : <Square size={18} className="text-gray-300"/>}</button>
                              </td>
                              <td className="px-6 py-4">
                                  <div className="font-bold text-gray-800 text-sm">{product.name}</div>
                                  <div className="text-xs text-gray-400 font-mono uppercase">{product.internalCodes[0]}</div>
                              </td>
                              <td className="px-6 py-4 text-center font-bold text-gray-700">{product.stock}</td>
                              <td className="px-6 py-4 text-center font-bold text-indigo-700 bg-indigo-50/50 text-lg">{Math.max(1, (product.stockMaximo || 0) - product.stock)}</td>
                              <td className="px-6 py-4 text-center">
                                  <button onClick={() => handleRemoveFromList(product.id)} className="text-gray-300 hover:text-red-500 p-2 rounded-full"><Trash2 size={16}/></button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};

export default Shortages;
