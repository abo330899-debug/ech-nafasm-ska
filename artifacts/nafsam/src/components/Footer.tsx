interface Props {
  text: string;
}

export default function Footer({ text }: Props) {
  return <div className="footer">{text}</div>;
}
