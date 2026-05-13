import React from 'react';
import { useStore } from '../store/StoreContext';
import { 
  TrendingUp, 
  ShoppingCart, 
  Wallet, 
  Package,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { format, isToday } from 'date-fns';

export default function Dashboard() {
  const { sales, vales, products } = useStore();

  const completedSales = sales.filter(s => s.status === 'Concluída');
  const todaysSales = completedSales.filter(s => isToday(new Date(s.date)));
  
  const todayRevenue = todaysSales.reduce((acc, sale) => acc + sale.finalTotal, 0);
  const totalRevenue = completedSales.reduce((acc, sale) => acc + sale.finalTotal, 0);
  
  const pendingValesTotal = vales.filter(v => v.status === 'Pendente').reduce((acc, vale) => acc + vale.total, 0);
  const lowStockProducts = products.filter(p => p.stock <= 5);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Dashboard</h2>
          <p className="text-slate-500 mt-1 text-xs font-bold uppercase tracking-widest">Resumo Comercial e Operacional</p>
        </div>
      </div>

      {/* Stats Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-none">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col justify-center">
          <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider flex items-center justify-between">
            Vendas Hoje
            <TrendingUp size={16} />
          </span>
          <span className="text-3xl font-black text-emerald-800 mt-1">R$ {todayRevenue.toFixed(2)}</span>
          <span className="text-xs font-bold text-emerald-600 mt-2">{todaysSales.length} concluídas</span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-center">
          <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider flex items-center justify-between">
            Receita Total Acumulada
            <Wallet size={16} />
          </span>
          <span className="text-3xl font-black text-slate-800 mt-1">R$ {totalRevenue.toFixed(2)}</span>
          <span className="text-xs font-bold text-slate-500 mt-2">{completedSales.length} no total</span>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col justify-center">
          <span className="text-[10px] text-red-700 font-bold uppercase tracking-wider flex items-center justify-between">
            Vales Pendentes (Fiado)
            <ShoppingCart size={16} />
          </span>
          <span className="text-3xl font-black text-red-800 mt-1">R$ {pendingValesTotal.toFixed(2)}</span>
          <span className="text-xs font-bold text-red-600 mt-2">{vales.filter(v => v.status === 'Pendente').length} abertos</span>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col justify-center">
          <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider flex items-center justify-between">
            Estoque Crítico
            <Package size={16} />
          </span>
          <span className="text-3xl font-black text-amber-800 mt-1">{lowStockProducts.length} <span className="text-lg">Itens</span></span>
          <span className="text-xs font-bold text-amber-600 mt-2">&le; 5 unidades</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 overflow-hidden">
        {/* Recent Sales */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Vendas Recentes</h3>
          </div>
          <div className="flex-1 overflow-auto">
            {completedSales.length === 0 ? (
              <p className="text-slate-400 text-center py-6 text-sm font-bold uppercase tracking-widest">Nenhuma venda</p>
            ) : (
              <table className="w-full text-left border-collapse min-w-[300px]">
                <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 sticky top-0">
                  <tr>
                    <th className="p-3">Data</th>
                    <th className="p-3">Método</th>
                    <th className="p-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100">
                  {completedSales.slice().reverse().slice(0, 10).map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-700">{format(new Date(sale.date), "dd/MM HH:mm")}</td>
                      <td className="p-3 text-[10px] font-bold text-slate-500 uppercase">{sale.paymentMethod}</td>
                      <td className="p-3 text-right font-black text-emerald-700">R$ {sale.finalTotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-100 bg-amber-50 flex justify-between items-center">
            <h3 className="text-[10px] font-black uppercase text-amber-700 tracking-widest">Atenção ao Estoque</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {lowStockProducts.length === 0 ? (
              <p className="text-slate-400 text-center py-6 text-sm font-bold uppercase tracking-widest">Estoque Regular</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 sticky top-0">
                  <tr>
                    <th className="p-3">Produto</th>
                    <th className="p-3">Código</th>
                    <th className="p-3 text-right">Qtd</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100">
                  {lowStockProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-800">{product.name}</td>
                      <td className="p-3 text-xs text-slate-400 font-mono">{product.barcode}</td>
                      <td className="p-3 text-right">
                        <span className={`font-black px-2 py-1 rounded ${product.stock === 0 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                          {product.stock} un
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
