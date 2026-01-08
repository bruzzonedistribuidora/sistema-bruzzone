
import React, { useState } from 'react';
import { Lock, User as UserIcon, Wrench, ArrowRight, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { User } from '../types';

interface LoginProps {
    onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Usuarios por defecto si no hay nada en storage
    // He añadido el rol 'creator' para el usuario root
    const defaultUsers: User[] = [
        { id: 'creator-root', name: 'Bruzzone Creator', email: 'creator@cloud.com', password: 'root', roleId: 'creator', active: true, lastLogin: 'Hoy', branchId: 'SUC-001' },
        { id: '1', name: 'Admin', email: 'admin@ferrebruzzone.com.ar', password: 'admin', roleId: 'admin', active: true, lastLogin: 'Hoy', branchId: 'SUC-001' },
        { id: '2', name: 'Juan', email: 'juan@ferrebruzzone.com.ar', password: 'juan', roleId: 'seller', active: true, lastLogin: 'Hoy', branchId: 'SUC-001' },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        setTimeout(() => {
            const savedUsersRaw = localStorage.getItem('ferrecloud_users');
            const managedUsers: User[] = savedUsersRaw ? JSON.parse(savedUsersRaw) : [];
            
            const allUsers = [...managedUsers, ...defaultUsers];

            const user = allUsers.find(u => 
                (u.name.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase()) && 
                u.password === password
            );
            
            if (user) {
                if (!user.active && user.roleId !== 'creator') {
                    setError('Tu cuenta ha sido desactivada por el administrador.');
                    setIsLoading(false);
                } else {
                    onLogin(user);
                }
            } else {
                setError('Nombre de usuario o contraseña incorrectos.');
                setIsLoading(false);
            }
        }, 800);
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-ferre-orange/20 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="w-full max-w-md p-4 animate-fade-in relative z-10">
                <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden">
                    <div className="p-10 text-center">
                        <div className="inline-flex items-center justify-center p-4 bg-slate-900 rounded-3xl text-ferre-orange mb-6 shadow-xl shadow-orange-900/20 ring-4 ring-orange-50">
                            <ShieldCheck size={32} />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-tight">Ferretería<br/><span className="text-ferre-orange">Bruzzone</span></h1>
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">Plataforma de Gestión Pro</p>
                    </div>

                    <form onSubmit={handleSubmit} className="px-10 pb-12 space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600">
                                <AlertCircle size={20} className="shrink-0" />
                                <p className="text-xs font-bold leading-tight">{error}</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="relative group">
                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-ferre-orange transition-colors" size={20} />
                                <input 
                                    type="text" 
                                    placeholder="Usuario o Email" 
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-ferre-orange outline-none transition-all font-bold text-slate-800"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-ferre-orange transition-colors" size={20} />
                                <input 
                                    type="password" 
                                    placeholder="Contraseña" 
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-ferre-orange outline-none transition-all font-bold text-slate-800"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button 
                            disabled={isLoading}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-slate-900/20 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70">
                            {isLoading ? (
                                <Loader2 className="animate-spin" size={24} />
                            ) : (
                                <>ACCEDER <ArrowRight size={20}/></>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
