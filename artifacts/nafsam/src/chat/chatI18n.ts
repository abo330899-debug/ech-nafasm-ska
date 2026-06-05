import { type Lang } from "@/i18n/translations";

export interface ChatStrings {
  title: string;
  app_name: string;
  online: string;
  offline: string;
  last_seen: string;
  typing: string;
  typing_name: string;
  placeholder: string;
  send: string;
  attach: string;
  gallery: string;
  camera: string;
  search: string;
  search_chats: string;
  search_placeholder: string;
  search_empty: string;
  delete: string;
  deleted: string;
  confirm_delete: string;
  empty: string;
  loading: string;
  today: string;
  yesterday: string;
  not_configured: string;
  reconnect: string;
  jump_unread: string;
  unread_one: string;
  image_alt: string;
  sending_image: string;
  seen: string;
  sent: string;
  delivered: string;
  record: string;
  recording: string;
  cancel: string;
  mic_denied: string;
  back: string;
  emoji: string;
  react: string;
  voice_message: string;
  photo_message: string;
  sidebar_quote: string;
  no_messages_preview: string;
}

export const chatStrings: Record<Lang, ChatStrings> = {
  ar: {
    title: "المحادثة",
    app_name: "نفسم",
    online: "متصل الآن",
    offline: "غير متصل",
    last_seen: "آخر ظهور {time}",
    typing: "يكتب…",
    typing_name: "{name} يكتب…",
    placeholder: "اكتب رسالة…",
    send: "إرسال",
    attach: "إرفاق",
    gallery: "معرض الصور",
    camera: "الكاميرا",
    search: "بحث",
    search_chats: "ابحث…",
    search_placeholder: "ابحث في الرسائل…",
    search_empty: "لا توجد نتائج",
    delete: "حذف",
    deleted: "🚫 تم حذف هذه الرسالة",
    confirm_delete: "حذف هذه الرسالة؟",
    empty: "لا توجد رسائل بعد. ابدأ المحادثة 🤍",
    loading: "جارٍ الاتصال…",
    today: "اليوم",
    yesterday: "أمس",
    not_configured: "المحادثة غير مهيأة بعد.",
    reconnect: "تعذّر الدخول للمحادثة. سجّلي الخروج ثم الدخول مرة أخرى.",
    jump_unread: "رسائل جديدة",
    unread_one: "رسالة جديدة",
    image_alt: "صورة",
    sending_image: "جارٍ إرسال الصورة…",
    seen: "تمت القراءة",
    sent: "أُرسلت",
    delivered: "تم التسليم",
    record: "تسجيل رسالة صوتية",
    recording: "جارٍ التسجيل…",
    cancel: "إلغاء",
    mic_denied: "تم رفض الوصول إلى الميكروفون",
    back: "رجوع",
    emoji: "الرموز",
    react: "تفاعل",
    voice_message: "🎤 رسالة صوتية",
    photo_message: "📷 صورة",
    sidebar_quote: "أحبّكِ في عالمٍ لا أنتمي إليه.",
    no_messages_preview: "لا توجد رسائل بعد",
  },
  en: {
    title: "Chat",
    app_name: "Nafsam",
    online: "online",
    offline: "offline",
    last_seen: "last seen {time}",
    typing: "typing…",
    typing_name: "{name} is typing…",
    placeholder: "Type a message…",
    send: "Send",
    attach: "Attach",
    gallery: "Gallery",
    camera: "Camera",
    search: "Search",
    search_chats: "Search…",
    search_placeholder: "Search messages…",
    search_empty: "No results",
    delete: "Delete",
    deleted: "🚫 This message was deleted",
    confirm_delete: "Delete this message?",
    empty: "No messages yet. Say hi 🤍",
    loading: "Connecting…",
    today: "Today",
    yesterday: "Yesterday",
    not_configured: "Chat is not configured yet.",
    reconnect: "Couldn't open the chat. Please log out and log in again.",
    jump_unread: "new messages",
    unread_one: "new message",
    image_alt: "image",
    sending_image: "Sending image…",
    seen: "Seen",
    sent: "Sent",
    delivered: "Delivered",
    record: "Record a voice message",
    recording: "Recording…",
    cancel: "Cancel",
    mic_denied: "Microphone access denied",
    back: "Back",
    emoji: "Emoji",
    react: "React",
    voice_message: "🎤 Voice message",
    photo_message: "📷 Photo",
    sidebar_quote: "I love you in a world where I don't belong.",
    no_messages_preview: "No messages yet",
  },
  fa: {
    title: "گفتگو",
    app_name: "نفسم",
    online: "آنلاین",
    offline: "آفلاین",
    last_seen: "آخرین بازدید {time}",
    typing: "در حال نوشتن…",
    typing_name: "{name} در حال نوشتن است…",
    placeholder: "پیام بنویس…",
    send: "ارسال",
    attach: "پیوست",
    gallery: "گالری",
    camera: "دوربین",
    search: "جستجو",
    search_chats: "جستجو…",
    search_placeholder: "جستجوی پیام‌ها…",
    search_empty: "نتیجه‌ای نیست",
    delete: "حذف",
    deleted: "🚫 این پیام حذف شد",
    confirm_delete: "این پیام حذف شود؟",
    empty: "هنوز پیامی نیست. سلام کن 🤍",
    loading: "در حال اتصال…",
    today: "امروز",
    yesterday: "دیروز",
    not_configured: "گفتگو هنوز پیکربندی نشده است.",
    reconnect: "ورود به گفتگو ممکن نشد. لطفاً خارج و دوباره وارد شو.",
    jump_unread: "پیام‌های جدید",
    unread_one: "پیام جدید",
    image_alt: "تصویر",
    sending_image: "در حال ارسال تصویر…",
    seen: "خوانده شد",
    sent: "ارسال شد",
    delivered: "تحویل شد",
    record: "ضبط پیام صوتی",
    recording: "در حال ضبط…",
    cancel: "لغو",
    mic_denied: "دسترسی به میکروفون رد شد",
    back: "بازگشت",
    emoji: "ایموجی",
    react: "واکنش",
    voice_message: "🎤 پیام صوتی",
    photo_message: "📷 عکس",
    sidebar_quote: "دوستت دارم، در دنیایی که به آن تعلق ندارم.",
    no_messages_preview: "هنوز پیامی نیست",
  },
  tr: {
    title: "Sohbet",
    app_name: "Nafsam",
    online: "çevrimiçi",
    offline: "çevrimdışı",
    last_seen: "son görülme {time}",
    typing: "yazıyor…",
    typing_name: "{name} yazıyor…",
    placeholder: "Bir mesaj yaz…",
    send: "Gönder",
    attach: "Ekle",
    gallery: "Galeri",
    camera: "Kamera",
    search: "Ara",
    search_chats: "Ara…",
    search_placeholder: "Mesajlarda ara…",
    search_empty: "Sonuç yok",
    delete: "Sil",
    deleted: "🚫 Bu mesaj silindi",
    confirm_delete: "Bu mesaj silinsin mi?",
    empty: "Henüz mesaj yok. Merhaba de 🤍",
    loading: "Bağlanıyor…",
    today: "Bugün",
    yesterday: "Dün",
    not_configured: "Sohbet henüz yapılandırılmadı.",
    reconnect: "Sohbet açılamadı. Lütfen çıkış yapıp tekrar giriş yap.",
    jump_unread: "yeni mesaj",
    unread_one: "yeni mesaj",
    image_alt: "resim",
    sending_image: "Resim gönderiliyor…",
    seen: "Görüldü",
    sent: "Gönderildi",
    delivered: "İletildi",
    record: "Sesli mesaj kaydet",
    recording: "Kaydediliyor…",
    cancel: "İptal",
    mic_denied: "Mikrofon erişimi reddedildi",
    back: "Geri",
    emoji: "Emoji",
    react: "Tepki ver",
    voice_message: "🎤 Sesli mesaj",
    photo_message: "📷 Fotoğraf",
    sidebar_quote: "Ait olmadığım bir dünyada seni seviyorum.",
    no_messages_preview: "Henüz mesaj yok",
  },
};
