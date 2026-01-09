import React, { useState, useEffect } from 'react';
import { 
    Cloud, RefreshCw, Database, Key, Download, Upload, Globe, Server, Copy,
    Zap, ShieldCheck, Smartphone, Info, History, Share2, FileJson,
    ToggleLeft, ToggleRight, CheckCircle2, AlertTriangle, Wifi, WifiOff,
    Monitor, Laptop, Laptop2
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
            alert("⚠️ Primero debe configurar una URL de API válida.");
            return;
        }
        setConfig(prev => ({ ...prev, enabled: !prev.enabled }));
    };

    const runFullGlobalSync = async () => {
        if (!config.enabled) {
            alert("Debe activar el sistema primero.");
            return;
        }
        setIsProcessing(true);
        try {
            await syncService.syncEverything();
            const now = new Date().toLocaleString();
            setConfig(prev => ({ ...prev, lastSync: now }));
            alert("✅ Sincronización Maestra Exitosa. Todos los terminales leerán estos datos al abrir el sistema.");
        } catch (error) {
            alert("Error durante la sincronización.");
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
                            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Sincronización Total</h2>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${status === 'ONLINE' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                {status}
                            </span>
                        </div>
                        <p className="text-gray-400 mt-2 font-bold uppercase tracking-widest text-xs">
                             Tus datos disponibles en cualquier PC al instante
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-3 italic flex items-center gap-2">
                            <History size={12}/> Último refresco: {config.lastSync}
                        </p>
                    </div>
                </div>
                <div className="flex flex-col gap-3 relative z-10 w-full md:w-auto">
                    <button 
                        onClick={handleToggleAutoSync}
                        className={`px-8 py-4 rounded-[1.8rem] font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 ${config.enabled ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                        {config.enabled ? <ToggleRight size={24}/> : <ToggleLeft size={24}/>}
                        {config.enabled ? 'SISTEMA VINCULADO' : 'ACTIVAR VINCULACIÓN'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* EXPLICACIÓN MULTI-PC */}
                <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm space-y-8 flex flex-col">
                    <div className="border-b pb-6 flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Monitor size={24}/></div>
                        <h3 className="font-black text-xl text-slate-800 uppercase tracking-tighter">¿Cómo sincronizar otra PC?</h3>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs shrink-0">1</div>
                            <p className="text-sm text-slate-600 font-medium">Abre este mismo sistema en la otra computadora.</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs shrink-0">2</div>
                            <p className="text-sm text-slate-600 font-medium">Ve a esta sección y pega el <span className="font-black text-indigo-600">ID DE BÓVEDA</span> que ves a la derecha.</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs shrink-0">3</div>
                            <p className="text-sm text-slate-600 font-medium">¡Listo! La PC descargará automáticamente los 140.000 artículos y todo el historial.</p>
                        </div>
                    </div>

                    <div className="mt-auto bg-indigo-50 p-6 rounded-3xl border border-indigo-100 flex items-center gap-4">
                        <Zap className="text-indigo-600" size={24}/>
                        <p className="text-[10px] text-indigo-800 font-black uppercase tracking-tight">Cualquier cambio de stock en la PC 1 se verá en la PC 2 en menos de 60 segundos.</p>
                    </div>
                </div>

                {/* ID DE VÍNCULO */}
                <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5"><Key size={180}/></div>
                    <div className="relative z-10 space-y-8">
                        <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                            <div className="p-3 bg-white/10 text-indigo-400 rounded-2xl"><ShieldCheck size={24}/></div>
                            <h3 className="text-xl font-black uppercase tracking-tighter">ID Único de Bóveda</h3>
                        </div>
                        
                        <div className="bg-white/5 border-2 border-dashed border-white/20 p-8 rounded-[2rem] text-center space-y-4">
                             <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Código de Enlace Maestro</p>
                             <div className="flex items-center justify-center gap-4">
                                <input 
                                    type="text" 
                                    className="bg-transparent text-4xl font-mono font-black text-white text-center outline-none w-full"
                                    value={config.vaultId}
                                    onChange={e => setConfig({...config, vaultId: e.target.value.toUpperCase()})}
                                />
                                <button onClick={() => { navigator.clipboard.writeText(config.vaultId); alert("ID Copiado"); }} className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-500 shadow-lg">
                                    <Copy size={20}/>
                                </button>
                             </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Servidor de Enlace</label>
                            <input 
                                type="text" 
                                className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none font-bold text-sm text-indigo-300 focus:bg-white/10 transition-all"
                                value={config.apiUrl}
                                onChange={e => setConfig({...config, apiUrl: e.target.value})}
                            />
                        </div>

                        <button onClick={runFullGlobalSync} disabled={isProcessing || !config.enabled} className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3">
                            <Upload size={18}/> Subir Base Actual a la Nube
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="bg-amber-50 p-8 rounded-[2.5rem] border border-amber-200 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-white rounded-2xl text-amber-500 shadow-md">
                        <AlertTriangle size={32}/>
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-amber-900 uppercase tracking-tighter leading-none mb-1">Backup Manual Pre-Sincro</h4>
                        <p className="text-xs text-amber-700 font-medium">Si tienes datos importantes en esta PC y vas a pegar un ID nuevo, descarga un backup primero.</p>
                    </div>
                </div>
                <button className="bg-amber-500 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-amber-600 transition-all">
                    Descargar Respaldo JSON
                </button>
            </div>
        </div>
    );
};

export default CloudHub;
