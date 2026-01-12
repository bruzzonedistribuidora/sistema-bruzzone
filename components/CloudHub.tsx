
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
    const [diagnostics, setDiagnostics] = useState<string[]>(["Iniciando puente de datos..."]);
    const [isOnline, setIsOnline] = useState(false);
    
    const importFileRef = useRef<HTMLInputElement>(null);

    const addLog = (msg: string) => {
        setDiagnostics(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 8));
    };

    useEffect(() => {
        const handlePulse = (e: any) => {
            setIsOnline(true);
            const list = Object.entries(e.detail.terminals).map(([id, info]: [string, any]) => ({
                name: info.name,
                isLocal: info.name === terminalName.toUpperCase()
            }));
            setTerminals(list);
            setLastSync(localStorage.getItem('ferrecloud_last_sync') || 'Ahora');
            addLog("Pulso de red exitoso.");
        };

        const handleError = (e: any) => {
            setIsOnline(false);
            addLog(`Error detectado: ${e.detail.error}`);
        };

        window.addEventListener('ferrecloud_sync_pulse' as any, handlePulse);
        window.addEventListener('ferrecloud_sync_error' as any, handleError);
        
        return () => {
            window.removeEventListener('ferrecloud_sync_pulse' as any, handlePulse);
            window.removeEventListener('ferrecloud_sync_error' as any, handleError);
        };
    }, [terminalName]);

    const handleSave = async () => {
        if (!vaultId) return alert("Ingresa un ID de Bóveda.");
        if (!terminalName) return alert("Ponele un nombre a esta PC.");
        
        setIsProcessing(true);
        addLog(`Configurando ID: ${vaultId}...`);
        
        localStorage.setItem('ferrecloud_terminal_name', terminalName.toUpperCase().trim());
        syncService.setVaultId(vaultId);
        
        await syncService.syncFromRemote();
        setIsProcessing(false);
        addLog("Vínculo establecido. La PC ahora es visible en internet.");
    };

    return (
        <div className="p-8 max-w-7xl mx-auto h-full space-y-8 animate-fade-in bg-slate-50 overflow-y-auto pb-32">
            
            <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><Globe size={280}/></div>
                <div className="relative z-10 space-y-10">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-5">
                            <div className={`p-5 rounded-[2rem] shadow-2xl transition-all ${isOnline ? 'bg-indigo-600 shadow-indigo-600/20' : 'bg-slate-700'}`}>
                                <Signal size={36} className={isOnline ? 'animate-pulse' : ''}/>
                            </div>
                            <div>
                                <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Interconexión Cloud</h2>
                                <p className="text-indigo-400 font-bold text-[10px] uppercase tracking-widest mt-2 flex items-center gap-2">
                                    <Globe2 size={12}/> {isOnline ? 'Sincronización en línea' : 'Intentando conectar...'}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Última Respuesta</p>
                             <p className="font-mono text-indigo-400 text-sm font-bold">{lastSync}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8 space-y-8">
                            <div className="bg-white/5 p-8 rounded-[3rem] border border-white/10 space-y-8 shadow-inner">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-indigo-400 uppercase ml-2 tracking-widest flex items-center gap-2"><Key size={14}/> ID de Bóveda Global</label>
                                        <input 
                                            className="w-full p-5 bg-white/5 border-2 border-white/10 rounded-2xl font-black text-indigo-400 outline-none focus:border-indigo-500 uppercase text-2xl text-center shadow-lg transition-all" 
                                            value={vaultId} 
                                            onChange={e => setVaultId(e.target.value)} 
                                            placeholder="EJ: BRUZZONE2026"
                                        />
                                        <p className="text-[8px] text-slate-500 uppercase text-center font-bold">Usa el mismo en todas tus PCs.</p>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest flex items-center gap-2"><Monitor size={14}/> Nombre de esta PC</label>
                                        <input 
                                            className="w-full p-5 bg-white/5 border-2 border-white/10 rounded-2xl font-black text-white outline-none focus:border-indigo-500 uppercase text-2xl text-center shadow-lg transition-all" 
                                            value={terminalName} 
                                            onChange={e => setTerminalName(e.target.value)} 
                                            placeholder="EJ: MOSTRADOR-1"
                                        />
                                        <p className="text-[8px] text-amber-500 uppercase text-center font-bold">IMPORTANTE: Nombres diferentes en cada PC.</p>
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

                            <div className="bg-black/40 p-6 rounded-3xl border border-white/5 space-y-2">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Terminal size={12}/> Consola de Diagnóstico de Red</p>
                                <div className="space-y-1">
                                    {diagnostics.map((log, i) => (
                                        <p key={i} className={`text-[10px] font-mono leading-tight ${log.includes('Error') ? 'text-red-400' : 'text-indigo-300/60'}`}>{log}</p>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-[3rem] p-8 flex flex-col space-y-6 shadow-2xl">
                            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-white/10 pb-4 flex items-center gap-2"><MonitorSmartphone size={16}/> Terminales Online</h3>
                            <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] custom-scrollbar pr-2">
                                {terminals.length === 0 ? (
                                    <div className="py-20 text-center opacity-30 italic text-xs flex flex-col items-center gap-4">
                                        <WifiOff size={40} strokeWidth={1}/>
                                        Buscando otras PCs...
                                    </div>
                                ) : terminals.map((t, idx) => (
                                    <div key={idx} className={`flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all border-l-4 ${t.isLocal ? 'border-l-indigo-500' : 'border-l-green-500'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${t.isLocal ? 'bg-indigo-500' : 'bg-green-500'}`}></div>
                                            <span className="text-xs font-black uppercase tracking-tight text-white">{t.name}</span>
                                        </div>
                                        <span className={`text-[8px] font-black uppercase ${t.isLocal ? 'text-indigo-400' : 'text-green-500'}`}>{t.isLocal ? 'Esta PC' : 'Online'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-amber-50 p-8 rounded-[2.5rem] border-2 border-dashed border-amber-200 flex items-start gap-6">
                <div className="p-3 bg-white rounded-2xl shadow-sm text-amber-500"><Info size={24}/></div>
                <div className="space-y-2">
                    <h4 className="font-black text-amber-800 uppercase text-xs tracking-widest">¿Por qué no veo a las otras PCs?</h4>
                    <ul className="text-xs text-amber-700/80 space-y-1 font-medium italic">
                        <li>1. Verificá que el <strong>ID de Bóveda</strong> sea exactamente igual en todas.</li>
                        <li>2. Verificá que cada PC tenga un <strong>Nombre</strong> distinto.</li>
                        <li>3. Asegurate que ambas PCs tengan salida a internet (probá abrir Google).</li>
                        <li>4. Si usás antivirus, asegurate que no esté bloqueando las conexiones.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default CloudHub;
