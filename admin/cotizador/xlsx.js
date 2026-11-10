(function (root) {
  const utf8 = new TextDecoder();
  function zip(buffer) {
    const view = new DataView(buffer), bytes = new Uint8Array(buffer);
    let end = buffer.byteLength - 22;
    while (end >= Math.max(0, buffer.byteLength - 65557) && view.getUint32(end, true) !== 0x06054b50) end--;
    if (end < 0 || view.getUint32(end, true) !== 0x06054b50) throw new Error('El archivo no es un Excel .xlsx válido.');
    const files = new Map();
    let cursor = view.getUint32(end + 16, true);
    const count = view.getUint16(end + 10, true);
    for (let i = 0; i < count; i++) {
      if (view.getUint32(cursor, true) !== 0x02014b50) throw new Error('No se pudo leer el archivo de Excel.');
      const method = view.getUint16(cursor + 10, true), size = view.getUint32(cursor + 20, true), expanded = view.getUint32(cursor + 24, true);
      const nameLength = view.getUint16(cursor + 28, true), extra = view.getUint16(cursor + 30, true), comment = view.getUint16(cursor + 32, true);
      const offset = view.getUint32(cursor + 42, true);
      const name = utf8.decode(bytes.subarray(cursor + 46, cursor + 46 + nameLength));
      const start = offset + 30 + view.getUint16(offset + 26, true) + view.getUint16(offset + 28, true);
      files.set(name, {method, size, start, expanded});
      cursor += 46 + nameLength + extra + comment;
    }
    return async function read(name, required = true) {
      const entry = files.get(name);
      if (!entry && !required) return '';
      if (!entry || entry.expanded > 20_000_000) throw new Error('No se pudo leer una sección del Excel.');
      const data = bytes.subarray(entry.start, entry.start + entry.size);
      if (entry.method === 0) return utf8.decode(data);
      if (entry.method !== 8) throw new Error('Formato de compresión no compatible.');
      return new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
    };
  }
  function xml(text) {
    const doc = new DOMParser().parseFromString(text, 'application/xml');
    if (doc.querySelector('parsererror')) throw new Error('El archivo contiene una hoja que no se puede leer.');
    return doc;
  }
  const tags = (node, name) => [...node.getElementsByTagNameNS('*', name)];
  const strings = node => tags(node,'t').map(t => t.textContent).join('');
  async function readCatalog(file) {
    if (!file || file.size < 22 || file.size > 25_000_000) throw new Error('Elegí un Excel .xlsx de hasta 25 MB.');
    const read = zip(await file.arrayBuffer());
    const workbook = xml(await read('xl/workbook.xml'));
    const sheet = tags(workbook,'sheet').find(s => s.getAttribute('name').toLowerCase() === 'lista rápida');
    if (!sheet) throw new Error('El Excel debe incluir la hoja Lista rápida.');
    const id = sheet.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id');
    const rel = tags(xml(await read('xl/_rels/workbook.xml.rels')),'Relationship').find(r => r.getAttribute('Id') === id);
    if (!rel) throw new Error('No se encontró la hoja Lista rápida.');
    const path = new URL(rel.getAttribute('Target'), 'https://excel.invalid/xl/workbook.xml').pathname.slice(1);
    const shared = await read('xl/sharedStrings.xml',false);
    const pool = shared ? tags(xml(shared),'si').map(strings) : [];
    const rows = tags(xml(await read(path)),'row').map(row => {
      const result = [];
      for (const cell of tags(row,'c')) {
        const letters = cell.getAttribute('r')?.match(/^[A-Z]+/)?.[0];
        if (!letters) continue;
        const col = [...letters].reduce((n,c) => n * 26 + c.charCodeAt(0)-64,0)-1;
        if (col > 19) continue;
        const value = tags(cell,'v')[0]?.textContent;
        const type = cell.getAttribute('t');
        result[col] = type === 's' ? pool[Number(value)] : type === 'inlineStr' ? strings(cell) : type === 'str' ? value : type === 'e' || value === undefined ? null : Number(value);
      }
      return result;
    });
    return root.VitaEngine.catalog(rows);
  }
  root.VitaWorkbook = {readCatalog};
})(globalThis);
