
import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckSquare, Square, ShoppingCart, ArrowRight, BarChart3, Filter } from 'lucide-react';
import { Product, ReplenishmentItem } from '../types';

interface ShortagesProps {
    onGenerateOrders?: (items: ReplenishmentItem[]) => void;
}

// Helper for Mock Data (Simplified from other components)
const createMockProduct = (id: string, internalCode: string, name: string, provider: string, stock: number, minStock: number, reorderPoint: number, desiredStock: number, cost: number): Product => ({
  id, internalCode, barcodes: [], providerCodes: [], 
  name, brand: 'Generico', provider, category: 'General', description: '',
  measureUnitSale: 'Unidad', measureUnitPurchase: 'Unidad', conversionFactor: 1, purchaseCurrency: 'ARS', saleCurrency: 'ARS',
  vatRate: 21, listCost: cost, discounts: [0,0,0,0], costAfterDiscounts: cost, profitMargin: 40,
  priceNeto: cost, priceFinal: cost * 1.5, stock, stockDetails: [], minStock, desiredStock, reorderPoint,
  location: '', ecommerce: { mercadoLibre: false, tiendaNube: false, webPropia: false }
});

const Shortages: React.FC<ShortagesProps> = ({ onGenerateOrders }) => {
  // Mock Inventory - Specifically designed to show shortage scenarios
  const [products] = useState<Product[]>([
    createMockProduct('1', 'TOR-001', 'Tornillo Autoperforante 2"', 'Herramientas Global SA', 5, 10, 20, 100, 100), // Critical (Below Min)
    createMockProduct('2', 'MAR-055', 'Martillo Galponero', 'Herramientas Global SA', 18, 10, 20, 50, 5000), // Warning (Below Reorder)
    createMockProduct('3', 'PINT-20L', 'Látex Interior 20L', 'Pinturas del Centro', 2, 5, 8, 20, 25000), // Critical
    createMockProduct('4', 'BUL-HEX', 'Bulon Hexagonal 10mm', 'Bulonera Industrial', 600, 100, 200, 1000, 50), // OK
    createMockProduct('5', 'LIJ-180', 'Lija al agua 180', 'Pinturas del Centro', 15, 10, 30, 100, 300), // Warning
  ]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [shortages, setShortages] = useState<Product[]>([]);

  useEffect(() => {
      // Filter logic: Stock <= Reorder Point
      const items = products.filter(p => p.stock <= p.reorderPoint);
      setShortages(items);
      // Auto-select critical items by default
      setSelectedIds(items.filter(p => p.stock <= p.minStock).map(p => p.id));
  }, [products]);

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
        .reduce((acc, p) => acc + ((p.desiredStock - p.stock) * p.listCost), 0);
  };

  const handleGenerateOrders = () => {
      if (selectedIds.length === 0) return;
      
      const itemsToOrder = shortages.filter(p => selectedIds.includes(p.id));
      
      // Map to ReplenishmentItem structure
      const replenishmentItems: ReplenishmentItem[] = itemsToOrder.map(product => {
          // Generate a fake provider ID for the mock based on name hash or static map
          // In real app, Product would have providerId
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
          <p className="text-gray-500 text-sm">Artículos por debajo del punto de pedido. Generación automática de órdenes de compra.</p>
        </div>
        
        <div className="flex gap-4">
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 flex items-center gap-3 shadow-sm">
                <span className="text-xs font-bold text-gray-500 uppercase">Costo Estimado Reposición</span>
                <span className="font-bold text-xl text-gray-800">${calculateTotalCost().toLocaleString('es-AR')}</span>
            </div>
            <button 
                onClick={handleGenerateOrders}
                disabled={selectedIds.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold shadow-md flex items-center gap-2 disabled:opacity-50 transition-colors">
                <ShoppingCart size={18}/> Generar Pedidos ({selectedIds.length})
            </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-white rounded-full text-red-600 shadow-sm"><AlertTriangle size={24}/></div>
              <div>
                  <p className="text-xs font-bold text-red-800 uppercase">Stock Crítico</p>
                  <p className="text-2xl font-bold text-red-900">{shortages.filter(p => p.stock <= p.minStock).length} Arts.</p>
              </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-white rounded-full text-yellow-600 shadow-sm"><BarChart3 size={24}/></div>
              <div>
                  <p className="text-xs font-bold text-yellow-800 uppercase">Punto de Pedido</p>
                  <p className="text-2xl font-bold text-yellow-900">{shortages.filter(p => p.stock > p.minStock && p.stock <= p.reorderPoint).length} Arts.</p>
              </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-white rounded-full text-blue-600 shadow-sm"><Filter size={24}/></div>
              <div>
                  <p className="text-xs font-bold text-blue-800 uppercase">Proveedores Afectados</p>
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
                          <th className="px-6 py-4">Artículo</th>
                          <th className="px-6 py-4">Proveedor</th>
                          <th className="px-6 py-4 text-center bg-gray-100">Stock Actual</th>
                          <th className="px-6 py-4 text-center">Punto Pedido</th>
                          <th className="px-6 py-4 text-center">Stock Ideal</th>
                          <th className="px-6 py-4 text-center bg-indigo-50 text-indigo-800 font-bold border-l border-indigo-100">A Pedir</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {shortages.map(product => {
                          const quantityToOrder = Math.max(0, product.desiredStock - product.stock);
                          const isCritical = product.stock <= product.minStock;

                          return (
                              <tr key={product.id} className={`hover:bg-gray-50 group transition-colors ${selectedIds.includes(product.id) ? 'bg-indigo-50/30' : ''}`}>
                                  <td className="px-6 py-4 text-center">
                                      <button onClick={() => toggleSelection(product.id)}>
                                          {selectedIds.includes(product.id) ? <CheckSquare size={18} className="text-indigo-600"/> : <Square size={18} className="text-gray-300 group-hover:text-gray-400"/>}
                                      </button>
                                  </td>
                                  <td className="px-6 py-4">
                                      <div className="font-bold text-gray-800">{product.name}</div>
                                      <div className="text-xs text-gray-500 font-mono">{product.internalCode}</div>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-600">
                                      {product.provider}
                                  </td>
                                  <td className={`px-6 py-4 text-center font-bold bg-gray-50/50 ${isCritical ? 'text-red-600' : 'text-yellow-600'}`}>
                                      {product.stock}
                                      {isCritical && <span className="block text-[9px] uppercase font-normal text-red-500">Crítico</span>}
                                  </td>
                                  <td className="px-6 py-4 text-center text-sm text-gray-600">
                                      {product.reorderPoint}
                                  </td>
                                  <td className="px-6 py-4 text-center text-sm text-gray-600">
                                      {product.desiredStock}
                                  </td>
                                  <td className="px-6 py-4 text-center font-bold text-indigo-700 bg-indigo-50/50 border-l border-indigo-50 text-lg">
                                      {quantityToOrder}
                                  </td>
                              </tr>
                          )
                      })}
                      {shortages.length === 0 && (
                          <tr>
                              <td colSpan={7} className="p-12 text-center text-gray-400">
                                  <CheckSquare size={48} className="mx-auto mb-4 text-green-200"/>
                                  <p className="text-lg font-medium text-gray-600">¡Todo en orden!</p>
                                  <p className="text-sm">No hay artículos por debajo del punto de pedido.</p>
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
