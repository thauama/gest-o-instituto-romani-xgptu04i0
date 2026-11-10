import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/hooks/use-auth'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import Layout from './components/Layout'

// Pages
import Login from './pages/Login'
import Resumo from './pages/Resumo'
import Dashboard from './pages/Dashboard'
import Agenda from './pages/Agenda'
import Clientes from './pages/Clientes'
import PreCadastroPaciente from './pages/PreCadastroPaciente'
import Itens from './pages/Itens'
import Movimentacoes from './pages/Movimentacoes'
import ContratosOrcamentos from './pages/ContratosOrcamentos'
import Financeiro from './pages/Financeiro'
import ChatIA from './pages/ChatIA'
import NotFound from './pages/NotFound'

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/pre-cadastro/:id" element={<PreCadastroPaciente />} />

          {/* Protected Routes inside App Layout */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/painel" replace />} />
            <Route path="/painel" element={<Resumo />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/itens" element={<Itens />} />
            <Route path="/movimentacoes" element={<Movimentacoes />} />
            <Route path="/contratos" element={<ContratosOrcamentos />} />
            <Route
              path="/financeiro"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <Financeiro />
                </ProtectedRoute>
              }
            />
            <Route path="/chat-ia" element={<ChatIA />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
