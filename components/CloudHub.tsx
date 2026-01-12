
import React, { useState, useEffect, useRef } from 'react';
import { 
    Cloud, RefreshCw, Save, Zap, CloudDownload, Smartphone,
    Network, Wifi, ShieldCheck, FileUp, Monitor, 
    ArrowRight, Info, AlertTriangle, CheckCircle2, History,
    Terminal, User, Activity, Clock, Link, Copy, PlusCircle,
    Server, Key, Database, Lock, Globe, HardDriveDownload, 
    HardDriveUpload, Link2, WifiOff, MonitorSmartphone, FileDown,
    X, Radio, Signal, Globe2
} from 'lucide-react';
import { syncService } from '../services/syncService';
import { productDB } from '../services/storageService';

const CloudHub: React.FC = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [vaultId, setVaultId] = useState(syncService.getVaultId() || '');
    const [terminalName, setTerminalName] = useState(localStorage.getItem('ferrecloud_terminal_name') || '');
    const [lastSync, setLastSync] = useState(localStorage.getItem('ferrecloud_last_sync') || 'Nunca');
    const [terminals, setTerminals] = useState<{name: string, isLocal: boolean}[]>([]);
    const [connectionLog, setConnectionLog] = useState<string[]>(["Puente Cloud Activado."]);
    
    const importFileRef = useRef<HTMLInputElement>(null);

    const addLog = (msg: string) => {
        setConnectionLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 5));
    };

    const updateStatus = async () => {
        const vid = syncService.getVaultId();
        const myName = localStorage.getItem('ferrecloud_terminal_name');
        
        if (vid) {
            try {
                const response = await fetch(`https://kvdb.io/2uD6vR8WpL8R4WpL8R4WpL/${vid}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.terminals) {
                        const list = Object.entries(data.terminals).map(([id, info]: [string, any]) => ({
                            name: info.name,
                            isLocal: info.name === myName
                        }));
                        setTerminals(list);
                    }
                }
            } catch (e) {
                addLog("Error de conexión remota.");
            }
            setLastSync(localStorage.getItem('ferrecloud_last_sync') || 'Sincronizando...');
        }
    };

    useEffect(() => {
        updateStatus();
        const interval = setInterval(updateStatus, 5000); // UI actualiza cada 5s
        window.addEventListener('ferrecloud_sync_pulse', updateStatus);
        return () => {
            clearInterval(interval);
            window.removeEventListener('ferrecloud_sync_pulse', updateStatus);
        };
    }, [vaultId]);

    const handleSave = async () => {
        if (!vaultId) return alert("Ingresa un ID de Bóveda.");
        if (!terminalName || terminalName === 'PC-SIN-NOMBRE') return alert("Debes ponerle un nombre único a esta computadora.");
        
        setIsProcessing(true);
        addLog(`Sincronizando con Bóveda: ${vaultId}...`);
        
        localStorage.setItem('ferrecloud_terminal_name', terminalName.toUpperCase().trim());
        syncService.setVaultId(vaultId);
        
        await syncService.syncFromRemote();
        setIsProcessing(false);
        addLog("Conexión establecida.");
        alert("✅ Vínculo Exitoso. Si otras PCs usan el mismo ID aparecerán aquí en segundos.");
    };

    return (
        <div className="p-8 max-w-7xl mx-auto h-full space-y-8 animate-fade-in bg-slate-50 overflow-y-auto pb-32">
            
            <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><Globe size={280}/></div>
                <div className="relative z-10 space-y-10">
                    <div className="flex items-center gap-5">
                        <div className="p-5 bg-indigo-600 rounded-[2rem] shadow-2xl shadow-indigo-600/20"><Signal size={36}/></div>
                        <div>
                            <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Interconexión Cloud</h2>
                            <p className="text-indigo-400 font-bold text-[10px] uppercase tracking-widest mt-2 flex items-center gap-2">
                                <Globe2 size={12} className="animate-pulse"/> Estado: {vaultId ? 'Sincronizado' : 'Sin vincular'}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8 space-y-8">
                            <div className="bg-white/5 p-8 rounded-[3rem] border border-white/10 space-y-8 shadow-inner">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-indigo-400 uppercase ml-2 tracking-widest flex items-center gap-2"><Key size={14}/> ID de Bóveda Compartido</label>
                                        <input 
                                            className="w-full p-5 bg-white/5 border-2 border-white/10 rounded-2xl font-black text-indigo-400 outline-none focus:border-indigo-500 uppercase text-2xl text-center shadow-lg transition-all" 
                                            value={vaultId} 
                                            onChange={e => setVaultId(e.target.value)} 
                                            placeholder="EJ: BRUZZONE2026"
                                        />
                                        <p className="text-[8px] text-slate-500 uppercase text-center font-bold">Usa el mismo en todas las sucursales.</p>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest flex items-center gap-2"><Monitor size={14}/> Nombre Único de PC</label>
                                        <input 
                                            className="w-full p-5 bg-white/5 border-2 border-white/10 rounded-2xl font-black text-white outline-none focus:border-indigo-500 uppercase text-2xl text-center shadow-lg transition-all" 
                                            value={terminalName} 
                                            onChange={e => setTerminalName(e.target.value)} 
                                            placeholder="EJ: MOSTRADOR-1"
                                        />
                                        <p className="text-[8px] text-amber-500 uppercase text-center font-bold">IMPORTANTE: No uses el mismo nombre en dos PCs.</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleSave} 
                                    disabled={isProcessing}
                                    className="w-full bg-indigo-600 py-7 rounded-[2.5rem] font-black uppercase tracking-[0.3em] shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 active:scale-95 transition-all flex items-center justify-center gap-4 text-sm">
                                    {isProcessing ? <RefreshCw className="animate-spin" size={24}/> : <ShieldCheck size={24}/>}
                                    {isProcessing ? 'CONECTANDO...' : 'VINCULAR AHORA'}
                                </button>
                            </div>

                            <div className="bg-black/40 p-6 rounded-2xl border border-white/5 space-y-2">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Activity size={12}/> Consola de Tráfico</p>
                                {connectionLog.map((log, i) => (
                                    <p key={i} className="text-[11px] font-mono text-indigo-300/70 leading-tight tracking-tighter">{log}</p>
                                ))}
                            </div>
                        </div>

                        <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-[3rem] p-8 flex flex-col space-y-6 shadow-2xl">
                            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-white/10 pb-4 flex items-center gap-2"><MonitorSmartphone size={16}/> Terminales Online</h3>
                            <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] custom-scrollbar pr-2">
                                {terminals.length === 0 ? (
                                    <div className="py-20 text-center opacity-30 italic text-xs flex flex-col items-center gap-4">
                                        <WifiOff size={40} strokeWidth={1}/>
                                        Buscando terminales...
                                    </div>
                                ) : terminals.map((t, idx) => (
                                    <div key={idx} className={`flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all border-l-4 ${t.isLocal ? 'border-l-indigo-500' : 'border-l-green-500'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${t.isLocal ? 'bg-indigo-500' : 'bg-green-500'}`}></div>
                                            <span className="text-xs font-black uppercase tracking-tight text-white">{t.name}</span>
                                        </div>
                                        <span className="text-[8px] text-slate-400 font-black uppercase">{t.isLocal ? 'Esta PC' : 'Online'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Resto de la UI (Export/Import) se mantiene igual */}
        </div>
    );
};

export default CloudHub;
