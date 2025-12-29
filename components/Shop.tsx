
import React, { useState, useMemo, useEffect } from 'react';
import { 
    Search, ShoppingCart, ShoppingBag, X, Plus, Minus, 
    ArrowRight, MessageCircle, Star, ShieldCheck, Truck, 
    ChevronRight, LayoutGrid, List, Filter, Info, Phone,
    Zap, Tag, Globe, Sparkles, Instagram, Facebook, 
    Clock, MapPin, CheckCircle, Package, ArrowLeft,
    CreditCard, ExternalLink, Calculator, Trash2
} from 'lucide-react';
import { Product, SalesOrder, InvoiceItem, CompanyConfig, Brand, Category } from '../types';
import { searchVirtualInventory } from '../services/geminiService';

const Shop: React.FC = () => {
    // --- ESTADO TIENDA ---
    const [view, setView] = useState<'HOME' | 'CATALOG' | 'PRODUCT' | 'CART' | 'CHECKOUT' | 'SUCCESS'>('HOME');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
    const [selectedBrand, setSelectedBrand] = useState<string>('TODAS');
    const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    
    // --- DATOS DEL SISTEMA MAESTRO ---
    const [products] = useState<Product[]>(() => JSON.parse(localStorage.getItem('ferrecloud_products') || '[]'));
    const [brands] = useState<Brand[]>(() => JSON.parse(localStorage.getItem('ferrecloud_brands') || '[]'));
    const [categories] = useState<Category[]>(() => JSON.parse(localStorage.getItem('ferrecloud_categories') || '[]'));
    const [companyConfig] = useState<CompanyConfig>(() => JSON.parse(localStorage.getItem('company_config') || '{}'));

    // --- ESTADO BUSQUEDA IA ---
    const [isSearchingIA, setIsSearchingIA] = useState(false);

    // --- LÓGICA DE CARRITO ---
    const addToCart = (product: Product, qty: number = 1) => {
        setCart(prev => {
            const exists = prev.find(item => item.product.id === product.id);
            if (exists) {
                return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + qty } : item);
            }
            return [...prev, { product, quantity: qty }];
        });
        // Notificación visual (haptic-like)
        alert(`${product.name} agregado al carrito`);
    };

    const removeFromCart = (productId: string) => setCart(prev => prev.filter(i => i.product.id !== productId));
    
    const updateCartQty = (productId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.product.id === productId) {
                return { ...item, quantity: Math.max(1, item.quantity + delta) };
            }
            return item;
        }));
    };

    const cartTotal = useMemo(() => cart.reduce((acc, curr) => acc + (curr.product.priceFinal * curr.quantity), 0), [cart]);

    // --- FILTRADO DE CATALOGO ---
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.internalCodes[0].toLowerCase().includes(searchTerm.toLowerCase());
            const matchCat = selectedCategory === 'TODOS' || p.category === selectedCategory;
            const matchBrand = selectedBrand === 'TODAS' || p.brand === selectedBrand;
            return matchSearch && matchCat && matchBrand;
        });
    }, [products, searchTerm, selectedCategory, selectedBrand]);

    // --- FINALIZAR PEDIDO (INTEGRACION CON SISTEMA) ---
    const handleCheckout = (formData: any) => {
        const orderId = `WEB-${Math.floor(Math.random() * 10000)}`;
        const items: InvoiceItem[] = cart.map(i => ({
            product: i.product,
            quantity: i.quantity,
            appliedPrice: i.product.priceFinal,
            subtotal: i.product.priceFinal * i.quantity
        }));

        const newOrder: SalesOrder = {
            id: orderId,
            clientName: formData.name.toUpperCase(),
            date: new Date().toLocaleDateString(),
            priority: 'NORMAL',
            status: 'PENDING',
            items: items,
            notes: `PEDIDO WEB - TEL: ${formData.phone} - ENTREGA: ${formData.address}`,
            total: cartTotal
        };

        // Guardar en el sistema maestro
        const savedOrders = JSON.parse(localStorage.getItem('ferrecloud_sales_orders') || '[]');
        localStorage.setItem('ferrecloud_sales_orders', JSON.stringify([newOrder, ...savedOrders]));

        // Enviar a WhatsApp del negocio
        const waMsg = `*NUEVO PEDIDO WEB #${orderId}*\n\nCliente: ${formData.name}\nTotal: $${cartTotal.toLocaleString()}\n\n*Items:*\n${cart.map(i => `- ${i.quantity}x ${i.product.name}`).join('\n')}`;
        window.open(`https://wa.me/${companyConfig.whatsappNumber?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waMsg)}`, '_blank');

        setCart([]);
        setView('SUCCESS');
    };

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
            
            {/* BARRA DE NAVEGACIÓN - ESTILO APPLE/MINIMAL */}
            <nav className="fixed top-0 left-0 w-full h-16 bg-white/80 backdrop-blur-xl border-b border-slate-100 z-[100] px-6 flex justify-between items-center">
                <div className="flex items-center gap-8">
                    <div onClick={() => setView('HOME')} className="flex items-center gap-3 cursor-pointer group">
                        <div className="p-2 bg-slate-900 rounded-xl text-white group-hover:bg-indigo-600 transition-colors">
                            <Sparkles size={20}/>
                        </div>
                        <h1 className="font-black text-lg tracking-tighter uppercase leading-none">
                            {companyConfig.fantasyName || 'FerreCloud'}<br/>
                            <span className="text-[10px] text-indigo-600 tracking-widest">Tienda Oficial</span>
                        </h1>
                    </div>
                    <div className="hidden md:flex items-center gap-6">
                        <button onClick={() => { setView('CATALOG'); setSelectedCategory('TODOS'); }} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Catálogo</button>
                        <button onClick={() => { setView('CATALOG'); setSelectedCategory('HERRAMIENTAS'); }} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Herramientas</button>
                        <button onClick={() => { setView('CATALOG'); setSelectedCategory('PINTURAS'); }} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Pinturas</button>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('CATALOG')} className="p-3 text-slate-400 hover:text-slate-900 transition-colors"><Search size={20}/></button>
                    <button onClick={() => setView('CART')} className="relative p-3 bg-slate-50 rounded-2xl text-slate-900 hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-95">
                        <ShoppingBag size={20}/>
                        {cart.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[8px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                                {cart.length}
                            </span>
                        )}
                    </button>
                </div>
            </nav>

            {/* CONTENIDO PRINCIPAL */}
            <main className="pt-16 min-h-screen">

                {view === 'HOME' && (
                    <div className="animate-fade-in">
                        {/* HERO SECTION */}
                        <section className="relative h-[80vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full -z-10 bg-gradient-to-b from-indigo-50/50 to-white"></div>
                            <div className="absolute top-1/4 right-[-10%] w-96 h-96 bg-indigo-200/30 blur-[120px] rounded-full"></div>
                            <div className="absolute bottom-1/4 left-[-10%] w-96 h-96 bg-orange-200/20 blur-[120px] rounded-full"></div>
                            
                            <div className="max-w-3xl space-y-8 relative">
                                <span className="bg-indigo-600 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-xl shadow-indigo-100">Líder en Construcción</span>
                                <h2 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[0.9] uppercase">
                                    Potencia tu<br/>
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Proyecto</span>
                                </h2>
                                <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-xl mx-auto">Más de 140,000 artículos con stock inmediato. El respaldo de {companyConfig.fantasyName} ahora a un clic.</p>
                                
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                                    <button onClick={() => setView('CATALOG')} className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all flex items-center gap-3 group active:scale-95">
                                        Ver Catálogo Completo <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
                                    </button>
                                    <button className="bg-white border-2 border-slate-100 text-slate-700 px-10 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:border-indigo-200 transition-all flex items-center gap-3 active:scale-95">
                                        <Instagram size={20}/> Seguinos
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* CATEGORIES GRID */}
                        <section className="max-w-7xl mx-auto px-6 py-20">
                            <div className="flex justify-between items-end mb-12">
                                <div>
                                    <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Nuestros Segmentos</h3>
                                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">Encontrá lo que necesitás rápido</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {['HERRAMIENTAS', 'ELECTRICIDAD', 'PINTURERÍA', 'CONSTRUCCIÓN'].map(cat => (
                                    <button 
                                        key={cat} 
                                        onClick={() => { setSelectedCategory(cat); setView('CATALOG'); }}
                                        className="h-48 bg-slate-50 rounded-[2.5rem] border border-slate-100 p-8 flex flex-col justify-between hover:bg-white hover:shadow-2xl hover:-translate-y-2 transition-all text-left group">
                                        <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all w-fit">
                                            <Package size={24}/>
                                        </div>
                                        <span className="font-black text-sm uppercase tracking-widest text-slate-800">{cat}</span>
                                    </button>
                                ))}
                            </div>
                        </section>
                    </div>
                )}

                {view === 'CATALOG' && (
                    <div className="max-w-7xl mx-auto px-6 py-10 animate-fade-in flex flex-col md:flex-row gap-10">
                        {/* SIDEBAR FILTERS */}
                        <aside className="w-full md:w-64 space-y-10 shrink-0">
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Categorías</h4>
                                <div className="flex flex-col gap-2">
                                    {['TODOS', ...categories.map(c => c.name)].map(c => (
                                        <button 
                                            key={c}
                                            onClick={() => setSelectedCategory(c)}
                                            className={`text-left px-4 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${selectedCategory === c ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:bg-slate-50'}`}>
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Marcas</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {['TODAS', ...brands.slice(0, 8).map(b => b.name)].map(b => (
                                        <button 
                                            key={b}
                                            onClick={() => setSelectedBrand(b)}
                                            className={`px-3 py-2 rounded-xl text-[8px] font-black uppercase border-2 transition-all truncate ${selectedBrand === b ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-50 text-slate-400'}`}>
                                            {b}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </aside>

                        {/* PRODUCT GRID */}
                        <div className="flex-1 space-y-8">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50 p-6 rounded-[2rem]">
                                <div className="relative flex-1 w-full">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                                    <input 
                                        type="text" 
                                        placeholder="Busca por nombre o SKU..." 
                                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">{filteredProducts.length} Resultados</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                                {filteredProducts.map(p => (
                                    <div key={p.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all overflow-hidden flex flex-col group h-[450px]">
                                        <div className="h-64 bg-slate-50 relative overflow-hidden flex items-center justify-center p-10">
                                            <div className="absolute top-4 left-4 flex gap-2">
                                                <span className="bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-slate-900 border border-slate-100">{p.brand}</span>
                                                {p.isCombo && <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">Oferta</span>}
                                            </div>
                                            {/* Imagen Placeholder elegante */}
                                            <div className="w-full h-full bg-white rounded-3xl shadow-inner flex flex-col items-center justify-center gap-3 text-slate-200 group-hover:scale-110 transition-transform duration-500">
                                                <Package size={64} strokeWidth={1}/>
                                                <span className="text-[8px] font-black uppercase tracking-[0.2em]">FerreCloud Shop</span>
                                            </div>
                                        </div>
                                        <div className="p-8 flex-1 flex flex-col">
                                            <h4 className="font-black text-slate-800 uppercase tracking-tight text-lg mb-1 leading-none h-12 overflow-hidden">{p.name}</h4>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6">SKU: {p.internalCodes[0]}</p>
                                            
                                            <div className="mt-auto flex justify-between items-center">
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Precio Final</p>
                                                    <p className="text-2xl font-black text-slate-900 tracking-tighter">${p.priceFinal.toLocaleString('es-AR')}</p>
                                                </div>
                                                <button 
                                                    onClick={() => addToCart(p)}
                                                    className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl hover:bg-indigo-600 hover:scale-110 active:scale-95 transition-all">
                                                    <Plus size={20}/>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {view === 'CART' && (
                    <div className="max-w-5xl mx-auto px-6 py-12 animate-fade-in space-y-10">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setView('CATALOG')} className="p-3 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors"><ArrowLeft size={20}/></button>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Tu Carrito</h2>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                            <div className="lg:col-span-2 space-y-4">
                                {cart.length === 0 ? (
                                    <div className="bg-slate-50 p-20 rounded-[3rem] text-center space-y-6">
                                        <ShoppingBag size={80} className="mx-auto text-slate-200" strokeWidth={1}/>
                                        <p className="text-slate-400 font-bold uppercase tracking-widest">El carrito está vacío</p>
                                        <button onClick={() => setView('CATALOG')} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Seguir Comprando</button>
                                    </div>
                                ) : cart.map(item => (
                                    <div key={item.product.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group">
                                        <div className="flex items-center gap-6">
                                            <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200">
                                                <Package size={24}/>
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-800 uppercase tracking-tight text-sm leading-tight mb-1">{item.product.name}</h4>
                                                <p className="text-[10px] text-indigo-500 font-bold uppercase">{item.product.brand}</p>
                                                <p className="text-sm font-black text-slate-900 mt-2">${item.product.priceFinal.toLocaleString('es-AR')}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
                                                <button onClick={() => updateCartQty(item.product.id, -1)} className="p-1 text-slate-400 hover:text-red-500"><Minus size={14}/></button>
                                                <span className="font-black text-xs w-8 text-center">{item.quantity}</span>
                                                <button onClick={() => updateCartQty(item.product.id, 1)} className="p-1 text-slate-400 hover:text-indigo-600"><Plus size={14}/></button>
                                            </div>
                                            <button onClick={() => removeFromCart(item.product.id)} className="p-2 text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-6">
                                <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-8">Resumen de Compra</h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-slate-400">
                                            <span className="text-[10px] font-black uppercase tracking-widest">Subtotal ({cart.length} ítems)</span>
                                            <span className="font-bold">${cartTotal.toLocaleString('es-AR')}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-slate-400">
                                            <span className="text-[10px] font-black uppercase tracking-widest">Envío</span>
                                            <span className="font-bold text-green-400">GRATIS</span>
                                        </div>
                                        <div className="pt-6 border-t border-white/10 flex justify-between items-baseline">
                                            <span className="text-sm font-black uppercase tracking-widest">Total Final</span>
                                            <span className="text-4xl font-black tracking-tighter">${cartTotal.toLocaleString('es-AR')}</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setView('CHECKOUT')}
                                        disabled={cart.length === 0}
                                        className="w-full mt-10 bg-indigo-600 text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-500 transition-all active:scale-95 disabled:opacity-20">
                                        INICIAR PAGO
                                    </button>
                                </div>
                                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex items-center gap-4">
                                    <div className="p-3 bg-green-50 text-green-600 rounded-2xl"><ShieldCheck size={24}/></div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-800 uppercase leading-none mb-1">Compra Protegida</p>
                                        <p className="text-[8px] text-slate-400 font-bold uppercase">Bruzzone Cloud Secure Payments</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {view === 'CHECKOUT' && (
                    <div className="max-w-3xl mx-auto px-6 py-12 animate-fade-in space-y-10">
                         <div className="flex items-center gap-4">
                            <button onClick={() => setView('CART')} className="p-3 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors"><ArrowLeft size={20}/></button>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Datos de<br/>Entrega</h2>
                        </div>

                        <form 
                            onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                handleCheckout(Object.fromEntries(formData));
                            }}
                            className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nombre y Apellido</label>
                                    <input name="name" required className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-bold transition-all" placeholder="Ej: Mario Rossi" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">WhatsApp de Contacto</label>
                                    <input name="phone" required className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-bold transition-all" placeholder="Ej: 11 4455-6677" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Dirección de Entrega</label>
                                <input name="address" required className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-bold transition-all" placeholder="Calle, Número, Depto, Localidad" />
                            </div>

                            <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 space-y-4">
                                <h4 className="text-[10px] font-black text-indigo-700 uppercase tracking-widest flex items-center gap-2"><CreditCard size={14}/> Método de Pago</h4>
                                <div className="p-4 bg-white rounded-2xl border border-indigo-200 flex justify-between items-center">
                                    <div>
                                        <p className="text-xs font-black text-slate-800 uppercase">Transferencia / Acordar con Vendedor</p>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Recibirás los datos por WhatsApp al finalizar</p>
                                    </div>
                                    <CheckCircle size={20} className="text-indigo-600"/>
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] shadow-2xl hover:bg-slate-800 transition-all active:scale-95">
                                CONFIRMAR Y ENVIAR PEDIDO
                            </button>
                        </form>
                    </div>
                )}

                {view === 'SUCCESS' && (
                    <div className="max-w-xl mx-auto px-6 py-20 text-center animate-fade-in space-y-8">
                        <div className="w-32 h-32 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                            <CheckCircle size={64}/>
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-[0.9]">¡Pedido<br/>Recibido!</h2>
                            <p className="text-slate-500 font-medium leading-relaxed">Hemos enviado los detalles a {companyConfig.fantasyName}. En breve te contactaremos por WhatsApp para coordinar el envío y pago.</p>
                        </div>
                        <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 space-y-4">
                             <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-slate-400">
                                 <span>Orden Generada</span>
                                 <span className="text-slate-800">#{Math.floor(Math.random() * 100000)}</span>
                             </div>
                             <button 
                                onClick={() => setView('HOME')}
                                className="w-full bg-white border-2 border-slate-200 text-slate-800 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:border-indigo-600 transition-all active:scale-95">
                                Volver al Inicio
                             </button>
                        </div>
                    </div>
                )}

            </main>

            {/* FOOTER TIENDA */}
            <footer className="bg-slate-950 text-white py-20 px-6">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div className="col-span-1 md:col-span-2 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-600 rounded-xl"><Sparkles size={24}/></div>
                            <h3 className="font-black text-2xl uppercase tracking-tighter">{companyConfig.fantasyName}</h3>
                        </div>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-sm">La ferretería industrial líder de la región. Más de 20 años acompañando tus proyectos con las mejores marcas y stock real.</p>
                        <div className="flex gap-4">
                            <button className="p-3 bg-white/5 rounded-2xl hover:bg-indigo-600 transition-all"><Instagram size={20}/></button>
                            <button className="p-3 bg-white/5 rounded-2xl hover:bg-indigo-600 transition-all"><Facebook size={20}/></button>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Atención</h4>
                        <div className="space-y-4 text-slate-400 text-sm font-medium">
                            <p className="flex items-center gap-3"><Clock size={16}/> Lun a Vie 08:30 a 19:00hs</p>
                            <p className="flex items-center gap-3"><MapPin size={16}/> {companyConfig.address || 'Av. Libertador 1200'}</p>
                            <p className="flex items-center gap-3"><Phone size={16}/> {companyConfig.phone}</p>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Newsletter</h4>
                        <p className="text-slate-500 text-xs font-medium">Recibí ofertas exclusivas en herramientas.</p>
                        <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10">
                            <input className="bg-transparent flex-1 px-4 text-xs outline-none" placeholder="Tu email..." />
                            <button className="bg-indigo-600 p-3 rounded-xl hover:bg-indigo-500 transition-colors"><ArrowRight size={16}/></button>
                        </div>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">© 2024 {companyConfig.name} • Todos los derechos reservados</p>
                    <div className="flex items-center gap-6 opacity-30 grayscale contrast-125">
                         <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-3" alt="Visa"/>
                         <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-6" alt="Master"/>
                         <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-4" alt="Paypal"/>
                    </div>
                </div>
            </footer>

            {/* BOTÓN WHATSAPP FLOTANTE */}
            <a 
                href={`https://wa.me/${companyConfig.whatsappNumber?.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="fixed bottom-8 right-8 w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-green-500/40 hover:bg-green-400 hover:scale-110 active:scale-95 transition-all z-[100] group">
                <MessageCircle size={32} className="fill-white"/>
                <div className="absolute right-full mr-4 bg-white text-slate-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">¿En qué podemos ayudarte?</div>
            </a>

            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default Shop;
