// 0009 — Sincronização central de consultas com o Google Calendar
// Adiciona o campo `origem` na coleção `consultas`:
//   - 'google_sync' quando o próprio hook de sincronização gravou o
//     google_event_id (evita loop infinito de afterUpdate)
//   - vazio/ausente para consultas criadas por qualquer tela do app
// Idempotente: se o campo já existe, não faz nada.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('consultas')
    if (col.fields.getByName('origem')) {
      return // já aplicado
    }
    col.fields.add(new Field({ name: 'origem', type: 'text', max: 40 }))
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('consultas')
    const f = col.fields.getByName('origem')
    if (f) {
      col.fields.removeByName('origem')
      app.save(col)
    }
  },
)
