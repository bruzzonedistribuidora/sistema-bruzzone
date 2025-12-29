
import React, { useState, useMemo, useEffect } from 'react';
// Fix: Added missing Link and Instagram icons to the imports
import { 
    Tag, Star, Send, Users, Sparkles, Plus, X, Save, 
    Gift, Calendar, Ticket, Megaphone, CheckCircle, 
    Smartphone, Mail, MessageCircle, TrendingUp, Info,
    Percent, DollarSign, ArrowRight, ShieldCheck, Clock,
    Trash2, Edit, MousePointer2, Zap, LayoutGrid, RefreshCw, QrCode, Printer,
    Copy, ExternalLink, Globe, Smartphone as MobileIcon, ListOrdered, Share2, Eye,
    ShoppingBag, Link, Instagram
} from 'lucide-react';
import { Coupon, LoyaltyConfig, MarketingCampaign, Client, CompanyConfig } from '../types';

type MarketingTab = 'LOYALTY' | 'COUPONS' | 'CAMPAIGNS' | 'PUBLIC_PORTAL';

const Marketing: React.FC = () => {
    const [activeTab, setActiveTab] = useState<MarketingTab>('LOYALTY');

    const [loyalty, setLoyalty] = useState<LoyaltyConfig>(() => {
        const saved = localStorage.getItem('company_config');
        if (saved) {
            const config: CompanyConfig = JSON.parse(saved);
            return config.loyalty || { enabled: true, pointsPerPeso: 0.01, minPointsToRedeem: 500, valuePerPoint: 2 };
        }
        return { enabled: true, pointsPerPeso: 0.01, minPointsToRedeem: 500, valuePerPoint: 2 };
    });

    const [coupons, setCoupons] = useState<Coupon[]>(() => {
        const saved = localStorage.getItem('ferrecloud_coupons');
        return saved ? JSON.parse(saved) : [
            { id: '1', code: 'BIENVENIDA', description: 'Promo primer ingreso portal', discountType: 'PERCENT', value: 10, validUntil: '2024-12-31', usedCount: 45, active: true }
        ];
    });

    const [campaigns, setCampaigns] = useState<MarketingCampaign[]>(() => {
        const saved = localStorage.getItem('ferrecloud_campaigns');
        return saved ? JSON.parse(saved) : [
            { id: 'c1', name: 'Ofertas Primavera', targetSegment: 'ALL', channel: 'WHATSAPP', message: '¡No te pierdas los descuentos de temporada!', sentDate: '2023-09-21', reach: 1200 },
            { id: 'c2', name: 'Reactivación Clientes', targetSegment: 'INACTIVE', channel: 'EMAIL', message: 'Te extrañamos, volvé y obtené un cupón.', sentDate: '2023-10-05', reach: 450 }
        ];
    });

    const [clients] = useState<Client[]>(() => JSON.parse(localStorage.getItem('ferrecloud_clients') || '[]'));

    const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
    const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
    
    const [couponForm, setCouponForm] = useState<Partial<Coupon>>({
        code: '', description: '', discountType: 'PERCENT', value: 0, active: true, usedCount: 0, validUntil: new Date().toISOString().split('T')[0]
    });
    
    const [campaignForm, setCampaignForm] = useState<Partial<MarketingCampaign>>({
        name: '', targetSegment: 'ALL', channel: 'WHATSAPP', message: ''
    });

    useEffect(() => {
        const saved = localStorage.getItem('company_config');
        const config: CompanyConfig = saved ? JSON.parse(saved) : { name: '', paymentAccounts: [] };
        config.loyalty = loyalty;
        localStorage.setItem('company_config', JSON.stringify(config));
        window.dispatchEvent(new Event('company_config_updated'));
    }, [loyalty]);

    useEffect(() => localStorage.setItem('ferrecloud_coupons', JSON.stringify(coupons)), [coupons]);
    useEffect(() => localStorage.setItem('ferrecloud_campaigns', JSON.stringify(campaigns)), [campaigns]);

    const handleSaveCoupon = () => {
        if (!couponForm.code || !couponForm.value) return;
        const newCoupon = { ...couponForm, id: couponForm.id || Date.now().toString() } as Coupon;
        setCoupons(prev => couponForm.id ? prev.map(c => c.id === couponForm.id ? newCoupon : c) : [newCoupon, ...prev]);
        setIsCouponModalOpen(false);
    };

    const handleSendCampaign = () => {
        if (!campaignForm.name || !campaignForm.message) return;
        const newCampaign: MarketingCampaign = {
            ...campaignForm as MarketingCampaign,
            id: Date.now().toString(),
            sentDate: new Date().toLocaleDateString(),
            reach: campaignForm.targetSegment === 'ALL' ? clients.length : Math.floor(clients.length * 0.3)
        };
        setCampaigns([newCampaign, ...campaigns]);
        setIsCampaignModalOpen(false);
        alert(`Campaña "${campaignForm.name}" enviada exitosamente.`);
    };

    const portalLink = `${window.location.origin}/?view=fidelidad`;
    const shopLink = `${window.location.origin}/?view=tienda`;

    return (
        <div className="p-6 max-w-7xl mx-auto h-full flex flex-col space-y-6 animate-fade-in">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-slate-900 text-indigo-400 rounded-3xl shadow-xl"><Sparkles size={32}/></div>
                    <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Marketing Pro</h2>
                </div>
                <div className="flex bg-slate-100 rounded-2xl p-1 shadow-inner">
                    <button onClick={() => setActiveTab('LOYALTY')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'LOYALTY' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400'}`}>Puntos</button>
                    <button onClick={() => setActiveTab('COUPONS')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'COUPONS' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400'}`}>Cupones</button>
                    <button onClick={() => setActiveTab('CAMPAIGNS')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'CAMPAIGNS' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400'}`}>Difusión</button>
                    <button onClick={() => setActiveTab('PUBLIC_PORTAL')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'PUBLIC_PORTAL' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400'}`}>Canales Web</button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {activeTab === 'LOYALTY' && (
                    <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8 animate-fade-in">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-black uppercase tracking-tight">Reglas de Fidelización</h3>
                            <div onClick={() => setLoyalty({...loyalty, enabled: !loyalty.enabled})} className={`w-14 h-7 rounded-full relative cursor-pointer ${loyalty.enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${loyalty.enabled ? 'right-1' : 'left-1'}`}></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Carga por Compra</label>
                                <div className="flex items-center gap-3">
                                    <span className="font-black text-xl text-slate-700">Por cada $1, sumar</span>
                                    <input type="number" className="w-24 p-3 bg-white border border-gray-200 rounded-xl font-black text-indigo-600 text-center" value={loyalty.pointsPerPeso} onChange={e => setLoyalty({...loyalty, pointsPerPeso: parseFloat(e.target.value) || 0})} />
                                    <span className="font-black text-slate-400">PTS</span>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Valor del Punto</label>
                                <div className="flex items-center gap-3">
                                    <span className="font-black text-xl text-slate-700">Cada 1 PTO vale</span>
                                    <input type="number" className="w-24 p-3 bg-white border border-gray-200 rounded-xl font-black text-green-600 text-center" value={loyalty.valuePerPoint} onChange={e => setLoyalty({...loyalty, valuePerPoint: parseFloat(e.target.value) || 0})} />
                                    <span className="font-black text-slate-400">ARS</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'COUPONS' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Cupones Activos</h3>
                            <button onClick={() => { setCouponForm({code: '', description: '', discountType: 'PERCENT', value: 0, active: true, usedCount: 0, validUntil: new Date().toISOString().split('T')[0]}); setIsCouponModalOpen(true); }} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-black text-xs uppercase shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-2">
                                <Plus size={16}/> Nuevo Cupón
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {coupons.map(c => (
                                <div key={c.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col transition-all hover:shadow-xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 bg-indigo-50 text-indigo-600 rounded-bl-3xl font-black text-xs uppercase">{c.discountType === 'PERCENT' ? `${c.value}% OFF` : `$${c.value} OFF`}</div>
                                    <h4 className="text-2xl font-black text-slate-900 tracking-tighter mb-1 uppercase font-mono">{c.code}</h4>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6">{c.description}</p>
                                    <div className="mt-auto pt-6 border-t border-slate-50 flex justify-between items-center text-slate-400 text-[10px] font-black uppercase">
                                        <span>Usos: {c.usedCount}</span>
                                        <button onClick={() => setCoupons(coupons.filter(x => x.id !== c.id))} className="text-red-300 hover:text-red-500"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'CAMPAIGNS' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Campañas de Difusión</h3>
                            <button onClick={() => { setCampaignForm({name: '', targetSegment: 'ALL', channel: 'WHATSAPP', message: ''}); setIsCampaignModalOpen(true); }} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-black text-xs uppercase shadow-xl hover:bg-slate-800 transition-all flex items-center gap-2">
                                <Megaphone size={16}/> Nueva Campaña
                            </button>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {campaigns.map(c => (
                                <div key={c.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 flex items-center justify-between hover:shadow-lg transition-all group">
                                    <div className="flex items-center gap-6">
                                        <div className={`p-4 rounded-2xl ${c.channel === 'WHATSAPP' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                                            {c.channel === 'WHATSAPP' ? <MessageCircle size={24}/> : <Mail size={24}/>}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-800 uppercase text-lg leading-none mb-1">{c.name}</h4>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{c.sentDate} • Enviado a {c.reach} clientes</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100"><Eye size={18}/></button>
                                        <button onClick={() => setCampaigns(campaigns.filter(x => x.id !== c.id))} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'PUBLIC_PORTAL' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in pb-20">
                        {/* PORTAL FIDELIDAD */}
                        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8 flex flex-col">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl"><Smartphone size={28}/></div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Portal Fidelidad</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Consulta de puntos por DNI</p>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                                <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">Enlace Público</label>
                                <div className="bg-white p-3 rounded-xl border flex items-center gap-3">
                                    <Globe size={14} className="text-slate-300"/>
                                    <span className="text-[10px] font-mono truncate flex-1">{portalLink}</span>
                                    <button onClick={() => { navigator.clipboard.writeText(portalLink); alert('Copiado'); }} className="p-2 bg-slate-900 text-white rounded-lg"><Copy size={14}/></button>
                                </div>
                            </div>
                            <div className="mt-auto pt-6 border-t border-slate-50">
                                <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3">
                                    <QrCode size={18}/> Descargar QR Mostrador
                                </button>
                            </div>
                        </div>

                        {/* E-COMMERCE SHOP */}
                        <div className="bg-slate-900 p-10 rounded-[3rem] text-white space-y-8 flex flex-col relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 p-8 opacity-5"><ShoppingBag size={180}/></div>
                            <div className="relative z-10 flex items-center gap-4">
                                <div className="p-4 bg-indigo-600 text-white rounded-3xl shadow-xl shadow-indigo-900/50"><Globe size={28}/></div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tighter">Tienda Online Cloud</h3>
                                    <p className="text-[10px] text-indigo-400 font-bold uppercase">Catálogo con Venta Directa</p>
                                </div>
                            </div>
                            <div className="relative z-10 bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">URL para Redes Sociales</label>
                                <div className="bg-slate-950 p-3 rounded-xl border border-white/5 flex items-center gap-3">
                                    <Link size={14} className="text-slate-600"/>
                                    <span className="text-[10px] font-mono truncate flex-1 text-indigo-300">{shopLink}</span>
                                    <button onClick={() => { navigator.clipboard.writeText(shopLink); alert('Link Tienda Copiado'); }} className="p-2 bg-white text-slate-900 rounded-lg hover:bg-indigo-400 transition-all"><Copy size={14}/></button>
                                </div>
                            </div>
                            <div className="mt-auto pt-6 border-t border-white/5 flex gap-4">
                                <button 
                                    onClick={() => window.open(shopLink, '_blank')}
                                    className="flex-1 bg-white text-slate-900 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                                    <ExternalLink size={16}/> Abrir Tienda
                                </button>
                                <button className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                                    <Instagram size={16}/> Vincular IG
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* MODALES REUTILIZADOS */}
            {isCouponModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                        <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                            <h3 className="text-xl font-black uppercase tracking-tighter">Crear Cupón</h3>
                            <button onClick={() => setIsCouponModalOpen(false)}><X size={28}/></button>
                        </div>
                        <div className="p-10 space-y-6">
                            <div>
                                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Código del Cupón</label>
                                <input type="text" className="w-full p-3 bg-slate-50 border border-gray-200 rounded-xl font-black text-indigo-600 outline-none uppercase" value={couponForm.code} onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})} />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Descripción corta</label>
                                <input type="text" className="w-full p-3 bg-slate-50 border border-gray-200 rounded-xl font-bold text-slate-600 outline-none uppercase" value={couponForm.description} onChange={e => setCouponForm({...couponForm, description: e.target.value.toUpperCase()})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Tipo Descuento</label>
                                    <select className="w-full p-3 bg-slate-50 border border-gray-200 rounded-xl font-black text-xs uppercase outline-none" value={couponForm.discountType} onChange={e => setCouponForm({...couponForm, discountType: e.target.value as any})}>
                                        <option value="PERCENT">Porcentaje (%)</option>
                                        <option value="FIXED">Monto Fijo ($)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Valor</label>
                                    <input type="number" className="w-full p-3 bg-slate-50 border border-gray-200 rounded-xl font-black text-slate-800 outline-none" value={couponForm.value} onChange={e => setCouponForm({...couponForm, value: parseFloat(e.target.value) || 0})} />
                                </div>
                            </div>
                            <button onClick={handleSaveCoupon} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
                                <Save size={18}/> Guardar Cupón
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Marketing;
