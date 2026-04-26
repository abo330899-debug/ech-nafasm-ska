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
  song1_title: string;
  song2_title: string;
  song3_title: string;
  song4_title: string;
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
  riddle_ashkim: string;
  riddle_nafasim: string;
  riddle_kaar: string;
  riddle_asgoori: string;
  riddle_lucifer: string;
  riddle_echska: string;
  photos_fallback_caption: string;
  farewell_title: string;
  farewell_p1: string;
  farewell_p2: string;
  farewell_p3: string;
  farewell_p4: string;
  farewell_silver_anchor: string;
  farewell_memory_pattern: string;
  oblivion_name: string;
  oblivion_hint: string;
  oblivion_revealed: string;
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
    song1_title: "Şarkı 1",
    song2_title: "Şarkı 2",
    song3_title: "Moroor - Haamim",
    song4_title: "I Was Never There - The Weeknd",
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
    riddle_ashkim: "Sana hep seslendiği şey",
    riddle_nafasim: "Bu kelimeyi söyleyişini hep çok güzel bulurdum",
    riddle_kaar: "Ne yazık ki bu kelime sana yakışıyordu",
    riddle_asgoori: "İçimden gelen ve senin sadece söz sandığın kelime",
    riddle_lucifer: "Kolay çözüm bulunca şaşırıp bana dediğin kelime",
    riddle_echska: "Ömür boyu kalmaları gereken şey",
    photos_fallback_caption: "Sessiz bir anı… ama unutulmaz.",
    farewell_title: "Ruhun yarısından... kaybolan yarısına.",
    farewell_p1: "İlham.. Çok iyi biliyorsun ki dünyayı dolaştın ve her şeyi denedin, sonra beni seçtin; çünkü bende bir kadının erkekten beklediği şeyi buldun: erkeklik, kıskançlık, onur ve içten bir cömertlik. Sana hem zekiydim, hem şeytandım, hem de kollarına sığınan o çocuktum; ruhuna ruh oldum. Sanki tek bir ruhun iki bedeniydik (Sittar ve İlham).",
    farewell_p2: "Sadıkların güveniyle söylüyorum: Hayatının geri kalanını başkalarının yüzlerinde benim gölgemi arayarak geçireceksin; kokumu, çılgınlığımı ve tarzımı özleyeceksin... ve bulamayacaksın. Anlayacaksın ki kadınlığın ancak benimle çiçek açtı, bir kadın olarak varlığını ancak benimle hissettin; ne kadar denenirse denensin, o duygu yalnızca benim hatıralarımda kalacak.",
    farewell_p3: "Bana gelince... bana hep 'çok zekisin' dediğin için, zekâm bana asla senin gibisini bulamayacağımı söylüyor; başka bir kadın senin bir tel saçının yerini bile alamaz. Bu yüzden başka bir bedende 'İlham' aramanın yorgunluğundan kendime acıyacağım. Bugün Havva soyundan çekildiğimi ilan ediyorum; bu sayfada hapsedilen hatıralar bana yeter.",
    farewell_p4: "Kendine iyi bak küçük kızım... Özlem beni ağarttı, onur beni özgürleştirdi.",
    farewell_silver_anchor: "Özlem",
    farewell_memory_pattern: "hatıra",
    oblivion_name: "İlham",
    oblivion_hint: "Son silinmeden önceki anlar...",
    oblivion_revealed: "Maskeler düştü... ve ruhumu zindanından özgür kıldım.",
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
    song1_title: "آهنگ 1",
    song2_title: "آهنگ 2",
    song3_title: "مرور - حامیم",
    song4_title: "I Was Never There - The Weeknd",
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
    riddle_ashkim: "چیزی که همیشه با آن صدایم می‌زدی",
    riddle_nafasim: "همیشه می‌گفتم چقدر گفتن این کلمه از زبانت زیباست",
    riddle_kaar: "متأسفانه این کلمه برازنده‌ات بود",
    riddle_asgoori: "کلمه‌ای که از اعماقم بیرون می‌آمد و تو فکر می‌کردی فقط حرف است",
    riddle_lucifer: "وقتی راه‌حل را راحت پیدا می‌کردم، با تعجب این را می‌گفتی",
    riddle_echska: "چیزی که قرار بود تا آخر عمر بماند",
    photos_fallback_caption: "خاطره‌ای ساکت… اما فراموش‌نشدنی.",
    farewell_title: "از نیمِ روح... به نیمهٔ گم‌شده‌اش.",
    farewell_p1: "الهام.. خوب می‌دانی که دنیا را گشتی و همه چیز را تجربه کردی، سپس مرا انتخاب کردی چون آنچه را که زن از مرد می‌خواهد در من یافتی: مردانگی، غیرت، کرامت و سخاوتی صادقانه. برایت هم باهوش بودم، هم شیطان، و هم آن کودکی که در آغوشت پناه می‌گرفت؛ روحی برای روحت بودم. گویی دو جسد بودیم برای یک روح (ستار و الهام).",
    farewell_p2: "با اطمینان وفاداران به تو می‌گویم: بقیهٔ عمرت را خواهی گذراند تا سایهٔ مرا در چهرهٔ دیگران بجویی؛ دلت برای بویم، دیوانگی‌ام و سبکم تنگ خواهد شد... و نخواهی یافت. خواهی فهمید که زنانگی‌ات تنها با من شکفت و تنها با من بودی که خود را به‌عنوان یک زن حس کردی؛ هر چه دیگران بکوشند یا تو امتحان کنی، آن احساس تنها در خاطرات من باقی خواهد ماند.",
    farewell_p3: "اما من... و چون همیشه می‌گفتی من 'بسیار باهوش'ام، هوشم به من می‌گوید هرگز کسی مثل تو نخواهم یافت و هیچ زنی جای حتی یک تار موی تو را نخواهد گرفت. پس خود را از رنج جستن 'الهام' در تنی دیگر رها می‌کنم. امروز کناره‌گیری‌ام را از جنس حوا اعلام می‌کنم؛ خاطرات حبس‌شده در این صفحه برایم کافی‌ست.",
    farewell_p4: "مراقب خودت باش دختر کوچکم... اشتیاق مرا پیر کرد، و کرامت مرا آزاد کرد.",
    farewell_silver_anchor: "اشتیاق",
    farewell_memory_pattern: "خاطرات|خاطراتم",
    oblivion_name: "الهام",
    oblivion_hint: "لحظاتی پیش از محو نهایی...",
    oblivion_revealed: "نقاب‌ها افتاد... و روحم را از زندانت آزاد کردم.",
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
    song1_title: "أغنية 1",
    song2_title: "أغنية 2",
    song3_title: "مرور - حاميم",
    song4_title: "I Was Never There - The Weeknd",
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
    riddle_ashkim: "الشيء يلي دايما كنت تندهني بيه",
    riddle_nafasim: "دايما اقول شكد حلو تحكين هل كلمة",
    riddle_kaar: "صدق هاد الكلمة تستاهليها مع الاسف",
    riddle_asgoori: "الكلمة يلي دايما يطلع من اعماقي ويلي ماكنتي تصدقينها فكرك مجرد كلام",
    riddle_lucifer: "عندما لاقي حلول بسهولة تنصدمين و تقولي هل كلمة",
    riddle_echska: "يلي كان مفروض يظلون طول العمر",
    photos_fallback_caption: "ذكرى صامتة… لكنها لا تُنسى.",
    farewell_title: "من نِصفِ الروح.. إلى نِصفِها الضائع.",
    farewell_p1: "إلهام.. تعلمين جيداً أنكِ طفتِ العالم وجربتِ كل شيء، ثم اخترتِني لأنكِ وجدتِ فيّ ما تطلبه الأنثى من رجولةٍ، غيرةٍ، كرامةٍ، وسخاءٍ في عطاءٍ صادق. كنتُ لكِ الذكي، والشيطان، والطفل الذي يحتمي بذراعكِ، كنتُ روحاً لروحكِ. كأننا كنا جسدين لروحٍ واحدة (ستار وإلهام).",
    farewell_p2: "أقولها لكِ بثقة الأوفياء: ستقضين بقية حياتكِ تبحثين عن ظلي في وجوه الآخرين، ستشتاقين لريحتي، لجنوني، ولأسلوبي.. ولن تجدي. ستدركين أن أنوثتكِ لم تزهر ولم تشعري بكيانكِ كامرأة إلا معي، ومهما حاولوا أو جربتِ، سيبقى ذلك الشعور محصوراً في ذكرياتي أنا.",
    farewell_p3: "أما أنا.. وبما أنكِ كنتِ تقولين دائماً أنني 'كثير الذكاء'، فذكائي يخبرني أنني لن أجد مِثلكِ أبداً، ولن تأخذ امرأةٌ أخرى مكان شعرةٍ منكِ. لذا، سأرحم نفسي من عناء البحث عن 'إلهام' في جسدٍ آخر. أعلنُ اليوم اعتزالي لجنس حواء؛ تكفيني الذكريات المحبوسة في هذه الصفحة.",
    farewell_p4: "انتبهي على نفسكِ يا ابنتي الصغيرة.. الشوقُ شَيّبني، والكرامةُ حَرّرتني.",
    farewell_silver_anchor: "الشوقُ",
    farewell_memory_pattern: "الذكريات|ذكرياتي",
    oblivion_name: "إلهام",
    oblivion_hint: "لحظات قبل المحو الأخير…",
    oblivion_revealed: "سَقَطَت الأقنعة.. فحررتُ روحي من سجنكِ",
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
    song1_title: "Song 1",
    song2_title: "Song 2",
    song3_title: "Moroor - Haamim",
    song4_title: "I Was Never There - The Weeknd",
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
    riddle_ashkim: "The thing she always used to call you",
    riddle_nafasim: "I always said this word sounded so beautiful from you",
    riddle_kaar: "Sadly, this word suited you",
    riddle_asgoori: "The word that came from my deepest self and you thought was just talk",
    riddle_lucifer: "When I found solutions easily, you would be shocked and say this word",
    riddle_echska: "What was supposed to remain forever",
    photos_fallback_caption: "A silent memory… but unforgettable.",
    farewell_title: "From half of the soul... to its lost half.",
    farewell_p1: "Ilham... You know well that you wandered the world and tried everything, then you chose me — because in me you found what a woman asks of a man: manhood, jealousy, dignity, and a sincere generosity in giving. To you I was the clever one, the devil, and the child who took shelter in your arms; I was a soul for your soul. As if we were two bodies for a single soul (Sittar and Ilham).",
    farewell_p2: "I say it to you with the certainty of the faithful: you will spend the rest of your life searching for my shadow in the faces of others; you will long for my scent, my madness, my way... and you will not find it. You will realize that your femininity bloomed only with me, that you felt your being as a woman only with me; however much they try, or you try, that feeling will remain locked inside my own memories.",
    farewell_p3: "As for me... since you always said I am 'too clever', my cleverness tells me I will never find one like you, that no other woman could take the place of a single hair of yours. So I will spare myself the agony of seeking 'Ilham' in another body. Today I declare my retirement from the gender of Eve; the memories captured on this page are enough for me.",
    farewell_p4: "Take care of yourself, my little girl... Longing has whitened my hair, and dignity has set me free.",
    farewell_silver_anchor: "Longing",
    farewell_memory_pattern: "memories|memory",
    oblivion_name: "Ilham",
    oblivion_hint: "Moments before the final erasure...",
    oblivion_revealed: "The masks have fallen... and I have freed my soul from your prison.",
  },
};
