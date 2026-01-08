
import React, { useState, useMemo, useEffect } from 'react';
import { 
    Search, ShoppingCart, ShoppingBag, X, Plus, Minus, 
    ArrowRight, MessageCircle, Star, ShieldCheck, Truck, 
    ChevronRight, LayoutGrid, List, Filter, Info, Phone,
    Zap, Tag, Globe, Sparkles, Instagram, Facebook, 
    Clock, MapPin, CheckCircle, Package, ArrowLeft,
    CreditCard, ExternalLink, Calculator, Trash2,
    Heart, Menu, User, RefreshCw
} from 'lucide-react';
import { Product, SalesOrder, CompanyConfig, Category } from '../types';
import { productDB } from '../services/storageService';

const Shop: React.FC = () => {
    const [view, setView] = useState<'HOME' | 'CATALOG' | 'CART' | 'CHECKOUT' | 'SUCCESS'>('HOME');
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
            slogan: 'Tu proyecto, nuestra prioridad',
            whatsappNumber: '5491144556677'
        };
    }, []);

    // Carga de productos optimizada usando el índice webPropia
    const loadProducts = async () => {
        setIsLoading(true);
        try {
            // Usamos el nuevo método que solo trae los publicados (ahorra memoria con 140k items)
            const shopItems = await productDB.getPublished();
            setProducts(shopItems);
        } catch (error) {
            console.error("Error cargando productos de la tienda:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadProducts();
        window.addEventListener('ferrecloud_products_updated', loadProducts);
        return () => window.removeEventListener('ferrecloud_products_updated', loadProducts);
    }, []);

    useEffect(() => {
        localStorage.setItem('ferreshop_cart', JSON.stringify(cart));
    }, [cart]);

    const featuredProducts = useMemo(() => 
        products.filter(p => p.ecommerce?.isFeatured).slice(0, 8),
    [products]);

    const offerProducts = useMemo(() => 
        products.filter(p => p.ecommerce?.isOffer).slice(0, 8),
    [products]);

    // Muestra los últimos productos publicados aunque no sean destacados
    const recentProducts = useMemo(() => 
        [...products].reverse().slice(0, 8),
    [products]);

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

    const handleCheckout = (formData: any) => {
        const orderId = `WEB-${Math.floor(Math.random() * 10000)}`;
        
        const newOrder: SalesOrder = {
            id: orderId,
            clientName: formData.name.toUpperCase(),
            date: new Date().toLocaleDateString(),
            priority: 'NORMAL',
            status: 'PENDING',
            items: cart.map(i => ({
                product: i.product,
                quantity: i.quantity,
                appliedPrice: i.product.ecommerce?.isOffer ? (i.product.ecommerce.offerPrice || i.product.priceFinal) : i.product.priceFinal,
                subtotal: (i.product.ecommerce?.isOffer ? (i.product.ecommerce.offerPrice || i.product.priceFinal) : i.product.priceFinal) * i.quantity
            })),
            notes: `PEDIDO WEB - TEL: ${formData.phone} - ENTREGA: ${formData.address}`,
            total: cartTotal
        };

        const savedOrders = JSON.parse(localStorage.getItem('ferrecloud_sales_orders') || '[]');
        localStorage.setItem('ferrecloud_sales_orders', JSON.stringify([newOrder, ...savedOrders]));

        const waMsg = `*NUEVO PEDIDO WEB #${orderId}*\n\nCliente: ${formData.name}\nTotal: $${cartTotal.toLocaleString()}\n\n*Items:*\n${cart.map(i => `- ${i.quantity}x ${i.product.name}`).join('\n')}`;
        window.open(`https://wa.me/${companyConfig.whatsappNumber?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waMsg)}`, '_blank');

        setCart([]);
        setView('SUCCESS');
    };

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
            {/* NAV COMPACTA */}
            <nav className="fixed top-0 left-0 w-full h-20 bg-white/90 backdrop-blur-xl border-b border-slate-100 z-[200] px-6 md:px-12 flex justify-between items-center">
                <div onClick={() => setView('HOME')} className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-xl transition-all group-hover:rotate-6">
                        <Zap size={20} fill="currentColor" />
                    </div>
                    <h1 className="font-black text-lg tracking-tighter uppercase">{companyConfig.fantasyName || 'FerreCloud'}</h1>
                </div>
                
                <div className="hidden lg:flex items-center gap-8">
                    <button onClick={() => { setSelectedCategory('TODOS'); setView('CATALOG'); }} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors">Catálogo</button>
                    {categories.slice(0, 5).map(c => (
                        <button key={c.id} onClick={() => { setSelectedCategory(c.name); setView('CATALOG'); }} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors">{c.name}</button>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={() => setView('CART')} className="relative p-3 bg-slate-50 rounded-xl text-slate-800 hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                        <ShoppingBag size={20}/>
                        {cart.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[8px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                                {cart.length}
                            </span>
                        )}
                    </button>
                    <button onClick={() => setView('CATALOG')} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all">
                        Comprar
                    </button>
                </div>
            </nav>

            <main className="pt-20">
                {view === 'HOME' && (
                    <div className="animate-fade-in">
                        {/* HERO */}
                        <section className="relative h-[80vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/30 to-white -z-10"></div>
                            <div className="max-w-4xl space-y-8 relative z-10">
                                <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full shadow-lg border border-slate-100">
                                    <Sparkles size={14} className="text-amber-400 fill-amber-400"/>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">Catálogo Profesional Sincronizado</span>
                                </div>
                                <h2 className="text-5xl md:text-8xl font-black text-slate-900 tracking-tighter uppercase leading-[0.9]">
                                    Herramientas de<br/><span className="text-indigo-600">Nivel Experto</span>
                                    </h2>
                                <p className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl mx-auto">
                                    Todo lo que tu obra necesita con stock real de mostrador y envío inmediato.
                                </p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
                                    <button onClick={() => setView('CATALOG')} className="w-full sm:w-auto bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all active:scale-95 flex items-center justify-center gap-3">
                                        Ver Catálogo <ArrowRight size={18}/>
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* PRODUCTOS DESTACADOS O NOVEDADES */}
                        {isLoading ? (
                            <div className="py-20 text-center flex flex-col items-center gap-4">
                                <RefreshCw className="animate-spin text-indigo-600" size={40}/>
                                <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Sincronizando Catálogo Maestro...</p>
                            </div>
                        ) : (
                            <>
                                {featuredProducts.length > 0 && (
                                    <section className="max-w-7xl mx-auto px-6 md:px-12 py-24 space-y-12">
                                        <div className="flex justify-between items-end border-b border-slate-100 pb-8">
                                            <div>
                                                <p className="text-indigo-600 font-black text-[10px] uppercase tracking-[0.3em] mb-2">Selección Premium</p>
                                                <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Más Buscados</h3>
                                            </div>
                                            <button onClick={() => setView('CATALOG')} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">Ver todos</button>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                            {featuredProducts.map(p => (
                                                <ShopProductCard key={p.id} product={p} onAdd={addToCart} />
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {recentProducts.length > 0 && featuredProducts.length === 0 && (
                                    <section className="max-w-7xl mx-auto px-6 md:px-12 py-24 space-y-12">
                                        <div className="flex justify-between items-end border-b border-slate-100 pb-8">
                                            <div>
                                                <p className="text-indigo-600 font-black text-[10px] uppercase tracking-[0.3em] mb-2">Recién Incorporados</p>
                                                <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Novedades</h3>
                                            </div>
                                            <button onClick={() => setView('CATALOG')} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">Ver Catálogo</button>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                            {recentProducts.map(p => (
                                                <ShopProductCard key={p.id} product={p} onAdd={addToCart} />
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {products.length === 0 && !isLoading && (
                                    <div className="py-20 text-center space-y-4">
                                        <Package size={64} className="mx-auto text-slate-200" strokeWidth={1} />
                                        <p className="font-black uppercase tracking-widest text-slate-400 text-xs">Aún no hay productos publicados en la web</p>
                                    </div>
                                )}
                            </>
                        )}

                        {/* OFERTAS */}
                        {offerProducts.length > 0 && (
                            <section className="bg-slate-950 py-24 text-white">
                                <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-12">
                                    <div className="flex justify-between items-end border-b border-white/10 pb-8">
                                        <div>
                                            <p className="text-orange-500 font-black text-[10px] uppercase tracking-[0.3em] mb-2">Liquidación Especial</p>
                                            <h3 className="text-4xl font-black uppercase tracking-tighter">Ofertas del Día</h3>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                        {offerProducts.map(p => (
                                            <ShopProductCard key={p.id} product={p} onAdd={addToCart} dark />
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>
                )}

                {view === 'CATALOG' && (
                    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 animate-fade-in flex flex-col lg:flex-row gap-12">
                        <aside className="w-full lg:w-64 space-y-8 shrink-0">
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Rubros</h4>
                                <div className="flex flex-col gap-2">
                                    <button 
                                        onClick={() => setSelectedCategory('TODOS')}
                                        className={`px-4 py-2.5 rounded-xl text-left text-[11px] font-black uppercase transition-all ${selectedCategory === 'TODOS' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                                        Todos los Artículos
                                    </button>
                                    {categories.map(c => (
                                        <button 
                                            key={c.id}
                                            onClick={() => setSelectedCategory(c.name)}
                                            className={`px-4 py-2.5 rounded-xl text-left text-[11px] font-black uppercase transition-all ${selectedCategory === c.name ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                                            {c.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </aside>

                        <div className="flex-1 space-y-8">
                            <div className="relative group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={24}/>
                                <input 
                                    type="text" 
                                    placeholder="Buscar por nombre, marca o SKU..." 
                                    className="w-full pl-14 pr-6 py-5 bg-white border-2 border-slate-100 rounded-3xl font-black text-lg outline-none focus:border-indigo-100 shadow-sm transition-all uppercase placeholder:text-slate-200"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 pb-20">
                                {isLoading ? (
                                    <div className="col-span-full py-40 text-center flex flex-col items-center gap-4">
                                        <RefreshCw className="animate-spin text-indigo-600" size={40}/>
                                        <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Buscando en Base Maestro...</p>
                                    </div>
                                ) : filteredCatalog.length === 0 ? (
                                    <div className="col-span-full py-40 text-center opacity-30">
                                        <Package size={80} className="mx-auto mb-4" strokeWidth={1}/>
                                        <p className="font-black uppercase tracking-widest">Sin resultados en esta categoría</p>
                                    </div>
                                ) : (
                                    filteredCatalog.map(p => (
                                        <ShopProductCard key={p.id} product={p} onAdd={addToCart} />
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {view === 'CART' && (
                    <div className="max-w-4xl mx-auto px-6 py-20 animate-fade-in space-y-12">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setView('CATALOG')} className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:bg-slate-50"><ArrowLeft size={24}/></button>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Carrito de Compras</h2>
                        </div>

                        {cart.length === 0 ? (
                            <div className="text-center py-32 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 space-y-6">
                                <ShoppingBag size={64} className="text-slate-200 mx-auto" />
                                <p className="text-slate-400 font-black uppercase tracking-widest">Tu carrito está vacío</p>
                                <button onClick={() => setView('CATALOG')} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg">Ir a la tienda</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-4">
                                    {cart.map(item => (
                                        <div key={item.product.id} className="bg-white p-6 rounded-3xl border border-slate-200 flex items-center justify-between group">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 bg-slate-50 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center">
                                                    {item.product.ecommerce?.imageUrl ? (
                                                        <img src={item.product.ecommerce.imageUrl} className="w-full h-full object-cover" alt={item.product.name} />
                                                    ) : (
                                                        <Package size={24} className="text-slate-300"/>
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-800 uppercase text-xs leading-tight mb-1">{item.product.name}</h4>
                                                    <p className="text-[10px] font-black text-indigo-600">
                                                        ${(item.product.ecommerce?.isOffer ? item.product.ecommerce.offerPrice : item.product.priceFinal)?.toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-xl border border-slate-200 shadow-inner">
                                                    <button onClick={() => setCart(prev => prev.map(it => it.product.id === item.product.id ? {...it, quantity: Math.max(1, it.quantity - 1)} : it))} className="p-1.5 bg-white rounded-lg shadow-sm text-slate-400"><Minus size={12}/></button>
                                                    <span className="font-black text-xs min-w-[20px] text-center">{item.quantity}</span>
                                                    <button onClick={() => setCart(prev => prev.map(it => it.product.id === item.product.id ? {...it, quantity: it.quantity + 1} : it))} className="p-1.5 bg-white rounded-lg shadow-sm text-slate-400"><Plus size={12}/></button>
                                                </div>
                                                <button onClick={() => setCart(prev => prev.filter(it => it.product.id !== item.product.id))} className="p-2 text-slate-200 hover:text-red-500 transition-all"><Trash2 size={20}/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="lg:col-span-1">
                                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl space-y-8">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500 tracking-widest">
                                                <span>Subtotal</span>
                                                <span>${cartTotal.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500 tracking-widest">
                                                <span>Envío</span>
                                                <span className="text-green-400">A CONVENIR</span>
                                            </div>
                                            <div className="h-px bg-white/10 w-full"></div>
                                            <div className="flex justify-between items-baseline">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Total</span>
                                                <span className="text-4xl font-black tracking-tighter">${cartTotal.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => setView('CHECKOUT')} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-indigo-500 transition-all text-[11px]">Proceder al Pago</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {view === 'CHECKOUT' && (
                    <div className="max-w-2xl mx-auto px-6 py-20 animate-fade-in space-y-12">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setView('CART')} className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm"><ArrowLeft size={24}/></button>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Datos de Pedido</h2>
                        </div>
                        
                        <form 
                            onSubmit={(e) => {
                                e.preventDefault();
                                const fd = new FormData(e.currentTarget);
                                handleCheckout(Object.fromEntries(fd));
                            }}
                            className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block">Nombre y Apellido</label>
                                    <input name="name" required className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-black text-sm" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block">WhatsApp</label>
                                    <input name="phone" required type="tel" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-black text-sm" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block">Dirección de Envío</label>
                                <input name="address" required className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-black text-sm" placeholder="Calle, Número, Localidad..." />
                            </div>
                            <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100">
                                <p className="text-[11px] font-medium text-indigo-700 leading-relaxed italic">Confirmaremos tu pedido vía WhatsApp. No hace falta pagar nada ahora; coordinaremos el pago y envío personalmente.</p>
                            </div>
                            <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all text-sm">ENVIAR PEDIDO POR WHATSAPP</button>
                        </form>
                    </div>
                )}

                {view === 'SUCCESS' && (
                    <div className="max-w-lg mx-auto px-6 py-40 text-center animate-fade-in space-y-8">
                        <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-xl border border-green-100">
                            <CheckCircle size={48}/>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">¡Pedido Enviado!</h2>
                            <p className="text-slate-400 font-medium text-sm px-8">Recibimos tu solicitud. En unos minutos te contactaremos por WhatsApp.</p>
                        </div>
                        <button onClick={() => setView('HOME')} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95">Volver al Inicio</button>
                    </div>
                )}
            </main>

            <footer className="bg-slate-950 text-white py-20 px-6 md:px-12 mt-20">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <Zap size={24} fill="currentColor" className="text-indigo-600"/>
                            <h3 className="font-black text-xl tracking-tighter uppercase">{companyConfig.fantasyName || 'FerreCloud'}</h3>
                        </div>
                        <p className="text-slate-500 text-xs leading-relaxed">{companyConfig.slogan}</p>
                    </div>
                    <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Atención</h4>
                        <p className="text-slate-400 text-xs flex items-center gap-2"><Phone size={14}/> {companyConfig.phone}</p>
                        <p className="text-slate-400 text-xs flex items-center gap-2"><MapPin size={14}/> {companyConfig.address}</p>
                    </div>
                    <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Legal</h4>
                        <ul className="space-y-2 text-xs text-slate-500 font-bold uppercase">
                            <li className="hover:text-white cursor-pointer transition-colors">Términos y Condiciones</li>
                            <li className="hover:text-white cursor-pointer transition-colors">Política de Devolución</li>
                        </ul>
                    </div>
                    <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Redes</h4>
                        <div className="flex gap-4">
                            <Instagram size={20} className="text-slate-500 hover:text-white transition-colors cursor-pointer"/>
                            <Facebook size={20} className="text-slate-500 hover:text-white transition-colors cursor-pointer"/>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const ShopProductCard: React.FC<{ product: Product, onAdd: (p: Product, qty: number) => void, dark?: boolean }> = ({ product, onAdd, dark }) => {
    const isOffer = product.ecommerce?.isOffer;
    const finalPrice = isOffer ? (product.ecommerce?.offerPrice || product.priceFinal) : product.priceFinal;

    return (
        <div className={`rounded-[2.5rem] border transition-all overflow-hidden flex flex-col group h-[480px] ${dark ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-white border-slate-50 hover:shadow-2xl'}`}>
            <div className={`h-[240px] flex items-center justify-center relative overflow-hidden ${dark ? 'bg-white/5' : 'bg-slate-50'}`}>
                {isOffer && (
                    <span className="absolute top-4 left-4 bg-orange-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg z-10 animate-pulse">OFERTA</span>
                )}
                {product.ecommerce?.isFeatured && (
                    <div className="absolute top-4 right-4 p-2 bg-yellow-400 text-slate-900 rounded-full shadow-lg z-10"><Star size={14} fill="currentColor"/></div>
                )}
                
                {product.ecommerce?.imageUrl ? (
                    <img src={product.ecommerce.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={product.name} />
                ) : (
                    <Package size={80} className={`transition-transform duration-500 group-hover:scale-125 ${dark ? 'text-white/10' : 'text-slate-200'}`} strokeWidth={1} />
                )}
            </div>
            
            <div className="p-8 flex-1 flex flex-col">
                <p className="text-[9px] text-indigo-500 font-black uppercase tracking-[0.2em] mb-2">{product.brand || 'Genérico'}</p>
                <h4 className={`font-black uppercase tracking-tight text-sm leading-tight h-10 overflow-hidden mb-4 ${dark ? 'text-white' : 'text-slate-800'}`}>{product.name}</h4>
                
                <div className="mt-auto flex justify-between items-end border-t border-slate-100/10 pt-4">
                    <div className="space-y-1">
                        {isOffer && (
                            <p className="text-[10px] text-slate-400 line-through font-bold">${product.priceFinal.toLocaleString()}</p>
                        )}
                        <p className={`text-2xl font-black tracking-tighter leading-none ${isOffer ? 'text-orange-500' : (dark ? 'text-white' : 'text-slate-900')}`}>
                            ${finalPrice.toLocaleString()}
                        </p>
                    </div>
                    <button 
                        onClick={() => onAdd(product, 1)}
                        className={`w-12 h-12 rounded-xl shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${dark ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white hover:bg-indigo-600'}`}>
                        <Plus size={20}/>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Shop;
