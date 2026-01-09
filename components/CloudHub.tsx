
import React, { useState, useRef } from 'react';
import { 
    Cloud, RefreshCw, Key, Download, Upload, Globe, Copy,
    Zap, ShieldCheck, Info, Monitor, Wifi, WifiOff,
    CheckCircle2, ArrowRight, Loader2, CloudDownload, DatabaseZap,
    Share2, FileJson, ClipboardCheck, AlertTriangle, FileUp, ShieldAlert
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
            await syncService.exportVaultFile();
            alert("✅ Archivo de Bóveda generado. Cópialo a un Pendrive o envíalo por red a la otra PC.");
        } catch (e) {
            alert("Error al exportar.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        const success = await syncService.importVaultFile(file);
        setIsProcessing(false);
        
        if (success) {
            alert("✅ ¡Terminal Sincronizada! Los 140,000 artículos han sido cargados correctamente.");
        } else {
            alert("❌ El archivo no es válido o está dañado.");
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="p-8 max-w-7xl mx-auto h-full space-y-8 animate-fade-in bg-slate-50 overflow-y-auto pb-24">
            
            {/* CABECERA DE ESTADO */}
            <div className="bg-white p-10 rounded-[3rem] border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
                <div className="absolute -top-10 -left-10 p-20 opacity-5 text-indigo-600 pointer-events-none">
                    <Globe size={240}/>
                </div>
                <div className="flex items-center gap-8 relative z-10">
                    <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center shadow-inner ${config.enabled ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                        {isProcessing ? <Loader2 size={48} className="animate-spin" /> : <ShieldCheck size={48}/>}
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Nube Bruzzone</h2>
                        <p className="text-slate-400 mt-2 font-black uppercase tracking-widest text-xs">
                             Bóveda de Alta Capacidad (140k artículos)
                        </p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="bg-green-50 px-6 py-3 rounded-2xl border border-green-200 flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs font-black text-green-700 uppercase tracking-widest">RED LOCAL ACTIVA</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* PC MADRE: EXPORTAR */}
                <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5"><DatabaseZap size={200}/></div>
                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                            <div className="p-3 bg-indigo-600 rounded-2xl"><CloudDownload size={24}/></div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter">PC Madre: Generar Paquete</h3>
                        </div>
                        <p className="text-sm text-slate-400 font-bold uppercase leading-relaxed">
                            Si esta es la computadora principal, genera el archivo de sincronización para que las terminales lo hereden.
                        </p>
                        
                        <div className="bg-white/5 border-2 border-dashed border-white/10 p-8 rounded-[2.5rem] text-center space-y-6">
                             <div className="space-y-1">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Identificador de Bóveda</p>
                                <p className="text-4xl font-mono font-black tracking-widest">{config.vaultId}</p>
                             </div>
                             <button 
                                onClick={handleExport}
                                disabled={isProcessing}
                                className="w-full bg-white text-slate-950 py-5 rounded-[1.8rem] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
                                {isProcessing ? <Loader2 className="animate-spin" /> : <FileUp size={24}/>}
                                Exportar Catálogo (.ferre)
                             </button>
                        </div>
                    </div>
                </div>

                {/* TERMINAL: IMPORTAR */}
                <div className="bg-white rounded-[3rem] p-10 border-4 border-indigo-50 shadow-xl flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5"><Monitor size={200}/></div>
                    <div className="relative z-10 space-y-6 h-full flex flex-col">
                        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Upload size={24}/></div>
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Terminal: Sincronizar</h3>
                        </div>
                        <p className="text-sm text-slate-500 font-bold uppercase leading-relaxed">
                            Carga el archivo generado por la PC Madre para clonar toda la ferretería en esta computadora.
                        </p>
                        
                        <div className="flex-1 flex flex-col justify-center items-center py-10 border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/50 space-y-6">
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept=".ferrecloud" 
                                onChange={handleFileChange}
                            />
                            <div className="p-6 bg-white rounded-full shadow-lg text-indigo-600">
                                <FileJson size={48}/>
                            </div>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isProcessing}
                                className="bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3">
                                {isProcessing ? <RefreshCw className="animate-spin" /> : <Download size={20}/>}
                                Seleccionar Archivo de Bóveda
                            </button>
                            <p className="text-[9px] font-black text-slate-400 uppercase">Soporta paquetes de hasta 500MB</p>
                        </div>
                    </div>
                </div>

            </div>

            {/* ADVERTENCIA TÉCNICA */}
            <div className="bg-amber-50 border-2 border-amber-200 p-8 rounded-[3rem] flex items-start gap-6 shadow-sm">
                <div className="p-4 bg-white rounded-2xl text-amber-600 shadow-md">
                    <AlertTriangle size={32}/>
                </div>
                <div>
                    <h4 className="text-lg font-black text-amber-900 uppercase tracking-tighter mb-1">Guía de Sincronización en Red</h4>
                    <p className="text-xs text-amber-800 font-bold leading-relaxed uppercase">
                        1. En la PC Principal, pulsa "Exportar Catálogo". Se descargará un archivo.<br/>
                        2. Pasa ese archivo a la otra computadora (USB, Red Local, Email).<br/>
                        3. En la Terminal, pulsa "Seleccionar Archivo de Bóveda" y elije el archivo recibido.<br/>
                        4. El sistema procesará los 140,000 artículos en menos de 1 minuto.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CloudHub;
