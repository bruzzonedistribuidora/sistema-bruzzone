
import React, { useState, useEffect, useRef } from 'react';
import { 
    Cloud, RefreshCw, Save, Zap, CloudDownload, Smartphone,
    Network, Wifi, ShieldCheck, FileUp, FileOutput, Monitor, 
    ArrowRight, Info, AlertTriangle, CheckCircle2, History,
    Terminal, User, Activity, Clock, Link, Copy, PlusCircle
} from 'lucide-react';
import { syncService } from '../services/syncService';
import { productDB } from '../services/storageService';
import { SyncLogEntry } from '../types';

const CloudHub: React.FC = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [syncProgress, setSyncProgress] = useState(0);
    const [syncMessage, setSyncMessage] = useState("");
    const [vaultId, setVaultId] = useState(syncService.getVaultId() || '');
    const [terminalName, setTerminalName] = useState(localStorage.getItem('ferrecloud_terminal_name') || '');
    const [stats, setStats] = useState({ count: 0 });
    const [lastSync, setLastSync] = useState(localStorage.getItem('ferrecloud_last_sync') || 'Nunca');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const refreshData = async () => {
        const s = await productDB.getStats();
        setStats(s);
    };

    useEffect(() => {
        refreshData();
        const handleProgress = (e: any) => {
            setSyncProgress(e.detail.progress);
            if (e.detail.message) setSyncMessage(e.detail.message);
            if (e.detail.progress === 100) {
                setLastSync(new Date().toLocaleString());
                setTimeout(() => { setSyncProgress(0); setSyncMessage(""); }, 3000);
            }
        };
        window.addEventListener('ferrecloud_sync_progress', handleProgress);
        return () => window.removeEventListener('ferrecloud_sync_progress', handleProgress);
    }, []);

    // FUNCIÓN PARA GENERAR UN VÍNCULO NUEVO (LLAVE DE RED)
    const handleGenerateVault = () => {
        const company = JSON.parse(localStorage.getItem('company_config') || '{}');
        const prefix = (company.fantasyName || 'FERRE').substring(0, 5).toUpperCase().replace(/\s/g, '');
        const random = Math.floor(1000 + Math.random() * 9000);
        const newId = `${prefix}-${random}-BR`;
        setVaultId(newId);
        alert(`NUEVA RED CREADA: ${newId}\n\nCopia este código y pégalo en las otras computadoras de la ferretería para sincronizar.`);
    };

    const handleSaveConfig = () => {
        if (!vaultId || !terminalName) {
            alert("⚠️ Error: Completa el ID de Bóveda y el Nombre de esta PC.");
            return;
        }
        syncService.setVaultId(vaultId.trim().toUpperCase());
        localStorage.setItem('ferrecloud_terminal_name', terminalName.toUpperCase().trim());
        
        // Disparar sincronización inmediata al vincular
        syncService.syncFromRemote();
        
        alert("✅ VÍNCULO ESTABLECIDO. El sistema ahora se sincronizará automáticamente en segundo plano.");
    };

    const handleManualSync = async () => {
        if (!vaultId) return alert("Primero debes generar o ingresar un ID de Vínculo.");
        setIsProcessing(true);
        const success = await syncService.syncFromRemote();
        setIsProcessing(false);
        if (!success) alert("❌ Error de conexión. Verifica el ID del Vínculo.");
    };

    return (
        <div className="p-8 max-w-7xl mx-auto h-full space-y-8 animate-fade-in bg-slate-50 overflow-y-auto pb-32">
            
            {/* PANEL PRINCIPAL DE CONEXIÓN */}
            <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none"><Cloud size={240}/></div>
                <div className="relative z-10 space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg"><Network size={28}/></div>
                        <div>
                            <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">FerreConnect Cloud</h2>
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">Sincronización Total Multiterminal (Estilo Fidel)</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-indigo-400 uppercase ml-2 tracking-widest flex justify-between">
                                        ID de Vínculo de Red
                                        <button onClick={handleGenerateVault} className="text-white hover:underline lowercase font-medium opacity-50">Generar Nuevo</button>
                                    </label>
                                    <div className="relative group">
                                        <Link className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
                                        <input 
                                            className="w-full pl-12 p-4 bg-white/5 border-2 border-white/10 rounded-2xl font-black text-indigo-400 outline-none focus:border-indigo-500 uppercase tracking-widest" 
                                            value={vaultId} 
                                            onChange={e => setVaultId(e.target.value)}
                                            placeholder="EJ: MI-FERRE-1234"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Nombre de esta PC</label>
                                    <div className="relative group">
                                        <Monitor className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
                                        <input 
                                            className="w-full pl-12 p-4 bg-white/5 border-2 border-white/10 rounded-2xl font-black text-white outline-none focus:border-indigo-500 uppercase" 
                                            value={terminalName} 
                                            onChange={e => setTerminalName(e.target.value)} 
                                            placeholder="EJ: CAJA-01"
                                        />
                                    </div>
                                </div>
                            </div>
                            <button onClick={handleSaveConfig} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-[1.8rem] font-black uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                                <ShieldCheck size={24}/> ACTIVAR VÍNCULO Y SINCRONIZAR
                            </button>
                        </div>

                        <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-[2.5rem] p-8 flex flex-col justify-center text-center space-y-6">
                            <div>
                                <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Estado de Red</p>
                                <div className="flex items-center justify-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${vaultId ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                                    <span className="text-xl font-black">{vaultId ? 'VINCULADO' : 'DESCONECTADO'}</span>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-white/5">
                                <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Último contacto nube</p>
                                <p className="text-xs font-bold text-indigo-400">{lastSync}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECCIÓN DE AYUDA Y HERRAMIENTAS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl w-fit"><Info size={24}/></div>
                    <h4 className="font-black text-slate-800 uppercase text-xs">¿Cómo conectar otra PC?</h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        1. Genera un ID en tu PC principal.<br/>
                        2. Anota el ID y ve a la otra PC.<br/>
                        3. Pega el mismo ID y dale a "Activar".<br/>
                        4. ¡Listo! El stock y precios se cruzarán solos.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl w-fit"><Zap size={24}/></div>
                    <h4 className="font-black text-slate-800 uppercase text-xs">Sincronización Silenciosa</h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        Una vez vinculada, no necesitas tocar nada más. Cada venta o cambio de precio subirá a la nube y bajará a las demás PCs cada 30 segundos de forma automática.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-center gap-4">
                    <button onClick={handleManualSync} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                        <RefreshCw size={16}/> Forzar Descarga Ahora
                    </button>
                    <button onClick={() => { navigator.clipboard.writeText(vaultId); alert("ID Copiado"); }} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                        <Copy size={16}/> Copiar ID de Red
                    </button>
                </div>
            </div>

            {isProcessing && (
                <div className="fixed inset-0 z-[300] bg-slate-950/80 backdrop-blur-md flex items-center justify-center">
                    <div className="text-center space-y-6">
                        <RefreshCw className="animate-spin text-white mx-auto" size={64}/>
                        <p className="text-white font-black uppercase tracking-widest">Sincronizando con la red...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CloudHub;
