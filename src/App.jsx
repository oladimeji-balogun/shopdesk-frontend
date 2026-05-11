import './App.css'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Chat from './pages/customer/Chat'
import Orders from './pages/customer/Orders'
import Dashboard from './pages/agent/Dashboard'
import Analytics from './pages/agent/Analytics'
import KnowledgeBase from './pages/agent/KnowledgeBase'
import UserManagement from './pages/admin/UserManagement'
import Profile from './pages/profile/Profile'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            fontSize: '13px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          },
          success: { iconTheme: { primary: '#2563eb', secondary: '#fff' } },
        }}
      />
      <Routes>
        {/* Public Routes */}
        <Route path='/' element={<Login />} />
        <Route path='/register' element={<Register />} />

        {/* Customer Routes (Protected) */}
        <Route 
          path='/chat' 
          element={
            <ProtectedRoute allowedRoles={['customer', 'agent']}>
              <Chat />
            </ProtectedRoute>
          } 
        />

        {/* Agent Routes (Protected) */}
        <Route 
          path='/dashboard' 
          element={
            <ProtectedRoute allowedRoles={['agent']}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />

        {/* Profile (all authenticated users) */}
        <Route
          path='/profile'
          element={
            <ProtectedRoute allowedRoles={['customer', 'agent']}>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Orders (customers) */}
        <Route
          path='/orders'
          element={
            <ProtectedRoute allowedRoles={['customer', 'agent']}>
              <Orders />
            </ProtectedRoute>
          }
        />

        {/* Analytics (agents only) */}
        <Route
          path='/analytics'
          element={
            <ProtectedRoute allowedRoles={['agent']}>
              <Analytics />
            </ProtectedRoute>
          }
        />

        {/* Knowledge Base (agents only) */}
        <Route
          path='/knowledge-base'
          element={
            <ProtectedRoute allowedRoles={['agent', 'admin']}>
              <KnowledgeBase />
            </ProtectedRoute>
          }
        />

        {/* User Management (admin only) */}
        <Route
          path='/admin/users'
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserManagement />
            </ProtectedRoute>
          }
        />

        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
