# מערכת ניהול מסמכים 📄

מערכת מתקדמת לניהול, אחסון וחיפוש מסמכים דיגיטליים הבנויה בטכנולוגיות וב מודרניות.

## 🌟 תכונות המערכת

- **העלאת מסמכים**: תמיכה ב-PDF, DOC, DOCX, TXT ותמונות
- **חיפוש מתקדם**: חיפוש בתוכן המסמכים ובשמות הקבצים
- **ניהול מסמכים**: צפייה, הורדה ומחיקה של מסמכים
- **ממשק משתמש מותאם עברית**: עיצוב מותאם לכיוון מימין לשמאל
- **רספונסיבי**: עובד מצוין בכל המכשירים
- **PWA מוכן**: תמיכה ב-Service Worker לחוויית אפליקציה

## 🚀 פריסה ב-Netlify - מדריך שלב אחר שלב

### שלב 1: הכנת הפרויקט

הפרויקט מוכן לפריסה ב-Netlify עם כל הקבצים הנדרשים:
- ✅ `index.html` - הדף הראשי
- ✅ `styles/main.css` - עיצוב המערכת
- ✅ `scripts/main.js` - לוגיקה של המערכת
- ✅ `netlify.toml` - קובץ תצורה ל-Netlify
- ✅ `404.html` - דף שגיאה 404 מעוצב

### שלב 2: העלאה ל-GitHub

אם עדיין לא עשית זאת, העלה את הפרויקט ל-GitHub:

```bash
# התחברות ל-Git (אם עוד לא עשית)
git init
git add .
git commit -m "Initial commit: Document Management System"

# הוספת remote repository
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### שלב 3: חיבור ל-Netlify

#### אופציה א': דרך ממשק Netlify (מומלץ)

1. **כניסה ל-Netlify**:
   - היכנס ל-[netlify.com](https://netlify.com)
   - התחבר עם חשבון GitHub שלך

2. **יצירת אתר חדש**:
   - לחץ על "New site from Git"
   - בחר "GitHub" כספק Git
   - בחר את הrepository של הפרויקט

3. **הגדרת הפריסה**:
   ```
   Build command: (השאר ריק)
   Publish directory: .
   ```

4. **לחץ "Deploy site"** ותוך דקות יהיה לך אתר פעיל!

#### אופציה ב': דרך Netlify CLI

```bash
# התקנת Netlify CLI
npm install -g netlify-cli

# התחברות ל-Netlify
netlify login

# פריסה של האתר
netlify deploy --prod --dir .
```

### שלב 4: הגדרות מתקדמות (אופציונלי)

#### הגדרת דומיין מותאם אישית
1. בממשק Netlify, עבור ל-"Domain settings"
2. לחץ "Add custom domain"
3. הזן את הדומיין שלך
4. עקוב אחר ההוראות לעדכון DNS

#### הפעלת HTTPS
Netlify מפעיל HTTPS אוטומטית עם Let's Encrypt certificate.

### שלב 5: אימות הפריסה

לאחר הפריסה, בדוק שהאתר עובד תקין:
- ✅ הדף הראשי נטען
- ✅ ניתן לנווט בין הדפים
- ✅ העלאת קבצים עובדת (נשמרת במקומי בדפדפן)
- ✅ חיפוש במסמכים פועל

## 🏗️ מבנה הפרויקט

```
webapp/
├── index.html              # דף ראשי
├── 404.html               # דף שגיאה
├── favicon.ico            # אייקון האתר
├── netlify.toml           # הגדרות Netlify
├── README.md              # מדריך זה
├── styles/
│   └── main.css           # עיצוב ראשי
├── scripts/
│   └── main.js            # לוגיקה ראשית
└── functions/             # פונקציות Netlify (עתידי)
```

## 🛠️ פיתוח מקומי

להרצה מקומית של הפרויקט:

```bash
# שרת HTTP פשוט עם Python
python -m http.server 8000

# או עם Node.js
npx http-server . -p 8000

# או עם Netlify Dev (מומלץ)
netlify dev
```

פתח בדפדפן: `http://localhost:8000`

## 🔧 טכנולוגיות

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Storage**: LocalStorage (עבור הדגמה)
- **Hosting**: Netlify
- **CSS Framework**: עיצוב מותאם אישית
- **Icons**: Unicode Emoji

## 🚀 תכונות עתידיות

הפרויקט מוכן להרחבה עם התכונות הבאות:

### שרותים חיצוניים מומלצים:
- **PDF Processing**: PDF.js או שירות OCR חיצוני
- **File Storage**: Cloudinary, AWS S3, או Google Cloud Storage
- **Search Engine**: Elasticsearch או Algolia
- **Authentication**: Netlify Identity או Auth0
- **Database**: Fauna, Supabase, או Firebase

### שירותי API לעיבוד מסמכים:
```javascript
// דוגמה לשימוש ב-API חיצוני לקריאת PDF
async function processPDFWithAPI(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: {
            'apikey': 'YOUR_API_KEY'
        },
        body: formData
    });
    
    const result = await response.json();
    return result.ParsedResults[0].ParsedText;
}
```

## 📈 ניטור ואנליטיקה

להוספת Google Analytics:
1. הוסף את הקוד הבא ב-`<head>` של `index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_TRACKING_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_TRACKING_ID');
</script>
```

## 🔒 אבטחה

הפרויקט כולל הגדרות אבטחה בסיסיות ב-`netlify.toml`:
- Security Headers
- CSP (Content Security Policy)
- HTTPS Redirect
- Cache Headers

## 🆘 פתרון בעיות

### בעיות נפוצות:

**האתר לא נטען**:
- בדוק שקובץ `index.html` נמצא בשורש הפרויקט
- ודא שה-`netlify.toml` מגדיר נכון את ה-`publish` directory

**קבצי CSS/JS לא נטענים**:
- בדוק את הנתיבים ב-`index.html`
- ודא שהקבצים נמצאים במקום הנכון

**שגיאות JavaScript**:
- פתח את Developer Tools (F12) ובדוק את קונסולת השגיאות
- ודא שכל הפונקציות מוגדרות נכון

## 📞 תמיכה

לעזרה נוספת:
- [תיעוד Netlify](https://docs.netlify.com/)
- [GitHub Issues](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME/issues)

## 📝 רישיון

פרויקט זה פתוח לשימוש ופיתוח נוסף.

---

**בהצלחה עם הפרויקט! 🎉**

לאחר הפריסה, תוכל להמשיך לפתח ולהוסיף תכונות נוספות למערכת ניהול המסמכים שלך.