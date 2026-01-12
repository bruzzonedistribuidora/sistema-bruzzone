
import React, { useState, useEffect } from 'react';
import { 
    Tags, Plus, Trash2, Edit2, Save, X, 
    ArrowRight, Percent, DollarSign, Calculator,
    ShieldCheck, CheckCircle, List
} from 'lucide-react';
import { PriceList } from '../types';

const PriceLists: React.FC = () => {
    const [lists, setLists] = useState<PriceList[]>(() => {
        const saved = localStorage.getItem('ferrecloud_price_lists');
        return saved ? JSON.parse(saved) : [
            { id: '1', name: 'Lista Mostrador (Base)', type: 'BASE', fixedMargin: 30, active: true },
            { id: '2', name: 'Lista Mayorista', type: 'DERIVED', baseListId: '1', adjustmentPercentage: -10, active: true },
            { id: '3', name: 'Lista Gremio', type: 'DERIVED', baseListId: '1', adjustmentPercentage: -5, active: true }
        ];
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingList, setEditingList] = useState<PriceList | null>(null);
    const [formData, setFormData] = useState<Partial<PriceList>>({
        name: '', type: 'BASE', fixedMargin: 0, adjustmentPercentage: 0, active: true
    });

    useEffect(() => {
        localStorage.setItem('ferrecloud_price_lists', JSON.stringify(lists));
    }, [lists]);

    const handleSave = () => {
        if (!formData.name) return;

        if (editingList) {
            setLists(lists.map(l => l.id === editingList.id ? { ...l, ...formData } as PriceList : l));
        } else {
            setLists([...lists, { ...formData, id: `list-${Date.now()}` } as PriceList]);
        }
        setIsModalOpen(false);
    };

    const deleteList = (id: string) => {
        if (confirm('¿Eliminar esta lista de precios? Los clientes asociados perderán su referencia.')) {
            setLists(lists.filter(l => l.id !== id));
        }
    };

    return (
        <div className="p-8 h-full flex flex-col space-y-6 bg-slate-50 overflow-hidden font-sans">
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 shrink-0">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-slate-900 text-indigo-400 rounded-3xl shadow-xl">
                        <Tags size={32}/>
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Listas de Precios</h2>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2 flex items-center gap-2">
                             Configuración de Márgenes y Segmentos de Venta
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => { setFormData({name: '', type: 'BASE', fixedMargin: 30, active: true}); setEditingList(null); setIsModalOpen(true); }}
                    className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-3 active:scale-95"
                >
                    <Plus size={20}/> Nueva Lista
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pb-10">
                {lists.map(list => (
                    <div key={list.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                            <div className={`p-4 rounded-2xl ${list.type === 'BASE' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'} group-hover:scale-110 transition-transform`}>
                                {list.type === 'BASE' ? <Calculator size={24}/> : <Percent size={24}/>}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => { setEditingList(list); setFormData(list); setIsModalOpen(true); }} className="p-2 text-indigo-600 bg-indigo-50 rounded-xl"><Edit2 size={16}/></button>
                                <button onClick={() => deleteList(list.id)} className="p-2 text-red-500 bg-red-50 rounded-xl"><Trash2 size={16}/></button>
                            </div>
                        </div>

                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none mb-2">{list.name}</h3>
                        <div className="flex items-center gap-2 mb-8">
                             <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest ${list.type === 'BASE' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                                {list.type === 'BASE' ? 'Lista Base' : 'Lista Derivada'}
                             </span>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-6">
                            {list.type === 'BASE' ? (
                                <>
                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Margen sobre costo</p>
                                    <h4 className="text-4xl font-black text-indigo-600 tracking-tighter">{list.fixedMargin}%</h4>
                                </>
                            ) : (
                                <>
                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Ajuste sobre Base</p>
                                    <div className="flex items-center gap-2">
                                        <h4 className={`text-4xl font-black tracking-tighter ${list.adjustmentPercentage! >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {list.adjustmentPercentage! >= 0 ? '+' : ''}{list.adjustmentPercentage}%
                                        </h4>
                                        <div className="text-[8px] font-bold text-slate-400 uppercase leading-tight">
                                            Referencia:<br/>
                                            {lists.find(l => l.id === list.baseListId)?.name || 'Desconocida'}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <div className={`w-2 h-2 rounded-full ${list.active ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                            {list.active ? 'Lista Habilitada' : 'Pausada'}
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                        <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                            <h3 className="font-black uppercase tracking-widest text-sm">{editingList ? 'Editar Lista' : 'Nueva Lista Maestro'}</h3>
                            <button onClick={() => setIsModalOpen(false)}><X size={28}/></button>
                        </div>
                        <div className="p-10 space-y-6 bg-slate-50/50">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-2">Nombre de la Lista</label>
                                <input type="text" className="w-full p-4 bg-white border border-gray-200 rounded-2xl font-black text-slate-800 uppercase focus:border-indigo-600 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setFormData({...formData, type: 'BASE'})} className={`py-4 rounded-xl font-black text-[9px] uppercase border-2 transition-all ${formData.type === 'BASE' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'bg-white text-slate-400'}`}>Lista Base</button>
                                <button onClick={() => setFormData({...formData, type: 'DERIVED'})} className={`py-4 rounded-xl font-black text-[9px] uppercase border-2 transition-all ${formData.type === 'DERIVED' ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'bg-white text-slate-400'}`}>Lista Derivada</button>
                            </div>

                            {formData.type === 'BASE' ? (
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-2">Margen Fijo (%)</label>
                                    <input type="number" className="w-full p-4 bg-white border border-gray-200 rounded-2xl font-black text-2xl text-indigo-600" value={formData.fixedMargin} onChange={e => setFormData({...formData, fixedMargin: parseFloat(e.target.value) || 0})} />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-2">Lista Base de Referencia</label>
                                        <select className="w-full p-4 bg-white border border-gray-200 rounded-2xl font-black text-xs uppercase" value={formData.baseListId} onChange={e => setFormData({...formData, baseListId: e.target.value})}>
                                            <option value="">-- Seleccionar Base --</option>
                                            {lists.filter(l => l.type === 'BASE').map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-2">Ajuste (%)</label>
                                        <input type="number" className="w-full p-4 bg-white border border-gray-200 rounded-2xl font-black text-2xl text-emerald-600" placeholder="-10 para 10% de descuento" value={formData.adjustmentPercentage} onChange={e => setFormData({...formData, adjustmentPercentage: parseFloat(e.target.value) || 0})} />
                                    </div>
                                </div>
                            )}

                            <button onClick={handleSave} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3">
                                <Save size={20}/> Guardar Lista
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PriceLists;
