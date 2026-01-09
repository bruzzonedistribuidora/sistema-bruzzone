
import React, { useState, useRef } from 'react';
import { 
    Cloud, RefreshCw, Globe, ShieldCheck, Monitor, 
    Wifi, WifiOff, Loader2, CloudDownload, DatabaseZap,
    FileUp, FileJson, AlertTriangle, ArrowRight, Save,
    Download, ShieldAlert, CheckCircle2
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

    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = async () => {
        setIsProcessing(true);
        try {
            await syncService.exportFullVault();
        } catch (e) {
            alert("Error al exportar la base de datos.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        const success = await syncService.importVaultFile(file);
        setIsProcessing(false);
        
        if (success) {
            alert("✅ ¡Sincronización Exitosa! Esta computadora ahora tiene los mismos 140,000 artículos que la PC Madre.");
            if (!config.enabled) {
                const newConfig = { ...config, enabled: true };
                localStorage.setItem('ferrecloud_sync_config', JSON.stringify(newConfig));
                setConfig(newConfig);
            }
        } else {
            alert("❌ El archivo seleccionado no es un paquete de bóveda válido.");
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="p-8 max-w-7xl mx-auto h-full space-y-10 animate-fade-in bg-slate-50 overflow-y-auto pb-32">
            
            {/* CABECERA DE CONEXIÓN */}
            <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-200 shadow-xl flex flex-col md:flex-row justify-between items-center gap-10 relative overflow-hidden">
                <div className="absolute -top-10 -left-10 p-20 opacity-5 text-indigo-600 pointer-events-none">
                    <Globe size={280}/>
                </div>
                <div className="flex items-center gap-10 relative z-10">
                    <div className={`w-28 h-28 rounded-[2.5rem] flex items-center justify-center shadow-inner border-4 ${config.enabled ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                        {isProcessing ? <Loader2 size={56} className="animate-spin text-indigo-600" /> : (config.enabled ? <Wifi size={56}/> : <WifiOff size={56}/>)}
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-slate-950 uppercase tracking-tighter leading-none">Nube Bruzzone</h2>
                        <div className="flex items-center gap-4 mt-3">
                             <span className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border-2 ${config.enabled ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                {config.enabled ? 'Sincronización Activa' : 'Sin Vínculo de Red'}
                            </span>
                            <p className="text-slate-500 font-black uppercase tracking-widest text-[11px]">ID Bóveda: <span className="text-indigo-600 font-mono text-base">{config.vaultId}</span></p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-slate-900 text-white px-8 py-4 rounded-[1.8rem] flex items-center gap-4 shadow-2xl">
                         <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                         <span className="text-[11px] font-black uppercase tracking-widest">Servidor Local Listo</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                
                {/* PC MADRE: ENVIAR DATOS */}
                <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white shadow-2xl flex flex-col relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><DatabaseZap size={240}/></div>
                    <div className="relative z-10 space-y-8">
                        <div className="flex items-center gap-6 border-b border-white/10 pb-8">
                            <div className="p-4 bg-indigo-600 rounded-3xl shadow-xl"><CloudDownload size={32}/></div>
                            <h3 className="text-3xl font-black uppercase tracking-tighter">PC Madre: Exportar</h3>
                        </div>
                        <p className="text-lg text-slate-400 font-medium leading-relaxed">
                            Usa esta opción si esta es la computadora principal que tiene cargados los <strong className="text-white">140,000 artículos</strong>. Generarás un archivo para actualizar las otras PCs.
                        </p>
                        
                        <div className="pt-4">
                             <button 
                                onClick={handleExport}
                                disabled={isProcessing}
                                className="w-full bg-white text-slate-950 py-7 rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] shadow-2xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50">
                                {isProcessing ? <Loader2 className="animate-spin" /> : <Save size={28}/>}
                                Descargar Paquete Maestro
                             </button>
                        </div>
                    </div>
                </div>

                {/* TERMINAL: RECIBIR DATOS */}
                <div className="bg-white rounded-[3.5rem] p-12 border-4 border-indigo-100 shadow-2xl flex flex-col relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><Monitor size={240}/></div>
                    <div className="relative z-10 space-y-8 h-full flex flex-col">
                        <div className="flex items-center gap-6 border-b border-slate-100 pb-8">
                            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl shadow-xl"><FileUp size={32}/></div>
                            <h3 className="text-3xl font-black text-slate-950 uppercase tracking-tighter">Terminal: Importar</h3>
                        </div>
                        <p className="text-lg text-slate-500 font-medium leading-relaxed">
                            Usa esta opción en las computadoras de ventas. Carga el archivo generado por la <strong className="text-slate-950">PC Madre</strong> para clonar toda la ferretería aquí.
                        </p>
                        
                        <div className="flex-1 flex flex-col justify-center items-center py-12 border-4 border-dashed border-slate-100 rounded-[3rem] bg-slate-50/50 space-y-8">
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept=".ferrecloud" 
                                onChange={handleImport}
                            />
                            <div className="p-8 bg-white rounded-full shadow-2xl text-indigo-600 ring-8 ring-indigo-50">
                                <FileJson size={64}/>
                            </div>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isProcessing}
                                className="bg-indigo-600 text-white px-12 py-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-4">
                                {isProcessing ? <RefreshCw className="animate-spin" /> : <Download size={24}/>}
                                Seleccionar Archivo Recibido
                            </button>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic">Archivo con extensión .ferrecloud</p>
                        </div>
                    </div>
                </div>

            </div>

            {/* GUIA TECNICA */}
            <div className="bg-amber-50 border-2 border-amber-200 p-10 rounded-[3.5rem] flex items-start gap-8 shadow-md">
                <div className="p-5 bg-white rounded-3xl text-amber-600 shadow-xl">
                    <AlertTriangle size={48}/>
                </div>
                <div className="space-y-4">
                    <h4 className="text-2xl font-black text-amber-950 uppercase tracking-tighter">Protocolo de Red Bruzzone</h4>
                    <p className="text-base text-amber-900 font-bold leading-relaxed uppercase">
                        1. Genera el archivo en la PC Principal mediante "Exportar".<br/>
                        2. Pasa el archivo a las otras PCs mediante un Pendrive, Google Drive o Red Local.<br/>
                        3. En cada terminal, usa "Importar" para cargar los 140,000 artículos.<br/>
                        4. Una vez hecho, las terminales estarán vinculadas por ID y se actualizarán automáticamente.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CloudHub;
