export type Lang = "tr" | "en" | "ar" | "fa";

export interface Translations {
  dir: "ltr" | "rtl";
  page_title_login: string;
  page_title_main: string;
  brand: string;
  nav_login: string;
  nav_home: string;
  nav_moments: string;
  nav_photos: string;
  nav_songs: string;
  nav_videos: string;
  nav_writings: string;
  nav_feelings: string;
  nav_logout: string;
  login_title: string;
  login_text: string;
  login_input: string;
  login_button: string;
  login_hint: string;
  login_msg_closed: string;
  login_msg_wrong: string;
  login_msg_success: string;
  hero_eyebrow: string;
  hero_title: string;
  open_story: string;
  read_pain: string;
  card_moments_title: string;
  card_photos_title: string;
  card_songs_title: string;
  card_writings_title: string;
  moments_title: string;
  photos_title: string;
  songs_title: string;
  songs_text: string;
  videos_title: string;
  video_memory_label: string;
  video1_title: string;
  video2_title: string;
  writings_title: string;
  typed_1: string;
  typed_2: string;
  typed_3: string;
  typed_4: string;
  countdown_label: string;
  countdown_day: string;
  countdown_hour: string;
  countdown_minute: string;
  countdown_second: string;
  riddle_prompt: string;
  photos_fallback_caption: string;
  common_close: string;
  common_prev: string;
  common_next: string;
  common_fullscreen: string;
  common_theater_compact: string;
  common_theater_wide: string;
  audio_unsupported: string;
  video_mega_text: string;
  video_mega_open: string;
  feelings_hero_eyebrow: string;
  feelings_hero_word_1: string;
  feelings_hero_word_2: string;
  feelings_hero_sub: string;
  feelings_scroll_hint: string;
  feelings_doc_title: string;
  feelings_story_title: string;
  feelings_memories_title: string;
  feelings_memories_sub: string;
  feelings_collapse_title: string;
}

export const translations: Record<Lang, Translations> = {
  tr: {
    dir: "ltr",
    page_title_login: "Nafsam | Giriş",
    page_title_main: "Nafsam",
    brand: "Nafsam",
    nav_login: "Giriş",
    nav_home: "Ana Sayfa",
    nav_moments: "Başlangıçtan İze",
    nav_photos: "Fotoğrafların Kucağı",
    nav_songs: "Gece Şarkıları",
    nav_videos: "Videolar",
    nav_writings: "Boğulma",
    nav_feelings: "Hisler Öldüğünde",
    nav_logout: "Çıkış",
    login_title: "Nafsam",
    login_text: "Bu yer geri sayım tamamlanana kadar kapalı kalır. Her isim kendi vaktini bekler. Sonunda artık sayaç kalmaz... sadece sözler kalır.",
    login_input: "İsmi seç",
    login_button: "Kalanı Aç",
    login_hint: "Sayfa süre bitmeden açılmaz. Sonra yalnızca doğru cevapları bilenler açabilir.",
    login_msg_closed: "Geri sayım tamamlanmadan sayfa açılmaz",
    login_msg_wrong: "Geçersiz seçim",
    login_msg_success: "Sayfa açılıyor...",
    hero_eyebrow: "NAFSAM • 20 AUG 2025 • 04:04 AM",
    hero_title: "Dört Saat Dört Dakika",
    open_story: "Hikâyeyi Aç",
    read_pain: "Acıyı Oku",
    card_moments_title: "Başlangıçtan İze",
    card_photos_title: "Fotoğrafların Kucağı",
    card_songs_title: "Gece Şarkıları",
    card_writings_title: "Boğulma",
    moments_title: "Başlangıçtan İze",
    photos_title: "Fotoğrafların Kucağı",
    songs_title: "Gece Şarkıları",
    songs_text: "Bir zamanlar sıcaklık olan şarkılar, şimdi hatıraya açık uzun bir gece oldu.",
    videos_title: "Videolar",
    video_memory_label: "Hatıra",
    video1_title: "Video 1",
    video2_title: "Video 2",
    writings_title: "Boğulma",
    typed_1: "Dört saat dört dakika...",
    typed_2: "Sönmeyen bir iz...",
    typed_3: "Her bilmece kendi vaktini bekliyor...",
    typed_4: "Geri sayımdan sonra söz başlar...",
    countdown_label: "Kalan süre: ",
    countdown_day: "gün",
    countdown_hour: "saat",
    countdown_minute: "dakika",
    countdown_second: "saniye",
    riddle_prompt: "Soruyu çöz",
    photos_fallback_caption: "Sessiz bir anı… ama unutulmaz.",
    common_close: "Kapat",
    common_prev: "Önceki",
    common_next: "Sonraki",
    common_fullscreen: "Tam ekran",
    common_theater_compact: "Kompakt mod",
    common_theater_wide: "Geniş mod",
    audio_unsupported: "Tarayıcınız ses oynatmayı desteklemiyor.",
    video_mega_text: "Bu video MEGA üzerinde tutuluyor. Yeni sekmede açmak için tıkla.",
    video_mega_open: "Videoyu Aç",
    feelings_hero_eyebrow: "SESSİZLİĞİN BAŞLANGICI",
    feelings_hero_word_1: "Hisler",
    feelings_hero_word_2: "Öldüğünde",
    feelings_scroll_hint: "aşağı in",
    feelings_doc_title: "Hisler Öldüğünde",
  },

  en: {
    dir: "ltr",
    page_title_login: "Nafsam | Enter",
    page_title_main: "Nafsam",
    brand: "Nafsam",
    nav_login: "Enter",
    nav_home: "Home",
    nav_moments: "From Start to Trace",
    nav_photos: "In the Arms of Photos",
    nav_songs: "Night Songs",
    nav_videos: "Videos",
    nav_writings: "Drowning",
    nav_feelings: "When Feelings Die",
    nav_logout: "Sign Out",
    login_title: "Nafsam",
    login_text: "This place remains closed until the countdown ends. Each name waits for its own time. In the end, no timer remains… only words.",
    login_input: "Select name",
    login_button: "Open What Remains",
    login_hint: "The page won't open before time ends. Then only those who know the right answer can enter.",
    login_msg_closed: "The page won't open before the countdown ends",
    login_msg_wrong: "Invalid selection",
    login_msg_success: "Opening…",
    hero_eyebrow: "NAFSAM • 20 AUG 2025 • 04:04 AM",
    hero_title: "Four Hours, Four Minutes",
    open_story: "Open the Story",
    read_pain: "Read the Pain",
    card_moments_title: "From Start to Trace",
    card_photos_title: "In the Arms of Photos",
    card_songs_title: "Night Songs",
    card_writings_title: "Drowning",
    moments_title: "From Start to Trace",
    photos_title: "In the Arms of Photos",
    songs_title: "Night Songs",
    songs_text: "Songs that were once warmth have become a long night open to memory.",
    videos_title: "Videos",
    video_memory_label: "Memory",
    video1_title: "Video 1",
    video2_title: "Video 2",
    writings_title: "Drowning",
    typed_1: "Four hours, four minutes…",
    typed_2: "A trace that never fades…",
    typed_3: "Every riddle waits for its own time…",
    typed_4: "After the countdown, words begin…",
    countdown_label: "Time remaining: ",
    countdown_day: "days",
    countdown_hour: "hours",
    countdown_minute: "minutes",
    countdown_second: "seconds",
    riddle_prompt: "Solve the riddle",
    photos_fallback_caption: "A silent moment… but unforgettable.",
    common_close: "Close",
    common_prev: "Previous",
    common_next: "Next",
    common_fullscreen: "Fullscreen",
    common_theater_compact: "Compact view",
    common_theater_wide: "Theater view",
    audio_unsupported: "Your browser does not support audio playback.",
    video_mega_text: "This video is hosted on MEGA. Tap to open in a new tab.",
    video_mega_open: "Open Video",
    feelings_hero_eyebrow: "THE BEGINNING OF SILENCE",
    feelings_hero_word_1: "When Feelings",
    feelings_hero_word_2: "Die",
    feelings_scroll_hint: "scroll down",
    feelings_doc_title: "When Feelings Die",
  },

  ar: {
    dir: "rtl",
    page_title_login: "نفسم | دخول",
    page_title_main: "نفسم",
    brand: "نفسم",
    nav_login: "دخول",
    nav_home: "الرئيسية",
    nav_moments: "من البداية إلى الأثر",
    nav_photos: "في أحضان الصور",
    nav_songs: "أغاني الليل",
    nav_videos: "مقاطع",
    nav_writings: "غرق",
    nav_feelings: "حين تموت المشاعر",
    nav_logout: "خروج",
    login_title: "نفسم",
    login_text: "هذا المكان يبقى مغلقاً حتى تنتهي العدّة. كلّ اسم ينتظر وقته. في النهاية لا يبقى مؤقّت… تبقى فقط الكلمات.",
    login_input: "اختر الاسم",
    login_button: "افتح ما تبقّى",
    login_hint: "الصفحة لن تُفتح قبل انتهاء الوقت. ثم فقط من يعرف الجواب الصحيح يستطيع الدخول.",
    login_msg_closed: "الصفحة لن تُفتح قبل انتهاء العدّ",
    login_msg_wrong: "اسم غير معترف",
    login_msg_success: "يتم الفتح…",
    hero_eyebrow: "نفسم • ٢٠ أغسطس ٢٠٢٥ • ٤:٠٤ صباحاً",
    hero_title: "أربع ساعات أربع دقائق",
    open_story: "افتح الحكاية",
    read_pain: "اقرأ الألم",
    card_moments_title: "من البداية إلى الأثر",
    card_photos_title: "في أحضان الصور",
    card_songs_title: "أغاني الليل",
    card_writings_title: "غرق",
    moments_title: "من البداية إلى الأثر",
    photos_title: "في أحضان الصور",
    songs_title: "أغاني الليل",
    songs_text: "أغانٍ كانت دفءً في يوم ما، صارت الآن ليلاً طويلاً مفتوحاً على الذاكرة.",
    videos_title: "مقاطع",
    video_memory_label: "ذكرى",
    video1_title: "مقطع ١",
    video2_title: "مقطع ٢",
    writings_title: "غرق",
    typed_1: "أربع ساعات أربع دقائق…",
    typed_2: "أثرٌ لا يمّحي…",
    typed_3: "كلّ لغز ينتظر وقته…",
    typed_4: "بعد العدّ تبدأ الكلمات…",
    countdown_label: "الوقت المتبقي: ",
    countdown_day: "يوم",
    countdown_hour: "ساعة",
    countdown_minute: "دقيقة",
    countdown_second: "ثانية",
    riddle_prompt: "حلّ اللغز",
    photos_fallback_caption: "لحظة صامتة… لكنها لا تُنسى.",
    common_close: "إغلاق",
    common_prev: "السابق",
    common_next: "التالي",
    common_fullscreen: "ملء الشاشة",
    common_theater_compact: "وضع مضغوط",
    common_theater_wide: "وضع موسّع",
    audio_unsupported: "متصفحك لا يدعم تشغيل الصوت.",
    video_mega_text: "هذا المقطع محفوظ على MEGA. اضغط لفتحه في تبويب جديد.",
    video_mega_open: "افتح المقطع",
    feelings_hero_eyebrow: "بداية الصمت",
    feelings_hero_word_1: "حين تموت",
    feelings_hero_word_2: "المشاعر",
    feelings_scroll_hint: "انزل للأسفل",
    feelings_doc_title: "حين تموت المشاعر",
  },

  fa: {
    dir: "rtl",
    page_title_login: "نفسم | ورود",
    page_title_main: "نفسم",
    brand: "نفسم",
    nav_login: "ورود",
    nav_home: "خانه",
    nav_moments: "از آغاز تا نشانه",
    nav_photos: "در آغوش عکس‌ها",
    nav_songs: "ترانه‌های شب",
    nav_videos: "ویدیوها",
    nav_writings: "غرق شدن",
    nav_feelings: "وقتی احساس‌ها می‌میرند",
    nav_logout: "خروج",
    login_title: "نفسم",
    login_text: "این مکان تا پایان شمارش معکوس بسته می‌ماند. هر اسم منتظر وقت خودش است. در پایان دیگر شمارشگری نمی‌ماند… فقط کلمات می‌مانند.",
    login_input: "انتخاب نام",
    login_button: "باقی‌مانده را باز کن",
    login_hint: "صفحه قبل از پایان زمان باز نمی‌شود. سپس فقط کسانی که جواب درست می‌دانند می‌توانند وارد شوند.",
    login_msg_closed: "صفحه قبل از پایان شمارش باز نمی‌شود",
    login_msg_wrong: "انتخاب نامعتبر",
    login_msg_success: "در حال باز شدن…",
    hero_eyebrow: "نفسم • ۲۰ اوت ۲۰۲۵ • ۴:۰۴ صبح",
    hero_title: "چهار ساعت چهار دقیقه",
    open_story: "داستان را باز کن",
    read_pain: "درد را بخوان",
    card_moments_title: "از آغاز تا نشانه",
    card_photos_title: "در آغوش عکس‌ها",
    card_songs_title: "ترانه‌های شب",
    card_writings_title: "غرق شدن",
    moments_title: "از آغاز تا نشانه",
    photos_title: "در آغوش عکس‌ها",
    songs_title: "ترانه‌های شب",
    songs_text: "ترانه‌هایی که زمانی گرما بودند، حالا شبی طولانی و باز به‌روی خاطره شده‌اند.",
    videos_title: "ویدیوها",
    video_memory_label: "خاطره",
    video1_title: "ویدیو ۱",
    video2_title: "ویدیو ۲",
    writings_title: "غرق شدن",
    typed_1: "چهار ساعت چهار دقیقه…",
    typed_2: "نشانه‌ای که محو نمی‌شود…",
    typed_3: "هر معما منتظر وقت خودش است…",
    typed_4: "بعد از شمارش، کلمات آغاز می‌شوند…",
    countdown_label: "زمان باقی‌مانده: ",
    countdown_day: "روز",
    countdown_hour: "ساعت",
    countdown_minute: "دقیقه",
    countdown_second: "ثانیه",
    riddle_prompt: "معما را حل کن",
    photos_fallback_caption: "لحظه‌ای ساکت… اما فراموش‌نشدنی.",
    common_close: "بستن",
    common_prev: "قبلی",
    common_next: "بعدی",
    common_fullscreen: "تمام‌صفحه",
    common_theater_compact: "حالت فشرده",
    common_theater_wide: "حالت گسترده",
    audio_unsupported: "مرورگر شما از پخش صدا پشتیبانی نمی‌کند.",
    video_mega_text: "این ویدیو در MEGA نگه‌داری می‌شود. برای باز کردن در زبانه جدید کلیک کن.",
    video_mega_open: "باز کردن ویدیو",
    feelings_hero_eyebrow: "آغاز سکوت",
    feelings_hero_word_1: "وقتی احساس‌ها",
    feelings_hero_word_2: "می‌میرند",
    feelings_scroll_hint: "به پایین برو",
    feelings_doc_title: "وقتی احساس‌ها می‌میرند",
  },
};
