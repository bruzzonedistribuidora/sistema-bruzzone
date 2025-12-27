import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckSquare, Square, ShoppingCart, ArrowRight, BarChart3, Filter, Search, Plus, Trash2, X } from 'lucide-react';
import { Product, ReplenishmentItem } from '../types';

interface ShortagesProps {
    onGenerateOrders?: (items: ReplenishmentItem[]) => void;
}

const Shortages: React.FC<ShortagesProps> = ({ onGenerateOrders }) => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [shortages, setShortages] = useState<Product[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [manualReorders, setManualReorders] = useState<string[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  // --- INITIAL DATA LOADING ---
  useEffect(() => {
      // 1. Load All Products
      const savedProducts = localStorage.getItem('ferrecloud_products');
      const products: Product[] = savedProducts ? JSON.parse(savedProducts) : [];
      setAllProducts(products);

      // 2. Load Manual Reorders from Inventory
      const savedManual = localStorage.getItem('ferrecloud_manual_shortages');
      const manualIds: string[] = savedManual ? JSON.parse(savedManual) : [];
      setManualReorders(manualIds);

      // 3. Filter Shortages (Stock <= Reorder Point OR Manual Reorder)
      const stockShortages = products.filter(p => p.stock <= p.reorderPoint);
      const manualItems = products.filter(p => manualIds.includes(p.id) && !stockShortages.some(s => s.id === p.id));
      
      const combined = [...stockShortages, ...manualItems];
      setShortages(combined);
      
      // Auto-select critical items and manual reorders by default
      const criticalIds = combined.filter(p => p.stock <= p.minStock || manualIds.includes(p.id)).map(p => p.id);
      setSelectedIds(criticalIds);
  }, []);

  // --- HANDLERS: SELECTION ---
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
        .reduce((acc, p) => acc + (Math.max(1, p.desiredStock - p.stock) * p.listCost), 0);
  };

  // --- HANDLERS: MANUAL SEARCH & ADD ---
  const filteredSearch = allProducts.filter(p => 
      !shortages.some(s => s.id === p.id) && 
      (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
       p.internalCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      
      const replenishmentItems: ReplenishmentItem[] = itemsToOrder.map(product => {
          // Provider Mapping Mock
          const providerMap: {[key: string]: string} = {
              'Herramientas Global SA': 'P1',
              'Pinturas del Centro': 'P2',
              'Bulonera Industrial': 'P3'
          };
          
          return {
              product: product,
              quantity: Math.max(1, product.desiredStock - product.stock),
              selectedProviderId: providerMap[product.provider] || 'P1', 
              selectedProviderName: product.provider
          };
      });

      // Clear manual reorders as they are being processed
      localStorage.removeItem('ferrecloud_manual_shortages');

      if (onGenerateOrders) {
          onGenerateOrders(replenishmentItems);
      } else {
          alert('Función de navegación no conectada.');
      }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <AlertTriangle className="text-ferre-orange"/> Faltantes y Reposición
          </h2>
          <p className="text-gray-500 text-sm">Análisis de stock bajo reorden y pedidos manuales cargados.</p>
        </div>
        
        <div className="flex gap-4">
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 flex items-center gap-3 shadow-sm text-right">
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Reposición Estimada</p>
                    <p className="font-bold text-xl text-gray-800">${calculateTotalCost().toLocaleString('es-AR')}</p>
                </div>
            </div>
            <button 
                onClick={handleGenerateOrders}
                disabled={selectedIds.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2 rounded-lg font-bold shadow-md flex items-center gap-2 disabled:opacity-50 transition-colors">
                <ShoppingCart size={18}/> Armar Pedido ({selectedIds.length})
            </button>
        </div>
      </div>

      {/* SEARCH BAR TO ADD MANUAL ITEMS */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 relative">
          <div className="flex items-center gap-3">
              <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Buscar producto para agregar manualmente al pedido (Nombre, Marca, Código)..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
                    value={searchTerm}
                    onChange={e => {
                        setSearchTerm(e.target.value);
                        setShowSearchResults(true);
                    }}
                    onFocus={() => setShowSearchResults(true)}
                  />
                  {searchTerm && (
                      <button onClick={() => { setSearchTerm(''); setShowSearchResults(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={16}/></button>
                  )}
              </div>
          </div>
          
          {/* SEARCH RESULTS DROPDOWN */}
          {showSearchResults && searchTerm && (
              <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-xl shadow-2xl mt-1 max-h-60 overflow-y-auto z-50 p-2">
                  {filteredSearch.map(p => (
                      <button 
                        key={p.id}
                        onClick={() => handleAddManualProduct(p)}
                        className="w-full text-left px-4 py-3 hover:bg-indigo-50 rounded-lg border-b last:border-0 border-gray-50 flex justify-between items-center group"
                      >
                          <div>
                              <div className="font-bold text-gray-800 text-sm">{p.name}</div>
                              <div className="text-xs text-gray-500 font-mono">
                                  {p.internalCode} • {p.brand} • Stock: {p.stock}
                              </div>
                          </div>
                          <Plus size={18} className="text-gray-300 group-hover:text-indigo-600"/>
                      </button>
                  ))}
                  {filteredSearch.length === 0 && (
                      <div className="p-4 text-center text-gray-400 text-sm italic">No se encontraron más artículos.</div>
                  )}
              </div>
          )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-6 mb-6">
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-white rounded-full text-red-600 shadow-sm"><AlertTriangle size={24}/></div>
              <div>
                  <p className="text-xs font-bold text-red-800 uppercase">Stock Crítico</p>
                  <p className="text-2xl font-bold text-red-900">{shortages.filter(p => p.stock <= p.minStock).length}</p>
              </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-white rounded-full text-yellow-600 shadow-sm"><BarChart3 size={24}/></div>
              <div>
                  <p className="text-xs font-bold text-yellow-800 uppercase">Bajo Reorden</p>
                  <p className="text-2xl font-bold text-yellow-900">{shortages.filter(p => p.stock > p.minStock && p.stock <= p.reorderPoint).length}</p>
              </div>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-white rounded-full text-indigo-600 shadow-sm"><ShoppingCart size={24}/></div>
              <div>
                  <p className="text-xs font-bold text-indigo-800 uppercase">Cargados Manual</p>
                  <p className="text-2xl font-bold text-indigo-900">{manualReorders.length}</p>
              </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-white rounded-full text-blue-600 shadow-sm"><Filter size={24}/></div>
              <div>
                  <p className="text-xs font-bold text-blue-800 uppercase">Proveedores</p>
                  <p className="text-2xl font-bold text-blue-900">{new Set(shortages.map(p => p.provider)).size}</p>
              </div>
          </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase sticky top-0 z-10 shadow-sm">
                      <tr>
                          <th className="px-6 py-4 w-12 text-center">
                              <button onClick={toggleSelectAll}>
                                  {selectedIds.length === shortages.length && shortages.length > 0 ? <CheckSquare size={18} className="text-indigo-600"/> : <Square size={18} className="text-gray-400"/>}
                              </button>
                          </th>
                          <th className="px-6 py-4">Artículo / Marca</th>
                          <th className="px-6 py-4">Proveedor</th>
                          <th className="px-6 py-4 text-center">Motivo</th>
                          <th className="px-6 py-4 text-center bg-gray-100">Stock Act.</th>
                          <th className="px-6 py-4 text-center bg-indigo-50 text-indigo-800 font-bold border-l border-indigo-100">A Pedir</th>
                          <th className="px-6 py-4 text-center">Acciones</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {shortages.map(product => {
                          const quantityToOrder = Math.max(1, product.desiredStock - product.stock);
                          const isCritical = product.stock <= product.minStock;
                          const isManual = manualReorders.includes(product.id);

                          return (
                              <tr key={product.id} className={`hover:bg-gray-50 group transition-colors ${selectedIds.includes(product.id) ? 'bg-indigo-50/30' : ''}`}>
                                  <td className="px-6 py-4 text-center">
                                      <button onClick={() => toggleSelection(product.id)}>
                                          {selectedIds.includes(product.id) ? <CheckSquare size={18} className="text-indigo-600"/> : <Square size={18} className="text-gray-300 group-hover:text-gray-400"/>}
                                      </button>
                                  </td>
                                  <td className="px-6 py-4">
                                      <div className="font-bold text-gray-800 text-sm">{product.name}</div>
                                      <div className="text-xs text-gray-500 font-mono">{product.brand} • {product.internalCode}</div>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-600">
                                      {product.provider}
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                      {isManual ? (
                                          <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-[10px] font-bold">MANUAL</span>
                                      ) : isCritical ? (
                                          <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px] font-bold">CRÍTICO</span>
                                      ) : (
                                          <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-[10px] font-bold">REORDEN</span>
                                      )}
                                  </td>
                                  <td className={`px-6 py-4 text-center font-bold bg-gray-50/50 ${isCritical ? 'text-red-600' : 'text-gray-700'}`}>
                                      {product.stock}
                                  </td>
                                  <td className="px-6 py-4 text-center font-bold text-indigo-700 bg-indigo-50/50 border-l border-indigo-50 text-lg">
                                      {quantityToOrder}
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                      <button 
                                        onClick={() => handleRemoveFromList(product.id)}
                                        className="text-gray-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                                      >
                                          <Trash2 size={16}/>
                                      </button>
                                  </td>
                              </tr>
                          )
                      })}
                      {shortages.length === 0 && (
                          <tr>
                              <td colSpan={7} className="p-12 text-center text-gray-400">
                                  <CheckSquare size={48} className="mx-auto mb-4 text-green-200"/>
                                  <p className="text-lg font-medium text-gray-600">¡Todo en orden!</p>
                                  <p className="text-sm">No hay faltantes. Puedes usar el buscador para agregar pedidos manuales.</p>
                              </td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};

export default Shortages;