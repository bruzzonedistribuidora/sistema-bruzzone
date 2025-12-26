
import React, { useState, useMemo } from 'react';
import { 
    Search, Save, X, Layers, CheckCircle, Trash2, Filter, 
    ArrowRight, Info, AlertTriangle, Package, Tag, Building2, 
    Percent, DollarSign, Image as ImageIcon, Scale, RefreshCw, Smartphone, Plus
} from 'lucide-react';
import { Product, Brand, Category, Provider } from '../types';

const MassProductUpdate: React.FC = () => {
    const [products, setProducts] = useState<Product[]>(() => {
        const saved = localStorage.getItem('ferrecloud_products');
        return saved ? JSON.parse(saved) : [];
    });

    const [brands] = useState<Brand[]>(() => JSON.parse(localStorage.getItem('ferrecloud_brands') || '[]'));
    const [categories] = useState<Category[]>(() => JSON.parse(localStorage.getItem('ferrecloud_categories') || '[]'));
    const [providers] = useState<Provider[]>(() => JSON.parse(localStorage.getItem('ferrecloud_providers') || '[]'));

    const [searchFilters, setSearchFilters] = useState({
        name: '', code: '', brandId: '', categoryId: '', providerId: '', currency: '', syncOnline: false, hasImage: false, withStock: false, useScale: false, isActive: true
    });

    const [changeAttributes, setChangeAttributes] = useState({
        brand: '', category: '', provider: '', purchaseCurrency: '', vatRate: '' as any, reorderPoint: '', desiredStock: ''
    });

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const searchTermName = searchFilters.name.toLowerCase().trim();
            const searchTermCode = searchFilters.code.toLowerCase().trim();
            const matchName = !searchTermName || p.name.toLowerCase().includes(searchTermName);
            const matchCode = !searchTermCode || 
                p.internalCodes.some(c => c.toLowerCase().includes(searchTermCode)) ||
                p.providerCodes.some(c => c.toLowerCase().includes(searchTermCode)) ||
                p.barcodes.some(c => c.toLowerCase().includes(searchTermCode));
            return matchName && matchCode;
        });
    }, [products, searchFilters]);

    const [stagedChanges, setStagedChanges] = useState<Record<string, Partial<Product>>>({});

    const handleSaveChanges = () => {
        const updatedMaster = products.map(p => stagedChanges[p.id] ? { ...p, ...stagedChanges[p.id] } : p);
        setProducts(updatedMaster);
        localStorage.setItem('ferrecloud_products', JSON.stringify(updatedMaster));
        setStagedChanges({});
        alert("Cambios guardados.");
    };

    return (
        <div className="p-4 h-full flex flex-col space-y-4 bg-[#D4D4D4] overflow-hidden font-sans text-slate-800">
            <div className="bg-[#333333] text-white p-2 text-center shrink-0">
                <h2 className="text-sm font-black uppercase tracking-[0.3em]">Modificaciones Masivas</h2>
            </div>
            {/* ... Filters ... */}
            <div className="flex-1 bg-white border border-gray-400 rounded shadow-inner overflow-hidden flex flex-col">
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[1200px]">
                        <thead className="bg-[#333333] text-white text-[10px] font-bold uppercase sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-2 border-r border-gray-600">Codigo Principal</th>
                                <th className="px-4 py-2 border-r border-gray-600">Nombre</th>
                                <th className="px-4 py-2 border-r border-gray-600 text-center">Stock</th>
                                <th className="px-4 py-2 border-r border-gray-600">Marca</th>
                                <th className="px-4 py-2">Proveedor</th>
                            </tr>
                        </thead>
                        <tbody className="text-[11px] font-medium text-slate-700 divide-y divide-gray-200">
                            {filteredProducts.map(p => (
                                <tr key={p.id}>
                                    <td className="px-4 py-2 border-r border-gray-100 font-mono font-bold">{p.internalCodes[0]}</td>
                                    <td className="px-4 py-2 border-r border-gray-100 uppercase">{p.name}</td>
                                    <td className="px-4 py-2 border-r border-gray-100 text-center">{p.stock}</td>
                                    <td className="px-4 py-2 border-r border-gray-100 uppercase">{p.brand}</td>
                                    <td className="px-4 py-2 uppercase">{p.provider}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="p-2 flex justify-end gap-2 bg-[#E9E9E9]">
                <button onClick={handleSaveChanges} className="bg-slate-900 text-white px-8 py-2 rounded text-[10px] font-black uppercase">Guardar Cambios</button>
            </div>
        </div>
    );
};

export default MassProductUpdate;
