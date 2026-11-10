import pb from '@/lib/pocketbase/client'
import type {
  Cliente,
  ItemEstoque,
  Movimentacao,
  Orcamento,
  Contrato,
  ChecklistItem,
  Consulta,
  RegistroFinanceiro,
} from '@/types/clinic'

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
