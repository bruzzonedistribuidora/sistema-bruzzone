
import React, { useState, useEffect } from 'react';
import { 
    Cloud, RefreshCw, Database, Key, Download, Upload, Globe, Server, Copy
} from 'lucide-react';
import { CloudConfig, CloudSyncStatus } from '../types';
import { productDB } from '../services/storageService';

const CloudHub: React.FC = () => {
    const [config, setConfig] = useState<CloudConfig>(() => {
        const saved = localStorage.getItem('ferrecloud_sync_config');
        return saved ? JSON.parse(saved) : {
            enabled: false,
            vaultId: `BRUZZONE-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            lastSync: 'Nunca',
            autoSync: true,
            apiUrl: ''
        };
    });

    const [status, setStatus] = useState<CloudSyncStatus>('OFFLINE');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        localStorage.setItem('ferrecloud_sync_config', JSON.stringify(config));
        setStatus(config.enabled ? 'ONLINE' : 'OFFLINE');
    }, [config]);

    const exportFullDatabase = async () => {
        setIsProcessing(true);
        try {
            const products = await productDB.getAll();
            const fullData = {
                products,
                timestamp: new Date().toISOString(),
                vaultId: config.vaultId
            };
            const blob = new Blob([JSON.stringify(fullData)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `SYNC_BRUZZONE_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            setConfig(prev => ({ ...prev, lastSync: new Date().toLocaleString(), enabled: true }));
        } finally {
            setIsProcessing(false);
        }
    };

    const importFullDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                setIsProcessing(true);
                const data = JSON.parse(event.target?.result as string);
                if (data.products) {
                    await productDB.clearAll();
                    await productDB.saveBulk(data.products);
                    alert("Sincronización completa aplicada.");
                    window.location.reload();
                }
            } finally {
                setIsProcessing(false);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="p-8 max-w-6xl mx-auto h-full space-y-8 animate-fade-in bg-slate-50 overflow-y-auto pb-20">
            <div className="bg-white p-10 rounded-[3rem] border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
                <div className="flex items-center gap-8 relative z-10">
                    <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center transition-all shadow-inner ${status === 'ONLINE' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                        {isProcessing ? <RefreshCw size={48} className="animate-spin"/> : <Cloud size={48} />}
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Nube Bruzzone</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-3 italic">Última sincronización: {config.lastSync}</p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 relative z-10">
                    <label className="bg-slate-900 text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 cursor-pointer">
                        <Upload size={20}/> Cargar Paquete
                        <input type="file" className="hidden" accept=".json" onChange={importFullDatabase} />
                    </label>
                    <button onClick={exportFullDatabase} className="bg-indigo-600 text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl">
                        <Download size={20}/> Generar Backup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CloudHub;
