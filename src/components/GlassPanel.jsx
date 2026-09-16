/**
 * Generic frosted "liquid glass" panel. Presentational only.
 * @param {{ children: React.ReactNode, tint?: boolean, className?: string }} props
 * @param {React.ReactNode} props.children
 * @param {boolean} [props.tint] use the darker fill for legibility over bright frames
 * @param {string} [props.className]
 */
export default function GlassPanel({ children, tint = false, className = "" }) {
  const base = tint ? "liquid-glass liquid-glass--tint" : "liquid-glass";
  return <div className={`${base} ${className}`.trim()}>{children}</div>;
}
