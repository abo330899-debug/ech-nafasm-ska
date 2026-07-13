import "@/styles/luxe-chrome.css";

interface Props {
  text: string;
}

export default function Footer({ text }: Props) {
  return (
    <div className="footer luxe-footer">
      <div className="luxe-footer-divider" aria-hidden="true">
        <div className="luxe-footer-line" />
        <div className="luxe-footer-diamond" />
        <div className="luxe-footer-line" />
      </div>
      <div className="luxe-sparkle" style={{ top: '20%', left: '15%' }} aria-hidden="true" />
      <div className="luxe-sparkle" style={{ bottom: '30%', right: '20%', animationDelay: '1s' }} aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
}
