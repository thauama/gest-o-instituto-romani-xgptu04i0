import pb from '@/lib/pocketbase/client'
import type {
  Cliente,
  CategoriaFinanceira,
  ItemEstoque,
  Movimentacao,
  Orcamento,
  Contrato,
  ChecklistItem,
  Consulta,
  RegistroFinanceiro,
  Anamnese,
  ModeloAnamnese,
  ObservacaoPaciente,
  EvolucaoPaciente,
  ArquivoPaciente,
  ModeloDocumento,
  DocumentoClinico,
  AuditoriaProntuario,
  ConsentimentoPaciente,
} from '@/types/clinic'
import type { UserProfile } from '@/hooks/use-auth'

// Clientes Service
export const clientesService = {
  async list(filter = '', sort = '-created') {
    return await pb.collection('clientes').getFullList<Cliente>({
      filter,
      sort,
    })
  },
  async getById(id: string) {
    return await pb.collection('clientes').getOne<Cliente>(id)
  },
  async create(data: Partial<Cliente>) {
    return await pb.collection('clientes').create<Cliente>(data)
  },
  async update(id: string, data: Partial<Cliente>) {
    return await pb.collection('clientes').update<Cliente>(id, data)
  },
  async delete(id: string) {
    return await pb.collection('clientes').delete(id)
  },
}

// Itens Service
export const itensService = {
  async list(filter = '', sort = 'nome') {
    return await pb.collection('itens').getFullList<ItemEstoque>({
      filter,
      sort,
    })
  },
  async create(data: Partial<ItemEstoque>) {
    return await pb.collection('itens').create<ItemEstoque>(data)
  },
  async update(id: string, data: Partial<ItemEstoque>) {
    return await pb.collection('itens').update<ItemEstoque>(id, data)
  },
  async delete(id: string) {
    return await pb.collection('itens').delete(id)
  },
}

// Movimentações Service
export const movimentacoesService = {
  async list(filter = '', sort = '-data,-created') {
    return await pb.collection('movimentacoes').getFullList<Movimentacao>({
      filter,
      sort,
      expand: 'item,cliente',
    })
  },
  async create(data: Partial<Movimentacao>) {
    // Auditoria: quem registrou (nome do usuário logado, com fallback para o e-mail)
    const auth = pb.authStore.record as { name?: string; email?: string } | null
    if (!data.registrado_por) {
      data.registrado_por = auth?.name || auth?.email || '—'
    }
    const record = await pb.collection('movimentacoes').create<Movimentacao>(data)
    // Adjust inventory if linked to item
    if (data.item && data.quantidade) {
      try {
        const item = await itensService.list(`id = "${data.item}"`)
        if (item.length > 0) {
          const currentItem = item[0]
          let newQty = currentItem.quantidade
          if (data.tipo === 'entrada') {
            newQty += Number(data.quantidade)
          } else if (data.tipo === 'saida' || data.tipo === 'atendimento') {
            newQty = Math.max(0, newQty - Number(data.quantidade))
          }
          await itensService.update(currentItem.id, { quantidade: newQty })
        }
      } catch (err) {
        console.warn('Erro ao atualizar quantidade do estoque:', err)
      }
    }
    return record
  },
  async delete(id: string) {
    return await pb.collection('movimentacoes').delete(id)
  },
}

// Orçamentos Service
export const orcamentosService = {
  async list(filter = '', sort = '-created') {
    return await pb.collection('orcamentos').getFullList<Orcamento>({
      filter,
      sort,
      expand: 'cliente',
    })
  },
  async create(data: Partial<Orcamento>) {
    return await pb.collection('orcamentos').create<Orcamento>(data)
  },
  async update(id: string, data: Partial<Orcamento>) {
    return await pb.collection('orcamentos').update<Orcamento>(id, data)
  },
  async delete(id: string) {
    return await pb.collection('orcamentos').delete(id)
  },
}

// Contratos Service
export const contratosService = {
  async list(filter = '', sort = '-data_emissao,-created') {
    return await pb.collection('contratos').getFullList<Contrato>({
      filter,
      sort,
      expand: 'cliente',
    })
  },
  async create(data: Partial<Contrato>) {
    return await pb.collection('contratos').create<Contrato>(data)
  },
  async update(id: string, data: Partial<Contrato>) {
    return await pb.collection('contratos').update<Contrato>(id, data)
  },
  async delete(id: string) {
    return await pb.collection('contratos').delete(id)
  },
}

// Checklist Service
export const checklistService = {
  async list(contratoId?: string) {
    const filter = contratoId ? `contrato = "${contratoId}"` : ''
    return await pb.collection('checklist').getFullList<ChecklistItem>({
      filter,
      sort: 'created',
      expand: 'item,contrato',
    })
  },
  async create(data: Partial<ChecklistItem>) {
    return await pb.collection('checklist').create<ChecklistItem>(data)
  },
  async update(id: string, data: Partial<ChecklistItem>) {
    return await pb.collection('checklist').update<ChecklistItem>(id, data)
  },
  async delete(id: string) {
    return await pb.collection('checklist').delete(id)
  },
}

// Consultas Service
export const consultasService = {
  async list(filter = '', sort = 'data,horario') {
    return await pb.collection('consultas').getFullList<Consulta>({
      filter,
      sort,
      expand: 'cliente',
    })
  },
  async create(data: Partial<Consulta>) {
    return await pb.collection('consultas').create<Consulta>(data)
  },
  async update(id: string, data: Partial<Consulta>) {
    return await pb.collection('consultas').update<Consulta>(id, data)
  },
  async delete(id: string) {
    return await pb.collection('consultas').delete(id)
  },
}

// Categorias Financeiras Service
// Leitura: qualquer usuário autenticado. Escrita: admin (garantido pelas regras da coleção).
export const categoriasFinanceirasService = {
  async list(filter = '', sort = 'nome') {
    return await pb.collection('financeiro_categorias').getFullList<CategoriaFinanceira>({
      filter,
      sort,
    })
  },
  async create(data: { nome: string; tipo: 'receita' | 'despesa'; criado_por?: string }) {
    return await pb.collection('financeiro_categorias').create<CategoriaFinanceira>({
      nome: data.nome.trim(),
      tipo: data.tipo,
      ativa: true,
      criado_por: data.criado_por || '',
    })
  },
  async update(id: string, data: Partial<CategoriaFinanceira>) {
    return await pb.collection('financeiro_categorias').update<CategoriaFinanceira>(id, data)
  },
  async delete(id: string) {
    return await pb.collection('financeiro_categorias').delete(id)
  },
}

// Financeiro Service
export const financeiroService = {
  async list(filter = '', sort = '-data,-created') {
    return await pb.collection('financeiro').getFullList<RegistroFinanceiro>({
      filter,
      sort,
      expand: 'cliente,contrato',
    })
  },
  async create(data: Partial<RegistroFinanceiro>) {
    return await pb.collection('financeiro').create<RegistroFinanceiro>(data)
  },
  async update(id: string, data: Partial<RegistroFinanceiro>) {
    return await pb.collection('financeiro').update<RegistroFinanceiro>(id, data)
  },
  async delete(id: string) {
    return await pb.collection('financeiro').delete(id)
  },
  async solicitarNf(financeiroId: string, destinatario: string, observacoes?: string) {
    const res = await fetch(`${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/solicitar-nf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: pb.authStore.token,
      },
      body: JSON.stringify({
        financeiroId,
        destinatario,
        observacoes,
      }),
    })
    const payload = await res.json()
    if (!res.ok) {
      throw new Error(payload?.error || 'Falha ao solicitar emissão de Nota Fiscal')
    }
    return payload
  },
}

// ===================== PRONTUÁRIO (LGPD — somente admin) =====================

/** Registra um acesso/ação no prontuário (create-only — a coleção não aceita update/delete). */
async function registrarAuditoria(
 paciente: string,
 acao: 'visualizacao' | 'criacao' | 'edicao' | 'impressao' | 'download' | 'reemissao',
 detalhe?: string,
) {
 try {
   const auth = pb.authStore.record as { id?: string; name?: string; email?: string } | null
   await pb.collection('prontuario_auditoria').create({
     paciente,
     acao,
     detalhe: detalhe || '',
     usuario: auth?.name || auth?.email || '—',
     usuario_id: auth?.id || '',
   })
 } catch (err) {
   // Auditoria nunca deve quebrar o fluxo clínico; falha fica registrada no console.
   console.warn('Falha ao registrar auditoria do prontuário:', err)
 }
}

export const prontuarioService = {
 auditoria: registrarAuditoria,

 urlArquivo: (registro: { id: string; collectionId?: string; collectionName?: string }, nome: string) =>
   pb.files.getURL(
     { id: registro.id, collectionId: registro.collectionId || 'prontuario_arquivos', collectionName: registro.collectionName || 'prontuario_arquivos' },
     nome,
   ),

 // ---- Modelos de anamnese ----
 async listarModelosAnamnese() {
   return await pb.collection('prontuario_modelos_anamnese').getFullList<ModeloAnamnese>({
     filter: 'ativo = true',
     sort: 'nome',
   })
 },
 async criarModeloAnamnese(data: Partial<ModeloAnamnese>) {
   return await pb.collection('prontuario_modelos_anamnese').create<ModeloAnamnese>(data)
 },
 async atualizarModeloAnamnese(id: string, data: Partial<ModeloAnamnese>) {
   return await pb.collection('prontuario_modelos_anamnese').update<ModeloAnamnese>(id, data)
 },
 async excluirModeloAnamnese(id: string) {
   return await pb.collection('prontuario_modelos_anamnese').delete(id)
 },

 // ---- Anamnese ----
 async listarAnamnese(paciente: string) {
   return await pb
     .collection('prontuario_anamnese')
     .getFullList<Anamnese>({ filter: `paciente = "${paciente}"`, sort: '-updated', expand: 'modelo' })
 },
 async criarAnamnese(data: Partial<Anamnese>) {
   const rec = await pb.collection('prontuario_anamnese').create<Anamnese>(data)
   await registrarAuditoria(data.paciente || rec.paciente, 'criacao', `Anamnese: ${rec.titulo}`)
   return rec
 },
 async atualizarAnamnese(id: string, data: Partial<Anamnese> & { paciente?: string }) {
   const rec = await pb.collection('prontuario_anamnese').update<Anamnese>(id, data)
   if (data.paciente) await registrarAuditoria(data.paciente, 'edicao', `Anamnese: ${rec.titulo}`)
   return rec
 },
 async excluirAnamnese(id: string, paciente?: string) {
   if (paciente) await registrarAuditoria(paciente, 'edicao', `Anamnese excluída (${id})`)
   return await pb.collection('prontuario_anamnese').delete(id)
 },

 // ---- Observações ----
 async listarObservacoes(paciente: string) {
   return await pb
     .collection('prontuario_observacoes')
     .getFullList<ObservacaoPaciente>({ filter: `paciente = "${paciente}"`, sort: '-created' })
 },
 async criarObservacao(data: Partial<ObservacaoPaciente>) {
   const rec = await pb.collection('prontuario_observacoes').create<ObservacaoPaciente>(data)
   await registrarAuditoria(data.paciente || rec.paciente, 'criacao', 'Observação adicionada')
   return rec
 },
 async excluirObservacao(id: string, paciente?: string) {
   if (paciente) await registrarAuditoria(paciente, 'edicao', `Observação excluída (${id})`)
   return await pb.collection('prontuario_observacoes').delete(id)
 },

 // ---- Evolução (transcrição colada do Plaud + anexo opcional) ----
 async listarEvolucao(paciente: string) {
   return await pb
     .collection('prontuario_evolucao')
     .getFullList<EvolucaoPaciente>({ filter: `paciente = "${paciente}"`, sort: '-data,-created' })
 },
 async criarEvolucao(data: Partial<EvolucaoPaciente>) {
   const rec = await pb.collection('prontuario_evolucao').create<EvolucaoPaciente>(data)
   await registrarAuditoria(data.paciente || rec.paciente, 'criacao', `Evolução: ${rec.titulo || rec.data}`)
   return rec
 },
 async excluirEvolucao(id: string, paciente?: string) {
   if (paciente) await registrarAuditoria(paciente, 'edicao', `Evolução excluída (${id})`)
   return await pb.collection('prontuario_evolucao').delete(id)
 },

 // ---- Arquivos (fotos, exames, contratos, orçamentos, vídeos) ----
 async listarArquivos(paciente: string) {
   return await pb
     .collection('prontuario_arquivos')
     .getFullList<ArquivoPaciente>({ filter: `paciente = "${paciente}"`, sort: '-created' })
 },
 async criarArquivo(data: Partial<ArquivoPaciente>) {
   const rec = await pb.collection('prontuario_arquivos').create<ArquivoPaciente>(data)
   await registrarAuditoria(data.paciente || rec.paciente, 'criacao', `Arquivo: ${rec.titulo}`)
   return rec
 },
 async excluirArquivo(id: string, paciente?: string) {
   if (paciente) await registrarAuditoria(paciente, 'edicao', `Arquivo excluído (${id})`)
   return await pb.collection('prontuario_arquivos').delete(id)
 },

 // ---- Modelos de documentos (prescrição / pedido de exames) ----
 async listarModelosDocumentos(tipo?: 'prescricao' | 'pedido_exame') {
   const filter = tipo ? `tipo = "${tipo}" && ativo = true` : 'ativo = true'
   return await pb.collection('prontuario_modelos_documentos').getFullList<ModeloDocumento>({
     filter,
     sort: 'nome',
   })
 },

 // ---- Documentos gerados ----
 async listarDocumentos(paciente: string) {
   return await pb
     .collection('prontuario_documentos')
     .getFullList<DocumentoClinico>({
       filter: `paciente = "${paciente}"`,
       sort: '-created',
       expand: 'modelo,reemitido_de',
     })
 },
 async criarDocumento(data: Partial<DocumentoClinico>) {
   const rec = await pb.collection('prontuario_documentos').create<DocumentoClinico>(data)
   await registrarAuditoria(
     data.paciente || rec.paciente,
     data.reemitido ? 'reemissao' : 'criacao',
     `${rec.tipo === 'prescricao' ? 'Prescrição' : 'Pedido de exame'}: ${rec.titulo}`,
   )
   return rec
 },
 async excluirDocumento(id: string, paciente?: string) {
   if (paciente) await registrarAuditoria(paciente, 'edicao', `Documento excluído (${id})`)
   return await pb.collection('prontuario_documentos').delete(id)
 },

 // ---- Consentimento LGPD ----
 async listarConsentimentos(paciente: string) {
   return await pb
     .collection('prontuario_consentimento')
     .getFullList<ConsentimentoPaciente>({ filter: `paciente = "${paciente}"`, sort: '-created' })
 },
 async criarConsentimento(data: Partial<ConsentimentoPaciente>) {
   const rec = await pb.collection('prontuario_consentimento').create<ConsentimentoPaciente>(data)
   await registrarAuditoria(data.paciente || rec.paciente, 'criacao', `Consentimento: ${rec.tipo}`)
   return rec
 },

 // ---- Auditoria ----
 async listarAuditoria(paciente: string) {
   return await pb
     .collection('prontuario_auditoria')
     .getFullList<AuditoriaProntuario>({ filter: `paciente = "${paciente}"`, sort: '-created' })
 },
}

// Usuários / Permissões Service (somente admin — garantido pelas regras da coleção users)
export const usuariosService = {
  async list(sort = '-created') {
    return await pb.collection('users').getFullList<UserProfile>({
      sort,
      fields: 'id,name,email,role,is_active,verified,created,updated',
    })
  },
  async create(data: { name: string; email: string; password: string; role: 'admin' | 'equipe' }) {
    return await pb.collection('users').create<UserProfile>({
      name: data.name.trim(),
      email: data.email.trim(),
      password: data.password,
      passwordConfirm: data.password,
      role: data.role,
      is_active: true,
      verified: true, // admin cria já verificado para login imediato
    })
  },
  async update(id: string, data: Partial<UserProfile> & { password?: string }) {
    const payload: Record<string, unknown> = {}
    if (data.name !== undefined) payload.name = data.name
    if (data.role !== undefined) payload.role = data.role
    if (data.is_active !== undefined) payload.is_active = data.is_active
    if (data.password) {
      payload.password = data.password
      payload.passwordConfirm = data.password
    }
    return await pb.collection('users').update<UserProfile>(id, payload)
  },
  async remove(id: string) {
    return await pb.collection('users').delete(id)
  },
}
