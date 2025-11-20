# מדריך התחלה מהירה

## תוכן
1. [התקנה והפעלה](#התקנה-והפעלה)
2. [שימוש במערכת](#שימוש-במערכת)
3. [ארכיטקטורה](#ארכיטקטורה)
4. [מודולים עיקריים](#מודולים-עיקריים)

---

## התקנה והפעלה

### Frontend

```bash
cd frontend
npm install
npm run dev
```

האפליקציה תרוץ ב: `http://localhost:3000`

### Backend (אופציונלי לעת עתה)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python src/main.py
```

הAPI ירוץ ב: `http://localhost:8000`

---

## שימוש במערכת

### 1. התחברות
- הכנס אימייל וסיסמה
- אם המשתמש לא קיים, המערכת תיצור חשבון חדש אוטומטית

### 2. דשבורד
בדשבורד תוכל לגשת ל:
- 🏋️ **אימונים** - זיהוי תרגילים וספירת חזרות
- 🧠 **ניתוח רעידות** - מדידת טרמור לפרקינסון
- 📈 **סטטיסטיקות** - מעקב אחר התקדמות

### 3. ניתוח רעידות (Tremor Analysis)

**שלבים:**
1. בחר איבר לניתוח (יד ימין/שמאל, ראש, רגל)
2. לחץ "התחל ניתוח"
3. המערכת תאסוף נתונים למשך 3 שניות
4. תוצאות יוצגו בזמן אמת:
   - **אמפליטודה** - עוצמת הרעידה (pixels)
   - **תדירות** - תדירות הרעידה (Hz)
   - **חומרה** - סיווג: קל/בינוני/חמור
   - **UPDRS Score** - ציון 0-4 לפי סולם פרקינסון
5. לחץ "שמור מדידה" לשמירת תוצאות

**טיפים:**
- ודא תאורה טובה
- עמוד מול המצלמה במרחק 1.5-2 מטר
- הגוף המלא צריך להיות בפריים
- לבדיקת רעידות ידיים - החזק את היד מול המצלמה

---

## ארכיטקטורה

```
fitness-ai/
├── frontend/              # React + TypeScript
│   ├── src/
│   │   ├── components/   # רכיבי UI
│   │   ├── pages/        # דפים (Dashboard, TremorAnalysis, וכו')
│   │   ├── services/     # לוגיקה עסקית
│   │   │   ├── PoseDetector.ts
│   │   │   ├── TremorDetector.ts
│   │   │   └── ExerciseCounter.ts
│   │   ├── stores/       # Zustand state management
│   │   └── config/       # Configuration (Firebase)
│   └── package.json
│
├── backend/               # FastAPI
│   ├── src/
│   │   ├── api/          # REST endpoints
│   │   ├── models/       # Database models
│   │   ├── services/     # Business logic
│   │   └── ml/           # ML models
│   └── requirements.txt
│
├── shared/                # Shared TypeScript types
└── docs/                  # תיעוד
```

---

## מודולים עיקריים

### 🔍 PoseDetector
עוטף את MediaPipe Pose לזיהוי תנוחת גוף

**שימוש:**
```typescript
const detector = new PoseDetector({
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
})

await detector.start(videoElement)

detector.onResults((results) => {
  console.log(results.landmarks)
})
```

### 🧠 TremorDetector
ניתוח רעידות (טרמור) בזמן אמת

**Features:**
- Detrending - הסרת תנועות איטיות
- FFT analysis - ניתוח תדרים
- UPDRS scoring - ציון קליני
- Multi-body part support

**שימוש:**
```typescript
const tremor = new TremorDetector({
  windowSize: 90,  // 3 seconds at 30fps
  minAmplitudeThreshold: 2,
})

tremor.addFrame(landmarks, timestamp)

if (tremor.isReady()) {
  const measurement = tremor.analyzeTremor('hand_right', userId)
  console.log(measurement.amplitude, measurement.frequency)
}
```

### 💪 ExerciseCounter
ספירת חזרות תרגילים

**תמיכה בתרגילים:**
- Bicep Curls
- Squats
- Shoulder Press

**שימוש:**
```typescript
const counter = new ExerciseCounter()

const result = counter.processFrame(landmarks, 'bicep_curl')
console.log(result.count, result.feedback)
```

---

## Types מרכזיים

```typescript
// Tremor Measurement
interface TremorMeasurement {
  amplitude: number      // pixels
  frequency: number      // Hz
  severity: 'mild' | 'moderate' | 'severe'
  updrsScore: number    // 0-4
  bodyPart: 'hand_left' | 'hand_right' | 'head' | ...
}

// Pose Landmarks
interface Landmark {
  x: number
  y: number
  z: number
  visibility?: number
}
```

---

## טכנולוגיות

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **MediaPipe Pose** - Pose detection
- **TensorFlow.js** - ML in browser
- **Zustand** - State management
- **Chart.js** - Data visualization

### Backend (עתידי)
- **FastAPI** - Python web framework
- **PostgreSQL** - Database
- **TensorFlow** - ML models
- **OpenCV** - Computer vision

---

## הצעדים הבאים

### Phase 2: Full Workout Session
- [ ] Exercise detection page
- [ ] Form analysis
- [ ] Real-time feedback with audio
- [ ] Session recording

### Phase 3: IMBODY Integration
- [ ] Research IMBODY API
- [ ] Connect to device
- [ ] Sync data with pose

### Phase 4: Analytics Dashboard
- [ ] Charts and graphs
- [ ] Progress tracking
- [ ] Reports generation

---

## תמיכה

לשאלות או בעיות, פתח issue ב-GitHub או צור קשר עם הצוות.

---

**פותח כחלק מתזה למ"א במדעי המחשב**
מערכת AI לשיקום סרקופניה ובעיות נוירולוגיות
