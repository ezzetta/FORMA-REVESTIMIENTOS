(function (root) {
  const number = value => typeof value === 'number' && Number.isFinite(value) ? value : null;
  const round = value => Math.round((value + Number.EPSILON) * 100) / 100;
  function catalog(rows) {
    if (!rows.some(row => row[2] === 'Producto' && row[3] === 'Unidad sin IVA' && row[10] === 'Caja con IVA')) {
      throw new Error('El archivo debe incluir la hoja Lista rápida del cotizador, con sus encabezados.');
    }
    const header = rows.findIndex(row => row[2] === 'Producto');
    return rows.slice(header + 1).filter(row => typeof row[2] === 'string' && row[2].trim()).map((row, index) => {
      const name = row[2].trim().replace(/\s*\n\s*/g, ' · ');
      const presentation = String(row[7] ?? '');
      const pack = presentation.match(/(?:caja|pack)\s*(?:de|[×x])?\s*(\d+)/i);
      const count = pack ? Number(pack[1]) : 1;
      const sale = /caja/i.test(presentation) ? 'Caja' : /pack/i.test(presentation) ? 'Pack' : /rollo/i.test(presentation) ? 'Rollo' : 'Unidad';
      const measure = String(row[8] ?? '');
      const coverage = measure.match(/Rinde:\s*([\d.,]+)\s*(m²|ml)(?:\s|$)/u);
      const yieldPerPiece = coverage ? Number(coverage[1].replace(',', '.')) : null;
      const pieceNet = number(row[3]), pieceGross = number(row[4]);
      const isPack = sale === 'Caja' || sale === 'Pack';
      const saleNet = sale === 'Caja' ? number(row[11]) : pieceNet !== null ? pieceNet * count : null;
      const saleGross = sale === 'Caja' ? number(row[10]) : pieceGross !== null ? pieceGross * count : null;
      const issues = [];
      if (row[13]) issues.push(String(row[13]));
      if (!saleGross || saleNet === null || saleNet <= 0 || saleGross < saleNet || (isPack && !pack)) issues.push('Revisar precio y presentación de venta.');
      if (sale === 'Caja' && saleGross && pieceGross && Math.abs(saleGross - count * pieceGross) > 0.02) issues.push('El importe de caja difiere de unidades × precio unitario. Se usa el importe de caja de la lista.');
      const coverageUnit = coverage?.[2] ?? null;
      if (!coverageUnit && /rinde sin informar/i.test(measure)) issues.push('Falta rendimiento para computar por superficie.');
      const id = JSON.stringify([name, row[9] || '', row[12] || '']);
      return {id, index, name, surface:row[0] || 'Otro', quality:row[1] || '', colors:row[9] || '', measure, sale, count, validPack:!isPack || Boolean(pack),
        pieceNet, pieceGross, saleNet, saleGross, areaNet:number(row[5]), areaGross:number(row[6]),
        coverageUnit, yieldPerPiece, issues};
    });
  }
  function calculate(product, {mode, quantity, length, width, waste = 0, discount = 0}) {
    if (!product.validPack || !product.saleNet || !product.saleGross || product.saleGross < product.saleNet || product.count < 1) throw new Error('La presentación o el precio requieren revisión.');
    const requested = mode === 'room' ? length * width : mode === 'linear' ? length : quantity;
    if (!Number.isFinite(requested) || requested <= 0 || (mode === 'room' && !(length > 0 && width > 0))) throw new Error('Ingresá una cantidad o medidas mayores que cero.');
    if (!(waste >= 0 && waste <= 100 && discount >= 0 && discount <= 100)) throw new Error('La merma y el descuento deben estar entre 0% y 100%.');
    const targetUnit = mode === 'room' || mode === 'area' ? 'm²' : mode === 'linear' ? 'ml' : null;
    const saleYield = product.yieldPerPiece > 0 ? product.yieldPerPiece * product.count : null;
    if (targetUnit && (!saleYield || targetUnit !== product.coverageUnit)) throw new Error(`Falta un rendimiento confirmado en ${targetUnit} para este producto.`);
    const needed = targetUnit ? requested * (1 + waste / 100) : requested;
    const ratio = targetUnit ? needed / saleYield : mode === 'piece' ? needed / product.count : needed;
    const count = Math.max(1, Math.ceil(ratio - Math.min(1e-10, Number.EPSILON * Math.max(1, ratio) * 4)));
    const netBefore = round(count * product.saleNet);
    const net = round(count * product.saleNet * (1 - discount / 100));
    const gross = round(count * product.saleGross * (1 - discount / 100));
    return {mode, requested, targetUnit, needed, count, coverage:saleYield ? count * saleYield : null,
      netBefore, net, gross, tax:round(gross - net), discountValue:round(netBefore - net), discount, waste:targetUnit ? waste : 0};
  }
  root.VitaEngine = {catalog, calculate, round};
  if (typeof module !== 'undefined') module.exports = root.VitaEngine;
})(globalThis);
