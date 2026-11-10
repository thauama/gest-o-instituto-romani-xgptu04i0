import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import {
  clientesService,
  itensService,
  movimentacoesService,
  contratosService,
  orcamentosService,
  consultasService,
  financeiroService,
} from '@/services/clinic'
import type { ItemEstoque, Movimentacao, Contrato, Consulta } from '@/types/clinic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Package,
  Calendar,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  FileCheck,
  AlertCircle,
  PlusCircle,
  Clock,
  Sparkles,
} from 'lucide-react'

export default function Resumo() {
  const { user, isAdmin } = useAuth()
  const [loading, setLoading] = useState(true)

  const [totalClientes, setTotalClientes] = useState(0)
  const [totalConsultasHoje, setTotalConsultasHoje] = useState(0)
  const [itensFalta, setItensFalta] = useState<ItemEstoque[]>([])
  const [ultimasMovimentacoes, setUltimasMovimentacoes] = useState<Movimentacao[]>([])
  const [contratosAlerta, setContratosAlerta] = useState<Contrato[]>([])
  const [consultasProximas, setConsultasProximas] = useState<Consulta[]>([])
  const [lucroMes, setLucroMes] = useState<{ receitas: number; despesas: number; liquido: number }>(
    {
      receitas: 0,
      despesas: 0,
      liquido: 0,
    },
  )

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const today = new Date().toISOString().slice(0, 10)
      const thisMonth = today.slice(0, 7)

      // Fetch Clientes
      const clients = await clientesService.list()
      setTotalClientes(clients.length)

      // Fetch Itens & identify low stock
      const items = await itensService.list()
      const lowStock = items.filter((it) => it.quantidade <= (it.estoque_minimo || 0))
      setItensFalta(lowStock)

      // Fetch Movimentacoes
      const movs = await movimentacoesService.list('', '-created')
      setUltimasMovimentacoes(movs.slice(0, 5))

      // Fetch Contratos & identify > 1 year
      const conts = await contratosService.list()
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
      const oneYearAgoStr = oneYearAgo.toISOString().slice(0, 10)

      const expiredConts = conts.filter(
        (c) =>
          c.situacao !== 'concluido' &&
          c.situacao !== 'cancelado' &&
          c.data_emissao <= oneYearAgoStr,
      )
      setContratosAlerta(expiredConts)

      // Fetch Consultas
      const conss = await consultasService.list(`data >= "${today}"`, 'data,horario')
      setConsultasProximas(conss.slice(0, 4))
      const hojeCons = conss.filter((c) => c.data === today)
      setTotalConsultasHoje(hojeCons.length)

      // Fetch Financeiro if Admin
      if (isAdmin) {
        const finRecords = await financeiroService.list()
        const currentMonthRecords = finRecords.filter((r) => r.data.startsWith(thisMonth))
        const rec = currentMonthRecords
          .filter((r) => r.tipo === 'receita')
          .reduce((acc, curr) => acc + Number(curr.valor), 0)
        const desp = currentMonthRecords
          .filter((r) => r.tipo === 'despesa')
          .reduce((acc, curr) => acc + Number(curr.valor), 0)
        setLucroMes({ receitas: rec, despesas: desp, liquido: rec - desp })
      }
    } catch (err) {
      console.error('Erro ao carregar dados do resumo:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Olá, {user?.name || 'Dr. Pedro Ivo'}
            </h1>
            <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100 border-amber-300 font-semibold text-[11px]">
              {isAdmin ? 'Direção Clínica' : 'Equipe Romani'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Painel resumo operacional e clínico do Instituto Romani em Sorocaba-SP.
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm" variant="outline" className="text-xs h-9">
            <Link to="/agenda">
              <Calendar className="h-3.5 w-3.5 mr-1.5 text-amber-600" />
              Agenda do Dia
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="text-xs h-9">
            <Link to="/clientes">
              <PlusCircle className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
              Novo Cliente
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-9"
          >
            <Link to="/chat-ia">
              <Sparkles className="h-3.5 w-3.5 mr-1.5 text-amber-400" />
              Assistente IA
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pacientes */}
        <Card className="border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total de Pacientes
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalClientes}</div>
            <p className="text-[11px] text-slate-500 mt-1">Pacientes cadastrados na clínica</p>
          </CardContent>
        </Card>

        {/* Consultas Hoje */}
        <Card className="border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Consultas Hoje
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Calendar className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalConsultasHoje}</div>
            <p className="text-[11px] text-slate-500 mt-1">Atendimentos e avaliações agendadas</p>
          </CardContent>
        </Card>

        {/* Alerta de Estoque */}
        <Card
          className={`shadow-sm transition-colors ${
            itensFalta.length > 0 ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Itens em Falta / Baixo
            </CardTitle>
            <div
              className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                itensFalta.length > 0
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Package className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{itensFalta.length}</div>
            <p className="text-[11px] text-slate-500 mt-1">
              {itensFalta.length > 0 ? 'Abaixo do estoque de segurança' : 'Estoque regular'}
            </p>
          </CardContent>
        </Card>

        {/* Contratos com Alerta (+1 ano) */}
        <Card
          className={`shadow-sm transition-colors ${
            contratosAlerta.length > 0 ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Contratos &gt; 1 Ano
            </CardTitle>
            <div
              className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                contratosAlerta.length > 0
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{contratosAlerta.length}</div>
            <p className="text-[11px] text-slate-500 mt-1">Exigem revisão antes da cirurgia</p>
          </CardContent>
        </Card>
      </div>

      {/* Financial highlight for Admin */}
      {isAdmin && (
        <Card className="border-slate-200 shadow-sm bg-gradient-to-r from-slate-900 to-slate-800 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase font-semibold text-amber-400 tracking-wider">
                  Visão Financeira do Mês
                </span>
                <h3 className="text-xl font-bold text-white mt-1">
                  Lucro Líquido:{' '}
                  <span className={lucroMes.liquido >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    R$ {lucroMes.liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Receitas: R${' '}
                  {lucroMes.receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ·
                  Despesas: R${' '}
                  {lucroMes.despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <Button
                asChild
                variant="outline"
                className="border-slate-600 bg-slate-800/80 text-white hover:bg-slate-700 text-xs"
              >
                <Link to="/financeiro">
                  Ver Balanço Completo & NF
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Grid: Alertas de Contratos e Itens em Falta */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerta de Contratos com mais de 1 ano */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                Alertas de Contratos (&gt; 1 ano)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Procedimentos cujo contrato completou 12 meses
              </CardDescription>
            </div>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-xs text-amber-700 hover:text-amber-800"
            >
              <Link to="/contratos">Ver todos</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {contratosAlerta.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 border border-dashed rounded-lg bg-slate-50">
                Nenhum contrato pendente com mais de 1 ano. Todos os contratos estão vigentes!
              </div>
            ) : (
              contratosAlerta.map((c) => (
                <div
                  key={c.id}
                  className="flex items-start justify-between p-3 rounded-lg border border-rose-200 bg-rose-50/40 text-xs"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-900">
                      {c.expand?.cliente?.nome || 'Paciente'}
                    </p>
                    <p className="text-slate-600">{c.procedimento}</p>
                    <div className="flex items-center gap-2 text-[11px] text-rose-700 font-medium">
                      <span>Emissão: {c.data_emissao}</span>
                      <span>·</span>
                      <span>Previsto: {c.previsao_procedimento || 'A definir'}</span>
                    </div>
                  </div>
                  <Badge variant="destructive" className="text-[10px] uppercase">
                    Atenção (+1 ano)
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Itens em falta ou com estoque baixo */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Package className="h-4 w-4 text-amber-600" />
                Itens em Falta ou Baixo Estoque
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Materiais e produtos cirúrgicos que demandam reposição
              </CardDescription>
            </div>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-xs text-amber-700 hover:text-amber-800"
            >
              <Link to="/itens">Gerenciar Estoque</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {itensFalta.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 border border-dashed rounded-lg bg-slate-50">
                Nenhum item com estoque crítico no momento.
              </div>
            ) : (
              itensFalta.map((it) => (
                <div
                  key={it.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-amber-200 bg-amber-50/30 text-xs"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{it.nome}</p>
                    <p className="text-[11px] text-slate-500 capitalize">
                      Tipo: {it.tipo} · Mínimo recomendado: {it.estoque_minimo} {it.unidade || 'un'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      {it.quantidade} {it.unidade || 'un'} restante
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Secondary Grid: Próximas Consultas & Últimas Movimentações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximas Consultas */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-700" />
                Próximas Consultas da Agenda
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Atendimentos previstos para os próximos dias
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs text-slate-700">
              <Link to="/agenda">Ver Agenda</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {consultasProximas.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 border border-dashed rounded-lg bg-slate-50">
                Nenhuma consulta agendada para hoje ou próximos dias.
              </div>
            ) : (
              consultasProximas.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold shrink-0">
                      <Clock className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {c.expand?.cliente?.nome || 'Paciente'}
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        {c.tipo || 'Consulta'} · {c.data} às {c.horario || 'Horário livre'}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      c.status === 'agendada'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : c.status === 'realizada'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {c.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Últimas Movimentações */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-slate-700" />
                Últimas Movimentações do Dia
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Entradas, saídas de materiais e atendimentos
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs text-slate-700">
              <Link to="/movimentacoes">Ver histórico</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {ultimasMovimentacoes.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 border border-dashed rounded-lg bg-slate-50">
                Nenhuma movimentação registrada recentemente.
              </div>
            ) : (
              ultimasMovimentacoes.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] capitalize ${
                          m.tipo === 'entrada'
                            ? 'bg-emerald-100 text-emerald-800'
                            : m.tipo === 'saida'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {m.tipo}
                      </Badge>
                      <span className="font-semibold text-slate-800">
                        {m.expand?.item?.nome ||
                          m.expand?.cliente?.nome ||
                          'Registro de atendimento'}
                      </span>
                    </div>
                    {m.observacao && (
                      <p className="text-slate-500 text-[11px] truncate max-w-sm">{m.observacao}</p>
                    )}
                  </div>
                  <span className="text-slate-400 text-[11px] shrink-0">{m.data}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
