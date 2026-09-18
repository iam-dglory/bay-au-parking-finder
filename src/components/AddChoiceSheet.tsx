export function AddChoiceSheet({
  onChooseSign,
  onChooseListing,
  onClose,
}: {
  onChooseSign: () => void
  onChooseListing: () => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/30 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-center text-lg font-semibold text-slate-900">What would you like to add?</h2>
        <div className="mt-4 space-y-3">
          <button
            onClick={onChooseSign}
            className="w-full rounded-xl border border-slate-200 p-4 text-left transition hover:border-slate-300 hover:bg-slate-50"
          >
            <p className="font-medium text-slate-900">🪧 Report a free parking sign</p>
            <p className="mt-0.5 text-sm text-slate-500">Log what a public street sign says, for everyone to see for free.</p>
          </button>
          <button
            onClick={onChooseListing}
            className="w-full rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 text-left transition hover:border-indigo-300"
          >
            <p className="font-medium text-slate-900">💰 List your spot for rent</p>
            <p className="mt-0.5 text-sm text-slate-500">Got a driveway or unused bay? Rent it out by the hour.</p>
          </button>
        </div>
        <button onClick={onClose} className="mt-4 w-full rounded-xl py-2.5 text-sm font-medium text-slate-400 hover:text-slate-600">
          Cancel
        </button>
      </div>
    </div>
  )
}
