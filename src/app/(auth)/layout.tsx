export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden" style={{ backgroundColor: 'var(--auth-bg)' }}>
      {/* Background video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      >
        <source src="/farm-bg.mp4" type="video/mp4" />
      </video>

      {/* Warm overlay for readability */}
      <div className="pointer-events-none absolute inset-0 bg-black/40 backdrop-blur-[1px]" />

      {/* Warm earthy gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-900/70 via-transparent to-stone-900/30" />

      <div className="relative z-10 w-full max-w-md px-4">{children}</div>
    </div>
  );
}
