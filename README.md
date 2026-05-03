# 🥂 BaR (Builder a Response)

[![npm version](https://img.shields.io/badge/npm-v1.0.0-blue.svg)](https://www.npmjs.com/package/@vorlaxen/bar)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?logo=typescript)](https://www.typescriptlang.org/)

**Design your API responses like a pro, serve them like a bartender.**

`BaR` is a lightweight, TypeScript-based response builder designed to eliminate JSON clutter in backend applications. It ensures every response follows a consistent structure with automatic timestamps, request tracking, and metadata injection.

---

## ✨ Features

*   **Fluent Interface:** Build responses with a readable, chainable, and intuitive syntax.
*   **Absolute Consistency:** Guarantees your API returns a predictable schema for both success and error states.
*   **Automatic Traceability:** Built-in management for `request_id`, `server_time`, and ISO timestamps.
*   **Secure by Default:** Automatically appends essential security headers (HSTS, No-Sniff, etc.).
*   **Full Type Safety:** Written in TypeScript for top-tier IntelliSense support.

---

## 📦 Installation
```bash
npm install @vorlaxen/bar
```

---

## 🚀 Quick Start

### 1. Initialize the Middleware
Integrate the `BaR` builder into the Express `res` object.

```typescript
import express from 'express';
import { BaR } from '@vorlaxen/bar';

const app = express();

// Middleware makes 'res.builder' accessible in all routes
app.use(BaR.init());
```

### 2. Send Your First Response
Stop creating manual JSON objects. Serve your data with a single chain.

```typescript
app.get('/api/data', (req, res) => {
  const data = { user: "Vorlaxen", role: "Admin" };
  
  // Clean, standard, and secure
  return res.builder.as.ok(data, "Welcome to BaR!").send();
});
```

---

## 📐 Sample Response Structure

Every response served by **BaR** follows this standard structure:

```json
{
  "success": true,
  "timestamp": "2026-05-03T16:20:00.000Z",
  "message": "Resource updated successfully.",
  "data": {
    "id": "123",
    "status": "active"
  },
  "metadata": {
    "request_id": "internal-6hu261xbp",
    "server_time": "2026-05-03T16:20:00.000Z",
    "action_type": "UPDATED"
  }
}
```

---

### 💡 Why BaR?
Consistency is everything in modern API development. `BaR` builds the bridge by ensuring your frontend team knows exactly what to expect from your endpoints. No more guessing where the message is; everything is always in its right place. 🥂

---

> **"Your code is a work of art, and your responses are its signature; the clearer the signature, the more valuable the work."**