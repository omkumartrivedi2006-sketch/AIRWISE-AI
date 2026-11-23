# AIRWISE AI — Frontend Deployment Guide (Next.js 15 App Router)

This guide provides instructions for deploying the AIRWISE AI frontend application to **Vercel** or any standard containerized hosting environment.

---

## 1. Deploying to Vercel (Recommended)

### Step 1: Connect GitHub Repository
1. Log in to [Vercel](https://vercel.com) and click **"Add New Project"**.
2. Select the repository: `omkumartrivedi2006-sketch/AIRWISE-AI`.
3. Set **Root Directory** to: `frontend`.

### Step 2: Configure Build Settings
- **Framework Preset**: Next.js (automatically detected)
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### Step 3: Configure Environment Variables
In the Vercel project settings under **Environment Variables**, configure:

| Variable Name | Environment | Value Description | Example Value |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_BASE_URL` | Production, Preview | Fully-qualified URL to backend API `/api/v1` | `https://api.airwise.ai/api/v1` or `https://airwise-backend.onrender.com/api/v1` |
| `NEXT_PUBLIC_SITE_URL` | Production, Preview | Public canonical domain for SEO sitemap & robots | `https://airwise.ai` |

### Step 4: Deploy & Verify
1. Click **"Deploy"**.
2. Review the build output: All 32 routes must compile statically with exit code 0.
3. Access the deployed preview URL (e.g. `https://airwise.vercel.app`).

---

## 2. Deploying via Docker Container (Alternative)

If deploying to a container runtime (AWS ECS, Google Cloud Run, Render Web Service):

```bash
cd frontend
docker build -t airwise-frontend:latest .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_BASE_URL=https://api.airwise.ai/api/v1 \
  -e NEXT_PUBLIC_SITE_URL=https://airwise.ai \
  airwise-frontend:latest
```

The container runs with unprivileged user `nextjs` (UID 1001) on port 3000 with integrated health checks.
