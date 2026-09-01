# Vows for Eternity — Luxury Matchmaking Web Replica & Payment Gateway

A pixel-perfect, production-ready frontend replica of [Vows for Eternity](https://www.vowsforeternity.com/) featuring offline self-contained local assets, responsive typography (`metropolitanParliament`, `timesRoman`, `mulish`), and an embedded luxury payment gateway component.

---

## 🌟 Key Features

- **Exact Brand Aesthetics:** Deep burgundy (`#5A1713`), warm cream (`#FAF5EE`), and gold taupe (`#C5A880`) luxury color palette.
- **Dynamic Header Scroll Transition:** Starts fully transparent showing top watercolor artwork, then smoothly transitions to solid deep burgundy upon scrolling.
- **Left Navigation Drawer:** Smooth slide-in menu with dropdown indicators and gold member login trigger.
- **Local Web Fonts & Assets:** 100% self-contained local web fonts (`.woff2`, `.ttf`) and optimized webp/png artwork with zero external CDN dependencies.
- **Embedded Luxury Payment Gateway Component:**
  - Multi-tier selection (VFE Select, VFE Privé, Bespoke Retainer).
  - Multi-currency support (USD, INR, GBP, EUR, AED).
  - Tabbed payment methods: Credit/Debit Card (with live Luhn check and brand detection), UPI/NetBanking, and Private Wire Transfer.
  - Interactive payment authorization spinner and confirmed membership receipt dialog.

---

## 📂 Repository Structure

```
├── index.html              # Main HTML markup & sections
├── css/
│   ├── 93ed2a90ee3dfcc7.css # Core Tailwind & grid utilities
│   └── luxury-custom.css   # Brand styles, header scroll transition, payment modal
├── fonts/                  # Local web font files (.woff2, .ttf)
├── images/                 # Optimized brand artwork, logos, and textures
├── js/
│   └── app.js              # Header transition, left drawer, and payment controller
└── README.md
```

---

## 🚀 Local Execution

No build step or dependencies required. Simply launch any local static web server:

```bash
# Using Python 3
python -m http.server 8000
```

Open `http://localhost:8000` in your web browser.
