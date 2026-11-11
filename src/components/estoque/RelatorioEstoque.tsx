import { useMemo, useState } from 'react'
import { FileDown, FileSpreadsheet, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ALERTA_VALIDADE_CLASSE,
  ALERTA_VALIDADE_LABEL,
  NIVEL_ESTOQUE_CLASSE,
  NIVEL_ESTOQUE_LABEL,
  consolidarEstoque,
  fmtBRL,
  fmtQtd,
} from '@/lib/estoque'
import type { ChecklistItem, Contrato, ItemEstoque } from '@/types/clinic'
import { cn } from '@/lib/utils'

/**
 * Relatório de estoque: posição atual consolidada, reservas por contrato,
 * data de emissão e download CSV. Somente leitura — nada aqui grava dados.
 */
export function RelatorioEstoque({
  aberto,
  onAbrir,
  itens,
  checklist,
  contratos,
}: {
  aberto: boolean
  onAbrir: (aberto: boolean) => void
  itens: ItemEstoque[]
  checklist: ChecklistItem[]
  contratos?: Contrato[]
}) {
  const [gerandoCsv, setGerandoCsv] = useState(false)

  const linhas = useMemo(() => consolidarEstoque(itens, checklist), [itens, checklist])

  const reservasPorContrato = useMemo(() => {
    // checklist pendente (não concluído) agrupado pelo contrato vinculado
    const mapa = new Map<string, { contrato?: Contrato; itens: { nome: string; qtd: number }[] }>()
    for (const ch of checklist) {
      if (!ch.item || ch.situacao === 'concluido') continue
      const key = ch.contrato
      const entry = mapa.get(key) || {
        contrato: contratos?.find((c) => c.id === key),
        itens: [] as { nome: string; qtd: number }[],
      }
      entry.itens.push({
        nome: ch.expand?.item?.nome || 'Material',
        qtd: Number(ch.quantidade) || 1,
      })
      mapa.set(key, entry)
    }
    return mapa
  }, [checklist, contratos])

  const totais = useMemo(
    () => ({
      valorTotal: linhas.reduce((s, i) => s + i.valorTotal, 0),
      criticos: linhas.filter((i) => i.nivel === 'critico').length,
      baixos: linhas.filter((i) => i.nivel === 'baixo').length,
      vencidos: linhas.filter((i) => i.validadeAlerta === 'vencido').length,
      vencendo: linhas.filter((i) => i.validadeAlerta === 'vencendo').length,
    }),
    [linhas],
  )

  const emitidoEm = useMemo(
    () =>
      new Date().toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    // data fixada quando o diálogo abre (não re-renderiza a cada segundo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [aberto],
  )

  const baixarCsv = () => {
    setGerandoCsv(true)
    try {
      const esc = (v: string | number) => {
        const s = String(v ?? '')
        return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
      }
      const header = [
        'Material',
        'Tipo',
        'Unidade',
        'Em estoque',
        'Reservado (checklists)',
        'Disponível',
        'Estoque mínimo',
        'Nível',
        'Preço unitário',
        'Valor em estoque',
        'Validade',
        'Alerta de validade',
        'Procedimentos vinculados',
      ]
      const linhasCsv = linhas.map((i) =>
        [
          i.nome,
          i.tipo,
          i.unidade || 'un',
          i.quantidade,
          i.reservado,
          i.disponivel,
          i.estoque_minimo,
          NIVEL_ESTOQUE_LABEL[i.nivel],
          (Number(i.preco) || 0).toFixed(2).replace('.', ','),
          i.valorTotal.toFixed(2).replace('.', ','),
          i.validade || '',
          ALERTA_VALIDADE_LABEL[i.validadeAlerta],
          (i.procedimentos || []).join(' | '),
        ]
          .map(esc)
          .join(';'),
      )
      const totalizador = [
        'TOTAL',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        totais.valorTotal.toFixed(2).replace('.', ','),
        '',
        '',
        '',
      ]
      const csv = [
        'Relatório de Estoque — Instituto Romani',
        ['Emitido em', emitidoEm].map(esc).join(';'),
        '',
        header.join(';'),
        ...linhasCsv,
        totalizador.map(esc).join(';'),
      ].join('\n')

      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `relatorio-estoque-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setGerandoCsv(false)
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={onAbrir}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-100">
            <FileSpreadsheet className="h-5 w-5 text-sky-400" />
            Relatório de Estoque — Instituto Romani
          </DialogTitle>
          <DialogDescription className="text-slate-300 text-xs">
            Emitido em {emitidoEm} · {linhas.length} materiais · posição atual, reservas por
            contrato e validade.
          </DialogDescription>
        </DialogHeader>

        {/* Resumo do relatório */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          <div className="rounded-lg border border-slate-700/70 bg-slate-800/50 p-2.5">
            <p className="text-[10px] uppercase tracking-wider text-slate-300">Valor total</p>
            <p className="text-lg font-bold text-slate-100">{fmtBRL(totais.valorTotal)}</p>
          </div>
          <div className="rounded-lg border border-slate-700/70 bg-slate-800/50 p-2.5">
            <p className="text-[10px] uppercase tracking-wider text-slate-300">Críticos</p>
            <p
              className={cn(
                'text-lg font-bold',
                totais.criticos ? 'text-rose-300' : 'text-slate-100',
              )}
            >
              {totais.criticos}
            </p>
          </div>
          <div className="rounded-lg border border-slate-700/70 bg-slate-800/50 p-2.5">
            <p className="text-[10px] uppercase tracking-wider text-slate-300">Vencidos</p>
            <p
              className={cn(
                'text-lg font-bold',
                totais.vencidos ? 'text-rose-300' : 'text-slate-100',
              )}
            >
              {totais.vencidos}
            </p>
          </div>
          <div className="rounded-lg border border-slate-700/70 bg-slate-800/50 p-2.5">
            <p className="text-[10px] uppercase tracking-wider text-slate-300">Vencendo (60d)</p>
            <p
              className={cn(
                'text-lg font-bold',
                totais.vencendo ? 'text-amber-300' : 'text-slate-100',
              )}
            >
              {totais.vencendo}
            </p>
          </div>
        </div>

        {/* Tabela de posição */}
        <div className="overflow-y-auto rounded-lg border border-slate-700/70">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-800/95 backdrop-blur">
              <tr className="text-left">
                <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                  Material
                </th>
                <th className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-300 text-right">
                  Estoque
                </th>
                <th className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-300 text-right">
                  Reservado
                </th>
                <th className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                  Nível
                </th>
                <th className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                  Validade
                </th>
                <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                  Procedimentos
                </th>
              </tr>
            </thead>
            <tbody>
              {linhas.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-slate-400">
                    Nenhum material cadastrado.
                  </td>
                </tr>
              )}
              {linhas.map((i) => (
                <tr key={i.id} className="border-t border-slate-800/80">
                  <td className="px-3 py-2 font-medium text-slate-100">
                    {i.nome}
                    {i.reservado > 0 && (
                      <p className="text-[10px] text-amber-300">
                        reservado para:{' '}
                        {[...reservasPorContrato.values()]
                          .filter((r) =>
                            r.itens.some((it) =>
                              checklist.some(
                                (c) =>
                                  c.item === i.id &&
                                  c.situacao !== 'concluido' &&
                                  c.contrato === (r.contrato?.id || ''),
                              ),
                            ),
                          )
                          .map((r) => r.contrato?.expand?.cliente?.nome || 'Contrato')
                          .join(', ') || 'contrato(s)'}
                      </p>
                    )}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums text-slate-100">
                    {fmtQtd(i.quantidade, i.unidade)}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums text-slate-100">
                    {i.reservado > 0 ? fmtQtd(i.reservado, i.unidade) : '—'}
                  </td>
                  <td className="px-2 py-2">
                    <Badge variant="outline" className={NIVEL_ESTOQUE_CLASSE[i.nivel]}>
                      {NIVEL_ESTOQUE_LABEL[i.nivel]}
                    </Badge>
                  </td>
                  <td className="px-2 py-2">
                    {i.validade ? (
                      <div className="space-y-0.5">
                        <p className="text-slate-100 text-[11px]">
                          {new Date(`${i.validade}T12:00:00`).toLocaleDateString('pt-BR')}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn('text-[9px]', ALERTA_VALIDADE_CLASSE[i.validadeAlerta])}
                        >
                          {ALERTA_VALIDADE_LABEL[i.validadeAlerta]}
                        </Badge>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {(i.procedimentos || []).length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {(i.procedimentos || []).slice(0, 3).map((p) => (
                          <Badge
                            key={p}
                            variant="outline"
                            className="text-[9px] border-sky-500/40 text-sky-300 max-w-40 truncate"
                          >
                            {p}
                          </Badge>
                        ))}
                        {(i.procedimentos || []).length > 3 && (
                          <span className="text-[9px] text-slate-400">
                            +{(i.procedimentos || []).length - 3}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Reservas por contrato */}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
            Reservas por contrato (checklists pendentes)
          </p>
          {reservasPorContrato.size === 0 ? (
            <p className="text-xs text-slate-400 border border-dashed border-slate-700 rounded-lg p-3 text-center">
              Nenhum material reservado por contrato no momento.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 max-h-40 overflow-y-auto">
              {[...reservasPorContrato.entries()].map(([id, r]) => (
                <div
                  key={id}
                  className="rounded-lg border border-slate-700/70 bg-slate-800/50 p-2.5 text-xs"
                >
                  <p className="font-semibold text-slate-100">
                    {r.contrato?.expand?.cliente?.nome || 'Contrato'}{' '}
                    <span className="text-slate-300 font-normal">
                      · {r.contrato?.procedimento || '—'}
                    </span>
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {r.itens.map((it, idx) => (
                      <li key={idx} className="text-[11px] text-slate-300">
                        {it.qtd}× {it.nome}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-700/60 pt-3">
          <Button
            variant="ghost"
            onClick={() => onAbrir(false)}
            className="text-slate-300 hover:text-slate-100 hover:bg-slate-800"
          >
            Fechar
          </Button>
          <Button
            onClick={baixarCsv}
            disabled={gerandoCsv || linhas.length === 0}
            className="gap-2"
          >
            {gerandoCsv ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            Baixar CSV
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
