**Aravalli Intelligence
AI-Powered Environmental Change Detection System
📌 Overview**

Aravalli Intelligence is a real-time environmental monitoring system that detects and classifies ecological changes across the Aravalli Range using satellite data from Google Earth Engine.

The system:

Fetches latest satellite datasets (NDVI & Nightlight)

Compares recent vs previous time periods

Detects statistical anomalies

Classifies changes into:

🌿 Natural

🏗 Man-Made

🔄 Mixed Activity

Displays results on an interactive dashboard map

**🎯 Project Objective**

To automatically detect:

Vegetation loss or growth

Urban expansion

Infrastructure development

Industrial activity

Agricultural shifts

Using satellite data and statistical comparison techniques.

**🏗 System Architecture**
Google Earth Engine
        ↓
FastAPI Backend (Python)
        ↓
Statistical Anomaly Detection
        ↓
React Frontend Dashboard
        ↓
Leaflet Interactive Map
**🧠 Technologies Used**
🔹 Backend

Python

FastAPI

Uvicorn

Google Earth Engine API

NumPy

Service Account Authentication

🔹 Frontend

React.js

Leaflet.js

Axios

React Icons

Custom Dashboard UI

🔹 Deployment

Backend → Render

Frontend → Vercel

**🌎 Data Sources**

Sentinel-2 Satellite (NDVI)

VIIRS Nightlight Data

Google Earth Engine datasets

⚙️ How It Works
1️⃣ Data Fetching

Backend connects to Google Earth Engine using Service Account credentials.

2️⃣ Time Comparison

System compares:

Latest 90 days

Previous 90 days

3️⃣ Change Detection

Calculates:

NDVI Difference

Nightlight Difference

4️⃣ Statistical Anomaly Detection

Detects significant deviations using threshold-based statistical logic.

5️⃣ Activity Classification

Rules applied:

Condition	Classification
NDVI decrease + stable light	Natural vegetation decline
NDVI increase	Natural growth
Light increase + vegetation loss	Urban expansion
Large light increase	Major development
Mixed signals	Mixed activity

6️⃣ Visualization

Displayed as:

Interactive map markers

Activity summary cards

Statistical comparison bars

Time comparison details

🚀 Running Locally
🔹 Backend Setup
cd backend
python -m venv venv

Activate environment:

Windows

venv\Scripts\activate

Mac/Linux

source venv/bin/activate

Install dependencies:

pip install -r requirements.txt

Set environment variables:

EE_SERVICE_ACCOUNT=your_service_account_email
EE_PRIVATE_KEY=your_private_key

Run backend:

uvicorn main:app --reload

Backend runs at:

http://127.0.0.1:8000

Test endpoint:

http://127.0.0.1:8000/analyze
🔹 Frontend Setup
cd frontend
npm install
npm start

Frontend runs at:

http://localhost:3000

📊 Features

✔ Real-time anomaly detection
✔ 90-day rolling comparison
✔ NDVI and Nightlight analysis
✔ Interactive Leaflet map
✔ Activity filtering
✔ Detailed analytics panel
✔ Live data refresh
✔ Full-stack deployment

📦 Example API Response
{
  "status": "success",
  "total_anomalies": 10,
  "data": [
    {
      "lat": 26.689133627645,
      "lon": 75.3125,
      "delta_ndvi": 0.176747985108274,
      "delta_nightlight": 0.0101516413917515,
      "ndvi_latest": 0.416289088858157,
      "ndvi_previous": 0.239541103749883,
      "nightlight_latest": 1.47476901555971,
      "nightlight_previous": 1.46461737416796,
      "latest_start": "2025-11-29",
      "latest_end": "2026-02-27",
      "previous_start": "2025-08-31",
      "previous_end": "2025-11-29",
      "comparison_days": 90,
      "type": "STATISTICAL_ANOMALY"
    },
  }
**🔐 Security
**
Service account authentication

Private keys stored as environment variables

No credentials exposed in frontend

🔮 Future Enhancements

AI/ML based classification model

PDF report generation

Heatmap visualization

Historical trend analytics

Multi-region expansion

Automated alert system

 
**
📜 Conclusion
**
Aravalli Intelligence demonstrates how satellite data, statistical analysis, and full-stack development can be integrated to build a real-time environmental monitoring platform.

The project showcases:

Remote sensing integration

Backend data processing

Frontend geospatial visualization

Deployment pipeline management

Applied AI-based classification
 
