# MyluimSync - Design System

## סקירה כללית
אפליקציית React (Vite) לסיוע לסטודנטים במילואים להשלמת חומרי לימוד.

## צבעים (Colors)

| שם | קוד HEX | שימוש |
|---|---|---|
| Primary | `#1E3A8A` | כפתורים ראשיים, לוגו, כותרות |
| Secondary | `#3B82F6` | כפתורים משניים, קישורים, אייקונים |
| Accent | `#16A34A` | הודעות הצלחה, תגיות חיוביות |
| Background | `#F8FAFC` | רקע כללי של האפליקציה |
| Text | `#1E293B` | טקסט ראשי |
| Error | `#EF4444` | הודעות שגיאה |
| Success | `#22C55E` | הודעות הצלחה |
| Border | `#CBD5E1` | גבולות, קווי הפרדה |
| White | `#FFFFFF` | רקע כרטיסים, אלמנטים |

## טיפוגרפיה (Typography)

| סוג | גודל | משקל | שימוש |
|---|---|---|---|
| Heading LG | 32px | 700 (Bold) | כותרות ראשיות |
| Heading MD | 24px | 700 (Bold) | כותרות משניות |
| Body | 16px | 400 (Regular) | טקסט גוף |
| Label | 14px | 500 (Medium) | תוויות, כפתורים |
| Caption | 12px | 400 (Regular) | טקסט עזר קטן |

**פונט:** Heebo (מגוגל פונטס) - תמיכה מלאה ב-RTL

## ריווחים (Spacing)

| שם | ערך | שימוש |
|---|---|---|
| Base | 8px | יחידת בסיס |
| XS | 4px | ריווח מינימלי |
| SM | 8px | ריווח קטן |
| MD | 16px | ריווח בינוני |
| LG | 24px | ריווח גדול |
| XL | 32px | ריווח גדול מאוד |

## עיגול פינות (Border Radius)

| שם | ערך | שימוש |
|---|---|---|
| SM | 4px | תגיות קטנות |
| Default | 8px | כפתורים, שדות קלט |
| MD | 12px | כרטיסים |
| LG | 16px | מודלים |
| Full | 9999px | עיגולים מלאים |

## צללים (Shadows)

| שם | ערך | שימוש |
|---|---|---|
| SM | `0 1px 3px rgba(0,0,0,0.1)` | הרמה קלה |
| MD | `0 4px 6px -1px rgba(0,0,0,0.1)` | כרטיסים |
| LG | `0 10px 15px -3px rgba(0,0,0,0.1)` | מודלים, אלמנטים צפים |

## רכיבים (Components)

### Button
- **Primary:** רקע `#1E3A8A`, טקסט לבן
- **Secondary:** רקע `#3B82F6`, טקסט לבן
- Padding: 8px 16px
- Border Radius: 8px

### Input
- רקע לבן
- גבול: 1px solid `#CBD5E1`
- Focus: גבול `#3B82F6`
- Padding: 8px 16px
- Border Radius: 8px

### Card
- רקע לבן
- צל: shadow-md
- Padding: 16px
- Border Radius: 8px

### Navbar
- גובה: 64px
- רקע לבן
- צל תחתון: shadow-sm
- Position: fixed

### Bottom Navigation (Mobile)
- גובה: 72px
- רקע לבן
- גבול עליון
- Position: fixed

## ניווט (Routing)

| נתיב | עמוד | תיאור |
|---|---|---|
| `/` | AuthPage | מסך התחברות עם בחירת תפקיד |
| `/student-dashboard` | StudentDashboardPage | לוח בקרה עם באנר, התקדמות, קורסים |
| `/upload-center` | UploadCenterPage | מרכז העלאת קבצים |
| `/course/empty` | CourseEmptyStatePage | מסך ריק כשאין חומר |

## פירוק רכיבים

### רכיבים משותפים (Shared)
| רכיב | תיאור | Props |
|---|---|---|
| Navbar | ניווט עליון | - |
| Footer | כותרת תחתונה | - |
| Button | כפתור לשימוש חוזר | variant: 'primary' / 'secondary', fullWidth, disabled |
| BottomNav | ניווט תחתון למובייל | - |

### רכיבי עמודים
| עמוד | רכיבים |
|---|---|
| AuthPage | לוגו, בחירת תפקיד, כפתור התחברות |
| StudentDashboardPage | WelcomeBanner, DateInputSection, ProgressCard, CourseCards |
| UploadCenterPage | UploadZone, FilesList, HistoryTable |
| CourseEmptyStatePage | EmptyStateIllustration, SuggestionsList, ActionButtons |

## רספונסיביות

- **מובייל:** 375px ומעלה
- **טאבלט/דסקטופ:** 768px ומעלה
- תמיכה מלאה ב-RTL (יישור לימין)
- Bottom Navigation מוצג רק במובייל
- Navbar links מוצגים רק בדסקטופ

## מבנה תיקיות

```
src/
├── main.tsx
├── App.tsx
├── styles/
│   └── globals.css
├── components/
│   ├── Navbar/
│   │   ├── Navbar.tsx
│   │   └── Navbar.css
│   ├── Footer/
│   │   ├── Footer.tsx
│   │   └── Footer.css
│   ├── Button/
│   │   ├── Button.tsx
│   │   └── Button.css
│   └── BottomNav/
│       ├── BottomNav.tsx
│       └── BottomNav.css
└── pages/
    ├── AuthPage.tsx
    ├── AuthPage.css
    ├── StudentDashboardPage.tsx
    ├── StudentDashboardPage.css
    ├── UploadCenterPage.tsx
    ├── UploadCenterPage.css
    ├── CourseEmptyStatePage.tsx
    └── CourseEmptyStatePage.css
```
