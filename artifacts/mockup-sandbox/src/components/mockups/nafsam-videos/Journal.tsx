import React, { useState } from 'react';
import { Play, PlayCircle, BookOpen, Clock, Heart } from 'lucide-react';
import './journal.css';

export function Journal() {
  const [playingVideo, setPlayingVideo] = useState<number | null>(null);

  const memories = [
    {
      id: 1,
      quote: "أول مساء لنا قرب البحر، حين صمتت كل الأشياء إلا صوتك",
      caption: "شاطئ الإسكندرية - صيف ٢٠٢٢",
      image: "/__mockup/images/nafsam-videos/mem1.png",
      date: "١٢ يوليو ٢٠٢٢"
    },
    {
      id: 2,
      quote: "ضحكتك التي تشبه المطر في أول أيام الخريف",
      caption: "مقهى وسط البلد",
      image: "/__mockup/images/nafsam-videos/mem2.png",
      date: "٤ أكتوبر ٢٠٢٢"
    },
    {
      id: 3,
      quote: "حين ضللنا الطريق، ووجدنا أنفسنا في أزقة لم نرها من قبل",
      caption: "رحلة البحث عن الذات",
      image: "/__mockup/images/nafsam-videos/mem3.png",
      date: "٢١ نوفمبر ٢٠٢٢"
    },
    {
      id: 4,
      quote: "أضواء المدينة تنعكس على ملامحك لتصنع لوحة لا تُنسى",
      caption: "مساء القاهرة",
      image: "/__mockup/images/nafsam-videos/mem4.png",
      date: "١٥ يناير ٢٠٢٣"
    },
    {
      id: 5,
      quote: "عناق الأيدي في ليلة شتاء قارس، كأنه الدفء الوحيد في العالم",
      caption: "شتاء دافئ",
      image: "/__mockup/images/nafsam-videos/mem5.png",
      date: "٨ فبراير ٢٠٢٣"
    },
    {
      id: 6,
      quote: "نظرتك الهادئة بينما كنت تقرأين ذلك الكتاب القديم",
      caption: "لحظات هدوء",
      image: "/__mockup/images/nafsam-videos/mem6.png",
      date: "٢٢ مارس ٢٠٢٣"
    },
    {
      id: 7,
      quote: "خطواتنا الأولى معاً في ذلك الدرب الطويل",
      caption: "بداية الرحلة",
      image: "/__mockup/images/nafsam-videos/mem1.png",
      date: "٥ مايو ٢٠٢٣"
    },
    {
      id: 8,
      quote: "كيف يمكن للحظة عابرة أن تسكن الذاكرة للأبد؟",
      caption: "ذكرى عابرة",
      image: "/__mockup/images/nafsam-videos/mem2.png",
      date: "١٩ يونيو ٢٠٢٣"
    }
  ];

  return (
    <div className="nafsam-journal-wrapper pb-24">
      {/* Header Section */}
      <header className="relative pt-16 pb-12 px-6">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <BookOpen className="w-8 h-8 text-[#d8a57c] opacity-80" />
          <h1 className="text-4xl font-semibold tracking-wide text-white">الفيديوهات</h1>
          <p className="text-[#d8a57c] nafsam-journal-quote text-2xl opacity-90 max-w-[280px]">
            صفحات من كتاب الذاكرة، تُقرأ بالعين وتُحفظ بالقلب
          </p>
          <div className="glass-panel px-4 py-1.5 rounded-full mt-2 inline-flex items-center gap-2">
            <Heart className="w-3.5 h-3.5 text-[#d8a57c] fill-[#d8a57c]/20" />
            <span className="text-sm font-medium tracking-wider text-[#d8a57c] opacity-90">٢٤٥ ذكرى موثقة</span>
          </div>
        </div>
      </header>

      {/* Featured / Spotlight Video */}
      <section className="px-5 mb-16">
        <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-[#d8a57c]/20 group">
          <img 
            src="/__mockup/images/nafsam-videos/hero.png" 
            alt="Spotlight memory" 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#030408] via-[#030408]/40 to-transparent mix-blend-multiply" />
          <div className="absolute inset-0 bg-black/30" />
          
          <button className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-md border border-[#d8a57c]/50 flex items-center justify-center transition-transform hover:scale-110">
              <Play className="w-6 h-6 text-[#d8a57c] ml-1 fill-[#d8a57c]" />
            </div>
          </button>
          
          <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[#030408] to-transparent">
            <div className="flex items-center gap-2 mb-2 opacity-80">
              <Clock className="w-3 h-3 text-[#d8a57c]" />
              <span className="text-xs text-[#d8a57c]">الذكرى الأبرز</span>
            </div>
            <h2 className="nafsam-journal-quote text-2xl text-white mb-1">تلك الليلة التي بدأ فيها كل شيء</h2>
            <p className="text-sm text-gray-400 opacity-80">لحظات لا تنسى - القاهرة ٢٠٢١</p>
          </div>
        </div>
      </section>

      {/* Timeline Layout */}
      <section className="relative px-6 pr-14 min-h-screen">
        <div className="timeline-line"></div>
        
        <div className="flex flex-col space-y-16">
          {memories.map((memory, index) => (
            <div key={memory.id} className="relative group">
              <div className="timeline-dot transition-all duration-500 group-hover:bg-white group-hover:shadow-[0_0_15px_rgba(255,255,255,0.8)]"></div>
              
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between opacity-60 mb-1">
                  <span className="text-xs tracking-wider text-[#d8a57c] uppercase">الذكرى {memory.id.toLocaleString('ar-EG')}</span>
                  <span className="text-xs text-gray-500">{memory.date}</span>
                </div>
                
                <h3 className="nafsam-journal-quote text-[1.4rem] leading-relaxed text-gray-200">
                  "{memory.quote}"
                </h3>
                
                <div className="flex gap-4 items-start mt-2">
                  <div className="relative w-28 aspect-[3/4] rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-white/10 shadow-lg">
                    <img 
                      src={memory.image} 
                      alt={`Memory ${memory.id}`} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20" />
                    <button 
                      onClick={() => setPlayingVideo(memory.id)}
                      className="absolute inset-0 flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity"
                    >
                      <PlayCircle className="w-8 h-8 text-[#d8a57c] bg-black/40 rounded-full" />
                    </button>
                  </div>
                  
                  <div className="flex flex-col justify-center pt-2">
                    <p className="text-sm text-gray-400 opacity-90">{memory.caption}</p>
                    <div className="mt-3 flex items-center gap-3">
                       <button className="text-xs text-[#d8a57c] opacity-60 hover:opacity-100 transition-opacity flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          <span>تفضيل</span>
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Video Modal (Mock) */}
      {playingVideo && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-md">
           <button 
             onClick={() => setPlayingVideo(null)}
             className="absolute top-6 left-6 text-white/60 hover:text-white"
           >
             إغلاق
           </button>
           <div className="w-full max-w-sm aspect-[3/4] bg-[#111] rounded-2xl overflow-hidden relative ring-1 ring-[#d8a57c]/30 shadow-2xl flex items-center justify-center">
             <Play className="w-12 h-12 text-[#d8a57c]/50 animate-pulse" />
             <div className="absolute bottom-6 left-0 right-0 text-center">
                <p className="nafsam-journal-quote text-xl text-white">جاري التشغيل...</p>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}
