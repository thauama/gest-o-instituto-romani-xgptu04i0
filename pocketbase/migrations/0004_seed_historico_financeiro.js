/// <reference path="../pb_data/types.d.ts" />
// 0004 — Semeia histórico financeiro de demonstração dos últimos 6 meses (guardado:
// só roda se a coleção ainda não tiver lançamentos em meses anteriores ao atual).
migrate(
  (app) => {
    const finCol = app.findCollectionByNameOrId('financeiro')

    // Já existe histórico (algum lançamento anterior ao mês atual)? Não duplica.
    const agora = new Date()
    const mesAtualStr = `${agora.getUTCFullYear()}-${String(agora.getUTCMonth() + 1).padStart(2, '0')}`
    const existentes = app.findRecordsByFilter(
      'financeiro',
      `data < "${mesAtualStr}-01 00:00:00"`,
      '-data',
      1,
      0,
    )
    if (existentes.length > 0) {
      console.log('0004: histórico financeiro já existente — seed ignorado.')
      return
    }

    const hoje = new Date()
    const y = hoje.getUTCFullYear()
    const m = hoje.getUTCMonth() // 0-based
    const mes = (offset) => {
      const d = new Date(Date.UTC(y, m - offset, 1))
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
    }
    const dia = (mesStr, d) => `${mesStr}-${String(d).padStart(2, '0')}`

    const add = (tipo, descricao, valor, data, categoria, mesRef, extra) => {
      const r = new Record(finCol)
      r.set('tipo', tipo)
      r.set('descricao', descricao)
      r.set('valor', valor)
      r.set('data', data)
      r.set('categoria', categoria)
      r.set('mes_referencia', mesRef)
      if (extra) {
        if (extra.cliente) r.set('cliente', extra.cliente)
        if (extra.contrato) r.set('contrato', extra.contrato)
        if (extra.nf) {
          r.set('nf_solicitada', true)
          r.set('nf_email_destinatario', 'financeiro@institutoromani.com.br')
        }
      }
      app.save(r)
    }

    // Perfil de demonstração: clinicamente plausível, com crescimento suave.
    const meses = [6, 5, 4, 3, 2, 1] // offsets: 6 = seis meses atrás, 1 = mês passado

    meses.forEach((off, idx) => {
      const mesStr = mes(off)
      const fator = 0.82 + idx * 0.05 // crescimento gradual até ~107% no mês passado

      // Receitas cirúrgicas
      add(
        'receita',
        'Entrada de contrato — cirurgia mamária',
        Math.round(12000 * fator),
        dia(mesStr, 8),
        'Procedimentos Cirúrgicos',
        mesStr,
        { nf: true },
      )
      add(
        'receita',
        'Parcela de contrato — cirurgia mamária',
        Math.round(6000 * fator),
        dia(mesStr, 22),
        'Procedimentos Cirúrgicos',
        mesStr,
      )

      // Ambulatorial
      add(
        'receita',
        'Sessões de toxina botulínica (pacote)',
        Math.round(3800 * fator),
        dia(mesStr, 12),
        'Procedimentos Ambulatoriais',
        mesStr,
      )
      add(
        'receita',
        'Preenchimento labial',
        Math.round(1600 * fator),
        dia(mesStr, 18),
        'Procedimentos Ambulatoriais',
        mesStr,
      )

      // Consultas
      add(
        'receita',
        'Consultas e avaliações pré-operatórias',
        Math.round(2400 * fator),
        dia(mesStr, 5),
        'Consultas e Avaliações',
        mesStr,
      )

      // Pós-operatório
      add(
        'receita',
        'Pacote de drenagem linfática',
        Math.round(1400 * fator),
        dia(mesStr, 15),
        'Pacotes Pós-Operatórios',
        mesStr,
      )

      // Despesas fixas
      add(
        'despesa',
        'Aluguel da sala comercial',
        4500,
        dia(mesStr, 5),
        'Custos Fixos / Ocupação',
        mesStr,
      )
      add(
        'despesa',
        'Folha de pagamento — equipe',
        Math.round(9800 * fator),
        dia(mesStr, 5),
        'Equipe / Folha de Pagamento',
        mesStr,
      )
      add(
        'despesa',
        'Energia, água e internet',
        Math.round(1100 * fator),
        dia(mesStr, 10),
        'Custos Fixos / Ocupação',
        mesStr,
      )

      // Despesas variáveis
      add(
        'despesa',
        'Insumos e materiais cirúrgicos',
        Math.round(3600 * fator),
        dia(mesStr, 12),
        'Insumos e Materiais',
        mesStr,
      )
      add(
        'despesa',
        'Impostos sobre serviços',
        Math.round(2200 * fator),
        dia(mesStr, 20),
        'Impostos e Taxas',
        mesStr,
      )
      add(
        'despesa',
        'Campanha de marketing digital',
        Math.round(1500 * fator),
        dia(mesStr, 14),
        'Marketing e Publicidade',
        mesStr,
      )
    })

    console.log('0004: histórico financeiro de demonstração semeado (6 meses).')
  },
  (app) => {
    // Down: remove os lançamentos criados pelo seed de demo (por descrição)
    const descricoes = [
      'Entrada de contrato — cirurgia mamária',
      'Parcela de contrato — cirurgia mamária',
      'Sessões de toxina botulínica (pacote)',
      'Preenchimento labial',
      'Consultas e avaliações pré-operatórias',
      'Pacote de drenagem linfática',
      'Aluguel da sala comercial',
      'Folha de pagamento — equipe',
      'Energia, água e internet',
      'Insumos e materiais cirúrgicos',
      'Impostos sobre serviços',
      'Campanha de marketing digital',
    ]
    try {
      descricoes.forEach((d) => {
        const rs = app.findRecordsByFilter('financeiro', `descricao = "${d}"`, '', 0, 0)
        rs.forEach((r) => app.delete(r))
      })
    } catch (err) {
      console.log('0004 down notice:', err)
    }
  },
)
