# Karikatür Değerlendirme Anketi

SurveyJS tabanlı, AI ile üretilmiş karikatürleri referans fotoğrafla karşılaştırıp değerlendiren bir anket uygulaması. Vite ile build edilen statik bir frontend'dir; sonuçlar bir Google Apps Script Web App üzerinden bir Google Sheet'e yazılır (veritabanı gerekmez).

## Nasıl çalışır

- `CaricatureImages/People/` — referans fotoğraflar
- `CaricatureImages/InferenceOutputs/<method>/<kişi>/` — her yöntemin ürettiği karikatür varyantları (birden fazla seed olabilir)
- `scripts/generate-manifest.js` bu klasörü tarayıp `CaricatureImages/stimuli-manifest.json` üretir
- `src/survey-config.js` bu manifest'ten katılımcı başına rastgele sıralanmış bir SurveyJS şeması kurar: referans (kişi) sırası ve her referanstaki method sırası, ayrıca birden fazla seed varsa hangi seed'in gösterileceği — hepsi katılımcı başına rastgele seçilir
- Anket bitince sonuçlar `VITE_RESULTS_ENDPOINT` adresine POST edilir (bkz. aşağıda); adres tanımlı değilse veya istek başarısız olursa yedek olarak katılımcının cihazına bir JSON dosyası iner

## Kurulum

```bash
npm install
cp .env.example .env   # VITE_RESULTS_ENDPOINT'i doldur (aşağıya bakın)
npm run dev
```

`npm run dev` ve `npm run build` her seferinde önce `stimuli-manifest.json`'ı otomatik yeniden üretir.

## Sonuçların kaydedileceği yer (Google Sheets)

1. Yeni bir Google Sheet aç.
2. **Extensions → Apps Script**, içeriği `google-apps-script/Code.gs` ile değiştir.
3. **Deploy → New deployment → Web app**, Execute as: *Me*, Who has access: *Anyone*.
4. Aldığın Web App URL'sini `.env` dosyasına yaz:
   ```
   VITE_RESULTS_ENDPOINT=https://script.google.com/macros/s/.../exec
   ```

`.env` git'e gitmez — deploy platformunda (ör. Vercel) bu değişkeni Environment Variables kısmından ayrıca girmen gerekir.

## Eksik / placeholder görseller

Kaynak veride bazı (referans, method) çiftleri için görsel eksikse, ilgili klasöre bir `PLACEHOLDER.txt` konur ve siyah bir placeholder görsel kullanılır; bu çiftler manifest'te `"placeholder": true` olarak, dolayısıyla Sheets'teki satırlarda da işaretli çıkar.
