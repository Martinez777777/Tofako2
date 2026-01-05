import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { 
  verifyAdminCode, 
  getAppTimerMinutes, 
  getFacilities, 
  getShoppingListFacilities, 
  getShoppingListItems, 
  saveShoppingListItems, 
  getTempShoppingListFacilities, 
  getTempShoppingListItems, 
  saveBioWaste, 
  getBioWaste,
  getPreparationItems,
  getPreparationTimeRanges,
  savePreparation,
  getPreparationHistory,
  saveKvartalSanitation,
  getKvartalSanitationHistory,
  getDailySanitationText,
  saveDailySanitation,
  getDailySanitationHistory,
  saveTemperature,
  getTemperatureHistory,
  getTeplotyConfig,
  saveDPH,
  getDPHHistory,
  saveDPHRaw
} from "./firebase";

import * as XLSX from "xlsx";
import * as ftp from "basic-ftp";
import { format } from "date-fns";
import { sk } from "date-fns/locale";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // No seeding needed for static storage
  
  // Ensure "Dočasné NZ" exists in the menu
  const items = await storage.getMenuItems();
  const existsTemp = items.some(item => item.label === "Dočasné NZ");
  if (!existsTemp) {
    await storage.createMenuItem({ label: "Dočasné NZ", type: "category", icon: "ShoppingCart", order: 5 });
  }

  app.get(api.menu.list.path, async (_req, res) => {
    try {
      const items = await storage.getMenuItems();
      res.json(items);
    } catch (error) {
      console.error("Menu list error:", error);
      res.status(500).json({ error: "Failed to fetch menu items" });
    }
  });

  app.post(api.menu.reset.path, async (_req, res) => {
    // Logic to reset or re-seed if needed, mainly for dev
    await storage.seedMenuItems();
    res.json({ message: "Menu items seeded" });
  });

  app.post("/api/verify-admin-code", async (req, res) => {
    try {
      const { code } = req.body;
      
      if (!code || typeof code !== "string") {
        return res.status(400).json({ error: "Invalid code" });
      }

      const isValid = await verifyAdminCode(code);
      
      if (isValid) {
        res.json({ success: true });
      } else {
        res.status(401).json({ error: "Invalid admin code" });
      }
    } catch (error) {
      console.error("Admin code verification error:", error);
      res.status(500).json({ error: "Verification failed" });
    }
  });

  app.get("/api/timer", async (_req, res) => {
    try {
      const minutes = await getAppTimerMinutes();
      res.json({ minutes });
    } catch (error) {
      console.error("Timer fetch error:", error);
      res.status(500).json({ error: "Failed to fetch timer" });
    }
  });

  app.get("/api/facilities", async (_req, res) => {
    try {
      const facilities = await getFacilities();
      res.json({ facilities });
    } catch (error) {
      console.error("Facilities fetch error:", error);
      res.status(500).json({ error: "Failed to fetch facilities" });
    }
  });

  app.get("/api/shopping-lists/facilities", async (_req, res) => {
    try {
      const facilities = await getShoppingListFacilities();
      res.json({ facilities });
    } catch (error) {
      console.error("Shopping list facilities fetch error:", error);
      res.status(500).json({ error: "Failed to fetch shopping list facilities" });
    }
  });

  app.get("/api/shopping-lists/:facilityId", async (req, res) => {
    try {
      const { facilityId } = req.params;
      const items = await getShoppingListItems(facilityId);
      res.json({ items });
    } catch (error) {
      console.error("Shopping list items fetch error:", error);
      res.status(500).json({ error: "Failed to fetch shopping list items" });
    }
  });

  app.post("/api/shopping-lists/:facilityId", async (req, res) => {
    try {
      const { facilityId } = req.params;
      const { items, date } = req.body;
      
      if (!items || typeof items !== "object") {
        return res.status(400).json({ error: "Invalid items data" });
      }

      // Support both array and object format
      const dataToSave: Record<string, any> = {};
      if (date) {
        dataToSave.date = date;
      }
      if (Array.isArray(items)) {
        dataToSave.items = items;
      } else {
        // Keep old format for backward compatibility
        dataToSave.items = items;
      }

      const success = await saveShoppingListItems(facilityId, dataToSave);
      
      if (success) {
        res.json({ message: "Items saved successfully", items });
      } else {
        res.status(500).json({ error: "Failed to save items" });
      }
    } catch (error) {
      console.error("Shopping list items save error:", error);
      res.status(500).json({ error: "Failed to save shopping list items" });
    }
  });

  app.post("/api/shopping-lists/:facilityId/import", async (req, res) => {
    try {
      const { facilityId } = req.params;
      const { items, date } = req.body;
      
      if (!items || typeof items !== "object") {
        return res.status(400).json({ error: "Invalid items data" });
      }

      // Support both array and object format
      const dataToSave: Record<string, any> = {};
      if (date) {
        dataToSave.date = date;
      }
      if (Array.isArray(items)) {
        dataToSave.items = items;
      } else {
        dataToSave.items = items;
      }

      // Import replaces all existing items
      const success = await saveShoppingListItems(facilityId, dataToSave);
      
      if (success) {
        res.json({ message: "Items imported successfully", items });
      } else {
        res.status(500).json({ error: "Failed to import items" });
      }
    } catch (error) {
      console.error("Shopping list items import error:", error);
      res.status(500).json({ error: "Failed to import shopping list items" });
    }
  });

  app.get("/api/temp-shopping-lists/facilities", async (_req, res) => {
    try {
      const facilities = await getTempShoppingListFacilities();
      res.json({ facilities });
    } catch (error) {
      console.error("Temp shopping list facilities fetch error:", error);
      res.status(500).json({ error: "Failed to fetch temp shopping list facilities" });
    }
  });

  app.get("/api/temp-shopping-lists/:facilityId", async (req, res) => {
    try {
      const { facilityId } = req.params;
      const items = await getTempShoppingListItems(facilityId);
      res.json({ items });
    } catch (error) {
      console.error("Temp shopping list items fetch error:", error);
      res.status(500).json({ error: "Failed to fetch temp shopping list items" });
    }
  });

  app.post("/api/bio-waste/:facilityId", async (req, res) => {
    try {
      const { facilityId } = req.params;
      const { date, amount, unit } = req.body;
      
      if (!facilityId || facilityId === "null" || facilityId === "undefined") {
        return res.status(400).json({ error: "Nie je zvolená prevádzka" });
      }

      const success = await saveBioWaste(facilityId, { date, amount, unit });
      if (success) {
        res.json({ success: true });
      } else {
        res.status(500).json({ error: "Chyba pri ukladaní" });
      }
    } catch (error) {
      res.status(500).json({ error: "Chyba servera" });
    }
  });

  app.get("/api/bio-waste/:facilityId", async (req, res) => {
    try {
      const { facilityId } = req.params;
      const entries = await getBioWaste(facilityId);
      res.json({ entries });
    } catch (error) {
      res.status(500).json({ error: "Chyba pri načítaní" });
    }
  });

  app.get("/api/preparation/items/:facilityId", async (req, res) => {
    try {
      const { facilityId } = req.params;
      const items = await getPreparationItems(facilityId);
      res.json({ items });
    } catch (error) {
      res.status(500).json({ error: "Chyba pri načítaní položiek" });
    }
  });

  app.get("/api/preparation/times/:facilityId", async (req, res) => {
    try {
      const { facilityId } = req.params;
      const times = await getPreparationTimeRanges(facilityId);
      res.json({ times });
    } catch (error) {
      res.status(500).json({ error: "Chyba pri načítaní časov" });
    }
  });

  app.post("/api/preparation/:facilityId", async (req, res) => {
    try {
      const { facilityId } = req.params;
      const { date, time, item } = req.body;
      const success = await savePreparation(facilityId, { date, time, item });
      if (success) res.json({ success: true });
      else res.status(500).json({ error: "Chyba pri ukladaní" });
    } catch (error) {
      res.status(500).json({ error: "Chyba servera" });
    }
  });

  app.get("/api/preparation/:facilityId", async (req, res) => {
    try {
      const { facilityId } = req.params;
      const entries = await getPreparationHistory(facilityId);
      res.json({ entries });
    } catch (error) {
      res.status(500).json({ error: "Chyba pri načítaní histórie" });
    }
  });

  app.post("/api/sanitation/:facilityId", async (req, res) => {
    try {
      const { facilityId } = req.params;
      const { date } = req.body;
      
      if (!facilityId || facilityId === "null" || facilityId === "undefined") {
        return res.status(400).json({ error: "Nie je zvolená prevádzka" });
      }

      const success = await saveKvartalSanitation(facilityId, { date });
      if (success) res.json({ success: true });
      else res.status(500).json({ error: "Chyba pri ukladaní" });
    } catch (error) {
      res.status(500).json({ error: "Chyba servera" });
    }
  });

  app.get("/api/sanitation/:facilityId", async (req, res) => {
    try {
      const { facilityId } = req.params;
      const entries = await getKvartalSanitationHistory(facilityId);
      res.json({ entries });
    } catch (error) {
      res.status(500).json({ error: "Chyba pri načítaní histórie" });
    }
  });

  app.get("/api/daily-sanitation/text/:facilityId", async (req, res) => {
    try {
      const { facilityId } = req.params;
      const text = await getDailySanitationText(facilityId);
      res.json({ text });
    } catch (error) {
      res.status(500).json({ error: "Chyba pri načítaní textu" });
    }
  });

  app.post("/api/daily-sanitation/:facilityId", async (req, res) => {
    try {
      const { facilityId } = req.params;
      const { date, text } = req.body;
      const success = await saveDailySanitation(facilityId, { date, text });
      if (success) res.json({ success: true });
      else res.status(500).json({ error: "Chyba pri ukladaní" });
    } catch (error) {
      res.status(500).json({ error: "Chyba servera" });
    }
  });

  app.get("/api/daily-sanitation/:facilityId", async (req, res) => {
    try {
      const { facilityId } = req.params;
      const entries = await getDailySanitationHistory(facilityId);
      res.json({ entries });
    } catch (error) {
      res.status(500).json({ error: "Chyba pri načítaní histórie" });
    }
  });

  app.get("/api/temperatures/config/:facilityId", async (req, res) => {
    try {
      const { facilityId } = req.params;
      const config = await getTeplotyConfig(facilityId);
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: "Chyba pri načítaní konfigurácie" });
    }
  });

  app.post("/api/temperatures/:facilityId", async (req, res) => {
    try {
      const { facilityId } = req.params;
      const { fridgeNumber, temperature, date, period } = req.body;
      const success = await saveTemperature(facilityId, { fridgeNumber, temperature, date, period });
      if (success) res.json({ success: true });
      else res.status(500).json({ error: "Chyba pri ukladaní" });
    } catch (error) {
      res.status(500).json({ error: "Chyba servera" });
    }
  });

  app.get("/api/temperatures/:facilityId", async (req, res) => {
    try {
      const { facilityId } = req.params;
      const entries = await getTemperatureHistory(facilityId);
      res.json({ entries });
    } catch (error) {
      res.status(500).json({ error: "Chyba pri načítaní histórie" });
    }
  });

  app.get("/api/dph/history/:facilityId", async (req, res) => {
    try {
      const { facilityId } = req.params;
      const entries = await getDPHHistory(facilityId);
      res.json({ entries });
    } catch (error) {
      res.status(500).json({ error: "Chyba pri načítaní histórie" });
    }
  });

  app.get("/api/dph/history/:facilityId", async (req, res) => {
    try {
      const { facilityId } = req.params;
      const entries = await getDPHHistory(facilityId);
      res.json({ entries });
    } catch (error) {
      res.status(500).json({ error: "Chyba pri načítaní histórie" });
    }
  });

  app.post("/api/dph/:facilityId", async (req, res) => {
    try {
      const { facilityId } = req.params;
      const data = req.body;
      
      if (!facilityId || facilityId === "null" || facilityId === "undefined") {
        return res.status(400).json({ error: "Nie je zvolená prevádzka" });
      }

      const history = await getDPHHistory(facilityId);
      const existingEntryIndex = history.findIndex((e: any) => e.datum === data.datum);
      
      if (existingEntryIndex !== -1) {
        history[existingEntryIndex] = data;
      } else {
        history.push(data);
      }

      const success = await saveDPHRaw(facilityId, history);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(500).json({ error: "Chyba pri ukladaní" });
      }
    } catch (error) {
      console.error("DPH save error:", error);
      res.status(500).json({ error: "Chyba servera" });
    }
  });

  app.post("/api/dph/export/:facilityId", async (req, res) => {
    try {
      const { facilityId } = req.params;
      const entries = await getDPHHistory(facilityId);
      
      if (!entries || entries.length === 0) {
        return res.status(400).json({ error: "Žiadne dáta na export" });
      }

      // Sort entries by date
      const sortedEntries = entries.sort((a: any, b: any) => a.datum.localeCompare(b.datum));

      // Prepare data for Excel
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

      // Calculate totals
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

      // Add totals row
      const dataWithTotals = [
        ...excelData,
        {
          ...totals,
          "Dátum": "Celkové súčty"
        },
        {}, // Empty row for spacing
        {
          "5% Základ": facilityId,
          "5% Daň": entries[0]?.dkp || "",
          "19% Základ": format(new Date(), "MMMM", { locale: sk })
        }
      ];

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dataWithTotals);
      XLSX.utils.book_append_sheet(wb, ws, "DPH Export");

      // Set column widths for better readability
      const wscols = [
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }
      ];
      ws['!cols'] = wscols;

      // Generate buffer
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      // FTP Upload
      const client = new ftp.Client();
      client.ftp.verbose = true;
      try {
        await client.access({
          host: "37.9.175.156",
          user: "aplikacia.tofako.sk",
          password: "Aplikacia1", // Heslo je teraz zapísané na tvrdo
          secure: false,
          port: 21
        } as any);

        const monthName = format(new Date(), "MMMM", { locale: sk });
        let fileName = `DPH_${facilityId}_${monthName}.xlsx`;
        
        // Check if file exists and handle renaming
        const list = await client.list("Exporty");
        let counter = 1;
        const originalFileName = fileName.replace(".xlsx", "");
        while (list.some(f => f.name === fileName)) {
          fileName = `${originalFileName}_${counter}.xlsx`;
          counter++;
        }
        
        // Use a temporary path if needed, but basic-ftp can upload from stream/buffer
        const { Readable } = await import("stream");
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);

        // Upload to the Exporty folder (case-sensitive) within the restricted account's view
        await client.uploadFrom(stream, `Exporty/${fileName}`);

        // Clear DPH history for this facility after successful upload
        await saveDPHRaw(facilityId, []);

        res.json({ success: true, fileName });
      } catch (ftpError: any) {
        console.error("FTP Error:", ftpError);
        res.status(500).json({ error: `FTP chyba: ${ftpError.message}` });
      } finally {
        client.close();
      }
    } catch (error: any) {
      console.error("Export error:", error);
      res.status(500).json({ error: "Chyba pri generovaní exportu" });
    }
  });

  return httpServer;
}
