/// <reference path="../pb_data/types.d.ts" />

routerAdd(
  'POST',
  '/backend/v1/ai-chat',
  (e) => {
    try {
      const userId = e.auth?.id
      if (!userId) {
        return e.json(401, { error: 'Autenticação necessária.' })
      }

      const body = e.requestInfo().body || {}
      const message = body.message
      const conversationId = body.conversation_id || null

      if (!message || !message.trim()) {
        return e.json(400, { error: 'A mensagem é obrigatória.' })
      }

      const result = $ai.agent('romani-gestor').chat({
        user_id: userId,
        conversation_id: conversationId,
        message: message.trim(),
      })

      return e.json(200, {
        conversation_id: result.conversation_id,
        content: result.content,
        citations: result.citations,
        message_id: result.message_id,
      })
    } catch (err) {
      console.log('Erro no chat IA:', err)
      if (err instanceof SkipAiAgentsError) {
        return e.json(err.status || 400, { error: err.message })
      }
      if (err instanceof SkipAiConfigError) {
        return e.json(503, { error: 'Serviço de IA temporariamente indisponível.' })
      }
      return e.json(500, { error: err.message || 'Erro ao consultar assistente.' })
    }
  },
  $apis.requireAuth(),
)

routerAdd(
  'GET',
  '/backend/v1/ai-conversations',
  (e) => {
    try {
      const userId = e.auth?.id
      if (!userId) return e.json(401, { error: 'Autenticação necessária.' })

      const convs = $ai.agent('romani-gestor').listConversations({
        user_id: userId,
        limit: 20,
      })
      return e.json(200, convs)
    } catch (err) {
      return e.json(500, { error: err.message || 'Erro ao carregar conversas.' })
    }
  },
  $apis.requireAuth(),
)

routerAdd(
  'GET',
  '/backend/v1/ai-conversations/{id}/messages',
  (e) => {
    try {
      const userId = e.auth?.id
      if (!userId) return e.json(401, { error: 'Autenticação necessária.' })

      const conversationId = e.request.pathValue('id')
      const msgs = $ai.agent('romani-gestor').listMessages({
        conversation_id: conversationId,
        user_id: userId,
        limit: 100,
      })
      return e.json(200, msgs)
    } catch (err) {
      return e.json(500, { error: err.message || 'Erro ao carregar mensagens.' })
    }
  },
  $apis.requireAuth(),
)
