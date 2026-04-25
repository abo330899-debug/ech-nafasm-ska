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
  nav_stats: string;
  stats_title: string;
  stats_text: string;
  stats_total_time: string;
  stats_session_count: string;
  stats_first_open: string;
  stats_last_open: string;
  stats_total_plays: string;
  stats_unique_videos: string;
  stats_never_played: string;
  stats_most_played: string;
  stats_sessions_heading: string;
  stats_videos_heading: string;
  stats_session_open: string;
  stats_session_close: string;
  stats_session_duration: string;
  stats_session_active: string;
  stats_play_count: string;
  stats_last_played: string;
  stats_never: string;
  stats_no_data: string;
  stats_reset: string;
  stats_reset_confirm: string;
  stats_footer: string;
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
  hero_text: string;
  quote_1: string;
  quote_2: string;
  quote_3: string;
  quote_4: string;
  open_story: string;
  read_pain: string;
  card_moments_title: string;
  card_moments_text: string;
  card_photos_title: string;
  card_photos_text: string;
  card_songs_title: string;
  card_songs_text: string;
  card_writings_title: string;
  card_writings_text: string;
  footer_text: string;
  moments_title: string;
  moments_text: string;
  moment1_time: string;
  moment1_title: string;
  moment1_text: string;
  moment1_memory: string;
  moment2_time: string;
  moment2_title: string;
  moment2_text: string;
  moment2_memory: string;
  moment3_time: string;
  moment3_title: string;
  moment3_text: string;
  moment3_memory: string;
  moment4_time: string;
  moment4_title: string;
  moment4_text: string;
  moment4_memory: string;
  moment5_time: string;
  moment5_title: string;
  moment5_text: string;
  moment5_memory: string;
  moment6_time: string;
  moment6_title: string;
  moment6_text: string;
  moment6_memory: string;
  moment7_time: string;
  moment7_title: string;
  moment7_text: string;
  moment7_memory: string;
  moment8_time: string;
  moment8_title: string;
  moment8_text: string;
  moment8_memory: string;
  moment9_time: string;
  moment9_title: string;
  moment9_text: string;
  moment9_memory: string;
  moments_footer: string;
  photos_title: string;
  photos_text: string;
  photo1_text: string;
  photo2_text: string;
  photo3_text: string;
  photo4_text: string;
  photo5_text: string;
  photo6_text: string;
  photo7_text: string;
  photo7_sub: string;
  photos_footer: string;
  songs_title: string;
  songs_text: string;
  song1_title: string;
  song1_text: string;
  song2_title: string;
  song2_text: string;
  song3_title: string;
  song3_text: string;
  song4_title: string;
  song4_text: string;
  songs_footer: string;
  videos_title: string;
  videos_text: string;
  video_memory_label: string;
  video1_title: string;
  video1_text: string;
  video2_title: string;
  video2_text: string;
  videos_footer: string;
  writings_title: string;
  writings_text: string;
  writings_footer: string;
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
  riddle_ashkim: string;
  riddle_nafasim: string;
  riddle_kaar: string;
  riddle_asgoori: string;
  riddle_lucifer: string;
  riddle_echska: string;
  photos_header_sub: string;
  photos_fallback_caption: string;
}

export const translations: Record<Lang, Translations> = {
  tr: {
    dir: "ltr",
    page_title_login: "Nafsam | Giri\u015f",
    page_title_main: "Nafsam",
    brand: "Nafsam",
    nav_login: "Giri\u015f",
    nav_home: "Ana Sayfa",
    nav_moments: "Ba\u015flang\u0131\u00e7tan \u0130ze",
    nav_photos: "Foto\u011fraflar\u0131n Kuca\u011f\u0131",
    nav_songs: "Gece \u015eark\u0131lar\u0131",
    nav_videos: "Videolar",
    nav_writings: "Bo\u011fulma",
    nav_stats: "\u0130statistik",
    stats_title: "\u0130statistikler",
    stats_text: "Bu yere ne kadar geldi\u011fini, hangi an\u0131lar\u0131 izledi\u011fini g\u00f6rebilirsin.",
    stats_total_time: "Toplam s\u00fcre",
    stats_session_count: "Oturum say\u0131s\u0131",
    stats_first_open: "\u0130lk a\u00e7\u0131l\u0131\u015f",
    stats_last_open: "Son a\u00e7\u0131l\u0131\u015f",
    stats_total_plays: "Toplam izleme",
    stats_unique_videos: "\u0130zlenen video say\u0131s\u0131",
    stats_never_played: "Hi\u00e7 izlenmeyen",
    stats_most_played: "En \u00e7ok izlenen",
    stats_sessions_heading: "Oturumlar",
    stats_videos_heading: "Videolar",
    stats_session_open: "A\u00e7\u0131l\u0131\u015f",
    stats_session_close: "Kapan\u0131\u015f",
    stats_session_duration: "S\u00fcre",
    stats_session_active: "A\u00e7\u0131k",
    stats_play_count: "\u0130zleme",
    stats_last_played: "Son izleme",
    stats_never: "Hi\u00e7",
    stats_no_data: "Hen\u00fcz veri yok.",
    stats_reset: "S\u0131f\u0131rla",
    stats_reset_confirm: "T\u00fcm istatistikler silinsin mi?",
    stats_footer: "Bu say\u0131lar sadece say\u0131 de\u011fil; her birinde bir bak\u0131\u015f gizli.",
    login_title: "Nafsam",
    login_text: "Bu yer geri say\u0131m tamamlanana kadar kapal\u0131 kal\u0131r. Her isim kendi vaktini bekler. Sonunda art\u0131k saya\u00e7 kalmaz... sadece s\u00f6zler kal\u0131r.",
    login_input: "Cevab\u0131 yaz",
    login_button: "Kalan\u0131 A\u00e7",
    login_hint: "Sayfa s\u00fcre bitmeden a\u00e7\u0131lmaz. Sonra yaln\u0131zca do\u011fru cevaplar\u0131 bilenler a\u00e7abilir.",
    login_msg_closed: "Geri say\u0131m tamamlanmadan sayfa a\u00e7\u0131lmaz",
    login_msg_wrong: "Cevap yanl\u0131\u015f",
    login_msg_success: "Sayfa a\u00e7\u0131l\u0131yor...",
    hero_eyebrow: "NAFSAM \u2022 20 AUG 2025 \u2022 04:04 AM",
    hero_title: "D\u00f6rt Saat D\u00f6rt Dakika",
    hero_text: "Seninle tesad\u00fcfen tan\u0131\u015ft\u0131m. \u00c7ok k\u0131sa bir zamanda, y\u0131llarda ya\u015famad\u0131\u011f\u0131m bir \u015feyi ya\u015fad\u0131m. Bir otel kap\u0131s\u0131nda r\u00fcya ba\u015flad\u0131, sakin bir sabahta yokluk ba\u015flad\u0131 ve ard\u0131ndan iz her \u015feye yerle\u015fti.",
    quote_1: "Baz\u0131 kar\u015f\u0131la\u015fmalar zamanda k\u0131sad\u0131r, ama etkide \u00e7ok uzundur.",
    quote_2: "Ben foto\u011fraflar\u0131n kuca\u011f\u0131 ile senin art\u0131k bir hat\u0131ra olman d\u00fc\u015f\u00fcncesi aras\u0131nda kald\u0131m.",
    quote_3: "Gece uzar \u00e7\u00fcnk\u00fc haf\u0131za uyumaz.",
    quote_4: "Baz\u0131 a\u015fklar bitmez... sadece sessiz bir ac\u0131ya d\u00f6n\u00fc\u015f\u00fcr.",
    open_story: "Hik\u00e2yeyi A\u00e7",
    read_pain: "Ac\u0131y\u0131 Oku",
    card_moments_title: "Ba\u015flang\u0131\u00e7tan \u0130ze",
    card_moments_text: "Kap\u0131, sabah ve i\u00e7sel karma\u015fan\u0131n tan\u0131\u011f\u0131 olan yol.",
    card_photos_title: "Foto\u011fraflar\u0131n Kuca\u011f\u0131",
    card_photos_text: "Foto\u011fraflar ge\u00e7mi\u015fi geri getirmez, ama izi canl\u0131 tutar.",
    card_songs_title: "Gece \u015eark\u0131lar\u0131",
    card_songs_text: "Bir zamanlar bizim olan \u015fark\u0131lar, \u015fimdi uzun bir gece oldu.",
    card_writings_title: "Bo\u011fulma",
    card_writings_text: "Sessizlik a\u011f\u0131r gelince \u00e7\u0131kan kelimeler.",
    footer_text: "Bu yer intikam i\u00e7in de\u011fil, gidecek yer bulamayan bir iz i\u00e7indir.",
    moments_title: "Ba\u015flang\u0131\u00e7tan \u0130ze",
    moments_text: "Her hik\u00e2ye uzun olmak zorunda de\u011fildir. Bazen birka\u00e7 saat bir kalbin \u015feklini tamamen de\u011fi\u015ftirir.",
    moment1_time: "20 Aug 2025 \u2022 3:52 AM",
    moment1_title: "Ger\u00e7ek olmadan \u00f6nce",
    moment1_text: "Otele girmeden \u00f6nce, birka\u00e7 dakika sonra hayat\u0131mdaki en g\u00fczel \u015feyi g\u00f6rece\u011fimi bilmiyordum.",
    moment1_memory: "O kap\u0131 sadece bir giri\u015f de\u011fildi; dayanma g\u00fcc\u00fcmden daha b\u00fcy\u00fck bir \u015feyin ba\u015flang\u0131c\u0131yd\u0131.",
    moment2_time: "20 Aug 2025 \u2022 8:04 AM",
    moment2_title: "Senin \u00e7\u0131kt\u0131\u011f\u0131n ve benim kald\u0131\u011f\u0131m sabah",
    moment2_text: "Sabah oldu\u011funda her \u015fey yerli yerindeydi... bir tek ben ayn\u0131 de\u011fildim.",
    moment2_memory: "D\u00f6rt saat d\u00f6rt dakika ile dinmeyen bir iz aras\u0131nda as\u0131l\u0131 kald\u0131m.",
    moment3_time: "\u0130\u00e7sel yan\u0131\u015f gecesi",
    moment3_title: "Tan\u0131k olan yol",
    moment3_text: "Bu foto\u011fraf sadece yol de\u011fil; ta\u015f\u0131yabildi\u011finden h\u0131zl\u0131 ko\u015fan bir kalbin foto\u011fraf\u0131.",
    moment3_memory: "Sonra anlad\u0131m ki baz\u0131 kalplerin sadece hat\u0131raya de\u011fil, kurtulu\u015fa da ihtiyac\u0131 vard\u0131r.",
    moment4_time: "Gece",
    moment4_title: "\u00c7i\u00e7ekler ve Karanl\u0131k",
    moment4_text: "Gecenin ortas\u0131nda \u00e7i\u00e7ekler geldi; sanki g\u00f6ky\u00fcz\u00fc bize bir par\u00e7a bahar g\u00f6nderdi.",
    moment4_memory: "G\u00fcller bile karanl\u0131kta daha g\u00fczel kokar.",
    moment5_time: "Birlikte",
    moment5_title: "A\u011fa\u00e7 Evin \u00dczerinde",
    moment5_text: "Y\u00fcksekte, d\u00fcnyadan uzakta, sadece ikimiz vard\u0131k.",
    moment5_memory: "Baz\u0131 anlar zamanla yar\u0131\u015famaz.",
    moment6_time: "Mavi I\u015f\u0131k",
    moment6_title: "Ellerin Dili",
    moment6_text: "Mavi \u0131\u015f\u0131\u011f\u0131n alt\u0131nda ellerimiz birbirine sar\u0131ld\u0131; kelimelere gerek yoktu.",
    moment6_memory: "Kalpler ellerde konu\u015fur.",
    moment7_time: "Sessizce",
    moment7_title: "Bir Bak\u0131\u015f Yeterdi",
    moment7_text: "I\u015f\u0131klar\u0131n aras\u0131nda durdu\u011funda, d\u00fcnya benim i\u00e7in durdu.",
    moment7_memory: "G\u00f6r\u00fcn\u00fc\u015f\u00fc hat\u0131rlamak, her \u015feyi hat\u0131rlamakt\u0131r.",
    moment8_time: "Kumda",
    moment8_title: "Kuma Yaz\u0131lan \u0130simler",
    moment8_text: "Deniz silse de, kuma yazd\u0131\u011f\u0131m\u0131z isimler kalbimde kald\u0131.",
    moment8_memory: "Baz\u0131 izler suda de\u011fil, ruhta kal\u0131r.",
    moment9_time: "Son",
    moment9_title: "Ayn\u0131 Kap\u0131dan",
    moment9_text: "Ba\u015flad\u0131\u011f\u0131m\u0131z kap\u0131dan ayr\u0131ld\u0131k. \u00c7anta omuzda, otel arkas\u0131nda.",
    moment9_memory: "Baz\u0131 kap\u0131lar hem ba\u015flang\u0131\u00e7 hem sondur.",
    moments_footer: "\u015eafaktaki bir kap\u0131dan, ayr\u0131l\u0131ktaki sabaha ve geriye kalan ize.",
    photos_title: "Foto\u011fraflar\u0131n Kuca\u011f\u0131",
    photos_text: "\u015eimdi bizim foto\u011fraflar\u0131m\u0131z\u0131n kuca\u011f\u0131nday\u0131m ve bana sadece sessizlik cevap veriyor.",
    photo1_text: "Bu kap\u0131dan i\u00e7eri girdi\u011fimde hen\u00fcz bilmiyordum... \u00e7\u0131karken kalbimi i\u00e7eride b\u0131rakaca\u011f\u0131m\u0131.",
    photo2_text: "O sabah g\u00f6zlerini a\u00e7t\u0131\u011f\u0131nda d\u00fcnya hala g\u00fczeldi. Kapatt\u0131\u011f\u0131nda her \u015fey bitti.",
    photo3_text: "Karanl\u0131k yolda tek ba\u015f\u0131na y\u00fcr\u00fcmek... seni hat\u0131rlamaktan daha ac\u0131 de\u011fildi.",
    photo4_text: "Ayn\u0131 kap\u0131dan girdik, ayn\u0131 kap\u0131dan \u00e7\u0131kt\u0131k. Ama i\u00e7eride b\u0131rakt\u0131\u011f\u0131m\u0131z \u015feyler asla geri gelmedi.",
    photo5_text: "\u00c7antay\u0131 koydum, kap\u0131y\u0131 kapatt\u0131m. Seninle ge\u00e7en her an\u0131 o koltu\u011fa b\u0131rakt\u0131m.",
    photo6_text: "Ladera... seni son gördüğüm yer. Işıkları hala yanıyor ama içerisi artık karanlık.",
    photo7_text: "Seni çok affettim... ta ki suçlu olan sadece ben olana kadar.",
    photo7_sub: "Burada sana her şeyi haklı çıkarıyordum,\nbeni öldüren şeyleri bile.",
    photos_footer: "Foto\u011fraflar ge\u00e7mi\u015fi geri getirmez, ama izini canl\u0131 tutar.",
    songs_title: "Gece \u015eark\u0131lar\u0131",
    songs_text: "Bir zamanlar s\u0131cakl\u0131k olan \u015fark\u0131lar, \u015fimdi hat\u0131raya a\u00e7\u0131k uzun bir gece oldu.",
    song1_title: "\u015eark\u0131 1",
    song1_text: "Her a\u00e7\u0131ld\u0131\u011f\u0131nda ac\u0131 en ba\u015ftan d\u00f6n\u00fcyor.",
    song2_title: "\u015eark\u0131 2",
    song2_text: "Bu sadece bir \u015fark\u0131 de\u011fil; uykusuz bir geceye a\u00e7\u0131lan pencere.",
    song3_title: "Moroor - Haamim",
    song3_text: "Ge\u00e7mi\u015f tek bir \u015fark\u0131da geri d\u00f6ner.",
    song4_title: "I Was Never There - The Weeknd",
    song4_text: "Sanki hi\u00e7 orada olmam\u0131\u015ft\u0131m... ama izim her yerde.",
    songs_footer: "Baz\u0131 \u015fark\u0131lar sadece kulakla de\u011fil, kalple de dinlenir.",
    videos_title: "Videolar",
    videos_text: "K\u0131sa sahneler, ama etkileri zamandan daha uzun.",
    video_memory_label: "Hat\u0131ra",
    video1_title: "Video 1",
    video1_text: "Baz\u0131 anlar videoda biter ama kalpte bitmez.",
    video2_title: "Video 2",
    video2_text: "Sahne k\u0131sa, ama etkisi unutma g\u00fcc\u00fcnden daha uzun.",
    videos_footer: "Baz\u0131 videolar sadece zaman\u0131 de\u011fil, ac\u0131y\u0131 da saklar.",
    writings_title: "Bo\u011fulma",
    writings_text: "Sessizli\u011fin dayan\u0131lmaz oldu\u011fu yerde \u00e7\u0131kan s\u00f6zler.",
    writings_footer: "\u00d6zl\u00fcyorum, ac\u0131 \u00e7ekiyorum ve yaz\u0131yorum... \u00e7\u00fcnk\u00fc izden bana kalan tek \u015fey bu.",
    typed_1: "D\u00f6rt saat d\u00f6rt dakika...",
    typed_2: "S\u00f6nmeyen bir iz...",
    typed_3: "Her bilmece kendi vaktini bekliyor...",
    typed_4: "Geri say\u0131mdan sonra s\u00f6z ba\u015flar...",
    countdown_label: "Kalan s\u00fcre: ",
    countdown_day: "g\u00fcn",
    countdown_hour: "saat",
    countdown_minute: "dakika",
    countdown_second: "saniye",
    riddle_prompt: "Soruyu \u00e7\u00f6z",
    riddle_ashkim: "Sana hep seslendiği şey",
    riddle_nafasim: "Bu kelimeyi söyleyişini hep çok güzel bulurdum",
    riddle_kaar: "Ne yazık ki bu kelime sana yakışıyordu",
    riddle_asgoori: "İçimden gelen ve senin sadece söz sandığın kelime",
    riddle_lucifer: "Kolay çözüm bulunca şaşırıp bana dediğin kelime",
    riddle_echska: "Ömür boyu kalmaları gereken şey",
    photos_header_sub: "Buradaki her fotoğraf bir kalp atışı taşır ve her kalp atışı dinmeyen bir iz taşır.",
    photos_fallback_caption: "Sessiz bir anı… ama unutulmaz.",
  },
  fa: {
    dir: "rtl",
    page_title_login: "\u0646\u0641\u0633\u0645 | \u0648\u0631\u0648\u062f",
    page_title_main: "\u0646\u0641\u0633\u0645",
    brand: "\u0646\u0641\u0633\u0645",
    nav_login: "\u0648\u0631\u0648\u062f",
    nav_home: "\u062e\u0627\u0646\u0647",
    nav_moments: "\u0627\u0632 \u0622\u063a\u0627\u0632 \u062a\u0627 \u0627\u062b\u0631",
    nav_photos: "\u0622\u063a\u0648\u0634 \u0639\u06a9\u0633\u200c\u0647\u0627",
    nav_songs: "\u0622\u0647\u0646\u06af\u200c\u0647\u0627\u06cc \u0634\u0628",
    nav_videos: "\u0648\u06cc\u062f\u06cc\u0648\u0647\u0627",
    nav_writings: "\u062e\u0641\u06af\u06cc",
    nav_stats: "\u0622\u0645\u0627\u0631",
    stats_title: "\u0622\u0645\u0627\u0631",
    stats_text: "\u0628\u0628\u06cc\u0646 \u0686\u0642\u062f\u0631 \u0628\u0647 \u0627\u06cc\u0646 \u062c\u0627 \u0622\u0645\u062f\u06cc \u0648 \u06a9\u062f\u0627\u0645 \u062e\u0627\u0637\u0631\u0647\u200c\u0647\u0627 \u0631\u0627 \u062f\u06cc\u062f\u06cc.",
    stats_total_time: "\u0645\u062c\u0645\u0648\u0639 \u0632\u0645\u0627\u0646",
    stats_session_count: "\u062a\u0639\u062f\u0627\u062f \u0628\u0627\u0632\u062f\u06cc\u062f",
    stats_first_open: "\u0627\u0648\u0644\u06cc\u0646 \u0628\u0627\u0632\u200c\u0634\u062f\u0646",
    stats_last_open: "\u0622\u062e\u0631\u06cc\u0646 \u0628\u0627\u0632\u200c\u0634\u062f\u0646",
    stats_total_plays: "\u062c\u0645\u0639 \u067e\u062e\u0634\u200c\u0647\u0627",
    stats_unique_videos: "\u062a\u0639\u062f\u0627\u062f \u0648\u06cc\u062f\u06cc\u0648\u0647\u0627\u06cc \u062f\u06cc\u062f\u0647\u200c\u0634\u062f\u0647",
    stats_never_played: "\u062f\u06cc\u062f\u0647 \u0646\u0634\u062f\u0647",
    stats_most_played: "\u067e\u0631\u200c\u062a\u06a9\u0631\u0627\u0631\u062a\u0631\u06cc\u0646",
    stats_sessions_heading: "\u0628\u0627\u0632\u062f\u06cc\u062f\u0647\u0627",
    stats_videos_heading: "\u0648\u06cc\u062f\u06cc\u0648\u0647\u0627",
    stats_session_open: "\u0628\u0627\u0632\u200c\u0634\u062f\u0646",
    stats_session_close: "\u0628\u0633\u062a\u0647 \u0634\u062f\u0646",
    stats_session_duration: "\u0645\u062f\u062a",
    stats_session_active: "\u0628\u0627\u0632",
    stats_play_count: "\u062f\u0641\u0639\u0647",
    stats_last_played: "\u0622\u062e\u0631\u06cc\u0646 \u067e\u062e\u0634",
    stats_never: "\u0647\u0631\u06af\u0632",
    stats_no_data: "\u0647\u0646\u0648\u0632 \u062f\u0627\u062f\u0647\u200c\u0627\u06cc \u0646\u06cc\u0633\u062a.",
    stats_reset: "\u067e\u0627\u06a9 \u06a9\u0631\u062f\u0646",
    stats_reset_confirm: "\u0647\u0645\u0647\u200c\u06cc \u0622\u0645\u0627\u0631 \u067e\u0627\u06a9 \u0634\u0648\u062f\u061f",
    stats_footer: "\u0627\u06cc\u0646 \u0639\u062f\u062f\u0647\u0627 \u0641\u0642\u0637 \u0639\u062f\u062f \u0646\u06cc\u0633\u062a\u0646\u062f\u061b \u062f\u0631 \u0647\u0631 \u06a9\u062f\u0627\u0645 \u06cc\u06a9 \u0646\u06af\u0627\u0647 \u067e\u0646\u0647\u0627\u0646 \u0627\u0633\u062a.",
    login_title: "\u0646\u0641\u0633\u0645",
    login_text: "\u0627\u06cc\u0646 \u062c\u0627 \u062a\u0627 \u06a9\u0627\u0645\u0644 \u0634\u062f\u0646 \u0634\u0645\u0627\u0631\u0634 \u0628\u0633\u062a\u0647 \u0645\u06cc\u200c\u0645\u0627\u0646\u062f. \u0647\u0631 \u0627\u0633\u0645 \u0645\u0646\u062a\u0638\u0631 \u0648\u0642\u062a \u062e\u0648\u062f\u0634 \u0627\u0633\u062a. \u0628\u0639\u062f \u0627\u0632 \u067e\u0627\u06cc\u0627\u0646\u060c \u062f\u06cc\u06af\u0631 \u0634\u0645\u0627\u0631\u0634\u06cc \u0646\u0645\u06cc\u200c\u0645\u0627\u0646\u062f... \u0641\u0642\u0637 \u06a9\u0644\u0645\u0627\u062a \u0645\u06cc\u200c\u0645\u0627\u0646\u0646\u062f.",
    login_input: "\u062c\u0648\u0627\u0628 \u0631\u0627 \u0628\u0646\u0648\u06cc\u0633",
    login_button: "\u0628\u0627\u0642\u06cc\u200c\u0645\u0627\u0646\u062f\u0647 \u0631\u0627 \u0628\u0627\u0632 \u06a9\u0646",
    login_hint: "\u0635\u0641\u062d\u0647 \u0642\u0628\u0644 \u0627\u0632 \u067e\u0627\u06cc\u0627\u0646 \u0632\u0645\u0627\u0646 \u0628\u0627\u0632 \u0646\u0645\u06cc\u200c\u0634\u0648\u062f. \u0628\u0639\u062f \u0627\u0632 \u0622\u0646 \u0641\u0642\u0637 \u06a9\u0633\u06cc \u06a9\u0647 \u062c\u0648\u0627\u0628 \u062f\u0631\u0633\u062a \u0631\u0627 \u0628\u062f\u0627\u0646\u062f \u0645\u06cc\u200c\u062a\u0648\u0627\u0646\u062f \u0628\u0627\u0632 \u06a9\u0646\u062f.",
    login_msg_closed: "\u0635\u0641\u062d\u0647 \u062a\u0627 \u067e\u0627\u06cc\u0627\u0646 \u0634\u0645\u0627\u0631\u0634 \u0628\u0627\u0632 \u0646\u0645\u06cc\u200c\u0634\u0648\u062f",
    login_msg_wrong: "\u062c\u0648\u0627\u0628 \u0627\u0634\u062a\u0628\u0627\u0647 \u0627\u0633\u062a",
    login_msg_success: "\u0635\u0641\u062d\u0647 \u062f\u0631 \u062d\u0627\u0644 \u0628\u0627\u0632 \u0634\u062f\u0646 \u0627\u0633\u062a...",
    hero_eyebrow: "NAFSAM \u2022 20 AUG 2025 \u2022 04:04 AM",
    hero_title: "\u0686\u0647\u0627\u0631 \u0633\u0627\u0639\u062a \u0648 \u0686\u0647\u0627\u0631 \u062f\u0642\u06cc\u0642\u0647",
    hero_text: "\u062a\u0648 \u0631\u0627 \u0627\u062a\u0641\u0627\u0642\u06cc \u0634\u0646\u0627\u062e\u062a\u0645. \u062f\u0631 \u0632\u0645\u0627\u0646 \u062e\u06cc\u0644\u06cc \u06a9\u0648\u062a\u0627\u0647\u060c \u0686\u06cc\u0632\u06cc \u0631\u0627 \u0632\u0646\u062f\u06af\u06cc \u06a9\u0631\u062f\u0645 \u06a9\u0647 \u062f\u0631 \u0633\u0627\u0644\u200c\u0647\u0627 \u062a\u062c\u0631\u0628\u0647 \u0646\u06a9\u0631\u062f\u0647 \u0628\u0648\u062f\u0645. \u0627\u0632 \u062f\u0631\u0650 \u06cc\u06a9 \u0647\u062a\u0644 \u0631\u0648\u06cc\u0627 \u0634\u0631\u0648\u0639 \u0634\u062f\u060c \u062f\u0631 \u0635\u0628\u062d\u06cc \u0622\u0631\u0627\u0645 \u063a\u06cc\u0628\u062a \u0622\u063a\u0627\u0632 \u0634\u062f \u0648 \u0628\u0639\u062f \u0627\u0632 \u0622\u0646 \u0627\u062b\u0631\u0634 \u062f\u0631 \u0647\u0645\u0647 \u0686\u06cc\u0632 \u0645\u0627\u0646\u062f.",
    quote_1: "\u0628\u0639\u0636\u06cc \u062f\u06cc\u062f\u0627\u0631\u0647\u0627 \u062f\u0631 \u0632\u0645\u0627\u0646 \u06a9\u0648\u062a\u0627\u0647\u200c\u0627\u0646\u062f\u060c \u0627\u0645\u0627 \u062f\u0631 \u0627\u062b\u0631 \u0628\u0633\u06cc\u0627\u0631 \u0628\u0644\u0646\u062f.",
    quote_2: "\u0645\u0646 \u0645\u06cc\u0627\u0646 \u0622\u063a\u0648\u0634 \u0639\u06a9\u0633\u200c\u0647\u0627 \u0648 \u0641\u06a9\u0631\u0650 \u0627\u06cc\u0646\u200c\u06a9\u0647 \u062a\u0648 \u0628\u0647 \u062e\u0627\u0637\u0631\u0647 \u062a\u0628\u062f\u06cc\u0644 \u0634\u062f\u0647\u200c\u0627\u06cc \u0645\u0627\u0646\u062f\u0647\u200c\u0627\u0645.",
    quote_3: "\u0634\u0628 \u0637\u0648\u0644\u0627\u0646\u06cc \u0645\u06cc\u200c\u0634\u0648\u062f \u0686\u0648\u0646 \u062d\u0627\u0641\u0638\u0647 \u0646\u0645\u06cc\u200c\u062e\u0648\u0627\u0628\u062f.",
    quote_4: "\u0628\u0639\u0636\u06cc \u0639\u0634\u0642\u200c\u0647\u0627 \u062a\u0645\u0627\u0645 \u0646\u0645\u06cc\u200c\u0634\u0648\u0646\u062f... \u0641\u0642\u0637 \u0628\u0647 \u062f\u0631\u062f\u06cc \u0622\u0631\u0627\u0645 \u062a\u0628\u062f\u06cc\u0644 \u0645\u06cc\u200c\u0634\u0648\u0646\u062f.",
    open_story: "\u062f\u0627\u0633\u062a\u0627\u0646 \u0631\u0627 \u0628\u0627\u0632 \u06a9\u0646",
    read_pain: "\u062f\u0631\u062f \u0631\u0627 \u0628\u062e\u0648\u0627\u0646",
    card_moments_title: "\u0627\u0632 \u0622\u063a\u0627\u0632 \u062a\u0627 \u0627\u062b\u0631",
    card_moments_text: "\u062f\u0631\u060c \u0635\u0628\u062d\u060c \u0648 \u0631\u0627\u0647\u06cc \u06a9\u0647 \u0634\u0627\u0647\u062f \u0622\u0634\u0648\u0628 \u062f\u0631\u0648\u0646 \u0634\u062f.",
    card_photos_title: "\u0622\u063a\u0648\u0634 \u0639\u06a9\u0633\u200c\u0647\u0627",
    card_photos_text: "\u0639\u06a9\u0633\u200c\u0647\u0627 \u06af\u0630\u0634\u062a\u0647 \u0631\u0627 \u0628\u0631\u0646\u0645\u06cc\u200c\u06af\u0631\u062f\u0627\u0646\u0646\u062f\u060c \u0627\u0645\u0627 \u0627\u062b\u0631 \u0631\u0627 \u0632\u0646\u062f\u0647 \u0646\u06af\u0647 \u0645\u06cc\u200c\u062f\u0627\u0631\u0646\u062f.",
    card_songs_title: "\u0622\u0647\u0646\u06af\u200c\u0647\u0627\u06cc \u0634\u0628",
    card_songs_text: "\u0622\u0647\u0646\u06af\u200c\u0647\u0627\u06cc\u06cc \u06a9\u0647 \u0631\u0648\u0632\u06cc \u0645\u0627\u0644 \u0645\u0627 \u0628\u0648\u062f\u0646\u062f\u060c \u062d\u0627\u0644\u0627 \u0628\u0647 \u0634\u0628\u06cc \u0637\u0648\u0644\u0627\u0646\u06cc \u062a\u0628\u062f\u06cc\u0644 \u0634\u062f\u0647\u200c\u0627\u0646\u062f.",
    card_writings_title: "\u062e\u0641\u06af\u06cc",
    card_writings_text: "\u06a9\u0644\u0645\u0627\u062a\u06cc \u06a9\u0647 \u0648\u0642\u062a\u06cc \u0633\u06a9\u0648\u062a \u0633\u0646\u06af\u06cc\u0646 \u0634\u062f \u0628\u06cc\u0631\u0648\u0646 \u0622\u0645\u062f\u0646\u062f.",
    footer_text: "\u0627\u06cc\u0646 \u062c\u0627 \u0628\u0631\u0627\u06cc \u0627\u0646\u062a\u0642\u0627\u0645 \u0646\u06cc\u0633\u062a\u061b \u0628\u0631\u0627\u06cc \u0627\u062b\u0631\u06cc \u0627\u0633\u062a \u06a9\u0647 \u062c\u0627\u06cc\u06cc \u0628\u0631\u0627\u06cc \u0631\u0641\u062a\u0646 \u067e\u06cc\u062f\u0627 \u0646\u06a9\u0631\u062f.",
    moments_title: "\u0627\u0632 \u0622\u063a\u0627\u0632 \u062a\u0627 \u0627\u062b\u0631",
    moments_text: "\u0647\u0645\u0647 \u062f\u0627\u0633\u062a\u0627\u0646\u200c\u0647\u0627 \u0644\u0627\u0632\u0645 \u0646\u06cc\u0633\u062a \u0637\u0648\u0644\u0627\u0646\u06cc \u0628\u0627\u0634\u0646\u062f. \u06af\u0627\u0647\u06cc \u0686\u0646\u062f \u0633\u0627\u0639\u062a \u0634\u06a9\u0644 \u06cc\u06a9 \u0642\u0644\u0628 \u0631\u0627 \u06a9\u0627\u0645\u0644\u0627\u064b \u0639\u0648\u0636 \u0645\u06cc\u200c\u06a9\u0646\u062f.",
    moment1_time: "20 Aug 2025 \u2022 3:52 AM",
    moment1_title: "\u067e\u06cc\u0634 \u0627\u0632 \u0622\u0646\u200c\u06a9\u0647 \u0648\u0627\u0642\u0639\u06cc \u0634\u0648\u06cc",
    moment1_text: "\u067e\u06cc\u0634 \u0627\u0632 \u0648\u0631\u0648\u062f \u0628\u0647 \u0647\u062a\u0644\u060c \u0646\u0645\u06cc\u200c\u062f\u0627\u0646\u0633\u062a\u0645 \u0686\u0646\u062f \u062f\u0642\u06cc\u0642\u0647 \u0628\u0639\u062f \u0632\u06cc\u0628\u0627\u062a\u0631\u06cc\u0646 \u0686\u06cc\u0632 \u0632\u0646\u062f\u06af\u06cc\u200c\u0627\u0645 \u0631\u0627 \u062e\u0648\u0627\u0647\u0645 \u062f\u06cc\u062f.",
    moment1_memory: "\u0622\u0646 \u062f\u0631 \u0641\u0642\u0637 \u0648\u0631\u0648\u062f\u06cc \u0646\u0628\u0648\u062f\u061b \u0622\u063a\u0627\u0632 \u0686\u06cc\u0632\u06cc \u0628\u0632\u0631\u06af\u200c\u062a\u0631 \u0627\u0632 \u0637\u0627\u0642\u062a \u0645\u0646 \u0628\u0648\u062f.",
    moment2_time: "20 Aug 2025 \u2022 8:04 AM",
    moment2_title: "\u0635\u0628\u062d\u06cc \u06a9\u0647 \u062a\u0648 \u0631\u0641\u062a\u06cc \u0648 \u0645\u0646 \u0645\u0627\u0646\u062f\u0645",
    moment2_text: "\u0635\u0628\u062d \u06a9\u0647 \u0634\u062f \u0647\u0645\u0647 \u0686\u06cc\u0632 \u0633\u0631 \u062c\u0627\u06cc \u062e\u0648\u062f \u0628\u0648\u062f... \u062c\u0632 \u0645\u0646.",
    moment2_memory: "\u0645\u06cc\u0627\u0646 \u0686\u0647\u0627\u0631 \u0633\u0627\u0639\u062a \u0648 \u0686\u0647\u0627\u0631 \u062f\u0642\u06cc\u0642\u0647 \u0648 \u0627\u062b\u0631\u06cc \u06a9\u0647 \u0622\u0631\u0627\u0645 \u0646\u0645\u06cc\u200c\u0634\u0648\u062f \u0645\u0639\u0644\u0642 \u0645\u0627\u0646\u062f\u0645.",
    moment3_time: "\u0634\u0628\u0650 \u0633\u0648\u062e\u062a\u0646 \u062f\u0631\u0648\u0646",
    moment3_title: "\u0631\u0627\u0647\u06cc \u06a9\u0647 \u0634\u0627\u0647\u062f \u0634\u062f",
    moment3_text: "\u0627\u06cc\u0646 \u062a\u0635\u0648\u06cc\u0631 \u0641\u0642\u0637 \u0627\u0632 \u062c\u0627\u062f\u0647 \u0646\u06cc\u0633\u062a\u061b \u0627\u0632 \u0642\u0644\u0628\u06cc \u0627\u0633\u062a \u06a9\u0647 \u0633\u0631\u06cc\u0639\u200c\u062a\u0631 \u0627\u0632 \u062a\u0648\u0627\u0646\u0634 \u0645\u06cc\u200c\u062f\u0648\u06cc\u062f.",
    moment3_memory: "\u0628\u0639\u062f \u0641\u0647\u0645\u06cc\u062f\u0645 \u0628\u0639\u0636\u06cc \u0642\u0644\u0628\u200c\u0647\u0627 \u0641\u0642\u0637 \u0628\u0647 \u062e\u0627\u0637\u0631\u0647 \u0646\u06cc\u0627\u0632 \u0646\u062f\u0627\u0631\u0646\u062f\u060c \u0628\u0647 \u0646\u062c\u0627\u062a \u0647\u0645 \u0646\u06cc\u0627\u0632 \u062f\u0627\u0631\u0646\u062f.",
    moment4_time: "\u0634\u0628",
    moment4_title: "\u06af\u0644\u200c\u0647\u0627 \u0648 \u062a\u0627\u0631\u06cc\u06a9\u06cc",
    moment4_text: "\u0646\u06cc\u0645\u0647\u200c\u0634\u0628 \u06af\u0644\u200c\u0647\u0627 \u0631\u0633\u06cc\u062f\u0646\u062f\u061b \u0627\u0646\u06af\u0627\u0631 \u0622\u0633\u0645\u0627\u0646 \u062a\u06a9\u0647\u200c\u0627\u06cc \u0628\u0647\u0627\u0631 \u0628\u0631\u0627\u06cc\u0645\u0627\u0646 \u0641\u0631\u0633\u062a\u0627\u062f.",
    moment4_memory: "\u06af\u0644\u200c\u0647\u0627 \u062f\u0631 \u062a\u0627\u0631\u06cc\u06a9\u06cc \u0632\u06cc\u0628\u0627\u062a\u0631 \u0645\u06cc\u200c\u0628\u0648\u06cc\u0646\u062f.",
    moment5_time: "\u0628\u0627 \u0647\u0645",
    moment5_title: "\u0628\u0627\u0644\u0627\u06cc \u06a9\u0644\u0628\u0647 \u0686\u0648\u0628\u06cc",
    moment5_text: "\u062f\u0631 \u0628\u0644\u0646\u062f\u06cc\u060c \u062f\u0648\u0631 \u0627\u0632 \u062f\u0646\u06cc\u0627\u060c \u0641\u0642\u0637 \u0645\u0627 \u062f\u0648 \u0646\u0641\u0631 \u0628\u0648\u062f\u06cc\u0645.",
    moment5_memory: "\u0628\u0639\u0636\u06cc \u0644\u062d\u0638\u0647\u200c\u0647\u0627 \u0628\u0627 \u0632\u0645\u0627\u0646 \u0631\u0642\u0627\u0628\u062a \u0646\u0645\u06cc\u200c\u06a9\u0646\u0646\u062f.",
    moment6_time: "\u0646\u0648\u0631 \u0622\u0628\u06cc",
    moment6_title: "\u0632\u0628\u0627\u0646 \u062f\u0633\u062a\u200c\u0647\u0627",
    moment6_text: "\u0632\u06cc\u0631 \u0646\u0648\u0631 \u0622\u0628\u06cc \u062f\u0633\u062a\u200c\u0647\u0627\u06cc\u0645\u0627\u0646 \u0628\u0647 \u0647\u0645 \u067e\u06cc\u0686\u06cc\u062f\u061b \u06a9\u0644\u0645\u0627\u062a \u0644\u0627\u0632\u0645 \u0646\u0628\u0648\u062f.",
    moment6_memory: "\u0642\u0644\u0628\u200c\u0647\u0627 \u062f\u0631 \u062f\u0633\u062a\u200c\u0647\u0627 \u062d\u0631\u0641 \u0645\u06cc\u200c\u0632\u0646\u0646\u062f.",
    moment7_time: "\u0628\u06cc\u200c\u0635\u062f\u0627",
    moment7_title: "\u06cc\u06a9 \u0646\u06af\u0627\u0647 \u06a9\u0627\u0641\u06cc \u0628\u0648\u062f",
    moment7_text: "\u0648\u0642\u062a\u06cc \u0645\u06cc\u0627\u0646 \u0646\u0648\u0631\u0647\u0627 \u0627\u06cc\u0633\u062a\u0627\u062f\u06cc\u060c \u062f\u0646\u06cc\u0627 \u0628\u0631\u0627\u06cc\u0645 \u0645\u062a\u0648\u0642\u0641 \u0634\u062f.",
    moment7_memory: "\u06cc\u0627\u062f\u0622\u0648\u0631\u06cc \u0686\u0647\u0631\u0647\u060c \u06cc\u0639\u0646\u06cc \u06cc\u0627\u062f\u0622\u0648\u0631\u06cc \u0647\u0645\u0647 \u0686\u06cc\u0632.",
    moment8_time: "\u0631\u0648\u06cc \u0645\u0627\u0633\u0647",
    moment8_title: "\u0627\u0633\u0645\u200c\u0647\u0627 \u0631\u0648\u06cc \u0634\u0646",
    moment8_text: "\u062f\u0631\u06cc\u0627 \u067e\u0627\u06a9\u0634 \u06a9\u0631\u062f\u060c \u0627\u0645\u0627 \u0627\u0633\u0645\u200c\u0647\u0627\u06cc\u06cc \u06a9\u0647 \u0631\u0648\u06cc \u0634\u0646 \u0646\u0648\u0634\u062a\u06cc\u0645 \u062f\u0631 \u0642\u0644\u0628\u0645 \u0645\u0627\u0646\u062f.",
    moment8_memory: "\u0628\u0639\u0636\u06cc \u0631\u062f\u0647\u0627 \u062f\u0631 \u0622\u0628 \u0646\u0645\u06cc\u200c\u0645\u0627\u0646\u0646\u062f\u060c \u062f\u0631 \u0631\u0648\u062d \u0645\u06cc\u200c\u0645\u0627\u0646\u0646\u062f.",
    moment9_time: "\u067e\u0627\u06cc\u0627\u0646",
    moment9_title: "\u0627\u0632 \u0647\u0645\u0627\u0646 \u062f\u0631",
    moment9_text: "\u0627\u0632 \u0647\u0645\u0627\u0646 \u062f\u0631\u06cc \u06a9\u0647 \u0634\u0631\u0648\u0639 \u06a9\u0631\u062f\u06cc\u0645 \u062c\u062f\u0627 \u0634\u062f\u06cc\u0645. \u06a9\u0648\u0644\u0647 \u0631\u0648\u06cc \u062f\u0648\u0634\u060c \u0647\u062a\u0644 \u067e\u0634\u062a \u0633\u0631.",
    moment9_memory: "\u0628\u0639\u0636\u06cc \u062f\u0631\u0647\u0627 \u0647\u0645 \u0622\u063a\u0627\u0632\u0646\u062f \u0647\u0645 \u067e\u0627\u06cc\u0627\u0646.",
    moments_footer: "\u0627\u0632 \u062f\u0631\u06cc \u062f\u0631 \u0633\u067e\u06cc\u062f\u0647\u200c\u062f\u0645\u060c \u062a\u0627 \u0635\u0628\u062d\u0650 \u0631\u0641\u062a\u0646\u060c \u062a\u0627 \u0627\u062b\u0631\u06cc \u06a9\u0647 \u0645\u0627\u0646\u062f.",
    photos_title: "\u0622\u063a\u0648\u0634 \u0639\u06a9\u0633\u200c\u0647\u0627",
    photos_text: "\u062d\u0627\u0644\u0627 \u0645\u0646 \u062f\u0631 \u0622\u063a\u0648\u0634 \u0639\u06a9\u0633\u200c\u0647\u0627\u06cc\u200c\u0645\u0627\u0646 \u0647\u0633\u062a\u0645 \u0648 \u0641\u0642\u0637 \u0633\u06a9\u0648\u062a \u062c\u0648\u0627\u0628\u0645 \u0631\u0627 \u0645\u06cc\u200c\u062f\u0647\u062f.",
    photo1_text: "\u0648\u0642\u062a\u06cc \u0627\u0632 \u0627\u06cc\u0646 \u062f\u0631 \u0631\u062f \u0634\u062f\u0645 \u0646\u0645\u06cc\u200c\u062f\u0627\u0646\u0633\u062a\u0645... \u0645\u0648\u0642\u0639 \u0628\u0631\u06af\u0634\u062a\u0646 \u0642\u0644\u0628\u0645 \u0631\u0627 \u062a\u0648\u06cc\u0634 \u062c\u0627 \u0645\u06cc\u200c\u06af\u0630\u0627\u0631\u0645.",
    photo2_text: "\u0622\u0646 \u0635\u0628\u062d \u0648\u0642\u062a\u06cc \u0686\u0634\u0645\u0647\u0627\u06cc\u0634 \u0628\u0627\u0632 \u0634\u062f \u062f\u0646\u06cc\u0627 \u0647\u0646\u0648\u0632 \u0632\u06cc\u0628\u0627 \u0628\u0648\u062f. \u0648\u0642\u062a\u06cc \u0628\u0633\u062a\u0634 \u0647\u0645\u0647 \u0686\u06cc\u0632 \u062a\u0645\u0627\u0645 \u0634\u062f.",
    photo3_text: "\u0631\u0627\u0647 \u0631\u0641\u062a\u0646 \u062f\u0631 \u062a\u0627\u0631\u06cc\u06a9\u06cc \u062a\u0646\u0647\u0627... \u062f\u0631\u062f\u0646\u0627\u06a9\u200c\u062a\u0631 \u0627\u0632 \u06cc\u0627\u062f\u0622\u0648\u0631\u06cc \u062a\u0648 \u0646\u0628\u0648\u062f.",
    photo4_text: "\u0627\u0632 \u0647\u0645\u0627\u0646 \u062f\u0631 \u0648\u0627\u0631\u062f \u0634\u062f\u06cc\u0645\u060c \u0627\u0632 \u0647\u0645\u0627\u0646 \u062f\u0631 \u0628\u06cc\u0631\u0648\u0646 \u0622\u0645\u062f\u06cc\u0645. \u0627\u0645\u0627 \u0622\u0646\u0686\u0647 \u062f\u0631\u0648\u0646\u0634 \u062c\u0627 \u06af\u0630\u0627\u0634\u062a\u06cc\u0645 \u0647\u0631\u06af\u0632 \u0628\u0631\u0646\u06af\u0634\u062a.",
    photo5_text: "\u06a9\u06cc\u0641 \u0631\u0627 \u06af\u0630\u0627\u0634\u062a\u0645\u060c \u062f\u0631 \u0631\u0627 \u0628\u0633\u062a\u0645. \u0647\u0631 \u0644\u062d\u0638\u0647\u200c\u0627\u06cc \u06a9\u0647 \u0628\u0627 \u062a\u0648 \u06af\u0630\u0634\u062a \u0631\u0627 \u0631\u0648\u06cc \u0622\u0646 \u0635\u0646\u062f\u0644\u06cc \u062c\u0627 \u06af\u0630\u0627\u0634\u062a\u0645.",
    photo6_text: "\u0644\u0627\u062f\u0631\u0627... \u0622\u062e\u0631\u06cc\u0646 \u062c\u0627\u06cc\u06cc \u06a9\u0647 \u062a\u0648 \u0631\u0627 \u062f\u06cc\u062f\u0645. \u0686\u0631\u0627\u063a\u200c\u0647\u0627\u06cc\u0634 \u0647\u0646\u0648\u0632 \u0631\u0648\u0634\u0646\u0646\u062f \u0627\u0645\u0627 \u062f\u0631\u0648\u0646\u0634 \u062f\u06cc\u06af\u0631 \u062a\u0627\u0631\u06cc\u06a9 \u0627\u0633\u062a.",
    photo7_text: "\u0628\u0633\u06cc\u0627\u0631 \u0628\u062e\u0634\u06cc\u062f\u0645\u062a... \u062a\u0627 \u062c\u0627\u06cc\u06cc \u06a9\u0647 \u062a\u0646\u0647\u0627 \u06af\u0646\u0627\u0647\u06a9\u0627\u0631 \u062f\u0631 \u062d\u0642 \u0642\u0644\u0628\u0645\u060c \u0645\u0646 \u0634\u062f\u0645.",
    photo7_sub: "\u0627\u06cc\u0646\u062c\u0627 \u0628\u0631\u0627\u06cc \u0647\u0645\u0647 \u0686\u06cc\u0632 \u062a\u0648\u062c\u06cc\u0647 \u0645\u06cc\u200c\u0622\u0648\u0631\u062f\u0645\u060c\\n\u062d\u062a\u06cc \u0686\u06cc\u0632\u0647\u0627\u06cc\u06cc \u06a9\u0647 \u0645\u0631\u0627 \u0645\u06cc\u200c\u06a9\u0634\u062a\u0646\u062f.",
    photos_footer: "\u0639\u06a9\u0633\u200c\u0647\u0627 \u06af\u0630\u0634\u062a\u0647 \u0631\u0627 \u0628\u0631\u0646\u0645\u06cc\u200c\u06af\u0631\u062f\u0627\u0646\u0646\u062f\u060c \u0627\u0645\u0627 \u0627\u062b\u0631\u0634 \u0631\u0627 \u0632\u0646\u062f\u0647 \u0646\u06af\u0647 \u0645\u06cc\u200c\u062f\u0627\u0631\u0646\u062f.",
    songs_title: "\u0622\u0647\u0646\u06af\u200c\u0647\u0627\u06cc \u0634\u0628",
    songs_text: "\u0622\u0647\u0646\u06af\u200c\u0647\u0627\u06cc\u06cc \u06a9\u0647 \u0631\u0648\u0632\u06cc \u06af\u0631\u0645\u0627 \u0628\u0648\u062f\u0646\u062f\u060c \u062d\u0627\u0644\u0627 \u0634\u0628\u06cc \u0637\u0648\u0644\u0627\u0646\u06cc \u0648 \u0628\u0627\u0632 \u0628\u0631 \u062e\u0627\u0637\u0631\u0647 \u0634\u062f\u0647\u200c\u0627\u0646\u062f.",
    song1_title: "\u0622\u0647\u0646\u06af 1",
    song1_text: "\u0647\u0631 \u0628\u0627\u0631 \u067e\u062e\u0634 \u0645\u06cc\u200c\u0634\u0648\u062f\u060c \u062f\u0631\u062f \u0627\u0632 \u0627\u0648\u0644 \u0628\u0631\u0645\u06cc\u200c\u06af\u0631\u062f\u062f.",
    song2_title: "\u0622\u0647\u0646\u06af 2",
    song2_text: "\u0627\u06cc\u0646 \u0641\u0642\u0637 \u0622\u0647\u0646\u06af \u0646\u06cc\u0633\u062a\u061b \u067e\u0646\u062c\u0631\u0647\u200c\u0627\u06cc \u0627\u0633\u062a \u0628\u0647 \u0634\u0628\u06cc \u0628\u06cc\u200c\u062e\u0648\u0627\u0628.",
    song3_title: "\u0645\u0631\u0648\u0631 - \u062d\u0627\u0645\u06cc\u0645",
    song3_text: "\u06af\u0630\u0634\u062a\u0647 \u062f\u0631 \u06cc\u06a9 \u0622\u0647\u0646\u06af \u0628\u0631\u0645\u06cc\u200c\u06af\u0631\u062f\u062f.",
    song4_title: "I Was Never There - The Weeknd",
    song4_text: "\u0627\u0646\u06af\u0627\u0631 \u0647\u06cc\u0686\u200c\u0648\u0642\u062a \u0622\u0646\u062c\u0627 \u0646\u0628\u0648\u062f\u0645... \u0627\u0645\u0627 \u0631\u062f\u0645 \u0647\u0645\u0647 \u062c\u0627 \u0647\u0633\u062a.",
    songs_footer: "\u0628\u0639\u0636\u06cc \u0622\u0647\u0646\u06af\u200c\u0647\u0627 \u0641\u0642\u0637 \u0628\u0627 \u06af\u0648\u0634 \u0634\u0646\u06cc\u062f\u0647 \u0646\u0645\u06cc\u200c\u0634\u0648\u0646\u062f\u060c \u0628\u0627 \u062f\u0644 \u0647\u0645 \u0634\u0646\u06cc\u062f\u0647 \u0645\u06cc\u200c\u0634\u0648\u0646\u062f.",
    videos_title: "\u0648\u06cc\u062f\u06cc\u0648\u0647\u0627",
    videos_text: "\u0635\u062d\u0646\u0647\u200c\u0647\u0627\u06cc \u06a9\u0648\u062a\u0627\u0647\u060c \u0627\u0645\u0627 \u0627\u062b\u0631\u0634\u0627\u0646 \u0627\u0632 \u0632\u0645\u0627\u0646 \u0637\u0648\u0644\u0627\u0646\u06cc\u200c\u062a\u0631 \u0627\u0633\u062a.",
    video_memory_label: "\u062e\u0627\u0637\u0631\u0647",
    video1_title: "\u0648\u06cc\u062f\u06cc\u0648 1",
    video1_text: "\u0628\u0639\u0636\u06cc \u0644\u062d\u0638\u0647\u200c\u0647\u0627 \u062f\u0631 \u0648\u06cc\u062f\u06cc\u0648 \u062a\u0645\u0627\u0645 \u0645\u06cc\u200c\u0634\u0648\u0646\u062f \u0627\u0645\u0627 \u062f\u0631 \u062f\u0644 \u0646\u0647.",
    video2_title: "\u0648\u06cc\u062f\u06cc\u0648 2",
    video2_text: "\u0635\u062d\u0646\u0647 \u06a9\u0648\u062a\u0627\u0647 \u0627\u0633\u062a\u060c \u0627\u0645\u0627 \u0627\u062b\u0631\u0634 \u0627\u0632 \u062a\u0648\u0627\u0646 \u0641\u0631\u0627\u0645\u0648\u0634\u06cc \u0637\u0648\u0644\u0627\u0646\u06cc\u200c\u062a\u0631.",
    videos_footer: "\u0628\u0639\u0636\u06cc \u0648\u06cc\u062f\u06cc\u0648\u0647\u0627 \u0641\u0642\u0637 \u0632\u0645\u0627\u0646 \u0631\u0627 \u0646\u06af\u0647 \u0646\u0645\u06cc\u200c\u062f\u0627\u0631\u0646\u062f\u060c \u062f\u0631\u062f \u0631\u0627 \u0647\u0645 \u0646\u06af\u0647 \u0645\u06cc\u200c\u062f\u0627\u0631\u0646\u062f.",
    writings_title: "\u062e\u0641\u06af\u06cc",
    writings_text: "\u06a9\u0644\u0645\u0627\u062a\u06cc \u06a9\u0647 \u0648\u0642\u062a\u06cc \u0633\u06a9\u0648\u062a \u063a\u06cc\u0631\u0642\u0627\u0628\u0644\u200c\u062a\u062d\u0645\u0644 \u0634\u062f \u0628\u06cc\u0631\u0648\u0646 \u0622\u0645\u062f\u0646\u062f.",
    writings_footer: "\u062f\u0644\u062a\u0646\u06af\u0645\u060c \u062f\u0631\u062f \u0645\u06cc\u200c\u06a9\u0634\u0645 \u0648 \u0645\u06cc\u200c\u0646\u0648\u06cc\u0633\u0645... \u0686\u0648\u0646 \u0627\u06cc\u0646 \u062a\u0646\u0647\u0627 \u0686\u06cc\u0632\u06cc \u0627\u0633\u062a \u06a9\u0647 \u0627\u0632 \u0622\u0646 \u0627\u062b\u0631 \u0628\u0631\u0627\u06cc\u0645 \u0645\u0627\u0646\u062f\u0647.",
    typed_1: "\u0686\u0647\u0627\u0631 \u0633\u0627\u0639\u062a \u0648 \u0686\u0647\u0627\u0631 \u062f\u0642\u06cc\u0642\u0647...",
    typed_2: "\u0627\u062b\u0631\u06cc \u06a9\u0647 \u062e\u0627\u0645\u0648\u0634 \u0646\u0645\u06cc\u200c\u0634\u0648\u062f...",
    typed_3: "\u0647\u0631 \u0645\u0639\u0645\u0627 \u0645\u0646\u062a\u0638\u0631 \u0648\u0642\u062a \u062e\u0648\u062f\u0634 \u0627\u0633\u062a...",
    typed_4: "\u0628\u0639\u062f \u0627\u0632 \u0634\u0645\u0627\u0631\u0634\u060c \u06a9\u0644\u0645\u0627\u062a \u0634\u0631\u0648\u0639 \u0645\u06cc\u200c\u0634\u0648\u0646\u062f...",
    countdown_label: "\u0632\u0645\u0627\u0646 \u0628\u0627\u0642\u06cc\u200c\u0645\u0627\u0646\u062f\u0647: ",
    countdown_day: "\u0631\u0648\u0632",
    countdown_hour: "\u0633\u0627\u0639\u062a",
    countdown_minute: "\u062f\u0642\u06cc\u0642\u0647",
    countdown_second: "\u062b\u0627\u0646\u06cc\u0647",
    riddle_prompt: "\u0645\u0639\u0645\u0627 \u0631\u0627 \u062d\u0644 \u06a9\u0646",
    riddle_ashkim: "\u0686\u06cc\u0632\u06cc \u06a9\u0647 \u0647\u0645\u06cc\u0634\u0647 \u0628\u0627 \u0622\u0646 \u0635\u062f\u0627\u06cc\u0645 \u0645\u06cc\u200c\u0632\u062f\u06cc",
    riddle_nafasim: "\u0647\u0645\u06cc\u0634\u0647 \u0645\u06cc\u200c\u06af\u0641\u062a\u0645 \u0686\u0642\u062f\u0631 \u06af\u0641\u062a\u0646 \u0627\u06cc\u0646 \u06a9\u0644\u0645\u0647 \u0627\u0632 \u0632\u0628\u0627\u0646\u062a \u0632\u06cc\u0628\u0627\u0633\u062a",
    riddle_kaar: "\u0645\u062a\u0623\u0633\u0641\u0627\u0646\u0647 \u0627\u06cc\u0646 \u06a9\u0644\u0645\u0647 \u0628\u0631\u0627\u0632\u0646\u062f\u0647\u200c\u0627\u062a \u0628\u0648\u062f",
    riddle_asgoori: "\u06a9\u0644\u0645\u0647\u200c\u0627\u06cc \u06a9\u0647 \u0627\u0632 \u0627\u0639\u0645\u0627\u0642\u0645 \u0628\u06cc\u0631\u0648\u0646 \u0645\u06cc\u200c\u0622\u0645\u062f \u0648 \u062a\u0648 \u0641\u06a9\u0631 \u0645\u06cc\u200c\u06a9\u0631\u062f\u06cc \u0641\u0642\u0637 \u062d\u0631\u0641 \u0627\u0633\u062a",
    riddle_lucifer: "\u0648\u0642\u062a\u06cc \u0631\u0627\u0647\u200c\u062d\u0644 \u0631\u0627 \u0631\u0627\u062d\u062a \u067e\u06cc\u062f\u0627 \u0645\u06cc\u200c\u06a9\u0631\u062f\u0645\u060c \u0628\u0627 \u062a\u0639\u062c\u0628 \u0627\u06cc\u0646 \u0631\u0627 \u0645\u06cc\u200c\u06af\u0641\u062a\u06cc",
    riddle_echska: "\u0686\u06cc\u0632\u06cc \u06a9\u0647 \u0642\u0631\u0627\u0631 \u0628\u0648\u062f \u062a\u0627 \u0622\u062e\u0631 \u0639\u0645\u0631 \u0628\u0645\u0627\u0646\u062f",
    photos_header_sub: "\u0647\u0631 \u0639\u06a9\u0633\u06cc \u0627\u06cc\u0646\u062c\u0627 \u06cc\u06a9 \u0636\u0631\u0628\u0627\u0646 \u062f\u0627\u0631\u062f \u0648 \u0647\u0631 \u0636\u0631\u0628\u0627\u0646 \u0627\u062b\u0631\u06cc \u062f\u0627\u0631\u062f \u06a9\u0647 \u0622\u0631\u0627\u0645 \u0646\u0645\u06cc\u200c\u06af\u06cc\u0631\u062f.",
    photos_fallback_caption: "\u062e\u0627\u0637\u0631\u0647\u200c\u0627\u06cc \u0633\u0627\u06a9\u062a\u2026 \u0627\u0645\u0627 \u0641\u0631\u0627\u0645\u0648\u0634\u200c\u0646\u0634\u062f\u0646\u06cc.",
  },
  ar: {
    dir: "rtl",
    page_title_login: "\u0646\u0641\u0633\u0645 | \u0627\u0644\u062f\u062e\u0648\u0644",
    page_title_main: "\u0646\u0641\u0633\u0645",
    brand: "\u0646\u0641\u0633\u0645",
    nav_login: "\u0627\u0644\u062f\u062e\u0648\u0644",
    nav_home: "\u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629",
    nav_moments: "\u0645\u0646 \u0627\u0644\u0628\u062f\u0627\u064a\u0629 \u0625\u0644\u0649 \u0627\u0644\u0623\u062b\u0631",
    nav_photos: "\u062d\u0636\u0646 \u0627\u0644\u0635\u0648\u0631",
    nav_songs: "\u0623\u063a\u0627\u0646\u064a \u0627\u0644\u0633\u0647\u0631",
    nav_videos: "\u0627\u0644\u0641\u064a\u062f\u064a\u0648",
    nav_writings: "\u0627\u0644\u0627\u062e\u062a\u0646\u0627\u0642",
    nav_stats: "إحصائيات",
    stats_title: "الإحصائيات",
    stats_text: "كم مرة دخلت إلى هنا، وأي ذكرى شاهدت.",
    stats_total_time: "إجمالي الوقت",
    stats_session_count: "عدد الجلسات",
    stats_first_open: "أول فتح",
    stats_last_open: "آخر فتح",
    stats_total_plays: "إجمالي المشاهدات",
    stats_unique_videos: "عدد الفيديوهات المُشاهدة",
    stats_never_played: "لم تُشاهد بعد",
    stats_most_played: "الأكثر مشاهدة",
    stats_sessions_heading: "الجلسات",
    stats_videos_heading: "الفيديوهات",
    stats_session_open: "الفتح",
    stats_session_close: "الإغلاق",
    stats_session_duration: "المدة",
    stats_session_active: "مفتوحة",
    stats_play_count: "مرات",
    stats_last_played: "آخر مشاهدة",
    stats_never: "لم تُشاهد",
    stats_no_data: "لا توجد بيانات بعد.",
    stats_reset: "إعادة التعيين",
    stats_reset_confirm: "هل تريد حذف كل الإحصائيات؟",
    stats_footer: "هذه الأرقام ليست مجرد أرقام؛ في كل واحدة منها نظرة مخبأة.",
    login_title: "\u0646\u0641\u0633\u0645",
    login_text: "\u0647\u0630\u0627 \u0627\u0644\u0645\u0643\u0627\u0646 \u064a\u0628\u0642\u0649 \u0645\u063a\u0644\u0642\u064b\u0627 \u062d\u062a\u0649 \u064a\u0643\u062a\u0645\u0644 \u0627\u0644\u0639\u062f. \u0648\u0643\u0644 \u0627\u0633\u0645 \u064a\u0646\u062a\u0638\u0631 \u0648\u0642\u062a\u0647. \u0648\u0628\u0639\u062f \u0627\u0644\u0646\u0647\u0627\u064a\u0629 \u0644\u0627 \u064a\u0628\u0642\u0649 \u0639\u062f\u0651... \u0628\u0644 \u064a\u0628\u0642\u0649 \u0627\u0644\u0643\u0644\u0627\u0645.",
    login_input: "\u0627\u0643\u062a\u0628 \u0627\u0644\u062c\u0648\u0627\u0628",
    login_button: "\u0627\u0641\u062a\u062d \u0645\u0627 \u062a\u0628\u0642\u0651\u0649",
    login_hint: "\u0627\u0644\u0635\u0641\u062d\u0629 \u0644\u0646 \u062a\u064f\u0641\u062a\u062d \u0642\u0628\u0644 \u0627\u0646\u062a\u0647\u0627\u0621 \u0627\u0644\u0645\u062f\u0629\u060c \u0648\u0628\u0639\u062f\u0647\u0627 \u062a\u0641\u062a\u062d \u0641\u0642\u0637 \u0644\u0645\u0646 \u064a\u0639\u0631\u0641 \u0627\u0644\u0623\u062c\u0648\u0628\u0629 \u0627\u0644\u0635\u062d\u064a\u062d\u0629.",
    login_msg_closed: "\u0627\u0644\u0635\u0641\u062d\u0629 \u0645\u0627 \u0632\u0627\u0644\u062a \u0645\u063a\u0644\u0642\u0629 \u0625\u0644\u0649 \u0623\u0646 \u064a\u0643\u062a\u0645\u0644 \u0627\u0644\u0639\u062f \u0627\u0644\u062a\u0646\u0627\u0632\u0644\u064a",
    login_msg_wrong: "\u0627\u0644\u062c\u0648\u0627\u0628 \u063a\u064a\u0631 \u0635\u062d\u064a\u062d",
    login_msg_success: "\u062a\u0645 \u0641\u062a\u062d \u0627\u0644\u0635\u0641\u062d\u0629...",
    hero_eyebrow: "NAFSAM \u2022 20 AUG 2025 \u2022 04:04 AM",
    hero_title: "\u0623\u0631\u0628\u0639 \u0633\u0627\u0639\u0627\u062a \u0648\u0623\u0631\u0628\u0639 \u062f\u0642\u0627\u0626\u0642",
    hero_text: "\u062a\u0639\u0631\u0651\u0641\u062a \u0639\u0644\u064a\u0643\u0650 \u0635\u062f\u0641\u0629\u060c \u0648\u0641\u064a \u0648\u0642\u062a \u0642\u0635\u064a\u0631 \u062c\u062f\u064b\u0627 \u0639\u0634\u062a \u0634\u064a\u0626\u064b\u0627 \u0644\u0645 \u0623\u0639\u0634\u0647 \u0641\u064a \u0633\u0646\u0648\u0627\u062a. \u0645\u0646 \u0628\u0627\u0628 \u0641\u0646\u062f\u0642 \u0628\u062f\u0623 \u0627\u0644\u062d\u0644\u0645\u060c \u0648\u0645\u0646 \u0635\u0628\u0627\u062d \u0647\u0627\u062f\u0626 \u0628\u062f\u0623 \u0627\u0644\u063a\u064a\u0627\u0628\u060c \u0648\u0645\u0646 \u0628\u0639\u062f\u0647\u0627 \u0628\u0642\u064a \u0627\u0644\u0623\u062b\u0631 \u064a\u0633\u0643\u0646 \u0643\u0644 \u0634\u064a\u0621.",
    quote_1: "\u0628\u0639\u0636 \u0627\u0644\u0644\u0642\u0627\u0621\u0627\u062a \u0642\u0635\u064a\u0631\u0629 \u0641\u064a \u0627\u0644\u0648\u0642\u062a\u060c \u0644\u0643\u0646\u0647\u0627 \u0637\u0648\u064a\u0644\u0629 \u0641\u064a \u0627\u0644\u0623\u062b\u0631.",
    quote_2: "\u0623\u0646\u0627 \u0628\u064a\u0646 \u062d\u0636\u0646 \u0627\u0644\u0635\u0648\u0631 \u0648\u0641\u0643\u0631\u0629 \u0623\u0646\u0643\u0650 \u0635\u0631\u062a\u0650 \u0630\u0643\u0631\u0649.",
    quote_3: "\u0627\u0644\u0644\u064a\u0644 \u064a\u0637\u0648\u0644 \u0644\u0623\u0646 \u0627\u0644\u0630\u0627\u0643\u0631\u0629 \u0644\u0627 \u062a\u0646\u0627\u0645.",
    quote_4: "\u0628\u0639\u0636 \u0627\u0644\u062d\u0628 \u0644\u0627 \u064a\u0646\u062a\u0647\u064a... \u0628\u0644 \u064a\u062a\u062d\u0648\u0644 \u0625\u0644\u0649 \u0648\u062c\u0639 \u0647\u0627\u062f\u0626.",
    open_story: "\u0627\u0641\u062a\u062d \u0627\u0644\u0642\u0635\u0629",
    read_pain: "\u0627\u0642\u0631\u0623 \u0627\u0644\u0648\u062c\u0639",
    card_moments_title: "\u0645\u0646 \u0627\u0644\u0628\u062f\u0627\u064a\u0629 \u0625\u0644\u0649 \u0627\u0644\u0623\u062b\u0631",
    card_moments_text: "\u0627\u0644\u0628\u0627\u0628\u060c \u0627\u0644\u0635\u0628\u0627\u062d\u060c \u0648\u0627\u0644\u0637\u0631\u064a\u0642 \u0627\u0644\u0630\u064a \u0628\u0642\u064a \u0634\u0627\u0647\u062f\u064b\u0627.",
    card_photos_title: "\u062d\u0636\u0646 \u0627\u0644\u0635\u0648\u0631",
    card_photos_text: "\u0635\u0648\u0631 \u0644\u0627 \u062a\u0639\u064a\u062f \u0645\u0627 \u0645\u0636\u0649\u060c \u0644\u0643\u0646\u0647\u0627 \u062a\u0628\u0642\u064a \u0627\u0644\u0623\u062b\u0631 \u062d\u064a\u064b\u0627.",
    card_songs_title: "\u0623\u063a\u0627\u0646\u064a \u0627\u0644\u0633\u0647\u0631",
    card_songs_text: "\u0627\u0644\u0623\u063a\u0627\u0646\u064a \u0627\u0644\u062a\u064a \u0643\u0627\u0646\u062a \u0644\u0646\u0627\u060c \u0648\u0635\u0627\u0631\u062a \u0627\u0644\u064a\u0648\u0645 \u0644\u064a\u0644\u064b\u0627 \u0637\u0648\u064a\u0644\u064b\u0627.",
    card_writings_title: "\u0627\u0644\u0627\u062e\u062a\u0646\u0627\u0642",
    card_writings_text: "\u0627\u0644\u0643\u0644\u0645\u0627\u062a \u0627\u0644\u062a\u064a \u062e\u0631\u062c\u062a \u0644\u0623\u0646 \u0627\u0644\u0635\u0645\u062a \u0635\u0627\u0631 \u0623\u062b\u0642\u0644 \u0645\u0646 \u0627\u0644\u0627\u062d\u062a\u0645\u0627\u0644.",
    footer_text: "\u0647\u0630\u0627 \u0627\u0644\u0645\u0643\u0627\u0646 \u0644\u064a\u0633 \u0644\u0644\u0627\u0646\u062a\u0642\u0627\u0645\u060c \u0647\u0630\u0627 \u0627\u0644\u0645\u0643\u0627\u0646 \u0644\u0623\u062b\u0631\u064d \u0644\u0645 \u064a\u062c\u062f \u0623\u064a\u0646 \u064a\u0630\u0647\u0628.",
    moments_title: "\u0645\u0646 \u0627\u0644\u0628\u062f\u0627\u064a\u0629 \u0625\u0644\u0649 \u0627\u0644\u0623\u062b\u0631",
    moments_text: "\u0644\u064a\u0633\u062a \u0643\u0644 \u0627\u0644\u0642\u0635\u0635 \u0637\u0648\u064a\u0644\u0629. \u0623\u062d\u064a\u0627\u0646\u064b\u0627 \u062a\u0643\u0641\u064a \u0633\u0627\u0639\u0627\u062a \u0642\u0644\u064a\u0644\u0629 \u062d\u062a\u0649 \u062a\u063a\u064a\u0651\u0631 \u0634\u0643\u0644 \u0627\u0644\u0642\u0644\u0628 \u0628\u0627\u0644\u0643\u0627\u0645\u0644.",
    moment1_time: "20 Aug 2025 \u2022 3:52 AM",
    moment1_title: "\u0642\u0628\u0644 \u0623\u0646 \u062a\u0635\u064a\u0631\u064a \u0648\u0627\u0642\u0639\u064b\u0627",
    moment1_text: "\u0642\u0628\u0644 \u0623\u0646 \u0623\u062f\u062e\u0644 \u0627\u0644\u0641\u0646\u062f\u0642\u060c \u0645\u0627 \u0643\u0646\u062a \u0623\u062a\u062e\u064a\u0651\u0644 \u0623\u0646\u0646\u064a \u0628\u0639\u062f \u062f\u0642\u0627\u0626\u0642 \u0633\u0623\u0631\u0649 \u0623\u062c\u0645\u0644 \u0634\u064a\u0621 \u0645\u0631\u0651 \u0641\u064a \u062d\u064a\u0627\u062a\u064a.",
    moment1_memory: "\u0630\u0644\u0643 \u0627\u0644\u0628\u0627\u0628 \u0644\u0645 \u064a\u0643\u0646 \u0645\u062c\u0631\u062f \u0645\u062f\u062e\u0644\u060c \u0628\u0644 \u0628\u062f\u0627\u064a\u0629 \u0634\u064a\u0621 \u0623\u0643\u0628\u0631 \u0645\u0646 \u0627\u062d\u062a\u0645\u0627\u0644\u064a.",
    moment2_time: "20 Aug 2025 \u2022 8:04 AM",
    moment2_title: "\u0627\u0644\u0635\u0628\u0627\u062d \u0627\u0644\u0630\u064a \u062e\u0631\u062c\u062a\u0650 \u0641\u064a\u0647 \u0648\u0628\u0642\u064a\u062a\u064f \u0623\u0646\u0627",
    moment2_text: "\u0641\u064a \u0627\u0644\u0635\u0628\u0627\u062d\u060c \u0643\u0627\u0646 \u0643\u0644 \u0634\u064a\u0621 \u0643\u0645\u0627 \u0647\u0648... \u0625\u0644\u0627 \u0623\u0646\u0627.",
    moment2_memory: "\u0628\u0642\u064a\u062a \u0639\u0627\u0644\u0642\u064b\u0627 \u0628\u064a\u0646 \u0623\u0631\u0628\u0639 \u0633\u0627\u0639\u0627\u062a \u0648\u0623\u0631\u0628\u0639 \u062f\u0642\u0627\u0626\u0642 \u0648\u0628\u064a\u0646 \u0623\u062b\u0631 \u0644\u0627 \u064a\u0639\u0631\u0641 \u0643\u064a\u0641 \u064a\u0647\u062f\u0623.",
    moment3_time: "\u0644\u064a\u0644\u0629 \u0627\u0644\u0627\u062d\u062a\u0631\u0627\u0642 \u0627\u0644\u062f\u0627\u062e\u0644\u064a",
    moment3_title: "\u0627\u0644\u0637\u0631\u064a\u0642 \u0627\u0644\u0630\u064a \u0635\u0627\u0631 \u0634\u0627\u0647\u062f\u064b\u0627",
    moment3_text: "\u0647\u0630\u0647 \u0627\u0644\u0635\u0648\u0631\u0629 \u0644\u064a\u0633\u062a \u0639\u0646 \u0627\u0644\u0637\u0631\u064a\u0642 \u0641\u0642\u0637\u060c \u0628\u0644 \u0639\u0646 \u0642\u0644\u0628\u064d \u0643\u0627\u0646 \u064a\u0631\u0643\u0636 \u0623\u0633\u0631\u0639 \u0645\u0646 \u0627\u062d\u062a\u0645\u0627\u0644\u0647.",
    moment3_memory: "\u0648\u0645\u0646 \u0628\u0639\u062f\u0647\u0627 \u0641\u0647\u0645\u062a \u0623\u0646 \u0628\u0639\u0636 \u0627\u0644\u0642\u0644\u0648\u0628 \u0644\u0627 \u062a\u062d\u062a\u0627\u062c \u0641\u0642\u0637 \u0625\u0644\u0649 \u0630\u0643\u0631\u0649\u060c \u0628\u0644 \u062a\u062d\u062a\u0627\u062c \u0623\u064a\u0636\u064b\u0627 \u0625\u0644\u0649 \u0646\u062c\u0627\u0629.",
    moment4_time: "\u0627\u0644\u0644\u064a\u0644",
    moment4_title: "\u0648\u0631\u0648\u062f \u0648\u0639\u062a\u0645\u0629",
    moment4_text: "\u0641\u064a \u0645\u0646\u062a\u0635\u0641 \u0627\u0644\u0644\u064a\u0644 \u062c\u0627\u0621\u062a \u0627\u0644\u0648\u0631\u0648\u062f\u060c \u0643\u0623\u0646 \u0627\u0644\u0633\u0645\u0627\u0621 \u0623\u0631\u0633\u0644\u062a \u0644\u0646\u0627 \u0642\u0637\u0639\u0629 \u0631\u0628\u064a\u0639.",
    moment4_memory: "\u0627\u0644\u0648\u0631\u0648\u062f \u0641\u064a \u0627\u0644\u0639\u062a\u0645\u0629 \u0623\u062c\u0645\u0644 \u0631\u0627\u0626\u062d\u0629.",
    moment5_time: "\u0645\u0639\u064b\u0627",
    moment5_title: "\u0641\u0648\u0642 \u0627\u0644\u0643\u0648\u062e \u0627\u0644\u062e\u0634\u0628\u064a",
    moment5_text: "\u0641\u064a \u0627\u0644\u0623\u0639\u0644\u0649\u060c \u0628\u0639\u064a\u062f\u064b\u0627 \u0639\u0646 \u0627\u0644\u062f\u0646\u064a\u0627\u060c \u0643\u0646\u0627 \u0641\u0642\u0637 \u0646\u062d\u0646 \u0627\u0644\u0627\u062b\u0646\u064a\u0646.",
    moment5_memory: "\u0628\u0639\u0636 \u0627\u0644\u0644\u062d\u0638\u0627\u062a \u0644\u0627 \u062a\u0646\u0627\u0641\u0633 \u0627\u0644\u0632\u0645\u0646.",
    moment6_time: "\u0636\u0648\u0621 \u0623\u0632\u0631\u0642",
    moment6_title: "\u0644\u063a\u0629 \u0627\u0644\u0623\u064a\u062f\u064a",
    moment6_text: "\u062a\u062d\u062a \u0627\u0644\u0636\u0648\u0621 \u0627\u0644\u0623\u0632\u0631\u0642 \u062a\u0634\u0627\u0628\u0643\u062a \u0623\u064a\u062f\u064a\u0646\u0627\u060c \u0644\u0645 \u062a\u0643\u0646 \u0627\u0644\u0643\u0644\u0645\u0627\u062a \u0636\u0631\u0648\u0631\u064a\u0629.",
    moment6_memory: "\u0627\u0644\u0642\u0644\u0648\u0628 \u062a\u062a\u0643\u0644\u0645 \u0641\u064a \u0627\u0644\u0623\u064a\u062f\u064a.",
    moment7_time: "\u0628\u0635\u0645\u062a",
    moment7_title: "\u0646\u0638\u0631\u0629 \u0648\u0627\u062d\u062f\u0629 \u0643\u0641\u062a",
    moment7_text: "\u0639\u0646\u062f\u0645\u0627 \u0648\u0642\u0641\u062a\u0650 \u0628\u064a\u0646 \u0627\u0644\u0623\u0636\u0648\u0627\u0621\u060c \u062a\u0648\u0642\u0641 \u0627\u0644\u0639\u0627\u0644\u0645 \u0639\u0646\u062f\u064a.",
    moment7_memory: "\u062a\u0630\u0643\u0651\u0631 \u0627\u0644\u0648\u062c\u0647 \u064a\u0639\u0646\u064a \u062a\u0630\u0643\u0651\u0631 \u0643\u0644 \u0634\u064a\u0621.",
    moment8_time: "\u0639\u0644\u0649 \u0627\u0644\u0631\u0645\u0644",
    moment8_title: "\u0623\u0633\u0645\u0627\u0621 \u0639\u0644\u0649 \u0627\u0644\u0631\u0645\u0644",
    moment8_text: "\u0645\u062d\u0627\u0647\u0627 \u0627\u0644\u0628\u062d\u0631\u060c \u0644\u0643\u0646 \u0627\u0644\u0623\u0633\u0645\u0627\u0621 \u0627\u0644\u062a\u064a \u0643\u062a\u0628\u0646\u0627\u0647\u0627 \u0628\u0642\u064a\u062a \u0641\u064a \u0642\u0644\u0628\u064a.",
    moment8_memory: "\u0628\u0639\u0636 \u0627\u0644\u0622\u062b\u0627\u0631 \u0644\u0627 \u062a\u0628\u0642\u0649 \u0641\u064a \u0627\u0644\u0645\u0627\u0621\u060c \u062a\u0628\u0642\u0649 \u0641\u064a \u0627\u0644\u0631\u0648\u062d.",
    moment9_time: "\u0627\u0644\u0646\u0647\u0627\u064a\u0629",
    moment9_title: "\u0645\u0646 \u0646\u0641\u0633 \u0627\u0644\u0628\u0627\u0628",
    moment9_text: "\u0645\u0646 \u0646\u0641\u0633 \u0627\u0644\u0628\u0627\u0628 \u0627\u0644\u0630\u064a \u0628\u062f\u0623\u0646\u0627 \u0645\u0646\u0647 \u0627\u0641\u062a\u0631\u0642\u0646\u0627. \u0627\u0644\u062d\u0642\u064a\u0628\u0629 \u0639\u0644\u0649 \u0627\u0644\u0643\u062a\u0641\u060c \u0627\u0644\u0641\u0646\u062f\u0642 \u062e\u0644\u0641\u0646\u0627.",
    moment9_memory: "\u0628\u0639\u0636 \u0627\u0644\u0623\u0628\u0648\u0627\u0628 \u0628\u062f\u0627\u064a\u0629 \u0648\u0646\u0647\u0627\u064a\u0629 \u0645\u0639\u064b\u0627.",
    moments_footer: "\u0645\u0646 \u0628\u0627\u0628\u064d \u0639\u0646\u062f \u0627\u0644\u0641\u062c\u0631\u060c \u0625\u0644\u0649 \u0635\u0628\u0627\u062d\u064d \u0639\u0646\u062f \u0627\u0644\u0631\u062d\u064a\u0644\u060c \u0625\u0644\u0649 \u0623\u062b\u0631\u064d \u0628\u0642\u064a \u0628\u0639\u062f \u0643\u0644 \u0634\u064a\u0621.",
    photos_title: "\u062d\u0636\u0646 \u0627\u0644\u0635\u0648\u0631",
    photos_text: "\u0623\u0646\u0627 \u0627\u0644\u0622\u0646 \u0641\u064a \u062d\u0636\u0646 \u0635\u0648\u0631\u0646\u0627\u060c \u0648\u0627\u0644\u0635\u0648\u0631 \u0648\u062d\u062f\u0647\u0627 \u0647\u064a \u0627\u0644\u062a\u064a \u0628\u0642\u064a\u062a \u062a\u0631\u062f\u0651 \u0639\u0644\u064a\u0651 \u0628\u0627\u0644\u0635\u0645\u062a.",
    photo1_text: "\u0639\u0646\u062f\u0645\u0627 \u062f\u062e\u0644\u062a \u0645\u0646 \u0647\u0630\u0627 \u0627\u0644\u0628\u0627\u0628 \u0644\u0645 \u0623\u0643\u0646 \u0623\u0639\u0631\u0641... \u0623\u0646\u0646\u064a \u0633\u0623\u062a\u0631\u0643 \u0642\u0644\u0628\u064a \u062e\u0644\u0641\u064a \u0639\u0646\u062f \u0627\u0644\u062e\u0631\u0648\u062c.",
    photo2_text: "\u0630\u0644\u0643 \u0627\u0644\u0635\u0628\u0627\u062d \u0639\u0646\u062f\u0645\u0627 \u0641\u062a\u062d\u062a \u0639\u064a\u0646\u064a\u0647\u0627 \u0643\u0627\u0646 \u0627\u0644\u0639\u0627\u0644\u0645 \u0644\u0627 \u064a\u0632\u0627\u0644 \u062c\u0645\u064a\u0644\u064b\u0627. \u0639\u0646\u062f\u0645\u0627 \u0623\u063a\u0644\u0642\u062a\u0647\u0627 \u0627\u0646\u062a\u0647\u0649 \u0643\u0644 \u0634\u064a\u0621.",
    photo3_text: "\u0627\u0644\u0645\u0634\u064a \u0648\u062d\u064a\u062f\u064b\u0627 \u0641\u064a \u0627\u0644\u0638\u0644\u0627\u0645... \u0644\u0645 \u064a\u0643\u0646 \u0623\u0634\u062f \u0623\u0644\u0645\u064b\u0627 \u0645\u0646 \u062a\u0630\u0643\u0651\u0631\u0643.",
    photo4_text: "\u062f\u062e\u0644\u0646\u0627 \u0645\u0646 \u0646\u0641\u0633 \u0627\u0644\u0628\u0627\u0628\u060c \u062e\u0631\u062c\u0646\u0627 \u0645\u0646 \u0646\u0641\u0633 \u0627\u0644\u0628\u0627\u0628. \u0644\u0643\u0646 \u0645\u0627 \u062a\u0631\u0643\u0646\u0627\u0647 \u0628\u0627\u0644\u062f\u0627\u062e\u0644 \u0644\u0645 \u064a\u0639\u062f \u0623\u0628\u062f\u064b\u0627.",
    photo5_text: "\u0648\u0636\u0639\u062a \u0627\u0644\u062d\u0642\u064a\u0628\u0629\u060c \u0623\u063a\u0644\u0642\u062a \u0627\u0644\u0628\u0627\u0628. \u0643\u0644 \u0644\u062d\u0638\u0629 \u0639\u0634\u062a\u0647\u0627 \u0645\u0639\u0643 \u062a\u0631\u0643\u062a\u0647\u0627 \u0639\u0644\u0649 \u0630\u0644\u0643 \u0627\u0644\u0645\u0642\u0639\u062f.",
    photo6_text: "\u0644\u0627\u062f\u064a\u0631\u0627... \u0622\u062e\u0631 \u0645\u0643\u0627\u0646 \u0631\u0623\u064a\u062a\u0643 \u0641\u064a\u0647. \u0623\u0636\u0648\u0627\u0624\u0647 \u0644\u0627 \u062a\u0632\u0627\u0644 \u0645\u0636\u064a\u0626\u0629 \u0644\u0643\u0646 \u062f\u0627\u062e\u0644\u0647 \u0623\u0635\u0628\u062d \u0645\u0638\u0644\u0645\u064b\u0627.",
    photo7_text: "\u0633\u0627\u0645\u062d\u062a\u0643\u0650 \u0643\u062b\u064a\u0631\u064b\u0627\u060c \u062d\u062a\u0649 \u0635\u0631\u062a\u064f \u0623\u0646\u0627 \u0627\u0644\u0645\u0630\u0646\u0628 \u0627\u0644\u0648\u062d\u064a\u062f \u0641\u064a \u062d\u0642 \u0642\u0644\u0628\u064a.",
    photo7_sub: "\u0647\u0646\u0627 \u0643\u0646\u062a\u064f \u0623\u0628\u0631\u0631 \u0644\u0643\u0650 \u0643\u0644 \u0634\u064a\u0621\u060c\\n\u062d\u062a\u0649 \u0627\u0644\u0623\u0634\u064a\u0627\u0621 \u0627\u0644\u062a\u064a \u0643\u0627\u0646\u062a \u062a\u0642\u062a\u0644\u0646\u064a.",
    photos_footer: "\u0627\u0644\u0635\u0648\u0631 \u0644\u0627 \u062a\u0639\u064a\u062f \u0645\u0627 \u0645\u0636\u0649\u060c \u0644\u0643\u0646\u0647\u0627 \u062a\u0628\u0642\u064a \u0623\u062b\u0631\u0647 \u062d\u064a\u064b\u0627.",
    songs_title: "\u0623\u063a\u0627\u0646\u064a \u0627\u0644\u0633\u0647\u0631",
    songs_text: "\u0627\u0644\u0623\u063a\u0627\u0646\u064a \u0627\u0644\u062a\u064a \u0643\u0627\u0646\u062a \u062f\u0641\u0626\u064b\u0627\u060c \u0635\u0627\u0631\u062a \u0627\u0644\u0622\u0646 \u0644\u064a\u0644\u064b\u0627 \u0637\u0648\u064a\u0644\u064b\u0627 \u0645\u0641\u062a\u0648\u062d\u064b\u0627 \u0639\u0644\u0649 \u0627\u0644\u0630\u0643\u0631\u0649.",
    song1_title: "\u0623\u063a\u0646\u064a\u0629 1",
    song1_text: "\u0643\u0644\u0645\u0627 \u0627\u0634\u062a\u063a\u0644\u062a\u060c \u0639\u0627\u062f \u0627\u0644\u0648\u062c\u0639 \u0645\u0646 \u0623\u0648\u0644\u0647.",
    song2_title: "\u0623\u063a\u0646\u064a\u0629 2",
    song2_text: "\u0647\u0630\u0647 \u0644\u064a\u0633\u062a \u0623\u063a\u0646\u064a\u0629 \u0641\u0642\u0637\u060c \u0647\u0630\u0647 \u0646\u0627\u0641\u0630\u0629 \u062a\u064f\u0641\u062a\u062d \u0639\u0644\u0649 \u0644\u064a\u0644\u064d \u0644\u0645 \u064a\u0643\u062a\u0645\u0644 \u0646\u0648\u0645\u0647.",
    song3_title: "\u0645\u0631\u0648\u0631 - \u062d\u0627\u0645\u064a\u0645",
    song3_text: "\u0627\u0644\u0645\u0627\u0636\u064a \u064a\u0639\u0648\u062f \u0641\u064a \u0623\u063a\u0646\u064a\u0629 \u0648\u0627\u062d\u062f\u0629.",
    song4_title: "I Was Never There - The Weeknd",
    song4_text: "\u0643\u0623\u0646\u0646\u064a \u0644\u0645 \u0623\u0643\u0646 \u0647\u0646\u0627\u0643 \u0623\u0628\u062f\u064b\u0627... \u0644\u0643\u0646 \u0623\u062b\u0631\u064a \u0641\u064a \u0643\u0644 \u0645\u0643\u0627\u0646.",
    songs_footer: "\u0628\u0639\u0636 \u0627\u0644\u0623\u063a\u0627\u0646\u064a \u0644\u0627 \u062a\u064f\u0633\u0645\u0639 \u0628\u0627\u0644\u0623\u0630\u0646 \u0641\u0642\u0637\u060c \u0628\u0644 \u0628\u0627\u0644\u0642\u0644\u0628 \u0623\u064a\u0636\u064b\u0627.",
    videos_title: "\u0627\u0644\u0641\u064a\u062f\u064a\u0648",
    videos_text: "\u0644\u0642\u0637\u0627\u062a \u0642\u0635\u064a\u0631\u0629\u060c \u0644\u0643\u0646 \u0623\u062b\u0631\u0647\u0627 \u0623\u0637\u0648\u0644 \u0645\u0646 \u0627\u0644\u0648\u0642\u062a \u0646\u0641\u0633\u0647.",
    video_memory_label: "\u0630\u0643\u0631\u0649",
    video1_title: "\u0641\u064a\u062f\u064a\u0648 1",
    video1_text: "\u0628\u0639\u0636 \u0627\u0644\u0644\u062d\u0638\u0627\u062a \u062a\u0646\u062a\u0647\u064a \u062f\u0627\u062e\u0644 \u0627\u0644\u0641\u064a\u062f\u064a\u0648\u060c \u0644\u0643\u0646\u0647\u0627 \u0644\u0627 \u062a\u0646\u062a\u0647\u064a \u062f\u0627\u062e\u0644 \u0627\u0644\u0642\u0644\u0628.",
    video2_title: "\u0641\u064a\u062f\u064a\u0648 2",
    video2_text: "\u0627\u0644\u0644\u0642\u0637\u0629 \u0642\u0635\u064a\u0631\u0629\u060c \u0644\u0643\u0646 \u0628\u0639\u062f\u0647\u0627 \u064a\u0638\u0644\u0651 \u0623\u0637\u0648\u0644 \u0645\u0646 \u0627\u0644\u0642\u062f\u0631\u0629 \u0639\u0644\u0649 \u0627\u0644\u0646\u0633\u064a\u0627\u0646.",
    videos_footer: "\u0628\u0639\u0636 \u0627\u0644\u0641\u064a\u062f\u064a\u0648\u0647\u0627\u062a \u0644\u0627 \u062a\u062d\u0641\u0638 \u0627\u0644\u0648\u0642\u062a \u0641\u0642\u0637\u060c \u0628\u0644 \u062a\u062d\u0641\u0638 \u0627\u0644\u0648\u062c\u0639 \u0623\u064a\u0636\u064b\u0627.",
    writings_title: "\u0627\u0644\u0627\u062e\u062a\u0646\u0627\u0642",
    writings_text: "\u0627\u0644\u0643\u0644\u0627\u0645 \u0627\u0644\u0630\u064a \u062e\u0631\u062c \u0644\u0623\u0646 \u0627\u0644\u0635\u0645\u062a \u0635\u0627\u0631 \u0623\u062b\u0642\u0644 \u0645\u0646 \u0627\u0644\u0627\u062d\u062a\u0645\u0627\u0644.",
    writings_footer: "\u0623\u0634\u062a\u0627\u0642\u060c \u0623\u062a\u0623\u0644\u0645\u060c \u0648\u0623\u0643\u062a\u0628... \u0644\u0623\u0646 \u0647\u0630\u0627 \u0643\u0644 \u0645\u0627 \u0628\u0642\u064a \u0644\u064a \u0645\u0646 \u0627\u0644\u0623\u062b\u0631.",
    typed_1: "\u0623\u0631\u0628\u0639 \u0633\u0627\u0639\u0627\u062a \u0648\u0623\u0631\u0628\u0639 \u062f\u0642\u0627\u0626\u0642...",
    typed_2: "\u0623\u062b\u0631 \u0644\u0627 \u064a\u0646\u0637\u0641\u0626...",
    typed_3: "\u0643\u0644 \u0644\u063a\u0632 \u064a\u0646\u062a\u0638\u0631 \u0627\u0643\u062a\u0645\u0627\u0644 \u0648\u0642\u062a\u0647...",
    typed_4: "\u0648\u0628\u0639\u062f \u0627\u0644\u0639\u062f... \u064a\u0628\u062f\u0623 \u0627\u0644\u0643\u0644\u0627\u0645...",
    countdown_label: "\u0627\u0644\u0648\u0642\u062a \u0627\u0644\u0645\u062a\u0628\u0642\u064a: ",
    countdown_day: "\u064a\u0648\u0645",
    countdown_hour: "\u0633\u0627\u0639\u0629",
    countdown_minute: "\u062f\u0642\u064a\u0642\u0629",
    countdown_second: "\u062b\u0627\u0646\u064a\u0629",
    riddle_prompt: "\u062d\u0644\u0651 \u0627\u0644\u0633\u0624\u0627\u0644",
    riddle_ashkim: "\u0627\u0644\u0634\u064a\u0621 \u064a\u0644\u064a \u062f\u0627\u064a\u0645\u0627 \u0643\u0646\u062a \u062a\u0646\u062f\u0647\u0646\u064a \u0628\u064a\u0647",
    riddle_nafasim: "\u062f\u0627\u064a\u0645\u0627 \u0627\u0642\u0648\u0644 \u0634\u0643\u062f \u062d\u0644\u0648 \u062a\u062d\u0643\u064a\u0646 \u0647\u0644 \u0643\u0644\u0645\u0629",
    riddle_kaar: "\u0635\u062f\u0642 \u0647\u0627\u062f \u0627\u0644\u0643\u0644\u0645\u0629 \u062a\u0633\u062a\u0627\u0647\u0644\u064a\u0647\u0627 \u0645\u0639 \u0627\u0644\u0627\u0633\u0641",
    riddle_asgoori: "\u0627\u0644\u0643\u0644\u0645\u0629 \u064a\u0644\u064a \u062f\u0627\u064a\u0645\u0627 \u064a\u0637\u0644\u0639 \u0645\u0646 \u0627\u0639\u0645\u0627\u0642\u064a \u0648\u064a\u0644\u064a \u0645\u0627\u0643\u0646\u062a\u064a \u062a\u0635\u062f\u0642\u064a\u0646\u0647\u0627 \u0641\u0643\u0631\u0643 \u0645\u062c\u0631\u062f \u0643\u0644\u0627\u0645",
    riddle_lucifer: "\u0639\u0646\u062f\u0645\u0627 \u0644\u0627\u0642\u064a \u062d\u0644\u0648\u0644 \u0628\u0633\u0647\u0648\u0644\u0629 \u062a\u0646\u0635\u062f\u0645\u064a\u0646 \u0648 \u062a\u0642\u0648\u0644\u064a \u0647\u0644 \u0643\u0644\u0645\u0629",
    riddle_echska: "\u064a\u0644\u064a \u0643\u0627\u0646 \u0645\u0641\u0631\u0648\u0636 \u064a\u0638\u0644\u0648\u0646 \u0637\u0648\u0644 \u0627\u0644\u0639\u0645\u0631",
    photos_header_sub: "\u0643\u0644 \u0635\u0648\u0631\u0629 \u0647\u0646\u0627 \u062a\u062d\u0645\u0644 \u0646\u0628\u0636\u0629\u060c \u0648\u0643\u0644 \u0646\u0628\u0636\u0629 \u062a\u062d\u0645\u0644 \u0623\u062b\u0631\u064b\u0627 \u0644\u0627 \u064a\u0647\u062f\u0623.",
    photos_fallback_caption: "\u0630\u0643\u0631\u0649 \u0635\u0627\u0645\u062a\u0629\u2026 \u0644\u0643\u0646\u0647\u0627 \u0644\u0627 \u062a\u064f\u0646\u0633\u0649.",
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
    nav_stats: "Stats",
    stats_title: "Statistics",
    stats_text: "See how often you've come here, and which memories you've watched.",
    stats_total_time: "Total time",
    stats_session_count: "Sessions",
    stats_first_open: "First opened",
    stats_last_open: "Last opened",
    stats_total_plays: "Total plays",
    stats_unique_videos: "Videos watched",
    stats_never_played: "Never played",
    stats_most_played: "Most played",
    stats_sessions_heading: "Sessions",
    stats_videos_heading: "Videos",
    stats_session_open: "Opened",
    stats_session_close: "Closed",
    stats_session_duration: "Duration",
    stats_session_active: "Active",
    stats_play_count: "Plays",
    stats_last_played: "Last played",
    stats_never: "Never",
    stats_no_data: "No data yet.",
    stats_reset: "Reset stats",
    stats_reset_confirm: "Delete all statistics?",
    stats_footer: "These numbers are not just numbers; in each one a quiet glance is hidden.",
    login_title: "Nafsam",
    login_text: "This place stays closed until the countdown is complete. Every name waits for its time. After the end, there is no more counting... only words remain.",
    login_input: "Type the answer",
    login_button: "Open What Remains",
    login_hint: "The page will not open before the time ends. After that, only the correct answers can open it.",
    login_msg_closed: "The page is still locked until the countdown ends",
    login_msg_wrong: "Wrong answer",
    login_msg_success: "Opening page...",
    hero_eyebrow: "NAFSAM \u2022 20 AUG 2025 \u2022 04:04 AM",
    hero_title: "Four Hours and Four Minutes",
    hero_text: "I met you by chance, and in a very short time I lived something I had never lived in years. At a hotel door the dream began, in a quiet morning the absence began, and after that the trace stayed in everything.",
    quote_1: "Some meetings are short in time, but long in impact.",
    quote_2: "I am between the embrace of photos and the thought that you became a memory.",
    quote_3: "The night grows longer because memory does not sleep.",
    quote_4: "Some love does not end... it only turns into a quiet pain.",
    open_story: "Open the Story",
    read_pain: "Read the Pain",
    card_moments_title: "From Beginning to Trace",
    card_moments_text: "The door, the morning, and the road that witnessed the inner chaos.",
    card_photos_title: "Embrace of Photos",
    card_photos_text: "Photos do not bring back the past, but they keep the trace alive.",
    card_songs_title: "Night Songs",
    card_songs_text: "The songs that were once ours became a long night.",
    card_writings_title: "Suffocation",
    card_writings_text: "Words that came out when silence became too heavy.",
    footer_text: "This place is not for revenge. It is for a trace that found nowhere to go.",
    moments_title: "From Beginning to Trace",
    moments_text: "Not every story needs to be long. Sometimes a few hours are enough to change the shape of a heart completely.",
    moment1_time: "20 Aug 2025 \u2022 3:52 AM",
    moment1_title: "Before You Became Real",
    moment1_text: "Before I entered the hotel, I did not know that in a few minutes I would see the most beautiful thing in my life.",
    moment1_memory: "That door was not just an entrance; it was the beginning of something bigger than my endurance.",
    moment2_time: "20 Aug 2025 \u2022 8:04 AM",
    moment2_title: "The Morning You Left and I Stayed",
    moment2_text: "In the morning, everything was the same... except me.",
    moment2_memory: "I remained suspended between four hours and four minutes and a trace that would not calm down.",
    moment3_time: "Night of Inner Burning",
    moment3_title: "The Road That Became a Witness",
    moment3_text: "This image is not only about the road; it is about a heart running faster than it could bear.",
    moment3_memory: "Then I understood that some hearts need not only memory, but also survival.",
    moment4_time: "Night",
    moment4_title: "Flowers and Darkness",
    moment4_text: "In the middle of the night the flowers came; as if the sky sent us a piece of spring.",
    moment4_memory: "Even roses smell sweeter in the dark.",
    moment5_time: "Together",
    moment5_title: "Above the Tree House",
    moment5_text: "High up, far from the world, it was just the two of us.",
    moment5_memory: "Some moments do not race against time.",
    moment6_time: "Blue Light",
    moment6_title: "The Language of Hands",
    moment6_text: "Under the blue light our hands held each other; words were not needed.",
    moment6_memory: "Hearts speak through hands.",
    moment7_time: "Silently",
    moment7_title: "One Look Was Enough",
    moment7_text: "When you stood among the lights, the world stopped for me.",
    moment7_memory: "Remembering your face is remembering everything.",
    moment8_time: "On the Sand",
    moment8_title: "Names Written in Sand",
    moment8_text: "Even though the sea erased them, the names we wrote in the sand stayed in my heart.",
    moment8_memory: "Some traces remain not in water, but in the soul.",
    moment9_time: "The End",
    moment9_title: "From the Same Door",
    moment9_text: "We left through the door we came from. Bag on shoulder, the hotel behind us.",
    moment9_memory: "Some doors are both a beginning and an end.",
    moments_footer: "From a door at dawn, to a morning of leaving, to a trace that remained.",
    photos_title: "Embrace of Photos",
    photos_text: "Now I am in the embrace of our photos, and only silence answers me.",
    photo1_text: "When I walked through this door, I didn't know... I would leave my heart inside when I left.",
    photo2_text: "That morning when she opened her eyes, the world was still beautiful. When she closed them, everything ended.",
    photo3_text: "Walking alone in the dark... was not more painful than remembering you.",
    photo4_text: "We entered from the same door, we left from the same door. But what we left inside never came back.",
    photo5_text: "I put the bag down, closed the door. Every moment I lived with you, I left on that seat.",
    photo6_text: "Ladera... the last place I saw you. Its lights are still on, but inside it is dark now.",
    photo7_text: "I forgave you so much... until I became the only one guilty against my own heart.",
    photo7_sub: "Here I was justifying everything for you,\neven the things that were killing me.",
    photos_footer: "Photos do not bring back what has passed, but they keep its trace alive.",
    songs_title: "Night Songs",
    songs_text: "The songs that were once warmth have now become a long night open to memory.",
    song1_title: "Song 1",
    song1_text: "Whenever it plays, the pain returns from the beginning.",
    song2_title: "Song 2",
    song2_text: "This is not just a song; it is a window opening onto a sleepless night.",
    song3_title: "Moroor - Haamim",
    song3_text: "The past returns in a single song.",
    song4_title: "I Was Never There - The Weeknd",
    song4_text: "As if I was never there... but my trace is everywhere.",
    songs_footer: "Some songs are not heard only with the ear, but with the heart too.",
    videos_title: "Videos",
    videos_text: "Short scenes, but their impact lasts longer than time itself.",
    video_memory_label: "Memory",
    video1_title: "Video 1",
    video1_text: "Some moments end in the video, but they do not end in the heart.",
    video2_title: "Video 2",
    video2_text: "The scene is short, but its effect lasts longer than the ability to forget.",
    videos_footer: "Some videos preserve not only time, but pain too.",
    writings_title: "Suffocation",
    writings_text: "Words that came out because silence became heavier than endurance.",
    writings_footer: "I miss, I ache, and I write... because this is all that remains of the trace.",
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
    riddle_ashkim: "The thing she always used to call you",
    riddle_nafasim: "I always said this word sounded so beautiful from you",
    riddle_kaar: "Sadly, this word suited you",
    riddle_asgoori: "The word that came from my deepest self and you thought was just talk",
    riddle_lucifer: "When I found solutions easily, you would be shocked and say this word",
    riddle_echska: "What was supposed to remain forever",
    photos_header_sub: "Every photo here carries a heartbeat, and every heartbeat carries a trace that never fades.",
    photos_fallback_caption: "A silent memory\u2026 but unforgettable.",
  },
};
