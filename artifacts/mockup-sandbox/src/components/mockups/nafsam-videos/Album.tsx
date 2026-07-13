import React from 'react';
import './Album.css';
import { Play, PlayCircle, Heart } from 'lucide-react';

const memories = [
  { id: 1, poster: '/__mockup/images/nafsam-videos/mem1.png', title: 'أول مساء لنا قرب البحر', quote: 'أمواج وهمسات', rotate: '-rotate-2' },
  { id: 2, poster: '/__mockup/images/nafsam-videos/mem2.png', title: 'ضحكتك التي تشبه المطر', quote: 'عفوية ورقيقة', rotate: 'rotate-3' },
  { id: 3, poster: '/__mockup/images/nafsam-videos/mem3.png', title: 'قهوة الصباح معك', quote: 'دفء البدايات', rotate: '-rotate-1' },
  { id: 4, poster: '/__mockup/images/nafsam-videos/mem4.png', title: 'رحلة الشتاء', quote: 'برد ودفء قلوب', rotate: 'rotate-2' },
  { id: 5, poster: '/__mockup/images/nafsam-videos/mem5.png', title: 'في أزقة المدينة القديمة', quote: 'خطوات لا تُنسى', rotate: '-rotate-3' },
  { id: 6, poster: '/__mockup/images/nafsam-videos/mem6.png', title: 'يوم ميلادك', quote: 'شموع وأمنيات', rotate: 'rotate-1' },
  { id: 7, poster: '/__mockup/images/nafsam-videos/mem1.png', title: 'لحظة غروب', quote: 'سماء بلون الذهب', rotate: '-rotate-2' },
  { id: 8, poster: '/__mockup/images/nafsam-videos/mem2.png', title: 'ابتسامتك المفضلة', quote: 'نور يضيء عتمتي', rotate: 'rotate-2' },
];

export function Album() {
  return (
    <div className="album-container pb-20 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-black/80 to-transparent z-0"></div>
      
      <div className="relative z-10 px-5 pt-12 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">الفيديوهات</h1>
          <p className="text-[#d8a57c]/80 text-sm">ألبوم الذكريات الخالدة...</p>
        </div>
        <div className="glass-panel px-3 py-1.5 rounded-full flex items-center gap-1.5">
          <Heart className="w-3.5 h-3.5 text-[#d8a57c] fill-[#d8a57c]" />
          <span className="text-sm font-medium text-white/90 mt-0.5">٢٤٥ ذكرى</span>
        </div>
      </div>

      <div className="px-5 mb-12 relative z-10">
        <div className="polaroid -rotate-1 mx-auto max-w-[320px]">
          <div className="tape"></div>
          <div className="polaroid-img-wrapper aspect-[16/9]">
            <img src="/__mockup/images/nafsam-videos/hero.png" alt="Featured" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95">
                <Play className="w-6 h-6 text-white ml-1 fill-white" />
              </div>
            </div>
          </div>
          <div className="polaroid-caption">
            <h2 className="handwritten text-xl font-bold">اللحظة الأجمل هذا العام</h2>
            <p className="text-sm text-gray-500 mt-1">كل الحكاية في عيناك</p>
          </div>
        </div>
      </div>

      <div className="px-4 relative z-10">
        <div className="grid grid-cols-2 gap-x-4 gap-y-8">
          {memories.map((mem) => (
            <div key={mem.id} className={`polaroid ${mem.rotate}`}>
              <div className="tape w-12 !h-4 !-top-2"></div>
              <div className="polaroid-img-wrapper aspect-[3/4]">
                <img src={mem.poster} alt={mem.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                   <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center cursor-pointer">
                    <Play className="w-4 h-4 text-white ml-0.5 fill-white" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 text-white/80">
                  <PlayCircle className="w-5 h-5 drop-shadow-md" />
                </div>
              </div>
              <div className="polaroid-caption">
                <h3 className="handwritten text-lg font-bold leading-tight">{mem.title}</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">{mem.quote}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}