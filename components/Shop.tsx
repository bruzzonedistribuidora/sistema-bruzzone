
import React, { useState, useMemo, useEffect } from 'react';
import { 
    Search, ShoppingBag, X, Plus, Minus, 
    ArrowRight, MessageCircle, Star, Sparkles,
    ChevronRight, Zap, Package, ArrowLeft,
    Trash2, RefreshCw, ShoppingCart, Globe,
    LayoutGrid, Tags, Heart, ShieldCheck,
    Truck, CreditCard, ChevronDown, CheckCircle2
} from 'lucide-react';
import { Product, CompanyConfig, Category } from '../types';
import { productDB } from '../services/storageService';
import { searchVirtualInventory } from '../services/geminiService';

const Shop: React.FC = () => {
    const [view, setView] = useState<'HOME' | 'CATALOG' | 'CART' | 'SUCCESS'>('HOME');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    
    const [cart, setCart] = useState<{product: Product, quantity: number}[]>(() => {
        const saved = localStorage.getItem('ferreshop_cart');
        return saved ? JSON.parse(saved) : [];
    });
    
    const [products, setProducts] = useState<Product[]>([]);
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [categories] = useState<Category[]>(() => JSON.parse(localStorage.getItem('ferrecloud_categories') || '[]'));
    
    const companyConfig: CompanyConfig = useMemo(() => {
        const saved = localStorage.getItem('company_config');
        return saved ? JSON.parse(saved) : { 
            fantasyName: 'Ferretería Bruzzone', 
            slogan: 'Calidad en cada herramienta',
            whatsappNumber: '5491144556677'
        };
    }, []);

    const loadInitialProducts = async () => {
        setIsLoading(true);
        try {
            const shopItems = await productDB.getPublished();
            setProducts(shopItems.slice(0, 12)); // Mostrar destacados iniciales
        } catch (error) {
            console.error("Error shop:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadInitialProducts();
    }, []);

    useEffect(() => {
        localStorage.setItem('ferreshop_cart', JSON.stringify(cart));
    }, [cart]);

    // Búsqueda en tiempo real contra los 140k artículos
    useEffect(() => {
        const search = async () => {
            if (searchTerm.trim().length < 3) {
                setSearchResults([]);
                return;
            }
            setIsSearching(true);
            try {
                // Buscamos en el motor virtual/IA que soporta la escala de 140k
                const results = await searchVirtualInventory(searchTerm);
                setSearchResults(results);
            } catch (err) {
                console.error(err);
            } finally {
                setIsSearching(false);
            }
        };
        const timer = setTimeout(search, 400);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const addToCart = (product: Product, qty: number = 1) => {
        setCart(prev => {
            const exists = prev.find(item => item.product.id === product.id);
            if (exists) {
                return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + qty } : item);
            }
            return [...prev, { product, quantity: qty }];
        });
    };

    const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.product.id !== id));

    const updateCartQty = (id: string, delta: number) => {
        setCart(prev => prev.map(item => 
            item.product.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
        ));
    };

    const cartTotal = useMemo(() => cart.reduce((acc, curr) => {
        const price = curr.product.ecommerce?.isOffer ? (curr.product.ecommerce.offerPrice || curr.product.priceFinal) : curr.product.priceFinal;
        return acc + (price * curr.quantity);
    }, 0), [cart]);

    const sendOrderWhatsApp = () => {
        const orderId = `WEB-${Date.now().toString().slice(-4)}`;
        let waMsg = `*🚀 NUEVO PEDIDO ONLINE #${orderId}*\n`;
        waMsg += `_Cliente desde la Tienda Web_\n`;
        waMsg += `----------------------------\n`;
        cart.forEach(i => {
            waMsg += `📦 *${i.quantity}x* ${i.product.name}\n`;
            waMsg += `   _Ref: ${i.product.internalCodes[0]}_\n`;
        });
        waMsg += `----------------------------\n`;
        waMsg += `*TOTAL ESTIMADO: $${cartTotal.toLocaleString('es-AR')}*\n\n`;
        waMsg += `_Por favor, confírmenme stock para retirar._`;

        window.open(`https://wa.me/${companyConfig.whatsappNumber?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waMsg)}`, '_blank');
        setCart([]);
        setView('SUCCESS');
    };

    return (
        <div className="h-full bg-slate-50 font-sans text-slate-900 overflow-hidden flex flex-col">
            
            {/* BARRA DE NAVEGACIÓN SUPERIOR (Sticky) */}
            <nav className="h-20 bg-white border-b border-slate-100 px-6 md:px-12 flex justify-between items-center shrink-0 z-[100] shadow-sm sticky top-0">
                <div onClick={() => setView('HOME')} className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 group-hover:rotate-12 transition-transform">
                        <Zap size={22} fill="currentColor"/>
                    </div>
                    <div>
                        <h1 className="font-black text-lg uppercase tracking-tighter leading-none">{companyConfig.fantasyName}</h1>
                        <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mt-0.5">Tienda Oficial</p>
                    </div>
                </div>

                <div className="hidden lg:flex items-center gap-8">
                    {['INICIO', 'HERRAMIENTAS', 'ELECTRICIDAD', 'PINTURERÍA', 'OFERTAS'].map(item => (
                        <button key={item} className="text-[10px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-[0.2em] transition-colors">{item}</button>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={() => setView('CART')} className="relative p-3 bg-slate-100 rounded-2xl text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all group">
                        <ShoppingBag size={22} className="group-hover:scale-110 transition-transform"/>
                        {cart.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce shadow-lg">
                                {cart.length}
                            </span>
                        )}
                    </button>
                    <button onClick={() => setView('CATALOG')} className="hidden md:flex bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all active:scale-95">
                        Ir al Catálogo
                    </button>
                </div>
            </nav>

            <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth">
                {view === 'HOME' && (
                    <div className="animate-fade-in pb-24">
                        {/* HERO BANNER SECTION */}
                        <div className="p-4 md:p-8">
                            <div className="bg-slate-900 rounded-[3.5rem] p-12 md:p-24 text-white relative overflow-hidden flex flex-col items-center text-center shadow-3xl">
                                <div className="absolute top-0 right-0 p-10 opacity-10"><Sparkles size={300}/></div>
                                <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-600/20 blur-[100px] rounded-full"></div>
                                
                                <div className="relative z-10 space-y-8 max-w-4xl">
                                    <div className="inline-flex items-center gap-3 bg-white/10 px-6 py-2 rounded-full border border-white/10 backdrop-blur-md">
                                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                                        <span className="text-[10px] font-black uppercase tracking-widest">Sincronización de Stock en Tiempo Real</span>
                                    </div>
                                    <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9] drop-shadow-2xl">
                                        Potenciamos<br/>tus <span className="text-indigo-400">proyectos</span>
                                    </h2>
                                    <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
                                        El catálogo de ferretería más grande de la región, ahora disponible en la nube. Más de 140,000 artículos con retiro inmediato.
                                    </p>
                                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
                                        <button onClick={() => setView('CATALOG')} className="w-full sm:w-auto bg-indigo-600 text-white px-12 py-5 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-indigo-600/20 hover:bg-white hover:text-indigo-600 transition-all flex items-center justify-center gap-3">
                                            Explorar Catálogo <ArrowRight size={18}/>
                                        </button>
                                        <button className="w-full sm:w-auto bg-white/5 border border-white/10 text-white px-10 py-5 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] backdrop-blur-md hover:bg-white/10 transition-all">
                                            Ofertas del Mes
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CARACTERISTICAS RÁPIDAS */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 md:px-12 py-8">
                            {[
                                { icon: Truck, label: 'Envíos Rápidos', desc: 'Coordinamos la entrega en el día' },
                                { icon: ShieldCheck, label: 'Garantía Total', desc: 'Productos certificados y sellados' },
                                { icon: CreditCard, label: 'Pagos Flexibles', desc: 'Cuotas con NAVE y Mercado Pago' }
                            ].map((item, i) => (
                                <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 flex items-center gap-6 shadow-sm group hover:shadow-xl transition-all">
                                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                        <item.icon size={28}/>
                                    </div>
                                    <div>
                                        <h4 className="font-black uppercase text-sm tracking-tight">{item.label}</h4>
                                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* PRODUCTOS DESTACADOS */}
                        <div className="px-4 md:px-12 py-12 space-y-10">
                            <div className="flex justify-between items-end">
                                <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-800">Lo Más <span className="text-indigo-600">Vendido</span></h3>
                                <button onClick={() => setView('CATALOG')} className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:gap-4 transition-all">Ver todos <ChevronRight size={16}/></button>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                {products.map(p => (
                                    <ProductCard key={p.id} product={p} onAdd={addToCart} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {view === 'CATALOG' && (
                    <div className="flex flex-col h-full animate-fade-in">
                        {/* SEARCH BAR STICKY EN CATÁLOGO */}
                        <div className="bg-white border-b border-slate-100 p-6 space-y-6 shrink-0 shadow-sm sticky top-0 z-50">
                            <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-4">
                                <div className="flex-1 relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={22}/>
                                    <input 
                                        type="text" 
                                        placeholder="BUSCA ENTRE 140,000 ARTÍCULOS..." 
                                        className="w-full pl-12 p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-3xl font-black uppercase text-sm outline-none transition-all shadow-inner" 
                                        value={searchTerm} 
                                        onChange={e => setSearchTerm(e.target.value)} 
                                    />
                                    {isSearching && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            <RefreshCw className="animate-spin text-indigo-500" size={18}/>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <select 
                                        className="bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-3xl px-8 py-4 font-black uppercase text-[10px] tracking-widest outline-none shadow-sm cursor-pointer" 
                                        value={selectedCategory} 
                                        onChange={e => setSelectedCategory(e.target.value)}
                                    >
                                        <option value="TODOS">Todas las categorías</option>
                                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            
                            {/* CATEGORÍAS PILLS */}
                            <div className="max-w-6xl mx-auto flex gap-3 overflow-x-auto no-scrollbar pb-2">
                                {['TODOS', ...categories.slice(0, 10).map(c => c.name)].map(cat => (
                                    <button 
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 md:px-12 bg-slate-50 pb-32">
                            <div className="max-w-7xl mx-auto">
                                {searchTerm.length >= 3 && searchResults.length === 0 && !isSearching && (
                                    <div className="py-32 text-center space-y-4 opacity-30">
                                        <Search size={80} className="mx-auto" strokeWidth={1}/>
                                        <p className="text-xl font-black uppercase tracking-widest">No encontramos resultados</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                    {(searchTerm.length >= 3 ? searchResults : products).map(p => (
                                        <ProductCard key={p.id} product={p} onAdd={addToCart} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {view === 'CART' && (
                    <div className="h-full flex items-center justify-center p-6 animate-fade-in bg-slate-100/50">
                        <div className="w-full max-w-4xl bg-white rounded-[4rem] shadow-3xl border border-slate-100 overflow-hidden flex flex-col md:flex-row h-[85vh]">
                            {/* LISTADO DE ITEMS */}
                            <div className="flex-[3] p-10 flex flex-col overflow-hidden">
                                <div className="flex items-center gap-4 mb-10">
                                    <button onClick={() => setView('CATALOG')} className="p-3 bg-slate-50 rounded-2xl hover:bg-indigo-50 transition-colors"><ArrowLeft size={20}/></button>
                                    <h2 className="text-3xl font-black uppercase tracking-tighter">Tu Pedido</h2>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-4">
                                    {cart.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-30 gap-6">
                                            <ShoppingBag size={120} strokeWidth={1}/>
                                            <p className="text-xl font-black uppercase tracking-widest">Carrito Vacío</p>
                                            <button onClick={() => setView('CATALOG')} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs">Volver a comprar</button>
                                        </div>
                                    ) : cart.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-6 p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:bg-white hover:border-indigo-100 transition-all group">
                                            <div className="w-20 h-20 bg-white rounded-3xl overflow-hidden flex items-center justify-center border shadow-sm shrink-0">
                                                {item.product.ecommerce?.imageUrl ? (
                                                    <img src={item.product.ecommerce.imageUrl} className="w-full h-full object-cover" alt={item.product.name} />
                                                ) : (
                                                    <Package size={24} className="text-slate-200"/>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-black text-slate-800 text-sm uppercase truncate mb-1">{item.product.name}</h4>
                                                <p className="text-[10px] text-indigo-600 font-black tracking-widest">
                                                    ${(item.product.ecommerce?.isOffer ? item.product.ecommerce.offerPrice : item.product.priceFinal)?.toLocaleString('es-AR')} c/u
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border shadow-sm">
                                                <button onClick={() => updateCartQty(item.product.id, -1)} className="p-1.5 hover:bg-slate-50 rounded-xl transition-colors"><Minus size={14}/></button>
                                                <span className="font-black text-sm w-6 text-center">{item.quantity}</span>
                                                <button onClick={() => updateCartQty(item.product.id, 1)} className="p-1.5 hover:bg-slate-50 rounded-xl transition-colors"><Plus size={14}/></button>
                                            </div>
                                            <button onClick={() => removeFromCart(item.product.id)} className="p-3 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"><Trash2 size={20}/></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* RESUMEN DE PAGO */}
                            <div className="flex-[1.5] bg-slate-900 text-white p-10 flex flex-col justify-between">
                                <div className="space-y-10">
                                    <h3 className="text-xl font-black uppercase tracking-widest border-b border-white/10 pb-6">Resumen de Compra</h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400 font-bold uppercase">Subtotal</span>
                                            <span className="font-black">${cartTotal.toLocaleString('es-AR')}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400 font-bold uppercase">Envío</span>
                                            <span className="text-green-400 font-black uppercase">A coordinar</span>
                                        </div>
                                        <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                                            <span className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">Total Estimado</span>
                                            <span className="text-5xl font-black tracking-tighter">${cartTotal.toLocaleString('es-AR')}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-3">
                                        <div className="flex items-center gap-2 text-indigo-400">
                                            <ShieldCheck size={18}/>
                                            <span className="text-[10px] font-black uppercase tracking-widest">Compra Protegida</span>
                                        </div>
                                        <p className="text-[9px] text-slate-500 font-medium leading-relaxed">Tu pedido será verificado por un vendedor real en el mostrador antes de confirmar el pago final.</p>
                                    </div>
                                </div>

                                <button 
                                    onClick={sendOrderWhatsApp}
                                    disabled={cart.length === 0}
                                    className="w-full bg-indigo-600 hover:bg-white hover:text-indigo-600 text-white py-6 rounded-3xl font-black uppercase tracking-widest text-xs shadow-3xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-30">
                                    <MessageCircle size={28} fill="currentColor"/> Enviar a WhatsApp
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {view === 'SUCCESS' && (
                    <div className="h-full flex flex-col items-center justify-center p-10 text-center space-y-10 animate-fade-in bg-slate-900 text-white">
                        <div className="w-40 h-40 bg-indigo-600 rounded-[3rem] flex items-center justify-center shadow-3xl shadow-indigo-600/30 animate-bounce">
                            <CheckCircle2 size={80}/>
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-5xl font-black uppercase tracking-tighter">¡Pedido Enviado!</h2>
                            <p className="text-slate-400 font-medium max-w-md mx-auto text-lg leading-relaxed">
                                Hemos recibido tu solicitud. Un representante de <span className="text-indigo-400">{companyConfig.fantasyName}</span> se pondrá en contacto contigo por WhatsApp en minutos.
                            </p>
                        </div>
                        <button 
                            onClick={() => setView('HOME')} 
                            className="bg-white text-slate-900 px-16 py-5 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all">
                            Volver al Inicio
                        </button>
                    </div>
                )}
            </div>
            
            {/* FOOTER PERSISTENTE EN MÓVIL */}
            {view !== 'SUCCESS' && (
                <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] bg-slate-900 text-white h-16 rounded-full flex items-center justify-around px-6 z-[200] shadow-3xl border border-white/10 backdrop-blur-xl">
                    <button onClick={() => setView('HOME')} className={view === 'HOME' ? 'text-indigo-400' : 'text-slate-400'}><Zap size={24}/></button>
                    <button onClick={() => setView('CATALOG')} className={view === 'CATALOG' ? 'text-indigo-400' : 'text-slate-400'}><Search size={24}/></button>
                    <button onClick={() => setView('CART')} className={`relative ${view === 'CART' ? 'text-indigo-400' : 'text-slate-400'}`}>
                        <ShoppingBag size={24}/>
                        {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">{cart.length}</span>}
                    </button>
                </div>
            )}
        </div>
    );
};

// --- SUB-COMPONENTE: TARJETA DE PRODUCTO ---
const ProductCard: React.FC<{ product: Product, onAdd: (p: Product, qty: number) => void }> = ({ product, onAdd }) => {
    const isOffer = product.ecommerce?.isOffer;
    const finalPrice = isOffer ? (product.ecommerce?.offerPrice || product.priceFinal) : product.priceFinal;

    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col group overflow-hidden h-full">
            <div className="h-64 bg-slate-50 relative flex items-center justify-center overflow-hidden">
                {isOffer && (
                    <div className="absolute top-4 left-4 bg-orange-500 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest z-20 shadow-lg animate-pulse">OFERTA</div>
                )}
                {product.ecommerce?.imageUrl ? (
                    <img src={product.ecommerce.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={product.name} />
                ) : (
                    <Package size={64} className="text-slate-200 transition-transform duration-500 group-hover:scale-125" strokeWidth={1}/>
                )}
                <div className="absolute inset-0 bg-indigo-900/0 group-hover:bg-indigo-900/10 transition-colors pointer-events-none"></div>
            </div>
            <div className="p-8 flex-1 flex flex-col">
                <div className="flex-1 space-y-2 mb-6">
                    <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest leading-none">{product.brand || 'Calidad Garantizada'}</p>
                    <h4 className="font-black text-slate-800 uppercase tracking-tight text-sm leading-snug line-clamp-2 h-10 group-hover:text-indigo-600 transition-colors">{product.name}</h4>
                </div>
                <div className="flex justify-between items-end">
                    <div>
                        {isOffer && <p className="text-[10px] text-slate-300 line-through font-bold mb-0.5">${product.priceFinal.toLocaleString('es-AR')}</p>}
                        <p className="text-2xl font-black text-slate-900 tracking-tighter">${finalPrice.toLocaleString('es-AR')}</p>
                    </div>
                    <button 
                        onClick={() => onAdd(product, 1)}
                        className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl hover:bg-indigo-600 active:scale-90 transition-all"
                    >
                        <Plus size={20}/>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Shop;
