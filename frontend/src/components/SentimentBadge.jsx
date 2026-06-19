import { TrendingUp, Minus, TrendingDown } from 'lucide-react'

export default function SentimentBadge({ label, size = 'md' }) {
  const map = {
    positif: { cls: 'badge-positif', icon: TrendingUp,   text: 'Positif' },
    netral:  { cls: 'badge-netral',  icon: Minus,         text: 'Netral'  },
    negatif: { cls: 'badge-negatif', icon: TrendingDown,  text: 'Negatif' },
  }

  const cfg = map[label?.toLowerCase()] || map.netral
  const Icon = cfg.icon

  const sizeMap = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  }

  return (
    <span className={`${cfg.cls} ${sizeMap[size]}`}>
      <Icon size={size === 'lg' ? 16 : 13} />
      {cfg.text}
    </span>
  )
}
