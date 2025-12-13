# � AI Resume Builder (Gemini + LaTeX)

**Build professional, ATS-friendly resumes in seconds.**

This application leverages **Google Gemini AI** to rewrite and tailor your resume for specific job descriptions, while using **LaTeX** to ensure perfect, professional formatting every time. It's designed for developers, engineering managers, and anyone who wants a premium, code-backed resume solution.

![Resume Builder Sceenshot](http://localhost:8000/preview.png) <!-- Conceptual Placeholder -->

## ✨ Key Features

- **🤖 AI-Powered Tailoring**: Rewrites your summary, skills, and experience to specifically match the keywords and requirements of any Job Description (JD) you paste.
- **📄 LaTeX Precision**: Generates high-quality `.pdf` and `.tex` files. Say goodbye to formatting nightmares in Word.
- **♻️ Master Profile System**: 
    - Maintain a "source of truth" for your career.
    - **Structured Forms**: Organize Personal Info, Skills, Experience, Projects, and Story-based Achievements.
    - **One-Click Updates**: Easily add new roles or skills without fighting layout.
- **🐙 GitHub Integration**: 
    - Directly import your public repositories as projects.
    - Automatically fetches repository names, languages, and descriptions.
- **📂 History & Versioning**: Keeps a log of every resume you generate, allowing you to download past PDFs or LaTeX sources.
- **🐳 Dockerized**: Fully containerized setup for easy deployment.

## 🛠️ Technology Stack

- **Frontend**: React (Vite), Tailwind CSS
- **Backend**: Node.js, Express
- **AI**: Google Gemini Pro/Flash API
- **Typesetting**: MikTeX / TeXLive
- **Containerization**: Docker & Docker Compose

## � Quick Start

### Prerequisites
- **Node.js 18+** OR **Docker Desktop**
- **Google API Key** (Get one for free at [Google AI Studio](https://aistudio.google.com/))
- **MikTeX** (If running locally on Windows) or **TeXLive** (Linux/Mac)

### Option A: Running with Docker (Recommended)
1. **Clone the repo**:
   ```bash
   git clone <repo-url>
   cd resume_builder
   ```
2. **Configure Environment**:
   Create a `.env` file in the root directory:
   ```env
   GOOGLE_API_KEY=your_actual_api_key_here
   ```
3. **Start the App**:
   ```bash
   docker-compose up --build
   ```
4. **Access**: Open [http://localhost:8000](http://localhost:8000)

### Option B: Running Locally (Dev Mode)
1. **Backend**:
   ```bash
   cd backend
   npm install
   # Ensure MikTeX is in your PATH
   node server.js
   ```
2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 📖 User Guide

### 1. Set Up Your Master Profile
Navigate to the **Master Profile** tab. This is where you dump *everything* about your career.
- **Personal Info**: Contact details.
- **Skills**: Add all your technical and soft skills.
- **Experience**: List all your roles.
- **Projects**: Manually add projects or use the **"Import from GitHub"** feature to fetch your public repos.
- **Stories**: Add narrative achievements (STAR method). The AI uses these to build compelling bullet points.

### 2. Generate a Resume
1. Go to the **Generate** tab.
2. Paste the **Job Description** (JD) of the role you are applying for.
3. (Optional) Enter a **Resume Name** (e.g., `Google_Frontend_Engineer`).
4. Select a **Template**.
5. Click **Generate Resume**.

### 3. Result
- The AI will analyze the JD and your Profile.
- It will select the most relevant skills and experiences.
- It will generate a `.tex` file and compile it into a PDF.
- You can **Download PDF** or grab the **LaTeX Source** to tweak it manually on Overleaf.

## 📂 Project Structure
```
resume_builder/
├── backend/
│   ├── data/
│   │   ├── profile.json    # Your stored profile data
│   │   ├── resumes/        # Generated PDFs and .tex files
│   │   └── templates/      # LaTeX templates
│   ├── services/
│   │   ├── llm.js          # Google Gemini integration
│   │   └── pdf.js          # PDF compilation logic
│   └── server.js           # Express API
├── frontend/               # React Application
└── docker-compose.yml
```

## 🤝 Contributing
Feel free to fork and add new LaTeX templates in `backend/data/templates/`!
