export default function ConfidenceBar({ probabilitas }) {
  if (!probabilitas) return null

  const items = [
    { key: 'positif', label: 'Positif', color: 'bg-green-500', text: 'text-green-700' },
    { key: 'netral',  label: 'Netral',  color: 'bg-amber-500', text: 'text-amber-700' },
    { key: 'negatif', label: 'Negatif', color: 'bg-red-500',   text: 'text-red-700'  },
  ]

  return (
    <div className="space-y-2.5">
      {items.map(({ key, label, color, text }) => {
        const pct = Math.round((probabilitas[key] || 0) * 100)
        return (
          <div key={key}>
            <div className="flex justify-between text-xs mb-1">
              <span className={`font-semibold ${text}`}>{label}</span>
              <span className="text-slate-500">{pct}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${color} rounded-full transition-all duration-700`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
