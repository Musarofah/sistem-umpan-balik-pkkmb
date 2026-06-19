import { useEffect, useState } from 'react'
import { BarChart3, AlertCircle, TrendingUp, TrendingDown, Minus, Target } from 'lucide-react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line, Legend
} from 'recharts'
import { getStats } from '../utils/api'

const COLORS = { positif: '#16A34A', netral: '#D97706', negatif: '#DC2626' }

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(() => setError('Hasil training belum tersedia. Jalankan model/train.py terlebih dahulu.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-20 text-center text-slate-400">
        Memuat data dashboard...
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <AlertCircle size={40} className="mx-auto text-amber-400 mb-4" />
        <h2 className="text-lg font-bold text-slate-700 mb-2">Data Belum Tersedia</h2>
        <p className="text-slate-500 text-sm">{error}</p>
      </div>
    )
  }

  const report = stats.report
  const labelNames = stats.config.label_names

  const distribusiData = labelNames.map(l => ({
    name: l.charAt(0).toUpperCase() + l.slice(1),
    value: Math.round(report[l].support),
    key: l,
  }))

  const metrikData = labelNames.map(l => ({
    name: l.charAt(0).toUpperCase() + l.slice(1),
    precision: +(report[l].precision * 100).toFixed(1),
    recall: +(report[l].recall * 100).toFixed(1),
    f1: +(report[l]['f1-score'] * 100).toFixed(1),
  }))

  const historyData = stats.history.train_loss.map((_, i) => ({
    epoch: i + 1,
    train_loss: +stats.history.train_loss[i].toFixed(4),
    val_loss: +stats.history.val_loss[i].toFixed(4),
    train_acc: +(stats.history.train_acc[i] * 100).toFixed(2),
    val_acc: +(stats.history.val_acc[i] * 100).toFixed(2),
  }))

  const totalData = distribusiData.reduce((a, b) => a + b.value, 0)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
          <BarChart3 size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-800">Dashboard Evaluasi Model</h1>
          <p className="text-slate-500 text-sm">Hasil pelatihan dan evaluasi model IndoBERT</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard
          icon={Target}
          label="Akurasi Test"
          value={`${(stats.test_acc * 100).toFixed(1)}%`}
          color="bg-blue-50 text-blue-600"
        />
        <SummaryCard
          icon={TrendingUp}
          label="Total Data"
          value={totalData.toLocaleString('id-ID')}
          color="bg-slate-100 text-slate-600"
        />
        <SummaryCard
          icon={TrendingUp}
          label="Sentimen Positif"
          value={distribusiData.find(d => d.key === 'positif')?.value.toLocaleString('id-ID') || '-'}
          color="bg-green-50 text-green-600"
        />
        <SummaryCard
          icon={TrendingDown}
          label="Sentimen Negatif"
          value={distribusiData.find(d => d.key === 'negatif')?.value.toLocaleString('id-ID') || '-'}
          color="bg-red-50 text-red-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Distribusi Pie Chart */}
        <div className="card p-5">
          <h3 className="font-bold font-display text-slate-800 mb-4">Distribusi Sentimen (Test Set)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={distribusiData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={3}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {distribusiData.map((entry) => (
                  <Cell key={entry.key} fill={COLORS[entry.key]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {distribusiData.map(d => (
              <div key={d.key} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[d.key] }} />
                {d.name}
              </div>
            ))}
          </div>
        </div>

        {/* Metrik Bar Chart */}
        <div className="card p-5">
          <h3 className="font-bold font-display text-slate-800 mb-4">Precision, Recall & F1-Score</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={metrikData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="precision" name="Precision" fill="#2563EB" radius={[4, 4, 0, 0]} />
              <Bar dataKey="recall"    name="Recall"    fill="#7C3AED" radius={[4, 4, 0, 0]} />
              <Bar dataKey="f1"        name="F1-Score"  fill="#16A34A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Training history */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-5">
          <h3 className="font-bold font-display text-slate-800 mb-4">Loss per Epoch</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={historyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="epoch" tick={{ fontSize: 12 }} label={{ value: 'Epoch', position: 'insideBottom', offset: -2, fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="train_loss" name="Train Loss" stroke="#2563EB" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="val_loss"   name="Val Loss"   stroke="#DC2626" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-bold font-display text-slate-800 mb-4">Akurasi per Epoch</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={historyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="epoch" tick={{ fontSize: 12 }} label={{ value: 'Epoch', position: 'insideBottom', offset: -2, fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="train_acc" name="Train Acc (%)" stroke="#2563EB" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="val_acc"   name="Val Acc (%)"   stroke="#16A34A" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detail tabel */}
      <div className="card p-5">
        <h3 className="font-bold font-display text-slate-800 mb-4">Detail Performa per Kelas</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-100">
                <th className="pb-2 font-semibold">Kelas</th>
                <th className="pb-2 font-semibold text-right">Precision</th>
                <th className="pb-2 font-semibold text-right">Recall</th>
                <th className="pb-2 font-semibold text-right">F1-Score</th>
                <th className="pb-2 font-semibold text-right">Jumlah Data</th>
              </tr>
            </thead>
            <tbody>
              {labelNames.map(l => (
                <tr key={l} className="border-b border-slate-50 last:border-0">
                  <td className="py-3">
                    <span className="capitalize font-semibold" style={{ color: COLORS[l] }}>{l}</span>
                  </td>
                  <td className="py-3 text-right text-slate-600">{(report[l].precision * 100).toFixed(2)}%</td>
                  <td className="py-3 text-right text-slate-600">{(report[l].recall * 100).toFixed(2)}%</td>
                  <td className="py-3 text-right text-slate-600">{(report[l]['f1-score'] * 100).toFixed(2)}%</td>
                  <td className="py-3 text-right text-slate-600">{Math.round(report[l].support)}</td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-bold">
                <td className="py-3 px-2 rounded-l-lg">Akurasi Keseluruhan</td>
                <td colSpan={2}></td>
                <td className="py-3 text-right text-slate-800">{(report.accuracy * 100).toFixed(2)}%</td>
                <td className="py-3 text-right text-slate-600 rounded-r-lg pr-2">{Math.round(report['weighted avg'].support)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card p-4">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${color}`}>
        <Icon size={17} />
      </div>
      <p className="text-2xl font-extrabold font-display text-slate-800">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
    </div>
  )
}
