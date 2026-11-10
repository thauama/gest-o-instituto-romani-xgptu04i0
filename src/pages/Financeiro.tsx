import React, { useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  CalendarRange,
  Filter,
  ListFilter,
  Plus,
  Tag,
  Pencil,
  Trash2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { categoriasFinanceirasService, clientesService, financeiroService } from '@/services/clinic'
import type { CategoriaFinanceira, Cliente, RegistroFinanceiro } from '@/types/clinic'
import { useAuth } from '@/hooks/use-auth'
import DialogoLancamento, {
  CATEGORIAS_DESPESA,
  CATEGORIAS_RECEITA,
  type FormLancamento,
} from '@/components/finance/DialogoLancamento'
import DialogoNotaFiscal from '@/components/finance/DialogoNotaFiscal'
import DialogoCategorias from '@/components/finance/DialogoCategorias'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  KpiCard,
  LinhaComparativa,
  CabecalhoComparativo,
  type KpiFinanceiro,
} from '@/components/finance/KpiFinanceiro'
import {
  GraficoEvolucaoMensal,
  GraficoReceitasCategoria,
  GraficoDespesasCategoria,
  GraficoProcedimentos,
} from '@/components/finance/GraficosFinanceiros'
import {
  addMeses,
  despesasPorCategoria,
  filtrarPorJanela,
  janelaAnterior,
  labelMes,
  receitasPorCategoria,
  serieMensal,
  totaisDe,
  valorPorProcedimento,
  variacaoPct,
  type JanelaPeriodo,
  type ModoPeriodo,
} from '@/lib/finance-analytics'

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fmtBRLCurto = (v: number) => {
  if (Math.abs(v) >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace('.', ',')}M`
  if (Math.abs(v) >= 1_000) return `R$ ${(v / 1_000).toFixed(1).replace('.', ',')}k`
  return `R$ ${v.toFixed(0)}`
}

const hoje = new Date()
const MES_ATUAL = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`

const opcoesMes = (): Array<{ value: string; label: string }> => {
  const ops: Array<{ value: string; label: string }> = []
  let m = MES_ATUAL
  for (let i = 0; i < 18; i++) {
    ops.push({ value: m, label: labelMes(m) })
    m = addMeses(m, -1)
  }
  return ops
}

const modoLabel = (j: JanelaPeriodo): string => {
  if (j.modo === 'tudo') return 'Todo o histórico'
  if (j.modo === 'mes') return labelMes(j.inicio)
  const mi = labelMes(j.inicio.slice(0, 7))
  const mf = labelMes(j.fim.slice(0, 7))
  return mi === mf ? mi : `${j.inicio.slice(8)} ${mi} → ${j.fim.slice(8)} ${mf}`
}

type Aba = 'visao' | 'lancamentos'

export default function Financeiro() {
  const { isAdmin } = useAuth()
  const [loading, setLoading] = useState(true)
  const [registros, setRegistros] = useState<RegistroFinanceiro[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [categorias, setCategorias] = useState<CategoriaFinanceira[]>([])
  const [erro, setErro] = useState('')

  // filtros
  const [modo, setModo] = useState<ModoPeriodo>('mes')
  const [mesSel, setMesSel] = useState(MES_ATUAL)
  const [inicio, setInicio] = useState(() => `${MES_ATUAL}-01`)
  const [fim, setFim] = useState(() => new Date().toISOString().slice(0, 10))

  // lançamentos
  const [aba, setAba] = useState<Aba>('visao')
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'receita' | 'despesa'>('todos')
  const [busca, setBusca] = useState('')

  // diálogos
  const [dialogoAberto, setDialogoAberto] = useState(false)
  const [editando, setEditando] = useState<RegistroFinanceiro | null>(null)
  const [nfRegistro, setNfRegistro] = useState<RegistroFinanceiro | null>(null)
  const [nfAberto, setNfAberto] = useState(false)
  const [dialogoCategoriasAberto, setDialogoCategoriasAberto] = useState(false)
  const [modoCategoriasAberto, setModoCategoriasAberto] = useState(false)
  const [modoFoco, setModoFoco] = useState<'receita' | 'despesa'>('receita')
  const [salvando, setSalvando] = useState(false)

  const meses = useMemo(opcoesMes, [])

  useEffect(() => {
    carregar()
  }, [])

  const carregar = async () => {
    setLoading(true)
    setErro('')
    try {
      const [fin, cls, cats] = await Promise.all([
        financeiroService.list(),
        clientesService.list(),
        categoriasFinanceirasService.list(),
      ])
      setRegistros(fin)
      setClientes(cls)
      setCategorias(cats)
    } catch (err) {
      console.error(err)
      setErro(getErrorMessage(err) || 'Não foi possível carregar os dados financeiros.')
    } finally {
      setLoading(false)
    }
  }

  const janela: JanelaPeriodo = useMemo(() => {
    if (modo === 'tudo') return { modo: 'tudo', inicio: '', fim: '' }
    if (modo === 'mes') return { modo: 'mes', inicio: mesSel, fim: '' }
    return {
      modo: 'intervalo',
      inicio: inicio || `${MES_ATUAL}-01`,
      fim: fim || new Date().toISOString().slice(0, 10),
    }
  }, [modo, mesSel, inicio, fim])

  const filtrados = useMemo(() => filtrarPorJanela(registros, janela), [registros, janela])
  const filtradosAnterior = useMemo(
    () => filtrarPorJanela(registros, janelaAnterior(janela)),
    [registros, janela],
  )

  const totais = useMemo(() => totaisDe(filtrados), [filtrados])
  const totaisAnterior = useMemo(() => totaisDe(filtradosAnterior), [filtradosAnterior])

  const serie = useMemo(() => serieMensal(filtrados, janela), [filtrados, janela])

  const receitasCat = useMemo(() => receitasPorCategoria(filtrados), [filtrados])
  const despesasCat = useMemo(() => despesasPorCategoria(filtrados), [filtrados])
  const procedimentos = useMemo(() => valorPorProcedimento(filtrados), [filtrados])

  // Categorias gerenciadas no banco + fallback das constantes padrão (dedupe case-insensitive)
  const normalizar = (s: string) => s.trim().toLowerCase()
  const categoriasReceita = useMemo(() => {
    const doBanco = categorias
      .filter((c) => c.tipo === 'receita' && c.ativa !== false)
      .map((c) => c.nome)
    const todas = [...doBanco, ...CATEGORIAS_RECEITA]
    const vistas = new Set<string>()
    return todas.filter((n) => {
      const k = normalizar(n)
      if (vistas.has(k)) return false
      vistas.add(k)
      return true
    })
  }, [categorias])

  const categoriasDespesa = useMemo(() => {
    const doBanco = categorias
      .filter((c) => c.tipo === 'despesa' && c.ativa !== false)
      .map((c) => c.nome)
    const todas = [...doBanco, ...CATEGORIAS_DESPESA]
    const vistas = new Set<string>()
    return todas.filter((n) => {
      const k = normalizar(n)
      if (vistas.has(k)) return false
      vistas.add(k)
      return true
    })
  }, [categorias])

  const kpis: KpiFinanceiro[] = [
    {
      titulo: 'Receitas',
      valor: totais.receitas,
      tipo: 'receita',
      variacao: variacaoPct(totais.receitas, totaisAnterior.receitas),
      subtitulo: modo === 'tudo' ? 'histórico completo' : 'vs. período anterior',
    },
    {
      titulo: 'Despesas',
      valor: totais.despesas,
      tipo: 'despesa',
      variacao: variacaoPct(totais.despesas, totaisAnterior.despesas),
      invertido: true,
      subtitulo: modo === 'tudo' ? 'histórico completo' : 'vs. período anterior',
    },
    {
      titulo: 'Lucro bruto',
      valor: totais.lucroBruto,
      tipo: 'lucro',
      variacao: variacaoPct(totais.lucroBruto, totaisAnterior.lucroBruto),
    },
    {
      titulo: 'Lucro líquido',
      valor: totais.lucroLiquido,
      tipo: 'lucro',
      variacao: variacaoPct(totais.lucroLiquido, totaisAnterior.lucroLiquido),
      subtitulo: `margem ${totais.margem.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`,
    },
  ]

  const lancamentos = useMemo(() => {
    let lista = [...filtrados]
    if (filtroTipo !== 'todos') lista = lista.filter((r) => r.tipo === filtroTipo)
    if (busca.trim()) {
      const q = busca.trim().toLowerCase()
      lista = lista.filter(
        (r) =>
          r.descricao?.toLowerCase().includes(q) ||
          (r.categoria || '').toLowerCase().includes(q) ||
          (r.expand?.cliente?.nome || '').toLowerCase().includes(q),
      )
    }
    return lista.sort((a, b) => (b.data || '').localeCompare(a.data || ''))
  }, [filtrados, filtroTipo, busca])

  const abrirNovo = () => {
    setEditando(null)
    setDialogoAberto(true)
  }
  const abrirEdicao = (r: RegistroFinanceiro) => {
    setEditando(r)
    setDialogoAberto(true)
  }

  const salvarLancamento = async (form: FormLancamento) => {
    setSalvando(true)
    try {
      const payload: Partial<RegistroFinanceiro> = {
        tipo: form.tipo,
        descricao: form.descricao.trim(),
        valor: Number(form.valor),
        data: form.data,
        categoria: form.categoria,
        mes_referencia: form.mes_referencia,
        cliente: form.cliente === 'none' ? '' : form.cliente,
      }
      if (editando) {
        await financeiroService.update(editando.id, payload)
        toast({ title: 'Lançamento atualizado' })
      } else {
        await financeiroService.create(payload)
        toast({ title: 'Lançamento registrado' })
      }
      setDialogoAberto(false)
      setEditando(null)
      await carregar()
    } catch (err) {
      toast({
        title: 'Erro ao salvar lançamento',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  const excluirLancamento = async (r: RegistroFinanceiro) => {
    if (!confirm(`Excluir o lançamento "${r.descricao}"?`)) return
    try {
      await financeiroService.delete(r.id)
      toast({ title: 'Lançamento excluído' })
      await carregar()
    } catch (err) {
      toast({ title: 'Erro ao excluir', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  const marcarNf = (id: string, email: string) => {
    setRegistros((rs) =>
      rs.map((r) =>
        r.id === id ? { ...r, nf_solicitada: true, nf_email_destinatario: email } : r,
      ),
    )
    setNfAberto(false)
    setNfRegistro(null)
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Controle Financeiro</h1>
          <p className="text-xs text-slate-300 mt-1">
            Receitas, despesas e margens da clínica — atualizado em{' '}
            {new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setModoCategoriasAberto(true)}
            className="border-slate-600 bg-slate-800/60 text-slate-100 hover:bg-slate-700/60 hover:text-white"
          >
            <Tag className="h-4 w-4 mr-1" /> Categorias
          </Button>
          {isAdmin && (
            <Button
              onClick={abrirNovo}
              className="bg-sky-600 hover:bg-sky-500 text-white shadow-[0_0_18px_rgba(56,189,248,0.35)]"
            >
              <Plus className="h-4 w-4 mr-1" /> Novo lançamento
            </Button>
          )}
        </div>
      </div>

      {erro && (
        <div className="rounded-lg border border-rose-800/60 bg-rose-950/40 p-3 text-xs text-rose-200">
          {erro} —{' '}
          <button onClick={carregar} className="underline font-semibold">
            tentar novamente
          </button>
        </div>
      )}

      {/* Filtros de período */}
      <Card className="bg-slate-900/60 border-slate-700/60 backdrop-blur">
        <CardContent className="px-5 py-4">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">
            <div className="space-y-1.5 min-w-[180px]">
              <Label className="text-[11px] uppercase tracking-wider text-slate-300">Período</Label>
              <Select value={modo} onValueChange={(v) => setModo(v as ModoPeriodo)}>
                <SelectTrigger className="bg-slate-800/60 border-slate-700 text-slate-100 w-[180px]">
                  <CalendarRange className="h-4 w-4 mr-1 text-sky-400" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-slate-100">
                  <SelectItem value="mes">Por mês</SelectItem>
                  <SelectItem value="intervalo">Intervalo personalizado</SelectItem>
                  <SelectItem value="tudo">Todo o histórico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {modo === 'mes' && (
              <div className="space-y-1.5 min-w-[160px]">
                <Label className="text-[11px] uppercase tracking-wider text-slate-300">
                  Mês de referência
                </Label>
                <Select value={mesSel} onValueChange={setMesSel}>
                  <SelectTrigger className="bg-slate-800/60 border-slate-700 text-slate-100 w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-slate-100 max-h-72">
                    {meses.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {modo === 'intervalo' && (
              <div className="flex items-end gap-3 flex-wrap">
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider text-slate-300">De</Label>
                  <Input
                    type="date"
                    value={inicio}
                    onChange={(e) => setInicio(e.target.value)}
                    className="bg-slate-800/60 border-slate-700 text-slate-100 w-[150px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider text-slate-300">Até</Label>
                  <Input
                    type="date"
                    value={fim}
                    onChange={(e) => setFim(e.target.value)}
                    className="bg-slate-800/60 border-slate-700 text-slate-100 w-[150px]"
                  />
                </div>
              </div>
            )}

            <div className="lg:ml-auto flex items-center gap-2 text-xs text-slate-300">
              <Filter className="h-3.5 w-3.5 text-sky-400" />
              Exibindo: <span className="font-semibold text-slate-100">{modoLabel(janela)}</span>
              <span className="text-slate-400">·</span>
              <span>{totais.lancamentos} lançamento(s)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[120px] rounded-xl bg-slate-800/60" />
            ))
          : kpis.map((k) => <KpiCard key={k.titulo} kpi={k} />)}
      </div>

      {/* Gráficos */}
      <div className="space-y-6">
        <GraficoEvolucaoMensal dados={serie} loading={loading} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GraficoReceitasCategoria dados={receitasCat} loading={loading} />
          <GraficoDespesasCategoria dados={despesasCat} loading={loading} />
        </div>
        <GraficoProcedimentos dados={procedimentos} loading={loading} />
      </div>

      {/* Comparativo de períodos */}
      <Card className="bg-slate-900/60 border-slate-700/60 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-sky-400" />
            Comparativo de períodos
          </CardTitle>
          <CardDescription className="text-xs text-slate-300">
            Período atual <span className="text-slate-100 font-medium">
              {modoLabel(janela)}
            </span>{' '}
            contra{' '}
            <span className="text-slate-100 font-medium">
              {janela.modo === 'tudo' ? '—' : modoLabel(janelaAnterior(janela))}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {janela.modo === 'tudo' ? (
            <p className="text-xs text-slate-300">
              Selecione um mês ou intervalo para comparar com o período anterior.
            </p>
          ) : (
            <>
              <CabecalhoComparativo rotulo="Indicador" />
              <LinhaComparativa
                titulo="Receitas"
                atual={totais.receitas}
                anterior={totaisAnterior.receitas}
              />
              <LinhaComparativa
                titulo="Despesas"
                atual={totais.despesas}
                anterior={totaisAnterior.despesas}
                invertido
              />
              <LinhaComparativa
                titulo="Lucro bruto"
                atual={totais.lucroBruto}
                anterior={totaisAnterior.lucroBruto}
              />
              <LinhaComparativa
                titulo="Lucro líquido"
                atual={totais.lucroLiquido}
                anterior={totaisAnterior.lucroLiquido}
              />
              <LinhaComparativa
                titulo="Margem líquida"
                atual={totais.margem}
                anterior={totaisAnterior.margem}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Lançamentos */}
      <Card className="bg-slate-900/60 border-slate-700/60 backdrop-blur">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <ListFilter className="h-4 w-4 text-sky-400" />
                Lançamentos do período
              </CardTitle>
              <CardDescription className="text-xs text-slate-300">
                Registre, edite e solicite notas fiscais.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Buscar descrição, categoria, cliente…"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="bg-slate-800/60 border-slate-700 text-slate-100 h-9 w-56 text-xs placeholder:text-slate-400"
              />
              <Select
                value={filtroTipo}
                onValueChange={(v) => setFiltroTipo(v as typeof filtroTipo)}
              >
                <SelectTrigger className="bg-slate-800/60 border-slate-700 text-slate-100 h-9 w-[130px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-slate-100">
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="receita">Receitas</SelectItem>
                  <SelectItem value="despesa">Despesas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg bg-slate-800/60" />
              ))}
            </div>
          ) : lancamentos.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-300 border border-dashed border-slate-600 rounded-lg">
              Nenhum lançamento no período/filtro selecionado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-slate-300 border-b border-slate-700">
                    <th className="py-2 pr-3">Data</th>
                    <th className="py-2 pr-3">Descrição</th>
                    <th className="py-2 pr-3">Categoria</th>
                    <th className="py-2 pr-3">Cliente</th>
                    <th className="py-2 pr-3 text-right">Valor</th>
                    <th className="py-2 pr-3 text-center">NF</th>
                    <th className="py-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {lancamentos.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-slate-800/70 hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2.5 pr-3 text-slate-300 whitespace-nowrap">
                        {r.data ? new Date(r.data + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td
                        className="py-2.5 pr-3 text-slate-200 max-w-[260px] truncate"
                        title={r.descricao}
                      >
                        {r.descricao}
                      </td>
                      <td className="py-2.5 pr-3">
                        <Badge
                          variant="outline"
                          className={
                            r.tipo === 'receita'
                              ? 'border-emerald-700/60 bg-emerald-950/40 text-emerald-300'
                              : 'border-rose-700/60 bg-rose-950/40 text-rose-300'
                          }
                        >
                          {r.categoria || r.tipo}
                        </Badge>
                      </td>
                      <td className="py-2.5 pr-3 text-slate-300 max-w-[160px] truncate">
                        {r.expand?.cliente?.nome || '—'}
                      </td>
                      <td
                        className={`py-2.5 pr-3 text-right font-bold tabular-nums whitespace-nowrap ${
                          r.tipo === 'receita' ? 'text-emerald-300' : 'text-rose-300'
                        }`}
                      >
                        {r.tipo === 'receita' ? '+' : '−'} R$ {fmtBRL(Number(r.valor) || 0)}
                      </td>
                      <td className="py-2.5 pr-3 text-center">
                        {r.tipo === 'receita' ? (
                          <button
                            onClick={() => {
                              setNfRegistro(r)
                              setNfAberto(true)
                            }}
                            className="text-[11px] underline underline-offset-2 text-sky-300 hover:text-sky-200"
                          >
                            {r.nf_solicitada ? 'Solicitada' : 'Solicitar'}
                          </button>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => abrirEdicao(r)}
                          className="h-7 w-7 p-0 text-slate-300 hover:text-sky-300 hover:bg-slate-800"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => excluirLancamento(r)}
                          className="h-7 w-7 p-0 text-slate-300 hover:text-rose-300 hover:bg-slate-800"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <DialogoLancamento
        open={dialogoAberto}
        editando={editando}
        clientes={clientes}
        categoriasReceita={categoriasReceita}
        categoriasDespesa={categoriasDespesa}
        onClose={() => {
          setDialogoAberto(false)
          setEditando(null)
        }}
        onSave={salvarLancamento}
      />
      <DialogoCategorias
        open={dialogoCategoriasAberto}
        isAdmin={isAdmin}
        onClose={() => setDialogoCategoriasAberto(false)}
        onMudou={carregar}
      />
      <Dialog
        open={modoCategoriasAberto}
        onOpenChange={(v) => !v && setModoCategoriasAberto(false)}
      >
        <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-100">
              <Tag className="h-4 w-4 text-sky-400" /> Categorias — modo de acesso
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              As categorias de receita e despesa são gerenciadas apenas pelo administrador.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-1">
            <button
              type="button"
              onClick={() => {
                setModoCategoriasAberto(false)
                setDialogoCategoriasAberto(true)
              }}
              className="w-full text-left rounded-lg border border-slate-700 bg-slate-800/40 p-3 text-slate-100 hover:bg-slate-800/80 transition-colors"
            >
              <span className="block text-sm font-medium">Gerenciar categorias</span>
              <span className="block text-xs text-slate-300">
                Abrir o gerenciador completo (criar, renomear, excluir)
              </span>
            </button>
            <div className="grid gap-3 sm:grid-cols-2 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-200">Foco inicial</Label>
                <RadioGroup
                  value={modoFoco}
                  onValueChange={(v) => setModoFoco(v as 'receita' | 'despesa')}
                  className="flex gap-4 pt-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="receita" id="modo-foco-receita" />
                    <Label htmlFor="modo-foco-receita" className="text-xs text-slate-100">
                      Receita
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="despesa" id="modo-foco-despesa" />
                    <Label htmlFor="modo-foco-despesa" className="text-xs text-slate-100">
                      Despesa
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              <p className="text-xs text-slate-300 self-end">
                A escolha apenas destaca o tipo ao abrir o gerenciador; ambos os tipos ficam
                visíveis.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <DialogoNotaFiscal
        registro={nfRegistro}
        open={nfAberto}
        onClose={() => {
          setNfAberto(false)
          setNfRegistro(null)
        }}
        onSolicitada={marcarNf}
      />
    </div>
  )
}
