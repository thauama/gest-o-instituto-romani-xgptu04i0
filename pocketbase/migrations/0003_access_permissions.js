migrate(
  (app) => {
    // 1. users: add is_active flag (optional bool — absent/false = inactive)
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!users.fields.getByName('is_active')) {
      users.fields.add(new BoolField({ name: 'is_active' }))
    }

    // Only admin can list/view/create/edit/delete users.
    // Self-edit (name/password) is allowed, but role and is_active can never be changed by self-edit.
    users.listRule = "@request.auth.role = 'admin'"
    users.viewRule = "@request.auth.role = 'admin' || id = @request.auth.id"
    users.createRule = "@request.auth.role = 'admin'"
    users.updateRule =
      "@request.auth.role = 'admin' || (id = @request.auth.id && @request.body.role:changed = false && @request.body.is_active:changed = false && @request.body.email:changed = false)"
    users.deleteRule = "@request.auth.role = 'admin'"
    app.save(users)

    // 2. financeiro: readable/writable only by admin
    const financeiro = app.findCollectionByNameOrId('financeiro')
    financeiro.listRule = "@request.auth.role = 'admin'"
    financeiro.viewRule = "@request.auth.role = 'admin'"
    financeiro.createRule = "@request.auth.role = 'admin'"
    financeiro.updateRule = "@request.auth.role = 'admin'"
    financeiro.deleteRule = "@request.auth.role = 'admin'"
    app.save(financeiro)

    // 3. Make sure existing seeded users carry the flag
    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'romani@institutoromani.com.br')
      if (!admin.getBool('is_active')) {
        admin.set('is_active', true)
        app.save(admin)
      }
    } catch (_) {}
    try {
      const equipe = app.findAuthRecordByEmail('_pb_users_auth_', 'equipe@institutoromani.com.br')
      if (!equipe.getBool('is_active')) {
        equipe.set('is_active', true)
        app.save(equipe)
      }
    } catch (_) {}
  },
  (app) => {
    const financeiro = app.findCollectionByNameOrId('financeiro')
    financeiro.listRule = "@request.auth.id != ''"
    financeiro.viewRule = "@request.auth.id != ''"
    financeiro.createRule = "@request.auth.id != ''"
    financeiro.updateRule = "@request.auth.id != ''"
    financeiro.deleteRule = "@request.auth.id != ''"
    app.save(financeiro)

    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.listRule = 'id = @request.auth.id'
    users.viewRule = 'id = @request.auth.id'
    users.createRule = ''
    users.updateRule = 'id = @request.auth.id'
    users.deleteRule = 'id = @request.auth.id'
    app.save(users)
  },
)
