# 🥂 BaR (Builder a Response)

[![npm version](https://img.shields.io/badge/npm-v1.0.0-blue.svg)](https://www.npmjs.com/package/@vorlaxen/bar)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?logo=typescript)](https://www.typescriptlang.org/)

**API yanıtlarınızı bir profesyonel gibi tasarlayın, bir barmen gibi servis edin.**

`BaR`, backend uygulamalarında JSON karmaşasını ortadan kaldırmak için tasarlanmış, TypeScript tabanlı hafif bir yanıt oluşturucudur. Her yanıtın; otomatik zaman damgaları, istek takibi ve meta veri enjeksiyonu ile tutarlı bir yapıda olmasını sağlar.

---

## ✨ Özellikler

*   **Akıcı Arayüz:** Yanıtları okunabilir, zincirlenebilir ve sezgisel bir söz dizimiyle oluşturun.
*   **Kesin Tutarlılık:** API'nizin hem başarılı hem de hatalı durumlarda tahmin edilebilir bir şema döndürmesini sağlar.
*   **Otomatik İzlenebilirlik:** `request_id`, `server_time` ve ISO zaman damgaları için yerleşik yönetim.
*   **Varsayılan Güvenlik:** Temel güvenlik başlıklarını (HSTS, No-Sniff vb.) otomatik olarak ekler.
*   **Tam Tip Güvenliği:** Üst düzey IntelliSense desteği için TypeScript ile yazılmıştır.

---

## 📦 Kurulum
```bash
npm install @vorlaxen/bar
```

---

## 🚀 Hızlı Başlangıç

### 1. Middleware'i Başlatın
`BaR` oluşturucusunu Express `res` nesnesine dahil edin.

```typescript
import express from 'express';
import { BaR } from '@vorlaxen/bar';

const app = express();

// Middleware sayesinde 'res.builder' tüm rotalarda kullanılabilir hale gelir
app.use(BaR.init());
```

### 2. İlk Yanıtınızı Gönderin
Manuel JSON objeleri oluşturmayı bırakın. Verilerinizi tek bir zincirle servis edin.

```typescript
app.get('/api/data', (req, res) => {
  const data = { kullanici: "Vorlaxen", rol: "Admin" };
  
  // Temiz, standart ve güvenli
  return res.builder.as.ok(data, "BaR'a hoş geldiniz!").send();
});
```

---

## 📐 Örnek Yanıt Yapısı

**BaR** tarafından sunulan her yanıt şu standart yapıyı takip eder:

```json
{
  "success": true,
  "timestamp": "2026-05-03T16:20:00.000Z",
  "message": "Kaynak başarıyla güncellendi.",
  "data": {
    "id": "123",
    "durum": "aktif"
  },
  "metadata": {
    "request_id": "internal-6hu261xbp",
    "server_time": "2026-05-03T16:20:00.000Z",
    "action_type": "UPDATED"
  }
}
```

---

### 💡 Neden BaR?
Modern API geliştirmede tutarlılık her şeydir. `BaR`, frontend ekibinin uç noktalarınızdan tam olarak ne bekleyeceğini bilmesini sağlayarak aradaki köprüyü kurar. Mesajın nerede olduğunu tahmin etmeye son; her şey her zaman doğru yerinde. 🥂

---

> **"Kodunuz bir sanat eseri, sunduğunuz cevaplar ise onun imzasıdır; imzanız ne kadar netse, eseriniz o kadar değerlidir."**