// 0005 — Coleção financeiro_categorias + seed das categorias padrão
// Gerenciamento de categorias de receita/despesa da tela Controle Financeiro.
// Escrita (create/update/delete) somente admin; leitura para qualquer usuário autenticado
// (equipe precisa ver as categorias ao abrir o formulário de lançamento).
migrate(
  (app) => {
    // Idempotente: se a coleção já existe, apenas garante o seed abaixo.
    let col = null
    try {
      col = app.findCollectionByNameOrId('financeiro_categorias')
    } catch (_) {
      col = null
    }

    if (!col) {
      col = new Collection({
        name: 'financeiro_categorias',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.role = 'admin'",
        updateRule: "@request.auth.role = 'admin'",
        deleteRule: "@request.auth.role = 'admin'",
        fields: [
          { name: 'nome', type: 'text', required: true, min: 2, max: 60 },
          {
            name: 'tipo',
            type: 'select',
            required: true,
            values: ['receita', 'despesa'],
            maxSelect: 1,
          },
          { name: 'ativa', type: 'bool' }, // NUNCA required (bool false = vazio no PocketBase)
          { name: 'criado_por', type: 'text' }, // e-mail do admin que criou (auditoria leve)
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_fin_cat_nome_tipo ON financeiro_categorias (nome, tipo)',
          'CREATE INDEX idx_fin_cat_tipo ON financeiro_categorias (tipo)',
        ],
      })
      app.save(col)
      col = app.findCollectionByNameOrId('financeiro_categorias')
    }

    // Seed idempotente: garante as categorias padrão usadas até hoje pelo app.
    const padrao = [
      ['Procedimentos Cirúrgicos', 'receita'],
      ['Procedimentos Ambulatoriais', 'receita'],
      ['Consultas e Avaliações', 'receita'],
      ['Pacotes Pós-Operatórios', 'receita'],
      ['Produtos e Cosméticos', 'receita'],
      ['Outras Receitas', 'receita'],
      ['Insumos e Materiais', 'despesa'],
      ['Custos Fixos / Ocupação', 'despesa'],
      ['Equipe / Folha de Pagamento', 'despesa'],
      ['Impostos e Taxas', 'despesa'],
      ['Marketing e Publicidade', 'despesa'],
      ['Equipamentos e Manutenção', 'despesa'],
      ['Outras Despesas', 'despesa'],
    ]
    let criadas = 0
    padrao.forEach(([nome, tipo]) => {
      const existe = app.findRecordsByFilter(
        'financeiro_categorias',
        `nome = "${nome}" && tipo = "${tipo}"`,
        '',
        1,
        0,
      )
      if (existe.length === 0) {
        const rec = new Record(col)
        rec.set('nome', nome)
        rec.set('tipo', tipo)
        rec.set('ativa', true)
        rec.set('criado_por', 'seed')
        app.save(rec)
        criadas++
      }
    })
    if (criadas > 0) console.log(`0005: ${criadas} categorias padrão criadas`)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('financeiro_categorias')
      app.delete(col)
    } catch (_) {}
  },
)
