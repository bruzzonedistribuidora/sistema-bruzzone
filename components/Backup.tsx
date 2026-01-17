import React, { useState, useRef } from 'react';
import { 
    Database, Cloud, HardDrive, RotateCcw, Download, CheckCircle, 
    AlertTriangle, RefreshCw, Trash2, AlertOctagon, FileJson, 
    Save, Eraser, Settings2, CheckSquare, Square, 
    Package, Tag, Layers, ShoppingBag, ClipboardList, 
    FileText, Users, Truck, Wallet, Landmark, UploadCloud, FileUp, X,
    History, ArrowLeftRight, Activity, Building2, ShieldCheck, List, Sparkles, Printer, ShoppingCart, Key
} from 'lucide-react';
import { productDB } from '../services/storageService';

const Backup: React.FC = () => {
  const [lastBackup, setLastBackup] = useState(localStorage.getItem('ferrecloud_last_backup_date') || 'Nunca');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const restoreFileRef = useRef<HTMLInputElement>(null);
  
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
      treasury: false,
      dailymovements: false, // Nueva clave para DailyMovements
      users: false,
      roles: false,
      branches: false,
      companyconfig: false,
      afipconfig: false,
      pricelists: false,
      replenishmentorders: false,
      coupons: false,
      campaigns: false,
      printtemplates: false,
      stocktransfers: false,
      salesorders: false
  });

  const backups = [
      { id: 1, date: '26/10/2024 20:00', size: '45 MB', type: 'Automático', location: 'Nube' },
      { id: 2, date: '25/10/2024 19:45', size: '44 MB', type: 'Manual', location: 'Local' },
      { id: 3, date: '24/10/2024 20:00', size: '43 MB', type: 'Automático', location: 'Nube' },
  ];

  const resetOptions = [
      { id: 'products', label: 'Artículos (Maestro)', icon: Package, key: 'ferrecloud_products' }, // IndexedDB handled
      { id: 'brands', label: 'Marcas', icon: Tag, key: 'ferrecloud_brands' },
      { id: 'categories', label: 'Categorías', icon: Layers, key: 'ferrecloud_categories' },
      { id: 'sales', label: 'Ventas (Historial)', icon: ShoppingBag, key: 'ferrecloud_sales_history' },
      { id: 'remitos', label: 'Remitos', icon: ClipboardList, key: 'ferrecloud_remitos' },
      { id: 'budgets', label: 'Presupuestos', icon: FileText, key: 'ferrecloud_budgets' },
      { id: 'clients', label: 'Clientes (Fichero)', icon: Users, key: 'ferrecloud_clients' },
      { id: 'providers', label: 'Proveedores (Fichero)', icon: Truck, key: 'ferrecloud_providers' },
      { id: 'treasury', label: 'Caja y Fondos', icon: Wallet, key: 'ferrecloud_treasury_movements' },
      { id: 'dailymovements', label: 'Gastos Diarios', icon: Activity, key: 'daily_movements' },
      { id: 'users', label: 'Usuarios', icon: Users, key: 'ferrecloud_users' },
      { id: 'roles', label: 'Roles y Permisos', icon: Settings2, key: 'ferrecloud_roles' },
      { id: 'branches', label: 'Sucursales', icon: Building2, key: 'ferrecloud_branches' },
      { id: 'companyconfig', label: 'Config. Empresa', icon: Landmark, key: 'company_config' },
      { id: 'afipconfig', label: 'Config. ARCA/AFIP', icon: ShieldCheck, key: ['afip_backend_url', 'afip_sales_point', 'afip_environment', 'afip_cuit'] }, // Special handling for multiple keys
      { id: 'pricelists', label: 'Listas de Precios', icon: List, key: 'ferrecloud_price_lists' },
      { id: 'replenishmentorders', label: 'Órdenes Reposición', icon: Package, key: 'ferrecloud_replenishment_orders' },
      { id: 'coupons', label: 'Cupones', icon: Tag, key: 'ferrecloud_coupons' },
      { id: 'campaigns', label: 'Campañas Mkt', icon: Sparkles, key: 'ferrecloud_campaigns' },
      { id: 'printtemplates', label: 'Plantillas Impresión', icon: Printer, key: 'ferrecloud_print_templates_v8' },
      { id: 'stocktransfers', label: 'Mov. entre Suc.', icon: ArrowLeftRight, key: 'ferrecloud_stock_transfers' },
      { id: 'salesorders', label: 'Pedidos de Venta', icon: ShoppingCart, key: 'ferrecloud_sales_orders' },
      { id: 'license', label: 'Licencia del Sistema', icon: Key, key: 'ferrecloud_license' }
  ];

  const triggerFileDownload = async () => {
      const appData: Record<string, any> = {};
      
      // Para el backup, incluimos también los productos de IndexedDB
      try {
          appData['ferrecloud_products_db'] = await productDB.getAll();
      } catch (e) {
          console.error("Error al exportar base de datos IndexedDB", e);
      }

      // Recorrer todas las claves a sincronizar
      resetOptions.forEach(option => {
        const keys = Array.isArray(option.key) ? option.key : [option.key];
        keys.forEach(key => {
            const value = localStorage.getItem(key);
            if (value) {
                try { 
                    // Intentar parsear a JSON si es posible, sino guardar como string
                    appData[key] = JSON.parse(value); 
                } catch (e) { 
                    appData[key] = value; 
                }
            }
        });
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
          // Disparar eventos de actualización para que todos los datos se sincronicen a la nube
          resetOptions.forEach(option => {
            const keys = Array.isArray(option.key) ? option.key : [option.key];
            keys.forEach(key => window.dispatchEvent(new Event(`${key}_updated`)));
          });
          window.dispatchEvent(new Event('ferrecloud_products_updated')); // Para IndexedDB
      }, 2000);
  };

  const processRestoreData = async (data: any) => {
    if (typeof data !== 'object') throw new Error("Formato inválido");

    // Restaurar productos en IndexedDB si existen en el backup
    if (data['ferrecloud_products_db']) {
        await productDB.clearAll();
        await productDB.saveBulk(data['ferrecloud_products_db']);
        delete data['ferrecloud_products_db'];
    } else if (data['ferrecloud_products']) {
        // Fallback si los productos venían en el formato viejo de localStorage
        await productDB.clearAll();
        await productDB.saveBulk(data['ferrecloud_products']);
    }

    // Restaurar el resto en localStorage
    Object.entries(data).forEach(([key, value]) => {
        if (typeof value === 'string') {
            localStorage.setItem(key, value);
        } else {
            localStorage.setItem(key, JSON.stringify(value));
        }
        // Disparar evento de actualización para cada clave restaurada
        window.dispatchEvent(new Event(`${key}_updated`));
    });
    window.dispatchEvent(new Event('ferrecloud_products_updated')); // Para IndexedDB

    setTimeout(() => {
        setIsRestoring(false);
        alert("✅ Datos restaurados con éxito. El sistema se reiniciará para aplicar los cambios.");
        window.location.reload();
    }, 1500);
  };

  const handleRestoreFromFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!confirm("¡ATENCIÓN CRÍTICA! La restauración desde archivo reemplazará TODA la información actual del sistema. ¿Deseas continuar?")) {
          e.target.value = '';
          return;
      }

      setIsRestoring(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
          try {
              const data = JSON.parse(event.target?.result as string);
              await processRestoreData(data);
          } catch (err) {
              setIsRestoring(false);
              alert("❌ Error al restaurar: El archivo no tiene un formato de respaldo (.json) válido.");
          }
      };
      reader.readAsText(file);
  };

  const handleRestoreFromHistory = (date: string) => {
    if (!confirm(`¿Deseas restaurar la base de datos a su estado del día ${date}? Se perderán los cambios realizados después de esa fecha.`)) return;
    
    setIsRestoring(true);
    setTimeout(() => {
        alert("Simulando descarga de respaldo desde la nube...");
        setIsRestoring(false);
        alert("Restauración simulada completada. En un entorno productivo los datos se habrían sobrescrito.");
        window.location.reload(); // Recargar para aplicar los cambios simulados
    }, 2000);
  };

  const toggleResetOption = (id: string) => {
      setSelectedToReset(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelectiveReset = async () => {
      const selectedIds = Object.entries(selectedToReset)
          .filter(([_, active]) => active)
          .map(([id]) => id);

      if (selectedIds.length === 0) {
          alert("Debe seleccionar al menos una categoría para borrar.");
          return;
      }

      const confirmMsg = `¿ESTÁ SEGURO? Se borrarán todos los datos de: ${selectedIds.map(k => k.toUpperCase()).join(', ')}. Esta acción no se puede deshacer.`;
      
      if (window.confirm(confirmMsg)) {
          if (window.confirm("ÚLTIMA ADVERTENCIA: Los datos seleccionados serán eliminados permanentemente. ¿Proceder?")) {
              setIsRestoring(true); // Usamos el estado de carga para bloquear UI
              
              for (const id of selectedIds) {
                  const option = resetOptions.find(o => o.id === id);
                  if (option) {
                      const keysToDelete = Array.isArray(option.key) ? option.key : [option.key];
                      for (const key of keysToDelete) {
                          // Caso especial: Artículos (IndexedDB)
                          if (id === 'products' && key === 'ferrecloud_products') {
                              await productDB.clearAll();
                          }
                          
                          // Limpiar localStorage para la opción seleccionada
                          localStorage.removeItem(key);
                          // Disparar evento de actualización con payload null para indicar borrado
                          window.dispatchEvent(new Event(`${key}_updated`));
                      }
                  }
              }
              
              alert("Limpieza selectiva completada. El sistema se reiniciará.");
              window.location.reload();
          }
      }
  };

  const handleFactoryReset = async () => {
      if (window.confirm("¡ATENCIÓN CRÍTICA! ¿Deseas borrar TODO el sistema, incluyendo usuarios y configuraciones?")) {
          if (window.confirm("Esta acción es IRREVERSIBLE. ¿Confirmar reinicio de fábrica absoluto?")) {
              await productDB.clearAll();
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
                  <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase leading-none">Gestión de Copias</h2>
                  <p className="text-gray-500 mt-2 font-medium italic text-lg">Último respaldo: <span className="font-black text-slate-900 not-italic">{lastBackup}</span></p>
                  <div className="flex items-center gap-2 mt-4 text-green-600 font-black text-xs bg-green-50 w-fit px-3 py-1.5 rounded-full uppercase tracking-widest border border-green-100">
                      <CheckCircle size={14} /> Nube Sincronizada
                  </div>
              </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 relative z-10">
              <button 
                onClick={handleBackup}
                disabled={isBackingUp || isRestoring}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-200 active:scale-95 disabled:opacity-50">
                {isBackingUp ? (
                    <><RefreshCw className="animate-spin" size={20} /> Procesando...</>
                ) : (
                    <><Cloud size={20} /> Generar Backup</>
                )}
              </button>
              <button 
                onClick={() => restoreFileRef.current?.click()}
                disabled={isBackingUp || isRestoring}
                className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 disabled:opacity-50">
                {isRestoring ? (
                    <><RefreshCw className="animate-spin" size={20} /> Restaurando...</>
                ) : (
                    <><RotateCcw size={20} /> Restaurar Datos</>
                )}
              </button>
              <input type="file" ref={restoreFileRef} className="hidden" accept=".json" onChange={handleRestoreFromFile} />
          </div>
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
                              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Borrar categoría</p>
                          </div>
                          {selectedToReset[opt.id] ? <CheckSquare className="text-indigo-600" size={18}/> : <Square className="text-slate-200" size={18}/>}
                      </button>
                  ))}
              </div>

              <div className="mt-auto pt-6 border-t border-slate-100">
                  <div className="bg-amber-50 p-4 rounded-2xl mb-4 flex items-start gap-3 border border-amber-100">
                      <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-amber-700 font-bold leading-relaxed uppercase">
                          Cuidado: Los datos seleccionados se borrarán de forma permanente tanto local como en la nube.
                      </p>
                  </div>
                  <button 
                    onClick={handleSelectiveReset}
                    disabled={isRestoring}
                    className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
                    <Trash2 size={18}/> {isRestoring ? 'Procesando...' : 'Borrar Datos Seleccionados'}
                  </button>
              </div>
          </div>

          {/* COLUMNA DERECHA: RESTAURACIÓN Y DESCARGAS */}
          <div className="space-y-8">
              {/* SECCIÓN: RESTAURAR MANUAL */}
              <div className="bg-indigo-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                      <UploadCloud size={140}/>
                  </div>
                  <div className="relative z-10 space-y-6">
                      <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                          <RotateCcw size={22} className="text-indigo-300"/> Restauración Manual
                      </h3>
                      <p className="text-indigo-200 text-sm font-medium leading-relaxed">
                          Si tienes un respaldo anterior descargado en formato .json, puedes subirlo aquí para recuperar toda tu información al instante.
                      </p>
                      <button 
                        onClick={() => restoreFileRef.current?.click()}
                        disabled={isRestoring}
                        className="bg-white text-indigo-900 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-3 active:scale-95">
                        {isRestoring ? <RefreshCw className="animate-spin" size={18}/> : <FileUp size={18}/>}
                        Seleccionar Archivo JSON
                      </button>
                  </div>
              </div>

              <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8">
                  <h3 className="font-black text-lg text-slate-800 mb-6 flex items-center gap-3 uppercase tracking-tighter">
                      <History size={20} className="text-indigo-600"/> Historial de Respaldos (Locales)
                  </h3>
                  <div className="overflow-hidden rounded-2xl border border-gray-100">
                      <table className="w-full text-left">
                          <thead className="bg-gray-50 text-[10px] text-gray-400 font-black uppercase tracking-widest">
                              <tr>
                                  <th className="px-6 py-4">Fecha / Hora</th>
                                  <th className="px-6 py-4">Origen</th>
                                  <th className="px-6 py-4 text-right">Acciones</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-sm">
                              {backups.map(b => (
                                  <tr key={b.id} className="hover:bg-indigo-50/30 transition-colors group">
                                      <td className="px-6 py-4 text-slate-700 font-bold text-xs">{b.date}</td>
                                      <td className="px-6 py-4">
                                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${b.type === 'Automático' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}`}>
                                              {b.type}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                          <div className="flex justify-end gap-2">
                                              <button 
                                                onClick={() => handleRestoreFromHistory(b.date)}
                                                className="text-indigo-600 hover:bg-indigo-100 p-2 rounded-xl transition-all"
                                                title="Restaurar este respaldo">
                                                  <RotateCcw size={16}/>
                                              </button>
                                              <button 
                                                onClick={triggerFileDownload}
                                                className="text-slate-400 hover:bg-slate-100 p-2 rounded-xl transition-all"
                                                title="Descargar JSON">
                                                  <Download size={16}/>
                                              </button>
                                          </div>
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
                          <h3 className="text-xl font-black text-red-800 uppercase tracking-tighter">Acción de Emergencia</h3>
                          <p className="text-red-700/70 text-xs mt-2 font-medium leading-relaxed">
                              El borrado total eliminará artículos, clientes, ventas y configuraciones fiscales. Use con precaución.
                          </p>
                      </div>
                  </div>
                  <button 
                    onClick={handleFactoryReset}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-3">
                      <Trash2 size={18} /> VACIAR TODO EL SISTEMA
                  </button>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Backup;
