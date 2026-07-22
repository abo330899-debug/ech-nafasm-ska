# طبقة الذكاء (Intelligence Layer) — نظرة معمارية

## الفلسفة

طبقة كاملة من التحليل الذكي **بدون أي نموذج لغوي أو خدمة خارجية**:
دوال نقية (pure functions) تعمل داخل المتصفح فوق نفس مصفوفتي
`events` و`sessions` اللتين تبنيهما اللوحة أصلًا. النتيجة:

- فورية وواقعية (realtime) — تتحدث مع كل حدث جديد من قناة Supabase.
- خصوصية كاملة — لا تغادر البيانات المتصفح.
- قابلة للتفسير — كل رقم يظهر ومعه «لماذا».
- مجانية وبلا مفاتيح API.

## الملفات

```
src/lib/intelligence.ts     المحرك كله (تقييم، شذوذ، رؤى، توقعات، سرد، تقارير)
src/lib/MonitorContext.tsx  يحسب scored + anomalies + todayKey مرة واحدة للجميع
src/pages/Insights.tsx      صفحة الرؤى + التوقعات (/#/insights)
src/pages/Reports.tsx       صفحة التقارير (/#/reports)
src/pages/Alerts.tsx        صفحة التنبيهات (تستهلك anomalies من السياق)
src/components/monitor/SessionCard.tsx  الدرجات + الشروح + قصة الجلسة
src/pages/Overview.tsx      شريط «رؤى سريعة» (أول 3 رؤى)
```

## تدفق البيانات

```
useMonitorData (تحميل تدريجي + realtime)
        │ events
        ▼
reconstructSessions ──► sessions
        │
        ▼
scoreSessions(sessions) ──► scored          ← memo على [sessions] فقط
        │
        ▼
detectAnomalies(scored, channelStatus, now) ← memo (رخيصة، تعتمد على now)
        │
        ├─► شارة الشريط الجانبي + صفحة التنبيهات
        ├─► generateInsights(scored, events, todayKey)  ← صفحة الرؤى + النظرة العامة
        ├─► predictions(sessions, todayKey)             ← صفحة الرؤى
        └─► buildReport(scope, scored, events, todayKey) ← صفحة التقارير
narrateSession(session, now) ← تُستدعى فقط عند فتح بطاقة الجلسة
```

## عقد الأداء (مهم عند أي تعديل مستقبلي)

- الساعة `now` تنبض كل 15 ثانية. **ممنوع** جعل الحسابات الثقيلة تعتمد
  عليها مباشرة.
- `scoreSessions` memo على `[sessions]` فقط.
- `generateInsights` / `predictions` / `buildReport` memo على
  `[scored/events/sessions, todayKey]` — و`todayKey` سلسلة `YYYY-MM-DD`
  تتغير مرة واحدة يوميًا، فلا إعادة حساب مع النبض.
- `detectAnomalies` هي الوحيدة التي تأخذ `now` (مثل `deriveAlerts` سابقًا)
  لأن قواعد "جلسة حيّة/منتهية" تحتاجه، وهي O(n) رخيصة.
- «قصة الجلسة» تُحسب عند فتح البطاقة فقط، وmemo على حالة الحياة `live`
  لا على `now` الخام.

## ملاحظة منطقة زمنية (wart موثّق عمدًا)

يوجد **خلطان زمنيان** موروثان من بقية اللوحة:

- قواعد الساعات (وقت الفجر، ساعة الذروة) تستخدم `baghdadHourDay` —
  أي توقيت **بغداد** الصريح.
- حدود «اليوم» (`dayKey`, `todayKey`, نوافذ 7/14/30 يومًا) تستخدم تاريخ
  **متصفح المشاهد المحلي**، مثل بقية صفحات اللوحة (يوم بيوم، النظرة العامة).

ما دام المشاهد في العراق أو منطقة قريبة، الفرق لا يُذكر. لو فُتحت اللوحة
من منطقة زمنية بعيدة جدًا، قد ينزاح تعريف «اليوم» عن منتصف ليل بغداد.
قرار واعٍ: الاتساق مع بقية اللوحة أهم من الدقة المطلقة هنا، وإصلاحه
الشامل يعني توحيد `dayKey` على بغداد في كل الملفات دفعة واحدة.

## ما الذي لم يتغير

- لم تُحذف أي ميزة قائمة؛ صفحة التنبيهات صارت أغنى (4 درجات بدل 3)
  وكل قواعدها القديمة محفوظة بنفس المعرّفات.
- `deriveAlerts` حُذفت من `analytics.ts` بعد نقل قواعدها بالكامل إلى
  `detectAnomalies` — مصدر حقيقة واحد للتنبيهات.
- الرسوم البيانية ما زالت داخل `dir="ltr"` كما تشترط اللوحة.
