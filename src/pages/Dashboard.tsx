import React, { useEffect, useState } from 'react'
import {
  consultasService,
  orcamentosService,
  contratosService,
  financeiroService,
} from '@/services/clinic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Calendar,
  FileText,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  PieChart as PieIcon,
} from 'lucide-react'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)

  // Consultas Stats
  const [consultasAgendadas, setConsultasAgendadas] = useState(0)
  const [consultasDesmarcadas, setConsultasDesmarcadas] = useState(0)
  const [consultasRealizadas, setConsultasRealizadas] = useState(0)

  // Orçamentos Stats
  const [orcamentosEmitidos, setOrcamentosEmitidos] = useState(0)
  const [orcamentosAprovados, setOrcamentosAprovados] = useState(0)
  const [orcamentosReprovados, setOrcamentosReprovados] = useState(0)
  const [valorTotalOrcado, setValorTotalOrcado] = useState(0)
  const [valorAprovado, setValorAprovado] = useState(0)

  // Contratos Stats
  const [contratosAssinados, setContratosAssinados] = useState(0)
  const [contratosPendentes, setContratosPendentes] = useState(0)
  const [valorContratosAssinados, setValorContratosAssinados] = useState(0)

  // Lucros Stats
  const [totalReceitas, setTotalReceitas] = useState(0)
  const [totalDespesas, setTotalDespesas] = useState(0)
  const [lucroLiquido, setLucroLiquido] = useState(0)

  // Monthly breakdown
  const [monthlyData, setMonthlyData] = useState<
    Array<{ month: string; receitas: number; despesas: number; lucro: number }>
  >([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // 1. Consultas
      const consultas = await consultasService.list()
      const agend = consultas.filter((c) => c.status === 'agendada').length
      const desm = consultas.filter((c) => c.status === 'desmarcada').length
      const real = consultas.filter((c) => c.status === 'realizada').length
      setConsultasAgendadas(agend)
      setConsultasDesmarcadas(desm)
      setConsultasRealizadas(real)

      // 2. Orçamentos
      const orcamentos = await orcamentosService.list()
      const emit = orcamentos.filter((o) => o.status === 'emitido').length
      const aprov = orcamentos.filter((o) => o.status === 'aprovado').length
      const reprov = orcamentos.filter((o) => o.status === 'reprovado').length

      const totalOrc = orcamentos.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0)
      const totAprov = orcamentos
        .filter((o) => o.status === 'aprovado')
        .reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0)

      setOrcamentosEmitidos(emit)
      setOrcamentosAprovados(aprov)
      setOrcamentosReprovados(reprov)
      setValorTotalOrcado(totalOrc)
      setValorAprovado(totAprov)

      // 3. Contratos
      const contratos = await contratosService.list()
      const assin = contratos.filter((c) => c.situacao === 'assinado').length
      const pend = contratos.filter((c) => c.situacao === 'pendente').length
      const valAssin = contratos
        .filter((c) => c.situacao === 'assinado')
        .reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0)

      setContratosAssinados(assin)
      setContratosPendentes(pend)
      setValorContratosAssinados(valAssin)

      // 4. Financeiro
      const fin = await financeiroService.list()
      const rec = fin
        .filter((f) => f.tipo === 'receita')
        .reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0)
      const desp = fin
        .filter((f) => f.tipo === 'despesa')
        .reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0)

      setTotalReceitas(rec)
      setTotalDespesas(desp)
      setLucroLiquido(rec - desp)

      // Group by month
      const monthsMap: Record<string, { receitas: number; despesas: number }> = {}
      fin.forEach((f) => {
        const m = f.mes_referencia || f.data.slice(0, 7) || '2025-01'
        if (!monthsMap[m]) monthsMap[m] = { receitas: 0, despesas: 0 }
        if (f.tipo === 'receita') monthsMap[m].receitas += Number(f.valor) || 0
        if (f.tipo === 'despesa') monthsMap[m].despesas += Number(f.valor) || 0
      })

      const monthList = Object.keys(monthsMap)
        .sort()
        .map((m) => ({
          month: m,
          receitas: monthsMap[m].receitas,
          despesas: monthsMap[m].despesas,
          lucro: monthsMap[m].receitas - monthsMap[m].despesas,
        }))
      setMonthlyData(monthList)
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const taxaAprovacao =
    orcamentosEmitidos + orcamentosAprovados + orcamentosReprovados > 0
      ? Math.round(
          (orcamentosAprovados /
            (orcamentosEmitidos + orcamentosAprovados + orcamentosReprovados)) *
            100,
        )
      : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Dashboard de Indicadores
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Visão analítica de consultas, orçamentos, contratos cirúrgicos e margens de lucro.
        </p>
      </div>

      {/* Main Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receita Bruta */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Receita Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Faturamento acumulado
            </p>
          </CardContent>
        </Card>

        {/* Lucro Líquido */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Lucro Líquido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${lucroLiquido >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}
            >
              R$ {lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Despesas: R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        {/* Contratos Fechados */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Contratos Assinados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              R$ {valorContratosAssinados.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-blue-600 font-medium mt-1">
              {contratosAssinados} contrato(s) formalizado(s)
            </p>
          </CardContent>
        </Card>

        {/* Conversão de Orçamentos */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Conversão de Orçamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{taxaAprovacao}%</div>
            <p className="text-[11px] text-slate-500 mt-1">
              {orcamentosAprovados} aprovados de{' '}
              {orcamentosEmitidos + orcamentosAprovados + orcamentosReprovados}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos e Indicadores Detalhados */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Gráfico de Consultas */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-amber-600" />
              Status de Consultas
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Consultas agendadas, realizadas e desmarcadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Visual Bar representation */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1 font-medium">
                  <span className="flex items-center gap-1.5 text-blue-700">
                    <Clock className="h-3.5 w-3.5" /> Agendadas
                  </span>
                  <span className="text-slate-800 font-bold">{consultasAgendadas}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (consultasAgendadas /
                          (consultasAgendadas + consultasRealizadas + consultasDesmarcadas || 1)) *
                          100,
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-medium">
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Realizadas
                  </span>
                  <span className="text-slate-800 font-bold">{consultasRealizadas}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (consultasRealizadas /
                          (consultasAgendadas + consultasRealizadas + consultasDesmarcadas || 1)) *
                          100,
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-medium">
                  <span className="flex items-center gap-1.5 text-rose-700">
                    <XCircle className="h-3.5 w-3.5" /> Desmarcadas / Canceladas
                  </span>
                  <span className="text-slate-800 font-bold">{consultasDesmarcadas}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (consultasDesmarcadas /
                          (consultasAgendadas + consultasRealizadas + consultasDesmarcadas || 1)) *
                          100,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-200">
              Taxa de comparecimento e agendamento contínuo: acompanhe desmarcações para
              reengajamento da equipe de recepção.
            </div>
          </CardContent>
        </Card>

        {/* 2. Gráfico de Orçamentos */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              Orçamentos Emitidos vs Aprovados
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Volume e valores propostos a pacientes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1 font-medium">
                  <span className="text-emerald-700">Aprovados ({orcamentosAprovados})</span>
                  <span className="font-bold text-slate-900">
                    R$ {valorAprovado.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (orcamentosAprovados /
                          (orcamentosEmitidos + orcamentosAprovados + orcamentosReprovados || 1)) *
                          100,
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-medium">
                  <span className="text-amber-700">
                    Em Análise / Emitidos ({orcamentosEmitidos})
                  </span>
                  <span className="font-bold text-slate-900">{orcamentosEmitidos} propostas</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (orcamentosEmitidos /
                          (orcamentosEmitidos + orcamentosAprovados + orcamentosReprovados || 1)) *
                          100,
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-medium">
                  <span className="text-rose-700">Reprovados ({orcamentosReprovados})</span>
                  <span className="font-bold text-slate-900">{orcamentosReprovados} propostas</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (orcamentosReprovados /
                          (orcamentosEmitidos + orcamentosAprovados + orcamentosReprovados || 1)) *
                          100,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-200">
              Total orçado acumulado:{' '}
              <strong className="text-slate-900">
                R$ {valorTotalOrcado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
            </div>
          </CardContent>
        </Card>

        {/* 3. Situação dos Contratos */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-purple-600" />
              Contratos & Cirurgias
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Contratos assinados e cirurgias programadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50">
                <span className="text-xs font-semibold text-emerald-800">Assinados</span>
                <Badge className="bg-emerald-600 text-white font-bold">{contratosAssinados}</Badge>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg border border-amber-200 bg-amber-50/50">
                <span className="text-xs font-semibold text-amber-800">
                  Pendentes de Assinatura
                </span>
                <Badge className="bg-amber-600 text-white font-bold">{contratosPendentes}</Badge>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1 border border-slate-200">
                <p className="font-semibold text-slate-900">Regra de Segurança da Clínica:</p>
                <p className="text-slate-600">
                  Contratos que ultrapassam 12 meses (1 ano) emitem aviso para reavaliação de riscos
                  e exames laboratoriais pelo Dr. Pedro Ivo.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico Comparativo Mensal Financeiro */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-600" />
            Evolução de Lucros e Despesas por Mês
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Comparativo de receitas brutas, custos operacionais e margem líquida
          </CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyData.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 border border-dashed rounded-lg">
              Sem dados suficientes para consolidação mensal.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {monthlyData.map((item) => (
                  <div
                    key={item.month}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-900 border-b pb-2">
                      <span>Mês: {item.month}</span>
                      <Badge
                        variant="outline"
                        className={
                          item.lucro >= 0
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-rose-50 text-rose-800 border-rose-300'
                        }
                      >
                        {item.lucro >= 0 ? 'Lucro' : 'Déficit'}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-slate-600 pt-1">
                      <span>Receitas:</span>
                      <span className="font-semibold text-emerald-700">
                        R$ {item.receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Despesas:</span>
                      <span className="font-semibold text-rose-700">
                        R$ {item.despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-2 text-slate-900">
                      <span>Resultado Líquido:</span>
                      <span className={item.lucro >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                        R$ {item.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
