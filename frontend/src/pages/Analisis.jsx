import { useState } from 'react'
import { Brain, Send, RotateCcw, AlertCircle, Lightbulb } from 'lucide-react'
import SentimentBadge from '../components/SentimentBadge'
import ConfidenceBar from '../components/ConfidenceBar'
import { predictSingle } from '../utils/api'

const CONTOH = [
  'Kegiatan PKKMB sangat bermanfaat dan menyenangkan, saya senang bisa mengikutinya',
  'Website SPMB sangat lambat dan sering error, susah banget buat aksesnya',
  'Semoga kedepannya lebih baik lagi untuk pelaksanaan PKKMB Universitas Pamulang',
  'Panitia kurang responsif dalam menjawab pertanyaan mahasiswa baru',
  'Acara pembukaan PKKMB berjalan dengan lancar dan terorganisir dengan baik',
]

export default function Analisis() {
  const [teks, setTeks] = useState('')
  const [hasil, setHasil]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const handleAnalisis = async () => {
    if (!teks.trim()) return
    setLoading(true)
    setError('')
    setHasil(null)
    try {
      const data = await predictSingle(teks)
      setHasil(data)
    } catch (e) {
      setError('Tidak dapat terhubung ke server. Pastikan backend Flask sudah berjalan di port 5000.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setTeks('')
    setHasil(null)
    setError('')
  }

  const warnaBg = {
    positif: 'from-green-50 to-white border-green-200',
    netral:  'from-amber-50 to-white border-amber-200',
    negatif: 'from-red-50 to-white border-red-200',
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <Brain size={18} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold font-display text-slate-800">Analisis Sentimen</h1>
        </div>
        <p className="text-slate-500 ml-12">
          Masukkan umpan balik mahasiswa, IndoBERT akan mengklasifikasikan sentimennya secara otomatis.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Input Panel */}
        <div className="lg:col-span-3 space-y-4">
          <div className="card p-5">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Teks Umpan Balik Mahasiswa
            </label>
            <textarea
              value={teks}
              onChange={e => setTeks(e.target.value)}
              placeholder="Contoh: Kegiatan PKKMB sangat bermanfaat dan panitia sangat ramah..."
              rows={5}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-slate-400">{teks.length} karakter</span>
              <div className="flex gap-2">
                {hasil && (
                  <button onClick={handleReset} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-50 transition-all">
                    <RotateCcw size={14} /> Reset
                  </button>
                )}
                <button
                  onClick={handleAnalisis}
                  disabled={loading || !teks.trim()}
                  className="btn-primary flex items-center gap-2 text-sm py-2 px-4"
                >
                  {loading ? (
                    <>
                      <span className="loading-dots flex gap-0.5">
                        <span className="w-1.5 h-1.5 bg-white rounded-full inline-block" />
                        <span className="w-1.5 h-1.5 bg-white rounded-full inline-block" />
                        <span className="w-1.5 h-1.5 bg-white rounded-full inline-block" />
                      </span>
                      Menganalisis...
                    </>
                  ) : (
                    <><Send size={14} /> Analisis</>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Hasil */}
          {hasil && (
            <div className={`card p-5 bg-gradient-to-br ${warnaBg[hasil.label]} border`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold font-display text-slate-800">Hasil Klasifikasi</h3>
                <SentimentBadge label={hasil.label} size="lg" />
              </div>

              <div className="bg-white rounded-xl p-4 mb-4 border border-slate-100">
                <p className="text-xs text-slate-400 mb-1">Teks yang dianalisis:</p>
                <p className="text-sm text-slate-700 leading-relaxed italic">"{hasil.teks_asli}"</p>
              </div>

              <div className="mb-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Distribusi Probabilitas
                </p>
                <ConfidenceBar probabilitas={hasil.probabilitas} />
              </div>

              <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-slate-100">
                <span className="text-sm text-slate-500">Tingkat Keyakinan Model</span>
                <span className="font-bold text-slate-800 text-lg">
                  {(hasil.confidence * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-2 space-y-4">
          {/* Contoh teks */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb size={15} className="text-amber-500" />
              <h3 className="text-sm font-bold text-slate-700">Contoh Teks</h3>
            </div>
            <div className="space-y-2">
              {CONTOH.map((c, i) => (
                <button
                  key={i}
                  onClick={() => { setTeks(c); setHasil(null); setError('') }}
                  className="w-full text-left text-xs text-slate-600 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 px-3 py-2.5 rounded-lg transition-all leading-relaxed border border-transparent hover:border-blue-200"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Label info */}
          <div className="card p-5">
            <h3 className="text-sm font-bold text-slate-700 mb-3">Kategori Sentimen</h3>
            <div className="space-y-3 text-xs text-slate-500">
              <div className="flex items-start gap-2">
                <span className="badge-positif text-xs py-0.5 px-2 mt-0.5 shrink-0">Positif</span>
                <span>Umpan balik yang mengandung kepuasan, pujian, atau apresiasi terhadap PKKMB.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="badge-netral text-xs py-0.5 px-2 mt-0.5 shrink-0">Netral</span>
                <span>Umpan balik berupa harapan, saran, atau pernyataan tanpa muatan emosi kuat.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="badge-negatif text-xs py-0.5 px-2 mt-0.5 shrink-0">Negatif</span>
                <span>Umpan balik yang mengandung keluhan, kritik, atau ketidakpuasan terhadap PKKMB.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
