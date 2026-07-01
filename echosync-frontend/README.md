# EchoSync - AI-Powered Hospitality Crisis Management

EchoSync is a real-time, AI-driven crisis management hub designed for the Google Solution Challenge. It bridges the critical communication gap between panicked guests and isolated security teams during emergencies in large hospitality venues.

## 🔗 Live Prototype Links
- **Guest / Mobile View (Send SOS):** [https://echosync-frontend.vercel.app/](https://echosync-frontend.vercel.app/)
- **Admin / Mission Control (Receive SOS):** [https://echosync-frontend.vercel.app/admin](https://echosync-frontend.vercel.app/admin)
*(Tip: Open both links side-by-side to experience the Two-Way Real-Time status sync!)*

## 🌟 Core Features

- **Multi-Modal AI Threat Analysis:** Uses Google's **Gemini 2.5 Flash** to analyze both guest text and uploaded incident photos (e.g., a fire or medical emergency), instantly deducing the crisis severity and providing actionable recommendations.
- **Auto-Translation Engine:** Completely eliminates the language barrier. Gemini automatically detects the guest's native language, translates the crisis to English for the Admin Control Dashboard, and preserves the original context.
- **Two-Way "Lifeline" Status Sync:** Powered by **Firebase Realtime/Firestore**, the app provides sub-second status synchronization. When an Admin acknowledges an alert, the guest's mobile screen instantly transitions from a red "Panic" state to a calming green "Help Dispatched" state.
- **Mission Control Dashboard:** A live, geolocated map utilizing the **Google Maps API** to track active anomalies and dispatch teams efficiently.

## 🛠️ Technology Stack

- **Frontend:** React.js (Vite), TailwindCSS v4, Lucide Icons, React Google Maps API.
- **Backend:** Python (Flask), Google GenAI SDK (Gemini 2.5 Flash).
- **Database:** Firebase Firestore (Realtime NoSQL).
- **Deployment:** Vercel (Frontend), Render (Backend).

## 🚀 Future Integrations (Scaling for Impact)

1. **WearOS / Smartwatch Integration:** Developing a companion app for Google Pixel Watches that detects sudden falls or abnormal heart rate spikes, automatically triggering the EchoSync API without requiring the user to press a button.
2. **Predictive Analytics & Heatmaps:** Upgrading the Admin Dashboard to utilize historical Firebase data to generate predictive heatmaps. This will allow venues to proactively station medical or security staff in statistically high-risk zones.
3. **Automated Facility Interfacing:** Integrating EchoSync directly with IoT hotel infrastructure to automatically unlock emergency exits or trigger localized fire suppression systems based on Gemini's priority assessment.

## 💻 Local Development Setup

### Frontend
```bash
cd echosync-frontend
npm install
npm run dev
```

### Backend
```bash
cd echosync-backend
# Activate virtual environment
.\venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

*Note: You must configure your own `.env` files with Firebase credentials, a Google Maps API Key, and a Gemini API Key to run locally.*
