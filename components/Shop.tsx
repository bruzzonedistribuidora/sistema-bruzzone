
import React, { useState, useMemo, useEffect } from 'react';
import { 
    Search, ShoppingCart, ShoppingBag, X, Plus, Minus, 
    ArrowRight, MessageCircle, Star, ShieldCheck, Truck, 
    ChevronRight, LayoutGrid, List, Filter, Info, Phone,
    Zap, Tag, Globe, Sparkles, Instagram, Facebook, 
    Clock, MapPin, CheckCircle, Package, ArrowLeft,
    CreditCard, ExternalLink, Calculator, Trash2,
    Heart, Menu, User
} from 'lucide-react';
import { Product, SalesOrder, InvoiceItem, CompanyConfig, Category, Client } from '../types';
import { searchVirtualInventory } from '../services/geminiService';

const Shop: React.FC = () => {
    const [view, setView] = useState<'HOME' | 'CATALOG' | 'CART' | 'CHECKOUT' | 'SUCCESS'>('HOME');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
    const [cart, setCart] = useState<{product: Product, quantity: number}[]>(() => {
        const saved = localStorage.getItem('ferreshop_cart');
        return saved ? JSON.parse(saved) : [];
    });
    
    const [products, setProducts] = useState<Product[]>(() => 
        JSON.parse(localStorage.getItem('ferrecloud_products') || '[]')
    );
    const [categories] = useState<Category[]>(() => JSON.parse(localStorage.getItem('ferrecloud_categories') || '[]'));
    
    const companyConfig: CompanyConfig = useMemo(() => {
        const saved = localStorage.getItem('company_config');
        return saved ? JSON.parse(saved) : { 
            fantasyName: 'Ferretería Bruzzone', 
            slogan: 'Tu proyecto, nuestra prioridad',
            whatsappNumber: '5491144556677'
        };
    }, []);

    useEffect(() => {
        localStorage.setItem('ferreshop_cart', JSON.stringify(cart));
    }, [cart]);

    const publishedProducts = useMemo(() => 
        products.filter(p => p.ecommerce?.isPublished),
    [products]);

    const featuredProducts = useMemo(() => 
        publishedProducts.filter(p => p.ecommerce?.isFeatured).slice(0, 4),
    [publishedProducts]);

    const offerProducts = useMemo(() => 
        publishedProducts.filter(p => p.ecommerce?.isOffer),
    [publishedProducts]);

    const filteredCatalog = useMemo(() => {
        return publishedProducts.filter(p => {
            const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                               p.internalCodes.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchCat = selectedCategory === 'TODOS' || p.category === selectedCategory;
            return matchSearch && matchCat;
        });
    }, [publishedProducts, searchTerm, selectedCategory]);

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
            {/* BARRA DE NAVEGACIÓN MODERNA */}
            <nav className="fixed top-0 left-0 w-full h-20 bg-white/90 backdrop-blur-xl border-b border-slate-100 z-[200] px-6 md:px-12 flex justify-between items-center transition-all">
                <div onClick={() => setView('HOME')} className="flex items-center gap-4 cursor-pointer group">
                    <div className="w-12 h-12 bg-slate-900 rounded-[1.2rem] flex items-center justify-center text-white shadow-xl group-hover:bg-indigo-600 transition-all duration-500 group-hover:rotate-12">
                        <Zap size={24} fill="currentColor" />
                    </div>
                    <div className="hidden sm:block">
                        <h1 className="font-black text-xl tracking-tighter uppercase leading-none">{companyConfig.fantasyName || 'FerreCloud'}</h1>
                        <p className="text-[9px] text-slate-400 font-bold tracking-[0.3em] uppercase mt-1">Industrial & Home</p>
                    </div>
                </div>
                
                <div className="hidden lg:flex items-center gap-10">
                    <button onClick={() => { setSelectedCategory('TODOS'); setView('CATALOG'); }} className="text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors">Catálogo</button>
                    {categories.slice(0, 4).map(c => (
                        <button key={c.id} onClick={() => { setSelectedCategory(c.name); setView('CATALOG'); }} className="text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors">{c.name}</button>
                    ))}
                </div>

                <div className="flex items-center gap-2 md:gap-5">
                    <button onClick={() => setView('CATALOG')} className="p-3 text-slate-400 hover:text-indigo-600 transition-colors"><Search size={22}/></button>
                    <button onClick={() => setView('CART')} className="relative p-4 bg-slate-50 rounded-[1.5rem] text-slate-800 hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-95 group">
                        <ShoppingBag size={22} className="group-hover:scale-110 transition-transform"/>
                        {cart.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-4 border-white animate-bounce shadow-lg">
                                {cart.length}
                            </span>
                        )}
                    </button>
                    <button className="hidden md:flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all">
                        <User size={16}/> Mi Cuenta
                    </button>
                </div>
            </nav>

            <main className="pt-20">
                {view === 'HOME' && (
                    <div className="animate-fade-in">
                        {/* HERO SECTION - TIPO APPLE */}
                        <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-50/50 via-white to-white -z-10"></div>
                            
                            <div className="max-w-5xl space-y-12 relative z-10">
                                <div className="inline-flex items-center gap-3 bg-white px-5 py-2 rounded-full shadow-2xl shadow-indigo-100 border border-slate-100 animate-bounce">
                                    <Sparkles size={16} className="text-amber-400 fill-amber-400"/>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Stock Real Online</span>
                                </div>
                                
                                <h2 className="text-7xl md:text-[9rem] font-black text-slate-900 tracking-tighter leading-[0.8] uppercase">
                                    Mejorá tu<br/>
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 animate-gradient-x">Trabajo</span>
                                </h2>
                                
                                <p className="text-slate-500 text-xl md:text-2xl font-medium max-w-2xl mx-auto leading-relaxed">
                                    Accedé al catálogo de ferretería más grande de la región con la velocidad de la nube.
                                </p>
                                
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
                                    <button onClick={() => setView('CATALOG')} className="w-full sm:w-auto bg-slate-900 text-white px-12 py-6 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-4">
                                        Explorar Tienda <ArrowRight size={20}/>
                                    </button>
                                    <button className="w-full sm:w-auto bg-white border-2 border-slate-100 text-slate-400 px-12 py-6 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:border-indigo-100 hover:text-indigo-600 transition-all flex items-center justify-center gap-3">
                                        <MessageCircle size={20}/> Chatear con un experto
                                    </button>
                                </div>
                            </div>

                            {/* Floating Elements */}
                            <div className="absolute top-1/4 -left-20 opacity-20 hidden xl:block animate-pulse"><Package size={200} strokeWidth={0.5}/></div>
                            <div className="absolute bottom-1/4 -right-20 opacity-10 hidden xl:block animate-pulse" style={{ animationDelay: '1s' }}><Zap size={300} strokeWidth={0.5}/></div>
                        </section>

                        {/* OFERTAS - GRILLA MODERNA */}
                        {offerProducts.length > 0 && (
                            <section className="max-w-7xl mx-auto px-6 md:px-12 py-32 space-y-16">
                                <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-slate-100 pb-12">
                                    <div className="space-y-2">
                                        <h3 className="text-5xl font-black text-slate-900 uppercase tracking-tighter">Oportunidades</h3>
                                        <p className="text-orange-500 font-black text-xs uppercase tracking-[0.3em]">Precios de Liquidación hoy</p>
                                    </div>
                                    <button onClick={() => setView('CATALOG')} className="group flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-indigo-600">
                                        Ver todas las ofertas <div className="p-2 bg-indigo-50 rounded-full group-hover:translate-x-2 transition-transform"><ArrowRight size={14}/></div>
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                    {offerProducts.slice(0, 8).map(p => (
                                        <ShopProductCard key={p.id} product={p} onAdd={addToCart} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* SECCIÓN DESTACADOS CON FONDO OSCURO */}
                        {featuredProducts.length > 0 && (
                            <section className="bg-slate-950 py-32 text-white overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-20 opacity-10"><Sparkles size={400}/></div>
                                <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-16 relative z-10">
                                    <div className="text-center space-y-4">
                                        <h3 className="text-5xl font-black uppercase tracking-tighter">Elegidos de la Semana</h3>
                                        <p className="text-indigo-400 font-bold uppercase tracking-[0.4em] text-xs">Herramientas de Alto Rendimiento</p>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                                        {featuredProducts.map(p => (
                                            <ShopProductCard key={p.id} product={p} onAdd={addToCart} dark />
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* INFO DE SERVICIO */}
                        <section className="max-w-7xl mx-auto px-6 md:px-12 py-32">
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                                 <div className="p-10 bg-slate-50 rounded-[3rem] space-y-6 text-center group hover:bg-white hover:shadow-2xl transition-all duration-500 border border-transparent hover:border-slate-100">
                                     <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all"><Truck size={32}/></div>
                                     <h4 className="text-xl font-black uppercase tracking-tight">Envíos Rápidos</h4>
                                     <p className="text-slate-500 text-sm leading-relaxed">Entregamos tus pedidos en obra o domicilio en menos de 24hs dentro de la ciudad.</p>
                                 </div>
                                 <div className="p-10 bg-slate-50 rounded-[3rem] space-y-6 text-center group hover:bg-white hover:shadow-2xl transition-all duration-500 border border-transparent hover:border-slate-100">
                                     <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all"><ShieldCheck size={32}/></div>
                                     <h4 className="text-xl font-black uppercase tracking-tight">Garantía Real</h4>
                                     <p className="text-slate-500 text-sm leading-relaxed">Todos nuestros productos cuentan con garantía oficial y soporte técnico especializado.</p>
                                 </div>
                                 <div className="p-10 bg-slate-50 rounded-[3rem] space-y-6 text-center group hover:bg-white hover:shadow-2xl transition-all duration-500 border border-transparent hover:border-slate-100">
                                     <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all"><Calculator size={32}/></div>
                                     <h4 className="text-xl font-black uppercase tracking-tight">Cotización IA</h4>
                                     <p className="text-slate-500 text-sm leading-relaxed">Subí tu lista de materiales y nuestro motor de IA te cotiza el mejor precio del mercado.</p>
                                 </div>
                             </div>
                        </section>
                    </div>
                )}

                {view === 'CATALOG' && (
                    <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-12 animate-fade-in flex flex-col lg:flex-row gap-12">
                        <aside className="w-full lg:w-80 space-y-12 shrink-0">
                            <div className="sticky top-32 space-y-12">
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Filtros Activos</h4>
                                    <div className="flex flex-wrap gap-2">
                                        <button 
                                            onClick={() => setSelectedCategory('TODOS')}
                                            className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${selectedCategory === 'TODOS' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                            Todos los Rubros
                                        </button>
                                        {categories.map(c => (
                                            <button 
                                                key={c.id}
                                                onClick={() => setSelectedCategory(c.name)}
                                                className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${selectedCategory === c.name ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                                {c.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                                     <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">Ayuda con tu pedido</p>
                                     <h4 className="text-lg font-black uppercase leading-tight mb-6">¿No encontrás lo que buscás?</h4>
                                     <button onClick={() => window.open(`https://wa.me/${companyConfig.whatsappNumber}`, '_blank')} className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-indigo-50 transition-all flex items-center justify-center gap-2">
                                         <MessageCircle size={14}/> Preguntar por WhatsApp
                                     </button>
                                </div>
                            </div>
                        </aside>

                        <div className="flex-1 space-y-12">
                            <div className="relative w-full group">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors">
                                    <Search size={28}/>
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="BUSCAR HERRAMIENTAS, MARCAS O CÓDIGOS..." 
                                    className="w-full pl-20 pr-8 py-8 bg-white border-2 border-slate-100 rounded-[3rem] font-black text-lg outline-none focus:ring-8 focus:ring-indigo-50 focus:border-indigo-100 shadow-sm transition-all placeholder:text-slate-200 uppercase"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="flex justify-between items-center px-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredCatalog.length} Artículos encontrados</p>
                                <div className="flex gap-4">
                                     <button className="text-[10px] font-black uppercase text-indigo-600 flex items-center gap-2 border-b-2 border-indigo-600 pb-1">Menor Precio</button>
                                     <button className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">Más Vendidos</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 pb-32">
                                {filteredCatalog.length === 0 ? (
                                    <div className="col-span-full py-40 text-center space-y-6">
                                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto"><Search size={48} className="text-slate-200"/></div>
                                        <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No encontramos productos con esos filtros</p>
                                        <button onClick={() => {setSearchTerm(''); setSelectedCategory('TODOS');}} className="text-indigo-600 font-black text-xs uppercase underline">Limpiar búsqueda</button>
                                    </div>
                                ) : filteredCatalog.map(p => (
                                    <ShopProductCard key={p.id} product={p} onAdd={addToCart} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {view === 'CART' && (
                    <div className="max-w-4xl mx-auto px-6 py-20 animate-fade-in space-y-12">
                        <div className="flex items-center gap-6">
                            <button onClick={() => setView('CATALOG')} className="p-4 bg-white border border-slate-200 rounded-[1.5rem] hover:bg-slate-50 shadow-sm transition-all active:scale-90"><ArrowLeft size={28}/></button>
                            <div>
                                <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">Mi Carrito</h2>
                                <p className="text-indigo-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">Revisá tu pedido antes de finalizar</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {cart.length === 0 ? (
                                <div className="text-center py-32 bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-200 space-y-8">
                                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-inner"><ShoppingBag size={48} className="text-slate-100" strokeWidth={1} /></div>
                                    <div className="space-y-2">
                                        <p className="text-slate-400 font-black uppercase tracking-widest text-lg">Tu carrito está vacío</p>
                                        <p className="text-slate-400 text-sm max-w-xs mx-auto">¡Seguramente hay alguna herramienta increíble esperando por vos!</p>
                                    </div>
                                    <button onClick={() => setView('CATALOG')} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95">Ir a comprar</button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                    <div className="lg:col-span-2 space-y-4">
                                        {cart.map(item => (
                                            <div key={item.product.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 flex items-center justify-between shadow-sm hover:shadow-xl transition-all group">
                                                <div className="flex items-center gap-8">
                                                    <div className="w-24 h-24 bg-slate-50 rounded-[1.8rem] overflow-hidden shrink-0 flex items-center justify-center relative group-hover:scale-105 transition-transform">
                                                        {item.product.ecommerce?.imageUrl ? (
                                                            <img src={item.product.ecommerce.imageUrl} className="w-full h-full object-cover" alt={item.product.name} />
                                                        ) : (
                                                            <Package size={32} className="text-slate-300"/>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-slate-800 uppercase text-sm leading-tight mb-2 max-w-[200px] truncate">{item.product.name}</h4>
                                                        <p className="text-xs font-black text-indigo-600">
                                                            ${(item.product.ecommerce?.isOffer ? item.product.ecommerce.offerPrice : item.product.priceFinal)?.toLocaleString('es-AR')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="flex items-center gap-4 bg-slate-100 p-2 rounded-2xl border border-slate-200 shadow-inner">
                                                        <button onClick={() => setCart(prev => prev.map(it => it.product.id === item.product.id ? {...it, quantity: Math.max(1, it.quantity - 1)} : it))} className="p-2 bg-white rounded-xl shadow-sm text-slate-400 hover:text-red-500 transition-all"><Minus size={14}/></button>
                                                        <span className="font-black text-sm min-w-[30px] text-center text-slate-900">{item.quantity}</span>
                                                        <button onClick={() => setCart(prev => prev.map(it => it.product.id === item.product.id ? {...it, quantity: it.quantity + 1} : it))} className="p-2 bg-white rounded-xl shadow-sm text-slate-400 hover:text-indigo-600 transition-all"><Plus size={14}/></button>
                                                    </div>
                                                    <button onClick={() => setCart(prev => prev.filter(it => it.product.id !== item.product.id))} className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"><Trash2 size={24}/></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="lg:col-span-1 h-fit">
                                        <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl space-y-10">
                                            <div className="space-y-6">
                                                <div className="flex justify-between items-center text-xs font-black uppercase text-slate-500 tracking-widest">
                                                    <span>Subtotal</span>
                                                    <span>${cartTotal.toLocaleString('es-AR')}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs font-black uppercase text-slate-500 tracking-widest">
                                                    <span>Envío</span>
                                                    <span className="text-green-400">A COORDINAR</span>
                                                </div>
                                                <div className="h-px bg-white/10 w-full"></div>
                                                <div className="flex justify-between items-baseline">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Total Final</span>
                                                    <span className="text-5xl font-black tracking-tighter">${cartTotal.toLocaleString('es-AR')}</span>
                                                </div>
                                            </div>
                                            <button onClick={() => setView('CHECKOUT')} className="w-full bg-indigo-600 text-white py-6 rounded-[1.8rem] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all text-[11px]">INICIAR COMPRA</button>
                                            <p className="text-[9px] text-slate-500 text-center font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                                                <ShieldCheck size={12}/> Pago Seguro & Encriptado
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {view === 'CHECKOUT' && (
                    <div className="max-w-5xl mx-auto px-6 py-20 animate-fade-in flex flex-col lg:flex-row gap-16">
                        <div className="flex-1 space-y-12">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setView('CART')} className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm"><ArrowLeft size={24}/></button>
                                <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Datos de Envío</h2>
                            </div>
                            
                            <form 
                                id="checkout-form"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);
                                    handleCheckout(Object.fromEntries(formData));
                                }}
                                className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Nombre Completo</label>
                                        <input name="name" required className="w-full p-6 bg-slate-50 border-2 border-transparent rounded-[1.8rem] focus:bg-white focus:border-indigo-600 outline-none font-black text-lg transition-all" />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">WhatsApp / Teléfono</label>
                                        <input name="phone" required type="tel" className="w-full p-6 bg-slate-50 border-2 border-transparent rounded-[1.8rem] focus:bg-white focus:border-indigo-600 outline-none font-black text-lg transition-all" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Dirección de Entrega</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={24}/>
                                        <input name="address" required className="w-full pl-16 p-6 bg-slate-50 border-2 border-transparent rounded-[1.8rem] focus:bg-white focus:border-indigo-600 outline-none font-black text-lg transition-all" placeholder="Calle, Número, Localidad..." />
                                    </div>
                                </div>
                                <div className="bg-indigo-50 p-8 rounded-[2.5rem] border border-indigo-100 flex items-start gap-6">
                                    <div className="p-3 bg-white rounded-2xl text-indigo-600 shadow-sm"><Info size={24}/></div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-indigo-900 uppercase">¿Cómo sigue mi compra?</p>
                                        <p className="text-[11px] font-medium text-indigo-700/80 leading-relaxed">Al finalizar, recibirás un mensaje automático por WhatsApp. Un asesor de ventas confirmará tu pedido, coordinará el flete y te enviará los datos para el pago (Efectivo o Transferencia).</p>
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-slate-900 text-white py-8 rounded-[2.5rem] font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-indigo-600 active:scale-95 transition-all text-sm">FINALIZAR Y ENVIAR PEDIDO</button>
                            </form>
                        </div>

                        <div className="w-full lg:w-96 shrink-0">
                            <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-200 space-y-8 sticky top-32">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 border-b pb-4">Resumen</h4>
                                <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
                                    {cart.map(item => (
                                        <div key={item.product.id} className="flex justify-between items-center gap-4">
                                            <p className="text-[10px] font-bold text-slate-800 uppercase truncate flex-1">{item.product.name}</p>
                                            <p className="text-[10px] font-black text-slate-400 shrink-0">x{item.quantity}</p>
                                            <p className="text-[10px] font-black text-indigo-600 shrink-0">${((item.product.ecommerce?.isOffer ? item.product.ecommerce.offerPrice : item.product.priceFinal) || 0 * item.quantity).toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-6 border-t border-slate-200">
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total</span>
                                        <span className="text-3xl font-black tracking-tighter text-slate-900">${cartTotal.toLocaleString('es-AR')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {view === 'SUCCESS' && (
                    <div className="max-w-2xl mx-auto px-6 py-40 text-center animate-fade-in space-y-12">
                        <div className="w-40 h-40 bg-green-50 text-green-500 rounded-[3rem] flex items-center justify-center mx-auto shadow-2xl border-8 border-white animate-bounce">
                            <CheckCircle size={80}/>
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter uppercase leading-[0.85]">¡Pedido<br/><span className="text-indigo-600">Recibido!</span></h2>
                            <p className="text-slate-400 font-medium text-lg md:text-xl max-w-sm mx-auto leading-relaxed">Tu solicitud fue enviada correctamente. Revisá tu WhatsApp en unos instantes.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
                            <button onClick={() => setView('HOME')} className="bg-slate-900 text-white px-12 py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-600 transition-all active:scale-95">Volver a la Tienda</button>
                            <button className="bg-white border-2 border-slate-100 text-slate-400 px-12 py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest hover:border-indigo-100 hover:text-indigo-600 transition-all">Ver mis pedidos</button>
                        </div>
                    </div>
                )}
            </main>

            {/* FOOTER PREMIUM */}
            <footer className="bg-slate-950 text-white py-24 px-6 md:px-12 mt-32">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
                    <div className="space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center"><Zap size={20} fill="currentColor"/></div>
                            <h3 className="font-black text-2xl tracking-tighter uppercase">{companyConfig.fantasyName || 'FerreCloud'}</h3>
                        </div>
                        <p className="text-slate-500 text-sm leading-relaxed font-medium">{companyConfig.slogan}</p>
                        <div className="flex gap-4">
                            <button className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-indigo-600 hover:scale-110 transition-all"><Instagram size={20}/></button>
                            <button className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-blue-600 hover:scale-110 transition-all"><Facebook size={20}/></button>
                            <button className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-green-500 hover:scale-110 transition-all"><MessageCircle size={20}/></button>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Nuestra Tienda</h4>
                        <ul className="space-y-4 text-sm font-bold text-slate-400 uppercase tracking-widest">
                            <li className="hover:text-white cursor-pointer transition-colors">Sobre Nosotros</li>
                            <li className="hover:text-white cursor-pointer transition-colors">Envíos y Entregas</li>
                            <li className="hover:text-white cursor-pointer transition-colors">Políticas de Devolución</li>
                            <li className="hover:text-white cursor-pointer transition-colors">Contacto</li>
                        </ul>
                    </div>

                    <div className="space-y-8">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Atención Directa</h4>
                        <ul className="space-y-6 text-sm font-medium text-slate-400 leading-relaxed">
                            <li className="flex items-start gap-4">
                                <MapPin size={20} className="text-indigo-500 shrink-0"/>
                                <span>Av. del Libertador 1200,<br/>Buenos Aires, ARG.</span>
                            </li>
                            <li className="flex items-center gap-4">
                                <Phone size={20} className="text-indigo-500 shrink-0"/>
                                <span>+54 11 4455-6677</span>
                            </li>
                            <li className="flex items-center gap-4">
                                <Clock size={20} className="text-indigo-500 shrink-0"/>
                                <span>Lun a Sáb: 08:30 a 19:30hs</span>
                            </li>
                        </ul>
                    </div>

                    <div className="space-y-8">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Club Bruzzone</h4>
                        <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 space-y-4">
                            <p className="text-xs text-slate-400 font-medium leading-relaxed">Unite a nuestro sistema de puntos y canjeá beneficios exclusivos.</p>
                            <button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">REGISTRARME</button>
                        </div>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto border-t border-white/5 mt-24 pt-12 text-center">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.8em]">Bruzzone Cloud © 2024 • Todos los derechos reservados</p>
                </div>
            </footer>

            {/* BOTÓN WHATSAPP FLOTANTE */}
            <div className="fixed bottom-10 right-10 z-[300]">
                <button 
                    onClick={() => window.open(`https://wa.me/${companyConfig.whatsappNumber}`, '_blank')}
                    className="w-16 h-16 bg-green-500 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 hover:bg-green-400 transition-all active:scale-95 group">
                    <MessageCircle size={32} className="fill-white"/>
                    <div className="absolute right-full mr-6 bg-white px-6 py-3 rounded-2xl shadow-2xl text-slate-900 font-black text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-slate-100 whitespace-nowrap">¿Necesitás ayuda?</div>
                </button>
            </div>
        </div>
    );
};

// COMPONENTE TARJETA DE PRODUCTO LOCAL
const ShopProductCard: React.FC<{ product: Product, onAdd: (p: Product, qty: number) => void, dark?: boolean }> = ({ product, onAdd, dark }) => {
    const isOffer = product.ecommerce?.isOffer;
    const finalPrice = isOffer ? (product.ecommerce?.offerPrice || product.priceFinal) : product.priceFinal;

    return (
        <div className={`rounded-[3rem] border-2 transition-all overflow-hidden flex flex-col group h-[520px] ${dark ? 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10' : 'bg-white border-slate-50 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] hover:border-indigo-50'}`}>
            <div className={`h-[280px] flex items-center justify-center relative overflow-hidden ${dark ? 'bg-white/5' : 'bg-slate-50'}`}>
                {isOffer && (
                    <div className="absolute top-6 left-6 bg-orange-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl z-20 animate-pulse">OFERTA</div>
                )}
                {product.ecommerce?.isFeatured && (
                    <div className="absolute top-6 right-6 p-2.5 bg-yellow-400 text-slate-900 rounded-full shadow-lg z-20"><Star size={16} fill="currentColor"/></div>
                )}
                
                {product.ecommerce?.imageUrl ? (
                    <img 
                        src={product.ecommerce.imageUrl} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        alt={product.name} 
                    />
                ) : (
                    <div className="text-center space-y-4 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
                        <Package size={100} className={dark ? 'text-white' : 'text-slate-200'} strokeWidth={1} />
                        <p className={`text-[8px] font-black uppercase tracking-widest ${dark ? 'text-white' : 'text-slate-900'}`}>Sin imagen comercial</p>
                    </div>
                )}
                <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
            
            <div className="p-10 flex-1 flex flex-col">
                <p className="text-[10px] text-indigo-500 font-black uppercase tracking-[0.2em] mb-3">{product.brand || 'Genérico'}</p>
                <h4 className={`font-black uppercase tracking-tight text-lg leading-tight h-14 overflow-hidden mb-6 ${dark ? 'text-white' : 'text-slate-800'}`}>{product.name}</h4>
                
                <div className="mt-auto pt-6 border-t border-slate-100/10 flex justify-between items-end">
                    <div className="space-y-1">
                        {isOffer && (
                            <p className="text-[11px] text-slate-400 line-through font-bold">${product.priceFinal.toLocaleString('es-AR')}</p>
                        )}
                        <p className={`text-3xl font-black tracking-tighter leading-none ${isOffer ? 'text-orange-500' : (dark ? 'text-white' : 'text-slate-900')}`}>
                            ${finalPrice.toLocaleString('es-AR')}
                        </p>
                    </div>
                    <button 
                        onClick={() => onAdd(product, 1)}
                        className={`w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 group/btn ${dark ? 'bg-indigo-600 text-white shadow-indigo-600/30' : 'bg-slate-900 text-white hover:bg-indigo-600 shadow-slate-900/20 hover:shadow-indigo-600/30'}`}>
                        <Plus size={24} className="group-hover/btn:rotate-90 transition-transform duration-300"/>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Shop;
