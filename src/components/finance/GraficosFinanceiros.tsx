import React from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
} from 'recharts'

export const PALETA = ['#38bdf8', '#34d399', '#a78bfa', '#fbbf24', '#f472b6', '#22d3ee']

const fmtAxis = (v: number) => {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace('.', ',')}M`
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}k`
  return `${v}`
}

const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const tooltipEstilo = {
  backgroundColor: 'rgba(15,23,42,0.95)',
  border: '1px solid rgba(51,65,85,0.8)',
  borderRadius: 8,
  fontSize: 12,
  color: '#e2e8f0',
}

const eixo = { stroke: '#94a3b8', fontSize: 11, fill: '#cbd5e1' }

export const GraficoEvolucaoMensal = ({
  dados,
  loading,
}: {
  dados: Array<{ label: string; receitas: number; despesas: number; lucro: number }>
  loading: boolean
}) => (
  <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 backdrop-blur p-5 shadow-[0_0_24px_rgba(56,189,248,0.06)]">
    <div className="mb-4">
      <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.9)]" />
        Evolução mensal
      </h3>
      <p className="text-xs text-slate-300 mt-0.5">Receitas, despesas e lucro líquido por mês</p>
    </div>
    {loading ? (
      <div className="h-72 animate-pulse rounded-lg bg-slate-800/50" />
    ) : dados.length === 0 ? (
      <div className="h-72 flex items-center justify-center text-xs text-slate-300 border border-dashed border-slate-700 rounded-lg">
        Sem lançamentos no período.
      </div>
    ) : (
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={dados} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(71,85,105,0.35)" vertical={false} />
          <XAxis dataKey="label" tick={eixo} tickLine={false} axisLine={{ stroke: '#334155' }} />
          <YAxis tick={eixo} tickLine={false} axisLine={false} tickFormatter={fmtAxis} width={52} />
          <Tooltip
            contentStyle={tooltipEstilo}
            formatter={(value: number, name: string) => [fmtBRL(value), name]}
            labelStyle={{ color: '#cbd5e1' }}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: '#cbd5e1' }} />
          <Bar
            dataKey="receitas"
            name="Receitas"
            fill="#34d399"
            radius={[4, 4, 0, 0]}
            maxBarSize={42}
          />
          <Bar
            dataKey="despesas"
            name="Despesas"
            fill="#fb7185"
            radius={[4, 4, 0, 0]}
            maxBarSize={42}
          />
          <Line
            type="monotone"
            dataKey="lucro"
            name="Lucro líquido"
            stroke="#38bdf8"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#38bdf8' }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    )}
  </div>
)

export const GraficoReceitasCategoria = ({
  dados,
  loading,
}: {
  dados: Array<{ nome: string; valor: number }>
  loading: boolean
}) => {
  const total = dados.reduce((a, d) => a + d.valor, 0)
  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 backdrop-blur p-5 shadow-[0_0_24px_rgba(56,189,248,0.06)]">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
          Composição das receitas
        </h3>
        <p className="text-xs text-slate-300 mt-0.5">
          Por categoria {total > 0 && `· total ${fmtBRL(total)}`}
        </p>
      </div>
      {loading ? (
        <div className="h-64 animate-pulse rounded-lg bg-slate-800/50" />
      ) : dados.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-xs text-slate-300 border border-dashed border-slate-700 rounded-lg">
          Sem receitas no período.
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={dados}
                dataKey="valor"
                nameKey="nome"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
                stroke="rgba(15,23,42,0.9)"
              >
                {dados.map((_, i) => (
                  <Cell key={i} fill={PALETA[i % PALETA.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipEstilo}
                formatter={(value: number, name: string) => [fmtBRL(value), name]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-1.5">
            {dados.map((d, i) => (
              <div key={d.nome} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-300">
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: PALETA[i % PALETA.length] }}
                  />
                  {d.nome}
                </span>
                <span className="tabular-nums text-slate-300">
                  {total > 0 ? `${((d.valor / total) * 100).toFixed(1).replace('.', ',')}%` : '—'} ·{' '}
                  {fmtBRL(d.valor)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export const GraficoDespesasCategoria = ({
  dados,
  loading,
}: {
  dados: Array<{ nome: string; valor: number }>
  loading: boolean
}) => (
  <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 backdrop-blur p-5 shadow-[0_0_24px_rgba(56,189,248,0.06)]">
    <div className="mb-4">
      <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.9)]" />
        Despesas por categoria
      </h3>
      <p className="text-xs text-slate-300 mt-0.5">Onde o dinheiro da clínica está indo</p>
    </div>
    {loading ? (
      <div className="h-64 animate-pulse rounded-lg bg-slate-800/50" />
    ) : dados.length === 0 ? (
      <div className="h-64 flex items-center justify-center text-xs text-slate-300 border border-dashed border-slate-700 rounded-lg">
        Sem despesas no período.
      </div>
    ) : (
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={dados} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(71,85,105,0.35)" horizontal={false} />
          <XAxis
            type="number"
            tick={eixo}
            tickLine={false}
            axisLine={false}
            tickFormatter={fmtAxis}
          />
          <YAxis
            type="category"
            dataKey="nome"
            tick={{ ...eixo, fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: '#334155' }}
            width={150}
          />
          <Tooltip
            contentStyle={tooltipEstilo}
            formatter={(value: number) => [fmtBRL(value), 'Despesa']}
          />
          <Bar
            dataKey="valor"
            name="Despesas"
            fill="#fb7185"
            radius={[0, 4, 4, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    )}
  </div>
)

export const GraficoProcedimentos = ({
  dados,
  loading,
}: {
  dados: Array<{ nome: string; valor: number }>
  loading: boolean
}) => (
  <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 backdrop-blur p-5 shadow-[0_0_24px_rgba(56,189,248,0.06)]">
    <div className="mb-4">
      <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.9)]" />
        Receitas por procedimento
      </h3>
      <p className="text-xs text-slate-300 mt-0.5">
        Via contratos vinculados aos lançamentos de receita
      </p>
    </div>
    {loading ? (
      <div className="h-56 animate-pulse rounded-lg bg-slate-800/50" />
    ) : dados.length === 0 ? (
      <div className="h-56 flex items-center justify-center text-xs text-slate-300 border border-dashed border-slate-700 rounded-lg">
        Nenhuma receita vinculada a contrato no período.
      </div>
    ) : (
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={dados} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(71,85,105,0.35)" vertical={false} />
          <XAxis
            dataKey="nome"
            tick={{ ...eixo, fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: '#334155' }}
            interval={0}
            tickFormatter={(v: string) => (v.length > 18 ? `${v.slice(0, 17)}…` : v)}
          />
          <YAxis tick={eixo} tickLine={false} axisLine={false} tickFormatter={fmtAxis} width={52} />
          <Tooltip
            contentStyle={tooltipEstilo}
            formatter={(value: number) => [fmtBRL(value), 'Receita']}
          />
          <Bar
            dataKey="valor"
            name="Receita"
            fill="#a78bfa"
            radius={[4, 4, 0, 0]}
            maxBarSize={56}
          />
        </BarChart>
      </ResponsiveContainer>
    )}
  </div>
)
