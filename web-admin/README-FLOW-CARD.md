# 🎯 Flow Card - Incident Management to Dashboard

## 📊 Overview

This project contains a complete **Flow Card diagram** showing the entire incident management process from detection to reporting to the management dashboard.

**Total Flow Steps:** 10 steps + decision points + loops

---

## 🚀 Quick Start (2 Minutes)

### **Step 1: View the Flow Card**

```bash
# Option A: Open in browser
open public/flow-card-viewer.html

# Option B: Open in VS Code
code public/flow-card-incident.svg
```

### **Step 2: Generate PNG**

```bash
# Option A: Click button in browser
# Open: public/flow-card-viewer.html
# Click: "📸 Save as PNG"

# Option B: Auto-generate
# Open: public/generate-png.html
# Click: "Generate PNG"
```

### **Step 3: Share**

- Upload PNG to wiki/docs
- Share via email/Slack
- Embed in dashboard

---

## 📁 Project Structure

```
web-admin/
├── public/
│   ├── flow-card-incident.svg      # Main SVG diagram (editable)
│   ├── flow-card-incident.html     # HTML layout viewer
│   ├── flow-card-viewer.html       # Full viewer + PNG converter ⭐
│   ├── generate-png.html           # PNG auto-generator
│   ├── project-flowchart.svg       # Overview diagram
│   └── flow-card-incident.png      # [Output] Generated PNG
│
├── docs/
│   ├── FLOW-CARD-README.md         # Detailed documentation
│   └── FLOWCHART.md                # Original flowchart
│
├── scripts/
│   ├── svg-to-png.py               # Python converter
│   ├── convert-svg-to-png.mjs      # Node.js wrapper
│   ├── render-png.html             # HTML renderer
│   └── generate-flowcard-png.js    # Puppeteer converter
│
└── Root Files:
    ├── FLOW-CARD-SUMMARY.txt       # Summary of all files
    ├── QUICKSTART-FLOW-CARD.md     # Quick start guide
    ├── PNG-CONVERSION-GUIDE.md     # 5 ways to convert PNG
    └── README-FLOW-CARD.md         # This file
```

---

## 🎯 The 10-Step Flow

```
🚨 Detect → 📢 Report → 🔍 Investigate → 📊 Analyze → 👨‍💼 Assign
 Step 1      Step 2       Step 3 (15min)    Step 4     Step 5
    ↓
    └─ Escalate? ─→ 📤 Send to Management
         ↓
        YES ──→ Wait for decision
        NO ───→ Continue
    ↓
🔧 Execute → ✔️ QC Check → ⏰ Monitor → 📤 Report → 📊 Dashboard
Step 6      Step 7       Step 8      Step 9      Step 10
             ↑____________[Loop if needed]
```

### **Key Steps**

| Step | Name           | Duration  | Owner    | Action                         |
| ---- | -------------- | --------- | -------- | ------------------------------ |
| 1    | Detect Issue   | -         | Any      | Log incident                   |
| 2    | Report         | 1 min     | Reporter | Notify QA/LL/CH                |
| 3    | Investigate    | 15 min    | QA+LL+CH | 5 Whys analysis                |
| 4    | Analyze        | 5-10 min  | LL       | Determine root cause           |
| 4b   | Parallel Route | 5 min     | TP       | Choose department (if timeout) |
| 4c   | Escalate       | -         | LL       | Escalate to Management         |
| 5    | Assign         | 5-10 min  | TP       | Assign to worker               |
| 6    | Execute        | 1h-24h    | Worker   | Fix + document                 |
| 7    | QC Check       | 10-30 min | LL       | Verify quality                 |
| 8    | Monitor        | 3-48h     | Team     | Ensure stable fix              |
| 9    | Close & Report | 5-10 min  | LL/Admin | Send final report              |
| 10   | Dashboard      | Real-time | BGĐ      | View metrics                   |

---

## 📊 Card Status Progression

```
NEW
 ↓
IN PROGRESS (Step 5-7)
 ↓
UNDER MONITORING (Step 8)
 ↓
CLOSED (Step 9)
 ↓
ARCHIVED (Step 10)

Alternative: ESCALATED → Wait for Management Decision
```

---

## 👥 Key Roles

| Role              | Abbr | Responsibilities                    |
| ----------------- | ---- | ----------------------------------- |
| Quality Assurance | QA   | Investigate, verify quality         |
| Lead              | LL   | Analyze, review, approve            |
| Chief             | CH   | Supervise, authorize escalation     |
| Team Lead         | TP   | Assign work, coordinate             |
| Worker            | NV   | Execute fix, document               |
| Director          | BGĐ  | Final approval, escalation decision |

---

## 📈 KPI Metrics

Track these metrics for performance:

| Metric              | Target          | Red Flag |
| ------------------- | --------------- | -------- |
| Response Time       | ≤ 15 min        | > 20 min |
| Investigation Time  | ≤ 15 min        | > 20 min |
| Resolution Time     | ≤ 48h (P1: ≤4h) | > 72h    |
| Escalation Rate     | < 20%           | > 30%    |
| Recurrence Rate     | < 5%            | > 10%    |
| First-time Fix Rate | > 85%           | < 75%    |

---

## 🔄 Loops & Branches

### **Quality Check Loop (Step 7)**

- If quality check fails → Return to Step 6
- Max 2 iterations, then escalate

### **Monitoring Loop (Step 8)**

- If issue resurfaces → Return to Step 6
- Update final report

### **Parallel Processing (Step 4b)**

- If investigation exceeds 15 min → Start Step 5 immediately
- Don't wait for full analysis

---

## 💾 Data Storage

Each card must store:

- ✅ Unique ID
- ✅ Severity/Priority
- ✅ Category
- ✅ Description
- ✅ Status history (with timestamps)
- ✅ Photos (before/after)
- ✅ Work logs
- ✅ Cost breakdown
- ✅ Timesheet
- ✅ Final report (PDF)

---

## 📸 How to Convert SVG to PNG

### **Method 1: Browser (Easiest)** ⭐⭐⭐

```bash
# Open in browser
public/flow-card-viewer.html

# Click: "📸 Save as PNG"
# Done! ✅
```

### **Method 2: Online Tools** ⭐⭐⭐

```
CloudConvert: https://cloudconvert.com/svg-to-png
Convertio: https://convertio.co/svg-png/
```

### **Method 3: Inkscape (Best Quality)** ⭐⭐

```bash
# Install: https://inkscape.org/

# Command line
inkscape public/flow-card-incident.svg \
  --export-type=png \
  --export-dpi=300 \
  --export-filename=public/flow-card-incident.png
```

### **Method 4: ImageMagick (Fast)** ⭐⭐

```bash
# Install: https://imagemagick.org/

magick convert -density 300 \
  public/flow-card-incident.svg \
  public/flow-card-incident.png
```

### **Method 5: Python** ⭐

```bash
pip install cairosvg
python scripts/svg-to-png.py
```

**→ See `PNG-CONVERSION-GUIDE.md` for detailed instructions**

---

## 🎨 Editing the Flow Card

### **Edit SVG in Text Editor**

```bash
# Open with VS Code
code public/flow-card-incident.svg

# Edit colors, text, shapes
# Save
# Refresh browser to see changes
```

### **Edit in Inkscape**

```bash
# Open
inkscape public/flow-card-incident.svg

# Edit visually
# Save
# Export as SVG
```

### **CSS Customization**

Edit colors in `<style>` section:

```css
.box-stroke {
  stroke: #10b981;
} /* Green */
.header-text {
  fill: #1e293b;
} /* Dark */
```

---

## 📄 Documentation Files

| File                         | Purpose                     | Read Time |
| ---------------------------- | --------------------------- | --------- |
| **QUICKSTART-FLOW-CARD.md**  | Quick start guide           | 2 min     |
| **PNG-CONVERSION-GUIDE.md**  | How to convert SVG to PNG   | 5 min     |
| **docs/FLOW-CARD-README.md** | Detailed flow documentation | 10 min    |
| **FLOW-CARD-SUMMARY.txt**    | File summary & FAQ          | 5 min     |
| **README-FLOW-CARD.md**      | This file                   | 5 min     |

---

## ✅ Implementation Checklist

- [ ] Review the flow diagram
- [ ] Understand all 10 steps
- [ ] Convert SVG to PNG for sharing
- [ ] Share with team for feedback
- [ ] Add to wiki/documentation
- [ ] Integrate into dashboard (if needed)
- [ ] Train team on the process
- [ ] Set up KPI tracking
- [ ] Configure escalation notifications
- [ ] Test end-to-end flow

---

## 🤔 FAQ

**Q: Can I edit the flow diagram?**
A: Yes! Edit `public/flow-card-incident.svg` directly.

**Q: Which PNG conversion method is best?**
A: Start with Browser (easiest), use Inkscape for highest quality.

**Q: How to embed in dashboard?**
A: Use `<img src="/flow-card-incident.png">` or embed HTML `<iframe src="/flow-card-viewer.html">`

**Q: Can I convert batch?**
A: Yes, use ImageMagick or Python script for automation.

**Q: What if PNG is too large?**
A: Reduce DPI (300 → 150) or use image compression.

---

## 🚨 Critical Points

1. **15-Minute Timeout (Step 3→4b)**
   - If investigation takes > 15min, immediately start Step 5
   - Don't wait for perfect analysis

2. **No Solution? (Step 4c)**
   - Escalate to Management immediately
   - Don't attempt workarounds

3. **Quality Fails (Step 7)**
   - Max 2 iterations of rework
   - Then escalate if still failing

4. **Issue Returns (Step 8)**
   - Log as recurrence
   - Return to Step 6
   - Update report

---

## 📞 Support

Need help?

- 📖 Read: `QUICKSTART-FLOW-CARD.md`
- 🎨 View: `public/flow-card-viewer.html`
- 🔧 Convert: `PNG-CONVERSION-GUIDE.md`
- 💬 Slack: #workflow-support
- 📧 Email: team@example.com

---

## 📝 Version History

| Date       | Version | Changes         |
| ---------- | ------- | --------------- |
| 2026-08-10 | 1.0     | Initial release |

---

## 📜 License

Internal Use Only - Property of the Organization

---

## 🎉 You're All Set!

1. ✅ Flow diagram created
2. ✅ Documentation complete
3. ✅ PNG converters ready
4. ✅ Team resources prepared

**Next Step:** Open `public/flow-card-viewer.html` and start using! 🚀

---

**Happy Incident Management! 🎯**
