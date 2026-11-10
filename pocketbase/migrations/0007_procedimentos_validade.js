// 0007 — Estoque por procedimento + validade
// 1) itens.procedimentos (json): procedimentos da clínica em que o material é usado,
//    para sugerir o checklist de contratos.
// 2) itens.quantidade_por_procedimento (json): { [procedimento]: quantidade } —
//    quanto do material costuma ser usado em cada procedimento (padrão 1).
// 3) itens.validade (date): alertas de vencido/vencendo na tela Estoque e no Resumo.
// 4) Preenche validade/procedimentos de demonstração SOMENTE em itens com nomes do
//    seed 0006 que ainda estejam sem os campos — registros do usuário nunca são alterados.
migrate(
  (app) => {
    const itens = app.findCollectionByNameOrId('itens')
    let mudou = false
    if (!itens.fields.getByName('validade')) {
      itens.fields.add(new DateField({ name: 'validade' }))
      mudou = true
    }
    if (!itens.fields.getByName('procedimentos')) {
      itens.fields.add(new JSONField({ name: 'procedimentos', maxSize: 2000000 }))
      mudou = true
    }
    if (!itens.fields.getByName('quantidade_por_procedimento')) {
      itens.fields.add(new JSONField({ name: 'quantidade_por_procedimento', maxSize: 2000000 }))
      mudou = true
    }
    if (mudou) app.save(itens)

    // ---- Backfill de demonstração (idempotente: só itens do seed 0006, só campos vazios) ----
    const hoje = new Date()
    const emDias = (n) => {
      const d = new Date(hoje)
      d.setDate(d.getDate() + n)
      return d.toISOString().slice(0, 10)
    }
    // [validade em dias a partir de hoje (null = sem validade), procedimentos, qtd por procedimento]
    const demo = {
      'Luva Cirúrgica Estéril Tam. 7,5': [
        300,
        ['Mamoplastia com ou sem prótese', 'Lipoabdominoplastia', 'Reconstrução de mama'],
        { 'Mamoplastia com ou sem prótese': 4, Lipoabdominoplastia: 4 },
      ],
      'Luva de Procedimento Não Estéril': [null, [], {}],
      'Fio de Sutura Nylon 4-0 (agulhado)': [
        500,
        ['Ninfoplastia', 'Facelifting', 'Blefaroplastia', 'Otoplastia'],
        { Blefaroplastia: 3 },
      ],
      'Fio de Sutura Vycril 3-0': [
        420,
        ['Mamoplastia com ou sem prótese', 'Reconstrução de mama', 'Lipoabdominoplastia'],
        { 'Mamoplastia com ou sem prótese': 3 },
      ],
      'Prótese de Silicone Motiva 320ml': [
        700,
        ['Mamoplastia com ou sem prótese', 'Prótese de recuperação rápida', 'Reconstrução de mama'],
        { 'Mamoplastia com ou sem prótese': 2, 'Reconstrução de mama': 2 },
      ],
      'Prótese de Silicone Motiva 350ml': [
        700,
        ['Mamoplastia com ou sem prótese', 'Prótese de recuperação rápida'],
        { 'Mamoplastia com ou sem prótese': 2 },
      ],
      'Anestésico Lidocaína 2% c/ Vasoconstrictor': [
        90,
        ['Lipoaspiração de alta definição', 'Lipoabdominoplastia', 'Lipoenxertia glútea'],
        { 'Lipoaspiração de alta definição': 5 },
      ],
      'Anestésico Bupivacaína 0,5%': [-15, ['Lipoenxertia glútea', 'Reconstrução de mama'], {}],
      'Soro Fisiológico 0,9% 500ml': [
        240,
        ['Lipoaspiração de alta definição', 'Lipoabdominoplastia', 'Lipoenxertia glútea'],
        { 'Lipoaspiração de alta definição': 6 },
      ],
      'Compressa Estéril 10x10cm': [150, [], {}],
      'Seringa Descartável 10ml': [365, [], {}],
      'Agulha Sparkle de Lipoaspiração 3,5mm': [
        null,
        ['Lipoaspiração de alta definição', 'Lipoabdominoplastia', 'Lipoenxertia glútea'],
        { 'Lipoaspiração de alta definição': 1 },
      ],
      'Cinta Modeladora Pós-Cirúrgica Tam. M': [
        null,
        ['Lipoaspiração de alta definição', 'Lipoabdominoplastia', 'Lipoenxertia glútea'],
        { 'Lipoaspiração de alta definição': 1, Lipoabdominoplastia: 1 },
      ],
      'Fita de Silicone Pós-Cirúrgica Silimed': [
        200,
        ['Prótese de recuperação rápida', 'Mamoplastia com ou sem prótese'],
        {},
      ],
      'Antissépsio Clorexidina degermante 2%': [
        55,
        ['Mamoplastia com ou sem prótese', 'Lipoabdominoplastia', 'Facelifting'],
        {},
      ],
      'Sessão Drenagem Linfática Pós-Operatória': [null, [], {}],
    }

    const registros = app.findRecordsByFilter('itens', '', '', 10000, 0)
    let tocados = 0
    for (const r of registros) {
      const d = demo[r.get('nome')]
      if (!d) continue // item do próprio usuário: nunca altera
      const semValidade = !r.get('validade')
      const semProcs = !r.get('procedimentos')
      const semQtds = !r.get('quantidade_por_procedimento')
      if (!semValidade && !semProcs && !semQtds) continue
      if (semValidade && d[0] !== null && d[0] !== undefined) r.set('validade', emDias(d[0]))
      if (semProcs) r.set('procedimentos', d[1] || [])
      if (semQtds) r.set('quantidade_por_procedimento', d[2] || {})
      app.save(r)
      tocados++
    }
    console.log(
      '0007: campos de procedimento/validade garantidos; demo backfill em ' +
        tocados +
        ' itens do seed',
    )
  },
  (app) => {
    const itens = app.findCollectionByNameOrId('itens')
    for (const f of ['validade', 'procedimentos', 'quantidade_por_procedimento']) {
      if (itens.fields.getByName(f)) itens.fields.removeByName(f)
    }
    app.save(itens)
  },
)
