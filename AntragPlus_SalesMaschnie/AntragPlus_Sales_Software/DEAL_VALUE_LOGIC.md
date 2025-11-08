# 💰 DEAL VALUE BERECHNUNG

## 🎯 LOGIK: 10% vom Betrag

### **Regel:**
```
Deal Value = 10% vom Betrag (aus CSV)
```

---

## 📊 BEISPIELE

### **Beispiel 1:**
```csv
Firmename: Deutscher Caritasverband e.V.
betrag: 50000
```

**Deal Value Berechnung:**
```
50.000 € × 10% = 5.000 €
```

**Result:**
```
Deal:
  title: "Deutscher Caritasverband e.V. - Qualified Lead"
  value: 5000  ← 10% vom Betrag
  stage: "Start"
  custom_fields: {
    betrag: "50000",  ← Original Betrag bleibt erhalten
    ...
  }
```

---

### **Beispiel 2:**
```csv
Firmename: NABU Deutschland
betrag: 35000
```

**Deal Value Berechnung:**
```
35.000 € × 10% = 3.500 €
```

---

### **Beispiel 3:**
```csv
Firmename: WWF Deutschland  
betrag: 120000
```

**Deal Value Berechnung:**
```
120.000 € × 10% = 12.000 €
```

---

## 🔄 FALLBACK (wenn kein Betrag)

### **Falls betrag leer oder nicht numerisch:**

Verwendet **Org Size Estimation:**

| Organisation Size | Deal Value |
|-------------------|------------|
| Klein (<50 MA) | €500 |
| Mittel (50-200 MA) | €2.000 |
| Groß (>200 MA) | €5.000 |
| Unbekannt | €1.000 (Default) |

---

## 💡 WARUM 10%?

### **Typische Sales Logic:**
- **Betrag** = Total Förderung die Organisation erhält
- **Deal Value** = Deine potentielle Provision/Umsatz (10% vom Betrag)

### **Vorteile:**
✅ Realistische Pipeline Values
✅ Automatisch aus CSV berechnet
✅ Fallback für Leads ohne Betrag
✅ Original Betrag bleibt in custom_fields erhalten

---

## 🧪 TEST MIT DEINER CSV

### **Test CSV Zeilen:**
```csv
Deutscher Caritasverband,Bundesministerium,Ja,2024,Karlstraße 40,Wohlfahrtsverband,Soziale Integration,50000,EMP001
NABU Deutschland,EU Fonds,Nein,2024,Charitéstraße 3,Naturschutz,Umweltbildung,35000,EMP002
Deutsches Rotes Kreuz,Aktion Mensch,Ja,2023,Carstennstraße 58,Katastrophenschutz,Erste Hilfe,75000,EMP003
```

### **Erwartete Deal Values:**
- Caritas: 50.000 × 10% = **€5.000**
- NABU: 35.000 × 10% = **€3.500**
- DRK: 75.000 × 10% = **€7.500**

### **Test:**
1. Upload test-leads.csv
2. Enrichment starten
3. Approve Leads
4. Check Pipeline → Deals zeigen 10% Values ✅

---

## 📝 CODE IMPLEMENTIERUNG

### **In `lead-to-crm-service.ts`:**

```typescript
private calculateDealValue(lead: any): number {
  // Priority 1: Use 10% of betrag from CSV
  if (lead.custom_fields?.betrag) {
    const betrag = parseFloat(
      lead.custom_fields.betrag
        .toString()
        .replace(/[^\d.-]/g, '')  // Remove non-numeric
    )
    
    if (!isNaN(betrag) && betrag > 0) {
      return Math.round(betrag * 0.10)  // ← 10%!
    }
  }

  // Priority 2: Fallback to org size estimate
  return this.estimateDealValue(lead)
}
```

### **Handles:**
- ✅ Numeric parsing (removes €, commas, etc.)
- ✅ Rounding to whole numbers
- ✅ Validation (NaN check)
- ✅ Fallback if betrag missing or invalid

---

## ✨ ZUSAMMENFASSUNG

**Deal Value = 10% vom betrag (aus CSV)**

- ✅ Automatisch berechnet
- ✅ Bei Approval → Deal created mit 10% Value
- ✅ Original betrag bleibt in custom_fields
- ✅ Fallback zu Org Size wenn kein betrag
- ✅ Sichtbar in Pipeline Board
- ✅ Für Reporting & Forecasting nutzbar

**Ready to test!** 🚀

