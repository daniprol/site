/** A GitHub avatar, requested at twice its size for sharp screens. */
export function Avatar({ src, size, className }: { src: string; size: number; className: string }) {
  const url = new URL(src);
  url.searchParams.set("s", String(size * 2));
  return <img className={className} src={url.href} width={size} height={size} alt="" loading="lazy" decoding="async" />;
}
