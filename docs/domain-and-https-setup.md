# AIRWISE AI — Domain & HTTPS Configuration

This guide outlines the DNS architecture, SSL/TLS certificate management, and cross-origin cookie routing required for custom domains.

---

## 1. Domain Architecture Model

```text
               apex domain: airwise.ai
                     |
       +-------------+-------------+
       |                           |
  www.airwise.ai             api.airwise.ai
(Frontend - Vercel)       (Backend - Render)
```

---

## 2. DNS Record Configuration

Configure the following DNS records at your domain registrar (e.g., Cloudflare, Namecheap, Route 53):

| Type | Name / Host | Target / Value | TTL | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **A** | `@` (apex) | `76.76.21.21` | Auto / 300s | Vercel Apex Frontend IP |
| **CNAME** | `www` | `cname.vercel-dns.com` | Auto / 300s | Vercel WWW Frontend Subdomain |
| **CNAME** | `api` | `airwise-backend.onrender.com` | Auto / 300s | Render Backend Subdomain |

---

## 3. SSL/TLS Certificate Provisioning

- **Frontend (Vercel)**: Automatically provisions Let's Encrypt / DigiCert certificates with automatic 90-day renewal upon DNS propagation.
- **Backend (Render)**: Automatically provisions TLS certificates for custom domains. TLS 1.3 is enforced by default.

---

## 4. Cross-Origin Cookie & CORS Alignment

When frontend and backend share an apex domain (`.airwise.ai`):
- In `backend/.env`:
  ```env
  COOKIE_DOMAIN=".airwise.ai"
  COOKIE_SAMESITE="lax"
  COOKIE_SECURE=true
  ALLOWED_ORIGINS=["https://airwise.ai","https://www.airwise.ai"]
  FRONTEND_URL="https://airwise.ai"
  BACKEND_URL="https://api.airwise.ai"
  ```
- In `frontend/.env.production`:
  ```env
  NEXT_PUBLIC_API_BASE_URL="https://api.airwise.ai/api/v1"
  NEXT_PUBLIC_SITE_URL="https://airwise.ai"
  ```

If using separate hosting domains (e.g. `airwise.vercel.app` and `airwise-backend.onrender.com`):
- Set `COOKIE_SAMESITE="none"` and `COOKIE_SECURE=true` so cross-origin cookies are transmitted.
- Leave `COOKIE_DOMAIN=""` unset.
