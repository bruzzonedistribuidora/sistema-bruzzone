
import React, { useState, useEffect } from 'react';
import { 
    DollarSign, Plus, Trash2, Edit2, Save, X, RefreshCw, 
    TrendingUp, Calendar, Hash, Globe, Building2
} from 'lucide-react';
import { CurrencyQuote, CompanyConfig } from '../types';

const Currencies: React.FC = () => {
    const [quotes, setQuotes] = useState<CurrencyQuote[]>(() => {
        const saved = localStorage.getItem('company_config');
        if (saved) {
            const config: CompanyConfig = JSON.parse(saved);
            return config.currencies || [
                { id: '1', name: 'Dólar Oficial', code: 'USD', value: 950, lastUpdate: new Date().toLocaleDateString() },
                { id: '2', name: 'Dólar MEP / Bolsa', code: 'USD', value: 1120, lastUpdate: new Date().toLocaleDateString() },
                { id: '3', name: 'Dólar Proveedor Especial', code: 'USD', value: 1050, lastUpdate: new Date().toLocaleDateString() }
            ];
        }
        return [];
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingQuote, setEditingQuote] = useState<CurrencyQuote | null>(null);
    const [formData, setFormData] = useState<Partial<CurrencyQuote>>({
        name: '', code: 'USD', value: 0
    });

    useEffect(() => {
        const saved = localStorage.getItem('company_config');
        const config: CompanyConfig = saved ? JSON.parse(saved) : { name: '', paymentAccounts: [] };
        config.currencies = quotes;
        localStorage.setItem('company_config', JSON.stringify(config));
        // Disparar evento para que otros componentes sepan que cambió la moneda
        window.dispatchEvent(new Event('company_config_updated'));
    }, [quotes]);

    const handleOpenModal = (quote?: CurrencyQuote) => {
        if (quote) {
            setEditingQuote(quote);
            setFormData(quote);
        } else {
            setEditingQuote(null);
            setFormData({ name: '', code: 'USD', value: 0 });
        }
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!formData.name || !formData.value) return;

        const newQuotes = [...quotes];
        if (editingQuote) {
            const idx = newQuotes.findIndex(q => q.id === editingQuote.id);
            newQuotes[idx] = { ...formData, id: editingQuote.id, lastUpdate: new Date().toLocaleDateString() } as CurrencyQuote;
        } else {
            newQuotes.push({
                ...formData,
                id: Date.now().toString(),
                lastUpdate: new Date().toLocaleDateString()
            } as CurrencyQuote);
        }
        setQuotes(newQuotes);
        setIsModalOpen(false);
    };

    const deleteQuote = (id: string) => {
        if (confirm('¿Desea eliminar esta cotización? Los proveedores asociados quedarán sin referencia.')) {
            setQuotes(quotes.filter(q => q.id !== id));
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto h-full space-y-8 animate-fade-in bg-slate-50 overflow-y-auto">
            <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                        <DollarSign size={32} className="text-green-600"/> Gestión Multidivisa
                    </h2>
                    <p className="text-gray-400 text-sm font-medium mt-1">Control de cotizaciones personalizadas para compras y valorización de stock.</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all flex items-center gap-2">
                    <Plus size={16}/> Nueva Cotización
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quotes.map(quote => (
                    <div key={quote.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-4 bg-green-50 text-green-600 rounded-2xl group-hover:scale-110 transition-transform">
                                <TrendingUp size={28}/>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => handleOpenModal(quote)} className="p-2 text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"><Edit2 size={16}/></button>
                                <button onClick={() => deleteQuote(quote.id)} className="p-2 text-red-500 bg-red-50 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16}/></button>
                            </div>
                        </div>

                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none mb-1">{quote.name}</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{quote.code} / ARS</p>

                        <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 mb-6">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Valor de Cambio</p>
                            <p className="text-4xl font-black text-slate-900 tracking-tighter">${quote.value.toLocaleString('es-AR')}</p>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                            <Calendar size={12}/> Actualizado: {quote.lastUpdate}
                        </div>
                    </div>
                ))}

                {quotes.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                        <RefreshCw size={48} className="mx-auto text-slate-200 mb-4"/>
                        <p className="text-slate-400 font-bold uppercase tracking-widest">No hay monedas configuradas</p>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                        <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-500 rounded-2xl"><Hash size={24}/></div>
                                <h3 className="font-black uppercase tracking-widest">{editingQuote ? 'Editar Cotización' : 'Nueva Moneda'}</h3>
                            </div>
                            <button onClick={() => setIsModalOpen(false)}><X size={28}/></button>
                        </div>
                        <div className="p-10 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nombre Descriptivo</label>
                                <input type="text" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-green-500 outline-none font-bold text-slate-800 uppercase" placeholder="Ej: Dólar Billete, Euro Bco Nación" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Código ISO</label>
                                    <input type="text" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-green-500 outline-none font-black text-slate-800" placeholder="USD" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Valor en Pesos ($)</label>
                                    <input type="number" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-green-500 outline-none font-black text-2xl text-green-700" placeholder="0.00" value={formData.value || ''} onChange={e => setFormData({...formData, value: parseFloat(e.target.value) || 0})} />
                                </div>
                            </div>
                            <button onClick={handleSave} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
                                <Save size={20}/> Guardar Cotización
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Currencies;
