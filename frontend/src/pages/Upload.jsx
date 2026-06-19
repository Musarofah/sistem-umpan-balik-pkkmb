import { useState, useRef } from 'react'
import { Upload as UploadIcon, FileText, X, AlertCircle, CheckCircle2 } from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts'
import SentimentBadge from '../components/SentimentBadge'
import { uploadCSV } from '../utils/api'

const COLORS = { positif: '#16A34A', netral: '#D97706', negatif: '#DC2626' }

export default function Upload() {
  const [file, setFile] = useState(null)
  const [hasil, setHasil] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef(null)

  const handleFile = (f) => {
    if (!f) return
    if (!f.name.endsWith('.csv')) {
      setError('Harap unggah file berformat CSV')
      return
    }
    setError('')
    setHasil(null)
    setFile(f)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragActive(false)
    handleFile(e.dataTransfer.files?.[0])
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const data = await uploadCSV(formData)
      setHasil(data)
    } catch (e) {
      setError(e?.response?.data?.error || 'Gagal memproses file. Pastikan backend berjalan.')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setFile(null)
    setHasil(null)
    setError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const pieData = hasil
    ? [
        { name: 'Positif', value: hasil.statistik.positif, key: 'positif' },
        { name: 'Netral',  value: hasil.statistik.netral,  key: 'netral'  },
        { name: 'Negatif', value: hasil.statistik.negatif, key: 'negatif' },
      ]
    : []

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
          <UploadIcon size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-800">Upload CSV</h1>
          <p className="text-slate-500 text-sm">Analisis sentimen untuk banyak data sekaligus</p>
        </div>
      </div>

      {/* Upload zone */}
      {!hasil && (
        <div
          onDragOver={e => { e.preventDefault(); setDragActive(true) }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`card border-2 border-dashed p-10 text-center transition-all
            ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-slate-200'}`}
        >
          {!file ? (
            <>
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <UploadIcon size={26} className="text-blue-500" />
              </div>
              <p className="font-semibold text-slate-700 mb-1">Tarik & lepas file CSV di sini</p>
              <p className="text-sm text-slate-400 mb-4">atau klik tombol di bawah untuk memilih file</p>
              <input
                ref={inputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={e => handleFile(e.target.files?.[0])}
              />
              <button
                onClick={() => inputRef.current?.click()}
                className="btn-primary text-sm py-2.5 px-5"
              >
                Pilih File CSV
              </button>
              <p className="text-xs text-slate-400 mt-4">
                Kolom yang dikenali: <code className="bg-slate-100 px-1.5 py-0.5 rounded">Q16_KRITIK DAN SARAN</code>, <code className="bg-slate-100 px-1.5 py-0.5 rounded">teks</code>, atau <code className="bg-slate-100 px-1.5 py-0.5 rounded">komentar</code>
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                  <FileText size={22} className="text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-700 text-sm">{file.name}</p>
                  <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button onClick={reset} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                  <X size={16} />
                </button>
              </div>
              <button
                onClick={handleUpload}
                disabled={loading}
                className="btn-primary text-sm py-2.5 px-6"
              >
                {loading ? 'Memproses...' : 'Analisis Sekarang'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mt-4">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Hasil */}
      {hasil && (
        <div className="space-y-6">
          {/* Success banner */}
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle2 size={16} />
              <span>Berhasil menganalisis <strong>{hasil.total_data}</strong> data dari <strong>{file?.name}</strong></span>
            </div>
            <button onClick={reset} className="text-sm font-semibold text-green-700 hover:text-green-800">
              Upload Lagi
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pie chart */}
            <div className="card p-5 lg:col-span-1">
              <h3 className="font-bold font-display text-slate-800 mb-4">Distribusi Sentimen</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {pieData.map(entry => (
                      <Cell key={entry.key} fill={COLORS[entry.key]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.map(d => (
                  <div key={d.key} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[d.key] }} />
                      <span className="text-slate-600">{d.name}</span>
                    </div>
                    <span className="font-semibold text-slate-800">
                      {d.value} ({hasil.statistik[`pct_${d.key}`]}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sample table */}
            <div className="card p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold font-display text-slate-800">Sampel Hasil Analisis</h3>
                <span className="text-xs text-slate-400">Menampilkan {hasil.sampel.length} dari {hasil.total_data} data</span>
              </div>
              <div className="overflow-y-auto max-h-96 space-y-2">
                {hasil.sampel.map((item, i) => (
                  <div key={i} className="flex items-start justify-between gap-3 bg-slate-50 rounded-lg px-3 py-2.5">
                    <p className="text-sm text-slate-600 leading-relaxed flex-1">{item.teks_asli}</p>
                    <SentimentBadge label={item.label} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
