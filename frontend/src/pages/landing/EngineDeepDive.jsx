// src/pages/landing/EngineDeepDive.jsx
export default function EngineDeepDive() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-50 rounded-full mb-3 uppercase tracking-wide">
              Under the hood
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
              A scheduling engine that thinks like a <span className="text-blue-700">DOS</span>
            </h2>
            <p className="mt-4 text-gray-600 leading-relaxed">
              Most timetabling tools are just spreadsheets with colors. SSTMOS actually
              understands scheduling logic. Our constraint-based engine models every rule
              your school cares about — and never breaks the hard ones.
            </p>
            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0 font-bold text-xs">H</div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Hard constraints — never violated</div>
                  <div className="text-xs text-gray-500 mt-1 leading-relaxed">Trainer availability, class conflicts, room conflicts, weekly periods, qualifications, room suitability, sequence lengths, daily occurrence limits.</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-green-100 text-green-700 flex items-center justify-center shrink-0 font-bold text-xs">S</div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Soft preferences — optimized</div>
                  <div className="text-xs text-gray-500 mt-1 leading-relaxed">Workload balance, module distribution across days, avoiding excessive gaps, preferred sessions, room utilization.</div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-900 rounded-xl shadow-xl p-6 font-mono text-xs text-gray-300">
            <div className="flex items-center gap-1.5 mb-4">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <span className="ml-3 text-gray-500 text-[10px]">generation.log</span>
            </div>
            <div className="text-gray-500 mb-2">// Constraint verification</div>
            <div className="text-green-400">✓ 240 periods required</div>
            <div className="text-green-400">✓ 240 periods scheduled</div>
            <div className="text-green-400">✓ 0 trainer conflicts</div>
            <div className="text-green-400">✓ 0 class conflicts</div>
            <div className="text-green-400">✓ 0 room conflicts</div>
            <div className="text-green-400">✓ All sequences respected</div>
            <div className="text-green-400">✓ All split sessions valid</div>
            <div className="text-gray-500 mt-4 mb-2">// Summary</div>
            <div className="text-yellow-300">→ Generation completed in 4.2s</div>
            <div className="text-blue-300">→ 100% fully scheduled</div>
          </div>
        </div>
      </div>
    </section>
  );
}