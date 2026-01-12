
import React, { useState, useEffect, useRef } from 'react';
import { 
    Globe, RefreshCw, Zap, WifiOff, Signal, Activity, 
    Search, Wifi, FileJson, Download, Upload, ShieldCheck,
    AlertTriangle, Server, HardDrive, MonitorSmartphone
} from 'lucide-react';
import { syncService } from '../services/syncService';

const CloudHub: React.FC = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [vaultId, setVaultId] = useState(syncService.getVaultId() || '');
    const [terminalName, setTerminalName] = useState(localStorage.getItem('ferrecloud_terminal_name') || '');
    const [lastSync, setLastSync] = useState(localStorage.getItem('ferrecloud_last_sync') || 'No vinculado');
    const [terminals, setTerminals] = useState<{name: string, isLocal: boolean}[]>([]);
    const [isOnline, setIsOnline] = useState(false);
    const [syncMessage, setSyncMessage] = useState('Nube lista');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handlePulse = (e: any) => {
            setIsOnline(true);
            const list = Object.entries(e.detail.terminals).map(([id, info]: [string, any]) => ({
                name: info.name,
                isLocal: info.name === terminalName.toUpperCase()
            }));
            setTerminals(list);
            setSyncMessage('Señal de nube activa');
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

    const handleSaveVault = () => {
        if (!vaultId || !terminalName) return alert("Completa los datos.");
        localStorage.setItem('ferrecloud_terminal_name', terminalName.toUpperCase().trim());
        syncService.setVaultId(vaultId);
        alert("ID de nube configurado.");
    };

    const handleExport = async () => {
        setIsProcessing(true);
        const success = await syncService.exportFullVault();
        if (success) alert("Paquete Maestro generado con éxito.\nGuárdalo en tu carpeta compartida.");
        setIsProcessing(false);
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (!confirm("Esto borrará los datos actuales de esta PC y los reemplazará por los del archivo. ¿Continuar?")) return;
        
        setIsProcessing(true);
        const success = await syncService.importFullVault(file);
        if (success) {
            alert("✅ Sincronización Completa.\nEl sistema se reiniciará para cargar los 140,000 artículos.");
            window.location.reload();
        } else {
            alert("❌ Error al procesar el archivo.");
        }
        setIsProcessing(false);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto h-full space-y-8 animate-fade-in bg-slate-50 overflow-y-auto pb-32">
            
            {/* PANEL DE NUBE (SOLO PRESENCIA) */}
            <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><Globe size={280}/></div>
                <div className="relative z-10 space-y-10">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-5">
                            <div className={`p-5 rounded-[2rem] shadow-2xl transition-all ${isOnline ? 'bg-indigo-600' : 'bg-slate-800'}`}>
                                {isOnline ? <Signal size={36} className="animate-pulse text-indigo-200"/> : <WifiOff size={36} className="text-slate-500"/>}
                            </div>
                            <div>
                                <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Canal de Presencia</h2>
                                <p className={`font-bold text-[10px] uppercase tracking-widest mt-2 flex items-center gap-2 ${isOnline ? 'text-indigo-400' : 'text-slate-500'}`}>
                                    <Activity size={12} className={isOnline ? 'animate-bounce' : ''}/> {syncMessage}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8 bg-white/5 p-8 rounded-[3rem] border border-white/10 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-indigo-400 uppercase ml-2 tracking-widest">Bóveda</label>
                                    <input className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-indigo-500 uppercase text-center" value={vaultId} onChange={e => setVaultId(e.target.value)} placeholder="BRUZZONE2026" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Identidad PC</label>
                                    <input className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-indigo-500 uppercase text-center" value={terminalName} onChange={e => setTerminalName(e.target.value)} placeholder="CAJA-1" />
                                </div>
                            </div>
                            <button onClick={handleSaveVault} className="w-full py-4 bg-slate-700 hover:bg-indigo-600 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all">Configurar Canal</button>
                        </div>

                        <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-[3rem] p-8 flex flex-col space-y-4 shadow-2xl min-h-[250px]">
                            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-white/10 pb-4 flex items-center gap-2"><MonitorSmartphone size={14}/> PCs en Red</h3>
                            <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                                {terminals.map((t, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                            <span className="text-xs font-black uppercase text-white">{t.name}</span>
                                        </div>
                                        <span className="text-[8px] font-black uppercase text-slate-500">{t.isLocal ? 'Esta PC' : 'En Red'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PLAN B: SINCRONIZACIÓN LOCAL MASIVA */}
            <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-xl space-y-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none text-indigo-600"><Server size={280}/></div>
                
                <div className="flex items-start gap-6 border-b border-slate-100 pb-8">
                    <div className="p-4 bg-indigo-600 text-white rounded-3xl shadow-lg"><HardDrive size={32}/></div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Sincronización Local (Plan B)</h3>
                        <p className="text-slate-400 text-sm font-medium mt-1">Usa este método para mover los 140,000 artículos entre PCs sin pasar por internet.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                    {/* EXPORTAR */}
                    <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200 space-y-6 group hover:border-indigo-300 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600"><Download size={24}/></div>
                            <h4 className="font-black text-slate-800 uppercase text-sm">Paso 1: Generar Paquete</h4>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">Haz esto en la PC que tiene los artículos cargados. Se creará un archivo único con todo el stock, clientes y configuración.</p>
                        <button 
                            onClick={handleExport}
                            disabled={isProcessing}
                            className="w-full bg-slate-900 hover:bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all flex items-center justify-center gap-3">
                            {isProcessing ? <RefreshCw className="animate-spin" size={18}/> : <FileJson size={18}/>}
                            Generar Paquete Maestro
                        </button>
                    </div>

                    {/* IMPORTAR */}
                    <div className="bg-indigo-50/50 p-8 rounded-[2.5rem] border border-indigo-100 space-y-6 group hover:border-indigo-300 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600"><Upload size={24}/></div>
                            <h4 className="font-black text-slate-800 uppercase text-sm">Paso 2: Cargar en otra PC</h4>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-medium italic">En las otras computadoras, busca el archivo generado y cárgalo. Esto sincronizará el 100% de la ferretería en segundos.</p>
                        <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImport} />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isProcessing}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all flex items-center justify-center gap-3">
                            {isProcessing ? <RefreshCw className="animate-spin" size={18}/> : <HardDrive size={18}/>}
                            Seleccionar y Cargar
                        </button>
                    </div>
                </div>

                <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex items-start gap-4">
                    <AlertTriangle className="text-amber-600 shrink-0 mt-1" size={24}/>
                    <p className="text-[10px] text-amber-800 font-bold uppercase leading-relaxed">
                        Recomendación Profesional: Para 140,000 artículos, genera un paquete maestro cada vez que hagas cambios grandes de precios. Las ventas diarias se seguirán viendo en el historial una vez que la nube estabilice la señal.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CloudHub;
