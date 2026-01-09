
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    Users, Plus, Search, Truck, X, Save, Phone, Mail, 
    MapPin, Hash, Trash2, Edit2, DollarSign, Building2, 
    Zap, RefreshCw, ChevronRight, UserPlus, FileText,
    TrendingUp, Percent, Info, ExternalLink, ChevronUp, 
    ChevronDown, FileUp, CheckCircle, Sparkles, DatabaseZap,
    Download, Eye, History, Landmark, Receipt, ArrowLeft
} from 'lucide-react';
import { Provider, TaxCondition, CurrentAccountMovement } from '../types';
import { fetchCompanyByCuit } from '../services/geminiService';

const Providers: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSearchingCuit, setIsSearchingCuit] = useState(false);

    const [providers, setProviders] = useState<Provider[]>(() => {
        const saved = localStorage.getItem('ferrecloud_providers');
        return saved ? JSON.parse(saved) : [];
    });

    const [allMovements] = useState<CurrentAccountMovement[]>(() => {
        const saved = localStorage.getItem('ferrecloud_movements');
        return saved ? JSON.parse(saved) : [];
    });

    const [formData, setFormData] = useState<Partial<Provider>>({
        id: '', name: '', cuit: '', contact: '', phone: '', email: '', address: '',
        balance: 0, defaultDiscounts: [0, 0, 0], taxCondition: 'Responsable Inscripto'
    });

    useEffect(() => {
        localStorage.setItem('ferrecloud_providers', JSON.stringify(providers));
        window.dispatchEvent(new Event('storage'));
    }, [providers]);

    const filteredProviders = useMemo(() => {
        return providers.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            p.cuit.includes(searchTerm)
        ).sort((a, b) => {
            let aVal = a[sortConfig.key as keyof Provider] || '';
            let bVal = b[sortConfig.key as keyof Provider] || '';
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [providers, searchTerm, sortConfig]);

    const handleSave = () => {
        if (!formData.name || !formData.cuit) {
            alert("Razón Social y CUIT son obligatorios");
            return;
        }
        
        const providerData: Provider = {
            ...formData,
            id: formData.id || Date.now().toString(),
            balance: formData.balance || 0,
            defaultDiscounts: formData.defaultDiscounts || [0, 0, 0]
        } as Provider;

        setProviders(prev => isEditing 
            ? prev.map(p => p.id === providerData.id ? providerData : p) 
            : [providerData, ...prev]
        );
        
        setIsModalOpen(false);
        setFormData({ id: '', name: '', cuit: '', contact: '', phone: '', email: '', address: '', balance: 0, defaultDiscounts: [0,0,0], taxCondition: 'Responsable Inscripto' });
    };

    const handleExport = () => {
        const headers = "ID;RAZON_SOCIAL;CUIT;CONTACTO;TEL;EMAIL;SALDO\n";
        const csv = providers.map(p => `${p.id};${p.name};${p.cuit};${p.contact};${p.phone};${p.email};${p.balance}`).join("\n");
        const blob = new Blob(["\uFEFF" + headers + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `PROVEEDORES_MAESTRO.csv`;
        link.click();
    };

    const providerMovements = useMemo(() => {
        if (!selectedProvider) return [];
        return allMovements.filter(m => m.providerId === selectedProvider.id);
    }, [allMovements, selectedProvider]);

    if (selectedProvider) {
        return (
            <div className="h-full flex flex-col bg-slate-50 animate-fade-in overflow-hidden border-l border-slate-200">
                <div className="bg-white p-4 border-b flex justify-between items-center shrink-0">
                    <button onClick={() => setSelectedProvider(null)} className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase">
                        <ArrowLeft size={14}/> Volver al Listado
                    </button>
                    <div className="text-center">
                        <h3 className="font-black text-xs uppercase text-slate-800">{selectedProvider.name}</h3>
                        <p className="text-[8px] text-slate-400 font-bold uppercase">FICHA TÉCNICA DE PROVEEDOR</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => { setFormData(selectedProvider); setIsEditing(true); setIsModalOpen(true); }} className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200"><Edit2 size={14}/></button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-5 rounded-2xl border shadow-sm">
                            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Saldo Actual</p>
                            <h4 className={`text-2xl font-black ${selectedProvider.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>${selectedProvider.balance.toLocaleString()}</h4>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border shadow-sm">
                            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">CUIT</p>
                            <h4 className="text-xs font-black text-slate-700">{selectedProvider.cuit}</h4>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border shadow-sm">
                            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Contacto</p>
                            <h4 className="text-[10px] font-black text-slate-700 uppercase">{selectedProvider.contact || 'S/D'}</h4>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col min-h-[300px]">
                        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                            <h4 className="text-[9px] font-black uppercase tracking-widest flex items-center gap-2"><History size={14}/> Movimientos en Cuenta</h4>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b text-[8px] font-black uppercase text-slate-400">
                                    <tr><th className="px-4 py-2">Fecha</th><th className="px-4 py-2">Detalle</th><th className="px-4 py-2 text-right">Saldo</th></tr>
                                </thead>
                                <tbody className="divide-y text-[9px]">
                                    {providerMovements.map(m => (
                                        <tr key={m.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-2 font-bold text-slate-400">{m.date}</td>
                                            <td className="px-4 py-2 font-black uppercase">{m.voucherType}</td>
                                            <td className="px-4 py-2 text-right font-black text-slate-900">${m.balance.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {providerMovements.length === 0 && (
                                        <tr><td colSpan={3} className="py-10 text-center text-slate-300 font-black uppercase">Sin actividad reciente</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col space-y-3 animate-fade-in overflow-hidden">
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-2 shrink-0">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14}/>
                    <input type="text" placeholder="Filtrar proveedores..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border rounded-xl text-[10px] font-bold outline-none uppercase" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div className="flex gap-2">
                    <button onClick={handleExport} className="p-2 text-slate-400 hover:text-indigo-600" title="Exportar Proveedores"><Download size={16}/></button>
                    <button onClick={() => { setIsEditing(false); setFormData({id: '', name: '', cuit: '', contact: '', phone: '', email: '', address: '', balance: 0, defaultDiscounts: [0,0,0], taxCondition: 'Responsable Inscripto'}); setIsModalOpen(true); }} className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl font-black text-[8px] uppercase tracking-widest shadow-md">Nuevo Prov.</button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900 text-[8px] font-black text-slate-300 uppercase tracking-widest sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3">Razón Social</th>
                                <th className="px-4 py-3 text-right">Saldo</th>
                                <th className="px-4 py-3 text-center">Gestión</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredProviders.map(p => (
                                <tr key={p.id} className="hover:bg-indigo-50/20 transition-all group">
                                    <td className="px-4 py-2">
                                        <p className="font-black text-slate-800 text-[10px] uppercase truncate">{p.name}</p>
                                        <p className="text-[7px] text-gray-400 font-bold">CUIT: {p.cuit}</p>
                                    </td>
                                    <td className={`px-4 py-2 text-right font-black text-[11px] ${p.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        ${p.balance.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <button onClick={() => setSelectedProvider(p)} className="p-1.5 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-600 hover:text-white transition-all">
                                            <Eye size={12}/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[300] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                            <h3 className="text-[10px] font-black uppercase tracking-widest">{isEditing ? 'Editar Proveedor' : 'Alta de Proveedor'}</h3>
                            <button onClick={() => setIsModalOpen(false)}><X size={18}/></button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto">
                            <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">CUIT</label>
                                <input className="w-full p-2.5 bg-slate-100 border rounded-xl font-black text-xs" value={formData.cuit || ''} onChange={e => setFormData({...formData, cuit: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Razón Social</label>
                                <input className="w-full p-2.5 bg-slate-100 border rounded-xl font-black text-xs uppercase" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Contacto</label>
                                    <input className="w-full p-2.5 bg-slate-100 border rounded-xl font-bold text-xs uppercase" value={formData.contact || ''} onChange={e => setFormData({...formData, contact: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Teléfono</label>
                                    <input className="w-full p-2.5 bg-slate-100 border rounded-xl font-bold text-xs" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                                </div>
                            </div>
                            <button onClick={handleSave} className="w-full py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-indigo-600 transition-all mt-4">Guardar Registro</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Providers;
