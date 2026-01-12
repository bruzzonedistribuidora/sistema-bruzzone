
import React, { useState, useMemo, useEffect } from 'react';
import { 
    Search, ShoppingBag, X, Plus, Minus, 
    ArrowRight, MessageCircle, Star, Sparkles,
    ChevronRight, Zap, Package, ArrowLeft,
    Trash2, RefreshCw, ShoppingCart, Globe
} from 'lucide-react';
import { Product, SalesOrder, CompanyConfig, Category } from '../types';
import { productDB } from '../services/storageService';

const Shop: React.FC = () => {
    const [view, setView] = useState<'HOME' | 'CATALOG' | 'CART' | 'SUCCESS'>('HOME');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
    const [isLoading, setIsLoading] = useState(false);
    
    const [cart, setCart] = useState<{product: Product, quantity: number}[]>(() => {
        const saved = localStorage.getItem('ferreshop_cart');
        return saved ? JSON.parse(saved) : [];
    });
    
    const [products, setProducts] = useState<Product[]>([]);
    const [categories] = useState<Category[]>(() => JSON.parse(localStorage.getItem('ferrecloud_categories') || '[]'));
    
    const companyConfig: CompanyConfig = useMemo(() => {
        const saved = localStorage.getItem('company_config');
        return saved ? JSON.parse(saved) : { 
            fantasyName: 'Ferretería Bruzzone', 
            slogan: 'Calidad en cada herramienta',
            whatsappNumber: '5491144556677'
        };
    }, []);

    const loadProducts = async () => {
        setIsLoading(true);
        try {
            const shopItems = await productDB.getPublished();
            setProducts(shopItems);
        } catch (error) {
            console.error("Error shop:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    useEffect(() => {
        localStorage.setItem('ferreshop_cart', JSON.stringify(cart));
    }, [cart]);

    const filteredCatalog = useMemo(() => {
        return products.filter(p => {
            const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                               p.internalCodes.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchCat = selectedCategory === 'TODOS' || p.category === selectedCategory;
            return matchSearch && matchCat;
        });
    }, [products, searchTerm, selectedCategory]);

    const addToCart = (product: Product, qty: number = 1) => {
        setCart(prev => {
            const exists = prev.find(item => item.product.id === product.id);
            if (exists) {
                return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + qty } : item);
            }
            return [...prev, { product, quantity: qty }];
        });
    };

    const cartTotal = useMemo(() => cart.reduce((acc, curr) => {
        const price = curr.product.ecommerce?.isOffer ? (curr.product.ecommerce.offerPrice || curr.product.priceFinal) : curr.product.priceFinal;
        return acc + (price * curr.quantity);
    }, 0), [cart]);

    const sendOrderWhatsApp = () => {
        const orderId = `WEB-${Date.now().toString().slice(-4)}`;
        const waMsg = `*NUEVO PEDIDO WEB #${orderId}*\n\nTotal: $${cartTotal.toLocaleString()}\n\n*Detalle:*\n${cart.map(i => `- ${i.quantity}x ${i.product.name}`).join('\n')}\n\n_Por favor, confírmenme el pedido._`;
        window.open(`https://wa.me/${companyConfig.whatsappNumber?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waMsg)}`, '_blank');
        setCart([]);
        setView('SUCCESS');
    };

    return (
        <div className="h-full bg-white font-sans text-slate-900 overflow-hidden flex flex-col">
            <nav className="h-16 border-b border-slate-100 px-6 flex justify-between items-center shrink-0 bg-white/80 backdrop-blur-md z-50">
                <div onClick={() => setView('HOME')} className="flex items-center gap-2 cursor-pointer">
                    <Zap className="text-indigo-600" size={20} fill="currentColor"/>
                    <h1 className="font-black text-sm uppercase tracking-tighter">{companyConfig.fantasyName}</h1>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('CART')} className="relative p-2 text-slate-600">
                        <ShoppingBag size={20}/>
                        {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">{cart.length}</span>}
                    </button>
                    <button onClick={() => setView('CATALOG')} className="bg-slate-900 text-white px-4 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg">Tienda</button>
                </div>
            </nav>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {view === 'HOME' && (
                    <div className="animate-fade-in p-8 space-y-12">
                        <div className="bg-indigo-600 rounded-[3rem] p-12 text-white relative overflow-hidden text-center">
                            <div className="absolute top-0 right-0 p-10 opacity-10"><Sparkles size={120}/></div>
                            <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">Herramientas Profesionales</h2>
                            <p className="text-indigo-100 max-w-xl mx-auto mb-8 font-medium">Sincronización directa con nuestro stock real de mostrador.</p>
                            <button onClick={() => setView('CATALOG')} className="bg-white text-indigo-600 px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Ver Catálogo Completo</button>
                        </div>
                    </div>
                )}

                {view === 'CATALOG' && (
                    <div className="p-6 space-y-6 animate-fade-in pb-20">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                                <input type="text" placeholder="BUSCAR POR NOMBRE O SKU..." className="w-full pl-12 p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl font-bold uppercase text-sm outline-none transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            </div>
                            <select className="bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-4 font-black uppercase text-xs" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                                <option value="TODOS">Todas las categorías</option>
                                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>

                        {isLoading ? (
                            <div className="py-20 text-center"><RefreshCw className="animate-spin mx-auto text-indigo-500" size={32}/></div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {filteredCatalog.map(p => (
                                    <div key={p.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all p-6 flex flex-col group">
                                        <div className="h-40 bg-slate-50 rounded-2xl mb-4 flex items-center justify-center relative overflow-hidden">
                                            {p.ecommerce?.imageUrl ? (
                                                <img src={p.ecommerce.imageUrl} className="w-full h-full object-cover" alt={p.name} />
                                            ) : (
                                                <Package className="text-slate-200" size={48} strokeWidth={1} />
                                            )}
                                            {p.ecommerce?.isOffer && <span className="absolute top-3 left-3 bg-orange-500 text-white text-[8px] font-black uppercase px-2 py-1 rounded-full shadow-lg">Oferta</span>}
                                        </div>
                                        <h4 className="font-black uppercase text-xs text-slate-800 leading-tight mb-2 h-8 overflow-hidden">{p.name}</h4>
                                        <p className="text-[10px] text-indigo-500 font-bold uppercase mb-4">{p.brand}</p>
                                        <div className="mt-auto flex justify-between items-center pt-4 border-t border-slate-50">
                                            <p className="text-xl font-black text-slate-900 tracking-tighter">${p.priceFinal.toLocaleString()}</p>
                                            <button onClick={() => addToCart(p)} className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg active:scale-90 transition-all"><Plus size={18}/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {view === 'CART' && (
                    <div className="max-w-2xl mx-auto p-8 animate-fade-in space-y-8">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setView('CATALOG')} className="p-2 bg-slate-100 rounded-xl"><ArrowLeft size={20}/></button>
                            <h2 className="text-2xl font-black uppercase tracking-tighter">Mi Carrito</h2>
                        </div>
                        {cart.length === 0 ? (
                            <div className="py-20 text-center text-slate-300 uppercase font-black tracking-widest opacity-20"><ShoppingBag size={64} className="mx-auto mb-4"/> Carrito Vacío</div>
                        ) : (
                            <div className="space-y-4">
                                {cart.map(item => (
                                    <div key={item.product.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                        <div className="flex-1">
                                            <p className="text-xs font-black uppercase text-slate-800">{item.product.name}</p>
                                            <p className="text-[10px] font-bold text-indigo-600">${item.product.priceFinal.toLocaleString()}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => setCart(prev => prev.map(i => i.product.id === item.product.id ? {...i, quantity: Math.max(1, i.quantity - 1)} : i))} className="p-1"><Minus size={14}/></button>
                                            <span className="font-black text-sm">{item.quantity}</span>
                                            <button onClick={() => setCart(prev => prev.map(i => i.product.id === item.product.id ? {...i, quantity: i.quantity + 1} : i))} className="p-1"><Plus size={14}/></button>
                                            <button onClick={() => setCart(prev => prev.filter(i => i.product.id !== item.product.id))} className="ml-4 text-red-400"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                ))}
                                <div className="pt-8 border-t space-y-6">
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Estimado</span>
                                        <span className="text-4xl font-black text-slate-900 tracking-tighter">${cartTotal.toLocaleString()}</span>
                                    </div>
                                    <button onClick={sendOrderWhatsApp} className="w-full bg-green-600 text-white py-6 rounded-3xl font-black uppercase tracking-widest text-sm shadow-xl flex items-center justify-center gap-3">
                                        <MessageCircle size={24} fill="currentColor"/> Enviar Pedido por WhatsApp
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {view === 'SUCCESS' && (
                    <div className="h-full flex flex-col items-center justify-center p-10 text-center space-y-6 animate-fade-in">
                        <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center"><ShoppingCart size={40}/></div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter">¡Pedido en Camino!</h2>
                        <p className="text-slate-400 font-medium max-w-xs">Hemos recibido tu pedido. En breve nos contactaremos para coordinar el envío.</p>
                        <button onClick={() => setView('HOME')} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest">Cerrar</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Shop;
