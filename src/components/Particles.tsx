const dots = Array.from({ length: 28 }, (_, i) => ({
  left: (i * 37) % 100,
  size: 2 + (i % 4),
  dur: 14 + ((i * 7) % 16),
  delay: -((i * 3) % 20),
  accent: i % 3 === 0,
}));

export function Particles() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {dots.map((d, i) => (
        <span
          key={i}
          className={`animate-drift absolute top-full rounded-full ${d.accent ? "bg-accent" : "bg-primary"}`}
          style={{ left: `${d.left}%`, width: d.size, height: d.size, animationDuration: `${d.dur}s`, animationDelay: `${d.delay}s` }}
        />
      ))}
    </div>
  );
}
