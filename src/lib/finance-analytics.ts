import type { RegistroFinanceiro } from '@/types/clinic'

export type ModoPeriodo = 'mes' | 'intervalo' | 'tudo'

export interface JanelaPeriodo {
  modo: ModoPeriodo
  /** 'YYYY-MM' quando modo = 'mes'; 'YYYY-MM-DD' quando modo = 'intervalo' */
  inicio: string
  /** 'YYYY-MM-DD' quando modo = 'intervalo' */
  fim: string
}

/** Label curto de mês "YYYY-MM" -> "nov/2026" */
export const labelMes = (mes: string): string => {
  const [ano, m] = mes.split('-')
  const nomes = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  const idx = parseInt(m, 10) - 1
  if (isNaN(idx) || idx < 0 || idx > 11) return mes
  return `${nomes[idx]}/${ano?.slice(2)}`
}

/** Adiciona N meses a um "YYYY-MM" (clamp no último dia) */
export const addMeses = (mes: string, n: number): string => {
  const [ano, m] = mes.split('-').map((v) => parseInt(v, 10))
  const d = new Date(Date.UTC(ano, m - 1 + n, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export const mesDeData = (data: string): string => (data || '').slice(0, 7)

const mesReferenciaDe = (r: RegistroFinanceiro): string => r.mes_referencia || mesDeData(r.data)

/** Registra pertence à janela? Comparação lexicográfica funciona para ISO dates */
const pertence = (r: RegistroFinanceiro, j: JanelaPeriodo): boolean => {
  const mes = mesReferenciaDe(r)
  if (j.modo === 'tudo') return true
  if (j.modo === 'mes') return mes === j.inicio
  // intervalo
  const dia = r.data || ''
  return (!j.inicio || dia >= j.inicio) && (!j.fim || dia <= j.fim)
}

export interface PeriodoTotais {
  receitas: number
  despesas: number
  lucroBruto: number
  lucroLiquido: number
  margem: number
  lancamentos: number
}

export const totaisDe = (registros: RegistroFinanceiro[]): PeriodoTotais => {
  const receitas = registros
    .filter((r) => r.tipo === 'receita')
    .reduce((acc, r) => acc + (Number(r.valor) || 0), 0)
  const despesas = registros
    .filter((r) => r.tipo === 'despesa')
    .reduce((acc, r) => acc + (Number(r.valor) || 0), 0)
  const lucroLiquido = receitas - despesas
  return {
    receitas,
    despesas,
    lucroBruto: receitas,
    lucroLiquido,
    margem: receitas > 0 ? (lucroLiquido / receitas) * 100 : 0,
    lancamentos: registros.length,
  }
}

/** Variação percentual de atual vs anterior; null quando sem base de comparação */
export const variacaoPct = (atual: number, anterior: number): number | null => {
  if (anterior === 0 && atual === 0) return null
  if (anterior === 0) return null // salto absoluto de zero — evita 100%/infinito enganoso
  return ((atual - anterior) / Math.abs(anterior)) * 100
}

/** Série mensal contínua do início ao fim da janela (inclui meses zerados) */
export const serieMensal = (
  registros: RegistroFinanceiro[],
  janela: JanelaPeriodo,
): Array<{ mes: string; label: string; receitas: number; despesas: number; lucro: number }> => {
  const porMes: Record<string, { receitas: number; despesas: number }> = {}
  registros.forEach((r) => {
    const m = mesReferenciaDe(r)
    if (!porMes[m]) porMes[m] = { receitas: 0, despesas: 0 }
    if (r.tipo === 'receita') porMes[m].receitas += Number(r.valor) || 0
    else porMes[m].despesas += Number(r.valor) || 0
  })

  let meses: string[]
  if (janela.modo === 'tudo') {
    meses = Object.keys(porMes).sort()
  } else if (janela.modo === 'mes') {
    meses = [janela.inicio]
  } else {
    const mInicio = mesDeData(janela.inicio)
    const mFim = mesDeData(janela.fim)
    meses = []
    let cursor = mInicio
    let guard = 0
    while (cursor <= mFim && guard < 120) {
      meses.push(cursor)
      cursor = addMeses(cursor, 1)
      guard++
    }
  }

  return meses.map((m) => {
    const t = porMes[m] || { receitas: 0, despesas: 0 }
    return {
      mes: m,
      label: labelMes(m),
      receitas: t.receitas,
      despesas: t.despesas,
      lucro: t.receitas - t.despesas,
    }
  })
}

/** Composição de receitas por categoria (top N + "Outros") */
export const receitasPorCategoria = (
  registros: RegistroFinanceiro[],
  topN = 5,
): Array<{ nome: string; valor: number }> => {
  const mapa: Record<string, number> = {}
  registros
    .filter((r) => r.tipo === 'receita')
    .forEach((r) => {
      const cat = r.categoria || 'Sem categoria'
      mapa[cat] = (mapa[cat] || 0) + (Number(r.valor) || 0)
    })
  const lista = Object.entries(mapa)
    .map(([nome, valor]) => ({ nome, valor }))
    .sort((a, b) => b.valor - a.valor)
  if (lista.length <= topN) return lista
  const top = lista.slice(0, topN)
  const outros = lista.slice(topN).reduce((acc, c) => acc + c.valor, 0)
  return [...top, { nome: 'Outras categorias', valor: outros }]
}

/** Despesas por categoria (todas, ordenadas) */
export const despesasPorCategoria = (
  registros: RegistroFinanceiro[],
): Array<{ nome: string; valor: number }> => {
  const mapa: Record<string, number> = {}
  registros
    .filter((r) => r.tipo === 'despesa')
    .forEach((r) => {
      const cat = r.categoria || 'Sem categoria'
      mapa[cat] = (mapa[cat] || 0) + (Number(r.valor) || 0)
    })
  return Object.entries(mapa)
    .map(([nome, valor]) => ({ nome, valor }))
    .sort((a, b) => b.valor - a.valor)
}

/** Soma valor por procedimento (de contratos vinculados a receitas) */
export const valorPorProcedimento = (
  registros: RegistroFinanceiro[],
  topN = 5,
): Array<{ nome: string; valor: number }> => {
  const mapa: Record<string, number> = {}
  registros
    .filter((r) => r.tipo === 'receita' && r.expand?.contrato?.procedimento)
    .forEach((r) => {
      const nome = r.expand!.contrato!.procedimento
      mapa[nome] = (mapa[nome] || 0) + (Number(r.valor) || 0)
    })
  const lista = Object.entries(mapa)
    .map(([nome, valor]) => ({ nome, valor }))
    .sort((a, b) => b.valor - a.valor)
  if (lista.length <= topN) return lista
  const top = lista.slice(0, topN)
  const outros = lista.slice(topN).reduce((acc, c) => acc + c.valor, 0)
  return [...top, { nome: 'Outros procedimentos', valor: outros }]
}

/** Janela do período anterior equivalente (mes anterior / intervalo deslocado) */
export const janelaAnterior = (j: JanelaPeriodo): JanelaPeriodo => {
  if (j.modo === 'tudo') return j
  if (j.modo === 'mes') {
    const [ano, mes] = j.inicio.split('-').map((v) => parseInt(v, 10))
    const d = new Date(Date.UTC(ano, mes - 2, 1))
    return {
      modo: 'mes',
      inicio: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`,
      fim: '',
    }
  }
  // intervalo: desloca a mesma duração para trás
  const ini = new Date(j.inicio + 'T00:00:00Z')
  const fim = new Date(j.fim + 'T00:00:00Z')
  const dias = Math.max(1, Math.round((fim.getTime() - ini.getTime()) / 86400000) + 1)
  const novoFim = new Date(ini.getTime() - 86400000)
  const novoInicio = new Date(novoFim.getTime() - (dias - 1) * 86400000)
  return {
    modo: 'intervalo',
    inicio: novoInicio.toISOString().slice(0, 10),
    fim: novoFim.toISOString().slice(0, 10),
  }
}

export const filtrarPorJanela = (
  registros: RegistroFinanceiro[],
  janela: JanelaPeriodo,
): RegistroFinanceiro[] => registros.filter((r) => pertence(r, janela))
