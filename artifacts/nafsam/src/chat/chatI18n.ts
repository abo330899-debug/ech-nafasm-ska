import { type Lang } from "@/i18n/translations";

export interface ChatStrings {
  title: string;
  online: string;
  offline: string;
  last_seen: string;
  typing: string;
  placeholder: string;
  send: string;
  attach: string;
  search: string;
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
}

export const chatStrings: Record<Lang, ChatStrings> = {
  ar: {
    title: "المحادثة",
    online: "متصل الآن",
    offline: "غير متصل",
    last_seen: "آخر ظهور {time}",
    typing: "يكتب…",
    placeholder: "اكتب رسالة…",
    send: "إرسال",
    attach: "إرفاق صورة",
    search: "بحث",
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
  },
  en: {
    title: "Chat",
    online: "online",
    offline: "offline",
    last_seen: "last seen {time}",
    typing: "typing…",
    placeholder: "Type a message…",
    send: "Send",
    attach: "Attach image",
    search: "Search",
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
  },
  fa: {
    title: "گفتگو",
    online: "آنلاین",
    offline: "آفلاین",
    last_seen: "آخرین بازدید {time}",
    typing: "در حال نوشتن…",
    placeholder: "پیام بنویس…",
    send: "ارسال",
    attach: "پیوست تصویر",
    search: "جستجو",
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
  },
  tr: {
    title: "Sohbet",
    online: "çevrimiçi",
    offline: "çevrimdışı",
    last_seen: "son görülme {time}",
    typing: "yazıyor…",
    placeholder: "Bir mesaj yaz…",
    send: "Gönder",
    attach: "Resim ekle",
    search: "Ara",
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
  },
};
