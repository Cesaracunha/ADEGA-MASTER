import React, { useState, useMemo } from 'react';
import { useStore } from '../store/StoreContext';
import { format, isToday, parseISO, startOfDay, endOfDay, isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, TrendingUp, ShoppingBag, CreditCard, DollarSign, Package, BarChart2, Printer } from 'lucide-react';
import { Sale } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { triggerPrint } from '../lib/printUtils';

type FilterType = 'hoje' | 'semana' | 'mes' | 'customizado';

export default function Reports() {
  const { sales } = useStore();
  
  const [filterType, setFilterType] = useState<FilterType>('hoje');
  const [startDate, setStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      if (sale.status !== 'Concluída') return false; // consider only completed sales for revenue
      
      const saleDate = parseISO(sale.date);
      const now = new Date();

      switch (filterType) {
        case 'hoje':
          return isToday(saleDate);
        case 'semana':
          return isWithinInterval(saleDate, { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) });
        case 'mes':
          return isWithinInterval(saleDate, { start: startOfMonth(now), end: endOfMonth(now) });
        case 'customizado':
          if (startDate && endDate) {
            return isWithinInterval(saleDate, { 
              start: startOfDay(parseISO(startDate)), 
              end: endOfDay(parseISO(endDate)) 
            });
          }
          return false;
        default:
          return false;
      }
    });
  }, [sales, filterType, startDate, endDate]);

  // Calculations
  const totalRevenue = filteredSales.reduce((acc, sale) => acc + sale.finalTotal, 0);
  const totalTransactions = filteredSales.length;
  const averageTicket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
  
  const totalItemsSold = filteredSales.reduce((acc, sale) => {
    return acc + sale.items.reduce((sum, item) => sum + item.quantity, 0);
  }, 0);

  // Payment methods breakdown
  const paymentMethodsData = useMemo(() => {
    const acc = { "Cartão de Crédito": 0, "Cartão de Débito": 0, "Dinheiro": 0, "PIX": 0 };
    filteredSales.forEach(sale => {
      if (sale.paymentMethod && acc[sale.paymentMethod as keyof typeof acc] !== undefined) {
        acc[sale.paymentMethod as keyof typeof acc] += sale.finalTotal;
      }
    });
    return acc;
  }, [filteredSales]);

  // Top selling products
  const topProducts = useMemo(() => {
    const counts: Record<string, { name: string, quantity: number, revenue: number }> = {};
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!counts[item.id]) {
          counts[item.id] = { name: item.product.name, quantity: 0, revenue: 0 };
        }
        counts[item.id].quantity += item.quantity;
        counts[item.id].revenue += item.subtotal;
      });
    });
    return Object.values(counts).sort((a, b) => b.quantity - a.quantity).slice(0, 10);
  }, [filteredSales]);

  // Chart data
  const chartData = useMemo(() => {
    const dataMap: Record<string, number> = {};
    
    // Initialize map based on filter
    if (filterType === 'hoje') {
      for (let i = 0; i < 24; i += 2) {
        dataMap[`${i.toString().padStart(2, '0')}:00`] = 0;
      }
    } else if (filterType === 'semana') {
      const now = new Date();
      const start = startOfWeek(now, { weekStartsOn: 1 });
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        dataMap[format(d, 'EEEE', { locale: ptBR })] = 0;
      }
    } else if (filterType === 'mes') {
      const now = new Date();
      const start = startOfMonth(now);
      const end = endOfMonth(now);
      const days = end.getDate();
      for (let i = 1; i <= days; i++) {
        dataMap[i.toString()] = 0;
      }
    }

    // Populate data
    filteredSales.forEach(sale => {
      const d = parseISO(sale.date);
      let key = '';
      if (filterType === 'hoje') {
        const hour = d.getHours();
        const binHour = hour % 2 === 0 ? hour : hour - 1; // Grouping by 2 hours for better UI
        key = `${binHour.toString().padStart(2, '0')}:00`;
        if (dataMap[key] === undefined) dataMap[key] = 0;
      } else if (filterType === 'semana') {
        key = format(d, 'EEEE', { locale: ptBR });
      } else if (filterType === 'mes') {
        key = d.getDate().toString();
      } else if (filterType === 'customizado') {
        key = format(d, 'dd/MM');
        if (dataMap[key] === undefined) dataMap[key] = 0;
      }
      
      if (dataMap[key] !== undefined) {
        dataMap[key] += sale.finalTotal;
      }
    });

    // If custom, we might want to sort keys since they are added dynamically
    let finalData = Object.entries(dataMap).map(([name, Total]) => ({ name, Total }));
    if (filterType === 'hoje') {
       // already sorted by initialization
    } else if (filterType === 'customizado') {
      // Customised uses dd/MM which string sort might not work globally if spanning years. But good enough for small ranges.
      finalData.sort((a, b) => {
        const [dayA, monthA] = a.name.split('/');
        const [dayB, monthB] = b.name.split('/');
        if (monthA === monthB) return Number(dayA) - Number(dayB);
        return Number(monthA) - Number(monthB);
      });
    }

    return finalData;
  }, [filteredSales, filterType]);

  return (
    <div className="flex flex-col gap-6 h-full p-4 overflow-auto">
      {/* Header & Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">Relatório de Vendas</h2>
          <button 
            onClick={() => triggerPrint()} 
            className="flex items-center gap-2 bg-red-950 text-white px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-red-800 transition-colors print:hidden"
          >
            <Printer size={16} /> Imprimir
          </button>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 print:hidden">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            {(['hoje', 'semana', 'mes', 'customizado'] as FilterType[]).map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${
                  filterType === type 
                    ? 'bg-white shadow-sm text-red-900 border border-slate-200' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {type === 'hoje' ? 'Dia' : type === 'semana' ? 'Semana' : type === 'mes' ? 'Mês' : 'Personalizado'}
              </button>
            ))}
          </div>

          {filterType === 'customizado' && (
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-sm font-bold text-slate-700 outline-none"
              />
              <span className="text-slate-400">até</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-sm font-bold text-slate-700 outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-red-800 to-red-900 p-6 rounded-xl text-white shadow-lg relative overflow-hidden">
          <DollarSign className="absolute right-4 top-4 opacity-10 text-white" size={80} />
          <h3 className="text-xs font-bold uppercase tracking-widest text-red-200 mb-1">Faturamento Bruto</h3>
          <p className="text-3xl font-black">{totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1 flex items-center gap-2">
            <ShoppingBag size={14} /> Total de Vendas
          </h3>
          <p className="text-3xl font-black text-slate-800">{totalTransactions}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1 flex items-center gap-2">
            <TrendingUp size={14} /> Ticket Médio
          </h3>
          <p className="text-3xl font-black text-slate-800">{averageTicket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1 flex items-center gap-2">
            <Package size={14} /> Itens Vendidos
          </h3>
          <p className="text-3xl font-black text-slate-800">{totalItemsSold}</p>
        </div>
      </div>

      {/* Sales Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-4 flex items-center gap-2">
          <BarChart2 size={16} className="text-red-800" /> Evolução de Vendas
        </h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={(value) => `R$ ${value}`} />
              <Tooltip 
                formatter={(value: number) => [value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 'Faturamento']}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontWeight: 'bold', color: '#1E293B', marginBottom: '8px' }}
                cursor={{ stroke: '#CBD5E1', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Line 
                type="monotone" 
                dataKey="Total" 
                stroke="#991B1B" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#991B1B', strokeWidth: 0 }} 
                activeDot={{ r: 6, strokeWidth: 0, fill: '#DC2626' }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Methods */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-4 flex items-center gap-2">
            <CreditCard size={16} className="text-red-800" /> Faturamento por Forma de Pagamento
          </h3>
          <div className="space-y-4">
            {Object.entries(paymentMethodsData).map(([method, amount]) => (
              <div key={method} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-sm font-bold">
                  <span className="text-slate-600">{method}</span>
                  <span className="text-slate-800">{Number(amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className="bg-red-800 h-2 rounded-full" 
                    style={{ width: `${totalRevenue > 0 ? (Number(amount) / totalRevenue) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-red-800" /> Produtos Mais Vendidos
          </h3>
          
          {topProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    <th className="p-3">Produto</th>
                    <th className="p-3 text-center">Qtd. Vendida</th>
                    <th className="p-3 text-right">Faturamento</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, i) => (
                    <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="p-3 text-sm font-bold text-slate-700">{p.name}</td>
                      <td className="p-3 text-sm font-bold text-slate-600 text-center">{p.quantity}</td>
                      <td className="p-3 text-sm font-bold text-emerald-600 text-right">
                        {p.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-slate-500 py-8 text-sm font-medium">
              Nenhuma venda registrada neste período.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
