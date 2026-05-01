export type Lang = "tr" | "fa" | "ar" | "en";

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
    login_title: "Nafsam",
    login_text: "Bu yer geri sayım tamamlanana kadar kapalı kalır. Her isim kendi vaktini bekler. Sonunda artık sayaç kalmaz... sadece sözler kalır.",
    login_input: "Cevabı yaz",
    login_button: "Kalanı Aç",
    login_hint: "Sayfa süre bitmeden açılmaz. Sonra yalnızca doğru cevapları bilenler açabilir.",
    login_msg_closed: "Geri sayım tamamlanmadan sayfa açılmaz",
    login_msg_wrong: "Cevap yanlış",
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
  },
  fa: {
    dir: "rtl",
    page_title_login: "نفسم | ورود",
    page_title_main: "نفسم",
    brand: "نفسم",
    nav_login: "ورود",
    nav_home: "خانه",
    nav_moments: "از آغاز تا اثر",
    nav_photos: "آغوش عکس‌ها",
    nav_songs: "آهنگ‌های شب",
    nav_videos: "ویدیوها",
    nav_writings: "خفگی",
    login_title: "نفسم",
    login_text: "این جا تا کامل شدن شمارش بسته می‌ماند. هر اسم منتظر وقت خودش است. بعد از پایان، دیگر شمارشی نمی‌ماند... فقط کلمات می‌مانند.",
    login_input: "جواب را بنویس",
    login_button: "باقی‌مانده را باز کن",
    login_hint: "صفحه قبل از پایان زمان باز نمی‌شود. بعد از آن فقط کسی که جواب درست را بداند می‌تواند باز کند.",
    login_msg_closed: "صفحه تا پایان شمارش باز نمی‌شود",
    login_msg_wrong: "جواب اشتباه است",
    login_msg_success: "صفحه در حال باز شدن است...",
    hero_eyebrow: "NAFSAM • 20 AUG 2025 • 04:04 AM",
    hero_title: "چهار ساعت و چهار دقیقه",
    open_story: "داستان را باز کن",
    read_pain: "درد را بخوان",
    card_moments_title: "از آغاز تا اثر",
    card_photos_title: "آغوش عکس‌ها",
    card_songs_title: "آهنگ‌های شب",
    card_writings_title: "خفگی",
    moments_title: "از آغاز تا اثر",
    photos_title: "آغوش عکس‌ها",
    songs_title: "آهنگ‌های شب",
    songs_text: "آهنگ‌هایی که روزی گرما بودند، حالا شبی طولانی و باز بر خاطره شده‌اند.",
    videos_title: "ویدیوها",
    video_memory_label: "خاطره",
    video1_title: "ویدیو 1",
    video2_title: "ویدیو 2",
    writings_title: "خفگی",
    typed_1: "چهار ساعت و چهار دقیقه...",
    typed_2: "اثری که خاموش نمی‌شود...",
    typed_3: "هر معما منتظر وقت خودش است...",
    typed_4: "بعد از شمارش، کلمات شروع می‌شوند...",
    countdown_label: "زمان باقی‌مانده: ",
    countdown_day: "روز",
    countdown_hour: "ساعت",
    countdown_minute: "دقیقه",
    countdown_second: "ثانیه",
    riddle_prompt: "معما را حل کن",
    photos_fallback_caption: "خاطره‌ای ساکت… اما فراموش‌نشدنی.",
  },
  ar: {
    dir: "rtl",
    page_title_login: "نفسم | الدخول",
    page_title_main: "نفسم",
    brand: "نفسم",
    nav_login: "الدخول",
    nav_home: "الرئيسية",
    nav_moments: "من البداية إلى الأثر",
    nav_photos: "حضن الصور",
    nav_songs: "أغاني السهر",
    nav_videos: "الفيديو",
    nav_writings: "الاختناق",
    login_title: "نفسم",
    login_text: "هذا المكان يبقى مغلقًا حتى يكتمل العد. وكل اسم ينتظر وقته. وبعد النهاية لا يبقى عدّ... بل يبقى الكلام.",
    login_input: "اكتب الجواب",
    login_button: "افتح ما تبقّى",
    login_hint: "الصفحة لن تُفتح قبل انتهاء المدة، وبعدها تفتح فقط لمن يعرف الأجوبة الصحيحة.",
    login_msg_closed: "الصفحة ما زالت مغلقة إلى أن يكتمل العد التنازلي",
    login_msg_wrong: "الجواب غير صحيح",
    login_msg_success: "تم فتح الصفحة...",
    hero_eyebrow: "NAFSAM • 20 AUG 2025 • 04:04 AM",
    hero_title: "أربع ساعات وأربع دقائق",
    open_story: "افتح القصة",
    read_pain: "اقرأ الوجع",
    card_moments_title: "من البداية إلى الأثر",
    card_photos_title: "حضن الصور",
    card_songs_title: "أغاني السهر",
    card_writings_title: "الاختناق",
    moments_title: "من البداية إلى الأثر",
    photos_title: "حضن الصور",
    songs_title: "أغاني السهر",
    songs_text: "الأغاني التي كانت دفئًا، صارت الآن ليلًا طويلًا مفتوحًا على الذكرى.",
    videos_title: "الفيديو",
    video_memory_label: "ذكرى",
    video1_title: "فيديو 1",
    video2_title: "فيديو 2",
    writings_title: "الاختناق",
    typed_1: "أربع ساعات وأربع دقائق...",
    typed_2: "أثر لا ينطفئ...",
    typed_3: "كل لغز ينتظر اكتمال وقته...",
    typed_4: "وبعد العد... يبدأ الكلام...",
    countdown_label: "الوقت المتبقي: ",
    countdown_day: "يوم",
    countdown_hour: "ساعة",
    countdown_minute: "دقيقة",
    countdown_second: "ثانية",
    riddle_prompt: "حلّ السؤال",
    photos_fallback_caption: "ذكرى صامتة… لكنها لا تُنسى.",
  },
  en: {
    dir: "ltr",
    page_title_login: "Nafsam | Login",
    page_title_main: "Nafsam",
    brand: "Nafsam",
    nav_login: "Login",
    nav_home: "Home",
    nav_moments: "From Beginning to Trace",
    nav_photos: "Embrace of Photos",
    nav_songs: "Night Songs",
    nav_videos: "Videos",
    nav_writings: "Suffocation",
    login_title: "Nafsam",
    login_text: "This place stays closed until the countdown is complete. Every name waits for its time. After the end, there is no more counting... only words remain.",
    login_input: "Type the answer",
    login_button: "Open What Remains",
    login_hint: "The page will not open before the time ends. After that, only the correct answers can open it.",
    login_msg_closed: "The page is still locked until the countdown ends",
    login_msg_wrong: "Wrong answer",
    login_msg_success: "Opening page...",
    hero_eyebrow: "NAFSAM • 20 AUG 2025 • 04:04 AM",
    hero_title: "Four Hours and Four Minutes",
    open_story: "Open the Story",
    read_pain: "Read the Pain",
    card_moments_title: "From Beginning to Trace",
    card_photos_title: "Embrace of Photos",
    card_songs_title: "Night Songs",
    card_writings_title: "Suffocation",
    moments_title: "From Beginning to Trace",
    photos_title: "Embrace of Photos",
    songs_title: "Night Songs",
    songs_text: "The songs that were once warmth have now become a long night open to memory.",
    videos_title: "Videos",
    video_memory_label: "Memory",
    video1_title: "Video 1",
    video2_title: "Video 2",
    writings_title: "Suffocation",
    typed_1: "Four hours and four minutes...",
    typed_2: "A trace that does not fade...",
    typed_3: "Every riddle waits for its time...",
    typed_4: "After the countdown, words begin...",
    countdown_label: "Time left: ",
    countdown_day: "day",
    countdown_hour: "hour",
    countdown_minute: "minute",
    countdown_second: "second",
    riddle_prompt: "Solve the question",
    photos_fallback_caption: "A silent memory… but unforgettable.",
  },
};
