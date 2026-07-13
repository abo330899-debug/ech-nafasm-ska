import React, { useState } from 'react';
import { Play, ChevronDown, Film, Info } from 'lucide-react';
import './cinema.css';

const VIDEOS = [
  {
    id: '1',
    src: '/__mockup/images/nafsam-videos/mem1.png',
    caption: 'أول مساء لنا قرب البحر',
    quote: 'كان الموج يهمس باسمك، والرياح تحمل عطر بداياتنا',
    date: '١٢ مايو ٢٠٢٢'
  },
  {
    id: '2',
    src: '/__mockup/images/nafsam-videos/mem2.png',
    caption: 'ضحكتك التي تشبه المطر',
    quote: 'تغسلين عن قلبي تعب الأيام بابتسامة واحدة',
    date: '٢٨ يوليو ٢٠٢٢'
  },
  {
    id: '3',
    src: '/__mockup/images/nafsam-videos/mem3.png',
    caption: 'في المقهى القديم',
    quote: 'كوبان من القهوة، وأحاديث لا تنتهي عن أحلامنا',
    date: '٠٥ سبتمبر ٢٠٢٢'
  },
  {
    id: '4',
    src: '/__mockup/images/nafsam-videos/mem4.png',
    caption: 'طريق السفر الطويل',
    quote: 'وحدنا نحن والطريق والأغاني التي نحبها',
    date: '١٤ نوفمبر ٢٠٢٢'
  },
  {
    id: '5',
    src: '/__mockup/images/nafsam-videos/mem5.png',
    caption: 'احتفالنا الصغير',
    quote: 'ضوء الشموع ينعكس في عينيك كألف نجمة',
    date: '٣٠ ديسمبر ٢٠٢٢'
  },
  {
    id: '6',
    src: '/__mockup/images/nafsam-videos/mem6.png',
    caption: 'صباح شتوي هادئ',
    quote: 'الشمس تتسلل من النافذة لتلقي التحية على وجهك',
    date: '١٢ فبراير ٢٠٢٣'
  },
  {
    id: '7',
    src: '/__mockup/images/nafsam-videos/mem1.png',
    caption: 'رحلة الجبل',
    quote: 'فوق السحاب، حيث لا شيء يهم سوى وجودنا معاً',
    date: '٠٣ أبريل ٢٠٢٣'
  },
  {
    id: '8',
    src: '/__mockup/images/nafsam-videos/mem2.png',
    caption: 'نهاية الصيف',
    quote: 'وداعاً لفصل دافئ، وأهلاً بأيام جديدة نكتبها سوياً',
    date: '٢٢ أغسطس ٢٠٢٣'
  }
];

export function Cinema() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="cinema-container w-full max-w-[390px] mx-auto bg-black shadow-2xl relative">
      
      {/* Intro / Hero Slide */}
      <section className="cinema-slide film-flicker">
        <div className="cinema-letterbox-top" />
        <img 
          src="/__mockup/images/nafsam-videos/hero.png" 
          alt="Hero" 
          className="cinema-img"
        />
        <div className="cinema-scrim-hero" />
        
        <div className="cinema-content px-6 py-12 flex flex-col justify-between items-center text-center">
          <div className="pt-20">
            <h1 className="text-4xl font-bold tracking-wider text-[#d8a57c] mb-4 drop-shadow-lg">
              الفيديوهات
            </h1>
            <p className="subtitle-quote text-lg text-white/80 leading-relaxed max-w-[280px]">
              "شريط سينمائي لا يعرض سوى أجمل لحظاتنا"
            </p>
          </div>
          
          <div className="flex flex-col items-center gap-6 pb-24">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#d8a57c]/80 font-semibold bg-black/40 px-4 py-2 rounded-full border border-[#d8a57c]/20 backdrop-blur-md">
              <Film size={14} />
              <span>٢٤٥ ذكرى</span>
            </div>
            
            <div className="w-px h-12 bg-gradient-to-b from-[#d8a57c] to-transparent opacity-50" />
            
            <div className="flex flex-col items-center gap-2 text-white/50 animate-bounce mt-4">
              <span className="text-xs uppercase tracking-widest">اسحب للمشاهدة</span>
              <ChevronDown size={20} />
            </div>
          </div>
        </div>
        <div className="cinema-letterbox-bottom" />
      </section>

      {/* Video Reels */}
      {VIDEOS.map((video, idx) => (
        <section key={video.id} className="cinema-slide">
          <div className="cinema-letterbox-top" />
          <img 
            src={video.src} 
            alt={video.caption} 
            className="cinema-img"
          />
          <div className="cinema-scrim" />
          
          <div className="cinema-content justify-between p-6">
            
            {/* Header info */}
            <div className="pt-16 flex justify-between items-start opacity-70">
              <div className="text-[10px] tracking-widest text-white/70">
                SCENE {String(idx + 1).padStart(2, '0')}
              </div>
              <div className="text-[10px] tracking-widest text-white/70">
                {video.date}
              </div>
            </div>

            {/* Play Button - Center */}
            <div className="flex-grow flex items-center justify-center">
              <button 
                className="play-ring w-20 h-20 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-[#d8a57c] hover:bg-[#d8a57c] hover:text-black transition-all group"
                onClick={() => setIsPlaying(true)}
              >
                <Play className="w-8 h-8 ml-2 fill-current group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {/* Subtitles / Caption */}
            <div className="pb-16 text-center">
              <h2 className="text-xl font-bold mb-3 text-white sub-shadow">
                {video.caption}
              </h2>
              <p className="subtitle-quote text-base md:text-lg text-[#d8a57c]/90 leading-relaxed sub-shadow max-w-[280px] mx-auto">
                "{video.quote}"
              </p>
            </div>

          </div>
          <div className="cinema-letterbox-bottom" />
        </section>
      ))}

      {/* Fake Player Modal */}
      {isPlaying && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center flex-col">
          <div className="absolute top-8 right-8 z-50">
            <button 
              onClick={() => setIsPlaying(false)}
              className="text-white/60 hover:text-white px-4 py-2 text-sm tracking-widest uppercase bg-white/10 rounded-full backdrop-blur-md"
            >
              إغلاق
            </button>
          </div>
          <div className="w-full aspect-video bg-zinc-900 flex items-center justify-center relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4 text-white/50">
                <Play className="w-12 h-12 opacity-50" />
                <span className="text-sm tracking-widest">جاري التشغيل...</span>
              </div>
            </div>
            {/* Progress bar fake */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
              <div className="h-full bg-[#d8a57c] w-1/3 relative">
                <div className="absolute -right-1.5 -top-1 w-3 h-3 rounded-full bg-[#d8a57c] shadow-[0_0_10px_rgba(216,165,124,0.8)]" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
