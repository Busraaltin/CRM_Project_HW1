# CRM Projesi - UML Activity Workflow Diagram

Aşağıdaki UML Activity Diagram (Aktivite Diyagramı), `server.js` dosyanızda gerçekleşen webhook sürecinin algoritma adımlarını, koşul bloklarını (choices) ve durum değişimlerini resmi UML formatında göstermektedir.

Github Destekli *Mermaid* formatı ile oluşturulmuştur. Markdown önizlemesi (Preview) olan editörlerde veya [mermaid.live](https://mermaid.live/) üzerinde anında görsel şemaya dönüşür.

```mermaid
stateDiagram-v2
    %% Başlangıç Noktası
    [*] --> ReceiveWebhookPOST
    
    %% Veri Alım ve İşleme
    ReceiveWebhookPOST --> MapJSONData : Müşteri Verisini Oku ve Standartlaştır (Mapping)
    MapJSONData --> HasGeminiKey
    
    %% Karar / Koşul (Choice) Bloğu
    state HasGeminiKey <<choice>>
    HasGeminiKey --> AskGeminiAI : [Gemini API Key Tanımlı]
    HasGeminiKey --> UseDefaultData : [API Key Yok veya Hatalı]
    
    %% Yapay Zeka Adımları
    AskGeminiAI --> AppendAIData : AI'dan Özet (Summary) ve Skorlamayı Al
    UseDefaultData --> AppendAIData : Varsayılan Test (Mock) Veriyi Ekle
    
    %% CRM'e Sistemine Yazdırma
    AppendAIData --> SendToGoogleSheets : İşlenmiş Veriyi Google Scripts'e POST Et
    
    SendToGoogleSheets --> ResponseCheck
    
    %% Sonlandırma ve Karar Durumu
    state ResponseCheck <<choice>>
    ResponseCheck --> Success200 : [Google Sheets Kaydı Başarılı]
    ResponseCheck --> Error500 : [Sunucu veya Bağlantı Hatası]
    
    %% Bitiş Noktası
    Success200 --> [*]
    Error500 --> [*]
```
