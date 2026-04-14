require('dotenv').config();
const http = require('http');
const { processLeadData } = require('./mapping_function');


const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "YOUR_API_KEY";

const PORT = 3000;

// Basit bir web sunucusu oluşturarak Webhook'u ayağa kaldırıyoruz
const server = http.createServer((req, res) => {
  // Sadece POST /webhook isteklerini kabul et
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';

    // Gelen verileri okuma
    req.on('data', chunk => {
      body += chunk.toString();
    });

    // Veri okuma bittiğinde çalışır
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        console.log("\n==============================================");
        console.log("🟢 1. Webhook Tetiklendi (Veri Alındı):");
        console.log(payload);

        // Adım 2: Mapping fonksiyonunu kullanarak veriyi formata sokma
        const mappedData = processLeadData(payload);
        console.log("\n🟡 2. İşlem (Mapping): Veri standart formata çevrildi:");
        console.log(mappedData);

        // Adım 3: Gemini AI ile Özeti Çıkarma ve Öncelik Belirleme
        console.log("\n🟣 3. AI İşlemi (Gemini API): Gemini'ye analiz için yollanıyor...");

        let aiSummary = "There is a request from a customer with a message. ";
        let aiRating = "Medium";

        if (GEMINI_API_KEY && GEMINI_API_KEY !== "YOUR_API_KEY" && !GEMINI_API_KEY.includes("Buraya")) {
          try {
            const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                contents: [{
                  parts: [{
                    text: `Aşağıdaki müşteri mesajını analiz et.\n\nMesaj: "${mappedData.inquiry_message}"\n\n1. Mesajı çok kısa (tek cümle) özetle.\n2. Müşterinin ne kadar acil/ciddi olduğuna göre "Low", "Medium" veya "High" olarak puan ver.\n\nSADECE aşağıdaki formatta bir JSON döndür:\n{"summary": "ÖZET", "rating": "Low/Medium/High"}`
                  }]
                }]
              })
            });
            // --- BİTTİ ---

            if (!aiResponse.ok) {
              const errorText = await aiResponse.text();
              throw new Error(`Gemini Hatası: ${aiResponse.status} - ${errorText}`);
            }

            const aiData = await aiResponse.json();
            const aiText = aiData.candidates[0].content.parts[0].text;

            // AI bazen markdown formatında dönebilir, doğrudan JSON'ı temizleyip alalım
            const cleanJson = aiText.substring(aiText.indexOf("{"), aiText.lastIndexOf("}") + 1);
            if (!cleanJson) throw new Error("JSON formatı bulunamadı.");
            const parsedAiResult = JSON.parse(cleanJson);

            aiSummary = parsedAiResult.summary || aiSummary;
            aiRating = parsedAiResult.rating || aiRating;

            console.log(`-> Sonuç: Özet: "${aiSummary}" | Öncelik: ${aiRating}`);
          } catch (aiError) {
            console.error("-> AI Hatası (Varsayılan değerler eklenecek):", aiError.message);
          }
        } else {
          console.log("-> ⚠️ Uyarı: GEMINI_API_KEY girmediniz, test (mock) AI sonucu ekleniyor...");
          aiSummary = "[TEST] Musteri urunle ilgileniyor (SALLAMASYON TEST).";
          aiRating = "High";
        }

        // AI değerlerini mappedData içine ekle
        mappedData.ai_summary = aiSummary;
        mappedData.ai_rating = aiRating;

        // Adım 4: Google Sheets (Web App URL) Veri Gönderme İşlemi
        console.log(`\n🔵 4. Google Sheets: Veriler hazırlanan tabloya gönderiliyor...`);
        const googleUrl = process.env.GOOGLE_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbz5YsgWrl_ELPyqF6PyBwaH8qlnP2WS04xyJE0hwJq7vlCfJld-ySL2OQV1Ay-1vM0c/exec";

        try {
          const sheetResponse = await fetch(googleUrl, {
            method: "POST",
            headers: {
              // Apps Script genellikle raw JSON için "text/plain" headerı isteyebiliyor (CORS preflight atlaması için)
              "Content-Type": "text/plain"
            },
            body: JSON.stringify(mappedData)
          });

          const sheetResult = await sheetResponse.text();
          console.log(`-> Google Sheets Cevabı: ${sheetResult}`);
        } catch (sheetError) {
          console.error("-> ❌ Google Sheets Hatası:", sheetError.message);
        }

        console.log("==============================================\n");

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: "Workflow başarıyla tamamlandı!",
          data: mappedData
        }));

      } catch (error) {
        console.error("\n❌ Beklenmeyen bir Hata:", error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
  } else {
    // Diğer tüm rotalar/metodlar için 404 dön
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Sadece POST ile /webhook endpointini kullanin.');
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Webhook Sunucusu başlatıldı!`);
  console.log(`Durdurmak için: CTRL + C`);
  console.log(`API ayarları .env dosyasından kontrol ediliyor.`);
});
