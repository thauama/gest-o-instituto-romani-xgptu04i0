import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Boxes,
  History,
  Loader2,
  MinusCircle,
  Package,
  Search,
  TrendingDown,
  TrendingUp,
  FileText,
  CalendarClock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { checklistService, itensService, movimentacoesService } from '@/services/clinic'
import type { ChecklistItem, ItemEstoque, Movimentacao } from '@/types/clinic'
import {
  NIVEL_ESTOQUE_BARRA,
  NIVEL_ESTOQUE_CLASSE,
  NIVEL_ESTOQUE_LABEL,
  consolidarEstoque,
  fmtBRL,
  fmtQtd,
  rotuloMovimentacao,
  totaisEstoque,
  type EstoqueItem,
  type NivelEstoque,
  type AlertaValidade,
  ALERTA_VALIDADE_CLASSE,
} from '@/lib/estoque'
import { RelatorioEstoque } from '@/components/estoque/RelatorioEstoque'
import { cn } from '@/lib/utils'

type FiltroSituacao = 'todos' | NivelEstoque

const formataData = (iso: string) => {
  const d = new Date(iso.length <= 10 ? `${iso}T12:00:00` : iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const iconeTipo = (tipo: Movimentacao['tipo']) =>
  tipo === 'entrada' ? (
    <ArrowUpCircle className="h-4 w-4 text-emerald-400" />
  ) : tipo === 'saida' ? (
    <ArrowDownCircle className="h-4 w-4 text-rose-400" />
  ) : (
    <MinusCircle className="h-4 w-4 text-sky-400" />
  )

// ---------------------------------------------------------------- Histórico

function DialogoHistorico({
  item,
  movimentacoes,
  aberto,
  onAbrir,
}: {
  item: EstoqueItem
  movimentacoes: Movimentacao[]
  aberto: boolean
  onAbrir: (aberto: boolean) => void
}) {
  const doItem = movimentacoes.filter((m) => m.item === item.id)
  return (
    <Dialog open={aberto} onOpenChange={onAbrir}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-100">
            <History className="h-5 w-5 text-sky-400" />
            Histórico — {item.nome}
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-slate-300">
          Saldo atual:{' '}
          <span className="font-semibold text-slate-100">
            {fmtQtd(item.quantidade, item.unidade)}
          </span>
          {' · '}
          Estoque mínimo:{' '}
          <span className="font-semibold text-slate-100">
            {fmtQtd(item.estoque_minimo, item.unidade)}
          </span>
        </p>
        {doItem.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">
            Nenhuma movimentação registrada para este material ainda.
          </p>
        ) : (
          <ul className="space-y-2">
            {doItem.map((m) => (
              <li
                key={m.id}
                className="rounded-lg border border-slate-700/70 bg-slate-800/50 px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-100">
                    {iconeTipo(m.tipo)}
                    {rotuloMovimentacao(m.tipo)}
                    <span className="font-bold tabular-nums">
                      {m.tipo === 'entrada' ? '+' : '−'}
                      {fmtQtd(m.quantidade, item.unidade)}
                    </span>
                  </span>
                  <span className="text-xs text-slate-400">{formataData(m.data || m.created)}</span>
                </div>
                {m.observacao && <p className="mt-1 text-xs text-slate-300">{m.observacao}</p>}
                <p className="mt-1 text-[11px] text-slate-400">
                  Registrado por: {m.registrado_por || '—'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ------------------------------------------------------------- Ajuste rápido

function DialogoAjuste({
  item,
  aberto,
  onAbrir,
  onSalvo,
}: {
  item: EstoqueItem
  aberto: boolean
  onAbrir: (aberto: boolean) => void
  onSalvo: () => void
}) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [tipo, setTipo] = useState<'entrada' | 'saida'>('entrada')
  const [quantidade, setQuantidade] = useState('1')
  const [observacao, setObservacao] = useState('')
  const [salvando, setSalvando] = useState(false)

  const qtd = Number(quantidade) || 0
  const excederia = tipo === 'saida' && qtd > item.quantidade

  const salvar = async () => {
    if (qtd <= 0 || salvando) return
    setSalvando(true)
    try {
      await movimentacoesService.create({
        tipo,
        data: new Date().toISOString().slice(0, 10),
        item: item.id,
        quantidade: qtd,
        observacao:
          observacao.trim() ||
          (tipo === 'entrada' ? 'Entrada rápida de estoque' : 'Saída rápida de estoque'),
        registrado_por: user?.name || user?.email || '—',
      })
      toast({
        title: tipo === 'entrada' ? 'Entrada registrada' : 'Saída registrada',
        description: `${item.nome}: ${tipo === 'entrada' ? '+' : '−'}${qtd} ${item.unidade || 'un'}.`,
      })
      onAbrir(false)
      onSalvo()
    } catch (err) {
      toast({
        title: 'Erro ao registrar ajuste',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={onAbrir}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-slate-100">Ajuste rápido — {item.nome}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={tipo === 'entrada' ? 'default' : 'outline'}
              onClick={() => setTipo('entrada')}
              className={cn(
                'justify-start gap-2',
                tipo === 'entrada'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'border-slate-600 bg-transparent text-slate-200 hover:bg-slate-800',
              )}
            >
              <ArrowUpCircle className="h-4 w-4" /> Entrada
            </Button>
            <Button
              type="button"
              variant={tipo === 'saida' ? 'default' : 'outline'}
              onClick={() => setTipo('saida')}
              className={cn(
                'justify-start gap-2',
                tipo === 'saida'
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'border-slate-600 bg-transparent text-slate-200 hover:bg-slate-800',
              )}
            >
              <ArrowDownCircle className="h-4 w-4" /> Saída
            </Button>
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-200">Quantidade ({item.unidade || 'un'})</Label>
            <Input
              type="number"
              min="0"
              step="1"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              className="bg-slate-800 border-slate-600 text-slate-100"
            />
            {excederia && (
              <p className="text-xs text-amber-300">
                Atenção: a saída excede o saldo atual ({fmtQtd(item.quantidade, item.unidade)}). O
                estoque ficará zerado.
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-200">Observação (opcional)</Label>
            <Textarea
              rows={2}
              placeholder="Ex.: NF do fornecedor, paciente, procedimento…"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-500"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => onAbrir(false)}
              className="text-slate-300 hover:text-slate-100 hover:bg-slate-800"
            >
              Cancelar
            </Button>
            <Button onClick={salvar} disabled={qtd <= 0 || salvando}>
              {salvando && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar {tipo}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// -------------------------------------------------------------------- Página

export default function Estoque() {
  const [itens, setItens] = useState<ItemEstoque[] | null>(null)
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([])
  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<'todos' | ItemEstoque['tipo']>('todos')
  const [filtroSituacao, setFiltroSituacao] = useState<FiltroSituacao>('todos')
  const [itemHistorico, setItemHistorico] = useState<EstoqueItem | null>(null)
  const [itemAjuste, setItemAjuste] = useState<EstoqueItem | null>(null)
  const [relatorioAberto, setRelatorioAberto] = useState(false)

  const carregar = async () => {
    // Checklist carregado em paralelo e sem falhar a tela: se não houver
    // vínculos (ou der erro de permissão), o estoque funciona normalmente.
    const [lista, movs, checks] = await Promise.all([
      itensService.list(),
      movimentacoesService.list(),
      checklistService.list().catch(() => [] as ChecklistItem[]),
    ])
    setItens(lista)
    setMovimentacoes(movs)
    setChecklist(checks)
  }

  useEffect(() => {
    carregar().catch(() => setItens([]))
  }, [])

  // Atualização em tempo real: movimentações criadas em outro lugar (ou por outro usuário)
  useRealtime('movimentacoes', () => {
    carregar().catch(() => {})
  })

  const linhas = useMemo(() => {
    return consolidarEstoque(itens || [], checklist)
      .filter((i) => filtroTipo === 'todos' || i.tipo === filtroTipo)
      .filter((i) => filtroSituacao === 'todos' || i.nivel === filtroSituacao)
      .filter((i) => !busca.trim() || i.nome.toLowerCase().includes(busca.trim().toLowerCase()))
  }, [itens, checklist, filtroTipo, filtroSituacao, busca])

  const resumo = useMemo(
    () => totaisEstoque(itens ? consolidarEstoque(itens, checklist) : []),
    [itens, checklist],
  )

  if (itens === null) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64 bg-slate-800" />
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 bg-slate-800" />
          ))}
        </div>
        <Skeleton className="h-96 bg-slate-800" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Estoque de Materiais</h1>
          <p className="text-sm text-slate-400">
            Visão consolidada por material, com níveis, reservas de contratos, valor em estoque e
            histórico de movimentações.
          </p>
        </div>
        <Button
          onClick={() => setRelatorioAberto(true)}
          className="bg-sky-600 hover:bg-sky-500 text-white gap-2"
        >
          <FileText className="h-4 w-4" /> Relatório de estoque
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-slate-900/60 border-slate-700/60 shadow-[0_0_24px_rgba(56,189,248,0.06)] backdrop-blur">
          <CardHeader className="pb-1 px-5 pt-5">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Boxes className="h-3.5 w-3.5 text-sky-400" /> Valor total em estoque
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <div className="text-2xl font-bold text-slate-100">{fmtBRL(resumo.valorTotal)}</div>
            <p className="mt-1 text-[11px] text-slate-400">{itens.length} materiais cadastrados</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/60 border-slate-700/60 shadow-[0_0_24px_rgba(56,189,248,0.06)] backdrop-blur">
          <CardHeader className="pb-1 px-5 pt-5">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-400" /> Em estado crítico
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <div
              className={cn(
                'text-2xl font-bold',
                resumo.criticos > 0 ? 'text-rose-300' : 'text-slate-100',
              )}
            >
              {resumo.criticos}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Zerados ou abaixo de ½ do mínimo</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/60 border-slate-700/60 shadow-[0_0_24px_rgba(56,189,248,0.06)] backdrop-blur">
          <CardHeader className="pb-1 px-5 pt-5">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-amber-400" /> Em nível baixo
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <div
              className={cn(
                'text-2xl font-bold',
                resumo.baixos > 0 ? 'text-amber-300' : 'text-slate-100',
              )}
            >
              {resumo.baixos}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Abaixo do estoque mínimo</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="bg-slate-900/60 border-slate-700/60 backdrop-blur">
        <CardContent className="px-5 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                placeholder="Buscar material…"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-500 pl-9"
              />
            </div>
            <div className="flex gap-1.5">
              {(['todos', 'produto', 'peca', 'servico'] as const).map((t) => (
                <Button
                  key={t}
                  size="sm"
                  variant={filtroTipo === t ? 'default' : 'outline'}
                  onClick={() => setFiltroTipo(t)}
                  className={cn(
                    'h-8',
                    filtroTipo === t
                      ? 'bg-sky-600 hover:bg-sky-500 text-white'
                      : 'border-slate-600 bg-transparent text-slate-200 hover:bg-slate-800',
                  )}
                >
                  {t === 'todos'
                    ? 'Todos'
                    : t === 'produto'
                      ? 'Produtos'
                      : t === 'peca'
                        ? 'Peças'
                        : 'Serviços'}
                </Button>
              ))}
            </div>
            <div className="flex gap-1.5">
              {(['todos', 'critico', 'baixo', 'ok'] as const).map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={filtroSituacao === s ? 'default' : 'outline'}
                  onClick={() => setFiltroSituacao(s)}
                  className={cn(
                    'h-8',
                    filtroSituacao === s
                      ? 'bg-sky-600 hover:bg-sky-500 text-white'
                      : 'border-slate-600 bg-transparent text-slate-200 hover:bg-slate-800',
                  )}
                >
                  {s === 'todos' ? 'Todas' : NIVEL_ESTOQUE_LABEL[s]}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card className="bg-slate-900/60 border-slate-700/60 backdrop-blur overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/80 text-left">
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                  Material
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                  Tipo
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-300 text-right">
                  Em estoque
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                  Nível vs. mínimo
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-300 text-right">
                  Valor em estoque
                </th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-300 text-right">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {linhas.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    Nenhum material encontrado com os filtros atuais.
                  </td>
                </tr>
              )}
              {linhas.map((item) => {
                const min = Number(item.estoque_minimo) || 0
                const pct = min > 0 ? Math.min(100, (item.quantidade / min) * 100) : 100
                return (
                  <tr
                    key={item.id}
                    className={cn(
                      'border-b border-slate-800/80 last:border-0 transition-colors',
                      item.nivel === 'critico'
                        ? 'bg-rose-500/5 hover:bg-rose-500/10'
                        : item.nivel === 'baixo'
                          ? 'bg-amber-500/5 hover:bg-amber-500/10'
                          : 'hover:bg-slate-800/40',
                    )}
                  >
                    <td className="px-5 py-3">
                      <button
                        onClick={() => setItemHistorico(item)}
                        className="text-left font-medium text-slate-100 hover:text-sky-300 hover:underline"
                      >
                        {item.nome}
                      </button>
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        {item.validade && (
                          <Badge
                            variant="outline"
                            className={cn('gap-1', ALERTA_VALIDADE_CLASSE[item.validadeAlerta])}
                            title={
                              item.validade ? `Validade: ${formataData(item.validade)}` : undefined
                            }
                          >
                            <CalendarClock className="h-3 w-3" />
                            {item.validadeAlerta === 'vencido'
                              ? `Vencido ${formataData(item.validade!)}`
                              : item.validadeAlerta === 'vencendo'
                                ? `Vence ${formataData(item.validade!)}`
                                : `Val. ${formataData(item.validade)}`}
                          </Badge>
                        )}
                        {(item.procedimentos?.length || 0) > 0 &&
                          (item.procedimentos!.length <= 2 ? (
                            item.procedimentos!.map((p) => (
                              <Badge
                                key={p}
                                variant="outline"
                                className="border-sky-500/40 bg-sky-500/10 text-sky-300 text-[10px]"
                              >
                                {p}
                              </Badge>
                            ))
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-sky-500/40 bg-sky-500/10 text-sky-300 text-[10px]"
                              title={item.procedimentos!.join(', ')}
                            >
                              {item.procedimentos![0]} +{item.procedimentos!.length - 1}
                            </Badge>
                          ))}
                      </div>
                      {item.descricao && (
                        <p className="text-[11px] text-slate-400 line-clamp-1">{item.descricao}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className="border-slate-600 text-slate-200 capitalize"
                      >
                        {item.tipo === 'peca' ? 'peça' : item.tipo}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span className="font-semibold text-slate-100">
                        {fmtQtd(item.quantidade, item.unidade)}
                      </span>
                      {item.reservado > 0 && (
                        <p className="text-[11px] text-amber-300">
                          reservado {fmtQtd(item.reservado, item.unidade)}
                        </p>
                      )}
                      {min > 0 && (
                        <p className="text-[11px] text-slate-400">
                          mín. {fmtQtd(min, item.unidade)}
                          {item.reservado > 0 && (
                            <span className="text-slate-300">
                              {' '}
                              · disponível {fmtQtd(item.disponivel, item.unidade)}
                            </span>
                          )}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className={cn('h-full rounded-full', NIVEL_ESTOQUE_BARRA[item.nivel])}
                            style={{ width: `${min > 0 ? Math.max(4, pct) : 100}%` }}
                          />
                        </div>
                        <Badge variant="outline" className={NIVEL_ESTOQUE_CLASSE[item.nivel]}>
                          {NIVEL_ESTOQUE_LABEL[item.nivel]}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-100">
                      {fmtBRL(item.valorTotal)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setItemHistorico(item)}
                          className="h-8 gap-1.5 text-slate-200 hover:bg-slate-800 hover:text-slate-100"
                        >
                          <History className="h-3.5 w-3.5" /> Histórico
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setItemAjuste(item)}
                          aria-label={`Ajuste rápido de ${item.nome}`}
                          title="Ajuste rápido (entrada/saída)"
                          className="h-8 gap-1 text-slate-200 hover:bg-slate-800 hover:text-slate-100"
                        >
                          <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                          <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {itemHistorico && (
        <DialogoHistorico
          item={itemHistorico}
          movimentacoes={movimentacoes}
          aberto={!!itemHistorico}
          onAbrir={(a) => !a && setItemHistorico(null)}
        />
      )}
      {itemAjuste && (
        <DialogoAjuste
          item={itemAjuste}
          aberto={!!itemAjuste}
          onAbrir={(a) => !a && setItemAjuste(null)}
          onSalvo={carregar}
        />
      )}

      <RelatorioEstoque
        aberto={relatorioAberto}
        onAbrir={setRelatorioAberto}
        itens={itens}
        checklist={checklist}
      />
    </div>
  )
}
