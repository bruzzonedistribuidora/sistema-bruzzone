
import React, { useState, useEffect, useRef } from 'react';
import { 
    Cloud, RefreshCw, Save, Zap, CloudDownload, Smartphone,
    Network, Wifi, ShieldCheck, FileUp, Monitor, 
    ArrowRight, Info, AlertTriangle, CheckCircle2, History,
    Terminal, User, Activity, Clock, Link, Copy, PlusCircle,
    Server, Key, Database, Lock, Globe, HardDriveDownload, 
    HardDriveUpload, Link2, WifiOff, MonitorSmartphone, FileDown,
    X, Radio, Signal
} from 'lucide-react';
import { syncService } from '../services/syncService';
import { productDB, cloudSimDB } from '../services/storageService';
import { RestApiConfig } from '../types';

const CloudHub: React.FC = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [mode, setMode] = useState<'LAN' | 'REST'>('LAN');
    const [vaultId, setVaultId] = useState(syncService.getVaultId() || '');
    const [terminalName, setTerminalName] = useState(localStorage.getItem('ferrecloud_terminal_name') || '');
    const [lastSync, setLastSync] = useState(localStorage.getItem('ferrecloud_last_sync') || 'Nunca');
    const [terminals, setTerminals] = useState<string[]>([]);
    const [connectionLog, setConnectionLog] = useState<string[]>(["Sistema iniciado..."]);
    
    const importFileRef = useRef<HTMLInputElement>(null);
    const [restConfig, setRestConfig] = useState<RestApiConfig>(syncService.getApiConfig());

    const addLog = (msg: string) => {
        setConnectionLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 5));
    };

    const loadCloudStatus = async () => {
        const vid = syncService.getVaultId();
        if (vid) {
            const data = await cloudSimDB.getFromVault(vid);
            if (data && data.terminals) {
                setTerminals(data.terminals);
                if (data.terminals.length > terminals.length) {
                    addLog(`Nueva terminal detectada en la red: ${vid}`);
                }
            }
            setLastSync(localStorage.getItem('ferrecloud_last_sync') || 'Sincronizando...');
        }
    };

    useEffect(() => {
        loadCloudStatus();
        const interval = setInterval(loadCloudStatus, 5000);
        window.addEventListener('ferrecloud_sync_pulse', loadCloudStatus);
        return () => {
            clearInterval(interval);
            window.removeEventListener('ferrecloud_sync_pulse', loadCloudStatus);
        };
    }, [terminals]);

    const handleSaveLAN = () => {
        if (!vaultId || !terminalName) return alert("Completa todos los campos.");
        const cleanId = vaultId.trim().toUpperCase();
        syncService.setVaultId(cleanId);
        localStorage.setItem('ferrecloud_terminal_name', terminalName.toUpperCase().trim());
        
        addLog(`Conectando a Bóveda: ${cleanId}...`);
        syncService.syncFromRemote().then(() => {
            addLog(`Vínculo establecido. Esperando otras terminales.`);
            loadCloudStatus();
        });
        alert("✅ Configuración guardada. La PC buscará compañeras en la red con el mismo ID.");
    };

    const handleForceScan = async () => {
        setIsProcessing(true);
        addLog("Escaneando red cloud...");
        await syncService.syncFromRemote();
        await loadCloudStatus();
        setIsProcessing(false);
        addLog("Escaneo completado.");
    };

    const exportFullState = async () => {
        if (!confirm("Esto generará un archivo con los 140.000 artículos para instalar en otra PC. ¿Continuar?")) return;
        setIsProcessing(true);
        try {
            const allProducts = await productDB.getAll(150000); 
            const fullData = {
                vaultId: syncService.getVaultId(),
                products: allProducts,
                config: JSON.parse(localStorage.getItem('company_config') || '{}'),
                timestamp: new Date().toISOString()
            };
            const blob = new Blob([JSON.stringify(fullData)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `INSTALADOR_DATOS_${vaultId || 'FERRE'}.ferre`;
            link.click();
            addLog("Paquete de migración generado con éxito.");
        } catch (e) {
            alert("Error al exportar.");
        } finally {
            setIsProcessing(false);
        }
    };

    const importFullState = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!confirm("¡ATENCIÓN! Esto borrará los datos actuales de esta PC y los reemplazará por los del paquete. ¿Continuar?")) {
            e.target.value = '';
            return;
        }

        setIsProcessing(true);
        addLog("Procesando paquete masivo...");
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                if (!data.products || !data.vaultId) throw new Error("Archivo no válido");

                await productDB.clearAll();
                await productDB.saveBulk(data.products);
                syncService.setVaultId(data.vaultId);
                
                if (data.config) {
                    localStorage.setItem('company_config', JSON.stringify(data.config));
                }

                addLog(`Importación completada: ${data.products.length} artículos.`);
                alert(`✅ ÉXITO: Se han importado ${data.products.length} artículos.`);
                window.location.reload(); 
            } catch (err) {
                alert("❌ Error al procesar el paquete .ferre.");
            } finally {
                setIsProcessing(false);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto h-full space-y-8 animate-fade-in bg-slate-50 overflow-y-auto pb-32">
            
            <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none"><Network size={240}/></div>
                <div className="relative z-10 space-y-8">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-indigo-600 rounded-[2rem] shadow-2xl shadow-indigo-600/20"><Signal size={32}/></div>
                            <div>
                                <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Interconexión Cloud</h2>
                                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">Vínculo de sucursales y terminales de venta</p>
                            </div>
                        </div>
                        <button 
                            onClick={handleForceScan}
                            disabled={isProcessing}
                            className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all border border-white/5">
                            {isProcessing ? <RefreshCw className="animate-spin" size={16}/> : <Radio size={16} className="text-indigo-400"/>}
                            Escanear Red Cloud
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8 space-y-6">
                            <div className="bg-white/5 p-8 rounded-[3rem] border border-white/10 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-indigo-400 uppercase ml-2 tracking-widest flex items-center gap-2"><Key size={14}/> ID de Bóveda Único</label>
                                        <input className="w-full p-4 bg-white/5 border-2 border-white/10 rounded-2xl font-black text-indigo-400 outline-none focus:border-indigo-500 uppercase text-xl text-center" value={vaultId} onChange={e => setVaultId(e.target.value)} placeholder="EJ: BRUZZONE2026"/>
                                        <p className="text-[8px] text-slate-500 uppercase text-center">Este ID vincula todas tus computadoras.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest flex items-center gap-2"><Monitor size={14}/> Nombre de esta PC</label>
                                        <input className="w-full p-4 bg-white/5 border-2 border-white/10 rounded-2xl font-black text-white outline-none focus:border-indigo-500 uppercase text-xl text-center" value={terminalName} onChange={e => setTerminalName(e.target.value)} placeholder="EJ: MOSTRADOR-1"/>
                                    </div>
                                </div>
                                <button onClick={handleSaveLAN} className="w-full bg-indigo-600 py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 active:scale-95 transition-all flex items-center justify-center gap-3">
                                    <ShieldCheck size={24}/> ACTIVAR VÍNCULO GLOBAL
                                </button>
                            </div>

                            <div className="bg-black/20 p-6 rounded-2xl border border-white/5 space-y-2">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Activity size={12}/> Log de Conectividad</p>
                                {connectionLog.map((log, i) => (
                                    <p key={i} className="text-[10px] font-mono text-slate-400 leading-none">{log}</p>
                                ))}
                            </div>
                        </div>

                        <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-[3rem] p-8 flex flex-col space-y-6">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/10 pb-4 flex items-center gap-2"><MonitorSmartphone size={16}/> Terminales Online</h3>
                            <div className="space-y-3 flex-1">
                                {terminals.length === 0 ? (
                                    <div className="py-10 text-center opacity-30 italic text-xs">Esperando conexión...</div>
                                ) : terminals.map(t => (
                                    <div key={t} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                                            <span className="text-xs font-black uppercase tracking-tight">{t}</span>
                                        </div>
                                        {t === (localStorage.getItem('ferrecloud_terminal_name') || 'PC-MOSTRADOR') && <span className="text-[8px] bg-indigo-500 text-white px-2 py-0.5 rounded-full font-black uppercase">Local</span>}
                                    </div>
                                ))}
                            </div>
                            <div className="pt-4 border-t border-white/5">
                                <p className="text-[8px] text-slate-500 uppercase font-black">Estado: <span className="text-green-500">Sincronizado</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl"><HardDriveUpload size={28}/></div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Clonación de Datos (140k)</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Evita descargas lentas por internet</p>
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed italic">Usa un pendrive para llevar tus 140.000 artículos a una PC nueva en segundos.</p>
                    <div className="pt-4 flex gap-3">
                        <button 
                            onClick={exportFullState}
                            disabled={isProcessing}
                            className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 transition-all">
                            {isProcessing ? <RefreshCw className="animate-spin" size={18}/> : <HardDriveUpload size={18}/>}
                            1. Exportar
                        </button>
                        <input type="file" ref={importFileRef} className="hidden" accept=".ferre" onChange={importFullState} />
                        <button 
                            onClick={() => importFileRef.current?.click()}
                            disabled={isProcessing}
                            className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 transition-all">
                            {isProcessing ? <RefreshCw className="animate-spin" size={18}/> : <HardDriveDownload size={18}/>}
                            2. Importar
                        </button>
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-3xl"><Wifi size={28}/></div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Estado de Sincronía</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Flujo de datos en vivo</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                            <span className="text-[10px] font-black text-slate-400 uppercase">Última Señal Cloud</span>
                            <span className="font-black text-xs text-indigo-600 uppercase">{lastSync}</span>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                            <CheckCircle2 size={20} className="text-indigo-600"/>
                            <p className="text-[10px] font-bold text-indigo-800 uppercase leading-none">Las PC se comunican mediante túneles de datos seguros.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-amber-50 p-8 rounded-[2.5rem] border-2 border-dashed border-amber-200 flex items-start gap-6">
                <div className="p-3 bg-white rounded-2xl shadow-sm text-amber-500"><Info size={24}/></div>
                <div>
                    <h4 className="font-black text-amber-800 uppercase text-xs tracking-widest mb-1">Manual de Interconexión</h4>
                    <p className="text-xs text-amber-700/80 leading-relaxed font-medium">
                        1. Asegúrate de que todas las computadoras tengan el ID exacto: <strong className="text-amber-900">{vaultId || 'bruzzone2026'}</strong>.<br/>
                        2. Cada PC debe tener un nombre distinto (Ej: CAJA-1, CAJA-2, OFICINA).<br/>
                        3. Si después de configurar no aparecen en la lista, pulsa el botón <strong>"Escanear Red Cloud"</strong> en la barra superior.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CloudHub;
