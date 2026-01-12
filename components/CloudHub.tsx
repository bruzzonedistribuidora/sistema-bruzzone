
import React, { useState, useEffect } from 'react';
import { 
    Cloud, RefreshCw, Zap, Monitor, 
    ShieldCheck, Globe, WifiOff, MonitorSmartphone,
    Signal, Globe2, AlertCircle, ShieldAlert,
    Copy, Search, CheckCircle, Wifi, Activity
} from 'lucide-react';
import { syncService } from '../services/syncService';

const CloudHub: React.FC = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [vaultId, setVaultId] = useState(syncService.getVaultId() || '');
    const [terminalName, setTerminalName] = useState(localStorage.getItem('ferrecloud_terminal_name') || '');
    const [lastSync, setLastSync] = useState(localStorage.getItem('ferrecloud_last_sync') || 'Desconectado');
    const [terminals, setTerminals] = useState<{name: string, isLocal: boolean}[]>([]);
    const [isOnline, setIsOnline] = useState(false);
    const [syncMessage, setSyncMessage] = useState('Esperando vinculación...');

    useEffect(() => {
        const handlePulse = (e: any) => {
            setIsOnline(true);
            const list = Object.entries(e.detail.terminals).map(([id, info]: [string, any]) => ({
                name: info.name,
                isLocal: info.name === terminalName.toUpperCase()
            }));
            setTerminals(list);
            setLastSync(localStorage.getItem('ferrecloud_last_sync') || 'Ahora');
            setSyncMessage('Puente de datos activo.');
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
        if (!vaultId || vaultId.length < 3) return alert("ID muy corto.");
        if (!terminalName) return alert("Dale un nombre a esta PC.");
        
        setIsProcessing(true);
        setSyncMessage('Iniciando handshake...');
        
        localStorage.setItem('ferrecloud_terminal_name', terminalName.toUpperCase().trim());
        syncService.setVaultId(vaultId);
        
        await syncService.syncFromRemote();
        setIsProcessing(false);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto h-full space-y-8 animate-fade-in bg-slate-50 overflow-y-auto pb-32">
            
            <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><Globe size={280}/></div>
                <div className="relative z-10 space-y-10">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-5">
                            <div className={`p-5 rounded-[2rem] shadow-2xl transition-all ${isOnline ? 'bg-indigo-600 shadow-indigo-600/20' : 'bg-amber-600/20 border border-amber-500/30'}`}>
                                {isOnline ? <Signal size={36} className="animate-pulse text-indigo-200"/> : <WifiOff size={36} className="text-amber-400"/>}
                            </div>
                            <div>
                                <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Puente FerreCloud</h2>
                                <p className={`font-bold text-[10px] uppercase tracking-widest mt-2 flex items-center gap-2 ${isOnline ? 'text-indigo-400' : 'text-amber-400'}`}>
                                    <Activity size={12} className={isOnline ? 'animate-bounce' : ''}/> {syncMessage}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Estado de Red</p>
                             <p className="font-mono text-indigo-400 text-sm font-bold">{isOnline ? `Vinc: ${lastSync}` : 'Sin Señal'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8 space-y-8">
                            <div className="bg-white/5 p-8 rounded-[3rem] border border-white/10 space-y-8 shadow-inner">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-indigo-400 uppercase ml-2 tracking-widest">ID de Bóveda</label>
                                        <input 
                                            className="w-full p-5 bg-white/5 border-2 border-white/10 rounded-2xl font-black text-indigo-400 outline-none focus:border-indigo-500 uppercase text-2xl text-center shadow-lg" 
                                            value={vaultId} 
                                            onChange={e => setVaultId(e.target.value)} 
                                            placeholder="BRUZZONE2026"
                                        />
                                        <p className="text-[8px] text-slate-500 text-center font-bold">Usa el mismo en todas las PCs.</p>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Nombre de esta PC</label>
                                        <input 
                                            className="w-full p-5 bg-white/5 border-2 border-white/10 rounded-2xl font-black text-white outline-none focus:border-indigo-500 uppercase text-2xl text-center shadow-lg" 
                                            value={terminalName} 
                                            onChange={e => setTerminalName(e.target.value)} 
                                            placeholder="CAJA-A"
                                        />
                                        <p className="text-[8px] text-amber-500 text-center font-bold">Usa nombres distintos (Caja A, B, etc).</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleSave} 
                                    disabled={isProcessing}
                                    className={`w-full py-7 rounded-[2.5rem] font-black uppercase tracking-[0.3em] shadow-xl transition-all flex items-center justify-center gap-4 text-sm ${isOnline ? 'bg-indigo-600' : 'bg-slate-700 hover:bg-indigo-600'}`}>
                                    {isProcessing ? <RefreshCw className="animate-spin" size={24}/> : isOnline ? <CheckCircle size={24}/> : <Wifi size={24}/>}
                                    {isProcessing ? 'ESTABLECIENDO...' : isOnline ? 'PUENTE ACTIVO' : 'ACTIVAR VÍNCULO'}
                                </button>
                            </div>
                        </div>

                        <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-[3rem] p-8 flex flex-col space-y-6 shadow-2xl min-h-[350px]">
                            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-white/10 pb-4">PCs Detectadas</h3>
                            <div className="space-y-3 flex-1 overflow-y-auto max-h-[350px] custom-scrollbar pr-2">
                                {terminals.length === 0 ? (
                                    <div className="py-20 text-center opacity-30 italic text-xs flex flex-col items-center gap-4">
                                        <Search size={40} strokeWidth={1} className="animate-pulse"/>
                                        Buscando otras PCs...
                                    </div>
                                ) : terminals.map((t, idx) => (
                                    <div key={idx} className={`flex items-center justify-between p-4 bg-white/5 rounded-2xl border-l-4 ${t.isLocal ? 'border-l-indigo-500' : 'border-l-green-500'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full animate-pulse ${t.isLocal ? 'bg-indigo-500' : 'bg-green-500'}`}></div>
                                            <span className="text-xs font-black uppercase text-white">{t.name}</span>
                                        </div>
                                        <span className="text-[8px] font-black uppercase text-slate-500">{t.isLocal ? 'Local' : 'En Línea'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-indigo-50 p-8 rounded-[2.5rem] border border-indigo-100 flex items-start gap-6">
                    <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-500"><ShieldCheck size={24}/></div>
                    <div className="space-y-2">
                        <h4 className="font-black text-indigo-800 uppercase text-xs tracking-widest">Protocolo de Red</h4>
                        <p className="text-xs text-indigo-700/80 font-medium italic leading-relaxed">
                            El sistema usa un túnel directo de datos. Si una PC no ve a la otra, asegúrate que ambas tengan **exactamente el mismo ID de Bóveda**.
                        </p>
                    </div>
                </div>

                <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 flex items-start gap-6 text-white shadow-lg">
                    <div className="p-3 bg-white/10 rounded-2xl text-amber-400"><ShieldAlert size={24}/></div>
                    <div className="space-y-2">
                        <h4 className="font-black uppercase text-xs tracking-widest">¿Todavía sin señal?</h4>
                        <p className="text-[10px] text-slate-400 uppercase font-bold leading-tight">
                            Si después de 30 segundos no se ven, prueba abrir el sistema en un navegador distinto (Edge o Chrome) o desactiva temporalmente el Firewall de Windows.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CloudHub;
