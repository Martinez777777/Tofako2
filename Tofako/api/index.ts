import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as XLSX from 'xlsx';
import * as ftp from 'basic-ftp';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';

const FIREBASE_PROJECT_ID = 'dochadzacka-f08af';
const FIREBASE_API_KEY = 'AIzaSyBkXWl0gk86nRZPKxWkWFnHFAmnen_xlrs';

async function firestoreGet(collectionId: string, documentId: string): Promise<any> {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${collectionId}/${documentId}?key=${FIREBASE_API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Firestore GET failed: ${response.status}`);
  }
  const data = await response.json();
  return parseFirestoreDocument(data);
}

async function firestoreSet(collectionId: string, documentId: string, data: any): Promise<void> {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${collectionId}/${documentId}?key=${FIREBASE_API_KEY}`;
  const firestoreData = toFirestoreDocument(data);
  await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: firestoreData })
  });
}

async function firestoreList(collectionId: string): Promise<any[]> {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${collectionId}?key=${FIREBASE_API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) return [];
  const data = await response.json();
  if (!data.documents) return [];
  return data.documents.map((doc: any) => ({
    id: doc.name.split('/').pop(),
    ...parseFirestoreDocument(doc)
  }));
}

function parseFirestoreDocument(doc: any): any {
  if (!doc || !doc.fields) return {};
  const result: any = {};
  for (const [key, value] of Object.entries(doc.fields as Record<string, any>)) {
    result[key] = parseFirestoreValue(value);
  }
  return result;
}

function parseFirestoreValue(value: any): any {
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.integerValue !== undefined) return parseInt(value.integerValue, 10);
  if (value.doubleValue !== undefined) return value.doubleValue;
  if (value.booleanValue !== undefined) return value.booleanValue;
  if (value.nullValue !== undefined) return null;
  if (value.arrayValue !== undefined) {
    return (value.arrayValue.values || []).map(parseFirestoreValue);
  }
  if (value.mapValue !== undefined) {
    return parseFirestoreDocument(value.mapValue);
  }
  return null;
}

function toFirestoreDocument(data: any): any {
  const fields: any = {};
  for (const [key, value] of Object.entries(data)) {
    fields[key] = toFirestoreValue(value);
  }
  return fields;
}

function toFirestoreValue(value: any): any {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return { integerValue: String(value) };
    return { doubleValue: value };
  }
  if (typeof value === 'boolean') return { booleanValue: value };
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toFirestoreValue) } };
  }
  if (typeof value === 'object') {
    return { mapValue: { fields: toFirestoreDocument(value) } };
  }
  return { stringValue: String(value) };
}

const menuData = [
  { "id": 1, "label": "Kontrola - Prehľady", "type": "category", "icon": "ClipboardList", "order": 1, "parentId": null },
  { "id": 2, "label": "Dokumenty", "type": "category", "icon": "FileText", "order": 2, "parentId": null },
  { "id": 3, "label": "Prevádzka", "type": "category", "icon": "Factory", "order": 3, "parentId": null },
  { "id": 4, "label": "Nákupné zoznamy", "type": "category", "icon": "ShoppingCart", "order": 4, "parentId": null },
  { "id": 5, "label": "Dočasné NZ", "type": "category", "icon": "ShoppingCart", "order": 5, "parentId": null },
  { "id": 6, "label": "DPH", "type": "action", "parentId": 3, "order": 0, "icon": null, "url": null },
  { "id": 7, "label": "Teploty", "type": "action", "parentId": 3, "order": 1, "icon": null, "url": null },
  { "id": 8, "label": "Denná sanitácia", "type": "action", "parentId": 3, "order": 2, "icon": null, "url": null },
  { "id": 9, "label": "Kvartálna sanitácia", "type": "action", "parentId": 3, "order": 3, "icon": null, "url": null },
  { "id": 10, "label": "BioOdpad", "type": "action", "parentId": 3, "order": 4, "icon": null, "url": null },
  { "id": 11, "label": "Príprava", "type": "action", "parentId": 3, "order": 5, "icon": null, "url": null },
  { "id": 12, "label": "TvorbaBioOdpadu - Kontrola", "type": "action", "parentId": 1, "order": 1, "icon": null, "url": null },
  { "id": 13, "label": "Denná Sanitácia - Kontrola", "type": "action", "parentId": 1, "order": 2, "icon": null, "url": null },
  { "id": 14, "label": "Príprava - Kontrola", "type": "action", "parentId": 1, "order": 3, "icon": null, "url": null },
  { "id": 15, "label": "Kvartálna sanitácia - Kontrola", "type": "action", "parentId": 1, "order": 4, "icon": null, "url": null },
  { "id": 16, "label": "Teploty - Kontrola", "type": "action", "parentId": 1, "order": 5, "icon": null, "url": null },
  { "id": 17, "label": "Merkur Košice zoznam", "type": "action", "parentId": 4, "order": 1, "icon": null, "url": null },
  { "id": 18, "label": "SLSP Sečovce Zoznam", "type": "action", "parentId": 4, "order": 2, "icon": null, "url": null },
  { "id": 19, "label": "SAD VT Zoznam", "type": "action", "parentId": 4, "order": 3, "icon": null, "url": null },
  { "id": 20, "label": "Pošta KE Zoznam", "type": "action", "parentId": 4, "order": 4, "icon": null, "url": null },
  { "id": 21, "label": "Prehľad výroby", "type": "link", "url": "https://dochadzka.tofako.sk/Dokumenty/prehlad_vyroby.pdf", "parentId": 2, "order": 1, "icon": null },
  { "id": 22, "label": "Manuál zamestnanci", "type": "link", "url": "https://dochadzka.tofako.sk/Dokumenty/manual_zamestnanci.pdf", "parentId": 2, "order": 2, "icon": null },
  { "id": 23, "label": "Manuál dodák", "type": "link", "url": "https://dochadzka.tofako.sk/Dokumenty/manual_dodak.pdf", "parentId": 2, "order": 3, "icon": null },
  { "id": 24, "label": "Manuál prepravky", "type": "link", "url": "https://dochadzka.tofako.sk/Dokumenty/manual_prepravky.pdf", "parentId": 2, "order": 4, "icon": null },
  { "id": 25, "label": "Receptúry bar", "type": "link", "url": "https://dochadzka.tofako.sk/Dokumenty/Receptury_bar.pdf", "parentId": 2, "order": 5, "icon": null },
  { "id": 26, "label": "Zloženie chlebíčky a bagety", "type": "link", "url": "https://dochadzka.tofako.sk/Dokumenty/prehlad_chlebicky.pdf", "parentId": 2, "order": 6, "icon": null },
  { "id": 27, "label": "Zloženie pečiva", "type": "link", "url": "https://dochadzka.tofako.sk/Dokumenty/zlozenie_peciva.pdf", "parentId": 2, "order": 7, "icon": null }
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let url = req.url || '';
  if (!url.startsWith('/api')) {
    url = '/api' + (url.startsWith('/') ? url : '/' + url);
  }
  url = url.split('?')[0];
  const method = req.method || 'GET';

  try {
    if (url.includes('/api/menu') && method === 'GET') {
      return res.json(menuData.sort((a, b) => a.order - b.order));
    }

    if (url.includes('/api/timer') && method === 'GET') {
      const data = await firestoreGet("Global", "Casovac_aplikacia");
      if (data) {
        const minutes = parseInt(data.cas, 10);
        return res.json({ minutes: isNaN(minutes) ? 0 : minutes });
      }
      return res.json({ minutes: 0 });
    }

    if (url.includes('/api/verify-admin-code') && method === 'POST') {
      const { code } = req.body;
      if (!code) return res.status(400).json({ error: "Invalid code" });
      
      const data = await firestoreGet("Global", "adminCode");
      if (data && data.adminCode === code) {
        return res.json({ success: true });
      }
      return res.status(401).json({ error: "Invalid admin code" });
    }

    if (url.includes('/api/facilities') && method === 'GET') {
      const data = await firestoreGet("Global", "Prevadzky");
      return res.json({ facilities: data || {} });
    }

    if (url.includes('/api/shopping-lists/facilities') && method === 'GET') {
      const docs = await firestoreList("Nakupne_zoznamy");
      const facilities: Record<string, string> = {};
      docs.forEach(d => { facilities[d.id] = d.id; });
      return res.json({ facilities });
    }

    const shoppingListMatch = url.match(/\/api\/shopping-lists\/([^\/]+)$/);
    if (shoppingListMatch) {
      const facilityId = decodeURIComponent(shoppingListMatch[1]);
      
      if (method === 'GET') {
        const data = await firestoreGet("Nakupne_zoznamy", facilityId);
        return res.json({ items: data || {} });
      }
      
      if (method === 'POST') {
        const { items, date } = req.body;
        const dataToSave: any = { items };
        if (date) dataToSave.date = date;
        
        await firestoreSet("Nakupne_zoznamy", facilityId, dataToSave);
        
        if (items && Array.isArray(items) && items.some((item: any) => item.quantity !== undefined && item.quantity !== "")) {
          await firestoreSet("Docasne_Nakupne_Zoznamy", facilityId, dataToSave);
        }
        
        return res.json({ message: "Items saved successfully", items });
      }
    }

    if (url.includes('/api/temp-shopping-lists/facilities') && method === 'GET') {
      const docs = await firestoreList("Docasne_Nakupne_Zoznamy");
      const facilities: Record<string, string> = {};
      docs.forEach(d => { facilities[d.id] = d.id; });
      return res.json({ facilities });
    }

    const tempShoppingListMatch = url.match(/\/api\/temp-shopping-lists\/([^\/]+)$/);
    if (tempShoppingListMatch && method === 'GET') {
      const facilityId = decodeURIComponent(tempShoppingListMatch[1]);
      const data = await firestoreGet("Docasne_Nakupne_Zoznamy", facilityId);
      return res.json({ items: data || {} });
    }

    const bioWasteMatch = url.match(/\/api\/bio-waste\/([^\/]+)$/);
    if (bioWasteMatch) {
      const facilityId = decodeURIComponent(bioWasteMatch[1]);
      
      if (method === 'GET') {
        const data = await firestoreGet(facilityId, "Bioodpad");
        return res.json({ entries: data?.entries || [] });
      }
      
      if (method === 'POST') {
        const { date, amount, unit } = req.body;
        const existing = await firestoreGet(facilityId, "Bioodpad");
        const entries = existing?.entries || [];
        entries.push({ date, amount, unit });
        await firestoreSet(facilityId, "Bioodpad", { entries });
        return res.json({ success: true });
      }
    }

    const prepItemsMatch = url.match(/\/api\/preparation\/items\/([^\/]+)$/);
    if (prepItemsMatch && method === 'GET') {
      const facilityId = decodeURIComponent(prepItemsMatch[1]);
      const data = await firestoreGet(facilityId, "Text_KrajaneVeci");
      if (data) {
        return res.json({ items: Object.values(data).filter(v => typeof v === "string") });
      }
      return res.json({ items: [] });
    }

    const prepTimesMatch = url.match(/\/api\/preparation\/times\/([^\/]+)$/);
    if (prepTimesMatch && method === 'GET') {
      const facilityId = decodeURIComponent(prepTimesMatch[1]);
      const data = await firestoreGet(facilityId, "Cas_KrajaneVeci");
      if (data) {
        return res.json({ times: { start: data.Zaciatok || "00:00", end: data.Koniec || "23:59" } });
      }
      return res.json({ times: null });
    }

    const prepMatch = url.match(/\/api\/preparation\/([^\/]+)$/);
    if (prepMatch) {
      const facilityId = decodeURIComponent(prepMatch[1]);
      
      if (method === 'GET') {
        const data = await firestoreGet(facilityId, "Krajane_veci");
        return res.json({ entries: data?.entries || [] });
      }
      
      if (method === 'POST') {
        const { date, time, item } = req.body;
        const existing = await firestoreGet(facilityId, "Krajane_veci");
        const entries = existing?.entries || [];
        entries.push({ date, time, item });
        await firestoreSet(facilityId, "Krajane_veci", { entries });
        return res.json({ success: true });
      }
    }

    const sanitationMatch = url.match(/\/api\/sanitation\/([^\/]+)$/);
    if (sanitationMatch) {
      const facilityId = decodeURIComponent(sanitationMatch[1]);
      
      if (method === 'GET') {
        const data = await firestoreGet(facilityId, "Kvartalna_Sanitacia");
        return res.json({ entries: data?.entries || [] });
      }
      
      if (method === 'POST') {
        const { date } = req.body;
        const existing = await firestoreGet(facilityId, "Kvartalna_Sanitacia");
        const entries = existing?.entries || [];
        entries.push({ date });
        await firestoreSet(facilityId, "Kvartalna_Sanitacia", { entries });
        return res.json({ success: true });
      }
    }

    const dailySanTextMatch = url.match(/\/api\/daily-sanitation\/text\/([^\/]+)$/);
    if (dailySanTextMatch && method === 'GET') {
      const facilityId = decodeURIComponent(dailySanTextMatch[1]);
      const data = await firestoreGet(facilityId, "Text_Denna_Sanitacia");
      return res.json({ text: data?.sadsa || "" });
    }

    const dailySanMatch = url.match(/\/api\/daily-sanitation\/([^\/]+)$/);
    if (dailySanMatch) {
      const facilityId = decodeURIComponent(dailySanMatch[1]);
      
      if (method === 'GET') {
        const data = await firestoreGet(facilityId, "Denna_Sanitacia");
        return res.json({ entries: data?.entries || [] });
      }
      
      if (method === 'POST') {
        const { date, text } = req.body;
        const existing = await firestoreGet(facilityId, "Denna_Sanitacia");
        const entries = existing?.entries || [];
        entries.push({ date, text });
        await firestoreSet(facilityId, "Denna_Sanitacia", { entries });
        return res.json({ success: true });
      }
    }

    const tempConfigMatch = url.match(/\/api\/temperatures\/config\/([^\/]+)$/);
    if (tempConfigMatch && method === 'GET') {
      const facilityId = decodeURIComponent(tempConfigMatch[1]);
      
      const fridgeData = await firestoreGet(facilityId, "Pocet_chladniciek");
      let fridgeCount = 0;
      if (fridgeData) {
        const rawCount = fridgeData.pocet || fridgeData.Pocet || fridgeData.count || fridgeData.sadsa || 
                         Object.values(fridgeData).find(v => !isNaN(parseInt(String(v), 10)));
        fridgeCount = parseInt(String(rawCount || "0"), 10);
      }
      
      const rangeData = await firestoreGet(facilityId, "Teploty_rozsah");
      let range = { start: 0, end: 10 };
      if (rangeData) {
        range = {
          start: parseInt(rangeData.Zaciatok || "0", 10),
          end: parseInt(rangeData.Koniec || "10", 10)
        };
      }
      
      return res.json({ fridgeCount, range });
    }

    const tempMatch = url.match(/\/api\/temperatures\/([^\/]+)$/);
    if (tempMatch) {
      const facilityId = decodeURIComponent(tempMatch[1]);
      
      if (method === 'GET') {
        const data = await firestoreGet(facilityId, "Teploty");
        return res.json({ entries: data?.entries || [] });
      }
      
      if (method === 'POST') {
        const { fridgeNumber, temperature, date, period } = req.body;
        const existing = await firestoreGet(facilityId, "Teploty");
        let entries = existing?.entries || [];
        
        const existingIndex = entries.findIndex((entry: any) => {
          const sameDate = new Date(entry.date).toISOString().split('T')[0] === new Date(date).toISOString().split('T')[0];
          return sameDate && entry.fridgeNumber === fridgeNumber && entry.period === period;
        });
        
        if (existingIndex !== -1) {
          entries[existingIndex] = { fridgeNumber, temperature, date, period };
        } else {
          entries.push({ fridgeNumber, temperature, date, period });
        }
        
        await firestoreSet(facilityId, "Teploty", { entries });
        return res.json({ success: true });
      }
    }

    const dphHistoryMatch = url.match(/\/api\/dph\/history\/([^\/]+)$/);
    if (dphHistoryMatch && method === 'GET') {
      const facilityId = decodeURIComponent(dphHistoryMatch[1]);
      const data = await firestoreGet(facilityId, "DPH");
      return res.json({ entries: data?.entries || [] });
    }

    const dphExportMatch = url.match(/\/api\/dph\/export\/([^\/]+)$/);
    if (dphExportMatch && method === 'POST') {
      const facilityId = decodeURIComponent(dphExportMatch[1]);
      const data = await firestoreGet(facilityId, "DPH");
      const entries = data?.entries || [];
      
      if (entries.length === 0) {
        return res.status(400).json({ error: "Žiadne dáta na export" });
      }

      const sortedEntries = entries.sort((a: any, b: any) => a.datum.localeCompare(b.datum));
      const excelData = sortedEntries.map((e: any) => ({
        "5% Základ": e.dph5Zaklad || 0,
        "5% Daň": e.dph5Dan || 0,
        "19% Základ": e.dph19Zaklad || 0,
        "19% Daň": e.dph19Dan || 0,
        "0% Základ": e.dph0Zaklad || 0,
        "23% Základ": e.dph23Zaklad || 0,
        "23% Daň": e.dph23Dan || 0,
        "Kredit": e.kreditnaKarta || 0,
        "Tržba spolu": e.trzbaSpolu || 0,
        "Dátum": format(new Date(e.datum), "dd.MM.yyyy")
      }));

      const totals = sortedEntries.reduce((acc: any, e: any) => ({
        "5% Základ": acc["5% Základ"] + (e.dph5Zaklad || 0),
        "5% Daň": acc["5% Daň"] + (e.dph5Dan || 0),
        "19% Základ": acc["19% Základ"] + (e.dph19Zaklad || 0),
        "19% Daň": acc["19% Daň"] + (e.dph19Dan || 0),
        "0% Základ": acc["0% Základ"] + (e.dph0Zaklad || 0),
        "23% Základ": acc["23% Základ"] + (e.dph23Zaklad || 0),
        "23% Daň": acc["23% Daň"] + (e.dph23Dan || 0),
        "Kredit": acc["Kredit"] + (e.kreditnaKarta || 0),
        "Tržba spolu": acc["Tržba spolu"] + (e.trzbaSpolu || 0)
      }), {
        "5% Základ": 0, "5% Daň": 0, "19% Základ": 0, "19% Daň": 0,
        "0% Základ": 0, "23% Základ": 0, "23% Daň": 0, "Kredit": 0, "Tržba spolu": 0
      });

      const dataWithTotals = [
        ...excelData,
        { ...totals, "Dátum": "Celkové súčty" },
        {},
        { "5% Základ": facilityId, "5% Daň": entries[0]?.dkp || "", "19% Základ": format(new Date(), "MMMM", { locale: sk }) }
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dataWithTotals);
      XLSX.utils.book_append_sheet(wb, ws, "DPH Export");
      ws['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      const client = new ftp.Client();
      try {
        await client.access({
          host: "37.9.175.156",
          user: "aplikacia.tofako.sk",
          password: "Aplikacia1",
          secure: false,
          port: 21
        } as any);

        const monthName = format(new Date(), "MMMM", { locale: sk });
        let fileName = `DPH_${facilityId}_${monthName}.xlsx`;
        const list = await client.list("Exporty");
        let counter = 1;
        const originalFileName = fileName.replace(".xlsx", "");
        while (list.some(f => f.name === fileName)) {
          fileName = `${originalFileName}_${counter}.xlsx`;
          counter++;
        }
        
        const { Readable } = await import("stream");
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);
        await client.uploadFrom(stream, `Exporty/${fileName}`);
        await firestoreSet(facilityId, "DPH", { entries: [] });
        return res.json({ success: true, fileName });
      } catch (ftpError: any) {
        return res.status(500).json({ error: `FTP chyba: ${ftpError.message}` });
      } finally {
        client.close();
      }
    }

    const dphMatch = url.match(/\/api\/dph\/([^\/]+)$/);
    if (dphMatch && method === 'POST') {
      const facilityId = decodeURIComponent(dphMatch[1]);
      const newData = req.body;
      const existing = await firestoreGet(facilityId, "DPH");
      let entries = existing?.entries || [];
      
      const existingEntryIndex = entries.findIndex((e: any) => e.datum === newData.datum);
      if (existingEntryIndex !== -1) {
        entries[existingEntryIndex] = newData;
      } else {
        entries.push(newData);
      }
      
      await firestoreSet(facilityId, "DPH", { entries });
      return res.json({ success: true });
    }

    return res.status(404).json({ error: "Not found" });
  } catch (error: any) {
    console.error("API Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
