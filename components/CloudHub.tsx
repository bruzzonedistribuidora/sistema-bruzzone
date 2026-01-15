import React, { useState, useEffect } from 'react';
import { 
    Signal, Activity, WifiOff, Terminal, Database, 
    Network, ShieldCheck, Zap, RefreshCw, Cpu
} from 'lucide-react';
import { syncService, SyncActivity } from '../services/syncService';

const CloudHub: React.FC = () => {
    const [vaultId, setVaultId] = useState(syncService.getVaultId() || '');
    const [terminalName, setTerminalName] = useState(localStorage.getItem('ferrecloud_terminal_name') || '');
    const [connStatus, setConnStatus] = useState<'IDLE' | 'CONNECTED' | 'ERROR'>('IDLE');
    const [activityLog, setActivityLog] = useState<SyncActivity[]>(syncService.getActivityLog());

    useEffect(() => {
        const handlePulse = (e: any) => {
            setConnStatus(e.detail.status === 'OK' ? 'CONNECTED' : 'ERROR');
        };

        const handleActivity = (e: any) => setActivityLog(e.detail);

        window.addEventListener('ferrecloud_sync_pulse' as any, handlePulse);
        window.addEventListener('ferrecloud_sync_activity' as any, handleActivity);
        
        return () => {
            window.removeEventListener('ferrecloud_sync_pulse' as any, handlePulse);
            window.removeEventListener('ferrecloud_sync_activity' as any, handleActivity);
        };
    }, []);

    const handleSaveVault = () => {
        if (!vaultId || !terminalName) {
            alert("Por favor, ingresa el ID de Bóveda y un nombre para esta terminal.");
            return;
        }
        localStorage.setItem('ferrecloud_terminal_name', terminalName.toUpperCase().trim());
        syncService.setVaultId(vaultId);
        setConnStatus('IDLE');
    };

    return (
        <div className="p-8 max-w-7xl mx-auto h-full space-y-8 animate-fade-in bg-slate-50 overflow-y-auto pb-32">
            
            {/* ESTADO GLOBAL */}
            <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><Database size={280}/></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-6">
                        <div className={`p-6 rounded-[2rem] shadow-2xl transition-all ${connStatus === 'CONNECTED' ? 'bg-orange-600' : connStatus === 'ERROR' ? 'bg-red-600' : 'bg-slate-800'}`}>
                            {connStatus === 'CONNECTED' ? <Signal size={40} className="animate-pulse text-orange-100"/> : <WifiOff size={40} className="text-slate-500"/>}
                        </div>
                        <div>
                            <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Firebase Realtime Sync</h2>
                            <p className={`font-bold text-[10px] uppercase tracking-widest mt-2 flex items-center gap-2 ${connStatus === 'CONNECTED' ? 'text-orange-400' : 'text-slate-500'}`}>
                                <Activity size={12} className={connStatus === 'CONNECTED' ? 'animate-bounce' : ''}/> 
                                {connStatus === 'CONNECTED' ? 'CANAL DE DATOS ACTIVO' : 'ESPERANDO CONFIGURACIÓN...'}
                            </p>
                        </div>
                    </div>
                    
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-md">
                        <div className="flex items-center gap-3 mb-2">
                            <ShieldCheck size={16} className="text-green-400"/>
                            <span className="text-[10px] font-black uppercase text-slate-400">Seguridad de Bóveda</span>
                        </div>
                        <p className="text-sm font-mono text-indigo-300 font-bold">{vaultId || '--- SIN VINCULAR ---'}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* CONFIGURACIÓN */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-4 flex items-center gap-2"><Network size={14} className="text-indigo-600"/> Enlace de Terminal</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-[9px] font-black text-slate-500 uppercase ml-2 block mb-1">Nombre de esta Caja/PC</label>
                                <input 
                                    className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl font-black text-slate-800 uppercase outline-none" 
                                    value={terminalName} 
                                    onChange={e => setTerminalName(e.target.value)} 
                                    placeholder="EJ: CAJA-01" 
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-500 uppercase ml-2 block mb-1">ID de Bóveda (Sync ID)</label>
                                <input 
                                    className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl font-black text-indigo-600 uppercase text-center tracking-widest outline-none" 
                                    value={vaultId} 
                                    onChange={e => setVaultId(e.target.value)} 
                                    placeholder="FERRE_BRUZZONE_PRO" 
                                />
                            </div>
                            <button 
                                onClick={handleSaveVault} 
                                className="w-full py-5 bg-slate-900 hover:bg-orange-600 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95">
                                Activar Sincronización
                            </button>
                        </div>
                    </div>

                    <div className="bg-indigo-600 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Zap size={80}/></div>
                        <h4 className="font-black uppercase text-sm mb-2">¿Cómo funciona?</h4>
                        <p className="text-xs text-indigo-100 leading-relaxed font-medium">Todas las terminales con el mismo <b>ID de Bóveda</b> compartirán stock y precios al instante. No necesitas servidor propio, Firebase maneja los 140k artículos de forma incremental.</p>
                    </div>
                </div>

                {/* CONSOLA DE TRÁFICO */}
                <div className="lg:col-span-8 bg-black rounded-[3rem] border border-white/10 overflow-hidden flex flex-col h-[550px] shadow-2xl">
                    <div className="p-5 bg-slate-800 flex justify-between items-center border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <Terminal size={18} className="text-orange-400"/>
                            <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Monitor de Tráfico Cloud</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                            <span className="text-[8px] font-black text-orange-400 uppercase tracking-widest">FIREBASE STREAM</span>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-8 font-mono space-y-3 custom-scrollbar bg-slate-950">
                        {activityLog.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-700 opacity-50">
                                <Cpu size={48} className="mb-4"/>
                                <p className="text-xs uppercase font-black">Escuchando paquetes de red...</p>
                            </div>
                        ) : activityLog.map(log => (
                            <div key={log.id} className="flex gap-4 text-[10px] border-b border-white/5 pb-2 animate-fade-in group">
                                <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
                                <span className={`font-black shrink-0 ${log.type === 'IN' ? 'text-green-400' : log.type === 'OUT' ? 'text-orange-400' : 'text-red-500'}`}>
                                    {log.type === 'IN' ? '<<< RECIBIDO' : log.type === 'OUT' ? '>>> ENVIADO' : '!!! ERROR'}
                                </span>
                                <span className="text-slate-400 group-hover:text-white transition-colors">{log.description}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CloudHub;
