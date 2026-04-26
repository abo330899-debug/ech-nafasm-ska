import { Fragment, useEffect, useRef, useState } from "react";

const TITLE = "من نِصفِ الروح.. إلى نِصفِها الضائع.";

const BODY =
  "إلهام.. تعلمين جيداً أنكِ طفتِ العالم وجربتِ كل شيء، ثم اخترتِني لأنكِ وجدتِ فيّ ما تطلبه الأنثى من رجولةٍ، غيرةٍ، كرامةٍ، وسخاءٍ في عطاءٍ صادق. كنتُ لكِ الذكي، والشيطان، والطفل الذي يحتمي بذراعكِ، كنتُ روحاً لروحكِ. كأننا كنا جسدين لروحٍ واحدة (ستار وإلهام).\n\n" +
  "أقولها لكِ بثقة الأوفياء: ستقضين بقية حياتكِ تبحثين عن ظلي في وجوه الآخرين، ستشتاقين لريحتي، لجنوني، ولأسلوبي.. ولن تجدي. ستدركين أن أنوثتكِ لم تزهر ولم تشعري بكيانكِ كامرأة إلا معي، ومهما حاولوا أو جربتِ، سيبقى ذلك الشعور محصوراً في ذكرياتي أنا.\n\n" +
  "أما أنا.. وبما أنكِ كنتِ تقولين دائماً أنني 'كثير الذكاء'، فذكائي يخبرني أنني لن أجد مِثلكِ أبداً، ولن تأخذ امرأةٌ أخرى مكان شعرةٍ منكِ. لذا، سأرحم نفسي من عناء البحث عن 'إلهام' في جسدٍ آخر. أعلنُ اليوم اعتزالي لجنس حواء؛ تكفيني الذكريات المحبوسة في هذه الصفحة.\n\n" +
  "انتبهي على نفسكِ يا ابنتي الصغيرة.. الشوقُ شَيّبني، والكرامةُ حَرّرتني.";

const SILVER_ANCHOR = "الشوقُ";
const MEMORY_REGEX = /(الذكريات|ذكرياتي)/g;

function renderSegment(text: string, prefix: string) {
  if (!text) return null;
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  MEMORY_REGEX.lastIndex = 0;
  while ((match = MEMORY_REGEX.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(
        <Fragment key={`${prefix}-t-${lastIdx}`}>
          {text.slice(lastIdx, match.index)}
        </Fragment>,
      );
    }
    parts.push(
      <span key={`${prefix}-m-${match.index}`} className="memory-word">
        {match[0]}
      </span>,
    );
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) {
    parts.push(
      <Fragment key={`${prefix}-t-end-${lastIdx}`}>
        {text.slice(lastIdx)}
      </Fragment>,
    );
  }
  return parts;
}

interface Props {
  startDelayMs?: number;
}

export default function FarewellPassage({ startDelayMs = 1100 }: Props) {
  const [titleCount, setTitleCount] = useState(0);
  const [bodyCount, setBodyCount] = useState(0);
  const [titleDone, setTitleDone] = useState(false);
  const [bodyDone, setBodyDone] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    setTitleCount(0);
    setBodyCount(0);
    setTitleDone(false);
    setBodyDone(false);
    setStarted(false);
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTitleCount(TITLE.length);
      setBodyCount(BODY.length);
      setTitleDone(true);
      setBodyDone(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setStarted(true);
          io.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    let t: number;
    const tick = () => {
      i += 1;
      setTitleCount(i);
      if (i >= TITLE.length) {
        setTitleDone(true);
        return;
      }
      const ch = TITLE.charAt(i - 1);
      const isLong = /[\.؟!]/.test(ch);
      const isMid = /[،؛:\-—…]/.test(ch);
      const delay = isLong ? 480 : isMid ? 280 : ch === " " ? 60 : 80 + Math.random() * 50;
      t = window.setTimeout(tick, delay);
    };
    t = window.setTimeout(tick, startDelayMs);
    return () => window.clearTimeout(t);
  }, [started, startDelayMs]);

  useEffect(() => {
    if (!titleDone) return;
    let i = 0;
    let t: number;
    const tick = () => {
      i += 1;
      setBodyCount(i);
      if (i >= BODY.length) {
        setBodyDone(true);
        return;
      }
      const ch = BODY.charAt(i - 1);
      const isPara = ch === "\n";
      const isLong = /[\.؟!]/.test(ch);
      const isMid = /[،؛:\-—…]/.test(ch);
      const isComma = /[,]/.test(ch);
      let delay = 60 + Math.random() * 55;
      if (isPara) delay = 900;
      else if (isLong) delay = 720;
      else if (isMid) delay = 380;
      else if (isComma) delay = 280;
      else if (ch === " ") delay = 50;
      t = window.setTimeout(tick, delay);
    };
    t = window.setTimeout(tick, 700);
    return () => window.clearTimeout(t);
  }, [titleDone]);

  const visibleTitle = TITLE.slice(0, titleCount);
  const visibleBody = BODY.slice(0, bodyCount);
  const silverStart = BODY.indexOf(SILVER_ANCHOR);
  const hasSilver = silverStart >= 0 && bodyCount > silverStart;
  const normalText = hasSilver ? visibleBody.slice(0, silverStart) : visibleBody;
  const silverText = hasSilver ? visibleBody.slice(silverStart) : "";

  return (
    <div
      ref={ref}
      className={`farewell-block ${titleDone ? "title-done" : ""} ${bodyDone ? "body-done" : ""}`}
      lang="ar"
      dir="rtl"
    >
      <h2 className={`farewell-title ${titleDone ? "is-done" : ""}`}>
        <span className="ft-text">{visibleTitle}</span>
        {!titleDone && <span className="ft-caret" aria-hidden="true" />}
      </h2>
      <p className={`farewell-passage ${bodyDone ? "is-done" : ""} ${started ? "has-started" : ""}`}>
        <span className="fp-text">{renderSegment(normalText, "n")}</span>
        {hasSilver && (
          <span className="fp-text fp-silver">{renderSegment(silverText, "s")}</span>
        )}
        {titleDone && !bodyDone && <span className="fp-caret" aria-hidden="true" />}
      </p>
    </div>
  );
}
