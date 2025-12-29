
import React, { useState, useMemo } from 'react';
import { 
    Globe, Search, Star, Percent,
    Eye, EyeOff, Package
} from 'lucide-react';
import { Product } from '../types';

const EcommerceAdmin: React.FC = () => {
    const [products, setProducts] = useState<Product[]>(() => 
        JSON.parse(localStorage.getItem('ferrecloud_products') || '[]')
    );
    const [searchTerm, setSearchTerm] = useState('');
    const [filterMode, setFilterMode] = useState<'ALL' | 'PUBLISHED' | 'OFFERS'>('ALL');

    const filtered = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                p.internalCodes.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()));
            if (filterMode === 'PUBLISHED') return matchesSearch && p.ecommerce?.isPublished;
            if (filterMode === 'OFFERS') return matchesSearch && p.ecommerce?.isOffer;
            return matchesSearch;
        });
    }, [products, searchTerm, filterMode]);

    const stats = useMemo(() => ({
        total: products.length,
        published: products.filter(p => p.ecommerce?.isPublished).length,
        offers: products.filter(p => p.ecommerce?.isOffer).length,
        featured: products.filter(p => p.ecommerce?.isFeatured).length
    }), [products]);

    const handleUpdateProduct = (id: string, updates: any) => {
        const newProducts = products.map(p => {
            if (p.id === id) {
                return { ...p, ecommerce: { ...(p.ecommerce || {}), ...updates } };
            }
            return p;
        });
        setProducts(newProducts);
        localStorage.setItem('ferrecloud_products', JSON.stringify(newProducts));
        window.dispatchEvent(new Event('storage'));
    };

    return (
        <div className="p-6 max-w-7xl mx-auto h-full flex flex-col space-y-6 animate-fade-in bg-slate-50 overflow-hidden">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-slate-900 text-indigo-400 rounded-3xl shadow-xl">
                        <Globe size={32}/>
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Administrador de Tienda</h2>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Gestiona qué artículos ven tus clientes en la web</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-100 text-center">
                        <p className="text-[8px] font-black text-slate-400 uppercase">Publicados</p>
                        <p className="text-lg font-black text-indigo-600">{stats.published}</p>
                    </div>
                    <div className="bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-100 text-center">
                        <p className="text-[8px] font-black text-slate-400 uppercase">En Oferta</p>
                        <p className="text-lg font-black text-orange-500">{stats.offers}</p>
                    </div>
                    <div className="bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-100 text-center">
                        <p className="text-[8px] font-black text-slate-400 uppercase">Destacados</p>
                        <p className="text-lg font-black text-yellow-500">{stats.featured}</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm shrink-0">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={18}/>
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre o SKU para publicar..." 
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-100 transition-all uppercase"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex bg-slate-100 rounded-2xl p-1 shrink-0">
                    <button onClick={() => setFilterMode('ALL')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${filterMode === 'ALL' ? 'bg-white text-slate-900 shadow-md' : 'text-gray-400'}`}>Todos</button>
                    <button onClick={() => setFilterMode('PUBLISHED')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${filterMode === 'PUBLISHED' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400'}`}>En Tienda</button>
                    <button onClick={() => setFilterMode('OFFERS')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${filterMode === 'OFFERS' ? 'bg-white text-orange-500 shadow-md' : 'text-gray-400'}`}>Ofertas</button>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <div className="grid grid-cols-1 gap-4">
                        {filtered.length === 0 ? (
                            <div className="py-24 text-center text-slate-300 font-black uppercase tracking-widest opacity-30">
                                <Package size={64} className="mx-auto mb-4"/>
                                Sin resultados
                            </div>
                        ) : filtered.map(p => (
                            <div key={p.id} className={`p-6 rounded-[2.5rem] border-2 transition-all flex flex-col md:flex-row items-center gap-6 ${p.ecommerce?.isPublished ? 'border-indigo-100 bg-indigo-50/20 shadow-sm' : 'border-slate-50 bg-white opacity-60 hover:opacity-100'}`}>
                                <div className="flex-1 flex items-center gap-6 min-w-0">
                                    <div className={`p-4 rounded-3xl shrink-0 ${p.ecommerce?.isPublished ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                        <Package size={28}/>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-black text-slate-800 uppercase text-lg leading-tight truncate">{p.name}</h4>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">{p.internalCodes[0]}</span>
                                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{p.brand}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto shrink-0">
                                    <div className="flex flex-col items-center gap-2">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Publicar</p>
                                        <button 
                                            onClick={() => handleUpdateProduct(p.id, { isPublished: !p.ecommerce?.isPublished })}
                                            className={`p-3 rounded-2xl transition-all ${p.ecommerce?.isPublished ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-300 hover:bg-indigo-50'}`}>
                                            {p.ecommerce?.isPublished ? <Eye size={20}/> : <EyeOff size={20}/>}
                                        </button>
                                    </div>

                                    <div className="flex flex-col items-center gap-2">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Oferta</p>
                                        <button 
                                            onClick={() => handleUpdateProduct(p.id, { isOffer: !p.ecommerce?.isOffer, offerPrice: !p.ecommerce?.isOffer ? p.priceFinal * 0.9 : null })}
                                            className={`p-3 rounded-2xl transition-all ${p.ecommerce?.isOffer ? 'bg-orange-500 text-white shadow-lg' : 'bg-slate-100 text-slate-300 hover:bg-orange-50'}`}>
                                            <Percent size={20}/>
                                        </button>
                                    </div>

                                    <div className="flex flex-col items-center gap-2">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Portada</p>
                                        <button 
                                            onClick={() => handleUpdateProduct(p.id, { isFeatured: !p.ecommerce?.isFeatured })}
                                            className={`p-3 rounded-2xl transition-all ${p.ecommerce?.isFeatured ? 'bg-yellow-400 text-slate-900 shadow-lg' : 'bg-slate-100 text-slate-300 hover:bg-yellow-50'}`}>
                                            <Star size={20} className={p.ecommerce?.isFeatured ? 'fill-slate-900' : ''}/>
                                        </button>
                                    </div>

                                    <div className="flex flex-col gap-1 min-w-[120px]">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Precio Web</p>
                                        <div className="relative">
                                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                            <input 
                                                type="number" 
                                                className={`w-full pl-6 p-2 rounded-xl text-xs font-black outline-none border transition-all ${p.ecommerce?.isOffer ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-slate-50 border-slate-100 text-slate-900'}`}
                                                value={p.ecommerce?.isOffer ? (p.ecommerce?.offerPrice || 0) : p.priceFinal}
                                                readOnly={!p.ecommerce?.isOffer}
                                                onChange={e => handleUpdateProduct(p.id, { offerPrice: parseFloat(e.target.value) })}
                                            />
                                        </div>
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
