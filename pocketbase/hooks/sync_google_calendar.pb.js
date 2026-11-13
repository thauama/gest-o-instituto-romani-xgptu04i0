/**
 * Sincronização central de consultas com o Google Calendar da clínica.
 *
 * Toda consulta criada/alterada/removida em QUALQUER tela do app (Agenda,
 * Prontuário, Chat IA, etc.) passa pela coleção `consultas` do PocketBase.
 * Este hook roda no servidor (pós-commit) e mantém o Google Calendar
 * espelhado — não depende de nenhuma tela lembrar de chamar a integração.
 *
 * Usa a conta do DONO do app (owner-mode) conectada ao toolkit `googlecalendar`
 * (Conectores do painel). A conta de quem usa o app NÃO é exigida.
 *
 * Nota da JSVM: callbacks rodam num pool separado — TODA a lógica fica
 * inline dentro de cada callback, sem referenciar declarações de topo.
 */

// Consulta criada em qualquer tela → evento no Google Calendar da clínica.
onRecordAfterCreateSuccess((e) => {
  try {
    const c = e.record
    if (c.get('origem') === 'google_sync') {
      e.next()
      return
    }
    const data = c.get('data')
    if (!data) {
      e.next()
      return
    }
    const horario = c.get('horario') || '09:00'
    // Fim = 1h após o início; se vira o dia, usa a data seguinte.
    const horaNum = parseInt(horario.split(':')[0], 10) + 1
    let diaFim = data
    if (horaNum >= 24) {
      const d = new Date(`${data}T00:00:00Z`)
      d.setUTCDate(d.getUTCDate() + 1)
      diaFim = d.toISOString().slice(0, 10)
    }
    const hora = String(horaNum % 24).padStart(2, '0')
    const min = horario.split(':')[1]

    // Título do evento: "Consulta — {nome da paciente} · {procedimento/tipo}".
    let nomePaciente = ''
    try {
      const clienteId = c.getString('cliente')
      if (clienteId) {
        nomePaciente = $app.findRecordById('clientes', clienteId).getString('nome')
      }
    } catch (_) {}
    let summary = 'Consulta'
    if (nomePaciente) summary = `Consulta — ${nomePaciente}`
    const tipoConsulta = c.getString('tipo')
    if (tipoConsulta) summary += ` · ${tipoConsulta}`
    console.log(`[google_sync] afterCreate summary: ${summary}`)

    const payload = {
      summary: summary,
      description: `Profissional: ${c.get('profissional') || 'Dr. Pedro Ivo Romani'}\nObservações: ${c.get('observacoes') || '—'}`,
      start_datetime: `${data}T${horario}:00`,
      end_datetime: `${diaFim}T${hora}:${min}:00`,
      send_updates: 'none',
    }
    const res = $connectors.executeAsOwner('GOOGLECALENDAR_CREATE_EVENT', payload)
    const novoId =
      res?.data?.response_data?.id || res?.response_data?.id || res?.data?.id || res?.id || ''
    if (novoId) {
      // Grava o id e marca a origem para não re-disparar o hook em loop.
      const col = $app.findCollectionByNameOrId('consultas')
      const rec = $app.findRecordById(col, c.id)
      rec.set('google_event_id', novoId)
      rec.set('origem', 'google_sync')
      $app.save(rec)
    } else {
      console.warn('[google_sync] criação de evento sem id na resposta', JSON.stringify(res))
    }
  } catch (err) {
    console.warn('[google_sync] afterCreate', err)
  } finally {
    e.next()
  }
}, 'consultas')

// Consulta remarcada, realizada ou desmarcada → evento ajustado no Google.
onRecordAfterUpdateSuccess((e) => {
  try {
    const c = e.record
    // Pula apenas o ECO do próprio hook (save que só grava google_event_id/
    // origem). Uma remarcação feita pelo usuário altera campos de agenda e
    // DEVE atualizar o evento — antes este guard bloqueava toda remarcação.
    const camposUsuario = [
      'cliente',
      'data',
      'horario',
      'status',
      'tipo',
      'profissional',
      'observacoes',
    ]
    let usuarioEditou = false
    for (let i = 0; i < camposUsuario.length; i++) {
      const f = camposUsuario[i]
      if ((c.getString(f) || '') !== (c.original().getString(f) || '')) {
        usuarioEditou = true
        break
      }
    }
    if (!usuarioEditou && c.get('origem') === 'google_sync') {
      e.next()
      return
    }
    const eventoId = c.get('google_event_id') || ''
    const status = c.get('status')

    if (status === 'desmarcada') {
      // Desmarcada: remove o evento do Google Calendar.
      if (eventoId) {
        $connectors.executeAsOwner('GOOGLECALENDAR_DELETE_EVENT', {
          event_id: eventoId,
        })
      }
      e.next()
      return
    }

    const data = c.get('data')
    if (!data) {
      e.next()
      return
    }
    const horario = c.get('horario') || '09:00'
    // Fim = 1h após o início; se vira o dia, usa a data seguinte.
    const horaNum = parseInt(horario.split(':')[0], 10) + 1
    let diaFim = data
    if (horaNum >= 24) {
      const d = new Date(`${data}T00:00:00Z`)
      d.setUTCDate(d.getUTCDate() + 1)
      diaFim = d.toISOString().slice(0, 10)
    }
    const hora = String(horaNum % 24).padStart(2, '0')
    const min = horario.split(':')[1]

    // Título do evento: "Consulta — {nome da paciente} · {procedimento/tipo}".
    let nomePaciente = ''
    try {
      const clienteId = c.getString('cliente')
      if (clienteId) {
        nomePaciente = $app.findRecordById('clientes', clienteId).getString('nome')
      }
    } catch (_) {}
    let summary = 'Consulta'
    if (nomePaciente) summary = `Consulta — ${nomePaciente}`
    const tipoConsulta = c.getString('tipo')
    if (tipoConsulta) summary += ` · ${tipoConsulta}`
    console.log(`[google_sync] afterUpdate summary: ${summary}`)

    const payload = {
      summary: summary,
      description: `Profissional: ${c.get('profissional') || 'Dr. Pedro Ivo Romani'}\nObservações: ${c.get('observacoes') || '—'}`,
      start_datetime: `${data}T${horario}:00`,
      end_datetime: `${diaFim}T${hora}:${min}:00`,
      send_updates: 'none',
    }
    if (eventoId) {
      // Remarcação/edição: atualiza o evento existente.
      $connectors.executeAsOwner('GOOGLECALENDAR_UPDATE_EVENT', {
        event_id: eventoId,
        ...payload,
      })
    } else {
      // Consulta criada em outra tela sem evento vinculado ainda.
      const res = $connectors.executeAsOwner('GOOGLECALENDAR_CREATE_EVENT', payload)
      const novoId =
        res?.data?.response_data?.id || res?.response_data?.id || res?.data?.id || res?.id || ''
      if (novoId) {
        const col = $app.findCollectionByNameOrId('consultas')
        const rec = $app.findRecordById(col, c.id)
        rec.set('google_event_id', novoId)
        rec.set('origem', 'google_sync')
        $app.save(rec)
      } else {
        console.warn('[google_sync] update sem evento e criação sem id', JSON.stringify(res))
      }
    }
  } catch (err) {
    console.warn('[google_sync] afterUpdate', err)
  } finally {
    e.next()
  }
}, 'consultas')

// Consulta excluída do sistema → evento removido do Google Calendar.
onRecordAfterDeleteSuccess((e) => {
  try {
    const eventoId = e.record.get('google_event_id') || ''
    if (eventoId) {
      $connectors.executeAsOwner('GOOGLECALENDAR_DELETE_EVENT', {
        event_id: eventoId,
      })
    }
  } catch (err) {
    console.warn('[google_sync] afterDelete', err)
  } finally {
    e.next()
  }
}, 'consultas')
