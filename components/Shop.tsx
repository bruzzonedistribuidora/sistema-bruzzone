
import React, { useState, useMemo, useEffect } from 'react';
import { 
    Search, ShoppingCart, ShoppingBag, X, Plus, Minus, 
    ArrowRight, MessageCircle, Star, ShieldCheck, Truck, 
    ChevronRight, LayoutGrid, List, Filter, Info, Phone,
    Zap, Tag, Globe, Sparkles, Instagram, Facebook, 
    Clock, MapPin, CheckCircle, Package, ArrowLeft,
    CreditCard, ExternalLink, Calculator, Trash2
} from 'lucide-react';
import { Product, SalesOrder, InvoiceItem, CompanyConfig, Category } from '../types';
import { searchVirtualInventory } from '../services/geminiService';

const Shop: React.FC = () => {
    const [view, setView] = useState<'HOME' | 'CATALOG' | 'CART' | 'CHECKOUT' | 'SUCCESS'>('HOME');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
    const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);
    
    const [products, setProducts] = useState<Product[]>(() => 
        JSON.parse(localStorage.getItem('ferrecloud_products') || '[]')
    );
    const [categories] = useState<Category[]>(() => JSON.parse(localStorage.getItem('ferrecloud_categories') || '[]'));
    const [companyConfig] = useState<CompanyConfig>(() => JSON.parse(localStorage.getItem('company_config') || '{}'));

    useEffect(() => {
        const handleStorage = () => {
            setProducts(JSON.parse(localStorage.getItem('ferrecloud_products') || '[]'));
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const publishedProducts = useMemo(() => 
        products.filter(p => p.ecommerce?.isPublished),
    [products]);

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

    const updateCartQty = (id: string, delta: number) => {
        setCart(prev => prev.map(item => 
            item.product.id === id 
            ? { ...item, quantity: Math.max(1, item.quantity + delta) } 
            : item
        ));
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.product.id !== id));
    };

    const cartTotal = useMemo(() => cart.reduce((acc, curr) => {
        const price = curr.product.ecommerce?.isOffer ? (curr.product.ecommerce.offerPrice || curr.product.priceFinal) : curr.product.priceFinal;
        return acc + (price * curr.quantity);
    }, 0), [cart]);

    const handleCheckout = (formData: any) => {
        const orderId = `WEB-${Math.floor(Math.random() * 10000)}`;
        const items: InvoiceItem[] = cart.map(i => ({
            product: i.product,
            quantity: i.quantity,
            appliedPrice: i.product.ecommerce?.isOffer ? (i.product.ecommerce.offerPrice || i.product.priceFinal) : i.product.priceFinal,
            subtotal: (i.product.ecommerce?.isOffer ? (i.product.ecommerce.offerPrice || i.product.priceFinal) : i.product.priceFinal) * i.quantity
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

        const savedOrders = JSON.parse(localStorage.getItem('ferrecloud_sales_orders') || '[]');
        localStorage.setItem('ferrecloud_sales_orders', JSON.stringify([newOrder, ...savedOrders]));

        const waMsg = `*NUEVO PEDIDO WEB #${orderId}*\n\nCliente: ${formData.name}\nTotal: $${cartTotal.toLocaleString()}\n\n*Items:*\n${cart.map(i => `- ${i.quantity}x ${i.product.name}`).join('\n')}`;
        window.open(`https://wa.me/${companyConfig.whatsappNumber?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waMsg)}`, '_blank');

        setCart([]);
        setView('SUCCESS');
    };

    const offers = useMemo(() => 
        publishedProducts.filter(p => p.ecommerce?.isOffer),
    [publishedProducts]);

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
            <nav className="fixed top-0 left-0 w-full h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200 z-[100] px-6 flex justify-between items-center">
                <div onClick={() => setView('HOME')} className="flex items-center gap-3 cursor-pointer">
                    <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg">
                        <ShoppingCart size={20}/>
                    </div>
                    <h1 className="font-black text-lg tracking-tighter uppercase leading-none">
                        {companyConfig.fantasyName || 'FerreCloud'}<br/>
                        <span className="text-[9px] text-indigo-500 tracking-[0.2em]">TIENDA OFICIAL</span>
                    </h1>
                </div>
                
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('CATALOG')} className="p-2.5 text-slate-400 hover:text-indigo-600 transition-colors"><Search size={22}/></button>
                    <button onClick={() => setView('CART')} className="relative p-2.5 bg-slate-900 rounded-2xl text-white shadow-xl active:scale-95 transition-all">
                        <ShoppingBag size={22}/>
                        {cart.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                                {cart.length}
                            </span>
                        )}
                    </button>
                </div>
            </nav>

            <main className="pt-16 min-h-screen">
                {view === 'HOME' && (
                    <div className="animate-fade-in">
                        <section className="relative h-[70vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/50 to-white -z-10"></div>
                            <div className="max-w-4xl space-y-8">
                                <span className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl">Precios Online 24/7</span>
                                <h2 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[0.9] uppercase">
                                    Potencia tu<br/>
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Proyecto</span>
                                </h2>
                                <p className="text-slate-500 text-lg font-medium max-w-xl mx-auto">Explora nuestro catálogo maestro de ferretería con stock real y ofertas exclusivas.</p>
                                <button onClick={() => setView('CATALOG')} className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all active:scale-95 flex items-center gap-3 mx-auto">
                                    Ver Catálogo Completo <ArrowRight size={20}/>
                                </button>
                            </div>
                        </section>

                        {offers.length > 0 && (
                            <section className="max-w-7xl mx-auto px-6 py-20 space-y-10">
                                <div>
                                    <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Ofertas Destacadas</h3>
                                    <p className="text-orange-500 font-bold text-[10px] uppercase tracking-widest mt-2">Ahorrá en cada compra</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {offers.slice(0, 4).map(p => (
                                        <ProductCard key={p.id} product={p} onAdd={addToCart} />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}

                {view === 'CATALOG' && (
                    <div className="max-w-7xl mx-auto px-6 py-10 animate-fade-in flex flex-col md:flex-row gap-10">
                        <aside className="w-full md:w-64 space-y-8 shrink-0">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-4">Categorías</h4>
                            <div className="flex flex-col gap-2">
                                {['TODOS', ...categories.map(c => c.name)].map(c => (
                                    <button 
                                        key={c}
                                        onClick={() => setSelectedCategory(c)}
                                        className={`text-left px-5 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${selectedCategory === c ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:bg-slate-100'}`}>
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </aside>

                        <div className="flex-1 space-y-8">
                            <div className="relative w-full group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={20}/>
                                <input 
                                    type="text" 
                                    placeholder="¿Qué herramienta buscas hoy?..." 
                                    className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-[2rem] font-bold outline-none focus:ring-4 focus:ring-indigo-50 shadow-sm transition-all"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                                {filteredCatalog.length === 0 ? (
                                    <div className="col-span-full py-24 text-center text-slate-300 font-black uppercase tracking-widest">Sin resultados</div>
                                ) : filteredCatalog.map(p => (
                                    <ProductCard key={p.id} product={p} onAdd={addToCart} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {view === 'CART' && (
                    <div className="max-w-3xl mx-auto px-6 py-12 animate-fade-in space-y-10">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setView('CATALOG')} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 shadow-sm"><ArrowLeft size={24}/></button>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Tu Carrito</h2>
                        </div>

                        <div className="space-y-4">
                            {cart.length === 0 ? (
                                <div className="text-center py-24 bg-white rounded-[3rem] border border-slate-100">
                                    <ShoppingBag size={80} className="mx-auto text-slate-100 mb-6" strokeWidth={1} />
                                    <p className="text-slate-400 font-black uppercase tracking-widest">Carrito vacío</p>
                                </div>
                            ) : (
                                <>
                                    {cart.map(item => (
                                        <div key={item.product.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 flex items-center justify-between shadow-sm">
                                            <div className="flex items-center gap-6">
                                                <div className="p-4 bg-slate-50 rounded-3xl">
                                                    <Package size={24} className="text-slate-300"/>
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-800 uppercase text-sm leading-tight mb-1">{item.product.name}</h4>
                                                    <p className="text-xs font-black text-indigo-600">
                                                        ${(item.product.ecommerce?.isOffer ? item.product.ecommerce.offerPrice : item.product.priceFinal)?.toLocaleString('es-AR')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-3 bg-slate-100 p-2 rounded-2xl">
                                                    <button onClick={() => updateCartQty(item.product.id, -1)} className="p-1 hover:bg-white rounded-lg transition-all"><Minus size={14}/></button>
                                                    <span className="font-black text-xs w-6 text-center">{item.quantity}</span>
                                                    <button onClick={() => updateCartQty(item.product.id, 1)} className="p-1 hover:bg-white rounded-lg transition-all"><Plus size={14}/></button>
                                                </div>
                                                <button onClick={() => removeFromCart(item.product.id)} className="p-2 text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white shadow-2xl mt-10">
                                        <div className="flex justify-between items-baseline border-b border-white/10 pb-8 mb-8">
                                            <span className="text-sm font-black uppercase tracking-[0.3em] text-indigo-400">Total Estimado</span>
                                            <span className="text-5xl font-black tracking-tighter">${cartTotal.toLocaleString('es-AR')}</span>
                                        </div>
                                        <button onClick={() => setView('CHECKOUT')} className="w-full bg-indigo-600 text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-500 active:scale-95 transition-all text-sm">CONTINUAR AL PAGO</button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {view === 'CHECKOUT' && (
                    <div className="max-w-2xl mx-auto px-6 py-12 animate-fade-in space-y-10">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setView('CART')} className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm"><ArrowLeft size={24}/></button>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Finalizar Pedido</h2>
                        </div>
                        <form 
                            onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                handleCheckout(Object.fromEntries(formData));
                            }}
                            className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nombre Completo</label>
                                    <input name="name" required className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">WhatsApp</label>
                                    <input name="phone" required className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Dirección de Envío</label>
                                    <input name="address" required className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-bold" />
                                </div>
                            </div>
                            <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 flex items-start gap-4">
                                <Info size={24} className="text-indigo-600 shrink-0"/>
                                <p className="text-[10px] font-bold text-indigo-900 uppercase leading-relaxed">Te contactaremos por WhatsApp para coordinar el pago (Transferencia o Efectivo).</p>
                            </div>
                            <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all text-xs">ENVIAR PEDIDO</button>
                        </form>
                    </div>
                )}

                {view === 'SUCCESS' && (
                    <div className="max-w-xl mx-auto px-6 py-32 text-center animate-fade-in space-y-10">
                        <div className="w-32 h-32 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner border-4 border-white">
                            <CheckCircle size={64}/>
                        </div>
                        <h2 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-[0.9]">¡Pedido Enviado!</h2>
                        <button onClick={() => setView('HOME')} className="bg-white border-2 border-slate-200 text-slate-900 px-12 py-4 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl hover:border-indigo-600">Volver al Inicio</button>
                    </div>
                )}
            </main>
        </div>
    );
};

const ProductCard: React.FC<{ product: Product, onAdd: (p: Product, qty: number) => void, dark?: boolean }> = ({ product, onAdd, dark }) => {
    const isOffer = product.ecommerce?.isOffer;
    const finalPrice = isOffer ? (product.ecommerce?.offerPrice || product.priceFinal) : product.priceFinal;

    return (
        <div className={`rounded-[2.5rem] border transition-all overflow-hidden flex flex-col group h-[450px] ${dark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-100 shadow-sm hover:shadow-2xl'}`}>
            <div className={`h-56 flex items-center justify-center p-12 relative overflow-hidden ${dark ? 'bg-white/5' : 'bg-slate-50'}`}>
                {isOffer && (
                    <span className="absolute top-4 left-4 bg-orange-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg z-10 animate-pulse">OFERTA</span>
                )}
                <Package size={80} className={`transition-transform duration-500 group-hover:scale-125 ${dark ? 'text-white/10' : 'text-slate-200'}`} strokeWidth={1} />
            </div>
            <div className="p-8 flex-1 flex flex-col">
                <h4 className={`font-black uppercase tracking-tight text-lg leading-tight h-12 overflow-hidden mb-2 ${dark ? 'text-white' : 'text-slate-800'}`}>{product.name}</h4>
                <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest mb-6">{product.brand}</p>
                <div className="mt-auto flex justify-between items-end">
                    <div>
                        {isOffer && (
                            <p className="text-[10px] text-slate-400 line-through font-bold mb-1">${product.priceFinal.toLocaleString('es-AR')}</p>
                        )}
                        <p className={`text-2xl font-black tracking-tighter leading-none ${isOffer ? 'text-orange-500' : (dark ? 'text-white' : 'text-slate-900')}`}>
                            ${finalPrice.toLocaleString('es-AR')}
                        </p>
                    </div>
                    <button 
                        onClick={() => onAdd(product, 1)}
                        className={`p-4 rounded-2xl shadow-xl transition-all active:scale-95 ${dark ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white hover:bg-indigo-600'}`}>
                        <Plus size={20}/>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Shop;
