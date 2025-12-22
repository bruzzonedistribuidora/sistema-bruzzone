
import React, { useState, useEffect } from 'react';
import { Plus, Users, Trash2, Edit2, DollarSign, Wallet, Calendar, UserPlus, X, Save, TrendingDown, ArrowUpRight, History, Receipt, AlertTriangle } from 'lucide-react';
import { Employee, EmployeeMovement } from '../types';

const Employees: React.FC = () => {
    const [employees, setEmployees] = useState<Employee[]>(() => {
        const saved = localStorage.getItem('ferrecloud_employees');
        return saved ? JSON.parse(saved) : [
            { id: '1', name: 'Ricardo Fort', position: 'Encargado de Local', baseSalary: 850000, dni: '20-12345678-9', startDate: '2022-01-10', active: true, movements: [] },
            { id: '2', name: 'Susana Gimenez', position: 'Atención al Cliente', baseSalary: 620000, dni: '27-99887766-5', startDate: '2023-05-15', active: true, movements: [] }
        ];
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [viewMode, setViewMode] = useState<'LIST' | 'DETAIL'>('LIST');
    const [isEditing, setIsEditing] = useState(false);

    const [employeeForm, setEmployeeForm] = useState<Partial<Employee>>({
        name: '', position: '', baseSalary: 0, dni: '', startDate: new Date().toISOString().split('T')[0], active: true, movements: []
    });

    const [newMov, setNewMov] = useState<Partial<EmployeeMovement>>({
        type: 'ADVANCE', amount: 0, description: '', month: new Date().toISOString().slice(0, 7), date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        localStorage.setItem('ferrecloud_employees', JSON.stringify(employees));
    }, [employees]);

    const handleOpenAddModal = () => {
        setIsEditing(false);
        setEmployeeForm({ name: '', position: '', baseSalary: 0, dni: '', startDate: new Date().toISOString().split('T')[0], active: true, movements: [] });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (emp: Employee) => {
        setIsEditing(true);
        setEmployeeForm(emp);
        setIsModalOpen(true);
    };

    const handleSaveEmployee = () => {
        if (!employeeForm.name || !employeeForm.baseSalary) {
            alert("Nombre y Sueldo Base son obligatorios.");
            return;
        }

        if (isEditing && employeeForm.id) {
            setEmployees(prev => prev.map(emp => emp.id === employeeForm.id ? { ...emp, ...employeeForm } as Employee : emp));
            // If in detail view, update the current selected employee
            if (selectedEmployee?.id === employeeForm.id) {
                setSelectedEmployee({ ...selectedEmployee, ...employeeForm } as Employee);
            }
        } else {
            const newEmp: Employee = { ...employeeForm as Employee, id: Date.now().toString() };
            setEmployees([...employees, newEmp]);
        }
        
        setIsModalOpen(false);
    };

    const handleDeleteEmployee = (id: string) => {
        const emp = employees.find(e => e.id === id);
        if (confirm(`¿Está seguro que desea eliminar a ${emp?.name}? Esta acción borrará también su historial de pagos.`)) {
            setEmployees(prev => prev.filter(e => e.id !== id));
            if (selectedEmployee?.id === id) setViewMode('LIST');
        }
    };

    const addMovementToEmployee = () => {
        if (!selectedEmployee || !newMov.amount) return;
        const movement: EmployeeMovement = { ...newMov as EmployeeMovement, id: Date.now().toString() };
        const updatedEmployees = employees.map(emp => {
            if (emp.id === selectedEmployee.id) {
                return { ...emp, movements: [movement, ...emp.movements] };
            }
            return emp;
        });
        setEmployees(updatedEmployees);
        setSelectedEmployee({ ...selectedEmployee, movements: [movement, ...selectedEmployee.movements] });
        setIsMovementModalOpen(false);
        setNewMov({ type: 'ADVANCE', amount: 0, description: '', month: new Date().toISOString().slice(0, 7), date: new Date().toISOString().split('T')[0] });
    };

    const getBalanceForMonth = (emp: Employee, month: string) => {
        const monthlyMovs = emp.movements.filter(m => m.month === month);
        const advances = monthlyMovs.filter(m => m.type === 'ADVANCE').reduce((sum, m) => sum + m.amount, 0);
        const bonuses = monthlyMovs.filter(m => m.type === 'BONUS').reduce((sum, m) => sum + m.amount, 0);
        const deductions = monthlyMovs.filter(m => m.type === 'DEDUCTION').reduce((sum, m) => sum + m.amount, 0);
        const salariesPaid = monthlyMovs.filter(m => m.type === 'SALARY').reduce((sum, m) => sum + m.amount, 0);

        const totalSalary = emp.baseSalary + bonuses - deductions;
        const pending = totalSalary - advances - salariesPaid;
        
        return { totalSalary, advances, pending, paid: salariesPaid };
    };

    const currentMonth = new Date().toISOString().slice(0, 7);

    return (
        <div className="p-8 max-w-7xl mx-auto h-full flex flex-col space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Users className="text-blue-600"/> Gestión de Personal y Sueldos
                    </h2>
                    <p className="text-gray-500 text-sm">Carga de empleados, adelantos y liquidación mensual.</p>
                </div>
                {viewMode === 'LIST' ? (
                    <button 
                        onClick={handleOpenAddModal}
                        className="bg-ferre-orange text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-orange-600">
                        <UserPlus size={20}/> Nuevo Empleado
                    </button>
                ) : (
                    <button onClick={() => setViewMode('LIST')} className="text-gray-500 font-bold hover:underline bg-white px-4 py-2 rounded-lg border border-gray-200">Volver al Listado</button>
                )}
            </div>

            {viewMode === 'LIST' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                    {employees.map(emp => {
                        const balance = getBalanceForMonth(emp, currentMonth);
                        return (
                            <div key={emp.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all flex flex-col group relative">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
                                        {emp.name.charAt(0)}
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="flex gap-1 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleOpenEditModal(emp)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDeleteEmployee(emp.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${emp.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {emp.active ? 'ACTIVO' : 'INACTIVO'}
                                        </span>
                                        <p className="text-[10px] text-gray-400 mt-1 font-mono">{emp.dni}</p>
                                    </div>
                                </div>

                                <h3 className="font-bold text-gray-800 text-lg">{emp.name}</h3>
                                <p className="text-xs text-gray-500 mb-6">{emp.position}</p>

                                <div className="space-y-3 flex-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Sueldo Base:</span>
                                        <span className="font-bold text-gray-700">${emp.baseSalary.toLocaleString('es-AR')}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Adelantos {currentMonth}:</span>
                                        <span className="font-bold text-red-500">-${balance.advances.toLocaleString('es-AR')}</span>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex justify-between items-center mt-4">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Resto a Pagar</p>
                                            <p className="text-xl font-bold text-blue-600">${balance.pending.toLocaleString('es-AR')}</p>
                                        </div>
                                        <button 
                                            onClick={() => { setSelectedEmployee(emp); setViewMode('DETAIL'); }}
                                            className="p-2 bg-white text-blue-600 rounded-xl border border-blue-100 shadow-sm hover:bg-blue-600 hover:text-white transition-colors">
                                            <History size={18}/>
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-gray-100 flex gap-2">
                                    <button 
                                        onClick={() => { setSelectedEmployee(emp); setIsMovementModalOpen(true); }}
                                        className="flex-1 bg-slate-900 text-white py-2 rounded-xl text-xs font-bold hover:bg-slate-800 flex items-center justify-center gap-2">
                                        <DollarSign size={14}/> Adelanto / Sueldo
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {employees.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100">
                            <Users size={48} className="mx-auto text-gray-200 mb-4" />
                            <p className="text-gray-400">No hay empleados registrados.</p>
                        </div>
                    )}
                </div>
            ) : (
                selectedEmployee && (
                    <div className="flex gap-8 h-full animate-fade-in">
                        <div className="w-1/3 space-y-6">
                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center relative group">
                                <div className="absolute top-4 right-4 flex gap-2">
                                     <button onClick={() => handleOpenEditModal(selectedEmployee)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                        <Edit2 size={18}/>
                                     </button>
                                     <button onClick={() => handleDeleteEmployee(selectedEmployee.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                        <Trash2 size={18}/>
                                     </button>
                                </div>
                                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-4xl mb-4">
                                    {selectedEmployee.name.charAt(0)}
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800">{selectedEmployee.name}</h3>
                                <p className="text-gray-500">{selectedEmployee.position}</p>
                                <div className="w-full h-px bg-gray-100 my-6"></div>
                                <div className="w-full space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 text-sm">Sueldo Base:</span>
                                        <span className="font-bold text-gray-800">${selectedEmployee.baseSalary.toLocaleString('es-AR')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 text-sm">DNI:</span>
                                        <span className="text-gray-600 font-medium font-mono">{selectedEmployee.dni}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 text-sm">Ingreso:</span>
                                        <span className="text-gray-600 font-medium">{selectedEmployee.startDate}</span>
                                    </div>
                                </div>
                                <button onClick={() => handleOpenEditModal(selectedEmployee)} className="w-full mt-8 bg-slate-100 text-slate-600 py-3 rounded-2xl font-bold hover:bg-slate-200 transition-colors">Editar Perfil</button>
                            </div>

                            <div className="bg-blue-600 text-white p-6 rounded-3xl shadow-lg shadow-blue-200">
                                <p className="text-xs font-bold text-blue-100 uppercase tracking-widest mb-1">Estado Mes Actual</p>
                                <div className="text-3xl font-bold mb-4">${getBalanceForMonth(selectedEmployee, currentMonth).pending.toLocaleString('es-AR')} <span className="text-sm font-normal opacity-70">pendientes</span></div>
                                <button 
                                    onClick={() => setIsMovementModalOpen(true)}
                                    className="w-full bg-white/20 hover:bg-white/30 text-white py-2 rounded-xl text-sm font-bold backdrop-blur-sm transition-colors">
                                    Registrar Pago / Adelanto
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                <h4 className="font-bold text-gray-800 flex items-center gap-2"><Receipt size={20}/> Historial de Movimientos</h4>
                                <div className="flex items-center gap-2 border bg-white rounded-xl px-3 py-1.5 shadow-sm">
                                    <Calendar size={16} className="text-gray-400"/>
                                    <input type="month" className="text-sm font-bold text-gray-700 outline-none" value={currentMonth} />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-6 py-4">Fecha</th>
                                            <th className="px-6 py-4">Tipo</th>
                                            <th className="px-6 py-4">Descripción</th>
                                            <th className="px-6 py-4 text-right">Monto</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {selectedEmployee.movements.map(m => (
                                            <tr key={m.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 text-sm text-gray-500">{m.date}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                                        m.type === 'SALARY' ? 'bg-green-100 text-green-700' : 
                                                        m.type === 'ADVANCE' ? 'bg-orange-100 text-orange-700' : 
                                                        m.type === 'BONUS' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                        {m.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700">{m.description || 'Sin descripción'}</td>
                                                <td className={`px-6 py-4 text-right font-bold ${m.type === 'SALARY' || m.type === 'ADVANCE' ? 'text-orange-600' : m.type === 'BONUS' ? 'text-green-600' : 'text-red-600'}`}>
                                                    ${m.amount.toLocaleString('es-AR')}
                                                </td>
                                            </tr>
                                        ))}
                                        {selectedEmployee.movements.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="p-12 text-center text-gray-400 italic">No hay movimientos en el registro para este empleado.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )
            )}

            {/* MODAL EMPLEADO (ALTA Y EDICIÓN) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
                        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                {isEditing ? <Edit2 size={20}/> : <UserPlus size={20}/>} 
                                {isEditing ? 'Editar Empleado' : 'Alta de Empleado'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)}><X/></button>
                        </div>
                        <div className="p-8 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Completo</label>
                                <input type="text" className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-500 outline-none" value={employeeForm.name} onChange={e => setEmployeeForm({...employeeForm, name: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">DNI / CUIL</label>
                                    <input type="text" className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-500 outline-none" value={employeeForm.dni} onChange={e => setEmployeeForm({...employeeForm, dni: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Puesto / Función</label>
                                    <input type="text" className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-500 outline-none" value={employeeForm.position} onChange={e => setEmployeeForm({...employeeForm, position: e.target.value})} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sueldo Base ($)</label>
                                    <input type="number" className="w-full p-2 border rounded font-bold focus:ring-1 focus:ring-blue-500 outline-none" value={employeeForm.baseSalary} onChange={e => setEmployeeForm({...employeeForm, baseSalary: parseFloat(e.target.value) || 0})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha de Ingreso</label>
                                    <input type="date" className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-500 outline-none" value={employeeForm.startDate} onChange={e => setEmployeeForm({...employeeForm, startDate: e.target.value})} />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 py-2">
                                <input type="checkbox" id="activeEmp" checked={employeeForm.active} onChange={e => setEmployeeForm({...employeeForm, active: e.target.checked})} className="w-4 h-4 text-blue-600" />
                                <label htmlFor="activeEmp" className="text-sm font-medium text-gray-700">Empleado Activo</label>
                            </div>
                            <button onClick={handleSaveEmployee} className="w-full bg-ferre-orange text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-orange-600 transition-all">
                                {isEditing ? 'Guardar Cambios' : 'Crear Registro'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL REGISTRO MOVIMIENTO (ADELANTO/SUELDO) */}
            {isMovementModalOpen && selectedEmployee && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                            <h3 className="font-bold text-lg flex items-center gap-2"><DollarSign/> Pago a {selectedEmployee.name}</h3>
                            <button onClick={() => setIsMovementModalOpen(false)}><X/></button>
                        </div>
                        <div className="p-8 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo de Movimiento</label>
                                <select className="w-full p-2 border rounded" value={newMov.type} onChange={e => setNewMov({...newMov, type: e.target.value as any})}>
                                    <option value="ADVANCE">Adelanto (Pago parcial)</option>
                                    <option value="SALARY">Sueldo / Liquidación final</option>
                                    <option value="BONUS">Premio / Bono</option>
                                    <option value="DEDUCTION">Descuento / Sanción</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Monto ($)</label>
                                <input type="number" className="w-full p-2 border rounded font-bold text-xl text-blue-600" value={newMov.amount} onChange={e => setNewMov({...newMov, amount: parseFloat(e.target.value) || 0})} />
                                {(newMov.type === 'SALARY') && (
                                    <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">Saldo actual mes: ${getBalanceForMonth(selectedEmployee, newMov.month || '').pending.toLocaleString('es-AR')}</p>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mes Correspondiente</label>
                                    <input type="month" className="w-full p-2 border rounded" value={newMov.month} onChange={e => setNewMov({...newMov, month: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha de Operación</label>
                                    <input type="date" className="w-full p-2 border rounded" value={newMov.date} onChange={e => setNewMov({...newMov, date: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Comentarios</label>
                                <input type="text" className="w-full p-2 border rounded" placeholder="Opcional..." value={newMov.description} onChange={e => setNewMov({...newMov, description: e.target.value})} />
                            </div>
                            <button onClick={addMovementToEmployee} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition-all">Confirmar Movimiento</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Employees;
