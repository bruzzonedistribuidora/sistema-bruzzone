
import React, { useState, useEffect } from 'react';
import { 
    Cloud, RefreshCw, Smartphone, Database, 
    Zap, ShieldCheck, Key, ArrowRight, CheckCircle, 
    Download, Upload, AlertTriangle, Globe,
    Server, Copy, History, Share2, FileJson, Info
} from 'lucide-react';
import { CloudConfig, CloudSyncStatus } from '../types';
import { productDB } from '../services/storageService';

const CloudHub: React.FC = () => {
    const [config, setConfig] = useState<CloudConfig>(() => {
        const saved = localStorage.getItem('ferrecloud_sync_config');
        return saved ? JSON.parse(saved) : {
            enabled: false,
            vaultId: `BRUZZONE-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            lastSync: 'Nunca',
            autoSync: true,
            apiUrl: ''
        };
    });

    const [status, setStatus] = useState<CloudSyncStatus>('OFFLINE');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        localStorage.setItem('ferrecloud_sync_config', JSON.stringify(config));
        setStatus(config.enabled ? 'ONLINE' : 'OFFLINE');
    }, [config]);

    const exportFullDatabase = async () => {
        setIsProcessing(true);
        try {
            const products = await productDB.getAll();
            const clients = JSON.parse(localStorage.getItem('ferrecloud_clients') || '[]');
            const providers = JSON.parse(localStorage.getItem('ferrecloud_providers') || '[]');
            const configData = JSON.parse(localStorage.getItem('company_config') || '{}');

            const fullData = {
                products,
                clients,
                providers,
                config: configData,
                timestamp: new Date().toISOString(),
                vaultId: config.vaultId
            };

            const blob = new Blob([JSON.stringify(fullData)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `SINCRO_BRUZZONE_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            
            setConfig(prev => ({ ...prev, lastSync: new Date().toLocaleString(), enabled: true }));
            alert("✅ Paquete de datos generado. Cárgalo en tu otra PC usando el botón 'Cargar Paquete de Datos'.");
        } catch (error) {
            alert("Error al exportar datos.");
        } finally {
            setIsProcessing(false);
        }
    };

    const importFullDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                setIsProcessing(true);
                const data = JSON.parse(event.target?.result as string);
                
                if (data.products) {
                    await productDB.clearAll();
                    await productDB.saveBulk(data.products);
                }
                if (data.clients) localStorage.setItem('ferrecloud_clients', JSON.stringify(data.clients));
                if (data.providers) localStorage.setItem('ferrecloud_providers', JSON.stringify(data.providers));
                if (data.config) localStorage.setItem('company_config', JSON.stringify(data.config));
                
                setConfig(prev => ({ ...prev, vaultId: data.vaultId || prev.vaultId, lastSync: new Date().toLocaleString(), enabled: true }));
                alert("✅ Sincronización exitosa. Los datos de la otra PC han sido aplicados correctamente.");
                window.location.reload();
            } catch (err) {
                alert("Error: El archivo de datos no es válido.");
            } finally {
                setIsProcessing(false);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="p-8 max-w-6xl mx-auto h-full space-y-8 animate-fade-in bg-slate-50 overflow-y-auto pb-20">
            <div className="bg-white p-10 rounded-[3rem] border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
                <div className="absolute -top-10 -left-10 p-20 opacity-5 text-indigo-600 pointer-events-none">
                    <Globe size={240}/>
                </div>
                <div className="flex items-center gap-8 relative z-10">
                    <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center transition-all shadow-inner ${status === 'ONLINE' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                        {isProcessing ? <RefreshCw size={48} className="animate-spin"/> : <Cloud size={48} />}
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase leading-none">Nube Bruzzone</h2>
                        <p className="text-gray-400 mt-2 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                             Status: <span className={status === 'ONLINE' ? 'text-green-600' : 'text-slate-400'}>{status}</span>
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-3 italic">Ultima sincronización: {config.lastSync}</p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 relative z-10">
                    <label className="bg-slate-900 text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 cursor-pointer hover:bg-slate-800">
                        <Upload size={20}/> Cargar Paquete de Datos
                        <input type="file" className="hidden" accept=".json" onChange={importFullDatabase} />
                    </label>
                    <button 
                        onClick={exportFullDatabase}
                        disabled={isProcessing}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-100 flex items-center justify-center gap-3 transition-all active:scale-95">
                        <Download size={20}/> Generar Sincronizador
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm space-y-8">
                    <h3 className="font-black text-xl text-slate-800 uppercase tracking-tighter flex items-center gap-3 border-b pb-6">
                        <Key size={24} className="text-indigo-600"/> Enlace Multi-PC Directo
                    </h3>
                    <p className="text-slate-500 font-medium text-sm leading-relaxed">
                        Para ver los mismos 140.000 artículos en todas sus computadoras, genere un paquete de datos en su PC principal y cárguelo en las terminales secundarias. Los cambios se unificarán.
                    </p>
                    <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-dashed border-indigo-100 space-y-4">
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block text-center">ID Único de Bóveda</label>
                        <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-indigo-50 shadow-inner">
                            <span className="text-4xl font-mono font-black text-slate-800 tracking-widest">{config.vaultId}</span>
                            <button onClick={() => { navigator.clipboard.writeText(config.vaultId); alert("ID Copiado"); }} className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all active:scale-90 shadow-lg">
                                <Copy size={20}/>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5"><Server size={180}/></div>
                    <div className="relative z-10">
                        <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3 mb-6">
                            <Zap size={22} className="text-ferre-orange"/> Conexión API (Avanzado)
                        </h3>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed mb-8">Si dispone de un servidor web, ingrese la URL base para habilitar la sincronización automática en tiempo real entre todas las sucursales.</p>
                        <div className="space-y-4">
                            <input 
                                type="text" 
                                placeholder="https://api.tuferreteria.com/sync"
                                className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none font-bold text-sm focus:bg-white/10 transition-all"
                                value={config.apiUrl}
                                onChange={e => setConfig({...config, apiUrl: e.target.value})}
                            />
                            <button className="w-full bg-white/10 hover:bg-white/20 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">Verificar Punto de Enlace</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-amber-50 rounded-[2.5rem] border border-amber-200 p-8 flex items-start gap-6">
                <div className="p-3 bg-white rounded-2xl shadow-md text-amber-600"><AlertTriangle size={24}/></div>
                <div>
                    <h4 className="font-black text-amber-800 uppercase tracking-widest text-xs">Nota sobre los 140.000 artículos</h4>
                    <p className="text-sm text-amber-700 font-medium mt-1">El volumen de datos de su ferretería es masivo. Se recomienda usar la exportación por paquete de datos para asegurar que todas las PCs tengan exactamente el mismo catálogo antes de activar la sincronización automática.</p>
                </div>
            </div>
        </div>
    );
};

export default CloudHub;
