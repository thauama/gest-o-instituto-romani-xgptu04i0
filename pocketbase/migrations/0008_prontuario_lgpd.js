// 0008 — Módulo PRONTUÁRIO (LGPD)
// Coleções:
//   prontuario_anamnese            — anamnese do paciente em módulos editáveis (json)
//   prontuario_modelos_anamnese    — modelos de anamnese editáveis pelo admin (Dr. Pedro Ivo)
//   prontuario_observacoes         — observações sobre o paciente
//   prontuario_evolucao            — evolução clínica + transcrição (texto colado do Plaud) + anexo
//   prontuario_arquivos            — fotos, exames, contratos, orçamentos e vídeos do paciente
//   prontuario_documentos          — prescrições e pedidos de exames (com reemissão via reemitido_de)
//   prontuario_modelos_documentos  — modelos de prescrição/pedido de exames (semeados)
//   prontuario_auditoria           — registro create-only de acessos (LGPD; sem update/delete)
//   prontuario_consentimento       — consentimentos LGPD do paciente
// Regras: prontuário é EXCLUSIVO do admin (equipe não acessa) — todas as regras exigem
// @request.auth.role = 'admin'. Auditoria é create-only (update/delete nunca).
migrate(
  (app) => {
    const clientesColId = app.findCollectionByNameOrId('clientes').id

    const regrasAdmin = {
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
    }

    const criarSeNaoExiste = (nome, fabricar) => {
      try {
        return app.findCollectionByNameOrId(nome)
      } catch (_) {
        const col = fabricar()
        app.save(col)
        return app.findCollectionByNameOrId(nome)
      }
    }

    // ---- Modelos de anamnese (editáveis pelo admin) ----
    const modelosAnamnese = criarSeNaoExiste(
      'prontuario_modelos_anamnese',
      () =>
        new Collection({
          name: 'prontuario_modelos_anamnese',
          type: 'base',
          ...regrasAdmin,
          fields: [
            { name: 'nome', type: 'text', required: true, max: 120 },
            { name: 'descricao', type: 'text' },
            // [{ titulo, tipo: 'texto'|'texto_longo'|'sim_nao', obrigatorio }]
            { name: 'campos', type: 'json', maxSize: 2000000 },
            { name: 'ativo', type: 'bool' },
            { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
            { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
          ],
        }),
    )

    // ---- Anamnese (módulos por paciente) ----
    const anamnese = criarSeNaoExiste(
      'prontuario_anamnese',
      () =>
        new Collection({
          name: 'prontuario_anamnese',
          type: 'base',
          ...regrasAdmin,
          fields: [
            {
              name: 'paciente',
              type: 'relation',
              collectionId: clientesColId,
              maxSelect: 1,
              required: true,
            },
            { name: 'titulo', type: 'text', required: true, max: 160 },
            // [{ titulo, conteudo }] — módulos editáveis pelo Dr. Pedro Ivo
            { name: 'modulos', type: 'json', maxSize: 2000000 },
            { name: 'modelo', type: 'relation', collectionId: modelosAnamnese.id, maxSelect: 1 },
            { name: 'preenchido_por', type: 'text' },
            { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
            { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
          ],
          indexes: ['CREATE INDEX idx_anamnese_paciente ON prontuario_anamnese (paciente)'],
        }),
    )

    // ---- Observações sobre o paciente ----
    criarSeNaoExiste(
      'prontuario_observacoes',
      () =>
        new Collection({
          name: 'prontuario_observacoes',
          type: 'base',
          ...regrasAdmin,
          fields: [
            {
              name: 'paciente',
              type: 'relation',
              collectionId: clientesColId,
              maxSelect: 1,
              required: true,
            },
            { name: 'texto', type: 'text', required: true },
            { name: 'autor', type: 'text' },
            { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
            { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
          ],
          indexes: ['CREATE INDEX idx_observacoes_paciente ON prontuario_observacoes (paciente)'],
        }),
    )

    // ---- Evolução + transcrição (Plaud: colar texto + anexo opcional) ----
    criarSeNaoExiste(
      'prontuario_evolucao',
      () =>
        new Collection({
          name: 'prontuario_evolucao',
          type: 'base',
          ...regrasAdmin,
          fields: [
            {
              name: 'paciente',
              type: 'relation',
              collectionId: clientesColId,
              maxSelect: 1,
              required: true,
            },
            { name: 'data', type: 'text', required: true }, // YYYY-MM-DD
            { name: 'titulo', type: 'text', max: 160 },
            { name: 'descricao', type: 'text' }, // evolução clínica
            { name: 'transcricao', type: 'text' }, // texto colado do Plaud
            { name: 'anexo', type: 'file', maxSelect: 1, maxSize: 26214400 },
            { name: 'autor', type: 'text' },
            { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
            { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
          ],
          indexes: ['CREATE INDEX idx_evolucao_paciente ON prontuario_evolucao (paciente)'],
        }),
    )

    // ---- Arquivos (fotos, exames, contratos, orçamentos, vídeos) ----
    criarSeNaoExiste(
      'prontuario_arquivos',
      () =>
        new Collection({
          name: 'prontuario_arquivos',
          type: 'base',
          ...regrasAdmin,
          fields: [
            {
              name: 'paciente',
              type: 'relation',
              collectionId: clientesColId,
              maxSelect: 1,
              required: true,
            },
            { name: 'titulo', type: 'text', required: true, max: 160 },
            {
              name: 'categoria',
              type: 'select',
              values: ['exame', 'foto', 'contrato', 'orcamento', 'video', 'outro'],
              maxSelect: 1,
              required: true,
            },
            { name: 'arquivo', type: 'file', required: true, maxSelect: 1, maxSize: 52428800 },
            { name: 'descricao', type: 'text' },
            { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
            { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
          ],
          indexes: ['CREATE INDEX idx_arquivos_paciente ON prontuario_arquivos (paciente)'],
        }),
    )

    // ---- Modelos de documentos (prescrições e pedidos de exames) ----
    const modelosDocs = criarSeNaoExiste(
      'prontuario_modelos_documentos',
      () =>
        new Collection({
          name: 'prontuario_modelos_documentos',
          type: 'base',
          ...regrasAdmin,
          fields: [
            { name: 'nome', type: 'text', required: true, max: 120 },
            {
              name: 'tipo',
              type: 'select',
              values: ['prescricao', 'pedido_exame'],
              maxSelect: 1,
              required: true,
            },
            // Placeholders: {paciente}, {data}, {profissional}
            { name: 'conteudo', type: 'text', required: true },
            { name: 'ativo', type: 'bool' },
            { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
            { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
          ],
        }),
    )

    // ---- Documentos gerados (prescrições / pedidos de exames) ----
    const documentos = criarSeNaoExiste(
      'prontuario_documentos',
      () =>
        new Collection({
          name: 'prontuario_documentos',
          type: 'base',
          ...regrasAdmin,
          fields: [
            {
              name: 'paciente',
              type: 'relation',
              collectionId: clientesColId,
              maxSelect: 1,
              required: true,
            },
            {
              name: 'tipo',
              type: 'select',
              values: ['prescricao', 'pedido_exame'],
              maxSelect: 1,
              required: true,
            },
            { name: 'titulo', type: 'text', required: true, max: 160 },
            { name: 'conteudo', type: 'text', required: true },
            { name: 'data', type: 'text' }, // YYYY-MM-DD
            { name: 'modelo', type: 'relation', collectionId: modelosDocs.id, maxSelect: 1 },
            { name: 'reemitido', type: 'bool' },
            { name: 'emitido_por', type: 'text' },
            { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
            { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
          ],
          indexes: ['CREATE INDEX idx_documentos_paciente ON prontuario_documentos (paciente)'],
        }),
    )
    // Auto-relação de reemissão (aponta para a própria coleção, criada agora)
    if (!documentos.fields.getByName('reemitido_de')) {
      documentos.fields.add(
        new RelationField({
          name: 'reemitido_de',
          collectionId: documentos.id,
          maxSelect: 1,
          required: false,
        }),
      )
      app.save(documentos)
    }

    // ---- Auditoria de acessos (create-only, LGPD) ----
    criarSeNaoExiste(
      'prontuario_auditoria',
      () =>
        new Collection({
          name: 'prontuario_auditoria',
          type: 'base',
          listRule: "@request.auth.role = 'admin'",
          viewRule: "@request.auth.role = 'admin'",
          createRule: "@request.auth.id != ''",
          updateRule: null,
          deleteRule: null,
          fields: [
            {
              name: 'paciente',
              type: 'relation',
              collectionId: clientesColId,
              maxSelect: 1,
              required: true,
            },
            {
              name: 'acao',
              type: 'select',
              values: ['visualizacao', 'criacao', 'edicao', 'impressao', 'download', 'reemissao'],
              maxSelect: 1,
              required: true,
            },
            { name: 'detalhe', type: 'text' },
            { name: 'usuario', type: 'text' }, // nome/e-mail de quem acessou
            { name: 'usuario_id', type: 'text' },
            { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          ],
          indexes: [
            'CREATE INDEX idx_auditoria_paciente ON prontuario_auditoria (paciente)',
            'CREATE INDEX idx_auditoria_acao ON prontuario_auditoria (acao)',
          ],
        }),
    )

    // ---- Consentimento LGPD ----
    criarSeNaoExiste(
      'prontuario_consentimento',
      () =>
        new Collection({
          name: 'prontuario_consentimento',
          type: 'base',
          ...regrasAdmin,
          fields: [
            {
              name: 'paciente',
              type: 'relation',
              collectionId: clientesColId,
              maxSelect: 1,
              required: true,
            },
            {
              name: 'tipo',
              type: 'select',
              values: ['uso_dados', 'tratamento', 'imagem', 'outro'],
              maxSelect: 1,
              required: true,
            },
            { name: 'versao', type: 'text' }, // ex.: '1.0 — 2026-11'
            { name: 'conteudo', type: 'text' }, // texto do termo no momento da assinatura
            { name: 'assinado', type: 'bool' },
            { name: 'assinado_em', type: 'text' }, // YYYY-MM-DD
            { name: 'arquivo', type: 'file', maxSelect: 1, maxSize: 26214400 }, // termo assinado
            { name: 'registrado_por', type: 'text' },
            { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
            { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
          ],
          indexes: [
            'CREATE INDEX idx_consentimento_paciente ON prontuario_consentimento (paciente)',
          ],
        }),
    )

    // ---- Seeds idempotentes ----
    const seedUnico = (colecao, filtro, dados) => {
      const existe = app.findRecordsByFilter(colecao, filtro, '', 1, 0)
      if (existe.length > 0) return false
      const rec = new Record(app.findCollectionByNameOrId(colecao))
      for (const [k, v] of Object.entries(dados)) rec.set(k, v)
      app.save(rec)
      return true
    }

    const modelosAnamneseSeed = [
      {
        nome: 'Anamnese Completa — Cirurgia Plástica',
        descricao:
          'Modelo padrão do Instituto Romani. O admin pode editar os campos ou criar novos modelos.',
        ativo: true,
        campos: [
          { titulo: 'Queixa principal', tipo: 'texto_longo', obrigatorio: true },
          { titulo: 'História da queixa', tipo: 'texto_longo', obrigatorio: false },
          { titulo: 'Antecedentes pessoais', tipo: 'texto_longo', obrigatorio: false },
          { titulo: 'Cirurgias anteriores', tipo: 'texto_longo', obrigatorio: false },
          { titulo: 'Medicamentos em uso', tipo: 'texto_longo', obrigatorio: false },
          { titulo: 'Alergias', tipo: 'texto', obrigatorio: false },
          { titulo: 'Tabagismo / Etilismo', tipo: 'texto', obrigatorio: false },
          { titulo: 'História familiar', tipo: 'texto_longo', obrigatorio: false },
          { titulo: 'Exame físico', tipo: 'texto_longo', obrigatorio: false },
          {
            titulo: 'Autoriza o uso de imagens para fins clínicos?',
            tipo: 'sim_nao',
            obrigatorio: true,
          },
        ],
      },
      {
        nome: 'Anamnese Ambulatorial — Consulta Inicial',
        descricao: 'Modelo curto para consultas de avaliação.',
        ativo: true,
        campos: [
          { titulo: 'Motivo da consulta', tipo: 'texto_longo', obrigatorio: true },
          { titulo: 'Medicamentos em uso', tipo: 'texto_longo', obrigatorio: false },
          { titulo: 'Alergias', tipo: 'texto', obrigatorio: false },
        ],
      },
    ]
    for (const m of modelosAnamneseSeed) {
      seedUnico('prontuario_modelos_anamnese', `nome = "${m.nome}"`, m)
    }

    const modelosDocsSeed = [
      {
        nome: 'Receita padrão pós-operatória',
        tipo: 'prescricao',
        ativo: true,
        conteudo:
          'PRESCRIÇÃO MÉDICA\n\nPaciente: {paciente}\nData: {data}\nProfissional: {profissional}\n\nMedicamentos:\n1) ______________________\n2) ______________________\n3) ______________________\n\nOrientações: tomar com água, evitar jejum prolongado.\n\nDr. Pedro Ivo Romani\nCRM __________ · Cirurgia Plástica',
      },
      {
        nome: 'Prescrição de analgesia pós-operatória',
        tipo: 'prescricao',
        ativo: true,
        conteudo:
          'PRESCRIÇÃO MÉDICA — ANALGESIA\n\nPaciente: {paciente}\nData: {data}\nProfissional: {profissional}\n\n1) Dipirona 500 mg — 1 comprimido a cada 6 h em caso de dor.\n2) Omeprazol 20 mg — 1 cápsula em jejum, por 7 dias.\n3) ______________________\n\nEm caso de dor intensa, contatar a clínica.\n\nDr. Pedro Ivo Romani\nCRM __________ · Cirurgia Plástica',
      },
      {
        nome: 'Pedido de exames laboratoriais pré-operatórios',
        tipo: 'pedido_exame',
        ativo: true,
        conteudo:
          'SOLICITAÇÃO DE EXAMES LABORATORIAIS\n\nPaciente: {paciente}\nData: {data}\nProfissional: {profissional}\n\nSolicito:\n[ ] Hemograma completo\n[ ] Coagulograma (TAP/INR, TTPA)\n[ ] Glicemia de jejum\n[ ] Ureia e creatinina\n[ ] Sorologias (HBsAg, anti-HCV, anti-HIV)\n[ ] Eletrocardiograma de repouso\n\nDr. Pedro Ivo Romani\nCRM __________ · Cirurgia Plástica',
      },
      {
        nome: 'Pedido de exame de imagem',
        tipo: 'pedido_exame',
        ativo: true,
        conteudo:
          'SOLICITAÇÃO DE EXAME DE IMAGEM\n\nPaciente: {paciente}\nData: {data}\nProfissional: {profissional}\n\nSolicito:\n[ ] Ultrassonografia\n[ ] Mamografia\n[ ] Ressonância magnética\n[ ] Tomografia\n\nRegião: ______________________\nObservações: ______________________\n\nDr. Pedro Ivo Romani\nCRM __________ · Cirurgia Plástica',
      },
    ]
    for (const m of modelosDocsSeed) {
      seedUnico('prontuario_modelos_documentos', `nome = "${m.nome}"`, m)
    }

    console.log('0008: coleções do prontuário + modelos semeados garantidos (LGPD, somente admin)')
  },
  (app) => {
    const colecoes = [
      'prontuario_consentimento',
      'prontuario_auditoria',
      'prontuario_documentos',
      'prontuario_modelos_documentos',
      'prontuario_arquivos',
      'prontuario_evolucao',
      'prontuario_observacoes',
      'prontuario_anamnese',
      'prontuario_modelos_anamnese',
    ]
    for (const nome of colecoes) {
      try {
        const col = app.findCollectionByNameOrId(nome)
        app.delete(col)
      } catch (_) {}
    }
  },
)
