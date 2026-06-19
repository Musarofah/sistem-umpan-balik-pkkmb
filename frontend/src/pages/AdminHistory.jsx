import { useEffect, useState, useCallback } from 'react'
import {
  Search, Trash2, Edit3, X, Check, ChevronLeft, ChevronRight,
  Filter, LogOut, Database, AlertCircle, RefreshCw
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import SentimentBadge from '../components/SentimentBadge'
import api from '../utils/api'

const LABELS = ['positif', 'netral', 'negatif']

export default function AdminHistory() {
  const { user, logout } = useAuth()

  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, per_page: 20 })
  const [summary, setSummary] = useState(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [filterLabel, setFilterLabel] = useState('')
  const [filterSumber, setFilterSumber] = useState('')
  const [page, setPage] = useState(1)

  const [selected, setSelected] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editKoreksi, setEditKoreksi] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, per_page: 20 }
      if (search) params.search = search
      if (filterLabel) params.label = filterLabel
      if (filterSumber) params.sumber = filterSumber

      const res = await api.get('/admin/history', { params })
      setData(res.data.data)
      setPagination(res.data.pagination)
      setSelected([])
    } catch (e) {
      setError(e?.response?.data?.error || 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [page, search, filterLabel, filterSumber])

  const fetchSummary = useCallback(async () => {
    try {
      const res = await api.get('/admin/history/summary')
      setSummary(res.data.data)
    } catch (e) {
      // diam saja, tidak kritis
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { fetchSummary() }, [fetchSummary, data])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    fetchData()
  }

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const toggleSelectAll = () => {
    if (selected.length === data.length) setSelected([])
    else setSelected(data.map(d => d.id))
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus data ini secara permanen?')) return
    try {
      await api.delete(`/admin/history/${id}`)
      fetchData()
    } catch (e) {
      alert(e?.response?.data?.error || 'Gagal menghapus data')
    }
  }

  const handleBulkDelete = async () => {
    if (selected.length === 0) return
    if (!window.confirm(`Hapus ${selected.length} data terpilih secara permanen?`)) return
    try {
      await api.post('/admin/history/bulk-delete', { ids: selected })
      fetchData()
    } catch (e) {
      alert(e?.response?.data?.error || 'Gagal menghapus data')
    }
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setEditKoreksi(item.label_koreksi || item.label)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditKoreksi('')
  }

  const saveEdit = async (id) => {
    try {
      await api.put(`/admin/history/${id}`, { label_koreksi: editKoreksi })
      setEditingId(null)
      fetchData()
    } catch (e) {
      alert(e?.response?.data?.error || 'Gagal menyimpan perubahan')
    }
  }

  const formatDate = (iso) => {
    if (!iso) return '-'
    const d = new Date(iso)
    return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <Database size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display text-slate-800">Riwayat Prediksi</h1>
            <p className="text-slate-500 text-sm">Kelola dan koreksi hasil klasifikasi sentimen</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">
            Masuk sebagai <strong className="text-slate-700">{user?.username}</strong>
          </span>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700 px-3 py-2 rounded-lg hover:bg-red-50 transition-all"
          >
            <LogOut size={15} /> Keluar
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <SummaryCard label="Total Data" value={summary.total} color="bg-slate-100 text-slate-600" />
          <SummaryCard label="Positif" value={summary.positif} color="bg-green-50 text-green-600" />
          <SummaryCard label="Netral" value={summary.netral} color="bg-amber-50 text-amber-600" />
          <SummaryCard label="Negatif" value={summary.negatif} color="bg-red-50 text-red-600" />
          <SummaryCard label="Dari Upload" value={summary.sumber_upload} color="bg-purple-50 text-purple-600" />
          <SummaryCard label="Dikoreksi" value={summary.dikoreksi} color="bg-blue-50 text-blue-600" />
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearch} className="flex-1 min-w-[220px] relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari teks umpan balik..."
              className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </form>

          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select
              value={filterLabel}
              onChange={e => { setFilterLabel(e.target.value); setPage(1) }}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Label</option>
              {LABELS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
            </select>

            <select
              value={filterSumber}
              onChange={e => { setFilterSumber(e.target.value); setPage(1) }}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Sumber</option>
              <option value="manual">Manual</option>
              <option value="upload">Upload</option>
            </select>

            <button
              onClick={() => fetchData()}
              className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
              title="Muat ulang"
            >
              <RefreshCw size={15} />
            </button>
          </div>

          {selected.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700 px-3 py-2 rounded-lg hover:bg-red-50 transition-all"
            >
              <Trash2 size={14} /> Hapus ({selected.length})
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-4">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-left text-slate-500">
                <th className="p-3 w-10">
                  <input
                    type="checkbox"
                    checked={data.length > 0 && selected.length === data.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300"
                  />
                </th>
                <th className="p-3 font-semibold">Teks Umpan Balik</th>
                <th className="p-3 font-semibold">Prediksi</th>
                <th className="p-3 font-semibold">Koreksi</th>
                <th className="p-3 font-semibold">Confidence</th>
                <th className="p-3 font-semibold">Sumber</th>
                <th className="p-3 font-semibold">Tanggal</th>
                <th className="p-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10 text-slate-400">Memuat data...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-slate-400">Tidak ada data</td></tr>
              ) : (
                data.map(item => (
                  <tr key={item.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(item.id)}
                        onChange={() => toggleSelect(item.id)}
                        className="rounded border-slate-300"
                      />
                    </td>
                    <td className="p-3 max-w-xs">
                      <p className="text-slate-700 line-clamp-2">{item.teks_asli}</p>
                    </td>
                    <td className="p-3">
                      <SentimentBadge label={item.label} size="sm" />
                    </td>
                    <td className="p-3">
                      {editingId === item.id ? (
                        <select
                          value={editKoreksi}
                          onChange={e => setEditKoreksi(e.target.value)}
                          className="border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {LABELS.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      ) : item.label_koreksi ? (
                        <SentimentBadge label={item.label_koreksi} size="sm" />
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-500">
                      {item.confidence != null ? `${(item.confidence * 100).toFixed(1)}%` : '-'}
                    </td>
                    <td className="p-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        item.sumber === 'upload' ? 'bg-purple-50 text-purple-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {item.sumber}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 text-xs whitespace-nowrap">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        {editingId === item.id ? (
                          <>
                            <button onClick={() => saveEdit(item.id)} className="p-1.5 rounded-lg text-green-600 hover:bg-green-50">
                              <Check size={15} />
                            </button>
                            <button onClick={cancelEdit} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
                              <X size={15} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(item)} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50" title="Koreksi label">
                              <Edit3 size={15} />
                            </button>
                            <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50" title="Hapus">
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Halaman {pagination.page} dari {pagination.pages} · Total {pagination.total} data
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={pagination.page >= pagination.pages}
                className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SummaryCard({ label, value, color }) {
  return (
    <div className="card p-4">
      <p className="text-2xl font-extrabold font-display text-slate-800">{value ?? '-'}</p>
      <p className={`text-xs mt-1 inline-block px-2 py-0.5 rounded-full ${color}`}>{label}</p>
    </div>
  )
}
