
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
    Globe, Search, Star, Percent,
    Eye, EyeOff, Package, Camera, Upload, X, Image as ImageIcon,
    LayoutGrid, List, CheckCircle2, TrendingUp, Sparkles, Filter,
    RefreshCw, Tag
} from 'lucide-react';
import { Product } from '../types';
import { productDB } from '../services/storageService';

const EcommerceAdmin: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterMode, setFilterMode] = useState<'ALL' | 'PUBLISHED' | 'OFFERS' | 'FEATURED'>('ALL');
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

    const filtered = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                                (p.internalCodes || []).some(c => c.toLowerCase().includes(searchTerm.toLowerCase()));
            if (filterMode === 'PUBLISHED') return matchesSearch && p.ecommerce?.isPublished;
            if (filterMode === 'OFFERS') return matchesSearch && p.ecommerce?.isOffer;
            if (filterMode === 'FEATURED') return matchesSearch && p.ecommerce?.isFeatured;
            return matchesSearch;
        }).sort((a, b) => (b.ecommerce?.isPublished ? 1 : 0) - (a.ecommerce?.isPublished ? 1 : 0)).slice(0, 100);
    }, [products, searchTerm, filterMode]);

    const stats = useMemo(() => ({
        total: products.length,
        published: products.filter(p => p.ecommerce?.isPublished).length,
        offers: products.filter(p => p.ecommerce?.isOffer).length,
        featured: products.filter(p => p.ecommerce?.isFeatured).length
    }), [products]);

    const handleUpdateProduct = async (id: string, updates: any) => {
        const product = products.find(p => p.id === id);
        if (!product) return;
        
        const updated = { 
            ...product, 
            ecommerce: { ...(product.ecommerce || {}), ...updates } 
        };
        
        await productDB.save(updated);
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
        <div className="p-6 h-full flex flex-col space-y-6 animate-fade-in bg-slate-50 overflow-hidden font-sans">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 shrink-0">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-slate-900 text-indigo-400 rounded-3xl shadow-xl"><Globe size={28}/></div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Gestión Tienda Online</h2>
                        <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] mt-1">Control de visibilidad y marketing</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    {[
                        { label: 'Visibles', val: stats.published, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                        { label: 'Ofertas', val: stats.offers, color: 'text-orange-500', bg: 'bg-orange-50' },
                        { label: 'Portada', val: stats.featured, color: 'text-yellow-500', bg: 'bg-yellow-50' }
                    ].map(st => (
                        <div key={st.label} className={`${st.bg} ${st.color} px-5 py-3 rounded-2xl border border-white shadow-sm text-center min-w-[100px]`}>
                            <p className="text-[8px] font-black uppercase mb-0.5 tracking-widest">{st.label}</p>
                            <p className="text-xl font-black tracking-tighter">{st.val}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-3 shrink-0 items-center">
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={18}/>
                    <input 
                        type="text" 
                        placeholder="Buscar artículo para publicar..." 
                        className="w-full pl-11 pr-6 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-indigo-100 shadow-sm transition-all uppercase"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex bg-white rounded-2xl p-1 shrink-0 w-full lg:w-auto shadow-sm border border-slate-200">
                    {[
                        { id: 'ALL', label: 'Todo', icon: List },
                        { id: 'PUBLISHED', label: 'Tienda', icon: Globe },
                        { id: 'OFFERS', label: 'Ofertas', icon: Percent },
                        { id: 'FEATURED', label: 'Portada', icon: Star }
                    ].map(btn => (
                        <button 
                            key={btn.id}
                            onClick={() => setFilterMode(btn.id as any)} 
                            className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${filterMode === btn.id ? 'bg-slate-900 text-white shadow-md' : 'text-gray-400 hover:text-slate-600'}`}>
                            <btn.icon size={12}/> {btn.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <div className="grid grid-cols-1 gap-4">
                        {filtered.map(p => (
                            <div key={p.id} className={`p-6 rounded-3xl border transition-all flex flex-col lg:flex-row items-center gap-6 ${p.ecommerce?.isPublished ? 'border-indigo-100 bg-indigo-50/10' : 'border-slate-100 bg-white opacity-60 hover:opacity-100'}`}>
                                <div className="shrink-0 relative">
                                    <input 
                                        type="file" 
                                        ref={el => { fileInputRefs.current[p.id] = el; }}
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(p.id, e)}
                                    />
                                    <div 
                                        onClick={() => fileInputRefs.current[p.id]?.click()}
                                        className={`w-28 h-28 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${p.ecommerce?.imageUrl ? 'border-white bg-white shadow-lg' : 'border-slate-200 bg-slate-50 hover:border-indigo-400'}`}
                                    >
                                        {p.ecommerce?.imageUrl ? (
                                            <img src={p.ecommerce.imageUrl} className="w-full h-full object-cover" alt={p.name} />
                                        ) : (
                                            <Camera className="text-slate-300" size={24}/>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-slate-800 uppercase text-sm tracking-tight leading-none mb-2 truncate">{p.name || 'SIN NOMBRE'}</h4>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[9px] font-mono font-bold text-slate-400">SKU: {p.internalCodes[0]}</span>
                                        <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                        <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{p.category || 'General'}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 gap-4 w-full lg:w-auto shrink-0 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6">
                                    <div className="flex flex-col items-center gap-1">
                                        <p className="text-[8px] font-black text-slate-400 uppercase">Tienda</p>
                                        <button 
                                            onClick={() => handleUpdateProduct(p.id, { isPublished: !p.ecommerce?.isPublished })}
                                            className={`p-3 rounded-xl transition-all ${p.ecommerce?.isPublished ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-300 hover:bg-slate-200'}`}>
                                            {p.ecommerce?.isPublished ? <CheckCircle2 size={18}/> : <EyeOff size={18}/>}
                                        </button>
                                    </div>

                                    <div className="flex flex-col items-center gap-1">
                                        <p className="text-[8px] font-black text-slate-400 uppercase">Oferta</p>
                                        <button 
                                            onClick={() => handleUpdateProduct(p.id, { isOffer: !p.ecommerce?.isOffer, offerPrice: !p.ecommerce?.isOffer ? (p.priceFinal * 0.9).toFixed(0) : null })}
                                            className={`p-3 rounded-xl transition-all ${p.ecommerce?.isOffer ? 'bg-orange-500 text-white shadow-lg' : 'bg-slate-100 text-slate-300 hover:bg-slate-200'}`}>
                                            <Percent size={18}/>
                                        </button>
                                    </div>

                                    <div className="flex flex-col items-center gap-1">
                                        <p className="text-[8px] font-black text-slate-400 uppercase">Portada</p>
                                        <button 
                                            onClick={() => handleUpdateProduct(p.id, { isFeatured: !p.ecommerce?.isFeatured })}
                                            className={`p-3 rounded-xl transition-all ${p.ecommerce?.isFeatured ? 'bg-yellow-400 text-slate-900 shadow-lg' : 'bg-slate-100 text-slate-300 hover:bg-slate-200'}`}>
                                            <Star size={18} className={p.ecommerce?.isFeatured ? 'fill-slate-900' : ''}/>
                                        </button>
                                    </div>

                                    <div className="flex flex-col gap-1 min-w-[110px]">
                                        <p className="text-[8px] font-black text-slate-400 uppercase">Precio Web</p>
                                        <input 
                                            type="number" 
                                            className={`w-full p-2.5 rounded-xl text-xs font-black outline-none border-2 transition-all ${p.ecommerce?.isOffer ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-slate-50 border-slate-100 text-slate-900'}`}
                                            value={p.ecommerce?.isOffer ? (p.ecommerce?.offerPrice || 0) : p.priceFinal}
                                            readOnly={!p.ecommerce?.isOffer}
                                            onChange={e => handleUpdateProduct(p.id, { offerPrice: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EcommerceAdmin;
