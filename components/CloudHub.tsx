
import React, { useState, useEffect } from 'react';
import { 
    Globe, RefreshCw, Zap, WifiOff, Signal, Activity, 
    ShieldCheck, Search, Wifi, Info, Trash2, Smartphone
} from 'lucide-react';
import { syncService } from '../services/syncService';

const CloudHub: React.FC = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [vaultId, setVaultId] = useState(syncService.getVaultId() || '');
    const [terminalName, setTerminalName] = useState(localStorage.getItem('ferrecloud_terminal_name') || '');
    const [lastSync, setLastSync] = useState(localStorage.getItem('ferrecloud_last_sync') || 'Sin Vincular');
    const [terminals, setTerminals] = useState<{name: string, isLocal: boolean}[]>([]);
    const [isOnline, setIsOnline] = useState(false);
    const [syncMessage, setSyncMessage] = useState('Listo para conectar');

    useEffect(() => {
        const handlePulse = (e: any) => {
            setIsOnline(true);
            const list = Object.entries(e.detail.terminals).map(([id, info]: [string, any]) => ({
                name: info.name,
                isLocal: info.name === terminalName.toUpperCase()
            }));
            setTerminals(list);
            setLastSync(localStorage.getItem('ferrecloud_last_sync') || 'Ahora');
            setSyncMessage('Puente de datos activo');
        };

        const handleError = (e: any) => {
            setIsOnline(false);
            setSyncMessage(e.detail.error);
        };

        window.addEventListener('ferrecloud_sync_pulse' as any, handlePulse);
        window.addEventListener('ferrecloud_sync_error' as any, handleError);
        
        return () => {
            window.removeEventListener('ferrecloud_sync_pulse' as any, handlePulse);
            window.removeEventListener('ferrecloud_sync_error' as any, handleError);
        };
    }, [terminalName]);

    const handleSave = async () => {
        if (!vaultId || vaultId.length < 3) return alert("ID demasiado corto.");
        if (!terminalName) return alert("El nombre de la PC es necesario.");
        
        setIsProcessing(true);
        setSyncMessage('Conectando...');
        
        localStorage.setItem('ferrecloud_terminal_name', terminalName.toUpperCase().trim());
        syncService.setVaultId(vaultId);
        
        await syncService.syncFromRemote();
        setIsProcessing(false);
    };

    const resetConnection = () => {
        if (confirm("¿Reiniciar parámetros de red?")) {
            localStorage.removeItem('ferrecloud_vault_id');
            localStorage.removeItem('ferrecloud_last_sync');
            window.location.reload();
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto h-full space-y-8 animate-fade-in bg-slate-50 overflow-y-auto pb-32">
            
            <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><Globe size={280}/></div>
                <div className="relative z-10 space-y-10">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-5">
                            <div className={`p-5 rounded-[2rem] shadow-2xl transition-all ${isOnline ? 'bg-indigo-600' : 'bg-slate-800'}`}>
                                {isOnline ? <Signal size={36} className="animate-pulse text-indigo-200"/> : <WifiOff size={36} className="text-slate-500"/>}
                            </div>
                            <div>
                                <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Red FerreCloud</h2>
                                <p className={`font-bold text-[10px] uppercase tracking-widest mt-2 flex items-center gap-2 ${isOnline ? 'text-indigo-400' : 'text-slate-500'}`}>
                                    <Activity size={12} className={isOnline ? 'animate-bounce' : ''}/> {syncMessage}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Último Latido</p>
                             <p className="font-mono text-indigo-400 text-sm font-bold">{lastSync}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8 space-y-8">
                            <div className="bg-white/5 p-8 rounded-[3rem] border border-white/10 space-y-8 shadow-inner">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-indigo-400 uppercase ml-2 tracking-widest">ID de Bóveda Global</label>
                                        <input 
                                            className="w-full p-5 bg-white/5 border-2 border-white/10 rounded-2xl font-black text-indigo-400 outline-none focus:border-indigo-500 uppercase text-2xl text-center shadow-lg" 
                                            value={vaultId} 
                                            onChange={e => setVaultId(e.target.value)} 
                                            placeholder="BRUZZONE_2026"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Identidad de esta PC</label>
                                        <input 
                                            className="w-full p-5 bg-white/5 border-2 border-white/10 rounded-2xl font-black text-white outline-none focus:border-indigo-500 uppercase text-2xl text-center shadow-lg" 
                                            value={terminalName} 
                                            onChange={e => setTerminalName(e.target.value)} 
                                            placeholder="CAJA_A"
                                        />
                                    </div>
                                </div>
                                <button 
                                    onClick={handleSave} 
                                    disabled={isProcessing}
                                    className={`w-full py-7 rounded-[2.5rem] font-black uppercase tracking-[0.3em] shadow-xl transition-all flex items-center justify-center gap-4 text-sm ${isOnline ? 'bg-indigo-600' : 'bg-slate-700 hover:bg-indigo-500'}`}>
                                    {isProcessing ? <RefreshCw className="animate-spin" size={24}/> : <Zap size={24}/>}
                                    {isProcessing ? 'Sincronizando...' : 'CONECTAR AHORA'}
                                </button>
                            </div>
                        </div>

                        <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-[3rem] p-8 flex flex-col space-y-6 shadow-2xl min-h-[350px]">
                            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-white/10 pb-4">PCs Detectadas</h3>
                            <div className="space-y-3 flex-1 overflow-y-auto max-h-[350px] custom-scrollbar pr-2">
                                {terminals.length === 0 ? (
                                    <div className="py-20 text-center opacity-30 italic text-xs flex flex-col items-center gap-4">
                                        <Search size={40} strokeWidth={1} className="animate-pulse"/>
                                        Esperando señal...
                                    </div>
                                ) : terminals.map((t, idx) => (
                                    <div key={idx} className={`flex items-center justify-between p-4 bg-white/5 rounded-2xl border-l-4 ${t.isLocal ? 'border-l-indigo-500' : 'border-l-green-500'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full animate-pulse ${t.isLocal ? 'bg-indigo-500' : 'bg-green-500'}`}></div>
                                            <span className="text-xs font-black uppercase text-white">{t.name}</span>
                                        </div>
                                        <span className="text-[8px] font-black uppercase text-slate-500">{t.isLocal ? 'Local' : 'En Red'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-center pt-10">
                <button 
                    onClick={resetConnection}
                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 hover:text-red-500 transition-colors">
                    <Trash2 size={14}/> Limpiar Bóveda y Reintentar desde cero
                </button>
            </div>
        </div>
    );
};

export default CloudHub;
