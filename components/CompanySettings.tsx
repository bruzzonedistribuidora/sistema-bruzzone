
import React, { useState } from 'react';
import { Save, Building2, MapPin, Phone, Mail, Globe, Upload, Image as ImageIcon, Briefcase, FileText } from 'lucide-react';
import { CompanyConfig, TaxCondition } from '../types';

const CompanySettings: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CompanyConfig>({
      name: 'FERRETERIA FERRECLOUD S.A.',
      fantasyName: 'FerreCloud',
      cuit: '30-12345678-9',
      taxCondition: 'Responsable Inscripto',
      iibb: '901-123456-1',
      startDate: '2020-01-01',
      address: 'Av. del Libertador 1200',
      city: 'Ciudad Autónoma de Buenos Aires',
      zipCode: '1425',
      phone: '+54 11 4455-6677',
      email: 'contacto@ferrecloud.com',
      web: 'www.ferrecloud.com',
      logo: null,
      slogan: 'Herramientas y Materiales para Profesionales'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = (event) => {
              if (event.target?.result) {
                  setFormData(prev => ({ ...prev, logo: event.target?.result as string }));
              }
          };
          reader.readAsDataURL(e.target.files[0]);
      }
  };

  const handleSave = () => {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
          setIsLoading(false);
          alert('Datos de la empresa guardados correctamente.');
      }, 1500);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Identidad de la Empresa</h2>
                <p className="text-gray-500 text-sm">Configura la información que aparecerá en tus comprobantes y reportes.</p>
            </div>
            <button 
                onClick={handleSave}
                disabled={isLoading}
                className="bg-ferre-orange hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-bold shadow-md flex items-center gap-2 transition-colors disabled:opacity-50">
                {isLoading ? 'Guardando...' : <><Save size={20}/> Guardar Cambios</>}
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Visual Identity & Basic Info */}
            <div className="space-y-6">
                
                {/* Logo Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
                    <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 text-left">Logotipo</h3>
                    <div className="flex flex-col items-center">
                        <div className="w-full max-w-[280px] h-40 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden mb-4 relative group hover:border-ferre-orange hover:bg-orange-50/20 transition-all">
                            {formData.logo ? (
                                <img src={formData.logo} alt="Logo Empresa" className="w-full h-full object-contain p-2" />
                            ) : (
                                <div className="flex flex-col items-center text-gray-400">
                                    <ImageIcon size={48} className="mb-2 opacity-50" />
                                    <span className="text-xs font-medium">Subir Imagen</span>
                                </div>
                            )}
                            <label className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity backdrop-blur-sm">
                                <div className="flex flex-col items-center gap-2">
                                    <Upload size={32} />
                                    <span className="text-sm font-bold">Cambiar Logo</span>
                                </div>
                                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                            </label>
                        </div>
                        <p className="text-xs text-gray-400">Soporta formatos cuadrados y rectangulares (PNG, JPG).</p>
                    </div>
                </div>

                {/* Slogan */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">Marketing</h3>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Eslogan / Bajada</label>
                        <textarea 
                            name="slogan"
                            rows={3}
                            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-ferre-orange outline-none resize-none"
                            placeholder="Ej: Soluciones para el hogar"
                            value={formData.slogan}
                            onChange={handleInputChange}
                        ></textarea>
                    </div>
                </div>
            </div>

            {/* Middle & Right Columns: Form Data */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* General Information */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <Building2 className="text-ferre-orange"/> Datos Generales
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Razón Social</label>
                            <input type="text" name="name" className="w-full p-3 border border-gray-300 rounded-lg font-bold text-gray-800 focus:ring-2 focus:ring-ferre-orange outline-none" value={formData.name} onChange={handleInputChange} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Nombre de Fantasía</label>
                            <input type="text" name="fantasyName" className="w-full p-3 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-ferre-orange outline-none" value={formData.fantasyName} onChange={handleInputChange} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Inicio de Actividades</label>
                            <input type="date" name="startDate" className="w-full p-3 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-ferre-orange outline-none" value={formData.startDate} onChange={handleInputChange} />
                        </div>
                    </div>
                </div>

                {/* Fiscal Data */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <FileText className="text-blue-600"/> Datos Fiscales (AFIP / IIBB)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">CUIT</label>
                            <input type="text" name="cuit" className="w-full p-3 border border-gray-300 rounded-lg font-mono text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.cuit} onChange={handleInputChange} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Condición IVA</label>
                            <select name="taxCondition" className="w-full p-3 border border-gray-300 rounded-lg text-gray-700 bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={formData.taxCondition} onChange={handleInputChange}>
                                {Object.values(TaxCondition).map(cond => (
                                    <option key={cond} value={cond}>{cond}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Nro. Ingresos Brutos</label>
                            <input type="text" name="iibb" className="w-full p-3 border border-gray-300 rounded-lg font-mono text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.iibb} onChange={handleInputChange} />
                        </div>
                    </div>
                </div>

                {/* Contact & Address */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <MapPin className="text-green-600"/> Ubicación y Contacto
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Dirección Comercial</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 text-gray-400" size={18}/>
                                <input type="text" name="address" className="w-full pl-10 p-3 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-green-500 outline-none" value={formData.address} onChange={handleInputChange} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Ciudad / Localidad</label>
                            <input type="text" name="city" className="w-full p-3 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-green-500 outline-none" value={formData.city} onChange={handleInputChange} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Código Postal</label>
                            <input type="text" name="zipCode" className="w-full p-3 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-green-500 outline-none" value={formData.zipCode} onChange={handleInputChange} />
                        </div>
                        
                        <div className="col-span-2 border-t border-gray-100 my-2"></div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Teléfono / WhatsApp</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3 text-gray-400" size={18}/>
                                <input type="text" name="phone" className="w-full pl-10 p-3 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-green-500 outline-none" value={formData.phone} onChange={handleInputChange} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Email Principal</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 text-gray-400" size={18}/>
                                <input type="email" name="email" className="w-full pl-10 p-3 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-green-500 outline-none" value={formData.email} onChange={handleInputChange} />
                            </div>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Sitio Web</label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-3 text-gray-400" size={18}/>
                                <input type="text" name="web" className="w-full pl-10 p-3 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-green-500 outline-none" value={formData.web} onChange={handleInputChange} />
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
};

export default CompanySettings;
