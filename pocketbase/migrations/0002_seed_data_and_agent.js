migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Seed Dr. Pedro Ivo (Admin) - current account romani@institutoromani.com.br
    try {
      const adminUser = app.findAuthRecordByEmail(
        '_pb_users_auth_',
        'romani@institutoromani.com.br',
      )
      adminUser.set('name', 'Dr. Pedro Ivo Romani')
      adminUser.set('role', 'admin')
      app.save(adminUser)
    } catch (_) {
      const adminUser = new Record(users)
      adminUser.setEmail('romani@institutoromani.com.br')
      adminUser.setPassword('Skip@Pass')
      adminUser.setVerified(true)
      adminUser.set('name', 'Dr. Pedro Ivo Romani')
      adminUser.set('role', 'admin')
      app.save(adminUser)
    }

    // 2. Seed Equipe user
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'equipe@institutoromani.com.br')
    } catch (_) {
      const equipeUser = new Record(users)
      equipeUser.setEmail('equipe@institutoromani.com.br')
      equipeUser.setPassword('Skip@Pass')
      equipeUser.setVerified(true)
      equipeUser.set('name', 'Recepção / Enfermagem')
      equipeUser.set('role', 'equipe')
      app.save(equipeUser)
    }

    // 3. Seed Clientes
    const clientesCol = app.findCollectionByNameOrId('clientes')
    let c1Id = '',
      c2Id = '',
      c3Id = ''

    try {
      const c1 = new Record(clientesCol)
      c1.set('nome', 'Mariana Alcantara Silveira')
      c1.set('rg', '44.892.110-3')
      c1.set('cpf', '321.456.789-01')
      c1.set('nascimento', '1990-05-14')
      c1.set('endereco', 'Rua Professora Zélia Dulce, 180, Campolim, Sorocaba - SP')
      c1.set('profissao', 'Arquiteta e Urbanista')
      c1.set('estado_civil', 'Casada')
      c1.set('email', 'mariana.silveira@email.com')
      c1.set('religiao', 'Católica')
      c1.set('peso', '62 kg')
      c1.set('altura', '1.68 m')
      c1.set('instagram', '@mariana.arq')
      c1.set('contato', '(15) 99781-4455')
      c1.set(
        'observacoes',
        'Interesse em Mastopexia com prótese e lipoaspiração HD. Sem alergias medicamentosas conhecidas.',
      )
      c1.set('status_cadastro', 'completo')
      app.save(c1)
      c1Id = c1.id

      const c2 = new Record(clientesCol)
      c2.set('nome', 'Juliana Mendes de Castro')
      c2.set('rg', '38.411.750-X')
      c2.set('cpf', '412.873.910-44')
      c2.set('nascimento', '1987-11-23')
      c2.set('endereco', 'Av. Barão de Tatuí, 620, Sorocaba - SP')
      c2.set('profissao', 'Empresária')
      c2.set('estado_civil', 'Divorciada')
      c2.set('email', 'juliana.castro@mendes.com.br')
      c2.set('religiao', 'Espírita')
      c2.set('peso', '58 kg')
      c2.set('altura', '1.64 m')
      c2.set('instagram', '@jumendescastro')
      c2.set('contato', '(15) 99124-7733')
      c2.set('observacoes', 'Rinoplastia estética e funcional. Pré-operatório agendado.')
      c2.set('status_cadastro', 'completo')
      app.save(c2)
      c2Id = c2.id

      const c3 = new Record(clientesCol)
      c3.set('nome', 'Carla Beatriz Ribeiro')
      c3.set('rg', '52.180.993-8')
      c3.set('cpf', '501.229.830-12')
      c3.set('nascimento', '1995-02-18')
      c3.set('endereco', 'Sorocaba - SP')
      c3.set('profissao', 'Advogada')
      c3.set('estado_civil', 'Solteira')
      c3.set('email', 'carla.ribeiro@adv.com')
      c3.set('religiao', 'Não informada')
      c3.set('peso', '65 kg')
      c3.set('altura', '1.71 m')
      c3.set('instagram', '@carlaribeiro.adv')
      c3.set('contato', '(15) 98118-9900')
      c3.set('observacoes', 'Cadastro iniciado via link público.')
      c3.set('status_cadastro', 'pendente_preenchimento')
      app.save(c3)
      c3Id = c3.id
    } catch (err) {
      console.log('Seed clientes notice:', err)
    }

    // 4. Seed Itens
    const itensCol = app.findCollectionByNameOrId('itens')
    let it1Id = '',
      it2Id = '',
      it3Id = '',
      it4Id = '',
      it5Id = ''
    try {
      const i1 = new Record(itensCol)
      i1.set('nome', 'Prótese de Silicone Motiva 320ml')
      i1.set('tipo', 'peca')
      i1.set('quantidade', 4)
      i1.set('preco', 3200)
      i1.set('estoque_minimo', 2)
      i1.set('unidade', 'par')
      i1.set('descricao', 'Implantes mamários perfil alto texturizado')
      app.save(i1)
      it1Id = i1.id

      const i2 = new Record(itensCol)
      i2.set('nome', 'Toxina Botulínica Botox 100UI (Allergan)')
      i2.set('tipo', 'produto')
      i2.set('quantidade', 1) // Alerta estoque baixo!
      i2.set('preco', 950)
      i2.set('estoque_minimo', 3)
      i2.set('unidade', 'frasco')
      i2.set('descricao', 'Frasco ampola toxina botulínica tipo A')
      app.save(i2)
      it2Id = i2.id

      const i3 = new Record(itensCol)
      i3.set('nome', 'Fita de Silicone Pós-Cirúrgica Silimed')
      i3.set('tipo', 'produto')
      i3.set('quantidade', 8)
      i3.set('preco', 120)
      i3.set('estoque_minimo', 5)
      i3.set('unidade', 'cx')
      i3.set('descricao', 'Placa de gel de silicone para prevenção de queloide')
      app.save(i3)
      it3Id = i3.id

      const i4 = new Record(itensCol)
      i4.set('nome', 'Cinta Modeladora Pós-Cirúrgica Tamanho M')
      i4.set('tipo', 'peca')
      i4.set('quantidade', 2)
      i4.set('preco', 260)
      i4.set('estoque_minimo', 3)
      i4.set('unidade', 'un')
      i4.set('descricao', 'Malha compressiva com reforço duplo')
      app.save(i4)
      it4Id = i4.id

      const i5 = new Record(itensCol)
      i5.set('nome', 'Sessão Drenagem Linfática Pós-Operatória')
      i5.set('tipo', 'servico')
      i5.set('quantidade', 20)
      i5.set('preco', 180)
      i5.set('estoque_minimo', 0)
      i5.set('unidade', 'sessão')
      i5.set('descricao', 'Atendimento de fisioterapia dermato-funcional pós-operatória')
      app.save(i5)
      it5Id = i5.id
    } catch (err) {
      console.log('Seed itens notice:', err)
    }

    // 5. Seed Movimentações
    const movCol = app.findCollectionByNameOrId('movimentacoes')
    try {
      const today = new Date().toISOString().slice(0, 10)
      const m1 = new Record(movCol)
      m1.set('tipo', 'atendimento')
      m1.set('data', today)
      if (it2Id) m1.set('item', it2Id)
      if (c2Id) m1.set('cliente', c2Id)
      m1.set('quantidade', 1)
      m1.set(
        'observacao',
        'Aplicação de toxina botulínica terço superior na paciente Juliana Mendes.',
      )
      app.save(m1)

      const m2 = new Record(movCol)
      m2.set('tipo', 'saida')
      m2.set('data', today)
      if (it4Id) m2.set('item', it4Id)
      if (c1Id) m2.set('cliente', c1Id)
      m2.set('quantidade', 1)
      m2.set(
        'observacao',
        'Entrega de cinta compressiva para Mariana Silveira (cirurgia agendada).',
      )
      app.save(m2)

      const m3 = new Record(movCol)
      m3.set('tipo', 'entrada')
      m3.set('data', today)
      if (it1Id) m3.set('item', it1Id)
      m3.set('quantidade', 2)
      m3.set('observacao', 'Recebimento de lote de próteses Motiva pelo fornecedor.')
      app.save(m3)
    } catch (err) {
      console.log('Seed movimentacoes notice:', err)
    }

    // 6. Seed Orçamentos
    const orcCol = app.findCollectionByNameOrId('orcamentos')
    try {
      if (c1Id) {
        const o1 = new Record(orcCol)
        o1.set('cliente', c1Id)
        o1.set('procedimento', 'Mastopexia com Prótese de Silicone')
        o1.set('valor', 24500)
        o1.set('status', 'aprovado')
        o1.set('validade', '2025-05-30')
        o1.set('observacoes', 'Inclui equipe cirúrgica, anestesia e 6 consultas pós-operatórias.')
        app.save(o1)
      }
      if (c2Id) {
        const o2 = new Record(orcCol)
        o2.set('cliente', c2Id)
        o2.set('procedimento', 'Rinoplastia Estruturada')
        o2.set('valor', 18900)
        o2.set('status', 'aprovado')
        o2.set('validade', '2025-04-15')
        o2.set('observacoes', 'Tratamento de septo e refinamento de ponta nasal.')
        app.save(o2)
      }
      if (c3Id) {
        const o3 = new Record(orcCol)
        o3.set('cliente', c3Id)
        o3.set('procedimento', 'Lipoaspiração HD Abdominal')
        o3.set('valor', 22000)
        o3.set('status', 'emitido')
        o3.set('validade', '2025-06-10')
        o3.set('observacoes', 'Orçamento enviado por e-mail para avaliação.')
        app.save(o3)
      }
    } catch (err) {
      console.log('Seed orcamentos notice:', err)
    }

    // 7. Seed Contratos
    const contCol = app.findCollectionByNameOrId('contratos')
    let ct1Id = '',
      ct2Id = ''
    try {
      if (c1Id) {
        const ct1 = new Record(contCol)
        ct1.set('cliente', c1Id)
        ct1.set('procedimento', 'Mastopexia com Prótese de Silicone')
        ct1.set('valor', 24500)
        ct1.set('data_emissao', '2024-03-10') // Passou de 1 ano -> Alerta de contrato vencendo/vencido!
        ct1.set('situacao', 'assinado')
        ct1.set('previsao_procedimento', '2025-04-20')
        ct1.set(
          'observacoes',
          'Contrato emitido há mais de 12 meses; requer revisão de exames antes do procedimento.',
        )
        app.save(ct1)
        ct1Id = ct1.id
      }

      if (c2Id) {
        const ct2 = new Record(contCol)
        ct2.set('cliente', c2Id)
        ct2.set('procedimento', 'Rinoplastia Estruturada')
        ct2.set('valor', 18900)
        ct2.set('data_emissao', '2025-02-15')
        ct2.set('situacao', 'assinado')
        ct2.set('previsao_procedimento', '2025-05-10')
        ct2.set('observacoes', 'Contrato regular com procedimento agendado para maio.')
        app.save(ct2)
        ct2Id = ct2.id
      }
    } catch (err) {
      console.log('Seed contratos notice:', err)
    }

    // 8. Seed Checklist
    const checkCol = app.findCollectionByNameOrId('checklist')
    try {
      if (ct1Id) {
        const ch1 = new Record(checkCol)
        ch1.set('contrato', ct1Id)
        if (it1Id) ch1.set('item', it1Id)
        ch1.set('descricao', 'Reserva de Prótese Silicone Motiva 320ml')
        ch1.set('situacao', 'concluido')
        ch1.set('quantidade', 1)
        app.save(ch1)

        const ch2 = new Record(checkCol)
        ch2.set('contrato', ct1Id)
        if (it4Id) ch2.set('item', it4Id)
        ch2.set('descricao', 'Cinta modeladora cirúrgica M entregue')
        ch2.set('situacao', 'concluido')
        ch2.set('quantidade', 1)
        app.save(ch2)

        const ch3 = new Record(checkCol)
        ch3.set('contrato', ct1Id)
        ch3.set('descricao', 'Exames de sangue pré-operatórios atualizados')
        ch3.set('situacao', 'pendente')
        ch3.set('quantidade', 1)
        app.save(ch3)

        const ch4 = new Record(checkCol)
        ch4.set('contrato', ct1Id)
        ch4.set('descricao', 'Liberação cardiológica (Risco Cirúrgico)')
        ch4.set('situacao', 'pendente')
        ch4.set('quantidade', 1)
        app.save(ch4)
      }

      if (ct2Id) {
        const ch5 = new Record(checkCol)
        ch5.set('contrato', ct2Id)
        ch5.set('descricao', 'Tomografia de seios da face')
        ch5.set('situacao', 'concluido')
        ch5.set('quantidade', 1)
        app.save(ch5)

        const ch6 = new Record(checkCol)
        ch6.set('contrato', ct2Id)
        ch6.set('descricao', 'Molde e fotos de planejamento nasal')
        ch6.set('situacao', 'pendente')
        ch6.set('quantidade', 1)
        app.save(ch6)
      }
    } catch (err) {
      console.log('Seed checklist notice:', err)
    }

    // 9. Seed Consultas
    const consCol = app.findCollectionByNameOrId('consultas')
    try {
      const today = new Date().toISOString().slice(0, 10)
      if (c1Id) {
        const cn1 = new Record(consCol)
        cn1.set('cliente', c1Id)
        cn1.set('data', today)
        cn1.set('horario', '14:30')
        cn1.set('status', 'agendada')
        cn1.set('tipo', 'Consulta Pré-Operatória')
        cn1.set('profissional', 'Dr. Pedro Ivo Romani')
        cn1.set('observacoes', 'Checagem final de exames e esclarecimento de dúvidas.')
        app.save(cn1)
      }
      if (c2Id) {
        const cn2 = new Record(consCol)
        cn2.set('cliente', c2Id)
        cn2.set('data', today)
        cn2.set('horario', '16:00')
        cn2.set('status', 'agendada')
        cn2.set('tipo', 'Retorno Pós-Procedimento')
        cn2.set('profissional', 'Dr. Pedro Ivo Romani')
        cn2.set('observacoes', 'Avaliação da evolução e cicatrização.')
        app.save(cn2)
      }
      if (c3Id) {
        const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
        const cn3 = new Record(consCol)
        cn3.set('cliente', c3Id)
        cn3.set('data', tomorrow)
        cn3.set('horario', '10:00')
        cn3.set('status', 'agendada')
        cn3.set('tipo', 'Primeira Avaliação')
        cn3.set('profissional', 'Dr. Pedro Ivo Romani')
        cn3.set('observacoes', 'Primeira consulta de cirurgia plástica corporal.')
        app.save(cn3)
      }
    } catch (err) {
      console.log('Seed consultas notice:', err)
    }

    // 10. Seed Financeiro
    const finCol = app.findCollectionByNameOrId('financeiro')
    try {
      const today = new Date().toISOString().slice(0, 10)
      const thisMonth = today.slice(0, 7) // YYYY-MM

      const f1 = new Record(finCol)
      f1.set('tipo', 'receita')
      f1.set('descricao', 'Entrada Contrato Cirurgia - Mariana Alcantara')
      f1.set('valor', 12250)
      f1.set('data', today)
      f1.set('categoria', 'Procedimentos Cirúrgicos')
      f1.set('mes_referencia', thisMonth)
      f1.set('nf_solicitada', true)
      f1.set('nf_email_destinatario', 'financeiro@institutoromani.com.br')
      if (c1Id) f1.set('cliente', c1Id)
      if (ct1Id) f1.set('contrato', ct1Id)
      app.save(f1)

      const f2 = new Record(finCol)
      f2.set('tipo', 'receita')
      f2.set('descricao', 'Aplicação Toxina Botulínica - Juliana Mendes')
      f2.set('valor', 1900)
      f2.set('data', today)
      f2.set('categoria', 'Procedimentos Ambulatoriais')
      f2.set('mes_referencia', thisMonth)
      f2.set('nf_solicitada', false)
      if (c2Id) f2.set('cliente', c2Id)
      app.save(f2)

      const f3 = new Record(finCol)
      f3.set('tipo', 'despesa')
      f3.set('descricao', 'Reposição Insumos Médicos Cirúrgicos')
      f3.set('valor', 3420)
      f3.set('data', today)
      f3.set('categoria', 'Insumos e Materiais')
      f3.set('mes_referencia', thisMonth)
      f3.set('nf_solicitada', false)
      app.save(f3)

      const f4 = new Record(finCol)
      f4.set('tipo', 'despesa')
      f4.set('descricao', 'Aluguel Sala Comercial Sorocaba')
      f4.set('valor', 4500)
      f4.set('data', today)
      f4.set('categoria', 'Custos Fixos / Ocupação')
      f4.set('mes_referencia', thisMonth)
      f4.set('nf_solicitada', false)
      app.save(f4)
    } catch (err) {
      console.log('Seed financeiro notice:', err)
    }

    // 11. Define native AI agent for clinic management
    try {
      $ai.agents.define(app, {
        slug: 'romani-gestor',
        name: 'Assistente de Gestão Romani',
        description: 'Assistente executivo e de gestão da clínica Instituto Romani (Dr. Pedro Ivo)',
        systemPrompt:
          'Você é o assistente inteligente da clínica Instituto Romani, de Sorocaba-SP, liderada pelo cirurgião plástico Dr. Pedro Ivo Romani. Você ajuda o Dr. Pedro Ivo e sua equipe a gerenciar consultas, pacientes, contratos com alerta de 1 ano, itens de estoque com quantidade mínima, orçamentos e financeiro (lucro bruto e líquido). Responda sempre em português do Brasil com cortesia médica profissional, objetividade e clareza. Você tem acesso direto às ferramentas das coleções da clínica.',
        tier: 'fast',
        tools: [
          { collection: 'clientes', perms: { list: true, read: true } },
          { collection: 'itens', perms: { list: true, read: true } },
          { collection: 'movimentacoes', perms: { list: true, read: true } },
          { collection: 'contratos', perms: { list: true, read: true } },
          { collection: 'orcamentos', perms: { list: true, read: true } },
          { collection: 'checklist', perms: { list: true, read: true } },
          { collection: 'consultas', perms: { list: true, read: true } },
          { collection: 'financeiro', perms: { list: true, read: true }, actAs: 'admin' },
        ],
        memory: [
          {
            type: 'text',
            payload: {
              text: 'Instituto Romani: Clínica de Cirurgia Plástica e Estética Avançada em Sorocaba-SP. Diretor Técnico: Dr. Pedro Ivo Romani.',
            },
          },
          {
            type: 'text',
            payload: {
              text: 'Regra de contratos: Contratos emitidos há mais de 1 ano (12 meses) devem emitir alerta prioritário de revisão médica e financeira antes de agendar cirurgia.',
            },
          },
          {
            type: 'text',
            payload: {
              text: 'Estoque: Itens com quantidade igual ou abaixo do estoque mínimo exigem reposição imediata.',
            },
          },
        ],
      })
    } catch (err) {
      console.log('Agent define notice:', err)
    }
  },
  (app) => {
    try {
      $ai.agents.delete(app, 'romani-gestor')
    } catch (_) {}
  },
)
