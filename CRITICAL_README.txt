╔══════════════════════════════════════════════════════════╗
║          ⚠️  ΔΙΑΒΑΣΕ ΠΡΙΝ ΚΑΝΕΙΣ DEPLOY ⚠️              ║
╚══════════════════════════════════════════════════════════╝

🔴 ΠΡΟΒΛΗΜΑ 1: COUNTDOWN ΔΕΙΧΝΕΙ 00:00:00:00

ΑΙΤΙΑ: Το Next.js cache δεν έχει rebuild!

ΛΥΣΗ:
```bash
cd motodogs-FINAL

# Delete old build
rm -rf .next

# Fresh install
rm -rf node_modules
npm install

# Development mode (auto-refresh)
npm run dev

# OR Production build
npm run build
npm start
```

Μετά refresh το browser (Ctrl+Shift+R)

═══════════════════════════════════════════════════════════

🔴 ΠΡΟΒΛΗΜΑ 2: WALLET POPUP ΔΕΝ ΑΝΟΙΓΕΙ

ΑΙΤΙΑ: Το OpNet wallet ΔΕΝ έχει `sendBitcoin()` API

ΤΙ ΕΧ EI:
✅ signInteraction()
✅ signAndBroadcastInteraction()
✅ broadcast()
✅ pushTx()
✅ getBitcoinUtxos()

ΛΥΣΗ: Πρέπει να ΔΟΚΙΜΑΣΕΙΣ το wallet Send button!

ΒΗΜΑΤΑ:
1. Άνοιξε OpNet Wallet extension
2. Click "Send" button
3. Βάλε μια διεύθυνση
4. Άνοιξε Developer Tools (F12)
5. Δες στο Console ΤΙ API καλεί!

Θα δεις κάτι σαν:
  window.opnet.ΚΑΤΙ({ to: "...", amount: ... })

ΣΤΕΙΛΕ ΜΟΥ SCREENSHOT!

Τότε θα ξέρω το ΣΩΣΤΟ API και θα το φτιάξω!

═══════════════════════════════════════════════════════════

📝 ΕΝΑΛΛΑΚΤΙΚΑ:

Αν δεν μπορείς να βρεις το API, μπορώ να φτιάξω:

Option A: Manual payment με QR code
  - User scans QR
  - Sends BTC
  - Enters TX ID
  
Option B: Integration με άλλο wallet (Unisat, Xverse)
  - Αυτά έχουν sendBitcoin() API

Πες μου ποιο προτιμάς!

═══════════════════════════════════════════════════════════
