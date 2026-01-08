
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    Users, Plus, Search, Truck, X, Save, Phone, Mail, 
    MapPin, Hash, Trash2, Edit2, DollarSign, Building2, 
    Zap, RefreshCw, ChevronRight, UserPlus, FileText,
    TrendingUp, Percent, Info, ExternalLink, ChevronUp, 
    ChevronDown, FileUp, CheckCircle, Sparkles, DatabaseZap
} from 'lucide-react';
import { Provider, TaxCondition } from '../types';
import { fetchCompanyByCuit } from '../services/geminiService';

const Providers: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSearchingCuit, setIsSearchingCuit] = useState(false);
    const [aiSources, setAiSources] = useState<{title: string, uri: string}[]>([]);

    // Estados para Importación Masiva
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importStep, setImportStep] = useState<1 | 2>(1);
    const [importRows, setImportRows] = useState<string[][]>([]);
    const [importHeaders, setImportHeaders] = useState<string[]>([]);
    const [importMapping, setImportMapping] = useState<Record<string, number>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [providers, setProviders] = useState<Provider[]>(() => {
        const saved = localStorage.getItem('ferrecloud_providers');
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

    // Lógica de Ordenamiento
    const sortedProviders = useMemo(() => {
        let sortableItems = [...providers];
        sortableItems.sort((a, b) => {
            let aValue = (a[sortConfig.key as keyof Provider] || '').toString().toLowerCase();
            let bValue = (b[sortConfig.key as keyof Provider] || '').toString().toLowerCase();
            
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sortableItems;
    }, [providers, sortConfig]);

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: string) => {
        if (sortConfig.key !== key) return <ChevronUp size={12} className="opacity-20"/>;
        return sortConfig.direction === 'asc' ? <ChevronUp size={12} className="text-indigo-400"/> : <ChevronDown size={12} className="text-indigo-400"/>;
    };

    const handleSearchCuit = async () => {
        if (!formData.cuit || formData.cuit.length < 10) return;
        setIsSearchingCuit(true);
        setAiSources([]);
        try {
            const data = await fetchCompanyByCuit(formData.cuit);
            if (data) {
                setFormData(prev => ({
                    ...prev,
                    name: data.razonSocial || data.name || prev.name,
                    address: data.address || data.domicilio || prev.address,
                    taxCondition: (data.condicionIva as TaxCondition) || prev.taxCondition
                }));
                setAiSources(data.sources || []);
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
                id: Date.now().toString(), name: '', cuit: '', contact: '', phone: '', email: '', address: '',
                balance: 0, defaultDiscounts: [0, 0, 0], taxCondition: 'Responsable Inscripto'
            });
            setIsEditing(false);
        }
        setAiSources([]);
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!formData.name || !formData.cuit) {
            alert("Razón Social y CUIT son obligatorios.");
            return;
        }
        setProviders(prev => isEditing ? prev.map(p => p.id === formData.id ? formData as Provider : p) : [formData as Provider, ...prev]);
        setIsModalOpen(false);
    };

    // --- LOGICA DE IMPORTACION MASIVA ---
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
            if (lines.length < 1) return;

            const separator = lines[0].includes(';') ? ';' : lines[0].includes('\t') ? '\t' : ',';
            const parsedRows = lines.map(line => line.split(separator).map(cell => cell.trim().replace(/^"|"$/g, '')));
            
            setImportHeaders(parsedRows[0]);
            setImportRows(parsedRows.slice(1));
            setImportStep(2);
        };
        reader.readAsText(file);
    };

    const confirmMassImport = () => {
        if (importMapping.name === undefined || importMapping.cuit === undefined) {
            alert("Debe mapear al menos Razón Social y CUIT.");
            return;
        }

        const existingCuits = new Set(providers.map(p => p.cuit.replace(/[^0-9]/g, '')));
        const newProviders: Provider[] = [];

        importRows.forEach((row, index) => {
            const rawCuit = row[importMapping.cuit] || '';
            const cleanCuit = rawCuit.replace(/[^0-9]/g, '');
            
            if (cleanCuit && !existingCuits.has(cleanCuit)) {
                newProviders.push({
                    id: `prov-bulk-${Date.now()}-${index}`,
                    name: (row[importMapping.name] || 'PROVEEDOR SIN NOMBRE').toUpperCase(),
                    cuit: rawCuit,
                    contact: importMapping.contact !== undefined ? row[importMapping.contact] : '',
                    phone: importMapping.phone !== undefined ? row[importMapping.phone] : '',
                    email: importMapping.email !== undefined ? row[importMapping.email] : '',
                    address: importMapping.address !== undefined ? row[importMapping.address] : '',
                    balance: 0,
                    defaultDiscounts: [0, 0, 0],
                    taxCondition: 'Responsable Inscripto'
                });
                existingCuits.add(cleanCuit);
            }
        });

        if (newProviders.length > 0) {
            setProviders(prev => [...newProviders, ...prev]);
            alert(`Sincronización Exitosa: Se cargaron ${newProviders.length} proveedores nuevos.`);
        } else {
            alert("No se encontraron proveedores nuevos o válidos para cargar.");
        }
        setIsImportModalOpen(false);
        setImportStep(1);
    };

    const filteredProviders = sortedProviders.filter(p => 
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
                        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Proveedores</h2>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Gestión de Abastecimiento (+{providers.length})</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={() => { setImportStep(1); setIsImportModalOpen(true); }}
                        className="bg-slate-100 text-slate-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 flex items-center gap-2">
                        <FileUp size={18}/> Carga Masiva
                    </button>
                    <button 
                        onClick={() => handleOpenModal()}
                        className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2">
                        <UserPlus size={18}/> Nuevo Proveedor
                    </button>
                </div>
            </div>

            {/* BARRA DE BÚSQUEDA */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm shrink-0">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={20}/>
                    <input 
                        type="text" 
                        placeholder="Buscar por Razón Social o CUIT..." 
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] text-sm font-bold outline-none focus:bg-white focus:border-indigo-100 transition-all uppercase"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* TABLA DE PROVEEDORES */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900 text-[9px] font-black text-slate-300 uppercase tracking-widest sticky top-0 z-10">
                            <tr>
                                <th className="px-8 py-5 cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => requestSort('name')}>
                                    <div className="flex items-center gap-2">Razón Social {getSortIcon('name')}</div>
                                </th>
                                <th className="px-8 py-5 cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => requestSort('cuit')}>
                                    <div className="flex items-center gap-2">CUIT {getSortIcon('cuit')}</div>
                                </th>
                                <th className="px-8 py-5">Contacto / Tel</th>
                                <th className="px-8 py-5 text-right">Saldo Cuenta</th>
                                <th className="px-8 py-5 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredProviders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-32 text-center text-slate-300 font-black uppercase tracking-widest">
                                        No se han encontrado proveedores
                                    </td>
                                </tr>
                            ) : filteredProviders.map(p => (
                                <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <p className="font-black text-slate-800 uppercase text-sm leading-none mb-1.5">{p.name}</p>
                                        <span className="text-[9px] font-black text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded uppercase">{p.taxCondition}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-[11px] text-gray-400 font-mono font-bold">{p.cuit}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="font-bold text-slate-600 text-xs uppercase mb-1">{p.contact || 'S/D'}</p>
                                        <div className="flex items-center gap-2 text-indigo-500 text-[10px] font-bold">
                                            <Phone size={12}/> {p.phone || '-'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <p className={`text-xl font-black tracking-tighter ${p.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            ${p.balance.toLocaleString('es-AR')}
                                        </p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleOpenModal(p)} className="p-2.5 bg-slate-100 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"><Edit2 size={16}/></button>
                                            <button onClick={() => setProviders(providers.filter(x => x.id !== p.id))} className="p-2.5 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"><Trash2 size={16}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL: CARGA MASIVA */}
            {isImportModalOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg"><DatabaseZap size={24}/></div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tighter leading-none">Importador de Proveedores</h3>
                                    <p className="text-[10px] font-bold text-indigo-300 uppercase mt-1">Carga Inteligente desde Excel / CSV</p>
                                </div>
                            </div>
                            <button onClick={() => setIsImportModalOpen(false)}><X size={28}/></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50 custom-scrollbar">
                            {importStep === 1 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-8 py-12 animate-fade-in">
                                    <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center text-indigo-600 border border-slate-100">
                                        <FileText size={48} />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Subir archivo de datos</h4>
                                        <p className="text-sm text-slate-500 max-w-sm mx-auto">Selecciona tu archivo .CSV o .TXT. El sistema detectará automáticamente las columnas para que puedas mapearlas.</p>
                                    </div>
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="bg-indigo-600 text-white px-12 py-5 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-indigo-700 transition-all flex items-center gap-3">
                                        <FileUp size={20}/> Seleccionar Archivo
                                    </button>
                                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.txt" onChange={handleFileUpload} />
                                </div>
                            ) : (
                                <div className="space-y-8 animate-fade-in">
                                    <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 flex items-start gap-4">
                                        <Info className="text-indigo-500 shrink-0" size={24}/>
                                        <p className="text-sm text-indigo-700 font-medium leading-relaxed">
                                            Se detectaron <span className="font-black">{importRows.length} filas</span>. Por favor, asigne a qué campo del sistema corresponde cada columna de su archivo.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { key: 'name', label: 'Razón Social / Nombre *', required: true },
                                            { key: 'cuit', label: 'CUIT / Identificación *', required: true },
                                            { key: 'contact', label: 'Nombre de Contacto' },
                                            { key: 'phone', label: 'Teléfono' },
                                            { key: 'email', label: 'Correo Electrónico' },
                                            { key: 'address', label: 'Dirección Comercial' },
                                        ].map(field => (
                                            <div key={field.key} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                    {field.label}
                                                </label>
                                                <select 
                                                    className="w-48 p-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
                                                    value={importMapping[field.key] ?? ''}
                                                    onChange={e => setImportMapping({...importMapping, [field.key]: e.target.value === '' ? undefined : parseInt(e.target.value)})}
                                                >
                                                    <option value="">-- Ignorar --</option>
                                                    {importHeaders.map((h, i) => <option key={i} value={i}>{h || `Columna ${i+1}`}</option>)}
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <button 
                                        onClick={confirmMassImport}
                                        className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-95">
                                        <CheckCircle size={24} className="text-green-400"/> Procesar {importRows.length} Proveedores
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: ALTA / EDICIÓN INDIVIDUAL */}
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
                            <button onClick={() => setIsModalOpen(false)}><X size={28}/></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 bg-slate-50/30 custom-scrollbar space-y-8">
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
                                        {/* Display AI grounding sources if available */}
                                        {aiSources.length > 0 && (
                                            <div className="mt-4 p-4 bg-blue-50 rounded-2xl border border-blue-100 animate-fade-in">
                                                <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                                    <Info size={10}/> Fuentes de información IA:
                                                </p>
                                                <div className="space-y-1">
                                                    {aiSources.map((s, idx) => (
                                                        <a key={idx} href={s.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[9px] font-bold text-blue-600 hover:underline">
                                                            <ExternalLink size={10}/> {s.title}
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
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
                            </div>

                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] border-b pb-4">2. Contacto Comercial</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Vendedor / Contacto</label>
                                        <input type="text" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 outline-none font-bold text-sm uppercase" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value.toUpperCase()})} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Teléfono</label>
                                        <input type="text" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 outline-none font-bold text-sm" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-white border-t border-gray-100 flex justify-end gap-4 shrink-0">
                            <button onClick={() => setIsModalOpen(false)} className="px-8 py-3 text-gray-400 font-black text-[10px] uppercase tracking-widest">Cancelar</button>
                            <button onClick={handleSave} className="bg-slate-900 text-white px-12 py-4 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl flex items-center gap-3 active:scale-95 transition-all">
                                <Save size={18}/> Guardar Proveedor
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Providers;
