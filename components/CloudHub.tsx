
import React, { useState, useEffect } from 'react';
import { 
    Cloud, RefreshCw, Key, Download, Upload, Globe, Copy,
    Zap, ShieldCheck, Info, History, Monitor, Wifi, WifiOff,
    CheckCircle2, ArrowRight, Loader2
} from 'lucide-react';
import { CloudConfig, CloudSyncStatus } from '../types';
import { syncService } from '../services/syncService';

const CloudHub: React.FC = () => {
    const [config, setConfig] = useState<CloudConfig>(() => {
        const saved = localStorage.getItem('ferrecloud_sync_config');
        return saved ? JSON.parse(saved) : {
            enabled: false,
            vaultId: `BRUZZONE-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            lastSync: 'Nunca',
            autoSync: true,
            apiUrl: 'https://cloud.ferrebruzzone.cloud/api/v1'
        };
    });

    const [isLinking, setIsLinking] = useState(false);
    const [syncProgress, setSyncProgress] = useState(0);
    const [inputVaultId, setInputVaultId] = useState('');

    useEffect(() => {
        const handleProgress = (e: any) => setSyncProgress(e.detail.progress);
        window.addEventListener('ferrecloud_sync_progress', handleProgress);
        return () => window.removeEventListener('ferrecloud_sync_progress', handleProgress);
    }, []);

    const handleLinkNewPC = async () => {
        if (!inputVaultId.trim()) {
            alert("Por favor, ingrese el ID de Bóveda de su otra PC.");
            return;
        }
        setIsLinking(true);
        setSyncProgress(5);
        try {
            const success = await syncService.linkTerminal(inputVaultId.trim().toUpperCase());
            if (success) {
                const updated = JSON.parse(localStorage.getItem('ferrecloud_sync_config') || '{}');
                setConfig(updated);
                alert("✅ ¡PC Vinculada! Los datos se han descargado correctamente.");
            }
        } catch (error) {
            alert("Error al vincular. Verifique su conexión.");
        } finally {
            setIsLinking(false);
            setSyncProgress(0);
        }
    };

    const handleCreateVault = () => {
        if (confirm("Se creará una nueva bóveda vacía en la nube para esta PC. ¿Desea continuar?")) {
            const newConfig = { ...config, enabled: true };
            localStorage.setItem('ferrecloud_sync_config', JSON.stringify(newConfig));
            setConfig(newConfig);
            syncService.syncEverything();
            alert("Bóveda creada. Ahora puede usar este ID en otras computadoras.");
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto h-full space-y-8 animate-fade-in bg-slate-50 overflow-y-auto pb-20">
            {/* ESTADO DE CONEXIÓN */}
            <div className="bg-white p-10 rounded-[3rem] border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
                <div className="absolute -top-10 -left-10 p-20 opacity-5 text-indigo-600 pointer-events-none">
                    <Globe size={240}/>
                </div>
                <div className="flex items-center gap-8 relative z-10">
                    <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center transition-all shadow-inner ${config.enabled ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                        {isLinking ? <Loader2 size={48} className="animate-spin text-indigo-600"/> : (config.enabled ? <Wifi size={48}/> : <WifiOff size={48}/>)}
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Nube Bruzzone</h2>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${config.enabled ? 'bg-green-50 text-green-600 border-green-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                {config.enabled ? 'CONECTADO' : 'DESVINCULADO'}
                            </span>
                        </div>
                        <p className="text-gray-400 mt-2 font-bold uppercase tracking-widest text-xs">
                             Sincronización Total Multi-PC
                        </p>
                        {isLinking && (
                            <div className="mt-4 w-64 space-y-2">
                                <div className="flex justify-between text-[9px] font-black text-indigo-600 uppercase">
                                    <span>Descargando Base...</span>
                                    <span>{syncProgress}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${syncProgress}%` }}></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                {!config.enabled && (
                    <button 
                        onClick={handleCreateVault}
                        className="bg-slate-900 text-white px-8 py-4 rounded-[1.8rem] font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all hover:bg-slate-800">
                        Convertir esta PC en Maestra
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* OPCIÓN 1: PC PRINCIPAL (ID) */}
                <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5"><Key size={180}/></div>
                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                            <div className="p-3 bg-white/10 text-indigo-400 rounded-2xl"><ShieldCheck size={24}/></div>
                            <h3 className="text-xl font-black uppercase tracking-tighter">Tu ID de Bóveda</h3>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Si esta es tu computadora principal, copia este código y úsalo en las otras computadoras de la ferretería.
                        </p>
                        <div className="bg-white/5 border-2 border-dashed border-white/20 p-8 rounded-[2rem] text-center">
                             <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Código de Enlace</p>
                             <div className="flex items-center justify-center gap-4">
                                <span className="text-4xl font-mono font-black text-white tracking-widest">{config.vaultId}</span>
                                <button onClick={() => { navigator.clipboard.writeText(config.vaultId); alert("ID Copiado"); }} className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-500 shadow-lg transition-all active:scale-90">
                                    <Copy size={20}/>
                                </button>
                             </div>
                        </div>
                    </div>
                </div>

                {/* OPCIÓN 2: PC NUEVA (VINCULAR) */}
                <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm flex flex-col">
                    <div className="flex items-center gap-4 border-b pb-6">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Monitor size={24}/></div>
                        <h3 className="font-black text-xl text-slate-800 uppercase tracking-tighter">Vincular PC Nueva</h3>
                    </div>
                    <div className="flex-1 py-8 space-y-6">
                        <p className="text-sm text-slate-500 font-medium">
                            ¿Quieres que esta computadora tenga los mismos 140.000 artículos y ventas de tu PC principal?
                        </p>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Ingresa el ID de la PC Maestra</label>
                            <input 
                                type="text" 
                                placeholder="EJ: BRUZZONE-X4Y2"
                                className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-mono font-black text-2xl text-center outline-none focus:border-indigo-600 transition-all uppercase"
                                value={inputVaultId}
                                onChange={e => setInputVaultId(e.target.value)}
                            />
                        </div>
                        <button 
                            onClick={handleLinkNewPC}
                            disabled={isLinking || !inputVaultId}
                            className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-700 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-30">
                            {isLinking ? <Loader2 className="animate-spin" size={20}/> : <RefreshCw size={20}/>}
                            Vincular y Descargar Todo
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="bg-indigo-50 p-8 rounded-[2.5rem] border border-indigo-100 flex items-start gap-6 shadow-sm">
                <div className="p-4 bg-white rounded-2xl text-indigo-600 shadow-md">
                    <Info size={32}/>
                </div>
                <div>
                    <h4 className="text-lg font-black text-indigo-900 uppercase tracking-tighter mb-1">¿Cómo funciona la sincronización?</h4>
                    <p className="text-xs text-indigo-700 font-medium leading-relaxed">
                        Una vez vinculadas, las computadoras comparten una "Bóveda" encriptada en la nube. 
                        Cuando vendes un artículo en el mostrador, el stock se descuenta en el resto de las terminales en tiempo real (requiere internet). 
                        Si una PC se queda sin conexión, los cambios se enviarán apenas vuelva el internet.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CloudHub;
