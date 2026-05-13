import { Sale } from '../types';

let printWarningCallback: (() => void) | null = null;

export function setPrintWarningCallback(callback: () => void) {
  printWarningCallback = callback;
}

export function triggerPrint() {
  if (window !== window.top) {
    if (printWarningCallback) printWarningCallback();
  }
  
  try {
    window.print();
  } catch (e) {
    console.error("Print failed", e);
  }
}

export function printReceipt(sale: Sale) {
  if (window !== window.top) {
    if (printWarningCallback) printWarningCallback();
  }
  const existing = document.getElementById('receipt-print-container');
  if (existing) {
    existing.remove();
  }
  const existingStyle = document.getElementById('receipt-print-style');
  if (existingStyle) {
    existingStyle.remove();
  }

  const container = document.createElement('div');
  container.id = 'receipt-print-container';
  container.className = 'hidden print:block fixed inset-0 bg-white z-[99999] p-4';
  container.style.color = '#000';
  container.style.fontFamily = 'monospace';
  
  const formatValue = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;

  container.innerHTML = `
    <div style="max-width: 300px; margin: 0 auto; font-size: 12px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="font-weight: bold; font-size: 18px; margin-bottom: 5px;">ADEGA MASTER</div>
        <div>Recibo de Venda</div>
        <div>ID: ${sale.id.slice(0, 8).toUpperCase()}</div>
        <div>Data: ${new Date(sale.date).toLocaleString('pt-BR')}</div>
      </div>
      <div style="border-top: 1px dashed #000; margin: 10px 0;"></div>
      <div>
        ${sale.items.map(item => `
          <div style="margin-bottom: 5px;">
            <div style="margin-bottom: 2px;">${item.product.name}</div>
            <div style="display: flex; justify-content: space-between; font-size: 11px;">
              <span>${item.quantity} x ${formatValue(item.product.price)}</span>
              <span>${formatValue(item.subtotal)}</span>
            </div>
          </div>
        `).join('')}
      </div>
      <div style="border-top: 1px dashed #000; margin: 10px 0;"></div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <span>Subtotal</span>
        <span>${formatValue(sale.total)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <span>Desconto</span>
        <span>${formatValue(sale.discount)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-weight: bold; font-size: 14px;">
        <span>TOTAL</span>
        <span>${formatValue(sale.finalTotal)}</span>
      </div>
      <div style="border-top: 1px dashed #000; margin: 10px 0;"></div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <span>Pagamento (${sale.paymentMethod || '-'})</span>
        <span>${formatValue(sale.amountPaid)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <span>Troco</span>
        <span>${formatValue(sale.change)}</span>
      </div>
      <div style="text-align: center; margin-top: 20px; padding-top: 10px; font-weight: bold;">
        <div>Obrigado pela preferência!</div>
        <div style="font-size: 10px; margin-top: 10px; font-weight: normal;">* Não tem valor fiscal *</div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  const style = document.createElement('style');
  style.id = 'receipt-print-style';
  style.innerHTML = `
    @media print {
      #root { display: none !important; }
      body { background: white !important; }
    }
  `;
  document.head.appendChild(style);

  setTimeout(() => {
    try {
      window.print();
    } catch (e) {
      console.error(e);
      alert("A impressão no modo de visualização foi bloqueada. Para imprimir, abra o sistema em uma nova aba completa (clicando no botão no topo direito da tela).");
    }

    setTimeout(() => {
      container.remove();
      style.remove();
    }, 2000); // give enough time for the print dialog to capture the DOM
  }, 100);
}
