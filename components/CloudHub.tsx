
import React, { useState, useEffect, useRef } from 'react';
import { 
    Cloud, RefreshCw, Save, Zap, CloudDownload, Smartphone,
    Network, Wifi, ShieldCheck, FileUp, Monitor, 
    ArrowRight, Info, AlertTriangle, CheckCircle2, History,
    Terminal, User, Activity, Clock, Link, Copy, PlusCircle,
    Server, Key, Database, Lock, Globe, HardDriveDownload, 
    HardDriveUpload, Link2, WifiOff, MonitorSmartphone, FileDown,
    X, Radio, Signal, Globe2
} from 'lucide-react';
import { syncService } from '../services/syncService';
import { productDB } from '../services/storageService';

const CloudHub: React.FC = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [vaultId, setVaultId] = useState(syncService.getVaultId() || '');
    const [terminalName, setTerminalName] = useState(localStorage.getItem('ferrecloud_terminal_name') || '');
    const [lastSync, setLastSync] = useState(localStorage.getItem('ferrecloud_last_sync') || 'Nunca');
    const [terminals, setTerminals] = useState<string[]>([]);
    const [connectionLog, setConnectionLog] = useState<string[]>(["Puente de datos listo."]);
    
    const importFileRef = useRef<HTMLInputElement>(null);

    const addLog = (msg: string) => {
        setConnectionLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 5));
    };

    const updateStatus = async () => {
        const vid = syncService.getVaultId();
        const myName = localStorage.getItem('ferrecloud_terminal_name') || 'ESTA-PC';
        
        if (vid) {
            try {
                // Dirección de nuestro nuevo bucket en KVDB
                const response = await fetch(`https://kvdb.io/2uD6vR8WpL8R4WpL8R4WpL/${vid}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.terminals) {
                        const activeList = Object.keys(data.terminals);
                        // Aseguramos que la local esté aunque no haya internet
                        if (!activeList.includes(myName)) activeList.push(myName);
                        setTerminals(activeList);
                    }
                } else if (response.status === 404) {
                    setTerminals([myName]); // Solo nosotros por ahora
                    addLog("Bóveda nueva. Esperando otras terminales...");
                }
            } catch (e) {
                setTerminals([myName]); // Al menos mostramos la local
                addLog("Error de Red: No se pudo contactar al servidor cloud.");
            }
            setLastSync(localStorage.getItem('ferrecloud_last_sync') || 'Sincronizando...');
        } else {
            if (terminalName) setTerminals([myName]);
        }
    };

    useEffect(() => {
        updateStatus();
        const interval = setInterval(updateStatus, 10000);
        window.addEventListener('ferrecloud_sync_pulse', updateStatus);
        return () => {
            clearInterval(interval);
            window.removeEventListener('ferrecloud_sync_pulse', updateStatus);
        };
    }, [vaultId]);

    const handleSave = async () => {
        if (!vaultId || !terminalName) return alert("Por favor, ingresa el ID y el Nombre de la PC.");
        
        setIsProcessing(true);
        addLog(`Sincronizando ID: ${vaultId}...`);
        
        syncService.setVaultId(vaultId);
        localStorage.setItem('ferrecloud_terminal_name', terminalName.toUpperCase().trim());
        
        await syncService.syncFromRemote();
        setIsProcessing(false);
        addLog("Vínculo Global Activado correctamente.");
        alert("✅ SISTEMA VINCULADO. Esta PC ahora buscará a las demás automáticamente.");
    };

    const exportFullState = async () => {
        if (!confirm("Esto generará un paquete con los 140.000 artículos. ¿Continuar?")) return;
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
            link.download = `BASE_DATOS_${vaultId || 'BRUZZONE'}.ferre`;
            link.click();
            addLog("Archivo de migración listo.");
        } catch (e) {
            alert("Error al exportar.");
        } finally {
            setIsProcessing(false);
        }
    };

    const importFullState = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!confirm("¡ATENCIÓN! Se borrará la base local y se cargará el paquete de 140.000 artículos. ¿Continuar?")) {
            e.target.value = '';
            return;
        }

        setIsProcessing(true);
        addLog("Cargando 140k artículos...");
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                if (!data.products) throw new Error();

                await productDB.clearAll();
                await productDB.saveBulk(data.products);
                if (data.vaultId) syncService.setVaultId(data.vaultId);
                if (data.config) localStorage.setItem('company_config', JSON.stringify(data.config));

                addLog(`Carga completada: ${data.products.length} artículos.`);
                alert(`✅ ÉXITO: ${data.products.length} artículos importados.`);
                window.location.reload(); 
            } catch (err) {
                alert("❌ El archivo no es válido.");
            } finally {
                setIsProcessing(false);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto h-full space-y-8 animate-fade-in bg-slate-50 overflow-y-auto pb-32">
            
            {/* PANEL PRINCIPAL: CONEXIÓN GLOBAL */}
            <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><Globe size={280}/></div>
                <div className="relative z-10 space-y-10">
                    <div className="flex items-center gap-5">
                        <div className="p-5 bg-indigo-600 rounded-[2rem] shadow-2xl shadow-indigo-600/20"><Signal size={36}/></div>
                        <div>
                            <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Canal Cloud Sincronizado</h2>
                            <p className="text-indigo-400 font-bold text-[10px] uppercase tracking-widest mt-2 flex items-center gap-2">
                                <Globe2 size={12} className="animate-pulse"/> Red Global FerreCloud (KVDB Relay)
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8 space-y-8">
                            <div className="bg-white/5 p-8 rounded-[3rem] border border-white/10 space-y-8 shadow-inner">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-indigo-400 uppercase ml-2 tracking-widest flex items-center gap-2"><Key size={14}/> ID de Bóveda</label>
                                        <input 
                                            className="w-full p-5 bg-white/5 border-2 border-white/10 rounded-2xl font-black text-indigo-400 outline-none focus:border-indigo-500 uppercase text-2xl text-center shadow-lg transition-all" 
                                            value={vaultId} 
                                            onChange={e => setVaultId(e.target.value)} 
                                            placeholder="EJ: BRUZZONE2026"
                                        />
                                        <p className="text-[8px] text-slate-500 uppercase text-center font-bold">Usa el mismo ID en todas las computadoras.</p>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest flex items-center gap-2"><Monitor size={14}/> Nombre de esta PC</label>
                                        <input 
                                            className="w-full p-5 bg-white/5 border-2 border-white/10 rounded-2xl font-black text-white outline-none focus:border-indigo-500 uppercase text-2xl text-center shadow-lg transition-all" 
                                            value={terminalName} 
                                            onChange={e => setTerminalName(e.target.value)} 
                                            placeholder="EJ: CAJA-01"
                                        />
                                        <p className="text-[8px] text-slate-500 uppercase text-center font-bold">Ejemplos: MOSTRADOR, OFICINA, DEPOSITO.</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleSave} 
                                    disabled={isProcessing}
                                    className="w-full bg-indigo-600 py-7 rounded-[2.5rem] font-black uppercase tracking-[0.3em] shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 active:scale-95 transition-all flex items-center justify-center gap-4 text-sm">
                                    {isProcessing ? <RefreshCw className="animate-spin" size={24}/> : <ShieldCheck size={24}/>}
                                    {isProcessing ? 'CONECTANDO...' : 'VINCULAR AHORA'}
                                </button>
                            </div>

                            <div className="bg-black/40 p-6 rounded-2xl border border-white/5 space-y-2">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Activity size={12}/> Historial de Conexión</p>
                                {connectionLog.map((log, i) => (
                                    <p key={i} className="text-[11px] font-mono text-indigo-300/70 leading-tight tracking-tighter">{log}</p>
                                ))}
                            </div>
                        </div>

                        <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-[3rem] p-8 flex flex-col space-y-6 shadow-2xl">
                            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-white/10 pb-4 flex items-center gap-2"><MonitorSmartphone size={16}/> Terminales Online</h3>
                            <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] custom-scrollbar pr-2">
                                {terminals.length === 0 ? (
                                    <div className="py-20 text-center opacity-30 italic text-xs flex flex-col items-center gap-4">
                                        <WifiOff size={40} strokeWidth={1}/>
                                        Buscando...
                                    </div>
                                ) : terminals.map(t => (
                                    <div key={t} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all border-l-4 border-l-indigo-500">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
                                            <span className="text-xs font-black uppercase tracking-tight text-white">{t}</span>
                                        </div>
                                        {t === (localStorage.getItem('ferrecloud_terminal_name') || 'ESTA-PC') ? 
                                            <span className="text-[8px] bg-indigo-500 text-white px-2 py-0.5 rounded-full font-black uppercase">Local</span> :
                                            <span className="text-[8px] text-green-500 font-black uppercase">En Nube</span>
                                        }
                                    </div>
                                ))}
                            </div>
                            <div className="pt-4 border-t border-white/5 text-center">
                                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Sincronización: <span className="text-indigo-400">Activa</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECCIÓN: MIGRACIÓN RÁPIDA (140k artículos) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-6 group">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl group-hover:bg-indigo-600 group-hover:text-white transition-all"><HardDriveUpload size={28}/></div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Clonar Base de Datos (Pendrive)</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Carga instantánea de 140.000 artículos</p>
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed italic">
                        Para no esperar horas a que bajen los 140.000 artículos por internet, genera este archivo en tu PC principal y cárgalo en las demás mediante un pendrive.
                    </p>
                    <div className="pt-4 flex gap-4">
                        <button 
                            onClick={exportFullState}
                            disabled={isProcessing}
                            className="flex-1 bg-slate-900 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 transition-all">
                            {isProcessing ? <RefreshCw className="animate-spin" size={18}/> : <HardDriveUpload size={18}/>}
                            1. Exportar (.ferre)
                        </button>
                        <input type="file" ref={importFileRef} className="hidden" accept=".ferre" onChange={importFullState} />
                        <button 
                            onClick={() => importFileRef.current?.click()}
                            disabled={isProcessing}
                            className="flex-1 bg-indigo-600 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 transition-all">
                            {isProcessing ? <RefreshCw className="animate-spin" size={18}/> : <HardDriveDownload size={18}/>}
                            2. Importar (.ferre)
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
                        <div className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-slate-100">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Último Pulso Cloud</span>
                            <span className="font-black text-xs text-indigo-600 uppercase">{lastSync}</span>
                        </div>
                        <div className="flex items-center gap-4 p-5 bg-emerald-50 border border-emerald-100 rounded-2xl">
                            <CheckCircle2 size={24} className="text-emerald-600"/>
                            <p className="text-[10px] font-bold text-emerald-800 uppercase leading-tight">
                                Sincronización de tickets, remitos y cuentas corrientes activa.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-amber-50 p-8 rounded-[2.5rem] border-2 border-dashed border-amber-200 flex items-start gap-6">
                <div className="p-3 bg-white rounded-2xl shadow-sm text-amber-500"><Info size={24}/></div>
                <div>
                    <h4 className="font-black text-amber-800 uppercase text-xs tracking-widest mb-1">Guía de Resolución</h4>
                    <p className="text-xs text-amber-700/80 leading-relaxed font-medium">
                        Si ves <strong>"Error de Red"</strong>, verifica que la PC tenga salida a internet. El sistema intentará reconectar automáticamente cada 15 segundos. El ID <strong className="text-amber-900">{vaultId || 'bruzzone2026'}</strong> es tu llave privada de acceso.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CloudHub;
