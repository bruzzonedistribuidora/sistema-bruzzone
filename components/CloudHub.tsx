
import React, { useState, useEffect } from 'react';
import { 
    Cloud, RefreshCw, Save, Zap, CloudDownload, Smartphone,
    Network, Wifi, ShieldCheck, FileUp, Monitor, 
    ArrowRight, Info, AlertTriangle, CheckCircle2, History,
    Terminal, Activity, Globe, WifiOff, MonitorSmartphone,
    X, Radio, Signal, Globe2, AlertCircle, ShieldAlert,
    Copy, Download
} from 'lucide-react';
import { syncService } from '../services/syncService';

const CloudHub: React.FC = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [vaultId, setVaultId] = useState(syncService.getVaultId() || '');
    const [terminalName, setTerminalName] = useState(localStorage.getItem('ferrecloud_terminal_name') || '');
    const [lastSync, setLastSync] = useState(localStorage.getItem('ferrecloud_last_sync') || 'Sin señal');
    const [terminals, setTerminals] = useState<{name: string, isLocal: boolean}[]>([]);
    const [diagnostics, setDiagnostics] = useState<string[]>(["Sistema de Red por Proxy Activo"]);
    const [isOnline, setIsOnline] = useState(false);
    
    const addLog = (msg: string) => {
        setDiagnostics(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 5));
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
            addLog("Enlace sincronizado.");
        };

        const handleError = (e: any) => {
            setIsOnline(false);
            addLog(e.detail.error);
        };

        window.addEventListener('ferrecloud_sync_pulse' as any, handlePulse);
        window.addEventListener('ferrecloud_sync_error' as any, handleError);
        
        return () => {
            window.removeEventListener('ferrecloud_sync_pulse' as any, handlePulse);
            window.removeEventListener('ferrecloud_sync_error' as any, handleError);
        };
    }, [terminalName]);

    const handleSave = async () => {
        if (!vaultId || vaultId.length < 3) return alert("ID muy corto.");
        if (!terminalName) return alert("Ponele un nombre a la PC.");
        
        setIsProcessing(true);
        addLog(`Iniciando Túnel Proxy para: ${vaultId}...`);
        
        localStorage.setItem('ferrecloud_terminal_name', terminalName.toUpperCase().trim());
        syncService.setVaultId(vaultId);
        
        await syncService.syncFromRemote();
        setIsProcessing(false);
    };

    const copyManualCode = () => {
        const data = localStorage.getItem('ferrecloud_sales_history');
        if (data) {
            navigator.clipboard.writeText(data);
            alert("Código de respaldo copiado. Podés pegarlo en otra PC en la sección de Backup.");
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto h-full space-y-8 animate-fade-in bg-slate-50 overflow-y-auto pb-32">
            
            <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><Globe size={280}/></div>
                <div className="relative z-10 space-y-10">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-5">
                            <div className={`p-5 rounded-[2rem] shadow-2xl transition-all ${isOnline ? 'bg-indigo-600 shadow-indigo-600/20' : 'bg-amber-600 shadow-amber-600/20'}`}>
                                <Signal size={36} className={isOnline ? 'animate-pulse' : 'text-amber-200'}/>
                            </div>
                            <div>
                                <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Red Cloud / LAN</h2>
                                <p className={`font-bold text-[10px] uppercase tracking-widest mt-2 flex items-center gap-2 ${isOnline ? 'text-indigo-400' : 'text-amber-400'}`}>
                                    <ShieldCheck size={12}/> {isOnline ? 'Conexión Segura vía Proxy' : 'Estableciendo puente...'}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Última Sincro</p>
                             <p className="font-mono text-indigo-400 text-sm font-bold">{lastSync}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8 space-y-8">
                            <div className="bg-white/5 p-8 rounded-[3rem] border border-white/10 space-y-8 shadow-inner">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-indigo-400 uppercase ml-2 tracking-widest flex items-center gap-2">ID Global</label>
                                        <input 
                                            className="w-full p-5 bg-white/5 border-2 border-white/10 rounded-2xl font-black text-indigo-400 outline-none focus:border-indigo-500 uppercase text-2xl text-center shadow-lg transition-all" 
                                            value={vaultId} 
                                            onChange={e => setVaultId(e.target.value)} 
                                            placeholder="EJ: BRUZZONE"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest flex items-center gap-2">Nombre PC</label>
                                        <input 
                                            className="w-full p-5 bg-white/5 border-2 border-white/10 rounded-2xl font-black text-white outline-none focus:border-indigo-500 uppercase text-2xl text-center shadow-lg transition-all" 
                                            value={terminalName} 
                                            onChange={e => setTerminalName(e.target.value)} 
                                            placeholder="EJ: CAJA-1"
                                        />
                                    </div>
                                </div>
                                <button 
                                    onClick={handleSave} 
                                    disabled={isProcessing}
                                    className={`w-full py-7 rounded-[2.5rem] font-black uppercase tracking-[0.3em] shadow-xl transition-all flex items-center justify-center gap-4 text-sm ${isOnline ? 'bg-indigo-600' : 'bg-indigo-700 hover:bg-indigo-600'}`}>
                                    {isProcessing ? <RefreshCw className="animate-spin" size={24}/> : <Zap size={24}/>}
                                    {isProcessing ? 'CONECTANDO...' : 'VINCULAR AHORA'}
                                </button>
                            </div>

                            <div className="bg-black/40 p-6 rounded-3xl border border-white/5 space-y-2">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Terminal size={12}/> Consola de Seguridad</p>
                                <div className="space-y-1">
                                    {diagnostics.map((log, i) => (
                                        <p key={i} className="text-[10px] font-mono leading-tight text-indigo-300/60">{log}</p>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-[3rem] p-8 flex flex-col space-y-6 shadow-2xl min-h-[400px]">
                            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-white/10 pb-4">PCs en la Red</h3>
                            <div className="space-y-3 flex-1 overflow-y-auto max-h-[350px] custom-scrollbar pr-2">
                                {terminals.length === 0 ? (
                                    <div className="py-20 text-center opacity-30 italic text-xs flex flex-col items-center gap-4">
                                        <WifiOff size={40} strokeWidth={1}/>
                                        Buscando terminales...
                                    </div>
                                ) : terminals.map((t, idx) => (
                                    <div key={idx} className={`flex items-center justify-between p-4 bg-white/5 rounded-2xl border-l-4 ${t.isLocal ? 'border-l-indigo-500' : 'border-l-green-500'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full animate-pulse ${t.isLocal ? 'bg-indigo-500' : 'bg-green-500'}`}></div>
                                            <span className="text-xs font-black uppercase text-white">{t.name}</span>
                                        </div>
                                        <span className="text-[8px] font-black uppercase text-slate-500">{t.isLocal ? 'Local' : 'Nube'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-amber-50 p-8 rounded-[2.5rem] border border-amber-100 flex items-start gap-6">
                    <div className="p-3 bg-white rounded-2xl shadow-sm text-amber-500"><AlertCircle size={24}/></div>
                    <div className="space-y-2">
                        <h4 className="font-black text-amber-800 uppercase text-xs tracking-widest">¿Sigue fallando?</h4>
                        <p className="text-xs text-amber-700/80 font-medium italic leading-relaxed">
                            Si el mensaje de error persiste, por favor <strong>recargá la página con F5</strong>. 
                            A veces el túnel proxy necesita que el navegador acepte la nueva ruta de datos.
                        </p>
                    </div>
                </div>

                <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 flex items-start gap-6 text-white shadow-lg">
                    <div className="p-3 bg-white/10 rounded-2xl text-indigo-400"><ShieldAlert size={24}/></div>
                    <div className="space-y-4">
                        <h4 className="font-black uppercase text-xs tracking-widest">Botón de Auxilio</h4>
                        <p className="text-[10px] text-slate-400 uppercase font-bold leading-tight">
                            Si internet muere y necesitás pasar las ventas de hoy a la otra PC urgentemente:
                        </p>
                        <button 
                            onClick={copyManualCode}
                            className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all">
                            <Copy size={14}/> Copiar Código Manual
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CloudHub;
