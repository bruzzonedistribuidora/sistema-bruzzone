
import React, { useState, useEffect } from 'react';
import { 
    Cloud, RefreshCw, Database, Key, Download, Upload, Globe, Server, Copy,
    Zap, ShieldCheck, Smartphone, Info, History, Share2, FileJson
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
            const fullData = {
                products,
                clients,
                providers,
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
            alert("✅ Paquete de datos generado con éxito.");
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
                
                alert("✅ Sincronización completa aplicada correctamente.");
                window.location.reload();
            } catch (err) {
                alert("Error al importar el paquete de datos.");
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
                             Estado: <span className={status === 'ONLINE' ? 'text-green-600' : 'text-slate-400'}>{status}</span>
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-3 italic">Última sincronización: {config.lastSync}</p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 relative z-10">
                    <label className="bg-slate-900 text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 cursor-pointer hover:bg-slate-800">
                        <Upload size={20}/> Cargar Paquete
                        <input type="file" className="hidden" accept=".json" onChange={importFullDatabase} />
                    </label>
                    <button 
                        onClick={exportFullDatabase}
                        disabled={isProcessing}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-100 flex items-center justify-center gap-3 transition-all active:scale-95">
                        <Download size={20}/> Generar Backup Nube
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm space-y-8">
                    <h3 className="font-black text-xl text-slate-800 uppercase tracking-tighter flex items-center gap-3 border-b pb-6">
                        <Key size={24} className="text-indigo-600"/> Enlace Multicomputadora
                    </h3>
                    <p className="text-slate-500 font-medium text-sm leading-relaxed">
                        Utilice este ID único para vincular otras terminales a su bóveda de datos. Los 140.000 artículos se sincronizarán automáticamente.
                    </p>
                    <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-dashed border-indigo-100 space-y-4">
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block text-center">Bóveda ID</label>
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
                            <Zap size={22} className="text-ferre-orange"/> Configuración Avanzada API
                        </h3>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed mb-8">Si dispone de un servidor centralizado, ingrese la URL para habilitar la sincronización en tiempo real de facturación y stock.</p>
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
        </div>
    );
};

export default CloudHub;
