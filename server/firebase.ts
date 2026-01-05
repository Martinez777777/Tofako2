let firebaseApp: any = null;
let db: any = null;

export async function initializeFirebase() {
  if (firebaseApp) return;

  try {
    const { initializeApp } = await import("firebase/app");
    const firebaseConfig = {
      apiKey: "AIzaSyBkXWl0gk86nRZPKxWkWFnHFAmnen_xlrs",
      authDomain: "dochadzacka-f08af.firebaseapp.com",
      projectId: "dochadzacka-f08af",
      storageBucket: "dochadzacka-f08af.firebasestorage.app",
      messagingSenderId: "303356789380",
      appId: "1:303356789380:android:25ae4982efd616d84178d1"
    };

    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      console.warn("Firebase not fully configured - admin code verification disabled");
      return;
    }

    firebaseApp = initializeApp(firebaseConfig);
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
}

export async function verifyAdminCode(code: string): Promise<boolean> {
  try {
    await initializeFirebase();
    if (!firebaseApp) return false;
    
    if (!db) {
      const { getFirestore } = await import("firebase/firestore");
      db = getFirestore(firebaseApp);
    }

    const { doc, getDoc } = await import("firebase/firestore");
    
    // Read from Global collection -> adminCode document -> adminCode field
    const docRef = doc(db, "Global", "adminCode");
    const docSnapshot = await getDoc(docRef);

    if (docSnapshot.exists()) {
      const data = docSnapshot.data();
      return data.adminCode === code;
    }
    
    return false;
  } catch (error) {
    console.error("Firebase verification error:", error);
    return false;
  }
}

export async function getAppTimerMinutes(): Promise<number> {
  try {
    await initializeFirebase();
    if (!firebaseApp) return 0;
    
    if (!db) {
      const { getFirestore } = await import("firebase/firestore");
      db = getFirestore(firebaseApp);
    }

    const { doc, getDoc } = await import("firebase/firestore");
    
    // Read from Global collection -> Casovac_aplikacia document -> cas field
    const docRef = doc(db, "Global", "Casovac_aplikacia");
    const docSnapshot = await getDoc(docRef);

    if (docSnapshot.exists()) {
      const data = docSnapshot.data();
      const minutes = parseInt(data.cas, 10);
      return isNaN(minutes) ? 0 : minutes;
    }
    
    return 0;
  } catch (error) {
    console.error("Firebase timer fetch error:", error);
    return 0;
  }
}

export async function getFacilities(): Promise<Record<string, string>> {
  try {
    await initializeFirebase();
    if (!firebaseApp) return {};
    
    if (!db) {
      const { getFirestore } = await import("firebase/firestore");
      db = getFirestore(firebaseApp);
    }

    const { doc, getDoc } = await import("firebase/firestore");
    
    // Read from Global collection -> Prevadzky document
    const docRef = doc(db, "Global", "Prevadzky");
    const docSnapshot = await getDoc(docRef);

    if (docSnapshot.exists()) {
      return docSnapshot.data() as Record<string, string>;
    }
    
    return {};
  } catch (error) {
    console.error("Firebase facilities fetch error:", error);
    return {};
  }
}

export async function getShoppingListFacilities(): Promise<Record<string, string>> {
  try {
    await initializeFirebase();
    if (!firebaseApp) return {};
    
    if (!db) {
      const { getFirestore } = await import("firebase/firestore");
      db = getFirestore(firebaseApp);
    }

    const { collection, getDocs } = await import("firebase/firestore");
    
    // Read all documents from Nakupne_zoznamy collection
    const col = collection(db, "Nakupne_zoznamy");
    const snapshot = await getDocs(col);
    
    const facilities: Record<string, string> = {};
    snapshot.forEach(doc => {
      facilities[doc.id] = doc.id; // Use document ID as facility name
    });
    
    return facilities;
  } catch (error) {
    console.error("Firebase shopping list facilities fetch error:", error);
    return {};
  }
}

export async function getShoppingListItems(facilityId: string): Promise<Record<string, any>> {
  try {
    await initializeFirebase();
    if (!firebaseApp) return {};
    
    if (!db) {
      const { getFirestore } = await import("firebase/firestore");
      db = getFirestore(firebaseApp);
    }

    const { doc, getDoc } = await import("firebase/firestore");
    
    // Read from Nakupne_zoznamy -> [facilityId] document
    const docRef = doc(db, "Nakupne_zoznamy", facilityId);
    const docSnapshot = await getDoc(docRef);

    if (docSnapshot.exists()) {
      return docSnapshot.data();
    }
    
    return {};
  } catch (error) {
    console.error("Firebase shopping list items fetch error:", error);
    return {};
  }
}

export async function saveShoppingListItems(facilityId: string, items: Record<string, any>): Promise<boolean> {
  try {
    await initializeFirebase();
    if (!firebaseApp) return false;
    
    if (!db) {
      const { getFirestore } = await import("firebase/firestore");
      db = getFirestore(firebaseApp);
    }

    const { doc, setDoc } = await import("firebase/firestore");
    
    // Write to Nakupne_zoznamy -> [facilityId] document
    const docRef = doc(db, "Nakupne_zoznamy", facilityId);
    await setDoc(docRef, items);
    
    // Only save to Docasne_Nakupne_Zoznamy if there is actual data (at least one item has a quantity)
    // This prevents clearing the Temp list when the main list is emptied
    const hasData = items && items.items && Array.isArray(items.items) && 
                    items.items.some((item: any) => item.quantity !== undefined && item.quantity !== "");
    
    if (hasData) {
      const tempDocRef = doc(db, "Docasne_Nakupne_Zoznamy", facilityId);
      await setDoc(tempDocRef, items);
    }
    
    return true;
  } catch (error) {
    console.error("Firebase shopping list items save error:", error);
    return false;
  }
}

export async function getTempShoppingListFacilities(): Promise<Record<string, string>> {
  try {
    await initializeFirebase();
    if (!firebaseApp) return {};
    
    if (!db) {
      const { getFirestore } = await import("firebase/firestore");
      db = getFirestore(firebaseApp);
    }

    const { collection, getDocs } = await import("firebase/firestore");
    
    const col = collection(db, "Docasne_Nakupne_Zoznamy");
    const snapshot = await getDocs(col);
    
    const facilities: Record<string, string> = {};
    snapshot.forEach(doc => {
      facilities[doc.id] = doc.id;
    });
    
    return facilities;
  } catch (error) {
    console.error("Firebase temp shopping list facilities fetch error:", error);
    return {};
  }
}

export async function getTempShoppingListItems(facilityId: string): Promise<Record<string, any>> {
  try {
    await initializeFirebase();
    if (!firebaseApp) return {};
    
    if (!db) {
      const { getFirestore } = await import("firebase/firestore");
      db = getFirestore(firebaseApp);
    }

    const { doc, getDoc } = await import("firebase/firestore");
    
    const docRef = doc(db, "Docasne_Nakupne_Zoznamy", facilityId);
    const docSnapshot = await getDoc(docRef);

    if (docSnapshot.exists()) {
      return docSnapshot.data();
    }
    
    return {};
  } catch (error) {
    console.error("Firebase temp shopping list items fetch error:", error);
    return {};
  }
}

export async function saveBioWaste(facilityId: string, data: { date: string, amount: string, unit: string }): Promise<boolean> {
  try {
    await initializeFirebase();
    if (!firebaseApp) return false;
    if (!db) {
      const { getFirestore } = await import("firebase/firestore");
      db = getFirestore(firebaseApp);
    }

    const { doc, updateDoc, arrayUnion, getDoc, setDoc } = await import("firebase/firestore");
    
    const docRef = doc(db, facilityId, "Bioodpad");
    
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      await setDoc(docRef, { entries: [data] });
    } else {
      await updateDoc(docRef, {
        entries: arrayUnion(data)
      });
    }
    
    return true;
  } catch (error) {
    console.error("Firebase bio-waste save error:", error);
    return false;
  }
}

export async function getBioWaste(facilityId: string): Promise<any[]> {
  try {
    await initializeFirebase();
    if (!firebaseApp) return [];
    if (!db) {
      const { getFirestore } = await import("firebase/firestore");
      db = getFirestore(firebaseApp);
    }

    const { doc, getDoc } = await import("firebase/firestore");
    const docRef = doc(db, facilityId, "Bioodpad");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return Array.isArray(data.entries) ? data.entries : [];
    }
    
    return [];
  } catch (error) {
    console.error("Firebase bio-waste fetch error:", error);
    return [];
  }
}

export async function getPreparationItems(facilityId: string): Promise<string[]> {
  try {
    await initializeFirebase();
    if (!firebaseApp) return [];
    if (!db) {
      const { getFirestore } = await import("firebase/firestore");
      db = getFirestore(firebaseApp);
    }

    const { doc, getDoc } = await import("firebase/firestore");
    // Change: Read from [facilityId]/Text_KrajaneVeci instead of Global/Text_KrajaneVeci
    const docRef = doc(db, facilityId, "Text_KrajaneVeci");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      // Expecting fields like item1, item2... or an array
      return Object.values(data).filter(v => typeof v === "string");
    }
    
    return [];
  } catch (error) {
    console.error("Firebase preparation items fetch error:", error);
    return [];
  }
}

export async function getPreparationTimeRanges(facilityId: string): Promise<{ start: string, end: string } | null> {
  try {
    await initializeFirebase();
    if (!firebaseApp) return null;
    if (!db) {
      const { getFirestore } = await import("firebase/firestore");
      db = getFirestore(firebaseApp);
    }

    const { doc, getDoc } = await import("firebase/firestore");
    const docRef = doc(db, facilityId, "Cas_KrajaneVeci");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        start: data.Zaciatok || "00:00",
        end: data.Koniec || "23:59"
      };
    }
    
    return null;
  } catch (error) {
    console.error("Firebase preparation time ranges fetch error:", error);
    return null;
  }
}

export async function savePreparation(facilityId: string, data: { date: string, time: string, item: string }): Promise<boolean> {
  try {
    await initializeFirebase();
    if (!firebaseApp) return false;
    if (!db) {
      const { getFirestore } = await import("firebase/firestore");
      db = getFirestore(firebaseApp);
    }

    const { doc, updateDoc, arrayUnion, getDoc, setDoc } = await import("firebase/firestore");
    const docRef = doc(db, facilityId, "Krajane_veci");
    
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      await setDoc(docRef, { entries: [data] });
    } else {
      await updateDoc(docRef, {
        entries: arrayUnion(data)
      });
    }
    
    return true;
  } catch (error) {
    console.error("Firebase preparation save error:", error);
    return false;
  }
}

export async function getPreparationHistory(facilityId: string): Promise<any[]> {
  try {
    await initializeFirebase();
    if (!firebaseApp) return [];
    if (!db) {
      const { getFirestore } = await import("firebase/firestore");
      db = getFirestore(firebaseApp);
    }

    const { doc, getDoc } = await import("firebase/firestore");
    const docRef = doc(db, facilityId, "Krajane_veci");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return Array.isArray(data.entries) ? data.entries : [];
    }
    
    return [];
  } catch (error) {
    console.error("Firebase preparation fetch error:", error);
    return [];
  }
}

export async function saveKvartalSanitation(facilityId: string, data: { date: string }): Promise<boolean> {
  try {
    await initializeFirebase();
    if (!firebaseApp) return false;
    if (!db) {
      const { getFirestore } = await import("firebase/firestore");
      db = getFirestore(firebaseApp);
    }

    const { doc, updateDoc, arrayUnion, getDoc, setDoc } = await import("firebase/firestore");
    const docRef = doc(db, facilityId, "Kvartalna_Sanitacia");
    
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      await setDoc(docRef, { entries: [data] });
    } else {
      await updateDoc(docRef, {
        entries: arrayUnion(data)
      });
    }
    
    return true;
  } catch (error) {
    console.error("Firebase sanitation save error:", error);
    return false;
  }
}

export async function getKvartalSanitationHistory(facilityId: string): Promise<any[]> {
  try {
    await initializeFirebase();
    if (!firebaseApp) return [];
    if (!db) {
      const { getFirestore } = await import("firebase/firestore");
      db = getFirestore(firebaseApp);
    }

    const { doc, getDoc } = await import("firebase/firestore");
    const docRef = doc(db, facilityId, "Kvartalna_Sanitacia");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return Array.isArray(data.entries) ? data.entries : [];
    }
    
    return [];
  } catch (error) {
    console.error("Firebase sanitation fetch error:", error);
    return [];
  }
}

export async function getDailySanitationText(facilityId: string): Promise<string> {
  try {
    await initializeFirebase();
    if (!firebaseApp) return "";
    if (!db) {
      const { getFirestore } = await import("firebase/firestore");
      db = getFirestore(firebaseApp);
    }

    const { doc, getDoc } = await import("firebase/firestore");
    const docRef = doc(db, facilityId, "Text_Denna_Sanitacia");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      // As per screenshot, field name is "sadsa"
      return data.sadsa || "";
    }
    
    return "";
  } catch (error) {
    console.error("Firebase daily sanitation text fetch error:", error);
    return "";
  }
}

export async function saveDailySanitation(facilityId: string, data: { date: string, text: string }): Promise<boolean> {
  try {
    await initializeFirebase();
    if (!firebaseApp) return false;
    if (!db) {
      const { getFirestore } = await import("firebase/firestore");
      db = getFirestore(firebaseApp);
    }

    const { doc, updateDoc, arrayUnion, getDoc, setDoc } = await import("firebase/firestore");
    const docRef = doc(db, facilityId, "Denna_Sanitacia");
    
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      await setDoc(docRef, { entries: [data] });
    } else {
      await updateDoc(docRef, {
        entries: arrayUnion(data)
      });
    }
    
    return true;
  } catch (error) {
    console.error("Firebase daily sanitation save error:", error);
    return false;
  }
}

export async function getDailySanitationHistory(facilityId: string): Promise<any[]> {
  try {
    await initializeFirebase();
    if (!firebaseApp) return [];
    if (!db) {
      const { getFirestore } = await import("firebase/firestore");
      db = getFirestore(firebaseApp);
    }

    const { doc, getDoc } = await import("firebase/firestore");
    const docRef = doc(db, facilityId, "Denna_Sanitacia");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return Array.isArray(data.entries) ? data.entries : [];
    }
    
    return [];
  } catch (error) {
    console.error("Firebase daily sanitation fetch error:", error);
    return [];
  }
}

export async function getDPHHistory(facilityId: string): Promise<any[]> {
  try {
    await initializeFirebase();
    if (!firebaseApp) return [];
    if (!db) {
      const { getFirestore } = await import("firebase/firestore");
      db = getFirestore(firebaseApp);
    }

    const { doc, getDoc } = await import("firebase/firestore");
    const docRef = doc(db, facilityId, "DPH");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return Array.isArray(data.entries) ? data.entries : [];
    }
    
    return [];
  } catch (error) {
    console.error("Firebase DPH history fetch error:", error);
    return [];
  }
}

export async function saveDPHRaw(facilityId: string, entries: any[]): Promise<boolean> {
  try {
    await initializeFirebase();
    if (!firebaseApp) return false;
    if (!db) {
      const { getFirestore } = await import("firebase/firestore");
      db = getFirestore(firebaseApp);
    }

    const { doc, setDoc } = await import("firebase/firestore");
    const docRef = doc(db, facilityId, "DPH");
    await setDoc(docRef, { entries });
    return true;
  } catch (error) {
    console.error("Firebase DPH save error:", error);
    return false;
  }
}

export async function saveDPH(facilityId: string, data: any): Promise<boolean> {
  try {
    await initializeFirebase();
    if (!firebaseApp) return false;
    if (!db) {
      const { getFirestore } = await import("firebase/firestore");
      db = getFirestore(firebaseApp);
    }

    const { doc, updateDoc, arrayUnion, getDoc, setDoc } = await import("firebase/firestore");
    const docRef = doc(db, facilityId, "DPH");
    
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      await setDoc(docRef, { entries: [data] });
    } else {
      await updateDoc(docRef, {
        entries: arrayUnion(data)
      });
    }
    
    return true;
  } catch (error) {
    console.error("Firebase DPH save error:", error);
    return false;
  }
}

export async function getTeplotyConfig(facilityId: string): Promise<{ fridgeCount: number, range: { start: number, end: number } }> {
  try {
    await initializeFirebase();
    if (!firebaseApp) return { fridgeCount: 0, range: { start: 0, end: 10 } };
    if (!db) {
      const { getFirestore } = await import("firebase/firestore");
      db = getFirestore(firebaseApp);
    }

    const { doc, getDoc } = await import("firebase/firestore");
    
    // Get fridge count
    const fridgeDocRef = doc(db, facilityId, "Pocet_chladniciek");
    const fridgeSnap = await getDoc(fridgeDocRef);
    let fridgeCount = 0;
    if (fridgeSnap.exists()) {
      const data = fridgeSnap.data();
      // Try common numeric field names or just the first numeric value
      const rawCount = data.pocet || data.Pocet || data.count || data.sadsa || 
                       Object.values(data).find(v => !isNaN(parseInt(String(v), 10)));
      fridgeCount = parseInt(String(rawCount || "0"), 10);
    }
    
    // Fallback: Check Global collection if not found in facility
    if (fridgeCount === 0) {
      const globalFridgeRef = doc(db, "Global", "Pocet_chladniciek");
      const globalFridgeSnap = await getDoc(globalFridgeRef);
      if (globalFridgeSnap.exists()) {
        const globalData = globalFridgeSnap.data();
        const globalRawCount = globalData.pocet || globalData.Pocet || globalData.count || 
                               Object.values(globalData).find(v => !isNaN(parseInt(String(v), 10)));
        fridgeCount = parseInt(String(globalRawCount || "0"), 10);
      }
    }

    // Get temperature range
    const rangeDocRef = doc(db, facilityId, "Teploty_rozsah");
    const rangeSnap = await getDoc(rangeDocRef);
    let range = { start: 0, end: 10 };
    if (rangeSnap.exists()) {
      const data = rangeSnap.data();
      range = {
        start: parseInt(data.Zaciatok || "0", 10),
        end: parseInt(data.Koniec || "10", 10)
      };
    }

    return { fridgeCount, range };
  } catch (error) {
    console.error("Firebase teploty config fetch error:", error);
    return { fridgeCount: 0, range: { start: 0, end: 10 } };
  }
}

export async function saveTemperature(facilityId: string, data: { 
  fridgeNumber: string, 
  temperature: string, 
  date: string, 
  period: "morning" | "evening" 
}): Promise<boolean> {
  try {
    await initializeFirebase();
    if (!firebaseApp) return false;
    if (!db) {
      const { getFirestore } = await import("firebase/firestore");
      db = getFirestore(firebaseApp);
    }

    const { doc, getDoc, setDoc } = await import("firebase/firestore");
    const docRef = doc(db, facilityId, "Teploty");
    
    // Get current data
    const docSnap = await getDoc(docRef);
    let entries = docSnap.exists() && Array.isArray(docSnap.data().entries) ? docSnap.data().entries : [];
    
    if (Array.isArray(data)) {
      // Multiple entries (bulk save)
      const newEntries = [...data];
      const dates = new Set(newEntries.map(e => new Date(e.date).toISOString().split('T')[0]));
      const periods = new Set(newEntries.map(e => e.period));
      
      // Filter out existing entries that are being replaced
      entries = entries.filter((entry: any) => {
        const entryDate = new Date(entry.date).toISOString().split('T')[0];
        const isBeingReplaced = dates.has(entryDate) && periods.has(entry.period);
        return !isBeingReplaced;
      });
      
      entries.push(...newEntries);
    } else {
      // Single entry
      const entryData = data as { fridgeNumber: string, temperature: string, date: string, period: "morning" | "evening" };
      const existingIndex = entries.findIndex((entry: any) => {
        const sameDate = new Date(entry.date).toISOString().split('T')[0] === new Date(entryData.date).toISOString().split('T')[0];
        return sameDate && entry.fridgeNumber === entryData.fridgeNumber && entry.period === entryData.period;
      });
      
      if (existingIndex !== -1) {
        entries[existingIndex] = entryData;
      } else {
        entries.push(entryData);
      }
    }
    
    // Write all entries at once
    await setDoc(docRef, { entries });
    return true;
  } catch (error) {
    console.error("Firebase temperature save error:", error);
    return false;
  }
}

export async function getTemperatureHistory(facilityId: string): Promise<any[]> {
  try {
    await initializeFirebase();
    if (!firebaseApp) return [];
    if (!db) {
      const { getFirestore } = await import("firebase/firestore");
      db = getFirestore(firebaseApp);
    }

    const { doc, getDoc } = await import("firebase/firestore");
    const docRef = doc(db, facilityId, "Teploty");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return Array.isArray(data.entries) ? data.entries : [];
    }
    
    return [];
  } catch (error) {
    console.error("Firebase temperature fetch error:", error);
    return [];
  }
}
