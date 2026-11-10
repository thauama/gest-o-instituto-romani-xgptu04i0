migrate(
  (app) => {
    // 1. Update users collection to add role ('admin' or 'equipe')
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!users.fields.getByName('role')) {
      users.fields.add(
        new SelectField({
          name: 'role',
          values: ['admin', 'equipe'],
          maxSelect: 1,
          required: false,
        }),
      )
    }
    app.save(users)

    // 2. Clientes (Patients)
    // Public create/update allowed for public patient pre-registration link!
    const clientes = new Collection({
      name: 'clientes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: '', // allow public view by ID for patient pre-registration form
      createRule: '', // allow public creation or patient self-registration
      updateRule: '', // allow patient self-update via public form or auth users
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'rg', type: 'text' },
        { name: 'cpf', type: 'text' },
        { name: 'nascimento', type: 'text' },
        { name: 'endereco', type: 'text' },
        { name: 'profissao', type: 'text' },
        { name: 'estado_civil', type: 'text' },
        { name: 'email', type: 'email' },
        { name: 'religiao', type: 'text' },
        { name: 'peso', type: 'text' },
        { name: 'altura', type: 'text' },
        { name: 'instagram', type: 'text' },
        { name: 'contato', type: 'text' },
        { name: 'observacoes', type: 'text' },
        {
          name: 'status_cadastro',
          type: 'select',
          values: ['completo', 'pendente_preenchimento'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_clientes_nome ON clientes (nome)',
        'CREATE INDEX idx_clientes_cpf ON clientes (cpf)',
      ],
    })
    app.save(clientes)

    const clientesColId = clientes.id

    // 3. Itens (produtos, peças ou serviços com quantidade e preço)
    const itens = new Collection({
      name: 'itens',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'nome', type: 'text', required: true },
        {
          name: 'tipo',
          type: 'select',
          values: ['produto', 'peca', 'servico'],
          maxSelect: 1,
          required: true,
        },
        { name: 'quantidade', type: 'number', min: 0 },
        { name: 'preco', type: 'number', min: 0 },
        { name: 'estoque_minimo', type: 'number', min: 0 },
        { name: 'unidade', type: 'text' },
        { name: 'descricao', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_itens_nome ON itens (nome)',
        'CREATE INDEX idx_itens_tipo ON itens (tipo)',
      ],
    })
    app.save(itens)

    const itensColId = itens.id

    // 4. Movimentações (entradas, saídas e atendimentos do dia)
    const movimentacoes = new Collection({
      name: 'movimentacoes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'tipo',
          type: 'select',
          values: ['entrada', 'saida', 'atendimento'],
          maxSelect: 1,
          required: true,
        },
        { name: 'data', type: 'text', required: true }, // ISO or YYYY-MM-DD
        { name: 'item', type: 'relation', collectionId: itensColId, maxSelect: 1 },
        { name: 'cliente', type: 'relation', collectionId: clientesColId, maxSelect: 1 },
        { name: 'quantidade', type: 'number', min: 0 },
        { name: 'observacao', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_movimentacoes_data ON movimentacoes (data)'],
    })
    app.save(movimentacoes)

    // 5. Orçamentos (cliente, procedimento, valor, status: emitido, aprovado, reprovado)
    const orcamentos = new Collection({
      name: 'orcamentos',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'cliente',
          type: 'relation',
          collectionId: clientesColId,
          maxSelect: 1,
          required: true,
        },
        { name: 'procedimento', type: 'text', required: true },
        { name: 'valor', type: 'number', min: 0, required: false },
        {
          name: 'status',
          type: 'select',
          values: ['emitido', 'aprovado', 'reprovado'],
          maxSelect: 1,
          required: true,
        },
        { name: 'validade', type: 'text' },
        { name: 'observacoes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_orcamentos_status ON orcamentos (status)'],
    })
    app.save(orcamentos)

    // 6. Contratos (cliente, procedimento, valor, data de emissão, situação: assinado, pendente, previsão do procedimento)
    const contratos = new Collection({
      name: 'contratos',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'cliente',
          type: 'relation',
          collectionId: clientesColId,
          maxSelect: 1,
          required: true,
        },
        { name: 'procedimento', type: 'text', required: true },
        { name: 'valor', type: 'number', min: 0, required: false },
        { name: 'data_emissao', type: 'text', required: true }, // YYYY-MM-DD
        {
          name: 'situacao',
          type: 'select',
          values: ['assinado', 'pendente', 'cancelado', 'concluido'],
          maxSelect: 1,
          required: true,
        },
        { name: 'previsao_procedimento', type: 'text' }, // YYYY-MM-DD
        { name: 'observacoes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_contratos_situacao ON contratos (situacao)'],
    })
    app.save(contratos)

    const contratosColId = contratos.id

    // 7. Checklist (itens necessários por contrato e situação: pendente ou concluído)
    const checklist = new Collection({
      name: 'checklist',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'contrato',
          type: 'relation',
          collectionId: contratosColId,
          maxSelect: 1,
          required: true,
        },
        { name: 'item', type: 'relation', collectionId: itensColId, maxSelect: 1 },
        { name: 'descricao', type: 'text', required: true },
        {
          name: 'situacao',
          type: 'select',
          values: ['pendente', 'concluido'],
          maxSelect: 1,
          required: true,
        },
        { name: 'quantidade', type: 'number', min: 0 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(checklist)

    // 8. Consultas (cliente, data, status: agendada ou desmarcada, google_event_id, profissional, horario, notas)
    const consultas = new Collection({
      name: 'consultas',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'cliente',
          type: 'relation',
          collectionId: clientesColId,
          maxSelect: 1,
          required: true,
        },
        { name: 'data', type: 'text', required: true }, // YYYY-MM-DD
        { name: 'horario', type: 'text' }, // HH:mm
        {
          name: 'status',
          type: 'select',
          values: ['agendada', 'desmarcada', 'realizada'],
          maxSelect: 1,
          required: true,
        },
        { name: 'tipo', type: 'text' }, // Primeira Consulta, Retorno, Pré-operatório, Pós-operatório
        { name: 'profissional', type: 'text' }, // Dr. Pedro Ivo ou equipe
        { name: 'google_event_id', type: 'text' },
        { name: 'observacoes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_consultas_data ON consultas (data)',
        'CREATE INDEX idx_consultas_status ON consultas (status)',
      ],
    })
    app.save(consultas)

    // 9. Financeiro (receitas e despesas, data e valor do mês, categoria, solicitacao_nf)
    // Visible to authenticated users, but UI restricts full financial to admin role (@request.auth.role = 'admin')
    const financeiro = new Collection({
      name: 'financeiro',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'tipo',
          type: 'select',
          values: ['receita', 'despesa'],
          maxSelect: 1,
          required: true,
        },
        { name: 'descricao', type: 'text', required: true },
        { name: 'valor', type: 'number', min: 0, required: false },
        { name: 'data', type: 'text', required: true }, // YYYY-MM-DD
        { name: 'categoria', type: 'text' }, // Procedimentos, Honorários Médicos, Insumos, Aluguel, Folha, etc.
        { name: 'mes_referencia', type: 'text' }, // YYYY-MM
        { name: 'nf_solicitada', type: 'bool' },
        { name: 'nf_email_destinatario', type: 'email' },
        { name: 'cliente', type: 'relation', collectionId: clientesColId, maxSelect: 1 },
        { name: 'contrato', type: 'relation', collectionId: contratosColId, maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_financeiro_mes ON financeiro (mes_referencia)',
        'CREATE INDEX idx_financeiro_tipo ON financeiro (tipo)',
      ],
    })
    app.save(financeiro)
  },
  (app) => {
    const collections = [
      'financeiro',
      'consultas',
      'checklist',
      'contratos',
      'orcamentos',
      'movimentacoes',
      'itens',
      'clientes',
    ]
    for (const name of collections) {
      try {
        const col = app.findCollectionByNameOrId(name)
        app.delete(col)
      } catch (_) {}
    }
  },
)
