import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Analisis from './pages/Analisis'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import Login from './pages/Login'
import AdminHistory from './pages/AdminHistory'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-surface">
          <Navbar />
          <main>
            <Routes>
              <Route path="/"          element={<Home />} />
              <Route path="/analisis"  element={<Analisis />} />
              <Route path="/dashboard" element={<Dashboard />} />
              {/* <Route path="/upload"    element={<Upload />} /> */}
              <Route path="/admin/login" element={<Login />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminHistory />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}
