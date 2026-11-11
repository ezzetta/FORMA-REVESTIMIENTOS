(() => {
  let connection;

  function requestResult(request) {
    return new Promise((resolve,reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function open() {
    if (!connection) {
      const request = indexedDB.open('forma-cotizador-presupuestos',1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('quotes',{keyPath:'number'});
        request.result.createObjectStore('versions',{keyPath:['number','revision']});
      };
      connection = requestResult(request).catch(error => { connection = null; throw error; });
    }
    return connection;
  }

  async function list() {
    const db = await open();
    const records = await requestResult(db.transaction('quotes').objectStore('quotes').getAll());
    return records.reverse();
  }

  async function load(number,revision) {
    const db = await open();
    return requestResult(db.transaction('versions').objectStore('versions').get([number,revision]));
  }

  async function save(draft,existingNumber,firstNumber) {
    const db = await open();
    const transaction = db.transaction(['quotes','versions'],'readwrite');
    const completed = new Promise((resolve,reject) => {
      transaction.oncomplete = resolve;
      transaction.onabort = () => reject(transaction.error || new Error('El guardado se interrumpió.'));
    });
    const quotes = transaction.objectStore('quotes');
    const versions = transaction.objectStore('versions');

    async function writeVersion() {
      let number, revision;
      if (existingNumber !== null) {
        const existing = await requestResult(quotes.get(existingNumber));
        if (!existing) throw new Error('Ese presupuesto no está disponible en este navegador.');
        number = existing.number;
        revision = existing.revision + 1;
      } else {
        const last = await requestResult(quotes.openKeyCursor(null,'prev'));
        number = last ? last.primaryKey + 1 : firstNumber;
        if (!Number.isSafeInteger(number) || number < 1) throw new Error('Ingresá un número inicial entero mayor que cero.');
        revision = 0;
      }
      const savedAt = Date.now();
      const record = {number,revision,savedAt,draft};
      versions.add(record);
      quotes.put({number,revision,savedAt,client:draft.fields.client,company:draft.fields.company});
      return record;
    }

    const [record] = await Promise.all([writeVersion(),completed]);
    return record;
  }

  window.FormaQuoteArchive = {list,load,save};
})();
