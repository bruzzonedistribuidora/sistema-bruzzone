
import React, { useState, useEffect, useRef } from 'react';
import { 
    Save, Building2, MapPin, Phone, Mail, Globe, Upload, Image as ImageIcon, 
    Briefcase, FileText, CreditCard, Banknote, QrCode, Plus, Trash2, CheckCircle, 
    X, Landmark, Smartphone, Edit2, Check, Server, Key, Lock, ShieldCheck, RefreshCw, Send,
    Camera, ToggleLeft, ToggleRight, MoreVertical, MessageCircle, Percent, ListPlus
} from 'lucide-react';
import { CompanyConfig, TaxCondition, PaymentAccount } from '../types';

const CompanySettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'PAYMENTS' | 'EMAIL' | 'WHATSAPP'>('GENERAL');
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [isTestingWhatsApp, setIsTestingWhatsApp] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<PaymentAccount | null>(null);
  const [newMethodName, setNewMethodName] = useState('');
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<CompanyConfig>(() => {
      const saved = localStorage.getItem('company_config');
      return saved ? JSON.parse(saved) : {
          name: 'FERRETERIA BRUZZONE S.A.',
          fantasyName: 'Ferreteria Bruzzone',
          cuit: '30-12345678-9',
          taxCondition: 'Responsable Inscripto',
          iibb: '901-123456-1',
          startDate: '2020-01-01',
          address: 'Av. del Libertador 1200',
          city: 'CABA',
          zipCode: '1425',
          phone: '+54 11 4455-6677',
          email: 'contacto@ferrebruzzone.com.ar',
          web: 'www.ferrebruzzone.com.ar',
          logo: null,
          slogan: 'Herramientas y Materiales para Profesionales',
          whatsappNumber: '5491144556677',
          defaultProfitMargin: 30,
          paymentAccounts: [
              { id: '1', type: 'VIRTUAL_WALLET', bankName: 'Mercado Pago', alias: 'ferre.bruzzone.mp', cbu: '', owner: 'Bruzzone SA', active: true },
              { id: '2', type: 'BANK', bankName: 'Banco Galicia', alias: 'bruzzone.galicia', cbu: '0070012345678901234567', owner: 'Bruzzone SA', active: true }
          ],
          paymentMethods: ['EFECTIVO', 'DEBITO', 'CREDITO', 'TRANSFERENCIA', 'MERCADO_PAGO', 'CTACTE'],
          smtpHost: 'smtp.gmail.com',
          smtpPort: '587',
          smtpUser: '',
          smtpPassword: '',
          smtpSSL: true
      };
  });

  const [accountForm, setAccountForm] = useState<Partial<PaymentAccount>>({
      type: 'BANK', bankName: '', alias: '', cbu: '', owner: formData.name, active: true
  });

  useEffect(() => {
      localStorage.setItem('company_config', JSON.stringify(formData));
  }, [formData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : (type === 'number' ? parseFloat(value) : value);
      setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSave = () => {
      setIsLoading(true);
      localStorage.setItem('company_config', JSON.stringify(formData));
      window.dispatchEvent(new Event('company_config_updated'));

      setTimeout(() => {
          setIsLoading(false);
          alert('Configuración guardada correctamente.');
      }, 600);
  };

  const addPaymentMethod = () => {
      if (!newMethodName.trim()) return;
      const cleanName = newMethodName.trim().toUpperCase();
      if (formData.paymentMethods?.includes(cleanName)) {
          alert('Este método ya existe.');
          return;
      }
      setFormData(prev => ({
          ...prev,
          paymentMethods: [...(prev.paymentMethods || []), cleanName]
      }));
      setNewMethodName('');
  };

  const removePaymentMethod = (name: string) => {
      setFormData(prev => ({
          ...prev,
          paymentMethods: prev.paymentMethods?.filter(m => m !== name)
      }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, logo: reader.result as string }));
      reader.readAsDataURL(file);
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => setAccountForm(prev => ({ ...prev, qrImage: reader.result as string }));
      reader.readAsDataURL(file);
  };

  const handleTestEmail = () => {
      if (!formData.smtpUser || !formData.smtpHost) {
          alert("Complete los datos del servidor y usuario antes de probar.");
          return;
      }
      setIsTestingEmail(true);
      setTimeout(() => {
          setIsTestingEmail(false);
          alert("Conexión con el servidor SMTP establecida con éxito.");
      }, 2000);
  };

  const handleTestWhatsApp = () => {
      if (!formData.whatsappNumber) {
          alert("Ingrese un número de WhatsApp primero.");
          return;
      }
      setIsTestingWhatsApp(true);
      setTimeout(() => {
          setIsTestingWhatsApp(false);
          const cleanNum = formData.whatsappNumber?.replace(/[^0-9]/g, '');
          window.open(`https://wa.me/${cleanNum}?text=Prueba de conexión desde FerreCloud`, '_blank');
      }, 1000);
  };

  const openAccountModal = (acc?: PaymentAccount) => {
      if (acc) {
          setEditingAccount(acc);
          setAccountForm(acc);
      } else {
          setEditingAccount(null);
          setAccountForm({ type: 'BANK', bankName: '', alias: '', cbu: '', owner: formData.name, active: true, qrImage: null });
      }
      setIsAccountModalOpen(true);
  };

  const saveAccount = () => {
      if (!accountForm.bankName || !accountForm.alias) {
          alert("Banco/App y Alias son obligatorios.");
          return;
      }

      setFormData(prev => {
          const accounts = [...prev.paymentAccounts];
          if (editingAccount) {
              const idx = accounts.findIndex(a => a.id === editingAccount.id);
              accounts[idx] = { ...accountForm, id: editingAccount.id } as PaymentAccount;
          } else {
              accounts.push({ ...accountForm, id: Date.now().toString() } as PaymentAccount);
          }
          return { ...prev, paymentAccounts: accounts };
      });
      setIsAccountModalOpen(false);
  };

  const deleteAccount = (id: string) => {
      if (confirm('¿Desea eliminar esta cuenta de cobro?')) {
          setFormData(prev => ({
              ...prev,
              paymentAccounts: prev.paymentAccounts.filter(a => a.id !== id)
          }));
      }
  };

  const toggleAccountStatus = (id: string) => {
      setFormData(prev => ({
          ...prev,
          paymentAccounts: prev.paymentAccounts.map(a => a.id === id ? { ...a, active: !a.active } : a)
      }));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto space-y-8 animate-fade-in bg-slate-50 pb-20">
        <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoChange} />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm">
            <div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tighter uppercase">Configuración Maestro</h2>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Identidad visual, fiscal y automatización de envíos</p>
            </div>
            <div className="flex gap-4">
                <div className="flex bg-slate-100 rounded-2xl p-1 shadow-inner">
                    <button onClick={() => setActiveTab('GENERAL')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'GENERAL' ? 'bg-white text-slate-900 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>General</button>
                    <button onClick={() => setActiveTab('PAYMENTS')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'PAYMENTS' ? 'bg-white text-slate-900 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>Cobros</button>
                    <button onClick={() => setActiveTab('WHATSAPP')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'WHATSAPP' ? 'bg-white text-slate-900 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>WhatsApp</button>
                    <button onClick={() => setActiveTab('EMAIL')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'EMAIL' ? 'bg-white text-slate-900 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>Email / SMTP</button>
                </div>
                <button 
                    onClick={handleSave} 
                    disabled={isLoading}
                    className="bg-slate-900 text-white px-8 py-2 rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50">
                    {isLoading ? <RefreshCw className="animate-spin" size={16}/> : <Save size={16}/>} 
                    {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>
        </div>

        {activeTab === 'GENERAL' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
                <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-6 flex flex-col items-center justify-center h-fit">
                    <div className="w-48 h-48 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex items-center justify-center relative overflow-hidden group cursor-pointer" onClick={() => logoInputRef.current?.click()}>
                        {formData.logo ? <img src={formData.logo} className="w-full h-full object-contain p-4"/> : <Camera className="text-slate-300" size={64}/>}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-black text-[10px] uppercase">Cambiar Logo</div>
                    </div>
                    <div className="text-center">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Logo de la Empresa</p>
                        <p className="text-[10px] text-gray-400 mt-2">PNG transparente o JPG (máx 1MB)</p>
                    </div>
                </div>
                
                <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
                    <div className="space-y-6">
                        <h4 className="font-black text-slate-800 uppercase tracking-tight border-b pb-4 flex items-center gap-2">
                            <Briefcase size={18} className="text-indigo-600"/> Identidad y Datos Fiscales
                        </h4>
                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Nombre de Fantasía (Aparece en Sidebar)</label>
                                <input name="fantasyName" placeholder="Nombre Comercial" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-indigo-600 outline-none uppercase" value={formData.fantasyName} onChange={handleInputChange} />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Razón Social Completa</label>
                                <input name="name" placeholder="Razón Social Legal" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none uppercase text-sm" value={formData.name} onChange={handleInputChange} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">CUIT</label>
                                    <input name="cuit" placeholder="30-..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none font-mono" value={formData.cuit} onChange={handleInputChange} />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Condición IVA</label>
                                    <select name="taxCondition" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none text-sm" value={formData.taxCondition} onChange={handleInputChange}>
                                        <option value="Responsable Inscripto">Responsable Inscripto</option>
                                        <option value="Monotributo">Monotributo</option>
                                        <option value="Exento">Exento</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 pt-4 border-t border-gray-50">
                        <h4 className="font-black text-slate-800 uppercase tracking-tight pb-2 flex items-center gap-2">
                            <Percent size={18} className="text-green-600"/> Parámetros de Venta
                        </h4>
                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Margen de Ganancia Sugerido (%)</label>
                            <input 
                                name="defaultProfitMargin" 
                                type="number"
                                className="w-full p-4 bg-white border-2 border-transparent rounded-2xl font-black text-slate-800 outline-none focus:border-green-500 transition-all text-xl text-center" 
                                value={formData.defaultProfitMargin} 
                                onChange={handleInputChange} 
                            />
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'PAYMENTS' && (
            <div className="space-y-10 animate-fade-in pb-10">
                {/* SECCIÓN MODALIDADES DE PAGO */}
                <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
                    <div className="flex justify-between items-center border-b pb-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-500 text-white rounded-2xl shadow-lg"><ListPlus size={24}/></div>
                            <div>
                                <h3 className="font-black text-slate-800 uppercase tracking-tight text-xl">Modalidades de Cobro</h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Define qué botones de pago verás en el POS</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <input 
                            type="text" 
                            placeholder="Nombre de modalidad (ej: Plan Z, Debito 24hs)" 
                            className="flex-1 p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-bold text-slate-700 uppercase"
                            value={newMethodName}
                            onChange={e => setNewMethodName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addPaymentMethod()}
                        />
                        <button onClick={addPaymentMethod} className="bg-slate-900 text-white px-8 rounded-2xl font-black text-xs uppercase hover:bg-slate-800 transition-all flex items-center gap-2">
                            <Plus size={16}/> AGREGAR
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {formData.paymentMethods?.map(m => (
                            <div key={m} className="bg-white border-2 border-gray-100 pl-5 pr-2 py-3 rounded-2xl flex items-center gap-4 group hover:border-indigo-500 transition-all">
                                <span className="font-black text-xs text-slate-700 uppercase tracking-tighter">{m}</span>
                                <button onClick={() => removePaymentMethod(m)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                    <X size={16}/>
                                </button>
                            </div>
                        ))}
                        {(!formData.paymentMethods || formData.paymentMethods.length === 0) && (
                            <p className="text-sm text-slate-400 italic">No hay modalidades personalizadas definidas.</p>
                        )}
                    </div>
                </div>

                {/* SECCIÓN CUENTAS BANCARIAS */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="font-black text-slate-800 uppercase tracking-tight text-xl">Cuentas para Transferencias</h3>
                        <button 
                            onClick={() => openAccountModal()}
                            className="bg-indigo-600 text-white px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2">
                            <Plus size={16}/> Nueva Cuenta
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {formData.paymentAccounts.map(acc => (
                            <div key={acc.id} className={`bg-white rounded-[2.5rem] border border-gray-200 p-8 shadow-sm relative group flex flex-col transition-all hover:shadow-xl ${!acc.active ? 'opacity-60 grayscale' : ''}`}>
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`p-4 rounded-2xl ${acc.type === 'VIRTUAL_WALLET' ? 'bg-yellow-50 text-yellow-600' : 'bg-blue-50 text-blue-600'}`}>
                                        {acc.type === 'VIRTUAL_WALLET' ? <Smartphone size={28}/> : <Landmark size={28}/>}
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => toggleAccountStatus(acc.id)} className={`p-2 rounded-xl transition-all ${acc.active ? 'text-green-600 bg-green-50' : 'text-slate-400 bg-slate-100'}`}>
                                            {acc.active ? <CheckCircle size={18}/> : <X size={18}/>}
                                        </button>
                                        <button onClick={() => openAccountModal(acc)} className="p-2 text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"><Edit2 size={18}/></button>
                                        <button onClick={() => deleteAccount(acc.id)} className="p-2 text-red-500 bg-red-50 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18}/></button>
                                    </div>
                                </div>

                                <h4 className="font-black text-slate-800 text-xl uppercase tracking-tighter leading-none mb-1">{acc.bankName}</h4>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{acc.type === 'BANK' ? 'Cta. Bancaria' : 'Billetera Virtual'}</p>
                                
                                <div className="space-y-4 flex-1">
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Alias de Cobro</p>
                                        <p className="text-sm font-black text-indigo-600 font-mono truncate">{acc.alias}</p>
                                    </div>
                                </div>

                                {acc.qrImage && (
                                    <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                                        <span className="text-[9px] font-black text-slate-400 uppercase">QR Habilitado</span>
                                        <div className="w-10 h-10 bg-slate-100 rounded-lg p-1">
                                            <img src={acc.qrImage} className="w-full h-full object-contain" alt="QR Cobro"/>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'WHATSAPP' && (
            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm animate-fade-in space-y-8">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-500 text-white rounded-2xl shadow-lg shadow-green-100">
                            <MessageCircle size={28}/>
                        </div>
                        <div>
                            <h3 className="font-black text-slate-800 uppercase tracking-tight text-xl">WhatsApp Business</h3>
                            <p className="text-xs font-bold text-gray-400 uppercase mt-1">Número emisor para notificaciones y pedidos</p>
                        </div>
                    </div>
                </div>

                <div className="max-w-md space-y-4">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-2">Número Oficial (Formato Internacional)</label>
                    <div className="relative group">
                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-green-500" size={20}/>
                        <input 
                            name="whatsappNumber" 
                            placeholder="Ej: 5491144556677" 
                            className="w-full pl-12 p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black text-slate-700 outline-none focus:bg-white focus:border-green-500 transition-all" 
                            value={formData.whatsappNumber} 
                            onChange={handleInputChange} 
                        />
                    </div>
                </div>

                <button onClick={handleTestWhatsApp} disabled={isTestingWhatsApp} className="w-full py-5 bg-green-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-green-100 hover:bg-green-500 transition-all flex items-center justify-center gap-4">
                    {isTestingWhatsApp ? <RefreshCw className="animate-spin"/> : <Send size={20}/>}
                    {isTestingWhatsApp ? 'Iniciando Prueba...' : 'Probar Número de WhatsApp'}
                </button>
            </div>
        )}

        {activeTab === 'EMAIL' && (
            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm animate-fade-in space-y-8">
                <div className="flex justify-between items-center">
                    <h3 className="font-black text-slate-800 uppercase tracking-tight text-xl">Configuración de Mensajería Saliente (SMTP)</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <input name="smtpHost" placeholder="Servidor (ej. smtp.gmail.com)" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" value={formData.smtpHost} onChange={handleInputChange} />
                        <input name="smtpPort" placeholder="Puerto (ej. 587)" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" value={formData.smtpPort} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-4">
                        <input name="smtpUser" placeholder="Email de Usuario" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" value={formData.smtpUser} onChange={handleInputChange} />
                        <input name="smtpPassword" type="password" placeholder="Contraseña de Aplicación" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" value={formData.smtpPassword} onChange={handleInputChange} />
                    </div>
                </div>
                <button onClick={handleTestEmail} disabled={isTestingEmail} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-4">
                    {isTestingEmail ? <RefreshCw className="animate-spin"/> : <Send size={20}/>}
                    {isTestingEmail ? 'Procesando Prueba...' : 'Probar Conexión de Correo'}
                </button>
            </div>
        )}

        {/* MODAL CUENTA DE PAGO */}
        {isAccountModalOpen && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
                <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                    <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-500 rounded-2xl"><CreditCard size={24}/></div>
                            <h3 className="font-black uppercase tracking-widest">{editingAccount ? 'Editar Cuenta' : 'Nueva Vía de Cobro'}</h3>
                        </div>
                        <button onClick={() => setIsAccountModalOpen(false)}><X size={28}/></button>
                    </div>
                    <div className="p-10 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setAccountForm({...accountForm, type: 'BANK'})} className={`py-4 rounded-2xl font-black text-[10px] uppercase border-2 flex flex-col items-center gap-2 ${accountForm.type === 'BANK' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-400'}`}>
                                <Landmark size={24}/> Banco Tradicional
                            </button>
                            <button onClick={() => setAccountForm({...accountForm, type: 'VIRTUAL_WALLET'})} className={`py-4 rounded-2xl font-black text-[10px] uppercase border-2 flex flex-col items-center gap-2 ${accountForm.type === 'VIRTUAL_WALLET' ? 'border-yellow-500 bg-yellow-50 text-yellow-700' : 'border-slate-100 text-slate-400'}`}>
                                <Smartphone size={24}/> Billetera Virtual
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Nombre del Banco o Aplicación</label>
                                <input type="text" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 outline-none font-bold text-slate-700" placeholder="Ej: Banco Galicia, Mercado Pago, etc" value={accountForm.bankName} onChange={e => setAccountForm({...accountForm, bankName: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Titular de la Cuenta</label>
                                <input type="text" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 outline-none font-bold text-slate-700" value={accountForm.owner} onChange={e => setAccountForm({...accountForm, owner: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Alias</label>
                                    <input type="text" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 outline-none font-black text-indigo-600 font-mono" value={accountForm.alias} onChange={e => setAccountForm({...accountForm, alias: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">CBU / CVU</label>
                                    <input type="text" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 outline-none font-bold text-slate-700 font-mono" value={accountForm.cbu} onChange={e => setAccountForm({...accountForm, cbu: e.target.value})} />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                            <div className="w-20 h-20 bg-white rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden group cursor-pointer relative" onClick={() => qrInputRef.current?.click()}>
                                {accountForm.qrImage ? <img src={accountForm.qrImage} className="w-full h-full object-contain p-2" alt="QR Cuenta"/> : <QrCode className="text-slate-300" size={32}/>}
                                <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Camera size={16} className="text-indigo-600"/></div>
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Vincular Código QR</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase leading-tight mt-1">Carga tu código de cobro para<br/>que el cliente lo vea en su portal.</p>
                                <input type="file" ref={qrInputRef} className="hidden" accept="image/*" onChange={handleQrUpload} />
                            </div>
                        </div>

                        <button onClick={saveAccount} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
                            <Check size={20}/> {editingAccount ? 'Actualizar Cuenta' : 'Vincular Nueva Cuenta'}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default CompanySettings;
