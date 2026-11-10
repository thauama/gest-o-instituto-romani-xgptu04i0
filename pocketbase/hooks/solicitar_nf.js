/// <reference path="../pb_data/types.d.ts" />

routerAdd(
  'POST',
  '/backend/v1/solicitar-nf',
  (e) => {
    try {
      const authRecord = e.auth
      if (!authRecord) {
        return e.json(401, { error: 'Autenticação necessária.' })
      }

      const body = e.requestInfo().body || {}
      const financeiroId = body.financeiroId
      const destinatario = body.destinatario || 'financeiro@institutoromani.com.br'
      const observacoes = body.observacoes || ''

      if (!financeiroId) {
        return e.json(400, { error: 'ID do registro financeiro é obrigatório.' })
      }

      const finRecord = e.app.findRecordById('financeiro', financeiroId)
      let clienteNome = 'Não informado'
      let clienteCpf = ''
      const clienteId = finRecord.getString('cliente')
      if (clienteId) {
        try {
          const clienteRec = e.app.findRecordById('clientes', clienteId)
          clienteNome = clienteRec.getString('nome')
          clienteCpf = clienteRec.getString('cpf')
        } catch (_) {}
      }

      const valor = finRecord.getFloat('valor')
      const descricao = finRecord.getString('descricao')
      const data = finRecord.getString('data')

      // Send email using $mails
      const subject = `[Instituto Romani] Solicitação de Emissão de Nota Fiscal - ${clienteNome}`
      const htmlBody = `
      <div style="font-family: sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
        <h2 style="color: #0f172a; margin-top: 0;">Solicitação de Emissão de Nota Fiscal</h2>
        <p>Olá contabilidade/financeiro,</p>
        <p>Foi solicitada a emissão de Nota Fiscal referente ao atendimento/contrato da clínica <strong>Instituto Romani</strong>.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 6px 0; font-weight: bold; width: 140px;">Paciente:</td><td>${clienteNome}</td></tr>
          ${clienteCpf ? `<tr><td style="padding: 6px 0; font-weight: bold;">CPF:</td><td>${clienteCpf}</td></tr>` : ''}
          <tr><td style="padding: 6px 0; font-weight: bold;">Descrição:</td><td>${descricao}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: bold;">Valor:</td><td>R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: bold;">Data:</td><td>${data}</td></tr>
          ${observacoes ? `<tr><td style="padding: 6px 0; font-weight: bold;">Observações:</td><td>${observacoes}</td></tr>` : ''}
        </table>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">Solicitado por ${authRecord.getString('name')} (${authRecord.getString('email')}) via Gestão Instituto Romani.</p>
      </div>
    `

      try {
        $mails.send({
          to: destinatario,
          subject: subject,
          html: htmlBody,
        })
      } catch (mailErr) {
        console.log('Aviso no envio de e-mail:', mailErr)
      }

      // Mark as solicitada
      finRecord.set('nf_solicitada', true)
      finRecord.set('nf_email_destinatario', destinatario)
      e.app.save(finRecord)

      return e.json(200, {
        success: true,
        message: `Solicitação de Nota Fiscal enviada com sucesso para ${destinatario}`,
      })
    } catch (err) {
      console.log('Erro ao solicitar NF:', err)
      return e.json(500, { error: err.message || 'Falha ao processar solicitação de NF.' })
    }
  },
  $apis.requireAuth(),
)
