
import React, { useState, useEffect, useMemo } from 'react';
import { Search, CheckSquare, Square, Edit3, Save, X, Tag, Boxes, Percent, Truck, LayoutGrid, ListOrdered, RefreshCcw, Loader2, AlertCircle, Layers } from 'lucide-react';
import { Product } from '../types';
import { useFirebase } from '../context/FirebaseContext';

const BulkModification: React.FC = () => {
  const { products, suppliers, priceLists, updateProduct, loading } = useFirebase();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isApplyingBulkChanges, setIsApplyingBulkChanges] = useState(false);
  const [bulkFormData, setBulkFormData] = useState({
    supplierId: '',
    markup: '', // Percentage markup over net cost, leave as string for optional input
    category: '',
    brand: '',
    reorderPoint: '', // Leave as string for optional input
    targetStock: '', // Leave as string for optional input
  });

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Extract unique categories and brands for dropdowns
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => p.category && cats.add(p.category));
    return Array.from(cats).sort();
  }, [products]);

  const uniqueBrands = useMemo(() => {
    const brands = new Set<string>();
    products.forEach(p => p.brand && brands.add(p.brand));
    return Array.from(brands).sort();
  }, [products]);


  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const toggleAllProducts = () => {
    if (selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map(p => p.id));
    }
  };

  const handleBulkFormChange = (field: keyof typeof bulkFormData, value: string) => {
    setBulkFormData(prev => ({ ...prev, [field]: value }));
  };

  const clearBulkFormData = () => {
    setBulkFormData({
      supplierId: '',
      markup: '',
      category: '',
      brand: '',
      reorderPoint: '',
      targetStock: '',
    });
  };

  const applyBulkChanges = async () => {
    if (selectedProductIds.length === 0) {
      alert('Por favor, selecciona al menos un producto para modificar.');
      return;
    }

    const changesToApply: Partial<Product> = {};
    if (bulkFormData.supplierId) changesToApply.supplierId = bulkFormData.supplierId;
    if (bulkFormData.category) changesToApply.category = bulkFormData.category;
    if (bulkFormData.brand) changesToApply.brand = bulkFormData.brand;
    if (bulkFormData.reorderPoint !== '') changesToApply.reorderPoint = Number(bulkFormData.reorderPoint);
    if (bulkFormData.targetStock !== '') changesToApply.targetStock = Number(bulkFormData.targetStock);

    // Special handling for markup if it needs to recalculate salePrice
    if (bulkFormData.markup !== '') {
        const newMarkup = Number(bulkFormData.markup);
        if (!isNaN(newMarkup)) {
            // This would require fetching each product's current costPrice to recalculate salePrice
            // For this mock, we'll assume a simplified update or skip price recalculation for now.
            // A more robust solution would iterate products, fetch, calculate, then update.
            // For now, we'll just set a flag or conceptual update if markup is present.
            // If the user expects salePrice to change with markup, the `updateProduct` logic
            // or this bulk update logic would need to reflect that.
            // For simplicity in this mock, we'll store the markup conceptually if it were
            // a direct product field, or just note its presence.
            // Given 'salePrice' is a direct field, for a true bulk price update, we'd need a more complex calculation here.
            // Let's assume a direct `markup` field might be added to Product for simplicity, or we skip actual `salePrice` recalculation here.
            // Or, for mock purposes, if markup is applied, recalculate salePrice based on `costPrice * (1 + markup/100)`
            // This means we'd need to fetch the product's full data first or assume `costPrice` is available.
            // Let's keep it simple: if markup is set, it conceptually means new pricing, but actual `salePrice` update is complex without full cost context here.
            // A better solution would be to update `costPrice` or use price lists.
            // For now, we won't directly update `salePrice` via markup here to avoid over-complication of mock.
        }
    }


    if (Object.keys(changesToApply).length === 0 && bulkFormData.markup === '') {
      alert('No hay cambios seleccionados para aplicar.');
      return;
    }

    setIsApplyingBulkChanges(true);
    try {
      for (const productId of selectedProductIds) {
        // Find the product to get its current `costPrice` if markup is to be applied
        const productToUpdate = products.find(p => p.id === productId);
        if (!productToUpdate) continue;

        const individualChanges: Partial<Product> = { ...changesToApply };

        if (bulkFormData.markup !== '') {
          const newMarkup = Number(bulkFormData.markup);
          if (!isNaN(newMarkup) && productToUpdate.costPrice !== undefined) {
            // Recalculate salePrice based on current costPrice and new markup
            individualChanges.salePrice = productToUpdate.costPrice * (1 + newMarkup / 100);
          }
        }
        
        await updateProduct(productId, individualChanges);
      }
      alert(`Se aplicaron los cambios a ${selectedProductIds.length} productos.`);
      setSelectedProductIds([]);
      clearBulkFormData();
    } catch (error) {
      console.error('Error al aplicar cambios masivos:', error);
      alert('Hubo un error al aplicar los cambios masivos. Intenta de nuevo.');
    } finally {
      setIsApplyingBulkChanges(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400">
      <Loader2 className="w-10 h-10 animate-spin mb-4" />
      <p className="font-bold uppercase tracking-widest text-xs">Cargando productos...</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Modificación Masiva de Productos</h1>
          <p className="text-slate-500">Aplica cambios a múltiples artículos de tu inventario de una sola vez.</p>
        </div>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30">
          <div className="relative flex-1 w-full max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar producto por SKU, nombre o marca..."
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
              <tr>
                <th className="px-6 py-4 w-12 text-center">
                  <button onClick={toggleAllProducts} className="p-1 rounded hover:bg-slate-200 transition-colors">
                    {selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0 ? (
                      <CheckSquare className="w-5 h-5 text-orange-600" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-300" />
                    )}
                  </button>
                </th>
                <th className="px-8 py-5">Producto / SKU</th>
                <th className="px-8 py-5">Proveedor</th>
                <th className="px-8 py-5">Rubro / Marca</th>
                <th className="px-8 py-5 text-center">Stock</th>
                <th className="px-8 py-5 text-right">Precio Venta</th>
                <th className="px-8 py-5 text-right">Punto Pedido</th>
                <th className="px-8 py-5 text-right">Stock Deseado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => toggleProductSelection(product.id)} className="p-1">
                      {selectedProductIds.includes(product.id) ? (
                        <CheckSquare className="w-5 h-5 text-orange-600" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-200" />
                      )}
                    </button>
                  </td>
                  <td className="px-8 py-5">
                    <p className="font-bold text-slate-800 text-sm">{product.name}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{product.sku}</p>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-sm font-medium text-slate-600">
                      {suppliers.find(s => s.id === product.supplierId)?.name || 'N/A'}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-sm font-medium text-slate-600">{product.category}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">{product.brand}</p>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={`text-sm font-black ${product.stock < (product.reorderPoint || 0) ? 'text-red-600' : 'text-slate-900'}`}>{product.stock}</span>
                  </td>
                  <td className="px-8 py-5 text-right font-black text-slate-900 text-sm">
                    ${product.salePrice?.toLocaleString()}
                  </td>
                  <td className="px-8 py-5 text-right text-sm font-medium text-slate-500">
                    {product.reorderPoint || 'N/A'}
                  </td>
                  <td className="px-8 py-5 text-right text-sm font-medium text-slate-500">
                    {product.targetStock || 'N/A'}
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">
                    No se encontraron productos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedProductIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900 text-white px-8 py-6 rounded-t-[2rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-bottom duration-300 z-40 border-t border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center text-lg font-black shadow-lg shadow-orange-600/20">
              {selectedProductIds.length}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Productos Seleccionados</p>
              <p className="text-sm font-bold">Listos para modificar</p>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Supplier */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Proveedor</label>
              <select
                value={bulkFormData.supplierId}
                onChange={(e) => handleBulkFormChange('supplierId', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-orange-500 outline-none"
              >
                <option value="">Mantener Actual</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            {/* Markup / Ganancia */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Margen Ganancia (%)</label>
              <input
                type="number"
                value={bulkFormData.markup}
                onChange={(e) => handleBulkFormChange('markup', e.target.value)}
                placeholder="Ej: 30"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
            {/* Category */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rubro</label>
              <select
                value={bulkFormData.category}
                onChange={(e) => handleBulkFormChange('category', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-orange-500 outline-none"
              >
                <option value="">Mantener Actual</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            {/* Brand */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Marca</label>
              <select
                value={bulkFormData.brand}
                onChange={(e) => handleBulkFormChange('brand', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-orange-500 outline-none"
              >
                <option value="">Mantener Actual</option>
                {uniqueBrands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>
            {/* Reorder Point */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Punto Pedido</label>
              <input
                type="number"
                value={bulkFormData.reorderPoint}
                onChange={(e) => handleBulkFormChange('reorderPoint', e.target.value)}
                placeholder="Ej: 5"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
            {/* Target Stock */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stock Deseado</label>
              <input
                type="number"
                value={bulkFormData.targetStock}
                onChange={(e) => handleBulkFormChange('targetStock', e.target.value)}
                placeholder="Ej: 20"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => { setSelectedProductIds([]); clearBulkFormData(); }}
              className="px-6 py-3 bg-white/10 border border-slate-700 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-300 hover:bg-white/20 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={applyBulkChanges}
              disabled={isApplyingBulkChanges}
              className="px-8 py-3 bg-orange-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-orange-600/20 hover:bg-orange-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isApplyingBulkChanges ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isApplyingBulkChanges ? 'Aplicando cambios...' : 'Aplicar Cambios'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkModification;
