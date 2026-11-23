# AIRWISE AI — End-User Operational Guide

This guide provides end users, environmental researchers, and citizens with comprehensive instructions on utilizing the features of AIRWISE AI.

---

## 1. Getting Started & Account Setup

### Registration
1. Navigate to the landing page and click **"Get Started"** or visit `/register`.
2. Enter your full name, email address, and a secure password (minimum 8 characters, containing uppercase, lowercase, numbers, and special symbols).
3. Upon registration, you are automatically signed in with standard citizen privileges and redirected to the **Overview Dashboard**.

### Managing Profile & Environmental Preferences
1. Click your profile avatar in the upper navigation bar and choose **"Settings"** or navigate to `/settings`.
2. **Units of Measurement**: Select Celsius (°C) or Fahrenheit (°F) for temperature telemetry.
3. **Environmental Focus**: Select your health considerations (e.g., *Asthma*, *Cardiovascular sensitivities*, *Child respiratory wellness*, *Outdoor fitness*).
4. **Notification Channels**: Enable or disable email digests, push notifications, and in-app alert banners.
5. **Quiet Hours**: Specify daily intervals (e.g., 22:00 to 07:00) during which routine advisory notifications are suppressed.

---

## 2. Exploring Real-Time Air Quality & Live Telemetry

### Dashboard Overview (`/dashboard`)
- **Primary Station Widget**: Displays real-time AQI with color-coded classification according to the **US EPA AQI Standard** (0–50 Good [Green], 51–100 Moderate [Yellow], 101–150 Unhealthy for Sensitive Groups [Orange], 151–200 Unhealthy [Red], 201–300 Very Unhealthy [Purple], 301–500 Hazardous [Maroon]).
- **Key Pollutant Cards**: Real-time concentration readings for **PM2.5**, **PM10**, **NO₂**, **O₃**, **SO₂**, and **CO** in $\mu\text{g/m}^3$.
- **Source Transparency Badge**: Identifies whether telemetry is derived from calibrated physical ground stations (WAQI) or European atmospheric dispersion numerical models (Open-Meteo CAMS).

### Geospatial Interactive Map (`/map`)
- Pan and zoom across global observation stations with color-coded AQI markers.
- Filter by pollutant type (PM2.5, PM10, NO₂, O₃) or AQI severity tiers.
- Click any marker to view the latest timestamp, verified reading, and station details.

### Historical Trends & Analytics (`/analytics`)
- Select 24-hour, 7-day, or 30-day timeframes.
- Examine chronological pollutant trendlines and rolling moving averages.
- Download verified data in standard CSV format for offline research.

### Multi-Location Cross-Comparison (`/compare`)
- Select 2 to 5 monitoring stations simultaneously.
- Automated scale validation ensures both stations report on comparable measurement scales.
- Compare side-by-side pollutant variations and peak exposure windows.

---

## 3. Conversational AI Environmental Assistant (`/assistant`)

- Ask natural language questions:
  - *"Is it safe for an asthmatic child to jog outside in Leeds this afternoon?"*
  - *"Compare the PM2.5 levels between London and Edinburgh over the past 48 hours."*
  - *"What indoor filtration measures should I take during high ozone alerts?"*
- **Conversational Memory**: The assistant retains contextual dialogue history within an active conversation thread.
- **Source Attribution**: AI answers cite ground observation stations and atmospheric model timestamps.

---

## 4. Personalized Smart Alerts & Recommendations

### Setting Custom Alert Rules (`/alerts`)
1. Click **"Create Alert Rule"**.
2. Select target location and pollutant threshold (e.g., *PM2.5 > 35 $\mu\text{g/m}^3$* or *AQI > 100*).
3. Set alert frequency and delivery channel (In-App notification center, push, or email).
4. Automated deduplication prevents notification spam during extended pollution episodes.

### Notification Center (`/notifications`)
- Bell icon in the navigation bar displays badge count for unread warnings.
- Click to view actionable health recommendations and mark alerts as acknowledged.
