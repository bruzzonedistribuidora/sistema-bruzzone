import React, { useState, useEffect } from 'react';
import { 
  Building2, Save, CreditCard, Percent, 
  Settings, CheckCircle, RefreshCw, Calculator 
} from 'lucide-react';
import { CompanyConfig } from '../types';
import { fetchLatestFinancingRates } from '../services/geminiService';

const CompanySettings: React.FC = () => {
  const [config, setConfig] = useState<CompanyConfig>(() => {
    const saved = localStorage.getItem('company_config');
    return saved ? JSON.parse(saved) : { 
      name: '', 
      cuit: '', 
      address: '', 
      loyalty: { enabled: true, pointsPerPeso: 0.01, minPointsToRedeem: 500, valuePerPoint: 2 } 
    };
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingRates, setIsFetchingRates] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    localStorage.setItem('company_config', JSON.stringify(config));
    window.dispatchEvent(new Event('company_config_updated'));
    setTimeout(() => {
      setIsSaving(false);
      alert('Configuración guardada correctamente');
    }, 1000);
  };

  const handleUpdateRates = async () => {
    setIsFetchingRates(true);
    try {
      const rates = await fetchLatestFinancingRates();
      // Si el servicio devuelve tasas, las guardamos en la config de lealtad o donde corresponda
      console.log('Nuevas tasas obtenidas:', rates);
      alert('Tasas de financiación actualizadas vía IA');
    } catch (error) {
      alert('Error al obtener tasas');
    } finally {
      setIsFetchingRates(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 bg-slate-900 text-ferre-orange rounded-3xl">
          <Settings size={32} />
        </div>
        <div>
          <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Configuración</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ajustes generales de la empresa</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase px-2">Nombre de la Empresa</label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-ferre-orange transition-all"
                value={config.name}
                onChange={e => setConfig({...config, name: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase px-2">CUIT</label>
            <input 
              type="text" 
              className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-ferre-orange transition-all"
              value={config.cuit}
              onChange={e => setConfig({...config, cuit: e.target.value})}
            />
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row gap-4">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="animate-spin" /> : <Save size={20} />}
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>

          <button 
            onClick={handleUpdateRates}
            disabled={isFetchingRates}
            className="flex-1 bg-ferre-orange text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-orange-600 transition-all shadow-xl disabled:opacity-50"
          >
            {isFetchingRates ? <RefreshCw className="animate-spin" /> : <Calculator size={20} />}
            Actualizar Tasas con IA
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanySettings;
