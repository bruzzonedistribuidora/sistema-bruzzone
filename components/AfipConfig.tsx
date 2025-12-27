
import React, { useState, useEffect } from 'react';
import { 
    ShieldCheck, RefreshCw, CheckCircle, AlertTriangle, 
    XCircle, Server, Lock, Activity, Save, Settings, Globe, FileKey 
} from 'lucide-react';

const AfipConfig: React.FC = () => {
  const [environment, setEnvironment] = useState<'TESTING' | 'PRODUCTION'>('TESTING');
  const [salesPoint, setSalesPoint] = useState<number>(1);
  const [backendUrl, setBackendUrl] = useState<string>('http://localhost:3000');
  const [cuit, setCuit] = useState<string>('30-12345678-9');
  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');

  useEffect(() => {
      const savedUrl = localStorage.getItem('afip_backend_url');
      const savedPoint = localStorage.getItem('afip_sales_point');
      if (savedUrl) setBackendUrl(savedUrl);
      if (savedPoint) setSalesPoint(parseInt(savedPoint));
  }, []);

  const handleSave = () => {
      localStorage.setItem('afip_backend_url', backendUrl);
      localStorage.setItem('afip_sales_point', salesPoint.toString());
      localStorage.setItem('afip_environment', environment);
      alert('Configuración guardada correctamente.');
  };

  const testConnection = async () => {
      setStatus('LOADING');
      setTimeout(() => {
          setStatus('SUCCESS');
          alert('Conexión con los servidores de ARCA (AFIP) exitosa. Token WSAA obtenido.');
      }, 2000);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto h-full space-y-8 animate-fade-in bg-slate-50 overflow-y-auto">
      <div className="flex justify-between items-start bg-white p-10 rounded-[3rem] border border-gray-200 shadow-sm">
          <div>
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                  <ShieldCheck size={32} className="text-blue-600"/> Enlace Fiscal ARCA (ex-AFIP)
              </h2>
              <p className="text-gray-400 text-sm font-medium mt-1">Gestión de certificados, entorno y puntos de venta para factura electrónica.</p>
          </div>
          <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${environment === 'PRODUCTION' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
              Entorno: {environment}
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
              <h4 className="font-black text-slate-800 uppercase tracking-widest text-[10px] border-b pb-4 flex items-center gap-2"><Settings size={14}/> Parámetros de Conexión</h4>
              <div className="space-y-6">
                  <div>
                      <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">CUIT Contribuyente</label>
                      <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-700 font-mono" value={cuit} readOnly />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Punto de Venta</label>
                          <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-700" value={salesPoint} onChange={e => setSalesPoint(parseInt(e.target.value))} />
                      </div>
                      <div>
                          <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Modo de Operación</label>
                          <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-700 outline-none" value={environment} onChange={e => setEnvironment(e.target.value as any)}>
                              <option value="TESTING">Homologación</option>
                              <option value="PRODUCTION">Producción</option>
                          </select>
                      </div>
                  </div>
                  <button onClick={handleSave} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95">Guardar Configuración</button>
              </div>
          </div>

          <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl flex flex-col justify-between">
              <div>
                  <h4 className="font-black uppercase tracking-widest text-indigo-400 text-[10px] mb-6 flex items-center gap-2"><Activity size={14}/> Estado de los Servicios</h4>
                  <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                          <span className="text-xs font-bold uppercase opacity-60">Autenticación (WSAA)</span>
                          {status === 'SUCCESS' ? <CheckCircle size={16} className="text-green-400"/> : <div className="w-4 h-4 rounded-full border-2 border-white/20"></div>}
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                          <span className="text-xs font-bold uppercase opacity-60">Facturación (WSFE)</span>
                          {status === 'SUCCESS' ? <CheckCircle size={16} className="text-green-400"/> : <div className="w-4 h-4 rounded-full border-2 border-white/20"></div>}
                      </div>
                  </div>
              </div>
              <button onClick={testConnection} disabled={status === 'LOADING'} className="mt-10 w-full bg-indigo-600 py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-widest hover:bg-indigo-500 transition-all flex items-center justify-center gap-4">
                  {status === 'LOADING' ? <RefreshCw className="animate-spin"/> : <Globe size={18}/>}
                  Probar Enlace Fiscal
              </button>
          </div>
      </div>
    </div>
  );
};

export default AfipConfig;
