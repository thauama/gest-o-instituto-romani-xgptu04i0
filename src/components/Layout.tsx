import React, { useState } from 'react'
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import {
  LayoutDashboard,
  Users,
  Package,
  Calendar,
  FileText,
  DollarSign,
  ArrowLeftRight,
  Warehouse,
  Bot,
  LogOut,
  Menu,
  X,
  Stethoscope,
  Shield,
  UserCheck,
  ChevronRight,
  TrendingUp,
  ClipboardList,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function Layout() {
  const { user, isAdmin, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { name: 'Painel Resumo', path: '/painel', icon: LayoutDashboard },
    { name: 'Dashboard Indicadores', path: '/dashboard', icon: TrendingUp },
    { name: 'Agenda Google', path: '/agenda', icon: Calendar },
    { name: 'Clientes & Pacientes', path: '/clientes', icon: Users },
    { name: 'Itens & Estoque', path: '/itens', icon: Package },
    { name: 'Movimentações', path: '/movimentacoes', icon: ArrowLeftRight },
    { name: 'Controle de Estoque', path: '/estoque', icon: Warehouse },
    { name: 'Contratos & Orçamentos', path: '/contratos', icon: FileText },
    // Only Admin can see full financial
    ...(isAdmin
      ? [{ name: 'Controle Financeiro', path: '/financeiro', icon: DollarSign, badge: 'Admin' }]
      : []),
    ...(isAdmin
      ? [{ name: 'Prontuário', path: '/prontuario', icon: ClipboardList, badge: 'Admin' }]
      : []),
    ...(isAdmin ? [{ name: 'Permissões', path: '/usuarios', icon: Shield, badge: 'Admin' }] : []),
    { name: 'Assistente de Gestão IA', path: '/chat-ia', icon: Bot, highlight: true },
  ]

  const handleLogout = () => {
    signOut()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-slate-100/70 text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-slate-200 bg-white shadow-sm shrink-0">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-bold shadow-sm">
              <Stethoscope className="h-5 w-5 text-slate-950" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm leading-tight">Instituto Romani</h2>
              <p className="text-[11px] text-amber-700 font-medium">Cirurgia Plástica · Sorocaba</p>
            </div>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 mx-3 my-3 rounded-lg bg-slate-50 border border-slate-200/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-amber-400 text-xs font-semibold shrink-0">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'IR'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-800 truncate">
                  {user?.name || 'Usuário'}
                </p>
                <div className="flex items-center gap-1">
                  {isAdmin ? (
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-amber-50 text-amber-800 border-amber-300 py-0 px-1.5 h-4"
                    >
                      <Shield className="h-2.5 w-2.5 mr-0.5" /> Administrador
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-slate-100 text-slate-700 border-slate-300 py-0 px-1.5 h-4"
                    >
                      <UserCheck className="h-2.5 w-2.5 mr-0.5" /> Equipe
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  active
                    ? 'bg-slate-900 text-white shadow-sm'
                    : item.highlight
                      ? 'bg-amber-50 text-amber-900 hover:bg-amber-100/70 border border-amber-200/60'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`h-4 w-4 ${active ? 'text-amber-400' : item.highlight ? 'text-amber-600' : 'text-slate-500'}`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && !active && (
                  <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    {item.badge}
                  </span>
                )}
                {active && <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-medium"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair do Sistema
          </Button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-slate-950 font-bold">
              <Stethoscope className="h-4 w-4" />
            </div>
            <span className="font-bold text-sm text-slate-900">Instituto Romani</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-slate-600"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </header>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white p-4 space-y-2">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-800">{user?.name}</p>
                <p className="text-[11px] text-slate-500">{isAdmin ? 'Administrador' : 'Equipe'}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleLogout}
                className="text-rose-600 text-xs"
              >
                Sair
              </Button>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between p-2.5 rounded-lg text-xs font-medium ${
                      active ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </div>
                  </Link>
                )
              })}
            </nav>
          </div>
        )}

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
