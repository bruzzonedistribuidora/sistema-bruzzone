
import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileKey, Upload, RefreshCw, CheckCircle, AlertTriangle, XCircle, Key, Server, Lock, Activity, FileBadge, Save, Settings, Globe } from 'lucide-react';

const AfipConfig: React.FC = () => {
  const [environment, setEnvironment] = useState<'TESTING' | 'PRODUCTION'>('TESTING');
  const [salesPoint, setSalesPoint] = useState<number>(1);
  const [cuit, setCuit] = useState<string>('');
  const [backendUrl, setBackendUrl] = useState<string>('http://localhost:3000');
  
  // Certificate State (Visual only, actual files go to backend)
  const [certFile, setCertFile] = useState<string | null>(null);
  
  // Connection State
  const [wsaaStatus, setWsaaStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [wsfeStatus, setWsfeStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [serverStatus, setServerStatus] = useState<'IDLE' | 'ONLINE' | 'OFFLINE'>('IDLE');

  useEffect(() => {
      // Load saved config
      const savedUrl = localStorage.getItem('afip_backend_url');
      const savedCuit = localStorage.getItem('company_cuit');
      if (savedUrl) setBackendUrl(savedUrl);
      if (savedCuit) setCuit(savedCuit);
  }, []);

  const handleSaveConfig = () => {
      localStorage.setItem('afip_backend_url', backendUrl);
      localStorage.setItem('afip_sales_point', salesPoint.toString());
      localStorage.setItem('afip_environment', environment);
      alert('Configuración guardada. El punto de venta y entorno deben coincidir con lo configurado en el Backend (server.js).');
  };

  const testConnection = async () => {
      setServerStatus('IDLE');
      setWsaaStatus('LOADING');
      setWsfeStatus('IDLE');

      try {
          // 1. Test Backend Connection
          const response = await fetch(`${backendUrl}/status`);
          if (!response.ok) throw new Error('Backend offline');
          const data = await response.json();
          setServerStatus('ONLINE');

          // 2. Check AFIP Status (returned by backend)
          if (data.afipConnection) {
              setWsaaStatus('SUCCESS');
              setWsfeStatus('SUCCESS');
          } else {
              setWsaaStatus('ERROR');
              setWsfeStatus('ERROR');
          }

      } catch (error) {
          console.error(error);
          setServerStatus('OFFLINE');
          setWsaaStatus('ERROR');
          setWsfeStatus('ERROR');
      }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-start">
          <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <div className="bg-blue-600 text-white p-2 rounded-lg"><ShieldCheck size={28}/></div>
                  Configuración Facturación Electrónica (ARCA)
              </h2>
              <p className="text-gray-500 mt-1 max-w-2xl">
                  Conexión con el servidor de facturación. Los certificados digitales deben estar instalados en la carpeta del servidor Node.js.
              </p>
          </div>
          <div className="flex flex-col items-end">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-2 ${
                  environment === 'PRODUCTION' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'
              }`}>
                  <Server size={12}/> ENTORNO: {environment === 'PRODUCTION' ? 'PRODUCCIÓN' : 'HOMOLOGACIÓN (TEST)'}
              </span>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Configuration Form */}
          <div className="space-y-6">
              
              {/* 1. Backend Config */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                      <Globe size={18} className="text-ferre-orange"/> Conexión Servidor (Backend)
                  </h3>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">URL del Servidor API</label>
                          <input 
                            type="text" 
                            value={backendUrl}
                            onChange={(e) => setBackendUrl(e.target.value)}
                            placeholder="http://localhost:3000"
                            className="w-full p-2 border border-gray-300 rounded font-mono text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                          <p className="text-[10px] text-gray-400 mt-1">Es la dirección donde se ejecuta el script de Node.js con los certificados.</p>
                      </div>
                  </div>
              </div>

              {/* 2. Fiscal Data */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                      <Settings size={18} className="text-ferre-orange"/> Parámetros Fiscales
                  </h3>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">CUIT Emisor</label>
                          <input 
                            type="text" 
                            value={cuit}
                            onChange={(e) => setCuit(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded font-mono text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Punto de Venta</label>
                              <input 
                                type="number" 
                                value={salesPoint}
                                onChange={(e) => setSalesPoint(parseInt(e.target.value))}
                                className="w-full p-2 border border-gray-300 rounded font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Modo Entorno</label>
                              <select 
                                value={environment}
                                onChange={(e) => setEnvironment(e.target.value as any)}
                                className="w-full p-2 border border-gray-300 rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                              >
                                  <option value="TESTING">Homologación</option>
                                  <option value="PRODUCTION">Producción</option>
                              </select>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                  <h4 className="font-bold text-yellow-800 mb-3 flex items-center gap-2">
                      <AlertTriangle size={18}/> Requisito Técnico
                  </h4>
                  <p className="text-sm text-yellow-700 leading-relaxed">
                      Para que la facturación funcione, debes tener ejecutando el servidor <strong>Node.js</strong> con la librería <code>@afipsdk/afip.js</code> y los archivos <code>.crt</code> y <code>.key</code> ubicados en la carpeta del servidor.
                  </p>
              </div>
          </div>

          {/* Right Column: Connection Status & Test */}
          <div className="space-y-6">
              <div className="bg-slate-900 text-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                      <Activity size={20} className="text-green-400"/> Diagnóstico de Conexión
                  </h3>

                  <div className="space-y-6">
                      {/* Server Step */}
                      <div className="flex items-start gap-4">
                          <div className="mt-1">
                              {serverStatus === 'IDLE' && <div className="w-5 h-5 rounded-full border-2 border-gray-600"></div>}
                              {serverStatus === 'ONLINE' && <CheckCircle size={20} className="text-green-400"/>}
                              {serverStatus === 'OFFLINE' && <XCircle size={20} className="text-red-400"/>}
                          </div>
                          <div className="flex-1">
                              <h4 className="font-bold text-sm">Servidor Backend Local</h4>
                              <p className="text-xs text-gray-400 mt-1">Conexión con {backendUrl}</p>
                              {serverStatus === 'OFFLINE' && <p className="text-xs text-red-400 mt-1">No se detecta el servidor. Asegúrate de ejecutar <code>node server.js</code></p>}
                          </div>
                      </div>

                      <div className="w-px h-8 bg-gray-700 ml-2.5"></div>

                      {/* WSAA Step */}
                      <div className="flex items-start gap-4">
                          <div className="mt-1">
                              {wsaaStatus === 'LOADING' && <RefreshCw size={20} className="text-blue-400 animate-spin"/>}
                              {wsaaStatus === 'SUCCESS' && <CheckCircle size={20} className="text-green-400"/>}
                              {wsaaStatus === 'ERROR' && <XCircle size={20} className="text-red-400"/>}
                              {wsaaStatus === 'IDLE' && <div className="w-5 h-5 rounded-full border-2 border-gray-600"></div>}
                          </div>
                          <div className="flex-1">
                              <h4 className="font-bold text-sm">Autenticación ARCA (WSAA)</h4>
                              <p className="text-xs text-gray-400 mt-1">Validación de certificados y Token.</p>
                          </div>
                      </div>

                      <div className="w-px h-8 bg-gray-700 ml-2.5"></div>

                      {/* WSFE Step */}
                      <div className="flex items-start gap-4">
                          <div className="mt-1">
                              {wsfeStatus === 'LOADING' && <RefreshCw size={20} className="text-blue-400 animate-spin"/>}
                              {wsfeStatus === 'SUCCESS' && <CheckCircle size={20} className="text-green-400"/>}
                              {wsfeStatus === 'ERROR' && <XCircle size={20} className="text-red-400"/>}
                              {wsfeStatus === 'IDLE' && <div className="w-5 h-5 rounded-full border-2 border-gray-600"></div>}
                          </div>
                          <div className="flex-1">
                              <h4 className="font-bold text-sm">Servicio Facturación (WSFE)</h4>
                              <p className="text-xs text-gray-400 mt-1">Estado de servidores de AFIP.</p>
                          </div>
                      </div>
                  </div>

                  <button 
                    onClick={testConnection}
                    disabled={wsaaStatus === 'LOADING'}
                    className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      {wsaaStatus === 'LOADING' ? 'Verificando...' : 'Probar Conexión Completa'}
                  </button>
              </div>
          </div>
      </div>
      
      <div className="flex justify-end pt-4 border-t border-gray-200">
          <button 
            onClick={handleSaveConfig}
            className="bg-ferre-dark hover:bg-slate-800 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg">
              <Save size={18}/> Guardar Configuración
          </button>
      </div>
    </div>
  );
};

export default AfipConfig;
