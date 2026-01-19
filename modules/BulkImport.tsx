
import React, { useState } from 'react';
import { 
  FileUp, Download, CheckCircle2, AlertCircle, 
  ChevronRight, ArrowLeft, Boxes, Users, 
  Truck, Tag, Layers, FileSpreadsheet,
  Settings, Search, Loader2, Info
} from 'lucide-react';

type EntityType = 'products' | 'clients' | 'suppliers' | 'brands' | 'categories';

interface MappingField {
  key: string;
  label: string;
  required: boolean;
}

const BulkImport: React.FC = () => {
  const [step, setStep] = useState(1);
  const [selectedEntity, setSelectedEntity] = useState<EntityType | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const entities = [
    { id: 'products', label: 'Artículos', icon: Boxes, color: 'text-blue-600', bg: 'bg-blue-100', desc: 'Precios, stock y códigos' },
    { id: 'clients', label: 'Clientes', icon: Users, color: 'text-green-600', bg: 'bg-green-100', desc: 'CUIT, contactos y saldos' },
    { id: 'suppliers', label: 'Proveedores', icon: Truck, color: 'text-orange-600', bg: 'bg-orange-100', desc: 'Datos fiscales y descuentos' },
    { id: 'brands', label: 'Marcas', icon: Tag, color: 'text-purple-600', bg: 'bg-purple-100', desc: 'Listado maestro de marcas' },
    { id: 'categories', label: 'Rubros', icon: Layers, color: 'text-pink-600', bg: 'bg-pink-100', desc: 'Categorización del catálogo' },
  ];

  const getMappingFields = (entity: EntityType): MappingField[] => {
    switch (entity) {
      case 'products': return [
        { key: 'sku', label: 'Código SKU / Interno', required: true },
        { key: 'name', label: 'Descripción del Producto', required: true },
        { key: 'brand', label: 'Marca', required: true },
        { key: 'category', label: 'Rubro / Categoría', required: true },
        { key: 'cost', label: 'Precio Costo', required: true },
        { key: 'price', label: 'Precio Venta', required: false },
        { key: 'stock', label: 'Stock Inicial', required: false },
      ];
      case 'clients': return [
        { key: 'name', label: 'Razón Social / Nombre', required: true },
        { key: 'cuit', label: 'CUIT / DNI', required: true },
        { key: 'email', label: 'Email', required: false },
        { key: 'phone', label: 'WhatsApp / Tel', required: false },
        { key: 'balance', label: 'Saldo Inicial', required: false },
      ];
      default: return [{ key: 'name', label: 'Nombre / Descripción', required: true }];
    }
  };

  const startAnalysis = () => {
    setIsAnalyzing(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsAnalyzing(false);
        setStep(4);
      }
    }, 200);
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Importación Masiva de Datos</h1>
          <p className="text-slate-500">Migra tu información desde archivos Excel de forma rápida y segura.</p>
        </div>
        {step > 1 && (
          <button 
            onClick={() => setStep(step - 1)}
            className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" /> Volver al paso anterior
          </button>
        )}
      </header>

      {/* Progress Stepper */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between mb-8 overflow-x-auto">
        {[
          { id: 1, label: 'Seleccionar Tipo', icon: Settings },
          { id: 2, label: 'Cargar Archivo', icon: FileUp },
          { id: 3, label: 'Mapear Columnas', icon: Search },
          { id: 4, label: 'Análisis y Carga', icon: CheckCircle2 },
        ].map((s, i) => (
          <React.Fragment key={s.id}>
            <div className={`flex items-center gap-3 shrink-0 ${step === s.id ? 'text-orange-600' : 'text-slate-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold ${
                step >= s.id ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-slate-100'
              }`}>
                {step > s.id ? <CheckCircle2 className="w-6 h-6" /> : s.id}
              </div>
              <span className="text-xs font-black uppercase tracking-widest hidden md:block">{s.label}</span>
            </div>
            {i < 3 && <ChevronRight className="w-5 h-5 text-slate-100" />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Select Entity */}
      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 animate-in slide-in-from-bottom duration-300">
          {entities.map(entity => (
            <button
              key={entity.id}
              onClick={() => { setSelectedEntity(entity.id as EntityType); setStep(2); }}
              className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 hover:border-orange-500 hover:shadow-2xl hover:shadow-orange-500/10 transition-all flex flex-col items-center text-center group"
            >
              <div className={`p-5 ${entity.bg} ${entity.color} rounded-[1.5rem] mb-6 group-hover:scale-110 transition-transform`}>
                <entity.icon className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">{entity.label}</h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">{entity.desc}</p>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Upload File */}
      {step === 2 && selectedEntity && (
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-12 text-center space-y-8 animate-in zoom-in duration-300">
          <div className="max-w-xl mx-auto space-y-6">
            <div className="w-24 h-24 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-xl">
              <FileSpreadsheet className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Cargar archivo de {entities.find(e => e.id === selectedEntity)?.label}</h2>
            <p className="text-slate-500">Arrastra tu archivo Excel (.xlsx) o CSV aquí para comenzar el proceso de importación.</p>
            
            <div className="border-4 border-dashed border-slate-100 rounded-[2.5rem] p-16 hover:border-orange-200 hover:bg-orange-50/20 transition-all cursor-pointer group">
              <FileUp className="w-12 h-12 text-slate-300 mx-auto mb-4 group-hover:text-orange-400" />
              <p className="font-bold text-slate-400 group-hover:text-orange-600">Haz clic o arrastra el archivo aquí</p>
              <input type="file" className="hidden" />
            </div>

            <div className="flex justify-center gap-4">
               <button className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600">
                 <Download className="w-4 h-4" /> Descargar Plantilla Modelo
               </button>
            </div>

            <button 
              onClick={() => setStep(3)}
              className="mt-8 bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all"
            >
              Continuar al Mapeo
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Column Mapping */}
      {step === 3 && selectedEntity && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-right duration-300">
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 bg-slate-50/50">
               <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                 <Settings className="w-6 h-6 text-orange-600" /> Mapeo de Columnas
               </h3>
               <p className="text-slate-500 text-sm mt-1">Vincula los campos del sistema con las columnas de tu archivo Excel.</p>
            </div>
            
            <div className="p-8 space-y-6">
              {getMappingFields(selectedEntity).map(field => (
                <div key={field.key} className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </p>
                    <p className="text-sm font-bold text-slate-700">Campo FerroGest</p>
                  </div>
                  <ChevronRight className="hidden md:block w-5 h-5 text-slate-200 group-hover:text-orange-400 transition-colors" />
                  <div className="flex-1">
                    <select className="w-full px-5 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold bg-white appearance-none">
                       <option>Seleccionar Columna Excel...</option>
                       <option>Columna A (Dato 1)</option>
                       <option>Columna B (Dato 2)</option>
                       <option>Columna C (Dato 3)</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl">
               <Info className="absolute -top-6 -right-6 w-32 h-32 text-white/5 -rotate-12" />
               <div className="relative z-10 space-y-4">
                 <h4 className="text-lg font-black uppercase tracking-tight">Consejos de Importación</h4>
                 <ul className="space-y-3 text-sm text-slate-400">
                   <li className="flex gap-2">
                     <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0" />
                     <span>Asegúrate de que no haya filas vacías al inicio.</span>
                   </li>
                   <li className="flex gap-2">
                     <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0" />
                     <span>Los montos deben ser numéricos sin símbolos de moneda.</span>
                   </li>
                   <li className="flex gap-2">
                     <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0" />
                     <span>El CUIT debe ser solo números (20334445551).</span>
                   </li>
                 </ul>
               </div>
            </div>

            <button 
              onClick={startAnalysis}
              className="w-full bg-orange-600 text-white py-6 rounded-[2rem] font-black text-lg uppercase tracking-[0.2em] shadow-xl shadow-orange-600/20 hover:bg-orange-500 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              {isAnalyzing ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Procesar e Importar'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Analysis & Results */}
      {step === 4 && (
        <div className="space-y-8 animate-in zoom-in duration-300">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Registros</p>
                <h3 className="text-4xl font-black text-slate-800">1.248</h3>
              </div>
              <div className="bg-green-50 p-8 rounded-3xl border border-green-100 shadow-sm">
                <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Nuevos</p>
                <h3 className="text-4xl font-black text-green-800">952</h3>
              </div>
              <div className="bg-blue-50 p-8 rounded-3xl border border-blue-100 shadow-sm">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Actualizados</p>
                <h3 className="text-4xl font-black text-blue-800">284</h3>
              </div>
              <div className="bg-red-50 p-8 rounded-3xl border border-red-100 shadow-sm">
                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Errores</p>
                <h3 className="text-4xl font-black text-red-800">12</h3>
              </div>
           </div>

           <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Vista Previa del Análisis</h3>
                <button className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all">Ver Solo Errores</button>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                      <tr>
                        <th className="px-8 py-5">Identificador</th>
                        <th className="px-8 py-5">Nombre / Descripción</th>
                        <th className="px-8 py-5">Estado</th>
                        <th className="px-8 py-5">Motivo / Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       <tr className="text-sm">
                         <td className="px-8 py-5 font-bold">77912345678</td>
                         <td className="px-8 py-5">MARTILLO STANLEY 20OZ</td>
                         <td className="px-8 py-5"><span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase">Actualización</span></td>
                         <td className="px-8 py-5 text-slate-400 italic font-medium">Actualiza precio de $4500 a $5200</td>
                       </tr>
                       <tr className="text-sm">
                         <td className="px-8 py-5 font-bold">20-44555666-1</td>
                         <td className="px-8 py-5">FERRETERIA SAN CARLOS</td>
                         <td className="px-8 py-5"><span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase">Nuevo</span></td>
                         <td className="px-8 py-5 text-slate-400 italic font-medium">Alta de nuevo registro</td>
                       </tr>
                       <tr className="text-sm bg-red-50/30">
                         <td className="px-8 py-5 font-bold text-red-600">ERROR-404</td>
                         <td className="px-8 py-5 text-red-400 italic">SIN NOMBRE</td>
                         <td className="px-8 py-5"><span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-black uppercase tracking-widest">Error crítico</span></td>
                         <td className="px-8 py-5 text-red-600 font-bold flex items-center gap-2">
                           <AlertCircle className="w-4 h-4" /> Falta campo requerido (Nombre)
                         </td>
                       </tr>
                    </tbody>
                 </table>
              </div>
           </div>

           <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 text-slate-500">
                <AlertCircle className="w-8 h-8" />
                <p className="text-sm font-medium leading-relaxed max-w-lg">
                  Se encontraron 12 registros con errores que no podrán ser importados. Puedes corregirlos en tu Excel y re-intentar, o continuar ignorando esos registros.
                </p>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <button onClick={() => setStep(1)} className="flex-1 md:flex-none py-4 px-8 bg-white border border-slate-200 rounded-2xl font-black text-slate-400 uppercase text-xs tracking-widest">Descartar todo</button>
                <button 
                  onClick={() => { alert('¡Carga completada con éxito!'); setStep(1); }}
                  className="flex-1 md:flex-none py-4 px-12 bg-orange-600 text-white rounded-2xl font-black shadow-xl shadow-orange-600/20 hover:bg-orange-500 transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-widest"
                >
                  Confirmar y Cargar Datos <CheckCircle2 className="w-5 h-5" />
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default BulkImport;
