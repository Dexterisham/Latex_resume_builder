# 📄 AI Resume Builder (Gemini + LaTeX)

An intelligent resume generator that uses **Google Gemini AI** to tailor your resume for specific job descriptions and compiles it into a professional PDF using **LaTeX**.

## 🚀 Features
- **AI-Powered Tailoring**: Rewrites your summary, skills, and experience to match the JD keywords.
- **LaTeX Quality**: Generates beautiful, ATS-friendly PDFs using professional templates.
- **Full Control**: Uses your "Master Profile" as the source of truth.
- **History Tracking**: Keeps a history of your generated resumes and LaTeX source code.
- **Dockerized**: Run it anywhere without installing Node.js or LaTeX manually.

## 🛠️ Prerequisites
- **Docker Desktop** installed.
- **Google API Key** (Get one [here](https://aistudio.google.com/)).

## 🏁 Quick Start (Recommended)

1.  **Clone/Download** this repository.
2.  **Create a `.env` file** in the root directory:
    ```env
    GOOGLE_API_KEY=your_actual_api_key_here
    ```
3.  **Run with Docker**:
    ```bash
    docker-compose up --build
    ```
4.  **Open Browser**:
    Go to [http://localhost:8000](http://localhost:8000).

---

## 📂 Project Structure
- `frontend/`: React + Vite UI.
- `backend/`: Node.js Express Server.
- `backend/data/profile.md`: Edit this file to update your master information.
- `backend/data/templates/`: Place your custom `.tex` templates here.

## ❓ Troubleshooting
- **First run is slow**: Docker needs to download ~1GB of LaTeX fonts/packages. This is normal.
- **Microphone/Camera**: Not used in this version.
- **"Profile not found"**: Go to the "Master Profile" tab in the UI and save your details.

## 📦 Manual Setup (Without Docker)
If you prefer running it natively:
1. Install **Node.js 18+**.
2. Install **MikTeX** (Windows) or **TeXLive** (Linux/Mac).
3. Backend: `cd backend && npm install && node server.js`.
4. Frontend: `cd frontend && npm install && npm run dev`.
