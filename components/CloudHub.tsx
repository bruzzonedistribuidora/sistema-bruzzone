import React, { useState, useEffect, useRef } from 'react';
import { 
    Globe, RefreshCw, Zap, WifiOff, Signal, Activity, 
    Search, Wifi, FileJson, Download, Upload, ShieldCheck,
    AlertTriangle, Server, HardDrive, MonitorSmartphone,
    ArrowUpRight, History, CheckCircle2, Cloud, Info, Network,
    Terminal, ArrowDownLeft, Cpu
} from 'lucide-react';
import { syncService, SyncActivity } from '../services/syncService';

const CloudHub: React.FC = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [vaultId, setVaultId] = useState(syncService.getVaultId() || '');
    const [terminalName, setTerminalName] = useState(localStorage.getItem('ferrecloud_terminal_name') || '');
    const [lastSync, setLastSync] = useState(localStorage.getItem('ferrecloud_last_sync') || 'Sin Vincular');
    const [terminals, setTerminals] = useState<{name: string, isLocal: boolean}[]>([]);
    const [connStatus, setConnStatus] = useState<'IDLE' | 'CONNECTED' | 'ERROR'>('IDLE');
    const [activityLog, setActivityLog] = useState<SyncActivity[]>(syncService.getActivityLog());
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handlePulse = (e: any) => {
            const detail = e.detail;
            if (detail.status === 'OK') {
                setConnStatus('CONNECTED');
                const list = Object.entries(detail.terminals || {}).map(([id, info]: [string, any]) => ({
                    name: info.name,
                    isLocal: info.name === (terminalName || '').toUpperCase()
                }));
                setTerminals(list);
                setLastSync(localStorage.getItem('ferrecloud_last_sync') || 'Ahora');
            } else {
                setConnStatus('ERROR');
            }
        };

        const handleActivity = (e: any) => setActivityLog(e.detail);

        window.addEventListener('ferrecloud_sync_pulse' as any, handlePulse);
        window.addEventListener('ferrecloud_sync_activity' as any, handleActivity);
        
        return () => {
            window.removeEventListener('ferrecloud_sync_pulse' as any, handlePulse);
            window.removeEventListener('ferrecloud_sync_activity' as any, handleActivity);
        };
    }, [terminalName]);

    const handleSaveVault = () => {
        if (!vaultId || !terminalName) return alert("Completa todos los datos.");
        localStorage.setItem('ferrecloud_terminal_name', terminalName.toUpperCase().trim());
        syncService.setVaultId(vaultId);
        setConnStatus('IDLE');
    };

    const handleFullExport = async () => {
        setIsProcessing(true);
        await syncService.exportFullVault();
        setIsProcessing(false);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto h-full space-y-8 animate-fade-in bg-slate-50 overflow-y-auto pb-32">
            
            {/* PANEL DE ESTADO Y CONFIGURACIÓN */}
            <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><Globe size={280}/></div>
                <div className="relative z-10 space-y-10">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-5">
                            <div className={`p-5 rounded-[2rem] shadow-2xl transition-all ${connStatus === 'CONNECTED' ? 'bg-indigo-600' : connStatus === 'ERROR' ? 'bg-red-600' : 'bg-slate-800'}`}>
                                {connStatus === 'CONNECTED' ? <Signal size={36} className="animate-pulse text-indigo-200"/> : <WifiOff size={36} className="text-slate-500"/>}
                            </div>
                            <div>
                                <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Cloud Sync Engine</h2>
                                <p className={`font-bold text-[10px] uppercase tracking-widest mt-2 flex items-center gap-2 ${connStatus === 'CONNECTED' ? 'text-green-400' : 'text-slate-500'}`}>
                                    <Activity size={12} className={connStatus === 'CONNECTED' ? 'animate-bounce' : ''}/> 
                                    {connStatus === 'CONNECTED' ? 'CONEXIÓN ESTABLE CON NUBE BRUZZONE' : 'ESPERANDO PULSO DE RED...'}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Última Sincro</p>
                             <p className="font-mono text-indigo-400 text-xl font-black">{lastSync}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-4 bg-white/5 p-8 rounded-[3rem] border border-white/10 space-y-6">
                            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-white/10 pb-4 flex items-center gap-2"><Network size={14}/> Acceso a Bóveda</h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase ml-2">ID Bóveda Compartida</label>
                                    <input className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-indigo-500 uppercase text-center text-sm" value={vaultId} onChange={e => setVaultId(e.target.value)} placeholder="MI_LOCAL_1" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Nombre de Terminal</label>
                                    <input className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-indigo-500 uppercase text-center text-sm" value={terminalName} onChange={e => setTerminalName(e.target.value)} placeholder="CAJA_PRINCIPAL" />
                                </div>
                                <button onClick={handleSaveVault} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl">Actualizar Vínculo</button>
                            </div>
                        </div>

                        {/* MONITOR DE TRÁFICO (REQUERIDO POR USUARIO) */}
                        <div className="lg:col-span-8 bg-black rounded-[3rem] border border-white/10 overflow-hidden flex flex-col h-[350px]">
                            <div className="p-4 bg-slate-800 flex justify-between items-center border-b border-white/5">
                                <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2"><Terminal size={14}/> Monitor de Tráfico en Tiempo Real</h3>
                                <div className="flex gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                    <span className="text-[8px] font-black text-white/40 uppercase">LIVE DELTA STREAMING</span>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 font-mono space-y-3 custom-scrollbar bg-black/50">
                                {activityLog.length === 0 ? (
                                    <p className="text-slate-600 text-xs italic">Iniciando escucha de paquetes de red...</p>
                                ) : activityLog.map(log => (
                                    <div key={log.id} className="flex gap-4 text-[10px] animate-fade-in group">
                                        <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
                                        <span className={`font-black shrink-0 ${log.type === 'IN' ? 'text-green-500' : log.type === 'OUT' ? 'text-blue-500' : 'text-red-500'}`}>
                                            {log.type === 'IN' ? '<<< IN' : log.type === 'OUT' ? '>>> OUT' : '!!! ERR'}
                                        </span>
                                        <span className="text-slate-300 group-hover:text-white transition-colors">{log.description}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECCION CLONACION */}
            <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-xl space-y-10 relative overflow-hidden">
                <div className="flex items-start gap-6 border-b border-slate-100 pb-8">
                    <div className="p-4 bg-slate-900 text-white rounded-3xl shadow-lg"><Cpu size={32}/></div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Clonación Maestra (140k Artículos)</h3>
                        <p className="text-slate-400 text-sm font-medium mt-1">Sincronización masiva inicial para nuevas terminales mediante archivo de alta velocidad.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                    <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600"><Download size={24}/></div>
                            <h4 className="font-black text-slate-800 uppercase text-sm">Generar Master Snapshot</h4>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">Crea un archivo con el catálogo completo y configuraciones para clonar en otra PC.</p>
                        <button 
                            onClick={handleFullExport}
                            disabled={isProcessing}
                            className="w-full bg-slate-900 hover:bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all">
                            Exportar Base JSON
                        </button>
                    </div>

                    <div className="bg-indigo-50/50 p-8 rounded-[2.5rem] border border-indigo-100 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600"><Upload size={24}/></div>
                            <h4 className="font-black text-slate-800 uppercase text-sm">Importar Master Snapshot</h4>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">Reemplaza la base local con una copia exacta de otra terminal. Ideal para PCs nuevas.</p>
                        <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file && confirm("ATENCIÓN: Esto borrará los datos locales. ¿Continuar?")) {
                                setIsProcessing(true);
                                const ok = await syncService.importFullVault(file);
                                if (ok) window.location.reload();
                                else alert("Error en importación.");
                            }
                        }} />
                        <button onClick={() => fileInputRef.current?.click()} disabled={isProcessing} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all">
                            Seleccionar Archivo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CloudHub;
