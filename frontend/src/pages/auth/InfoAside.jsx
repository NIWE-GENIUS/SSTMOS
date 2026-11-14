// src/pages/auth/InfoAside.jsx
export default function InfoAside({ className = '' }) {
  return (
    <div className={`bg-white p-8 overflow-y-auto ${className}`}>
      <span className="inline-block px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-50 rounded-full mb-4 uppercase tracking-wide">
        Trusted by technical schools
      </span>

      <h3 className="text-lg font-bold text-gray-900 mb-2">Why schools choose SSTMOS</h3>
      <p className="text-sm text-gray-600 leading-relaxed mb-6">
        Built from the ground up to handle the real complexity of technical education — 
        sequences, split sessions, labs, trainer availability, and more.
      </p>

      <div className="space-y-4 mb-6">
        <div className="border-l-4 border-blue-700 pl-4">
          <p className="text-sm text-gray-700 italic leading-relaxed">
            "What used to take our team two weeks of spreadsheets now takes an hour."
          </p>
          <div className="text-xs text-gray-500 mt-2">— Jean Paul M., Director of Studies</div>
        </div>
        <div className="border-l-4 border-blue-700 pl-4">
          <p className="text-sm text-gray-700 italic leading-relaxed">
            "The split-session feature finally got our mathematics distribution right."
          </p>
          <div className="text-xs text-gray-500 mt-2">— Marie Claire K., Head Teacher</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
        <div className="text-center">
          <div className="text-xl font-bold text-blue-700">40+</div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wide mt-0.5">Hours saved / term</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-blue-700">0</div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wide mt-0.5">Conflicts per term</div>
        </div>
      </div>
    </div>
  );
}