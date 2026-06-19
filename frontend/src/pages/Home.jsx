import { Link } from 'react-router-dom'
import { Brain, BarChart3, Upload, ArrowRight, Zap, Shield, Clock } from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'IndoBERT AI',
    desc: 'Menggunakan model IndoBERT yang dilatih khusus pada data PKKMB Universitas Pamulang untuk akurasi optimal pada teks Bahasa Indonesia.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Zap,
    title: 'Analisis Real-time',
    desc: 'Klasifikasi sentimen dilakukan secara instan. Ketik umpan balik, model langsung mendeteksi apakah teks bersifat positif, netral, atau negatif.',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: BarChart3,
    title: 'Dashboard Interaktif',
    desc: 'Visualisasi distribusi sentimen, statistik per kategori, dan tren umpan balik mahasiswa dalam tampilan grafik yang mudah dipahami.',
    color: 'bg-green-50 text-green-600',
  },
  {
    icon: Upload,
    title: 'Upload CSV Massal',
    desc: 'Analisis ratusan umpan balik sekaligus dengan mengunggah file CSV. Hasil langsung ditampilkan dengan statistik lengkap.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: Shield,
    title: 'Akurasi Tinggi',
    desc: 'Model mencapai akurasi 95.5% pada test set dengan precision dan recall yang seimbang di ketiga kelas sentimen.',
    color: 'bg-red-50 text-red-600',
  },
  {
    icon: Clock,
    title: 'Evaluasi Efisien',
    desc: 'Proses evaluasi PKKMB yang sebelumnya manual kini dapat dilakukan secara otomatis, cepat, dan berbasis data.',
    color: 'bg-teal-50 text-teal-600',
  },
]

const steps = [
  { num: '01', title: 'Input Teks',    desc: 'Masukkan umpan balik mahasiswa pada halaman Analisis' },
  { num: '02', title: 'Proses AI',     desc: 'IndoBERT menganalisis sentimen teks secara otomatis' },
  { num: '03', title: 'Lihat Hasil',   desc: 'Prediksi label beserta tingkat keyakinan ditampilkan' },
  { num: '04', title: 'Evaluasi',      desc: 'Gunakan dashboard untuk melihat rangkuman keseluruhan' },
]

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="max-w-3xl">
            <span className="inline-block bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase">
              Tugas Akhir — IndoBERT NLP
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold font-display leading-tight mb-5">
              Analisis Sentimen<br />
              Umpan Balik Mahasiswa<br />
              <span className="text-blue-200">Kegiatan PKKMB</span>
            </h1>
            <p className="text-blue-100 text-lg mb-10 leading-relaxed max-w-xl">
              Sistem klasifikasi sentimen berbasis IndoBERT untuk mengelompokkan
              umpan balik mahasiswa terhadap PKKMB ke dalam kategori
              <strong className="text-white"> Positif</strong>,
              <strong className="text-white"> Netral</strong>, dan
              <strong className="text-white"> Negatif</strong> secara otomatis.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/analisis" className="flex items-center gap-2 bg-white text-blue-700 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition-all">
                Coba Analisis <ArrowRight size={18} />
              </Link>
              <Link to="/dashboard" className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white font-semibold px-6 py-3 rounded-xl transition-all border border-white/20">
                Lihat Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="border-t border-white/10 bg-white/5">
          <div className="max-w-6xl mx-auto px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { val: '13.001', label: 'Total Data' },
              { val: '95.5%',  label: 'Akurasi Model' },
              { val: '3',      label: 'Kelas Sentimen' },
              { val: '5',      label: 'Epoch Training' },
            ].map(({ val, label }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-extrabold font-display text-white">{val}</p>
                <p className="text-blue-200 text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cara Kerja */}
      <section className="py-16 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold font-display text-slate-800 mb-2">Cara Kerja Sistem</h2>
            <p className="text-slate-500">Empat langkah sederhana untuk menganalisis sentimen</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {steps.map(({ num, title, desc }) => (
              <div key={num} className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-extrabold font-display text-lg flex items-center justify-center mx-auto mb-4">
                  {num}
                </div>
                <h3 className="font-bold text-slate-800 mb-1">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fitur */}
      <section className="py-16 bg-surface">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold font-display text-slate-800 mb-2">Fitur Sistem</h2>
            <p className="text-slate-500">Semua yang Anda butuhkan untuk evaluasi PKKMB berbasis AI</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="card p-6 hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                  <Icon size={20} />
                </div>
                <h3 className="font-bold text-slate-800 mb-2 font-display">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white border-t border-slate-100">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold font-display text-slate-800 mb-3">
            Mulai Analisis Sekarang
          </h2>
          <p className="text-slate-500 mb-8">
            Masukkan umpan balik mahasiswa dan dapatkan klasifikasi sentimen secara instan menggunakan model IndoBERT.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/analisis" className="btn-primary flex items-center gap-2">
              <Brain size={18} /> Analisis Teks
            </Link>
            <Link to="/upload" className="flex items-center gap-2 border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold px-6 py-3 rounded-xl transition-all">
              <Upload size={18} /> Upload CSV
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-slate-400 text-sm py-8 px-6 text-center">
        <p className="font-display font-semibold text-white mb-1">Sistem Evaluasi PKKMB — Analisis Sentimen</p>
        <p>Menggunakan model IndoBERT · Universitas Pamulang · Tugas Akhir 2025</p>
      </footer>
    </div>
  )
}
