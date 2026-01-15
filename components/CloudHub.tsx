import React, { useState, useEffect, useRef } from 'react';
import { 
    Globe, RefreshCw, Zap, WifiOff, Signal, Activity, 
    Search, Wifi, FileJson, Download, Upload, ShieldCheck,
    AlertTriangle, Server, HardDrive, MonitorSmartphone,
    ArrowUpRight, History, CheckCircle2, Cloud, Info, Network
} from 'lucide-react';
import { syncService } from '../services/syncService';

const CloudHub: React.FC = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [vaultId, setVaultId] = useState(syncService.getVaultId() || '');
    const [terminalName, setTerminalName] = useState(localStorage.getItem('ferrecloud_terminal_name') || '');
    const [lastSync, setLastSync] = useState(localStorage.getItem('ferrecloud_last_sync') || 'Sin Vincular');
    const [terminals, setTerminals] = useState<{name: string, isLocal: boolean}[]>([]);
    const [connStatus, setConnStatus] = useState<'IDLE' | 'CONNECTED' | 'ERROR'>('IDLE');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handlePulse = (e: any) => {
            const detail = e.detail;
            if (detail.status === 'OK') {
                setConnStatus('CONNECTED');
                const list = Object.entries(detail.terminals).map(([id, info]: [string, any]) => ({
                    name: info.name,
                    isLocal: info.name === (terminalName || '').toUpperCase()
                }));
                setTerminals(list);
                setLastSync(localStorage.getItem('ferrecloud_last_sync') || 'Ahora');
            } else {
                setConnStatus('ERROR');
            }
        };

        window.addEventListener('ferrecloud_sync_pulse' as any, handlePulse);
        return () => window.removeEventListener('ferrecloud_sync_pulse' as any, handlePulse);
    }, [terminalName]);

    const handleSaveVault = () => {
        if (!vaultId || !terminalName) return alert("Completa todos los datos para vincular.");
        localStorage.setItem('ferrecloud_terminal_name', terminalName.toUpperCase().trim());
        syncService.setVaultId(vaultId);
        setConnStatus('IDLE');
        alert("Configuración aplicada. El sistema intentará conectarse en el próximo ciclo.");
    };

    const handleFullExport = async () => {
        setIsProcessing(true);
        const ok = await syncService.exportFullVault();
        if (!ok) alert("Error al exportar base de datos.");
        setIsProcessing(false);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto h-full space-y-8 animate-fade-in bg-slate-50 overflow-y-auto pb-32">
            
            {/* PANEL DE CONTROL DE RED */}
            <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><Globe size={280}/></div>
                <div className="relative z-10 space-y-10">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-5">
                            <div className={`p-5 rounded-[2rem] shadow-2xl transition-all ${connStatus === 'CONNECTED' ? 'bg-indigo-600' : connStatus === 'ERROR' ? 'bg-red-600' : 'bg-slate-800'}`}>
                                {connStatus === 'CONNECTED' ? <Signal size={36} className="animate-pulse text-indigo-200"/> : <WifiOff size={36} className="text-slate-500"/>}
                            </div>
                            <div>
                                <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Canal de Sincronización</h2>
                                <p className={`font-bold text-[10px] uppercase tracking-widest mt-2 flex items-center gap-2 ${connStatus === 'CONNECTED' ? 'text-green-400' : 'text-slate-500'}`}>
                                    <Activity size={12} className={connStatus === 'CONNECTED' ? 'animate-bounce' : ''}/> 
                                    {connStatus === 'CONNECTED' ? 'CONECTADO A LA RED BRUZZONE' : connStatus === 'ERROR' ? 'SIN RESPUESTA DE NUBE' : 'ESPERANDO ID DE BÓVEDA...'}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Pulso de Red</p>
                             <p className="font-mono text-indigo-400 text-xl font-black">{lastSync}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8 bg-white/5 p-8 rounded-[3rem] border border-white/10 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-indigo-400 uppercase ml-2">ID Bóveda Compartida</label>
                                    <input className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-indigo-500 uppercase text-center" value={vaultId} onChange={e => setVaultId(e.target.value)} placeholder="EJ: BRUZZONE_LOCAL_1" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nombre de este Terminal</label>
                                    <input className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-indigo-500 uppercase text-center" value={terminalName} onChange={e => setTerminalName(e.target.value)} placeholder="EJ: CAJA_01" />
                                </div>
                            </div>
                            <button onClick={handleSaveVault} className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all shadow-xl">Vincular Terminal a la Nube</button>
                        </div>

                        <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-[3rem] p-8 flex flex-col space-y-4 shadow-2xl min-h-[220px]">
                            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-white/10 pb-4 flex items-center gap-2"><MonitorSmartphone size={14}/> Terminales Online</h3>
                            <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                                {terminals.length === 0 ? (
                                    <p className="text-center py-10 text-white/20 text-[10px] font-black uppercase">Sin terminales activas</p>
                                ) : terminals.map((t, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                            <span className="text-xs font-black uppercase text-white">{t.name}</span>
                                        </div>
                                        <span className="text-[8px] font-black uppercase text-slate-500">{t.isLocal ? 'ESTA PC' : 'NUBE'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECCION CLONACION (140K ARTICULOS) */}
            <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-xl space-y-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none text-indigo-600"><Server size={280}/></div>
                
                <div className="flex items-start gap-6 border-b border-slate-100 pb-8">
                    <div className="p-4 bg-slate-900 text-white rounded-3xl shadow-lg"><HardDrive size={32}/></div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Clonación de Base de Datos Maestra</h3>
                        <p className="text-slate-400 text-sm font-medium mt-1">Utilice este método para pasar los 140,000 artículos de una PC a otra de forma instantánea mediante un archivo.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                    <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200 space-y-6 group hover:border-indigo-300 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600"><Download size={24}/></div>
                            <h4 className="font-black text-slate-800 uppercase text-sm">Desde PC Principal</h4>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">Exporta toda la configuración, marcas, rubros y los 140,000 artículos en un solo archivo comprimido.</p>
                        <button 
                            onClick={handleFullExport}
                            disabled={isProcessing}
                            className="w-full bg-slate-900 hover:bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all flex items-center justify-center gap-3">
                            {isProcessing ? <RefreshCw className="animate-spin" size={18}/> : <FileJson size={18}/>} Exportar Base Maestra (.json)
                        </button>
                    </div>

                    <div className="bg-indigo-50/50 p-8 rounded-[2.5rem] border border-indigo-100 space-y-6 group hover:border-indigo-300 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600"><Upload size={24}/></div>
                            <h4 className="font-black text-slate-800 uppercase text-sm">En Nueva PC</h4>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">Importe el archivo generado para clonar el inventario completo. Luego vincule la bóveda para sincronizar ventas.</p>
                        <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file && confirm("ATENCIÓN: Esto reemplazará todos los artículos locales por los del archivo. ¿Continuar?")) {
                                setIsProcessing(true);
                                const ok = await syncService.importFullVault(file);
                                if (ok) window.location.reload();
                                else alert("Error crítico al importar la base de datos.");
                                setIsProcessing(false);
                            }
                        }} />
                        <button onClick={() => fileInputRef.current?.click()} disabled={isProcessing} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all flex items-center justify-center gap-3">
                            {isProcessing ? <RefreshCw className="animate-spin" size={18}/> : <HardDrive size={18}/>} Seleccionar Archivo y Clonar
                        </button>
                    </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex items-start gap-4">
                    <Info className="text-blue-600 shrink-0 mt-1" size={24}/>
                    <p className="text-[10px] text-blue-800 font-bold uppercase leading-relaxed">
                        Recomendación: Para una red de varias PCs, use un pendrive para llevar el archivo "Maestro" a cada computadora. Una vez clonado, active la Sincronización Cloud para que todas vean las ventas y cambios de stock en tiempo real.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CloudHub;
