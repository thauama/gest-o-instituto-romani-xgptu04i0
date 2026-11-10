import type { ChecklistItem, ItemEstoque, Movimentacao } from '@/types/clinic'

/**
 * Regras centrais de nível de estoque — usadas pela tela Estoque,
 * pelo painel Resumo e por qualquer outro consumidor futuro, para
 * garantir que os indicadores batam em todo o app.
 */
export type NivelEstoque = 'critico' | 'baixo' | 'ok'

/**
 * Classifica o material:
 * - crítico: zerado OU abaixo da metade do mínimo
 * - baixo: abaixo do mínimo (mas acima da metade)
 * - ok: dentro do mínimo ou acima
 * Itens sem mínimo (ex.: serviços) e sem quantidade ficam sempre 'ok'.
 */
export function nivelEstoque(
  item: Pick<ItemEstoque, 'quantidade' | 'estoque_minimo'>,
): NivelEstoque {
  const min = Number(item.estoque_minimo) || 0
  const qtd = Number(item.quantidade) || 0
  if (min <= 0) return 'ok'
  if (qtd <= 0) return 'critico'
  if (qtd < min / 2) return 'critico'
  if (qtd < min) return 'baixo'
  return 'ok'
}

export const NIVEL_ESTOQUE_LABEL: Record<NivelEstoque, string> = {
  critico: 'Crítico',
  baixo: 'Baixo',
  ok: 'OK',
}

export const NIVEL_ESTOQUE_CLASSE: Record<NivelEstoque, string> = {
  critico: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
  baixo: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  ok: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
}

export const NIVEL_ESTOQUE_BARRA: Record<NivelEstoque, string> = {
  critico: 'bg-rose-400',
  baixo: 'bg-amber-400',
  ok: 'bg-emerald-400',
}

/** Reservas de checklist: itens vinculados a contratos ainda não concluídos. */
export function reservasPorItem(checklist: ChecklistItem[]): Map<string, number> {
  const mapa = new Map<string, number>()
  for (const ch of checklist) {
    if (!ch.item) continue
    if (ch.situacao === 'concluido') continue
    mapa.set(ch.item, (mapa.get(ch.item) || 0) + (Number(ch.quantidade) || 1))
  }
  return mapa
}

export interface EstoqueItem extends ItemEstoque {
  reservado: number
  disponivel: number
  nivel: NivelEstoque
  valorTotal: number
}

/** Monta a visão consolidada por material (quantidade, reserva, disponível, nível, valor). */
export function consolidarEstoque(itens: ItemEstoque[], checklist: ChecklistItem[]): EstoqueItem[] {
  const reservas = reservasPorItem(checklist)
  return itens.map((item) => {
    const reservado = reservas.get(item.id) || 0
    const quantidade = Number(item.quantidade) || 0
    return {
      ...item,
      reservado,
      disponivel: Math.max(0, quantidade - reservado),
      nivel: nivelEstoque(item),
      valorTotal: quantidade * (Number(item.preco) || 0),
    }
  })
}

export interface TotaisEstoque {
  valorTotal: number
  valorDisponivel: number
  criticos: number
  baixos: number
  ok: number
  itensAtivos: number
}

export function totaisEstoque(itens: EstoqueItem[]): TotaisEstoque {
  return {
    valorTotal: itens.reduce((s, i) => s + i.valorTotal, 0),
    valorDisponivel: itens.reduce((s, i) => s + i.disponivel * (Number(i.preco) || 0), 0),
    criticos: itens.filter((i) => i.nivel === 'critico').length,
    baixos: itens.filter((i) => i.nivel === 'baixo').length,
    ok: itens.filter((i) => i.nivel === 'ok').length,
    itensAtivos: itens.filter((i) => i.tipo !== 'servico').length,
  }
}

/**
 * Alertas do painel Resumo: mesmo critério de nivelEstoque().
 * Mantido aqui para o resumo e a tela Estoque nunca divergirem.
 */
export function itensEmAlerta(itens: ItemEstoque[]): ItemEstoque[] {
  return itens.filter((i) => nivelEstoque(i) !== 'ok' && (Number(i.estoque_minimo) || 0) > 0)
}

export const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const fmtQtd = (v: number, unidade?: string) =>
  `${(Number(v) || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}${unidade ? ` ${unidade}` : ''}`

/** Rótulo amigável do tipo de movimentação no histórico. */
export function rotuloMovimentacao(tipo: Movimentacao['tipo']): string {
  if (tipo === 'entrada') return 'Entrada'
  if (tipo === 'saida') return 'Saída'
  return 'Atendimento'
}
