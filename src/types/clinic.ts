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
  /** Validade do lote (date, 'YYYY-MM-DD') — migração 0007. */
  validade?: string
  /** Procedimentos aos quais o material serve — migração 0007 (json, array de strings). */
  procedimentos?: string[]
  /** Quantidade consumida por procedimento (json: { [procedimento]: number }). */
  quantidade_por_procedimento?: Record<string, number>
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
  registrado_por?: string
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

/** Campos de um módulo de modelo de anamnese (editável pelo admin). */
export interface CampoModeloAnamnese {
  titulo: string
  tipo: 'texto' | 'texto_longo' | 'sim_nao'
  obrigatorio?: boolean
}

/** Módulo preenchido de uma anamnese. */
export interface ModuloAnamnese {
  titulo: string
  conteudo?: string
}

export interface ModeloAnamnese {
  id: string
  nome: string
  descricao?: string
  campos?: CampoModeloAnamnese[]
  ativo?: boolean
  created: string
  updated: string
}

export interface Anamnese {
  id: string
  paciente: string
  titulo: string
  modulos?: ModuloAnamnese[]
  modelo?: string
  preenchido_por?: string
  expand?: {
    paciente?: Cliente
    modelo?: ModeloAnamnese
  }
  created: string
  updated: string
}

export interface ObservacaoPaciente {
  id: string
  paciente: string
  texto: string
  autor?: string
  expand?: { paciente?: Cliente }
  created: string
  updated: string
}

export interface EvolucaoPaciente {
  id: string
  paciente: string
  data: string
  titulo?: string
  descricao?: string
  /** Transcrição do Plaud (texto colado — sem integração direta com o aparelho). */
  transcricao?: string
  anexo?: string
  autor?: string
  expand?: { paciente?: Cliente }
  created: string
  updated: string
}

export type CategoriaArquivoPaciente =
  | 'exame'
  | 'foto'
  | 'contrato'
  | 'orcamento'
  | 'video'
  | 'outro'

export interface ArquivoPaciente {
  id: string
  paciente: string
  titulo: string
  categoria: CategoriaArquivoPaciente
  arquivo: string
  descricao?: string
  expand?: { paciente?: Cliente }
  created: string
  updated: string
}

export type TipoDocumentoClinico = 'prescricao' | 'pedido_exame'

export interface ModeloDocumento {
  id: string
  nome: string
  tipo: TipoDocumentoClinico
  conteudo: string
  ativo?: boolean
  created: string
  updated: string
}

export interface DocumentoClinico {
  id: string
  paciente: string
  tipo: TipoDocumentoClinico
  titulo: string
  conteudo: string
  data?: string
  modelo?: string
  reemitido?: boolean
  reemitido_de?: string
  emitido_por?: string
  expand?: {
    paciente?: Cliente
    modelo?: ModeloDocumento
  }
  created: string
  updated: string
}

export type AcaoAuditoriaProntuario =
  | 'visualizacao'
  | 'criacao'
  | 'edicao'
  | 'impressao'
  | 'download'
  | 'reemissao'

export interface AuditoriaProntuario {
  id: string
  paciente: string
  acao: AcaoAuditoriaProntuario
  detalhe?: string
  usuario?: string
  usuario_id?: string
  expand?: { paciente?: Cliente }
  created: string
}

export type TipoConsentimento = 'uso_dados' | 'tratamento' | 'imagem' | 'outro'

export interface ConsentimentoPaciente {
  id: string
  paciente: string
  tipo: TipoConsentimento
  versao?: string
  conteudo?: string
  assinado?: boolean
  assinado_em?: string
  arquivo?: string
  registrado_por?: string
  expand?: { paciente?: Cliente }
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
