import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { variacaoPct } from '@/lib/finance-analytics'
import { cn } from '@/lib/utils'

export interface KpiFinanceiro {
  titulo: string
  valor: number
  tipo: 'receita' | 'despesa' | 'lucro' | 'neutro'
  variacao: number | null
  subtitulo?: string
  invertido?: boolean // true = queda é boa (despesas)
}

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const KpiCard = ({ kpi }: { kpi: KpiFinanceiro }) => {
  const cor =
    kpi.tipo === 'receita'
      ? 'text-emerald-300'
      : kpi.tipo === 'despesa'
        ? 'text-rose-300'
        : kpi.tipo === 'lucro'
          ? kpi.valor >= 0
            ? 'text-emerald-300'
            : 'text-rose-300'
          : 'text-slate-100'

  const v = kpi.variacao
  const Icon = v === null || Math.abs(v) < 0.05 ? Minus : v > 0 ? ArrowUpRight : ArrowDownRight

  let corVar = 'text-slate-400'
  if (v !== null && Math.abs(v) >= 0.05) {
    const subiu = v > 0
    const bom = kpi.invertido ? !subiu : subiu
    corVar = bom ? 'text-emerald-300' : 'text-rose-300'
  }

  return (
    <Card className="bg-slate-900/60 border-slate-700/60 shadow-[0_0_24px_rgba(56,189,248,0.06)] backdrop-blur">
      <CardHeader className="pb-1 px-5 pt-5">
        <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {kpi.titulo}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-0">
        <div className={cn('text-2xl font-bold tabular-nums', cor)}>
          <span className="text-sm font-medium text-slate-400 mr-1">R$</span>
          {fmtBRL(kpi.valor)}
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
          {v !== null && Math.abs(v) >= 0.05 && (
            <span className={cn('inline-flex items-center gap-0.5 font-semibold', corVar)}>
              <Icon className="h-3 w-3" />
              {Math.abs(v).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
            </span>
          )}
          <span className="text-slate-500">{kpi.subtitulo || 'vs. período anterior'}</span>
        </div>
      </CardContent>
    </Card>
  )
}

const pctLabel = (v: number | null, bom: boolean) => {
  if (v === null || Math.abs(v) < 0.05) return { icone: Minus, cor: 'text-slate-400', txt: '—' }
  const Icon = v > 0 ? ArrowUpRight : ArrowDownRight
  return {
    icone: Icon,
    cor: bom ? 'text-emerald-300' : 'text-rose-300',
    txt: `${Math.abs(v).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`,
  }
}

export const LinhaComparativa = ({
  titulo,
  atual,
  anterior,
  invertido,
}: {
  titulo: string
  atual: number
  anterior: number
  invertido?: boolean
}) => {
  const v = variacaoPct(atual, anterior)
  const { icone: Icon, cor, txt } = pctLabel(v, invertido ? (v ?? 0) < 0 : (v ?? 0) > 0)
  const corValor =
    titulo === 'Lucro líquido' || titulo === 'Margem líquida'
      ? atual >= 0
        ? 'text-emerald-300'
        : 'text-rose-300'
      : 'text-slate-100'

  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-3 gap-y-1 py-2.5 border-b border-slate-800/80 last:border-0">
      <span className="text-xs font-medium text-slate-300">{titulo}</span>
      <span className={cn('text-sm font-bold tabular-nums text-right', corValor)}>
        R$ {fmtBRL(atual)}
      </span>
      <span className="text-xs tabular-nums text-right text-slate-500">
        {anterior === 0 ? '—' : `R$ ${fmtBRL(anterior)}`}
      </span>
      <span
        className={cn(
          'inline-flex items-center justify-end gap-0.5 text-[11px] font-semibold w-16',
          cor,
        )}
      >
        <Icon className="h-3 w-3" />
        {txt}
      </span>
    </div>
  )
}

export const CabecalhoComparativo = ({ rotulo }: { rotulo: string }) => (
  <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 pb-2 border-b border-slate-700/80">
    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
      {rotulo}
    </span>
    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 w-28 text-right">
      Atual
    </span>
    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 w-28 text-right">
      Anterior
    </span>
    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 w-16 text-right">
      Δ
    </span>
  </div>
)
