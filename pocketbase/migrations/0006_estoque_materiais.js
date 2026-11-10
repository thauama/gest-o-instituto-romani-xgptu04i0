// 0006 — Controle de estoque de materiais
// 1) Campo registrado_por em movimentacoes (auditoria: quem registrou entrada/saída).
//    Texto simples (nome/e-mail do usuário) para não quebrar registros antigos.
// 2) Seed idempotente de estoque de demonstração realista de clínica de cirurgia plástica
//    (somente quando a coleção itens estiver vazia) + movimentações de exemplo.
migrate(
  (app) => {
    const mov = app.findCollectionByNameOrId('movimentacoes')
    if (!mov.fields.getByName('registrado_por')) {
      mov.fields.add(new TextField({ name: 'registrado_por', max: 120 }))
      app.save(mov)
    }

    // ---- Seed de itens (apenas se não houver nenhum item cadastrado) ----
    const itensCol = app.findCollectionByNameOrId('itens')
    const existentes = app.findRecordsByFilter('itens', '', '', 1, 0)
    if (existentes.length > 0) {
      console.log('0006: itens já existentes — seed de estoque ignorado')
      return
    }

    const materiais = [
      // [nome, tipo, quantidade, preco, estoque_minimo, unidade, descricao]
      [
        'Luva Cirúrgica Estéril Tam. 7,5',
        'produto',
        40,
        4.5,
        20,
        'par',
        'Luva de látex estéril para procedimentos cirúrgicos',
      ],
      [
        'Luva de Procedimento Não Estéril',
        'produto',
        12,
        1.8,
        30,
        'par',
        'Luva de nitrila para atendimento clínico',
      ],
      [
        'Fio de Sutura Nylon 4-0 (agulhado)',
        'produto',
        25,
        9.9,
        15,
        'cx',
        'Sutura absorção lenta com agulha círculo invertido',
      ],
      [
        'Fio de Sutura Vycril 3-0',
        'produto',
        10,
        14.5,
        12,
        'cx',
        'Sutura absorvível para plano profundo',
      ],
      [
        'Prótese de Silicone Motiva 320ml',
        'peca',
        4,
        3200,
        2,
        'par',
        'Implante mamário perfil alto texturizado',
      ],
      [
        'Prótese de Silicone Motiva 350ml',
        'peca',
        2,
        3350,
        2,
        'par',
        'Implante mamário perfil anatômico',
      ],
      [
        'Anestésico Lidocaína 2% c/ Vasoconstrictor',
        'produto',
        18,
        12.9,
        10,
        'amp',
        'Anestésico local para infiltração',
      ],
      [
        'Anestésico Bupivacaína 0,5%',
        'produto',
        6,
        15.4,
        8,
        'amp',
        'Anestésico local de longa duração',
      ],
      [
        'Soro Fisiológico 0,9% 500ml',
        'produto',
        30,
        6.4,
        20,
        'frasco',
        'Irrigação e diluição de soluções',
      ],
      [
        'Compressa Estéril 10x10cm',
        'produto',
        6,
        22.0,
        8,
        'pacote',
        'Gaze estéril para curativos e limpeza cirúrgica',
      ],
      ['Seringa Descartável 10ml', 'produto', 80, 0.85, 40, 'un', 'Seringa hipodérmica com agulha'],
      [
        'Agulha Sparkle de Lipoaspiração 3,5mm',
        'peca',
        3,
        480,
        1,
        'un',
        'Canula de lipoaspiração multiuso',
      ],
      [
        'Cinta Modeladora Pós-Cirúrgica Tam. M',
        'peca',
        2,
        260,
        3,
        'un',
        'Malha compressiva com reforço duplo',
      ],
      [
        'Fita de Silicone Pós-Cirúrgica Silimed',
        'produto',
        8,
        120,
        5,
        'cx',
        'Placa de gel de silicone para prevenção de queloide',
      ],
      [
        'Antissépsio Clorexidina degermante 2%',
        'produto',
        5,
        28.9,
        4,
        'frasco',
        'Antissepsia pré-operatória da pele',
      ],
      [
        'Sessão Drenagem Linfática Pós-Operatória',
        'servico',
        20,
        180,
        0,
        'sessão',
        'Atendimento de fisioterapia dermato-funcional',
      ],
    ]

    const idsPorNome = {}
    materiais.forEach((m) => {
      const rec = new Record(itensCol)
      rec.set('nome', m[0])
      rec.set('tipo', m[1])
      rec.set('quantidade', m[2])
      rec.set('preco', m[3])
      rec.set('estoque_minimo', m[4])
      rec.set('unidade', m[5])
      rec.set('descricao', m[6])
      app.save(rec)
      idsPorNome[m[0]] = rec.id
    })

    // ---- Movimentações de exemplo (histórico inicial) ----
    const movCol = app.findCollectionByNameOrId('movimentacoes')
    const hoje = new Date()
    const diasAtras = (n) => {
      const d = new Date(hoje)
      d.setDate(d.getDate() - n)
      return d.toISOString().slice(0, 10)
    }
    const exemplos = [
      [
        'entrada',
        1,
        'Luva Cirúrgica Estéril Tam. 7,5',
        20,
        'Recebimento de lote do fornecedor (NF 10293)',
      ],
      ['entrada', 1, 'Fio de Sutura Nylon 4-0 (agulhado)', 10, 'Reposição semanal de suturas'],
      ['saida', 1, 'Luva Cirúrgica Estéril Tam. 7,5', 4, 'Consumo — cirurgia de mastopexia'],
      ['entrada', 3, 'Seringa Descartável 10ml', 50, 'Compra conjunta com insumos de curativo'],
      ['saida', 3, 'Anestésico Lidocaína 2% c/ Vasoconstrictor', 2, 'Consumo — lipoaspiração HD'],
      [
        'entrada',
        5,
        'Prótese de Silicone Motiva 320ml',
        2,
        'Recebimento de próteses pedidas para cirurgia',
      ],
      ['saida', 5, 'Compressa Estéril 10x10cm', 2, 'Consumo — troca de curativo pós-operatório'],
      ['entrada', 8, 'Cinta Modeladora Pós-Cirúrgica Tam. M', 3, 'Reposição de cintas tamanho M'],
      [
        'saida',
        8,
        'Cinta Modeladora Pós-Cirúrgica Tam. M',
        1,
        'Entrega para paciente (pós-cirurgia)',
      ],
    ]
    exemplos.forEach((ex) => {
      const rec = new Record(movCol)
      rec.set('tipo', ex[0])
      rec.set('data', diasAtras(ex[1]))
      rec.set('item', idsPorNome[ex[2]])
      rec.set('quantidade', ex[3])
      rec.set('observacao', ex[4])
      rec.set('registrado_por', 'seed')
      app.save(rec)
    })

    console.log('0006: seed de estoque aplicado (' + materiais.length + ' itens)')
  },
  (app) => {
    const mov = app.findCollectionByNameOrId('movimentacoes')
    if (mov.fields.getByName('registrado_por')) {
      mov.fields.removeByName('registrado_por')
      app.save(mov)
    }
  },
)
