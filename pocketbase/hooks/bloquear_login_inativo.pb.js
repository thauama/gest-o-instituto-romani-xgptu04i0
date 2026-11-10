/// <reference path="../pb_data/types.d.ts" />

/**
 * Bloqueia o login de contas desativadas (is_active = false).
 * onRecordAuthRequest dispara a cada autenticação bem-sucedida
 * (login com senha, refresh de token, OAuth etc.): se o registro
 * estiver inativo, a requisição falha com 403.
 */
onRecordAuthRequest((e) => {
  if (e.record && e.record.getBool('is_active') === false) {
    throw new ForbiddenError('Este acesso está desativado. Procure o administrador da clínica.')
  }
  e.next()
}, 'users')
