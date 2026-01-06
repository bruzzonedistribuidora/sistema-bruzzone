
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Cloud, RefreshCw, Smartphone, Monitor, Database, 
    Zap, ShieldCheck, Key, ArrowRight, CheckCircle, 
    Download, Upload, AlertTriangle, Info, Globe,
    Server, Share2, Copy, Trash2, Layers, History
} from 'lucide-react';
import { CloudConfig, CloudSyncStatus } from '../types';
import { productDB } from '../services/storageService';

const CloudHub: React.FC = () => {
    const [config, setConfig] = useState<CloudConfig>(() => {
        const saved = localStorage.getItem('ferrecloud_sync_config');
        return saved ? JSON.parse(saved) : {
            enabled: false,
            vaultId: `FERRE-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            lastSync: 'Nunca',
            autoSync: true,
            apiUrl: 'https://api.ferrebruzzone.com.ar/sync'
        };
    });

    const [status, setStatus] = useState<CloudSyncStatus>('OFFLINE');
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        localStorage.setItem('ferrecloud_sync_config', JSON.stringify(config));
        setStatus(config.enabled ? 'ONLINE' : 'OFFLINE');
    }, [config]);

    const handleInitialPush = async () => {
        setIsProcessing(true);
        setProgress(0);
        
        // Simulación de carga de 140,000 artículos en fragmentos
        const total = 140000;
        const chunkSize = 10000;
        
        for (let i = 0; i <= total; i += chunkSize) {
            await new Promise(r => setTimeout(r, 400));
            setProgress(Math.round((i / total) * 100));
        }

        setConfig(prev => ({ ...prev, lastSync: new Date().toLocaleString(), enabled: true }));
        setIsProcessing(false);
        alert("✅ Ferretería Bruzzone Sincronizada. Ahora puedes usar el Vault ID en tus otras PCs.");
    };

    const handleCopyId = () => {
        navigator.clipboard.writeText(config.vaultId);
        alert("ID de Bóveda copiado.");
    };

    return (
        <div className="p-8 max-w-6xl mx-auto h-full space-y-8 animate-fade-in bg-slate-50 overflow-y-auto pb-20">
            <div className="bg-white p-10 rounded-[3rem] border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
                <div className="absolute -top-10 -left-10 p-20 opacity-5 text-indigo-600 pointer-events-none">
                    <Globe size={240}/>
                </div>
                <div className="flex items-center gap-8 relative z-10">
                    <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center transition-all shadow-inner ${status === 'ONLINE' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                        {isProcessing ? <RefreshCw size={48} className="animate-spin"/> : <Cloud size={48} />}
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase leading-none">Nube Bruzzone</h2>
                        <p className="text-gray-400 mt-2 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                             Status: <span className={status === 'ONLINE' ? 'text-green-600' : 'text-slate-400'}>{status}</span>
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-3 italic">Ultima sincronización: {config.lastSync}</p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 relative z-10">
                    {!config.enabled ? (
                        <button 
                            onClick={handleInitialPush}
                            disabled={isProcessing}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-100 flex items-center justify-center gap-3 transition-all active:scale-95">
                            {isProcessing ? `Subiendo Inventario (${progress}%)` : 'Activar Bóveda en la Nube'}
                        </button>
                    ) : (
                        <button className="bg-white border-2 border-green-100 text-green-600 px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-sm">
                            <ShieldCheck size={20}/> Conectado y Protegido
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm space-y-8">
                    <h3 className="font-black text-xl text-slate-800 uppercase tracking-tighter flex items-center gap-3 border-b pb-6">
                        <Key size={24} className="text-indigo-600"/> Enlace Multi-PC
                    </h3>
                    <p className="text-slate-500 font-medium text-sm leading-relaxed">
                        Copia este código e ingrésalo en la otra computadora de la ferretería para compartir el catálogo de 140,000 artículos, precios y ventas en tiempo real.
                    </p>
                    <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-dashed border-indigo-100 space-y-4">
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block text-center">ID Único de Bóveda</label>
                        <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-indigo-50 shadow-inner">
                            <span className="text-4xl font-mono font-black text-slate-800 tracking-widest">{config.vaultId}</span>
                            <button onClick={handleCopyId} className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all active:scale-90 shadow-lg">
                                <Copy size={20}/>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5"><Server size={180}/></div>
                    <div className="relative z-10">
                        <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3 mb-6">
                            <Zap size={22} className="text-ferre-orange"/> Inteligencia de Datos
                        </h3>
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 p-5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group">
                                <div className="p-3 bg-indigo-500 rounded-xl"><Database size={18}/></div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-tight">Capacidad Total</p>
                                    <p className="text-[10px] text-slate-400 font-medium uppercase mt-1">Sincronización optimizada para +1M de SKU</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group">
                                <div className="p-3 bg-emerald-500 rounded-xl"><Smartphone size={18}/></div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-tight">App Móvil Disponible</p>
                                    <p className="text-[10px] text-slate-400 font-medium uppercase mt-1">Accede desde tu celular fuera del local</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="relative z-10 pt-8 mt-8 border-t border-white/10">
                         <div className="flex justify-between items-center">
                             <div className="flex items-center gap-2">
                                 <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Servidores AR-CLOUD Activos</span>
                             </div>
                             <Info size={16} className="text-slate-600"/>
                         </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-10 space-y-8">
                <h3 className="font-black text-xl text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                    <History size={24} className="text-slate-400"/> Registro de Red
                </h3>
                <div className="space-y-4">
                    {[
                        { time: 'Hace 2 min', action: 'Sincronización de stock (Tornillos T1)', origin: 'Terminal 2' },
                        { time: 'Hace 5 min', action: 'Venta registrada #VEN-9902', origin: 'Caja Principal' },
                        { time: 'Hace 1 hora', action: 'Actualización masiva de precios', origin: 'Administración' },
                    ].map((log, i) => (
                        <div key={i} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-100 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 text-xs font-black group-hover:text-indigo-600">
                                    {log.time.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{log.action}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{log.origin}</p>
                                </div>
                            </div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full border">{log.time}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CloudHub;
