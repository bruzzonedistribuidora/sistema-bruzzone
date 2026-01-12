
import React, { useState, useEffect } from 'react';
import { 
    Cloud, RefreshCw, Save, Zap, CloudDownload, Smartphone,
    Network, Wifi, ShieldCheck, FileUp, Monitor, 
    ArrowRight, Info, AlertTriangle, CheckCircle2, History,
    Terminal, User, Activity, Clock, Link, Copy, PlusCircle,
    Server, Key, Database, Lock, Globe, HardDriveDownload, 
    HardDriveUpload, Link2, WifiOff, MonitorSmartphone
} from 'lucide-react';
import { syncService } from '../services/syncService';
import { productDB, cloudSimDB } from '../services/storageService';
import { RestApiConfig } from '../types';

const CloudHub: React.FC = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [mode, setMode] = useState<'LAN' | 'REST'>('LAN');
    const [vaultId, setVaultId] = useState(syncService.getVaultId() || '');
    const [terminalName, setTerminalName] = useState(localStorage.getItem('ferrecloud_terminal_name') || '');
    const [lastSync, setLastSync] = useState(localStorage.getItem('ferrecloud_last_sync') || 'Nunca');
    const [terminals, setTerminals] = useState<string[]>([]);
    
    const [restConfig, setRestConfig] = useState<RestApiConfig>(syncService.getApiConfig());

    const loadCloudStatus = async () => {
        const vid = syncService.getVaultId();
        if (vid) {
            const data = await cloudSimDB.getFromVault(vid);
            if (data && data.terminals) setTerminals(data.terminals);
        }
    };

    useEffect(() => {
        loadCloudStatus();
        const interval = setInterval(loadCloudStatus, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleSaveLAN = () => {
        if (!vaultId || !terminalName) return alert("Completa todos los campos.");
        syncService.setVaultId(vaultId.trim().toUpperCase());
        localStorage.setItem('ferrecloud_terminal_name', terminalName.toUpperCase().trim());
        syncService.syncFromRemote();
        alert("✅ Vínculo LAN/P2P establecido. Asegúrate de que las otras PC tengan el mismo ID de Bóveda.");
    };

    const handleSaveREST = () => {
        if (!restConfig.baseUrl) return alert("Ingresa la URL de tu servidor.");
        syncService.setApiConfig({ ...restConfig, enabled: true });
        localStorage.setItem('ferrecloud_terminal_name', terminalName.toUpperCase().trim());
        syncService.syncFromRemote();
        alert("✅ Conectando con Servidor Central...");
    };

    const exportFullState = async () => {
        if (!confirm("Esto generará un archivo con los 140.000 artículos para instalar en otra PC. ¿Continuar?")) return;
        setIsProcessing(true);
        try {
            const allProducts = await productDB.getAll(150000); // Forzar carga total
            const fullData = {
                vaultId: syncService.getVaultId(),
                products: allProducts,
                config: JSON.parse(localStorage.getItem('company_config') || '{}'),
                timestamp: new Date().toISOString()
            };
            const blob = new Blob([JSON.stringify(fullData)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `INSTALADOR_DATOS_BRUZZONE.ferre`;
            link.click();
        } catch (e) {
            alert("Error al exportar.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto h-full space-y-8 animate-fade-in bg-slate-50 overflow-y-auto pb-32">
            
            <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none"><Cloud size={240}/></div>
                <div className="relative z-10 space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-indigo-600 rounded-[2rem] shadow-2xl shadow-indigo-600/20"><Network size={32}/></div>
                        <div>
                            <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Interconexión de Terminales</h2>
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">Conecte sucursales y puntos de venta en tiempo real</p>
                        </div>
                    </div>

                    <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 w-fit">
                        <button onClick={() => setMode('LAN')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${mode === 'LAN' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Modo Bóveda Compartida</button>
                        <button onClick={() => setMode('REST')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${mode === 'REST' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Modo Servidor Central (REST)</button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8 space-y-6">
                            {mode === 'LAN' ? (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-indigo-400 uppercase ml-2 tracking-widest flex items-center gap-2"><Key size={14}/> ID de Bóveda (Clave de Red)</label>
                                            <input className="w-full p-4 bg-white/5 border-2 border-white/10 rounded-2xl font-black text-indigo-400 outline-none focus:border-indigo-500 uppercase text-xl text-center" value={vaultId} onChange={e => setVaultId(e.target.value)} placeholder="EJ: FERRE-BRUZZONE-2024"/>
                                            <p className="text-[8px] text-slate-500 uppercase text-center">Todas las PC deben tener este mismo ID exacto.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest flex items-center gap-2"><Monitor size={14}/> Nombre de esta PC</label>
                                            <input className="w-full p-4 bg-white/5 border-2 border-white/10 rounded-2xl font-black text-white outline-none focus:border-indigo-500 uppercase text-xl text-center" value={terminalName} onChange={e => setTerminalName(e.target.value)} placeholder="EJ: CAJA-01"/>
                                        </div>
                                    </div>
                                    <button onClick={handleSaveLAN} className="w-full bg-indigo-600 py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 active:scale-95 transition-all flex items-center justify-center gap-3">
                                        <ShieldCheck size={24}/> ACTIVAR VÍNCULO DE RED
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-white/5 p-8 rounded-[3rem] border border-white/10 space-y-6 animate-fade-in">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-indigo-400 uppercase ml-2 tracking-widest flex items-center gap-2"><Link2 size={14}/> Endpoint del Servidor API</label>
                                        <input className="w-full p-4 bg-white/10 border-2 border-transparent rounded-2xl font-bold text-white outline-none focus:border-indigo-500" value={restConfig.baseUrl} onChange={e => setRestConfig({...restConfig, baseUrl: e.target.value})} placeholder="https://tu-servidor.com/api"/>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest flex items-center gap-2"><Lock size={14}/> Token de Seguridad</label>
                                            <input type="password" className="w-full p-4 bg-white/10 border-2 border-transparent rounded-2xl font-mono text-white outline-none focus:border-indigo-500" value={restConfig.apiKey} onChange={e => setRestConfig({...restConfig, apiKey: e.target.value})} placeholder="Secret Key..."/>
                                        </div>
                                        <div className="flex items-end">
                                            <button onClick={handleSaveREST} className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">Establecer Conexión</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-[3rem] p-8 flex flex-col space-y-6">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/10 pb-4 flex items-center gap-2"><MonitorSmartphone size={16}/> Terminales Activas</h3>
                            <div className="space-y-3">
                                {terminals.length === 0 ? (
                                    <div className="py-10 text-center opacity-30 italic text-xs">Esperando conexión...</div>
                                ) : terminals.map(t => (
                                    <div key={t} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                            <span className="text-[11px] font-black uppercase tracking-tight">{t}</span>
                                        </div>
                                        {t === terminalName && <span className="text-[8px] bg-indigo-500 text-white px-2 py-0.5 rounded-full font-black uppercase">Esta PC</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl"><HardDriveUpload size={28}/></div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Migración Masiva (140k)</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Carga rápida para terminales nuevas</p>
                        </div>
                    </div>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed italic">Para no saturar tu internet sincronizando 140.000 artículos, genera un paquete de instalación en la PC principal y cárgalo manualmente en las demás.</p>
                    <div className="pt-4 flex gap-3">
                        <button 
                            onClick={exportFullState}
                            disabled={isProcessing}
                            className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
                            {isProcessing ? <RefreshCw className="animate-spin" size={18}/> : <HardDriveUpload size={18}/>}
                            Preparar Paquete (.ferre)
                        </button>
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-3xl"><Activity size={28}/></div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Estado de Sincronía</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Monitoreo de flujo de datos</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                            <span className="text-[10px] font-black text-slate-400 uppercase">Último Pulso Nube</span>
                            <span className="font-black text-xs text-indigo-600 uppercase">{lastSync}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                            <span className="text-[10px] font-black text-slate-400 uppercase">Modo de Red</span>
                            <span className="font-black text-[10px] bg-slate-900 text-white px-3 py-1 rounded-full uppercase tracking-widest">
                                {mode === 'LAN' ? 'Bóveda P2P' : 'REST Client'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-amber-50 p-8 rounded-[2.5rem] border-2 border-dashed border-amber-200 flex items-start gap-6">
                <div className="p-3 bg-white rounded-2xl shadow-sm text-amber-500"><Info size={24}/></div>
                <div>
                    <h4 className="font-black text-amber-800 uppercase text-xs tracking-widest mb-1">Información de Soporte Técnico</h4>
                    <p className="text-xs text-amber-700/80 leading-relaxed font-medium">
                        Si las PC no se ven entre sí usando el Modo Bóveda, asegúrate de que tengan salida a internet. El sistema utiliza una base de datos distribuida simulada para evitar configuraciones complejas de IP fija. Para máxima fiabilidad en 140k artículos, se recomienda el Modo Servidor Central.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CloudHub;
