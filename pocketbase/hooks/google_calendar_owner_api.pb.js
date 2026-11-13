/**
 * Rotas da tela Agenda para o Google Calendar da clínica (owner-mode).
 *
 * A conta do DONO (toolkit `googlecalendar`, Conectores) é usada via
 * $connectors.executeAsOwner — o navegador de quem usa o app não tem conta
 * própria conectada, então /api/skip/connectors/execute não serve aqui.
 *
 * Nota da JSVM: callbacks rodam num pool separado — TODA a lógica fica
 * inline dentro de cada callback, sem referenciar declarações de topo.
 */

// Status da conta da clínica: { connected, motivo }.
routerAdd(
  'GET',
  '/backend/v1/romani/google-calendar/status',
  (e) => {
    try {
      const agora = new Date().toISOString()
      const res = $connectors.executeAsOwner('GOOGLECALENDAR_EVENTS_LIST', {
        timeMin: agora,
        maxResults: 1,
        singleEvents: true,
      })
      const ok = res?.successful !== false
      if (!ok) {
        return e.json(200, { connected: false, motivo: res?.error || 'Conta não disponível.' })
      }
      return e.json(200, { connected: true, motivo: '' })
    } catch (err) {
      return e.json(200, {
        connected: false,
        motivo: String(err && err.message ? err.message : err),
      })
    }
  },
  $apis.requireAuth(),
)

// Sincronização manual: lista os eventos do mês anterior até o seguinte.
routerAdd(
  'POST',
  '/backend/v1/romani/google-calendar/sync',
  (e) => {
    try {
      const now = new Date()
      const timeMin = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const timeMax = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString()
      const res = $connectors.executeAsOwner('GOOGLECALENDAR_EVENTS_LIST', {
        timeMin: timeMin,
        timeMax: timeMax,
        singleEvents: true,
        orderBy: 'startTime',
      })
      if (res?.successful === false) {
        return e.json(200, { ok: false, erro: res?.error || 'Falha ao listar eventos.', items: [] })
      }
      const items =
        res?.data?.items || res?.data?.response_data?.items || res?.response_data?.items || []
      return e.json(200, { ok: true, erro: '', items: items })
    } catch (err) {
      return e.json(200, {
        ok: false,
        erro: String(err && err.message ? err.message : err),
        items: [],
      })
    }
  },
  $apis.requireAuth(),
)
