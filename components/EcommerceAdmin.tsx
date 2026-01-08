
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
    Globe, Search, Star, Percent,
    Eye, EyeOff, Package, Camera, Upload, X, Image as ImageIcon,
    LayoutGrid, List, CheckCircle2, TrendingUp, Sparkles, Filter,
    RefreshCw, Tag, ChevronUp, ChevronDown, FolderOpen, 
    ArrowRight, ShoppingBag, Plus, Trash2, Layers, Check,
    // Fix: Added missing DollarSign import from lucide-react
    DollarSign
} from 'lucide-react';
import { Product } from '../types';
import { productDB } from '../services/storageService';

type EcommerceFolder = 'ALL' | 'PUBLISHED' | 'OFFERS' | 'FEATURED';

const EcommerceAdmin: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [activeFolder, setActiveFolder] = useState<EcommerceFolder>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    const loadProducts = async () => {
        const all = await productDB.getAll();
        setProducts(all);
    };

    useEffect(() => {
        loadProducts();
        window.addEventListener('ferrecloud_products_updated', loadProducts);
        return () => window.removeEventListener('ferrecloud_products_updated', loadProducts);
    }, []);

    const stats = useMemo(() => ({
        total: products.length,
        published: products.filter(p => p.ecommerce?.isPublished).length,
        offers: products.filter(p => p.ecommerce?.isOffer).length,
        featured: products.filter(p => p.ecommerce?.isFeatured).length
    }), [products]);

    const filteredAndSorted = useMemo(() => {
        let items = products.filter(p => {
            const matchesSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                                (p.internalCodes || []).some(c => c.toLowerCase().includes(searchTerm.toLowerCase()));
            
            if (activeFolder === 'PUBLISHED') return matchesSearch && p.ecommerce?.isPublished;
            if (activeFolder === 'OFFERS') return matchesSearch && p.ecommerce?.isOffer;
            if (activeFolder === 'FEATURED') return matchesSearch && p.ecommerce?.isFeatured;
            return matchesSearch;
        });

        items.sort((a, b) => {
            let aValue: any;
            let bValue: any;

            switch (sortConfig.key) {
                case 'name':
                    aValue = (a.name || '').toLowerCase();
                    bValue = (b.name || '').toLowerCase();
                    break;
                case 'price':
                    aValue = a.priceFinal || 0;
                    bValue = b.priceFinal || 0;
                    break;
                case 'stock':
                    aValue = a.stock || 0;
                    bValue = b.stock || 0;
                    break;
                default:
                    aValue = ''; bValue = '';
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return items.slice(0, 150); // Límite para rendimiento
    }, [products, searchTerm, activeFolder, sortConfig]);

    const handleUpdateProduct = async (id: string, updates: any) => {
        const product = products.find(p => p.id === id);
        if (!product) return;
        
        const updated = { 
            ...product, 
            ecommerce: { ...(product.ecommerce || {}), ...updates } 
        };
        
        await productDB.save(updated);
        // Actualizar estado local inmediatamente para respuesta visual rápida
        setProducts(prev => prev.map(p => p.id === id ? updated : p));
    };

    const handleImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64 = event.target?.result as string;
            await handleUpdateProduct(id, { imageUrl: base64 });
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="flex h-full bg-slate-100 font-sans overflow-hidden animate-fade-in">
            
            {/* SIDEBAR DE CARPETAS */}
            <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0">
                <div className="p-6 border-b border-slate-100 bg-slate-900 text-white">
                    <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                        <Globe className="text-indigo-400" size={24}/> Catálogo Web
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Administrador de Visibilidad</p>
                </div>

                <div className="p-4 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-4">Carpetas Inteligentes</p>
                    
                    <FolderBtn 
                        active={activeFolder === 'ALL'} 
                        onClick={() => setActiveFolder('ALL')} 
                        icon={List} 
                        label="Todo el Catálogo" 
                        count={stats.total} 
                        color="text-slate-500"
                    />
                    <FolderBtn 
                        active={activeFolder === 'PUBLISHED'} 
                        onClick={() => setActiveFolder('PUBLISHED')} 
                        icon={Globe} 
                        label="Escaparate Web" 
                        count={stats.published} 
                        color="text-indigo-600"
                    />
                    <FolderBtn 
                        active={activeFolder === 'OFFERS'} 
                        onClick={() => setActiveFolder('OFFERS')} 
                        icon={Percent} 
                        label="Carpeta de Ofertas" 
                        count={stats.offers} 
                        color="text-orange-500"
                    />
                    <FolderBtn 
                        active={activeFolder === 'FEATURED'} 
                        onClick={() => setActiveFolder('FEATURED')} 
                        icon={Star} 
                        label="Carpeta Destacados" 
                        count={stats.featured} 
                        color="text-yellow-500"
                    />

                    <div className="pt-8 mt-8 border-t border-slate-100">
                        <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100">
                            <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Sparkles size={14}/> Sincronización
                            </h4>
                            <p className="text-[11px] text-indigo-700 leading-relaxed font-medium">Todos los cambios realizados aquí impactan automáticamente en la **Tienda Online** y el **Portal de Clientes**.</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-200">
                    <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all">
                        <RefreshCw size={14}/> Sincronizar Nube
                    </button>
                </div>
            </aside>

            {/* CONTENIDO PRINCIPAL */}
            <main className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-hidden">
                <div className="p-6 bg-white border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
                    <div className="relative flex-1 group w-full max-w-xl">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={20}/>
                        <input 
                            type="text" 
                            placeholder="Buscar artículo en esta carpeta..." 
                            className="w-full pl-12 pr-6 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-100 shadow-inner transition-all uppercase"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button className="p-3.5 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 shadow-sm transition-all"><Filter size={20}/></button>
                        <button className="p-3.5 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 shadow-sm transition-all"><RefreshCw size={20}/></button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden p-6">
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-slate-900 text-[9px] font-black text-slate-300 uppercase tracking-widest sticky top-0 z-10">
                                    <tr>
                                        <th className="px-8 py-5">Visual / Imagen</th>
                                        <th className="px-4 py-5">Identificación / Nombre</th>
                                        <th className="px-4 py-5 text-right">Precio Actual</th>
                                        <th className="px-4 py-5 text-center">Carpeta Web</th>
                                        <th className="px-8 py-5 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredAndSorted.map(p => (
                                        <tr key={p.id} className={`hover:bg-slate-50 transition-colors group ${p.ecommerce?.isPublished ? 'bg-indigo-50/5' : ''}`}>
                                            <td className="px-8 py-4">
                                                <input 
                                                    type="file" 
                                                    ref={el => { fileInputRefs.current[p.id] = el; }}
                                                    className="hidden" 
                                                    accept="image/*"
                                                    onChange={(e) => handleImageUpload(p.id, e)}
                                                />
                                                <div 
                                                    onClick={() => fileInputRefs.current[p.id]?.click()}
                                                    className={`w-20 h-20 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${p.ecommerce?.imageUrl ? 'border-white bg-white shadow-md' : 'border-slate-200 bg-slate-50 hover:border-indigo-400'}`}
                                                >
                                                    {p.ecommerce?.imageUrl ? (
                                                        <img src={p.ecommerce.imageUrl} className="w-full h-full object-cover" alt={p.name} />
                                                    ) : (
                                                        <Camera className="text-slate-300 group-hover:scale-110 transition-transform" size={24}/>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <h4 className="font-black text-slate-800 uppercase text-xs tracking-tight leading-tight mb-1 truncate max-w-[350px]">{p.name || 'SIN NOMBRE'}</h4>
                                                <div className="flex gap-2 items-center">
                                                    <p className="text-[9px] font-mono font-bold text-indigo-500 uppercase bg-indigo-50 px-1.5 py-0.5 rounded">SKU: {p.internalCodes[0]}</p>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{p.brand}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <div className="flex flex-col items-end gap-1">
                                                    <div className="flex items-center gap-2">
                                                        {/* Fix: Added missing DollarSign import from lucide-react */}
                                                        <DollarSign size={14} className="text-slate-300"/>
                                                        <input 
                                                            type="number" 
                                                            className={`w-32 p-2.5 rounded-xl text-right text-xs font-black outline-none border-2 transition-all ${p.ecommerce?.isOffer ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-slate-50 border-slate-100 text-slate-900'}`}
                                                            value={p.ecommerce?.isOffer ? (p.ecommerce?.offerPrice || 0) : p.priceFinal}
                                                            readOnly={!p.ecommerce?.isOffer}
                                                            onChange={e => handleUpdateProduct(p.id, { offerPrice: parseFloat(e.target.value) || 0 })}
                                                        />
                                                    </div>
                                                    {p.ecommerce?.isOffer && (
                                                        <span className="text-[9px] text-slate-400 line-through font-black">Normal: ${p.priceFinal.toLocaleString()}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <QuickBadge 
                                                        active={p.ecommerce?.isPublished} 
                                                        onClick={() => handleUpdateProduct(p.id, { isPublished: !p.ecommerce?.isPublished })} 
                                                        label="Web" 
                                                        icon={Globe}
                                                        color="indigo"
                                                    />
                                                    <QuickBadge 
                                                        active={p.ecommerce?.isOffer} 
                                                        onClick={() => handleUpdateProduct(p.id, { isOffer: !p.ecommerce?.isOffer, offerPrice: !p.ecommerce?.isOffer ? Math.round(p.priceFinal * 0.85) : null })} 
                                                        label="Oferta" 
                                                        icon={Percent}
                                                        color="orange"
                                                    />
                                                    <QuickBadge 
                                                        active={p.ecommerce?.isFeatured} 
                                                        onClick={() => handleUpdateProduct(p.id, { isFeatured: !p.ecommerce?.isFeatured })} 
                                                        label="Top" 
                                                        icon={Star}
                                                        color="yellow"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-8 py-4 text-center">
                                                <button 
                                                    onClick={() => window.open(`/shop/product/${p.id}`, '_blank')}
                                                    className="p-3 bg-white text-slate-400 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm border border-slate-100">
                                                    <Eye size={18}/>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredAndSorted.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-40 text-center">
                                                <FolderOpen size={64} className="mx-auto mb-4 text-slate-200" strokeWidth={1} />
                                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Esta carpeta está vacía</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="flex -space-x-2">
                                    {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full bg-slate-300 border-2 border-white"></div>)}
                                </div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mostrando resultados parciales para optimizar carga</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Carpeta</p>
                                <p className="text-lg font-black text-slate-800">{filteredAndSorted.length} SKUs</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

// --- COMPONENTES ATÓMICOS ---

const FolderBtn: React.FC<{ active: boolean, onClick: () => void, icon: any, label: string, count: number, color: string }> = ({ active, onClick, icon: Icon, label, count, color }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center justify-between p-4 rounded-[1.5rem] transition-all group ${active ? 'bg-slate-900 text-white shadow-2xl scale-[1.02]' : 'hover:bg-slate-50 text-slate-500'}`}
    >
        <div className="flex items-center gap-4">
            <div className={`p-2.5 rounded-xl ${active ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-white'} transition-colors`}>
                <Icon size={18}/>
            </div>
            <span className={`text-[11px] font-black uppercase tracking-tight ${active ? 'text-white' : 'text-slate-600'}`}>{label}</span>
        </div>
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${active ? 'bg-white/10 border-white/20 text-indigo-300' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
            {count.toLocaleString()}
        </span>
    </button>
);

const QuickBadge: React.FC<{ active: boolean, onClick: () => void, label: string, icon: any, color: 'indigo' | 'orange' | 'yellow' }> = ({ active, onClick, label, icon: Icon, color }) => {
    const colors = {
        indigo: active ? 'bg-indigo-600 text-white border-indigo-400 shadow-indigo-100' : 'text-slate-300 border-slate-100',
        orange: active ? 'bg-orange-500 text-white border-orange-400 shadow-orange-100' : 'text-slate-300 border-slate-100',
        yellow: active ? 'bg-yellow-400 text-slate-900 border-yellow-500 shadow-yellow-100' : 'text-slate-300 border-slate-100'
    };

    return (
        <button 
            onClick={onClick}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-black text-[8px] uppercase tracking-widest transition-all ${colors[color]} ${active ? 'shadow-lg' : 'hover:border-slate-300'}`}
        >
            <Icon size={10} className={active && color === 'yellow' ? 'fill-slate-900' : ''}/>
            {label}
            {active && <Check size={8} strokeWidth={4}/>}
        </button>
    );
};

export default EcommerceAdmin;
