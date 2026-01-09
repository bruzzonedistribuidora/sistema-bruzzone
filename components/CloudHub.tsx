
import React, { useState, useEffect } from 'react';
import { 
    Cloud, RefreshCw, Database, Key, Download, Upload, Globe, Server, Copy,
    Zap, ShieldCheck, Smartphone, Info, History, Share2, FileJson,
    ToggleLeft, ToggleRight, CheckCircle2, AlertTriangle, Wifi, WifiOff
} from 'lucide-react';
import { CloudConfig, CloudSyncStatus } from '../types';
import { productDB } from '../services/storageService';
import { syncService } from '../services/syncService';

const CloudHub: React.FC = () => {
    const [config, setConfig] = useState<CloudConfig>(() => {
        const saved = localStorage.getItem('ferrecloud_sync_config');
        return saved ? JSON.parse(saved) : {
            enabled: false,
            vaultId: `BRUZZONE-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            lastSync: 'Nunca',
            autoSync: true,
            apiUrl: 'https://cloud.ferrebruzzone.cloud/api/v1'
        };
    });

    const [status, setStatus] = useState<CloudSyncStatus>('OFFLINE');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        localStorage.setItem('ferrecloud_sync_config', JSON.stringify(config));
        setStatus(config.enabled ? 'ONLINE' : 'OFFLINE');
        window.dispatchEvent(new Event('ferrecloud_sync_config_updated'));
    }, [config]);

    const handleToggleAutoSync = () => {
        if (!config.apiUrl) {
            alert("⚠️ Primero debe configurar una URL de API válida para habilitar la nube.");
            return;
        }
        setConfig(prev => ({ ...prev, enabled: !prev.enabled }));
    };

    const runFullSync = async () => {
        setIsProcessing(true);
        try {
            await syncService.syncMasterDatabase();
            setConfig(prev => ({ ...prev, lastSync: new Date().toLocaleString() }));
            alert("✅ Base de datos maestra (140k artículos) sincronizada con la nube.");
        } catch (error) {
            alert("Error durante la sincronización masiva.");
        } finally {
            setIsProcessing(false);
        }
    };

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
        } catch (error) {
            alert("Error al exportar la base de datos.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto h-full space-y-8 animate-fade-in bg-slate-50 overflow-y-auto pb-20">
            {/* ESTADO GLOBAL */}
            <div className="bg-white p-10 rounded-[3rem] border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
                <div className="absolute -top-10 -left-10 p-20 opacity-5 text-indigo-600 pointer-events-none">
                    <Globe size={240}/>
                </div>
                <div className="flex items-center gap-8 relative z-10">
                    <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center transition-all shadow-inner ${status === 'ONLINE' ? 'bg-green-50 text-green-600 shadow-green-100' : 'bg-slate-100 text-slate-400'}`}>
                        {isProcessing ? <RefreshCw size={48} className="animate-spin"/> : (status === 'ONLINE' ? <Wifi size={48}/> : <WifiOff size={48}/>)}
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Nube Bruzzone</h2>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${status === 'ONLINE' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                {status}
                            </span>
                        </div>
                        <p className="text-gray-400 mt-2 font-bold uppercase tracking-widest text-xs">
                             Sincronización Automática Global
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-3 italic flex items-center gap-2">
                            <History size={12}/> Última vez: {config.lastSync}
                        </p>
                    </div>
                </div>
                <div className="flex flex-col gap-3 relative z-10 w-full md:w-auto">
                    <button 
                        onClick={handleToggleAutoSync}
                        className={`px-8 py-4 rounded-[1.8rem] font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 ${config.enabled ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                        {config.enabled ? <ToggleRight size={24}/> : <ToggleLeft size={24}/>}
                        {config.enabled ? 'AUTO-SYNC ACTIVO' : 'ACTIVAR AUTO-SYNC'}
                    </button>
                    <button onClick={runFullSync} disabled={isProcessing || !config.enabled} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-[1.8rem] font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-30">
                        <RefreshCw size={18}/> Sincronizar Ahora
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm space-y-8 flex flex-col">
                    <div className="border-b pb-6 flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Key size={24}/></div>
                        <h3 className="font-black text-xl text-slate-800 uppercase tracking-tighter">Bóveda Multi-PC</h3>
                    </div>
                    <p className="text-slate-500 font-medium text-sm leading-relaxed">
                        Copia este código en el resto de tus computadoras para que compartan el mismo stock y precios. 
                        <strong> Cualquier cambio en una PC se verá reflejado en las demás al instante.</strong>
                    </p>
                    <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-dashed border-indigo-100 space-y-4">
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block text-center">ID de Sincronización Maestra</label>
                        <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-indigo-50 shadow-inner">
                            <span className="text-3xl font-mono font-black text-slate-800 tracking-widest">{config.vaultId}</span>
                            <button onClick={() => { navigator.clipboard.writeText(config.vaultId); alert("ID Copiado"); }} className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all active:scale-90 shadow-lg">
                                <Copy size={20}/>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5"><Server size={180}/></div>
                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                            <div className="p-3 bg-white/10 text-indigo-400 rounded-2xl"><Zap size={24}/></div>
                            <h3 className="text-xl font-black uppercase tracking-tighter">Configuración Endpoint</h3>
                        </div>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">
                            URL del servidor central de Ferretería Bruzzone. Este servicio garantiza que los 140.000 artículos estén siempre actualizados.
                        </p>
                        <div className="space-y-4">
                            <div className="relative">
                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
                                <input 
                                    type="text" 
                                    placeholder="https://cloud.tuferreteria.com/api"
                                    className="w-full bg-white/5 border border-white/10 p-4 pl-12 rounded-2xl outline-none font-bold text-sm focus:bg-white/10 transition-all text-indigo-300"
                                    value={config.apiUrl}
                                    onChange={e => setConfig({...config, apiUrl: e.target.value})}
                                />
                            </div>
                            <div className="p-4 bg-blue-600/10 rounded-2xl border border-blue-500/20 flex items-start gap-4">
                                <Info className="text-indigo-400 shrink-0" size={20}/>
                                <p className="text-[10px] text-indigo-300 font-medium leading-relaxed uppercase">
                                    Si cambias el servidor, asegúrate de que el Vault ID sea el mismo en todas las terminales para evitar duplicación de datos.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="bg-amber-50 p-8 rounded-[2.5rem] border border-amber-200 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-white rounded-2xl text-amber-500 shadow-md">
                        <AlertTriangle size={32}/>
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-amber-900 uppercase tracking-tighter leading-none mb-1">Backup de Seguridad</h4>
                        <p className="text-xs text-amber-700 font-medium">Aunque uses la nube, siempre es recomendable tener un respaldo local.</p>
                    </div>
                </div>
                <button onClick={exportFullDatabase} className="bg-amber-500 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-amber-600 transition-all">
                    Descargar Respaldo JSON
                </button>
            </div>
        </div>
    );
};

export default CloudHub;
