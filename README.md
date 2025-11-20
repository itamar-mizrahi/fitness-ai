# AI Rehabilitation System

מערכת AI מתקדמת לשיקום וטיפול בבעיות רפואיות, עם התמקדות בסרקופניה, פרקינסון, ומצבים נוירולוגיים.

## תכונות

- 🏋️ זיהוי תרגילים וספירת חזרות
- 🧠 ניתוח רעידות (Tremor Detection) לניטור פרקינסון
- 📊 מעקב אחר התקדמות ומדדי שיפור
- 🔐 אימות משתמשים עם Firebase
- 📈 דשבורד ניתוח נתונים
- 🎯 תוכניות אימון מותאמות אישית

## טכנולוגיות

**Frontend:**
- React + TypeScript
- Vite
- MediaPipe Pose
- TensorFlow.js
- Chart.js

**Backend:**
- FastAPI
- Python
- PostgreSQL
- TensorFlow

## התחלה מהירה

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python src/main.py
```

## Structure

```
fitness-ai/
├── frontend/          # React application
├── backend/           # FastAPI server
├── shared/            # Shared types
├── docs/              # Documentation
└── research/          # Research protocols
```

## תזה

מערכת זו מפותחת כחלק מתזה למ"א במדעי המחשב, עם התמקדות בפיתוח טכנולוגי של מערכת AI לשיקום ולמחקר קליני.

## License

MIT
