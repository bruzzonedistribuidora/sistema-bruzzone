
import React, { useState, useEffect } from 'react';
import { 
    Cloud, RefreshCw, Key, Globe, ShieldCheck, 
    Monitor, Wifi, WifiOff, CheckCircle2, ArrowRight,
    Loader2, CloudDownload, DatabaseZap, AlertTriangle, Link2,
    Activity, ShieldAlert, WifiHigh, ServerCrash, Info
} from 'lucide-react';
import { CloudConfig } from '../types';
import { syncService } from '../services/syncService';

const CloudHub: React.FC = () => {
    const [config, setConfig] = useState<CloudConfig>(() => {
        const saved = localStorage.getItem('ferrecloud_sync_config');
        return saved ? JSON.parse(saved) : {
            enabled: false,
            vaultId: `BRUZZONE-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
            lastSync: 'Nunca',
            autoSync: true,
            apiUrl: 'https://cloud.ferrebruzzone.cloud/api/v1'
        };
    });

    const [linkId, setLinkId] = useState('');
    const [isLinking, setIsLinking] = useState(false);
    const [diagStatus, setDiagStatus] = useState<'OK' | 'ERROR' | 'UNKNOWN'>('UNKNOWN');

    useEffect(() => {
        const check = () => {
            const data = localStorage.getItem(`ferrecloud_global_ts_${config.vaultId}`);
            setDiagStatus(data ? 'OK' : 'UNKNOWN');
        };
        check();
    }, [config.vaultId]);

    const handleLink = async () => {
        if (!linkId) return;
        setIsLinking(true);
        const success = await syncService.linkTerminal(linkId);
        setIsLinking(false);
        
        if (success) {
            alert("✅ ¡ÉXITO! Terminal vinculada. Los 140,000 artículos se están sincronizando.");
            window.location.reload();
        } else {
            alert("⚠️ Vínculo establecido, pero la nube está vacía. Si esta es una Terminal de Venta, asegúrate que la PC Madre ya haya subido los datos.");
            window.location.reload();
        }
    };

    const handleForcePush = async () => {
        setIsLinking(true);
        await syncService.pushToCloud({}, 'BULK_PRODUCTS');
        setIsLinking(false);
        alert("✅ Datos subidos a la nube. Todas las terminales verán los cambios en instantes.");
    };

    return (
        <div className="p-8 max-w-7xl mx-auto h-full space-y-8 animate-fade-in bg-slate-50 overflow-y-auto pb-32">
            
            {/* CABECERA DE ESTADO */}
            <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-200 shadow-xl flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
                <div className="absolute -top-10 -left-10 p-20 opacity-5 text-indigo-600 pointer-events-none">
                    <Globe size={280}/>
                </div>
                <div className="flex items-center gap-8 relative z-10">
                    <div className={`w-28 h-28 rounded-[2.5rem] flex items-center justify-center shadow-inner border-4 ${config.enabled ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                        {config.enabled ? <WifiHigh size={56} className="animate-pulse" /> : <WifiOff size={56}/>}
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-slate-950 uppercase tracking-tighter leading-none">Nube Central</h2>
                        <div className="flex items-center gap-4 mt-4">
                             <span className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border-2 ${config.enabled ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                {config.enabled ? 'Terminal Vinculada' : 'Modo Local Offline'}
                            </span>
                            <div className="flex items-center gap-2 text-slate-400 font-black text-[11px] uppercase tracking-widest">
                                {diagStatus === 'OK' ? <CheckCircle2 size={14} className="text-green-500"/> : <ShieldAlert size={14} className="text-amber-500"/>}
                                {diagStatus === 'OK' ? 'Datos en Red: Disponibles' : 'Datos en Red: No detectados'}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="bg-slate-900 text-white px-8 py-4 rounded-[2rem] flex items-center gap-4 shadow-2xl">
                         <div className={`w-3 h-3 rounded-full animate-pulse ${config.enabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                         <span className="text-[11px] font-black uppercase tracking-widest">Sincronización {config.enabled ? 'Activa' : 'Pausada'}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                
                {/* PC MADRE: PANEL DE CONTROL */}
                <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white shadow-2xl flex flex-col relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><DatabaseZap size={240}/></div>
                    <div className="relative z-10 space-y-8">
                        <div className="flex items-center gap-6 border-b border-white/10 pb-8">
                            <div className="p-4 bg-indigo-600 rounded-3xl shadow-xl"><Cloud size={32}/></div>
                            <h3 className="text-3xl font-black uppercase tracking-tighter">PC Madre (Principal)</h3>
                        </div>
                        <p className="text-lg text-slate-400 font-medium leading-relaxed">
                            Cualquier cambio de precio o stock que hagas aquí se enviará a las terminales automáticamente. Si notas que las cajas no se actualizan, pulsa el botón de abajo.
                        </p>
                        
                        <div className="bg-white/5 border-2 border-dashed border-white/10 p-10 rounded-[3rem] text-center">
                             <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Tu ID de Bóveda Único</p>
                             <p className="text-6xl font-mono font-black tracking-[0.2em] text-white">{config.vaultId}</p>
                             <p className="text-[10px] mt-4 text-slate-500 font-bold uppercase">Usa este ID para vincular tus otras PCs</p>
                        </div>

                        <button 
                            onClick={handleForcePush}
                            disabled={isLinking}
                            className="w-full bg-white text-slate-950 py-6 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-3">
                            {isLinking ? <Loader2 className="animate-spin" /> : <RefreshCw size={20}/>}
                            Forzar Actualización de Nube
                        </button>
                    </div>
                </div>

                {/* TERMINAL DE VENTA: PANEL DE VÍNCULO */}
                <div className="bg-white rounded-[3.5rem] p-12 border-4 border-indigo-100 shadow-2xl flex flex-col relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><Monitor size={240}/></div>
                    <div className="relative z-10 space-y-8 h-full flex flex-col">
                        <div className="flex items-center gap-6 border-b border-slate-100 pb-8">
                            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl shadow-xl"><Link2 size={32}/></div>
                            <h3 className="text-3xl font-black text-slate-950 uppercase tracking-tighter">Terminal de Ventas</h3>
                        </div>
                        <p className="text-lg text-slate-500 font-medium leading-relaxed">
                            Ingresa el ID de la PC Madre para clonar toda la ferretería aquí. La terminal se mantendrá sincronizada sola cada 15 segundos.
                        </p>
                        
                        <div className="flex-1 flex flex-col justify-center gap-6">
                            <div className="relative">
                                <Key className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={24}/>
                                <input 
                                    type="text"
                                    placeholder="EJ: BRUZZONE-A4B2"
                                    className="w-full pl-16 pr-8 py-8 bg-slate-50 border-2 border-slate-200 rounded-[2.5rem] font-mono text-4xl text-center outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-inner uppercase"
                                    value={linkId}
                                    onChange={e => setLinkId(e.target.value)}
                                />
                            </div>
                            <button 
                                onClick={handleLink}
                                disabled={isLinking || !linkId}
                                className="w-full bg-slate-900 text-white py-8 rounded-[2.5rem] font-black uppercase text-sm tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-30">
                                {isLinking ? <Loader2 className="animate-spin" size={24}/> : <ShieldCheck size={28}/>}
                                Vincular y Clonar Inventario
                            </button>
                        </div>

                        <div className="flex items-start gap-4 p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                             {/* Added comment: Fixed missing icon import 'Info' */}
                             <Info className="text-indigo-600 shrink-0 mt-1" size={20}/>
                             <p className="text-[11px] text-indigo-700 font-bold leading-relaxed uppercase">
                                Al vincular, esta computadora borrará su base de datos local y descargará los 140,000 artículos de la PC Madre.
                             </p>
                        </div>
                    </div>
                </div>

            </div>

            {/* DIAGNÓSTICO TÉCNICO */}
            <div className="bg-amber-50 border-2 border-amber-200 p-10 rounded-[3.5rem] flex flex-col md:flex-row items-center gap-10 shadow-md">
                <div className="p-6 bg-white rounded-[2rem] text-amber-600 shadow-xl border border-amber-100 shrink-0">
                    <ServerCrash size={48}/>
                </div>
                <div className="space-y-4">
                    <h4 className="text-2xl font-black text-amber-950 uppercase tracking-tighter">¿Cómo funciona la Nube sin Internet?</h4>
                    <p className="text-sm text-amber-900 font-bold leading-relaxed uppercase opacity-80">
                        El sistema utiliza una tecnología de **Red Local Sincronizada**. <br/>
                        1. La PC Madre guarda los cambios en un "Buzón de Red" (ID Bóveda). <br/>
                        2. Las terminales revisan ese buzón constantemente. <br/>
                        3. Para que funcione en diferentes edificios, asegúrate de que ambas PCs tengan acceso a esta misma URL de aplicación.
                    </p>
                </div>
                <div className="ml-auto">
                     <button onClick={() => window.location.reload()} className="bg-amber-200 hover:bg-amber-300 text-amber-900 px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">Reiniciar Red</button>
                </div>
            </div>
        </div>
    );
};

export default CloudHub;
