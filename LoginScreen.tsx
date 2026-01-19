
import React, { useState } from 'react';
import { Loader2, User, Lock, Mail, Users as UsersIcon, ShoppingBag, X } from 'lucide-react'; // Renamed Users to UsersIcon to avoid clash
import { Role } from './types'; // Assuming types.ts is in the same directory or parent

interface LoginScreenProps {
  onLoginSuccess: (role: Role, name: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoRole, setDemoRole] = useState<Role | ''>('');

  const demoCredentials: { [key in Role]: { email: string; password: string; name: string } } = {
    admin: { email: 'admin@ferrogest.com', password: 'admin123', name: 'Administrador Principal' },
    vendedor: { email: 'carlos@ferrogest.com', password: 'vendedor123', name: 'Carlos Vendedor' },
    contador: { email: 'ana@ferrogest.com', password: 'contador123', name: 'Ana Contadora' },
    deposito: { email: 'juan@ferrogest.com', password: 'deposito123', name: 'Juan Depósito' },
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    const foundRole: Role | undefined = (Object.keys(demoCredentials) as Role[]).find(
      (roleKey: Role) =>
        demoCredentials[roleKey].email === email && demoCredentials[roleKey].password === password
    );

    if (foundRole) {
      onLoginSuccess(foundRole, demoCredentials[foundRole].name);
    } else {
      setError('Email o contraseña incorrectos.');
    }
    setIsLoading(false);
  };

  const handleDemoLogin = (role: Role) => {
    setEmail(demoCredentials[role].email);
    setPassword(demoCredentials[role].password);
    setDemoRole(role);
    // Optionally auto-submit or let user click login
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-lg space-y-8 animate-in zoom-in duration-300">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-orange-600 text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-lg shadow-orange-600/30">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Bienvenido a FerroGest</h1>
          <p className="text-slate-500 text-sm">Inicia sesión para acceder a tu plataforma.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-3 animate-in fade-in">
            <X className="w-5 h-5 text-red-600" />
            <span className="font-medium text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium text-slate-800"
                placeholder="tu.email@empresa.com"
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium text-slate-800"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-orange-600/20 hover:bg-orange-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <User className="w-5 h-5" />}
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="pt-6 border-t border-slate-100 space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <UsersIcon className="w-4 h-4" /> Acceso Rápido (Demo)
          </h3>
          <p className="text-slate-500 text-sm">Selecciona un rol para acceder al demo sin credenciales.</p>
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(demoCredentials) as Role[]).map((role) => (
              <button
                key={role}
                onClick={() => handleDemoLogin(role)}
                className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest border-2 transition-all ${
                  demoRole === role ? 'bg-orange-50 border-orange-500 text-orange-600' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                }`}
              >
                {demoCredentials[role].name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
