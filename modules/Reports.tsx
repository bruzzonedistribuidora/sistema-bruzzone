
import React from 'react';
import { BarChart3, TrendingUp, ShoppingBag, FileText, Calculator, Download, ChevronDown } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

const Reports: React.FC = () => {
  const salesData = [
    { name: 'Lun', ventas: 45000, compras: 32000 },
    { name: 'Mar', ventas: 52000, compras: 18000 },
    { name: 'Mie', ventas: 38000, compras: 45000 },
    { name: 'Jue', ventas: 61000, compras: 29000 },
    { name: 'Vie', ventas: 89000, compras: 54000 },
    { name: 'Sab', ventas: 120000, compras: 12000 },
    { name: 'Dom', ventas: 15000, compras: 0 },
  ];

  // Helper function to download a text file
  const downloadTextFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportCitiVentas = () => {
    // Simplified mock data for CITI Ventas (example structure)
    // In a real app, this would come from your Firebase sales data,
    // processed to match AFIP's specific CITI format.
    const citiVentasData = [
      { fecha: '20240501', tipoComp: '01', ptoVenta: '0005', nroComp: '00000001', cuitCli: '20123456789', rsCli: 'Cliente Ejemplo S.R.L.', total: '12100.00', neto: '10000.00', iva: '2100.00' },
      { fecha: '20240502', tipoComp: '01', ptoVenta: '0005', nroComp: '00000002', cuitCli: '20987654321', rsCli: 'Consumidor Final', total: '2420.00', neto: '2000.00', iva: '420.00' },
      { fecha: '20240503', tipoComp: '01', ptoVenta: '0005', nroComp: '00000003', cuitCli: '20112233445', rsCli: 'Empresa Constructora', total: '48400.00', neto: '40000.00', iva: '8400.00' },
    ];

    let citiContent = "FECHA;TIPO_COMP;PTO_VENTA;NRO_COMP;CUIT_CLIENTE;RAZON_SOCIAL_CLIENTE;TOTAL;NETO_GRAVADO;IVA\n";
    citiVentasData.forEach(row => {
      citiContent += `${row.fecha};${row.tipoComp};${row.ptoVenta};${row.nroComp};${row.cuitCli};${row.rsCli};${row.total};${row.neto};${row.iva}\n`;
    });

    const currentDate = new Date();
    const fileName = `CITI_VENTAS_${currentDate.getFullYear()}${(currentDate.getMonth() + 1).toString().padStart(2, '0')}.txt`;
    downloadTextFile(citiContent, fileName, 'text/plain');
    alert('Archivo CITI Ventas generado. Recuerde que este es un formato simplificado de ejemplo.');
  };

  const handleExportCitiCompras = () => {
    // Simplified mock data for CITI Compras (example structure)
    // In a real app, this would come from your Firebase purchase data,
    // processed to match AFIP's specific CITI format.
    const citiComprasData = [
      { fecha: '20240503', tipoComp: '01', ptoVenta: '0001', nroComp: '00000010', cuitProv: '30111222334', rsProv: 'Proveedor Principal S.A.', total: '24200.00', neto: '20000.00', iva: '4200.00' },
      { fecha: '20240504', tipoComp: '01', ptoVenta: '0001', nroComp: '00000011', cuitProv: '30444555667', rsProv: 'Distribuidor SRL', total: '6050.00', neto: '5000.00', iva: '1050.00' },
      { fecha: '20240505', tipoComp: '01', ptoVenta: '0002', nroComp: '00000012', cuitProv: '30998877665', rsProv: 'Mayorista General', total: '18150.00', neto: '15000.00', iva: '3150.00' },
    ];

    let citiContent = "FECHA;TIPO_COMP;PTO_VENTA;NRO_COMP;CUIT_PROVEEDOR;RAZON_SOCIAL_PROVEEDOR;TOTAL;NETO_GRAVADO;IVA\n";
    citiComprasData.forEach(row => {
      citiContent += `${row.fecha};${row.tipoComp};${row.ptoVenta};${row.nroComp};${row.cuitProv};${row.rsProv};${row.total};${row.neto};${row.iva}\n`;
    });

    const currentDate = new Date();
    const fileName = `CITI_COMPRAS_${currentDate.getFullYear()}${(currentDate.getMonth() + 1).toString().padStart(2, '0')}.txt`;
    downloadTextFile(citiContent, fileName, 'text/plain');
    alert('Archivo CITI Compras generado. Recuerde que este es un formato simplificado de ejemplo.');
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Informes y Estadísticas</h1>
          <p className="text-slate-500">Monitorea el rendimiento de tus ventas, compras e IVA.</p>
        </div>
        <button className="bg-white border border-slate-200 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm">
          <Download className="w-5 h-5" /> Exportar a Excel
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Ventas del Mes</p>
          <h3 className="text-2xl font-bold text-slate-800">$1.450.000</h3>
          <p className="text-xs text-green-600 font-bold mt-2">+12% vs mes anterior</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Compras del Mes</p>
          <h3 className="text-2xl font-bold text-slate-800">$980.000</h3>
          <p className="text-xs text-slate-500 mt-2">Margen bruto: 32.4%</p>
        </div>
        <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 shadow-sm">
          <p className="text-xs font-bold text-orange-400 uppercase mb-1">Saldo IVA (Débito)</p>
          <h3 className="text-2xl font-bold text-orange-700">$254.100</h3>
          <p className="text-[10px] text-orange-500 mt-2 uppercase font-bold tracking-wider">A Pagar Proyectado</p>
        </div>
        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
          <p className="text-xs font-bold text-blue-400 uppercase mb-1">Crédito IVA (Compras)</p>
          <h3 className="text-2xl font-bold text-blue-700">$185.300</h3>
          <p className="text-[10px] text-blue-500 mt-2 uppercase font-bold tracking-wider">A Favor</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-slate-800">Análisis Semanal de Operaciones</h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                <span className="w-3 h-3 bg-orange-500 rounded-full"></span> Ventas
              </span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                <span className="w-3 h-3 bg-slate-300 rounded-full"></span> Compras
              </span>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip />
                <Bar dataKey="ventas" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="compras" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Diferencia de IVA</h3>
          <div className="p-6 bg-slate-900 rounded-2xl text-white relative overflow-hidden">
            <Calculator className="absolute top-0 right-0 w-24 h-24 text-white/5 -translate-y-4" />
            <p className="text-slate-400 text-xs font-bold uppercase mb-2">Resultado IVA a Pagar</p>
            <h4 className="text-3xl font-black text-orange-500">$68.800</h4>
            <div className="mt-6 pt-6 border-t border-slate-800 space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">IVA Ventas (21%):</span>
                <span className="font-bold">$254.100</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">IVA Compras (21%):</span>
                <span className="font-bold">$185.300</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-700">Reportes Rápidos</h4>
            {[
              { label: 'Ventas por Marca', icon: ShoppingBag },
              { label: 'Ranking de Productos', icon: TrendingUp },
              { label: 'Libro IVA Ventas (AFIP)', icon: FileText },
              { label: 'Libro IVA Compras', icon: FileText },
              { label: 'CITI IVA Ventas (AFIP)', icon: Download, action: handleExportCitiVentas },
              { label: 'CITI IVA Compras (AFIP)', icon: Download, action: handleExportCitiCompras },
            ].map((rep, i) => (
              <button 
                key={i} 
                onClick={rep.action || (() => alert(`Generar reporte: ${rep.label}`))} 
                className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-sm font-medium"
              >
                <div className="flex items-center gap-3 text-slate-600">
                  <rep.icon className="w-4 h-4" />
                  {rep.label}
                </div>
                {rep.action ? (
                  <Download className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-300" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
