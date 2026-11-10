export interface Cliente {
  id: string
  nome: string
  rg?: string
  cpf?: string
  nascimento?: string
  endereco?: string
  profissao?: string
  estado_civil?: string
  email?: string
  religiao?: string
  peso?: string
  altura?: string
  instagram?: string
  contato?: string
  observacoes?: string
  status_cadastro: 'completo' | 'pendente_preenchimento'
  created: string
  updated: string
}

export interface ItemEstoque {
  id: string
  nome: string
  tipo: 'produto' | 'peca' | 'servico'
  quantidade: number
  preco: number
  estoque_minimo: number
  unidade?: string
  descricao?: string
  created: string
  updated: string
}

export interface Movimentacao {
  id: string
  tipo: 'entrada' | 'saida' | 'atendimento'
  data: string
  item?: string
  cliente?: string
  quantidade: number
  observacao?: string
  expand?: {
    item?: ItemEstoque
    cliente?: Cliente
  }
  created: string
  updated: string
}

export interface Orcamento {
  id: string
  cliente: string
  procedimento: string
  valor: number
  status: 'emitido' | 'aprovado' | 'reprovado'
  validade?: string
  observacoes?: string
  expand?: {
    cliente?: Cliente
  }
  created: string
  updated: string
}

export interface Contrato {
  id: string
  cliente: string
  procedimento: string
  valor: number
  data_emissao: string
  situacao: 'assinado' | 'pendente' | 'cancelado' | 'concluido'
  previsao_procedimento?: string
  observacoes?: string
  expand?: {
    cliente?: Cliente
  }
  created: string
  updated: string
}

export interface ChecklistItem {
  id: string
  contrato: string
  item?: string
  descricao: string
  situacao: 'pendente' | 'concluido'
  quantidade?: number
  expand?: {
    contrato?: Contrato
    item?: ItemEstoque
  }
  created: string
  updated: string
}

export interface Consulta {
  id: string
  cliente: string
  data: string
  horario?: string
  status: 'agendada' | 'desmarcada' | 'realizada'
  tipo?: string
  profissional?: string
  google_event_id?: string
  observacoes?: string
  expand?: {
    cliente?: Cliente
  }
  created: string
  updated: string
}

export interface CategoriaFinanceira {
  id: string
  nome: string
  tipo: 'receita' | 'despesa'
  ativa?: boolean
  criado_por?: string
  created: string
  updated: string
}

export interface RegistroFinanceiro {
  id: string
  tipo: 'receita' | 'despesa'
  descricao: string
  valor: number
  data: string
  categoria?: string
  mes_referencia?: string
  nf_solicitada?: boolean
  nf_email_destinatario?: string
  cliente?: string
  contrato?: string
  expand?: {
    cliente?: Cliente
    contrato?: Contrato
  }
  created: string
  updated: string
}
