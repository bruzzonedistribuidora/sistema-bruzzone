
import React, { useState } from 'react';
import { Database, Cloud, HardDrive, RotateCcw, Download, CheckCircle, AlertTriangle, RefreshCw, Trash2, AlertOctagon, FileJson, Save } from 'lucide-react';

const Backup: React.FC = () => {
  const [lastBackup, setLastBackup] = useState(localStorage.getItem('ferrecloud_last_backup_date') || 'Nunca');
  const [isBackingUp, setIsBackingUp] = useState(false);
  
  const [backups] = useState([
      { id: 1, date: '26/10/2023 20:00', size: '45 MB', type: 'Automático', location: 'Nube' },
      { id: 2, date: '25/10/2023 19:45', size: '44 MB', type: 'Manual', location: 'Local' },
      { id: 3, date: '24/10/2023 20:00', size: '43 MB', type: 'Automático', location: 'Nube' },
  ]);

  const triggerFileDownload = () => {
      const appData: Record<string, any> = {};
      const keysToExport = [
          'ferrecloud_products',
          'ferrecloud_clients',
          'ferrecloud_sales_history',
          'ferrecloud_providers',
          'ferrecloud_purchases',
          'ferrecloud_employees',
          'ferrecloud_price_templates',
          'company_config',
          'daily_movements',
          'afip_backend_url',
          'afip_sales_point',
          'afip_environment',
          'ferrecloud_roles',
          'ferrecloud_users',
          'ferrecloud_checks',
          'ferrecloud_registers',
          'ferrecloud_treasury_movements',
          'ferrecloud_provider_movements',
          'ferrecloud_movements',
          'ferrecloud_manual_shortages'
      ];

      keysToExport.forEach(key => {
          const value = localStorage.getItem(key);
          if (value) {
              try {
                  appData[key] = JSON.parse(value);
              } catch (e) {
                  appData[key] = value;
              }
          }
      });

      const jsonString = JSON.stringify(appData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().split('T')[0];
      
      link.href = url;
      link.download = `backup_completo_${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  };

  const handleBackup = () => {
      setIsBackingUp(true);
      setTimeout(() => {
          setIsBackingUp(false);
          const now = new Date().toLocaleString();
          setLastBackup(now);
          localStorage.setItem('ferrecloud_last_backup_date', now);
          triggerFileDownload();
          alert('Copia de seguridad preparada y descargada.');
      }, 2500);
  };

  // --- REINICIO TOTAL (ZERO START) ---
  const handleFactoryReset = () => {
      const confirm1 = window.confirm("¡ATENCIÓN! ¿Estás seguro de que deseas BORRAR TODOS LOS DATOS?");
      if (confirm1) {
          const confirm2 = window.confirm("Esta acción es IRREVERSIBLE. El sistema quedará en blanco, sin artículos, clientes ni historial. ¿Confirmar reinicio de fábrica?");
          if (confirm2) {
              // Clear everything except session if you want to stay logged in, 
              // but user said "zero system" so we clear even session.
              localStorage.clear();
              sessionStorage.clear();
              alert("Sistema reseteado a cero. Redirigiendo...");
              window.location.href = '/'; // Hard reload to fresh state
          }
      }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 h-full overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="absolute -top-10 -left-10 p-20 opacity-5 text-blue-600 pointer-events-none">
              <Cloud size={240}/>
          </div>
          <div className="flex items-center gap-8 relative z-10">
              <div className="w-24 h-24 bg-blue-50 rounded-[2rem] flex items-center justify-center text-blue-600 shadow-inner">
                  <Database size={48} />
              </div>
              <div>
                  <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Base de Datos Cloud</h2>
                  <p className="text-gray-500 mt-1 font-medium italic text-lg">Último respaldo local: <span className="font-black text-slate-900 not-italic">{lastBackup}</span></p>
                  <div className="flex items-center gap-2 mt-4 text-green-600 font-black text-xs bg-green-50 w-fit px-3 py-1.5 rounded-full uppercase tracking-widest border border-green-100">
                      <CheckCircle size={14} /> Sistema en la nube sincronizado
                  </div>
              </div>
          </div>
          <button 
            onClick={handleBackup}
            disabled={isBackingUp}
            className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-3xl font-black text-xl flex items-center gap-4 transition-all shadow-2xl shadow-blue-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100">
              {isBackingUp ? (
                  <><RefreshCw className="animate-spin" size={28} /> Procesando...</>
              ) : (
                  <><Cloud size={28} /> Generar Respaldo</>
              )}
          </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8">
              <h3 className="font-black text-lg text-slate-800 mb-6 flex items-center gap-3 uppercase tracking-tighter">
                  <HardDrive size={20} className="text-slate-400"/> Descargas Recientes
              </h3>
              <div className="overflow-hidden rounded-2xl border border-gray-100">
                  <table className="w-full text-left">
                      <thead className="bg-gray-50 text-[10px] text-gray-400 font-black uppercase tracking-widest">
                          <tr>
                              <th className="px-6 py-4">Fecha y Hora</th>
                              <th className="px-6 py-4">Origen</th>
                              <th className="px-6 py-4">Peso</th>
                              <th className="px-6 py-4"></th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-sm">
                          {backups.map(b => (
                              <tr key={b.id} className="hover:bg-blue-50/30 transition-colors">
                                  <td className="px-6 py-4 text-slate-700 font-bold">{b.date}</td>
                                  <td className="px-6 py-4">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${b.type === 'Automático' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                          {b.type}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 text-slate-400 font-mono text-xs">{b.size}</td>
                                  <td className="px-6 py-4 text-right">
                                      <button 
                                        onClick={triggerFileDownload}
                                        className="text-blue-600 hover:bg-blue-100 p-2 rounded-xl transition-all">
                                          <Download size={20}/>
                                      </button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>

          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 flex flex-col">
              <h3 className="font-black text-lg text-slate-800 mb-6 flex items-center gap-3 uppercase tracking-tighter">
                  <RotateCcw size={20} className="text-slate-400"/> Importar Respaldo
              </h3>
              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 mb-8">
                  <div className="flex items-start gap-4">
                      <div className="p-3 bg-white rounded-xl text-orange-500 shadow-sm shrink-0">
                        <AlertTriangle size={24} />
                      </div>
                      <div>
                          <h4 className="font-black text-orange-800 text-base uppercase tracking-tight">Cuidado</h4>
                          <p className="text-sm text-orange-700 mt-1 leading-relaxed">
                            Al importar un respaldo se reemplazará TODA la información actual. Use con precaución.
                          </p>
                      </div>
                  </div>
              </div>
              <div className="space-y-4 mt-auto">
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Archivo de Respaldo (.json)</label>
                   <div className="flex gap-3">
                       <div className="flex-1 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-4 flex items-center justify-center relative group hover:border-blue-400 transition-colors">
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" accept=".json"/>
                            <div className="flex items-center gap-3 text-slate-400 font-bold text-sm group-hover:text-blue-500">
                                <FileJson size={20}/> Seleccionar archivo
                            </div>
                       </div>
                       <button className="bg-slate-900 hover:bg-slate-800 text-white px-8 rounded-2xl font-black text-sm shadow-xl transition-all uppercase tracking-tighter">
                           SUBIR
                       </button>
                   </div>
              </div>
          </div>
      </div>

      <div className="bg-red-50 border-2 border-red-100 rounded-[2rem] p-10 flex flex-col md:flex-row items-center justify-between gap-10 shadow-sm mt-10">
          <div className="flex items-start gap-6">
              <div className="p-5 bg-white rounded-[1.5rem] text-red-600 shadow-lg shadow-red-100">
                  <AlertOctagon size={48} />
              </div>
              <div>
                  <h3 className="text-2xl font-black text-red-800 uppercase tracking-tighter">Borrado Total (Sistema de Cero)</h3>
                  <p className="text-red-700/70 text-sm mt-2 max-w-xl font-medium leading-relaxed">
                      Esta opción eliminará permanentemente todos los datos: los 140.000 artículos, ventas, configuraciones y usuarios. Use este botón para limpiar el sistema antes de iniciar su operación real.
                  </p>
              </div>
          </div>
          <button 
            onClick={handleFactoryReset}
            className="whitespace-nowrap bg-red-600 hover:bg-red-700 text-white px-10 py-5 rounded-[2rem] font-black text-lg flex items-center gap-3 shadow-2xl shadow-red-200 transition-all hover:scale-105 active:scale-95 border border-red-200">
              <Trash2 size={24} /> LIMPIAR SISTEMA
          </button>
      </div>
    </div>
  );
};

export default Backup;
