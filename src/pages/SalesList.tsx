import React, { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { format } from 'date-fns';
import { FileSearch, Printer } from 'lucide-react';
import { printReceipt } from '../lib/printUtils';

export default function SalesList() {
  const { sales, updateSaleStatus } = useStore();
  const [filter, setFilter] = useState<'Todas' | 'Pendente' | 'Concluída' | 'Cancelada'>('Todas');

  const filteredSales = sales.filter(s => filter === 'Todas' || s.status === filter);

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-2rem)]">
      <div className="flex justify-between items-end mb-2 shrink-0">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Histórico de Vendas</h2>
          <p className="text-slate-500 mt-1 text-xs font-bold uppercase tracking-widest">Acompanhamento e Listagem Geral</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col min-h-0">
        {/* Filtros */}
        <div className="p-3 border-b border-slate-100 bg-slate-50 flex gap-2 w-full overflow-x-auto shrink-0">
          {['Todas', 'Concluída', 'Pendente', 'Cancelada'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`px-3 py-1.5 rounded text-[10px] uppercase font-black tracking-widest transition-colors border whitespace-nowrap ${
                filter === status 
                ? 'bg-slate-800 text-white border-slate-800 shadow-sm' 
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-3">Data/Hora</th>
                <th className="p-3">Itens</th>
                <th className="p-3">Pagamento</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {filteredSales.slice().reverse().map(sale => (
                <tr key={sale.id} className="hover:bg-slate-50">
                  <td className="p-3 font-medium text-slate-800 whitespace-nowrap">{format(new Date(sale.date), "dd/MM/yyyy HH:mm")}</td>
                  <td className="p-3 text-xs">
                    <div className="max-w-[200px] truncate text-slate-600">
                      {sale.items.map(i => `${i.quantity}x ${i.product.name}`).join(', ')}
                    </div>
                  </td>
                  <td className="p-3 text-[10px] font-bold uppercase text-slate-500">{sale.paymentMethod || '-'}</td>
                  <td className="p-3 text-right font-black text-emerald-700">R$ {sale.finalTotal.toFixed(2)}</td>
                  <td className="p-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                      sale.status === 'Concluída' ? 'bg-emerald-100 text-emerald-800' :
                      sale.status === 'Pendente' ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {sale.status}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button onClick={() => printReceipt(sale)} className="text-[10px] text-slate-500 uppercase font-black tracking-widest hover:text-slate-800 transition-colors inline-flex items-center gap-1" title="Imprimir Recibo">
                      <Printer size={14} /> Imprimir
                    </button>
                    {sale.status === 'Pendente' && (
                      <button onClick={() => updateSaleStatus(sale.id, 'Concluída')} className="text-[10px] text-emerald-600 uppercase font-black tracking-widest hover:underline ml-2">
                        Concluir
                      </button>
                    )}
                    {sale.status !== 'Cancelada' && (
                      <button onClick={() => updateSaleStatus(sale.id, 'Cancelada')} className="text-[10px] text-red-500 uppercase font-black tracking-widest hover:underline ml-2">
                        Cancelar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                    Nenhum registro encontrado para este filtro
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
