
import React, { useState, useEffect } from 'react';
import { 
    Cloud, RefreshCw, Save, Zap, CloudDownload, Smartphone,
    Network, Wifi, ShieldCheck, FileUp, Monitor, 
    ArrowRight, Info, AlertTriangle, CheckCircle2, History,
    Terminal, User, Activity, Clock, Link, Copy, PlusCircle,
    Server, Key, Database, Lock, Globe
} from 'lucide-react';
import { syncService } from '../services/syncService';
import { productDB } from '../services/storageService';
import { RestApiConfig } from '../types';

const CloudHub: React.FC = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [mode, setMode] = useState<'LAN' | 'REST'>('LAN');
    const [vaultId, setVaultId] = useState(syncService.getVaultId() || '');
    const [terminalName, setTerminalName] = useState(localStorage.getItem('ferrecloud_terminal_name') || '');
    const [lastSync, setLastSync] = useState(localStorage.getItem('ferrecloud_last_sync') || 'Nunca');
    
    // Configuración API REST
    const [restConfig, setRestConfig] = useState<RestApiConfig>(syncService.getApiConfig());

    const handleSaveLAN = () => {
        if (!vaultId || !terminalName) return alert("Completa todos los campos.");
        syncService.setVaultId(vaultId.trim().toUpperCase());
        localStorage.setItem('ferrecloud_terminal_name', terminalName.toUpperCase().trim());
        syncService.syncFromRemote();
        alert("✅ Vínculo LAN/P2P establecido.");
    };

    const handleSaveREST = () => {
        if (!restConfig.baseUrl) return alert("Ingresa la URL de tu servidor.");
        syncService.setApiConfig({ ...restConfig, enabled: true });
        localStorage.setItem('ferrecloud_terminal_name', terminalName.toUpperCase().trim());
        syncService.syncFromRemote();
        alert("✅ Persistencia vía API REST Activada.");
    };

    return (
        <div className="p-8 max-w-7xl mx-auto h-full space-y-8 animate-fade-in bg-slate-50 overflow-y-auto pb-32">
            
            <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none"><Cloud size={240}/></div>
                <div className="relative z-10 space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg"><Globe size={28}/></div>
                        <div>
                            <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Configuración de Red Maestro</h2>
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">Gestión de Sincronización y Persistencia</p>
                        </div>
                    </div>

                    <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 w-fit">
                        <button onClick={() => setMode('LAN')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${mode === 'LAN' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}>Vínculo P2P / LAN</button>
                        <button onClick={() => setMode('REST')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${mode === 'REST' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}>Base de Datos Central (API REST)</button>
                    </div>

                    {mode === 'LAN' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
                            <div className="lg:col-span-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-indigo-400 uppercase ml-2 tracking-widest">ID de Bóveda LAN</label>
                                        <input className="w-full p-4 bg-white/5 border-2 border-white/10 rounded-2xl font-black text-indigo-400 outline-none focus:border-indigo-500 uppercase" value={vaultId} onChange={e => setVaultId(e.target.value)} placeholder="EJ: FERRE-1234"/>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Nombre PC</label>
                                        <input className="w-full p-4 bg-white/5 border-2 border-white/10 rounded-2xl font-black text-white outline-none focus:border-indigo-500 uppercase" value={terminalName} onChange={e => setTerminalName(e.target.value)} placeholder="EJ: CAJA-01"/>
                                    </div>
                                </div>
                                <button onClick={handleSaveLAN} className="w-full bg-indigo-600 py-5 rounded-[1.8rem] font-black uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3">
                                    <ShieldCheck size={24}/> ACTIVAR VÍNCULO LAN
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
                            <div className="lg:col-span-8 space-y-6">
                                <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-indigo-400 uppercase ml-2 tracking-widest flex items-center gap-2">
                                            <Server size={14}/> URL del Servidor API (Nube)
                                        </label>
                                        <input className="w-full p-4 bg-white/10 border-2 border-transparent rounded-2xl font-bold text-white outline-none focus:border-indigo-500" value={restConfig.baseUrl} onChange={e => setRestConfig({...restConfig, baseUrl: e.target.value})} placeholder="https://tu-api-ferreteria.com/v1"/>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest flex items-center gap-2">
                                            <Lock size={14}/> Token de Acceso / API Key
                                        </label>
                                        <input type="password" className="w-full p-4 bg-white/10 border-2 border-transparent rounded-2xl font-mono text-white outline-none focus:border-indigo-500" value={restConfig.apiKey} onChange={e => setRestConfig({...restConfig, apiKey: e.target.value})} placeholder="pk_live_xxxxxxxxxxxx"/>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Identificador de Terminal</label>
                                            <input className="w-full p-4 bg-white/10 border-2 border-transparent rounded-2xl font-black uppercase text-white" value={terminalName} onChange={e => setTerminalName(e.target.value)} placeholder="PC-VENTAS-01"/>
                                        </div>
                                        <div className="flex items-end">
                                            <button onClick={handleSaveREST} className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/20">Guardar y Conectar</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="lg:col-span-4 space-y-4">
                                <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] flex flex-col items-center text-center space-y-4">
                                    <Database size={48} className="text-indigo-400 opacity-50"/>
                                    <h4 className="font-black uppercase text-xs">Sincronización de Base de Datos</h4>
                                    <p className="text-[10px] text-slate-400 leading-relaxed">Este modo permite persistencia real en una base de datos SQL o NoSQL centralizada. Ideal para trabajar entre sucursales o desde casa.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
                    <h4 className="font-black text-slate-800 uppercase text-xs flex items-center gap-2">
                        <Activity size={18} className="text-indigo-600"/> Estado de los Artículos (140k)
                    </h4>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                            <span className="text-[10px] font-black text-slate-400 uppercase">Cargados en Memoria Local</span>
                            <span className="font-black text-lg text-indigo-600">Sincronizado</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                            <span className="text-[10px] font-black text-slate-400 uppercase">Última Sincronización</span>
                            <span className="font-bold text-xs text-slate-500">{lastSync}</span>
                        </div>
                    </div>
                </div>
                <div className="bg-amber-50 p-8 rounded-[2.5rem] border border-amber-100 space-y-4">
                    <h4 className="font-black text-amber-800 uppercase text-xs flex items-center gap-2">
                        <AlertTriangle size={18}/> Nota Técnica
                    </h4>
                    <p className="text-xs text-amber-700 leading-relaxed font-medium">
                        El sistema prioriza la velocidad local. Si pierdes internet, puedes seguir vendiendo y cargando productos. Al recuperar la señal, el sistema enviará automáticamente todos los cambios acumulados a la nube central.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CloudHub;
