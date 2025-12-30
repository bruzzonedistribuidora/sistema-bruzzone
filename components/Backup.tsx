
import React, { useState, useMemo } from 'react';
import { 
    Database, Cloud, HardDrive, RotateCcw, Download, CheckCircle, 
    AlertTriangle, RefreshCw, Trash2, AlertOctagon, FileJson, 
    Save, Eraser, Settings2, CheckSquare, Square, 
    Package, Tag, Layers, ShoppingBag, ClipboardList, 
    FileText, Users, Truck, Wallet, Landmark
} from 'lucide-react';

const Backup: React.FC = () => {
  const [lastBackup, setLastBackup] = useState(localStorage.getItem('ferrecloud_last_backup_date') || 'Nunca');
  const [isBackingUp, setIsBackingUp] = useState(false);
  
  // Estado para limpieza selectiva
  const [selectedToReset, setSelectedToReset] = useState<Record<string, boolean>>({
      products: false,
      brands: false,
      categories: false,
      sales: false,
      remitos: false,
      budgets: false,
      clients: false,
      providers: false,
      treasury: false
  });

  const backups = [
      { id: 1, date: '26/10/2023 20:00', size: '45 MB', type: 'Automático', location: 'Nube' },
      { id: 2, date: '25/10/2023 19:45', size: '44 MB', type: 'Manual', location: 'Local' },
      { id: 3, date: '24/10/2023 20:00', size: '43 MB', type: 'Automático', location: 'Nube' },
  ];

  const resetOptions = [
      { id: 'products', label: 'Artículos', icon: Package, key: 'ferrecloud_products' },
      { id: 'brands', label: 'Marcas', icon: Tag, key: 'ferrecloud_brands' },
      { id: 'categories', label: 'Categorías', icon: Layers, key: 'ferrecloud_categories' },
      { id: 'sales', label: 'Ventas', icon: ShoppingBag, key: 'ferrecloud_sales_history' },
      { id: 'remitos', label: 'Remitos', icon: ClipboardList, key: 'ferrecloud_remitos' },
      { id: 'budgets', label: 'Presupuestos', icon: FileText, key: 'ferrecloud_budgets' },
      { id: 'clients', label: 'Clientes', icon: Users, key: 'ferrecloud_clients' },
      { id: 'providers', label: 'Proveedores', icon: Truck, key: 'ferrecloud_providers' },
      { id: 'treasury', label: 'Caja y Fondos', icon: Wallet, key: 'ferrecloud_treasury_movements' },
  ];

  const triggerFileDownload = () => {
      const appData: Record<string, any> = {};
      const keysToExport = [
          'ferrecloud_products', 'ferrecloud_clients', 'ferrecloud_sales_history',
          'ferrecloud_providers', 'ferrecloud_purchases', 'ferrecloud_employees',
          'ferrecloud_price_templates', 'company_config', 'daily_movements',
          'afip_backend_url', 'afip_sales_point', 'afip_environment',
          'ferrecloud_roles', 'ferrecloud_users', 'ferrecloud_checks',
          'ferrecloud_registers', 'ferrecloud_treasury_movements',
          'ferrecloud_provider_movements', 'ferrecloud_movements',
          'ferrecloud_manual_shortages', 'ferrecloud_remitos',
          'ferrecloud_budgets', 'ferrecloud_sales_orders'
      ];

      keysToExport.forEach(key => {
          const value = localStorage.getItem(key);
          if (value) {
              try { appData[key] = JSON.parse(value); } catch (e) { appData[key] = value; }
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
      }, 2000);
  };

  const toggleResetOption = (id: string) => {
      setSelectedToReset(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelectiveReset = () => {
      const selectedKeys = Object.entries(selectedToReset)
          .filter(([_, active]) => active)
          .map(([id]) => id);

      if (selectedKeys.length === 0) {
          alert("Debe seleccionar al menos una categoría para borrar.");
          return;
      }

      const confirmMsg = `¿ESTÁ SEGURO? Se borrarán todos los datos de: ${selectedKeys.map(k => k.toUpperCase()).join(', ')}. Esta acción no se puede deshacer.`;
      
      if (window.confirm(confirmMsg)) {
          if (window.confirm("ÚLTIMA ADVERTENCIA: Los datos seleccionados serán eliminados permanentemente. ¿Proceder?")) {
              selectedKeys.forEach(id => {
                  const option = resetOptions.find(o => o.id === id);
                  if (option) {
                      localStorage.removeItem(option.key);
                      // Casos especiales (llaves relacionadas)
                      if (id === 'treasury') {
                          localStorage.removeItem('ferrecloud_registers');
                          localStorage.removeItem('ferrecloud_checks');
                          localStorage.removeItem('daily_movements');
                      }
                      if (id === 'clients') {
                          localStorage.removeItem('ferrecloud_movements');
                      }
                      if (id === 'providers') {
                          localStorage.removeItem('ferrecloud_purchases');
                          localStorage.removeItem('ferrecloud_provider_movements');
                      }
                  }
              });
              
              alert("Limpieza selectiva completada. El sistema se reiniciará.");
              window.location.reload();
          }
      }
  };

  const handleFactoryReset = () => {
      if (window.confirm("¡ATENCIÓN CRÍTICA! ¿Deseas borrar TODO el sistema, incluyendo usuarios y configuraciones?")) {
          if (window.confirm("Esta acción es IRREVERSIBLE. ¿Confirmar reinicio de fábrica absoluto?")) {
              localStorage.clear();
              sessionStorage.clear();
              alert("Sistema reseteado a cero. Redirigiendo...");
              window.location.href = '/'; 
          }
      }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 h-full overflow-y-auto animate-fade-in pb-20">
      {/* CABECERA RESUMEN */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="absolute -top-10 -left-10 p-20 opacity-5 text-indigo-600 pointer-events-none">
              <Cloud size={240}/>
          </div>
          <div className="flex items-center gap-8 relative z-10">
              <div className="w-24 h-24 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-indigo-600 shadow-inner">
                  <Database size={48} />
              </div>
              <div>
                  <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase leading-none">Mantenimiento de Datos</h2>
                  <p className="text-gray-500 mt-2 font-medium italic text-lg">Último respaldo local: <span className="font-black text-slate-900 not-italic">{lastBackup}</span></p>
                  <div className="flex items-center gap-2 mt-4 text-green-600 font-black text-xs bg-green-50 w-fit px-3 py-1.5 rounded-full uppercase tracking-widest border border-green-100">
                      <CheckCircle size={14} /> Sistema Sincronizado en la Nube
                  </div>
              </div>
          </div>
          <button 
            onClick={handleBackup}
            disabled={isBackingUp}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-3xl font-black text-xl flex items-center gap-4 transition-all shadow-2xl shadow-indigo-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100">
              {isBackingUp ? (
                  <><RefreshCw className="animate-spin" size={28} /> Procesando...</>
              ) : (
                  <><Cloud size={28} /> Generar Respaldo</>
              )}
          </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* SECCIÓN: LIMPIEZA SELECTIVA */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 flex flex-col h-full">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black text-lg text-slate-800 flex items-center gap-3 uppercase tracking-tighter">
                      <Eraser size={22} className="text-indigo-600"/> Limpieza Selectiva
                  </h3>
                  <button 
                    onClick={() => {
                        const allTrue = Object.values(selectedToReset).every(v => v);
                        const next = {} as any;
                        resetOptions.forEach(o => next[o.id] = !allTrue);
                        setSelectedToReset(next);
                    }}
                    className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                    {Object.values(selectedToReset).every(v => v) ? 'Desmarcar Todos' : 'Marcar Todos'}
                  </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                  {resetOptions.map(opt => (
                      <button 
                        key={opt.id}
                        onClick={() => toggleResetOption(opt.id)}
                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${selectedToReset[opt.id] ? 'border-indigo-600 bg-indigo-50 shadow-sm' : 'border-slate-50 hover:border-slate-200 bg-white'}`}>
                          <div className={`p-2.5 rounded-xl ${selectedToReset[opt.id] ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                              <opt.icon size={18}/>
                          </div>
                          <div className="flex-1">
                              <p className={`text-xs font-black uppercase tracking-tight ${selectedToReset[opt.id] ? 'text-indigo-900' : 'text-slate-600'}`}>{opt.label}</p>
                              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Resetear a cero</p>
                          </div>
                          {selectedToReset[opt.id] ? <CheckSquare className="text-indigo-600" size={18}/> : <Square className="text-slate-200" size={18}/>}
                      </button>
                  ))}
              </div>

              <div className="mt-auto pt-6 border-t border-slate-100">
                  <div className="bg-amber-50 p-4 rounded-2xl mb-4 flex items-start gap-3 border border-amber-100">
                      <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-amber-700 font-bold leading-relaxed uppercase">
                          Atención: Los datos de las categorías seleccionadas serán eliminados de la base de datos local y de la nube permanentemente.
                      </p>
                  </div>
                  <button 
                    onClick={handleSelectiveReset}
                    className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-95">
                    <Trash2 size={18}/> Borrar Datos Seleccionados
                  </button>
              </div>
          </div>

          {/* COLUMNA DERECHA: IMPORTACIÓN Y DESCARGAS */}
          <div className="space-y-8">
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
                                  <th className="px-6 py-4 text-right">Acción</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-sm">
                              {backups.map(b => (
                                  <tr key={b.id} className="hover:bg-indigo-50/30 transition-colors">
                                      <td className="px-6 py-4 text-slate-700 font-bold text-xs">{b.date}</td>
                                      <td className="px-6 py-4">
                                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${b.type === 'Automático' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}`}>
                                              {b.type}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                          <button 
                                            onClick={triggerFileDownload}
                                            className="text-indigo-600 hover:bg-indigo-100 p-2 rounded-xl transition-all">
                                              <Download size={16}/>
                                          </button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>

              <div className="bg-red-50 border-2 border-red-100 rounded-[2rem] p-8 flex flex-col justify-between shadow-sm">
                  <div className="flex items-start gap-6 mb-6">
                      <div className="p-4 bg-white rounded-2xl text-red-600 shadow-md">
                          <AlertOctagon size={32} />
                      </div>
                      <div>
                          <h3 className="text-xl font-black text-red-800 uppercase tracking-tighter">Reset de Fábrica</h3>
                          <p className="text-red-700/70 text-xs mt-2 font-medium leading-relaxed">
                              Elimina **TODOS** los datos del sistema, incluyendo usuarios, certificados AFIP, configuraciones de empresa y traslados.
                          </p>
                      </div>
                  </div>
                  <button 
                    onClick={handleFactoryReset}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-3">
                      <Trash2 size={18} /> BORRADO TOTAL SISTEMA
                  </button>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Backup;
