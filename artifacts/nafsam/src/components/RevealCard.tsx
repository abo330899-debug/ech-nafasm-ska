import { type ReactNode, type CSSProperties } from "react";
import useReveal from "@/hooks/useReveal";

type Props = {
  className?: string;
  index?: number;
  children?: ReactNode;
  style?: CSSProperties;
};

export default function RevealCard({
  className = "",
  index,
  children,
  style,
}: Props) {
  const { ref, inView } = useReveal<HTMLDivElement>();
  const cls = `${className} reveal ${inView ? "in-view" : ""}`.trim();
  const mergedStyle: CSSProperties = {
    ...(style || {}),
    ...(typeof index === "number"
      ? ({ ["--i" as never]: Math.min(index, 8) } as CSSProperties)
      : {}),
  };
  return (
    <div ref={ref} className={cls} style={mergedStyle}>
      {children}
    </div>
  );
}
