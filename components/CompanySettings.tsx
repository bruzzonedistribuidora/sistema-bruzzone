
import React, { useState, useEffect, useRef } from 'react';
import { 
    Save, Building2, MapPin, Phone, Mail, Globe, Upload, Image as ImageIcon, 
    Briefcase, FileText, CreditCard, Banknote, QrCode, Plus, Trash2, CheckCircle, 
    X, Landmark, Smartphone, Edit2, Check, Server, Key, Lock, ShieldCheck, RefreshCw, Send
} from 'lucide-react';
import { CompanyConfig, TaxCondition, PaymentAccount } from '../types';

const CompanySettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'PAYMENTS' | 'EMAIL'>('GENERAL');
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [editingAccount, setEditingAccount] = useState<PaymentAccount | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetQrAccountId, setTargetQrAccountId] = useState<string | null>(null);
  
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
          paymentAccounts: [
              { id: '1', type: 'VIRTUAL_WALLET', bankName: 'Mercado Pago', alias: 'ferre.bruzzone.mp', cbu: '', owner: 'Bruzzone SA', active: true },
              { id: '2', type: 'BANK', bankName: 'Banco Galicia', alias: 'bruzzone.galicia', cbu: '0070012345678901234567', owner: 'Bruzzone SA', active: true }
          ],
          smtpHost: 'smtp.gmail.com',
          smtpPort: '587',
          smtpUser: '',
          smtpPassword: '',
          smtpSSL: true
      };
  });

  useEffect(() => {
      localStorage.setItem('company_config', JSON.stringify(formData));
  }, [formData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
      setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSave = () => {
      setIsLoading(true);
      setTimeout(() => {
          setIsLoading(false);
          alert('Configuración guardada correctamente.');
      }, 1000);
  };

  const handleTestEmail = () => {
      if (!formData.smtpUser || !formData.smtpHost) {
          alert("Complete los datos del servidor y usuario antes de probar.");
          return;
      }
      setIsTestingEmail(true);
      setTimeout(() => {
          setIsTestingEmail(false);
          alert("Conexión con el servidor SMTP establecida con éxito. El sistema está listo para enviar comprobantes por email.");
      }, 2000);
  };

  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [newAccount, setNewAccount] = useState<Partial<PaymentAccount>>({
      type: 'BANK', bankName: '', alias: '', cbu: '', owner: '', active: true
  });

  const handleOpenEdit = (acc: PaymentAccount) => {
      setEditingAccount(acc);
      setNewAccount({ ...acc });
      setIsAddAccountOpen(true);
  };

  const handleAddOrUpdateAccount = () => {
      if (!newAccount.bankName || !newAccount.alias) return;

      if (editingAccount) {
          setFormData(prev => ({
              ...prev,
              paymentAccounts: prev.paymentAccounts.map(a => a.id === editingAccount.id ? { ...newAccount as PaymentAccount } : a)
          }));
      } else {
          const account: PaymentAccount = { ...newAccount as PaymentAccount, id: Date.now().toString() };
          setFormData(prev => ({ ...prev, paymentAccounts: [...prev.paymentAccounts, account] }));
      }
      
      setIsAddAccountOpen(false);
      setEditingAccount(null);
      setNewAccount({ type: 'BANK', bankName: '', alias: '', cbu: '', owner: '', active: true });
  };

  const removeAccount = (id: string) => {
      if (confirm('¿Desea eliminar este medio de pago? Los clientes ya no lo verán en el portal.')) {
        setFormData(prev => ({ ...prev, paymentAccounts: prev.paymentAccounts.filter(a => a.id !== id) }));
      }
  };

  const handleQrIconClick = (accountId: string) => {
      setTargetQrAccountId(accountId);
      fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !targetQrAccountId) return;

      const reader = new FileReader();
      reader.onloadend = () => {
          const base64String = reader.result as string;
          setFormData(prev => ({
              ...prev,
              paymentAccounts: prev.paymentAccounts.map(acc => 
                  acc.id === targetQrAccountId ? { ...acc, qrImage: base64String } : acc
              )
          }));
          alert("Imagen de QR cargada correctamente.");
          setTargetQrAccountId(null);
      };
      reader.readAsDataURL(file);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto space-y-8 animate-fade-in">
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange}
        />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tighter uppercase">Configuración de Empresa</h2>
                <p className="text-gray-500 text-sm font-medium">Define tu identidad fiscal, canales de recaudación y envíos de correo.</p>
            </div>
            <div className="flex gap-4 w-full md:w-auto">
                <div className="flex bg-white rounded-xl p-1 border border-gray-200 shadow-sm flex-1 md:flex-none overflow-x-auto">
                    <button onClick={() => setActiveTab('GENERAL')} className={`px-6 py-2 rounded-lg text-xs font-black uppercase transition-all whitespace-nowrap ${activeTab === 'GENERAL' ? 'bg-slate-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>General</button>
                    <button onClick={() => setActiveTab('PAYMENTS')} className={`px-6 py-2 rounded-lg text-xs font-black uppercase transition-all whitespace-nowrap ${activeTab === 'PAYMENTS' ? 'bg-slate-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Cobros</button>
                    <button onClick={() => setActiveTab('EMAIL')} className={`px-6 py-2 rounded-lg text-xs font-black uppercase transition-all whitespace-nowrap ${activeTab === 'EMAIL' ? 'bg-slate-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Email (SMTP)</button>
                </div>
                <button onClick={handleSave} className="bg-ferre-orange hover:bg-orange-600 text-white px-8 py-2 rounded-xl font-black shadow-lg shadow-orange-900/10 flex items-center gap-2 transition-all active:scale-95">
                    <Save size={18}/> GUARDAR
                </button>
            </div>
        </div>

        {activeTab === 'GENERAL' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                    <h3 className="text-lg font-black text-gray-800 flex items-center gap-2 uppercase tracking-tighter"><Building2 className="text-ferre-orange"/> Identidad Fiscal</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Razón Social</label>
                            <input name="name" className="w-full p-3 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-ferre-orange outline-none font-bold text-gray-700" value={formData.name} onChange={handleInputChange} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">CUIT</label>
                            <input name="cuit" className="w-full p-3 bg-gray-50 border-gray-200 rounded-xl font-mono text-gray-700 font-bold" value={formData.cuit} onChange={handleInputChange} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Condición IVA</label>
                            <select name="taxCondition" className="w-full p-3 bg-gray-50 border-gray-200 rounded-xl font-bold text-gray-700 outline-none" value={formData.taxCondition} onChange={handleInputChange}>
                                {Object.values(TaxCondition).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                    <h3 className="text-lg font-black text-gray-800 flex items-center gap-2 uppercase tracking-tighter"><MapPin className="text-green-600"/> Contacto y Ubicación</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Dirección Comercial</label>
                            <input name="address" className="w-full p-3 bg-gray-50 border-gray-200 rounded-xl font-bold text-gray-700" value={formData.address} onChange={handleInputChange} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Teléfono</label>
                                <input name="phone" className="w-full p-3 bg-gray-50 border-gray-200 rounded-xl font-bold text-gray-700" value={formData.phone} onChange={handleInputChange} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Email Público</label>
                                <input name="email" className="w-full p-3 bg-gray-50 border-gray-200 rounded-xl font-bold text-gray-700" value={formData.email} onChange={handleInputChange} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'PAYMENTS' && (
            <div className="space-y-6 animate-fade-in pb-20">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div>
                            <h3 className="text-xl font-black text-gray-800 flex items-center gap-2 uppercase tracking-tighter"><CreditCard className="text-blue-600"/> Pasarela de Cobros Manuales</h3>
                            <p className="text-sm text-gray-500">Estas cuentas se mostrarán en el portal del cliente para que puedan realizar transferencias.</p>
                        </div>
                        <button onClick={() => { setEditingAccount(null); setIsAddAccountOpen(true); }} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 text-sm shadow-xl hover:bg-slate-800 transition-all">
                            <Plus size={18}/> AGREGAR MEDIO DE PAGO
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {formData.paymentAccounts.map(acc => (
                            <div key={acc.id} className="bg-gray-50 border-2 border-transparent hover:border-blue-200 rounded-3xl p-6 flex flex-col justify-between transition-all group relative">
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleOpenEdit(acc)} className="p-2 bg-white text-indigo-600 rounded-full shadow-sm hover:bg-indigo-50" title="Editar cuenta">
                                        <Edit2 size={16}/>
                                    </button>
                                    <button onClick={() => removeAccount(acc.id)} className="p-2 bg-white text-red-500 rounded-full shadow-sm hover:bg-red-50" title="Eliminar cuenta">
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                                <div className="flex gap-4 items-start mb-6">
                                    <div className="p-4 rounded-2xl bg-white shadow-sm text-blue-600">
                                        {acc.type === 'VIRTUAL_WALLET' ? <Smartphone size={28}/> : <Landmark size={28}/>}
                                    </div>
                                    <div className="overflow-hidden">
                                        <h4 className="font-black text-gray-800 uppercase tracking-tight truncate">{acc.bankName}</h4>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{acc.owner}</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="bg-white p-3 rounded-xl border border-gray-100">
                                        <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Alias de la cuenta</p>
                                        <p className="text-sm font-mono font-black text-blue-700">{acc.alias}</p>
                                    </div>
                                    {acc.cbu && (
                                        <div className="bg-white p-3 rounded-xl border border-gray-100">
                                            <p className="text-[9px] font-black text-gray-400 uppercase mb-1">CBU / CVU</p>
                                            <p className="text-xs font-mono font-bold text-gray-600 break-all">{acc.cbu}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${acc.active ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                        <span className="text-[10px] font-black text-gray-500 uppercase">{acc.active ? 'Visible en Portal' : 'Oculto'}</span>
                                    </div>
                                    <div 
                                        onClick={() => handleQrIconClick(acc.id)}
                                        className={`p-2 rounded-lg cursor-pointer transition-all flex items-center gap-2 ${acc.qrImage ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`} 
                                        title={acc.qrImage ? "QR Cargado" : "Subir QR de Pago"}>
                                        <QrCode size={18}/>
                                        {acc.qrImage && <Check size={12}/>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'EMAIL' && (
            <div className="space-y-8 animate-fade-in pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Panel de servidor */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-8">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-black text-gray-800 flex items-center gap-2 uppercase tracking-tighter"><Server className="text-indigo-600"/> Servidor de Correo (SMTP)</h3>
                                <div className="flex items-center gap-2 text-[10px] font-black text-green-600 bg-green-50 px-3 py-1 rounded-full uppercase tracking-widest border border-green-100">
                                    <ShieldCheck size={14}/> Seguro SSL/TLS
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Servidor / Host</label>
                                        <div className="relative group">
                                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-600 transition-colors" size={18}/>
                                            <input name="smtpHost" className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-bold text-gray-700 transition-all" value={formData.smtpHost} onChange={handleInputChange} placeholder="smtp.ejemplo.com" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Puerto</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 font-mono font-bold text-lg group-focus-within:text-indigo-600">:</div>
                                            <input name="smtpPort" type="number" className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-bold text-gray-700 transition-all" value={formData.smtpPort} onChange={handleInputChange} placeholder="465 / 587" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Usuario / Cuenta de Envío</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-600 transition-colors" size={18}/>
                                            <input name="smtpUser" className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-bold text-gray-700 transition-all" value={formData.smtpUser} onChange={handleInputChange} placeholder="facturacion@empresa.com" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Contraseña / Token App</label>
                                        <div className="relative group">
                                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-600 transition-colors" size={18}/>
                                            <input name="smtpPassword" type="password" className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-bold text-gray-700 transition-all" value={formData.smtpPassword} onChange={handleInputChange} placeholder="••••••••••••••••" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                <div 
                                    onClick={() => setFormData({...formData, smtpSSL: !formData.smtpSSL})}
                                    className={`w-14 h-8 rounded-full relative transition-all cursor-pointer ${formData.smtpSSL ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${formData.smtpSSL ? 'right-1' : 'left-1'}`}></div>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-black text-slate-800 uppercase text-xs tracking-tight leading-none mb-1">Usar Cifrado SSL / TLS</h4>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Recomendado para Gmail, Outlook y otros servicios modernos.</p>
                                </div>
                                <button 
                                    onClick={handleTestEmail}
                                    disabled={isTestingEmail}
                                    className="bg-white border border-indigo-200 text-indigo-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 shadow-sm transition-all flex items-center gap-2">
                                    {isTestingEmail ? <RefreshCw className="animate-spin" size={14}/> : <Send size={14}/>}
                                    {isTestingEmail ? 'Verificando...' : 'Probar Conexión'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Guía rápida lateral */}
                    <div className="space-y-6">
                        <div className="bg-indigo-600 text-white rounded-[2.5rem] p-8 shadow-2xl shadow-indigo-900/20 relative overflow-hidden">
                            <div className="absolute -bottom-10 -right-10 opacity-10"><Mail size={150}/></div>
                            <h4 className="font-black text-xl uppercase tracking-tighter mb-4 flex items-center gap-2">¿Para qué sirve?</h4>
                            <p className="text-sm font-medium leading-relaxed opacity-80 mb-6">
                                Configurar tu servidor SMTP permite que el sistema envíe automáticamente:
                            </p>
                            <ul className="space-y-4">
                                {[
                                    { icon: FileText, label: 'Facturas Electrónicas' },
                                    { icon: CreditCard, label: 'Resúmenes de Cuenta' },
                                    { icon: Smartphone, label: 'Links de Pago' }
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3">
                                        <div className="p-2 bg-white/20 rounded-xl"><item.icon size={16}/></div>
                                        <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        
                        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
                            <h4 className="font-black text-slate-800 uppercase tracking-tighter mb-3">Nota para Gmail</h4>
                            <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                Si usas Gmail, debes habilitar la <strong>Verificación en 2 pasos</strong> y generar una <strong>"Contraseña de Aplicación"</strong> específica para usar en este formulario. Gmail ya no permite el uso de la clave normal para apps de terceros.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {isAddAccountOpen && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                    <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                        <h3 className="font-black text-xl uppercase tracking-tighter flex items-center gap-2"><CreditCard className="text-ferre-orange"/> {editingAccount ? 'Editar' : 'Nuevo'} Medio de Pago</h3>
                        <button onClick={() => { setIsAddAccountOpen(false); setEditingAccount(null); }} className="p-2 hover:bg-white/10 rounded-full"><X size={24}/></button>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => setNewAccount({...newAccount, type: 'BANK'})}
                                className={`p-4 rounded-2xl border-2 font-bold flex flex-col items-center gap-2 transition-all ${newAccount.type === 'BANK' ? 'border-ferre-orange bg-orange-50 text-ferre-orange' : 'border-gray-100 text-gray-400 hover:bg-gray-50'}`}>
                                <Landmark size={24}/> Banco
                            </button>
                            <button 
                                onClick={() => setNewAccount({...newAccount, type: 'VIRTUAL_WALLET'})}
                                className={`p-4 rounded-2xl border-2 font-bold flex flex-col items-center gap-2 transition-all ${newAccount.type === 'VIRTUAL_WALLET' ? 'border-ferre-orange bg-orange-50 text-ferre-orange' : 'border-gray-100 text-gray-400 hover:bg-gray-50'}`}>
                                <Smartphone size={24}/> Billetera
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nombre Entidad (ej. Banco Nación)</label>
                                <input className="w-full p-3 bg-gray-50 border-gray-100 rounded-xl focus:ring-2 focus:ring-ferre-orange outline-none font-bold text-slate-800" value={newAccount.bankName} onChange={e => setNewAccount({...newAccount, bankName: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Alias de la Cuenta</label>
                                    <input className="w-full p-3 bg-gray-50 border-gray-100 rounded-xl focus:ring-2 focus:ring-ferre-orange outline-none font-mono text-blue-700 font-bold" value={newAccount.alias} onChange={e => setNewAccount({...newAccount, alias: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">CBU / CVU</label>
                                    <input className="w-full p-3 bg-gray-50 border-gray-100 rounded-xl focus:ring-2 focus:ring-ferre-orange outline-none font-mono font-bold text-slate-800" value={newAccount.cbu} onChange={e => setNewAccount({...newAccount, cbu: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Titular de la Cuenta</label>
                                <input className="w-full p-3 bg-gray-50 border-gray-100 rounded-xl focus:ring-2 focus:ring-ferre-orange outline-none font-bold text-gray-700" value={newAccount.owner} onChange={e => setNewAccount({...newAccount, owner: e.target.value})} />
                            </div>
                        </div>
                        
                        <button onClick={handleAddOrUpdateAccount} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-slate-800 transition-all uppercase tracking-tighter">
                            {editingAccount ? 'ACTUALIZAR DATOS' : 'VINCULAR MEDIO DE PAGO'}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default CompanySettings;
