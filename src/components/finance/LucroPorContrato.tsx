import React, { useMemo } from 'react'
import { FolderKanban } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { RegistroFinanceiro } from '@/types/clinic'

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export interface ResultadoContrato {
  contratoId: string
  titulo: string
  paciente: string
  valorContrato: number
  situacao: string
  receitas: number
  despesas: number
  resultado: number
  qtdLancamentos: number
}

/** Agrupa lançamentos por contrato vinculado e calcula resultado (receitas - despesas) */
export const lucroPorContrato = (registros: RegistroFinanceiro[]): ResultadoContrato[] => {
  const mapa = new Map<string, { receitas: number; despesas: number; qtd: number }>()

  registros.forEach((r) => {
    const contratoId = r.contrato || r.expand?.contrato?.id
    if (!contratoId) return
    const atual = mapa.get(contratoId) || { receitas: 0, despesas: 0, qtd: 0 }
    if (r.tipo === 'receita') atual.receitas += Number(r.valor) || 0
    else atual.despesas += Number(r.valor) || 0
    atual.qtd += 1
    mapa.set(contratoId, atual)
  })

  return Array.from(mapa.entries())
    .map(([contratoId, v]) => {
      const contratosMesmoId = registros.filter(
        (r) => (r.contrato || r.expand?.contrato?.id) === contratoId,
      )
      const primeiro = contratosMesmoId[0]
      const expand = primeiro?.expand?.contrato
      const titulo = expand?.procedimento || 'Contrato'
      const paciente = expand?.expand?.cliente?.nome || expand?.cliente || ''
      return {
        contratoId,
        titulo,
        paciente,
        valorContrato: Number(expand?.valor) || 0,
        situacao: expand?.situacao || '',
        receitas: v.receitas,
        despesas: v.despesas,
        resultado: v.receitas - v.despesas,
        qtdLancamentos: v.qtd,
      }
    })
    .sort((a, b) => b.resultado - a.resultado)
}

interface Props {
  registros: RegistroFinanceiro[]
  loading: boolean
}

export default function LucroPorContrato({ registros, loading }: Props) {
  const contratos = useMemo(() => lucroPorContrato(registros), [registros])
  const vinculados = useMemo(
    () => registros.filter((r) => r.contrato || r.expand?.contrato?.id).length,
    [registros],
  )

  return (
    <Card className="bg-slate-900/60 border-slate-700/60 backdrop-blur">
      <CardHeader>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-sky-400" />
              Lucro por contrato
            </CardTitle>
            <CardDescription className="text-xs text-slate-300">
              Resultado dos lançamentos vinculados a cada contrato — ordenado do maior para o menor.
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="border-slate-600 bg-slate-800/60 text-slate-200 self-start sm:self-auto"
          >
            {contratos.length} contrato(s) · {vinculados} lançamento(s) vinculado(s)
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg bg-slate-800/60" />
            ))}
          </div>
        ) : contratos.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-300 border border-dashed border-slate-600 rounded-lg">
            Nenhum lançamento vinculado a contrato no período. Ao criar ou editar um lançamento,
            escolha um contrato no campo opcional para vê-lo aqui.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-slate-300 border-b border-slate-700">
                  <th className="py-2 pr-3">Contrato</th>
                  <th className="py-2 pr-3">Paciente</th>
                  <th className="py-2 pr-3">Situação</th>
                  <th className="py-2 pr-3 text-right">Receitas</th>
                  <th className="py-2 pr-3 text-right">Despesas</th>
                  <th className="py-2 pr-3 text-right">Resultado</th>
                  <th className="py-2 text-right">Valor do contrato</th>
                </tr>
              </thead>
              <tbody>
                {contratos.map((c) => (
                  <tr
                    key={c.contratoId}
                    className="border-b border-slate-800/70 hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-2.5 pr-3 text-slate-100 font-medium max-w-[220px] truncate">
                      <span title={c.titulo}>{c.titulo}</span>
                      <span className="block text-[10px] text-slate-400">
                        {c.qtdLancamentos} lançamento(s)
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-slate-300 max-w-[150px] truncate">
                      {c.paciente || '—'}
                    </td>
                    <td className="py-2.5 pr-3">
                      {c.situacao ? (
                        <Badge
                          variant="outline"
                          className="border-slate-600 bg-slate-800/60 text-slate-200 capitalize"
                        >
                          {c.situacao}
                        </Badge>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-semibold tabular-nums text-emerald-300 whitespace-nowrap">
                      R$ {fmtBRL(c.receitas)}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-semibold tabular-nums text-rose-300 whitespace-nowrap">
                      R$ {fmtBRL(c.despesas)}
                    </td>
                    <td
                      className={`py-2.5 pr-3 text-right font-bold tabular-nums whitespace-nowrap ${
                        c.resultado >= 0 ? 'text-emerald-300' : 'text-rose-300'
                      }`}
                    >
                      {c.resultado >= 0 ? '+' : '−'} R$ {fmtBRL(Math.abs(c.resultado))}
                    </td>
                    <td className="py-2.5 text-right text-slate-300 tabular-nums whitespace-nowrap">
                      {c.valorContrato > 0 ? `R$ ${fmtBRL(c.valorContrato)}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
