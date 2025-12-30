
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Users, Plus, Search, Truck, X, Save, Phone, Mail, 
    MapPin, Hash, Trash2, Edit2, DollarSign, Building2, 
    Zap, RefreshCw, ChevronRight, UserPlus, FileText,
    TrendingUp, Percent, Info, ExternalLink
} from 'lucide-react';
import { Provider, TaxCondition } from '../types';
import { fetchCompanyByCuit } from '../services/geminiService';

const Providers: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSearchingCuit, setIsSearchingCuit] = useState(false);

    const [providers, setProviders] = useState<Provider[]>(() => {
        const saved = localStorage.getItem('ferrecloud_providers');
        return saved ? JSON.parse(saved) : [];
    });

    const [formData, setFormData] = useState<Partial<Provider>>({
        id: '',
        name: '',
        cuit: '',
        contact: '',
        phone: '',
        email: '',
        address: '',
        balance: 0,
        defaultDiscounts: [0, 0, 0],
        taxCondition: 'Responsable Inscripto'
    });

    useEffect(() => {
        localStorage.setItem('ferrecloud_providers', JSON.stringify(providers));
        // Notificar cambio de proveedores para otros componentes (como Compras)
        window.dispatchEvent(new Event('storage'));
    }, [providers]);

    const handleSearchCuit = async () => {
        if (!formData.cuit || formData.cuit.length < 10) return;
        setIsSearchingCuit(true);
        try {
            const data = await fetchCompanyByCuit(formData.cuit);
            if (data) {
                setFormData(prev => ({
                    ...prev,
                    name: data.razonSocial || data.name || prev.name,
                    address: data.address || data.domicilio || prev.address,
                    taxCondition: (data.condicionIva as TaxCondition) || prev.taxCondition
                }));
            }
        } catch (err) {
            console.error("Error buscando CUIT:", err);
        } finally {
            setIsSearchingCuit(false);
        }
    };

    const handleOpenModal = (provider?: Provider) => {
        if (provider) {
            setFormData(provider);
            setIsEditing(true);
        } else {
            setFormData({
                id: Date.now().toString(),
                name: '',
                cuit: '',
                contact: '',
                phone: '',
                email: '',
                address: '',
                balance: 0,
                defaultDiscounts: [0, 0, 0],
                taxCondition: 'Responsable Inscripto'
            });
            setIsEditing(false);
        }
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!formData.name || !formData.cuit) {
            alert("Razón Social y CUIT son campos obligatorios.");
            return;
        }

        setProviders(prev => {
            if (isEditing) {
                return prev.map(p => p.id === formData.id ? formData as Provider : p);
            } else {
                return [formData as Provider, ...prev];
            }
        });
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (confirm('¿Está seguro de eliminar este proveedor? Se perderá el historial de saldos asociados.')) {
            setProviders(prev => prev.filter(p => p.id !== id));
        }
    };

    const filteredProviders = providers.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.cuit.includes(searchTerm)
    );

    return (
        <div className="p-8 max-w-7xl mx-auto h-full flex flex-col space-y-6 bg-slate-50 overflow-hidden font-sans">
            
            {/* CABECERA */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 shrink-0">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-slate-900 text-indigo-400 rounded-3xl shadow-xl">
                        <Truck size={32}/>
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Gestión de Proveedores</h2>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Fichero Maestro de Abastecimiento</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <div className="relative w-64 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={18}/>
                        <input 
                            type="text" 
                            placeholder="Buscar..." 
                            className="w-full pl-11 pr-4 py-3 bg-slate-100 border-2 border-transparent rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all uppercase"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={() => handleOpenModal()}
                        className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2">
                        <UserPlus size={18}/> Nuevo Proveedor
                    </button>
                </div>
            </div>

            {/* TABLA DE PROVEEDORES */}
            <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900 text-[9px] font-black text-slate-300 uppercase tracking-widest sticky top-0 z-10">
                            <tr>
                                <th className="px-8 py-5">Razón Social / CUIT</th>
                                <th className="px-8 py-5">Contacto / Tel</th>
                                <th className="px-8 py-5 text-center">Bonif. Default</th>
                                <th className="px-8 py-5 text-right">Saldo Cuenta</th>
                                <th className="px-8 py-5 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredProviders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-32 text-center text-slate-300 font-black uppercase tracking-widest">
                                        No se han registrado proveedores aún
                                    </td>
                                </tr>
                            ) : filteredProviders.map(p => (
                                <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <p className="font-black text-slate-800 uppercase text-sm leading-none mb-1.5">{p.name}</p>
                                        <p className="text-[10px] text-gray-400 font-mono font-bold">{p.cuit}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="font-bold text-slate-600 text-xs uppercase mb-1">{p.contact || 'S/D'}</p>
                                        <div className="flex items-center gap-2 text-indigo-500 text-[10px] font-bold">
                                            <Phone size={12}/> {p.phone || '-'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <div className="flex justify-center gap-1">
                                            {p.defaultDiscounts.map((d, i) => (
                                                <span key={i} className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[9px] font-black border">
                                                    {d}%
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <p className={`text-xl font-black tracking-tighter ${p.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            ${p.balance.toLocaleString('es-AR')}
                                        </p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleOpenModal(p)} className="p-2.5 bg-slate-100 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"><Edit2 size={16}/></button>
                                            <button onClick={() => handleDelete(p.id)} className="p-2.5 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL: ALTA / EDICIÓN */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg"><Building2 size={24}/></div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tighter leading-none">{isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>
                                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-1">Configuración Fiscal y Comercial</p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28}/></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 bg-slate-50/30 custom-scrollbar space-y-8">
                            {/* SECCIÓN FISCAL */}
                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-4 border-b pb-4">1. Identificación Fiscal</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">CUIT</label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                className="flex-1 p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 outline-none font-black text-sm tracking-widest"
                                                placeholder="30-XXXXXXXX-X"
                                                value={formData.cuit}
                                                onChange={e => setFormData({...formData, cuit: e.target.value})}
                                            />
                                            <button 
                                                onClick={handleSearchCuit}
                                                disabled={isSearchingCuit}
                                                className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg hover:bg-indigo-700 transition-all">
                                                {isSearchingCuit ? <RefreshCw className="animate-spin" size={20}/> : <Zap size={20}/>}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Razón Social</label>
                                        <input 
                                            type="text" 
                                            className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 outline-none font-bold text-sm uppercase"
                                            value={formData.name}
                                            onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Condición IVA</label>
                                        <select 
                                            className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold text-sm"
                                            value={formData.taxCondition}
                                            onChange={e => setFormData({...formData, taxCondition: e.target.value as TaxCondition})}
                                        >
                                            <option value="Responsable Inscripto">Responsable Inscripto</option>
                                            <option value="Monotributo">Monotributo</option>
                                            <option value="Exento">Exento</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Dirección</label>
                                        <input 
                                            type="text" 
                                            className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 outline-none font-bold text-sm uppercase"
                                            value={formData.address}
                                            onChange={e => setFormData({...formData, address: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SECCIÓN COMERCIAL */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                                    <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] border-b pb-4">2. Contacto Comercial</h4>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Vendedor / Contacto</label>
                                            <input type="text" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 outline-none font-bold text-sm uppercase" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value.toUpperCase()})} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Teléfono</label>
                                                <input type="text" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 outline-none font-bold text-sm" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Email</label>
                                                <input type="email" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 outline-none font-bold text-sm" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-6 shadow-xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none"><Percent size={140}/></div>
                                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] border-b border-white/10 pb-4">3. Bonificaciones de Compra</h4>
                                    <p className="text-[10px] text-slate-400 font-medium italic">Se aplicarán automáticamente al cargar facturas de este proveedor.</p>
                                    <div className="grid grid-cols-3 gap-4">
                                        {[0, 1, 2].map(idx => (
                                            <div key={idx} className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center block">Desc. {idx + 1}</label>
                                                <div className="relative">
                                                    <input 
                                                        type="number" 
                                                        className="w-full p-4 bg-white/10 border-2 border-white/5 rounded-2xl focus:bg-white/20 focus:border-indigo-500 outline-none font-black text-xl text-center text-white"
                                                        value={formData.defaultDiscounts?.[idx]}
                                                        onChange={e => {
                                                            const newD = [...(formData.defaultDiscounts || [0,0,0])];
                                                            newD[idx] = parseFloat(e.target.value) || 0;
                                                            setFormData({...formData, defaultDiscounts: newD as [number, number, number]});
                                                        }}
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 font-black">%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-white border-t border-gray-100 flex justify-end gap-4 shrink-0">
                            <button onClick={() => setIsModalOpen(false)} className="px-8 py-3 text-gray-400 font-black text-[10px] uppercase tracking-widest">Cancelar</button>
                            <button onClick={handleSave} className="bg-slate-900 text-white px-12 py-4 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl flex items-center gap-3 active:scale-95 transition-all">
                                <Save size={18}/> {isEditing ? 'Actualizar Ficha' : 'Guardar Proveedor'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Providers;
