import React, { useState } from 'react';
import { Database, Cloud, HardDrive, RotateCcw, Download, CheckCircle, AlertTriangle, RefreshCw, Trash2, AlertOctagon } from 'lucide-react';

const Backup: React.FC = () => {
  const [lastBackup, setLastBackup] = useState('26/10/2023 20:00');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backups] = useState([
      { id: 1, date: '26/10/2023 20:00', size: '45 MB', type: 'Automático', location: 'Nube' },
      { id: 2, date: '25/10/2023 19:45', size: '44 MB', type: 'Manual', location: 'Local' },
      { id: 3, date: '24/10/2023 20:00', size: '43 MB', type: 'Automático', location: 'Nube' },
  ]);

  const handleBackup = () => {
      setIsBackingUp(true);
      setTimeout(() => {
          setIsBackingUp(false);
          setLastBackup(new Date().toLocaleString());
          alert('Copia de seguridad realizada con éxito.');
      }, 3000);
  };

  const handleFactoryReset = () => {
      const confirm1 = window.confirm("¡ATENCIÓN! ¿Estás seguro de que deseas BORRAR TODOS LOS DATOS?");
      if (confirm1) {
          const confirm2 = window.confirm("Esta acción es IRREVERSIBLE. Se eliminarán clientes, productos, ventas y configuraciones. ¿Confirmar reinicio de fábrica?");
          if (confirm2) {
              alert("El sistema se está reiniciando y borrando datos...");
              window.location.reload(); // Simulates a reset
          }
      }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 h-full overflow-y-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                  <Database size={40} />
              </div>
              <div>
                  <h2 className="text-2xl font-bold text-gray-800">Estado del Sistema</h2>
                  <p className="text-gray-500 mt-1">Última copia exitosa: <span className="font-bold text-gray-700">{lastBackup}</span></p>
                  <div className="flex items-center gap-2 mt-2 text-green-600 font-medium text-sm bg-green-50 w-fit px-2 py-1 rounded">
                      <CheckCircle size={14} /> Sistema sincronizado con la nube
                  </div>
              </div>
          </div>
          <button 
            onClick={handleBackup}
            disabled={isBackingUp}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-3 transition-colors shadow-lg shadow-blue-900/20">
              {isBackingUp ? (
                  <><RefreshCw className="animate-spin" /> Generando...</>
              ) : (
                  <><Cloud size={24} /> Generar Copia Ahora</>
              )}
          </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <HardDrive size={20} className="text-gray-400"/> Historial de Copias
              </h3>
              <div className="overflow-hidden rounded-lg border border-gray-100">
                  <table className="w-full text-left">
                      <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                          <tr>
                              <th className="px-4 py-3">Fecha</th>
                              <th className="px-4 py-3">Tipo</th>
                              <th className="px-4 py-3">Tamaño</th>
                              <th className="px-4 py-3"></th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-sm">
                          {backups.map(b => (
                              <tr key={b.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-gray-700 font-medium">{b.date}</td>
                                  <td className="px-4 py-3">
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${b.type === 'Automático' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                          {b.type}
                                      </span>
                                  </td>
                                  <td className="px-4 py-3 text-gray-500">{b.size}</td>
                                  <td className="px-4 py-3 text-right">
                                      <button className="text-blue-600 hover:underline text-xs font-bold">Descargar</button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <RotateCcw size={20} className="text-gray-400"/> Restauración
              </h3>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                      <AlertTriangle className="text-blue-500 shrink-0" size={20} />
                      <div>
                          <h4 className="font-bold text-blue-800 text-sm">Recuperación de Datos</h4>
                          <p className="text-xs text-blue-600 mt-1">Restaurar una copia reemplazará todos los datos actuales por los de la copia seleccionada.</p>
                      </div>
                  </div>
              </div>
              <div className="space-y-3">
                   <label className="block text-sm font-bold text-gray-700">Seleccionar archivo de respaldo</label>
                   <div className="flex gap-2">
                       <input type="file" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                       <button className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-sm">
                           Restaurar
                       </button>
                   </div>
              </div>
          </div>
      </div>

      {/* DANGER ZONE - FACTORY RESET */}
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 rounded-full text-red-600">
                  <AlertOctagon size={32} />
              </div>
              <div>
                  <h3 className="text-xl font-bold text-red-800">Borrar Datos / Reinicio de Fábrica</h3>
                  <p className="text-red-700 text-sm mt-1 max-w-xl">
                      Esta acción eliminará permanentemente todos los clientes, productos, ventas, configuraciones y usuarios del sistema. 
                      Utilice esta opción solo si desea comenzar desde cero.
                  </p>
              </div>
          </div>
          <button 
            onClick={handleFactoryReset}
            className="whitespace-nowrap bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-red-900/20 border border-red-800">
              <Trash2 size={20} /> BORRAR TODO
          </button>
      </div>
    </div>
  );
};

export default Backup;