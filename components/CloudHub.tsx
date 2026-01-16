import React, { useState, useEffect } from 'react';
import { 
    Signal, Activity, WifiOff, Terminal, Database, 
    Network, ShieldCheck, Zap, RefreshCw, Cpu, Cloud,
    CheckCircle, Server
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
        
        // Verificación inicial de estado si ya hay vaultId
        if (syncService.getVaultId()) setConnStatus('CONNECTED');

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
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none text-indigo-500"><Cloud size={350}/></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-6">
                        <div className={`p-6 rounded-[2rem] shadow-2xl transition-all duration-700 ${connStatus === 'CONNECTED' ? 'bg-indigo-600 scale-110 shadow-indigo-500/50' : connStatus === 'ERROR' ? 'bg-red-600' : 'bg-slate-800'}`}>
                            {connStatus === 'CONNECTED' ? <Signal size={40} className="animate-pulse text-white"/> : <WifiOff size={40} className="text-slate-500"/>}
                        </div>
                        <div>
                            <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Auto-Sync Activado</h2>
                            <p className={`font-bold text-[10px] uppercase tracking-widest mt-2 flex items-center gap-2 ${connStatus === 'CONNECTED' ? 'text-indigo-400' : 'text-slate-500'}`}>
                                <Activity size={12} className={connStatus === 'CONNECTED' ? 'animate-bounce' : ''}/> 
                                {connStatus === 'CONNECTED' ? 'TERMINAL VINCULADA EN TIEMPO REAL' : 'ESTABLECIENDO ENLACE...'}
                            </p>
                        </div>
                    </div>
                    
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-md flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase text-slate-400">ID de Bóveda Actual</p>
                            <p className="text-lg font-mono text-indigo-300 font-black">{vaultId || '--- SIN VINCULAR ---'}</p>
                        </div>
                        <div className="p-3 bg-white/10 rounded-xl">
                            <ShieldCheck size={24} className={vaultId ? 'text-green-400' : 'text-slate-600'}/>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* CONFIGURACIÓN */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-4 flex items-center gap-2"><Server size={14} className="text-indigo-600"/> Parámetros de Enlace</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-[9px] font-black text-slate-500 uppercase ml-2 block mb-1">Nombre de esta Terminal</label>
                                <input 
                                    className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl font-black text-slate-800 uppercase outline-none shadow-inner" 
                                    value={terminalName} 
                                    onChange={e => setTerminalName(e.target.value)} 
                                    placeholder="EJ: CAJA-PRINCIPAL" 
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-500 uppercase ml-2 block mb-1">Vault Key (Clave Única)</label>
                                <input 
                                    className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl font-black text-indigo-600 uppercase text-center tracking-widest outline-none shadow-inner" 
                                    value={vaultId} 
                                    onChange={e => setVaultId(e.target.value)} 
                                    placeholder="INGRESE SU ID DE NUBE" 
                                />
                            </div>
                            <button 
                                onClick={handleSaveVault} 
                                className="w-full py-5 bg-slate-900 hover:bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95">
                                Reconfigurar Vínculo
                            </button>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-50 text-green-600 rounded-lg"><CheckCircle size={18}/></div>
                            <h4 className="font-black uppercase text-[10px] tracking-widest text-slate-700">Estado de Operación</h4>
                        </div>
                        <ul className="space-y-3">
                            <li className="flex justify-between items-center text-[10px] font-bold">
                                <span className="text-slate-400">STOCK 140K:</span>
                                <span className="text-indigo-600">Sincronizado</span>
                            </li>
                            <li className="flex justify-between items-center text-[10px] font-bold">
                                <span className="text-slate-400">LATENCIA:</span>
                                <span className="text-green-500">Baja (Realtime)</span>
                            </li>
                            <li className="flex justify-between items-center text-[10px] font-bold">
                                <span className="text-slate-400">BASE DE DATOS:</span>
                                <span className="text-slate-900">IndexedDB Activa</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* MONITOR DE TRÁFICO */}
                <div className="lg:col-span-8 bg-black rounded-[3rem] border border-white/10 overflow-hidden flex flex-col h-[600px] shadow-2xl">
                    <div className="p-5 bg-slate-800 flex justify-between items-center border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <Terminal size={18} className="text-orange-400"/>
                            <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Monitor de Paquetes de Datos</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-[8px] font-black text-green-400 uppercase tracking-widest">FIREBASE OK</span>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-8 font-mono space-y-3 custom-scrollbar bg-slate-950">
                        {activityLog.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-700 opacity-50">
                                <Cpu size={48} className="mb-4 animate-pulse"/>
                                <p className="text-xs uppercase font-black tracking-widest">Escuchando red en tiempo real...</p>
                                <p className="text-[9px] mt-2 italic text-slate-500">Se mostrarán los cambios de stock y precios de todas las terminales.</p>
                            </div>
                        ) : activityLog.map(log => (
                            <div key={log.id} className="flex gap-4 text-[10px] border-b border-white/5 pb-2 animate-fade-in group">
                                <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
                                <span className={`font-black shrink-0 ${log.type === 'IN' ? 'text-green-400' : log.type === 'OUT' ? 'text-orange-400' : 'text-red-500'}`}>
                                    {log.type === 'IN' ? '<<< RECIBIDO' : log.type === 'OUT' ? '>>> TRANSMITIDO' : '!!! ERROR'}
                                </span>
                                <span className="text-slate-400 group-hover:text-white transition-colors">{log.description}</span>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 bg-slate-900 border-t border-white/5 text-center">
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em]">FerreCloud Data Engine v5.1.0 - Firestore Connector</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CloudHub;
