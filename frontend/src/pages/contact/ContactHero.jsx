// src/pages/contact/ContactHero.jsx
export default function ContactHero() {
  return (
    <section className="bg-blue-700 text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-white blur-3xl" />
      </div>
      <div className="relative max-w-6xl mx-auto px-6 py-20 sm:py-24 text-center">
        <span className="inline-block px-4 py-1.5 text-xs font-semibold text-blue-100 bg-blue-600/50 rounded-full mb-6 uppercase tracking-wider border border-blue-400/30">
          Contact us
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight max-w-3xl mx-auto">
          <span className="text-white">Let's build a </span>
          <span className="text-yellow-300">better timetable</span>
          <span className="text-white"> together</span>
        </h1>
        <p className="mt-6 text-lg text-blue-100 max-w-2xl mx-auto">
          Questions about pricing, onboarding, or technical details? Reach out to the team that built SSTMOS.
        </p>
      </div>
    </section>
  );
}