/**
 * Lista oficial de procedimentos cirúrgicos da clínica.
 * Usada no cadastro de itens (vinculação material ↔ procedimento)
 * e na emissão de contratos (select de procedimento).
 */
export const PROCEDIMENTOS_CLINICA = [
  'Prótese de recuperação rápida',
  'Mamoplastia com prótese',
  'Mamoplastia sem prótese',
  'Reconstrução de mama',
  'Lipoabdominoplastia',
  'Lipoaspiração de alta definição',
  'Ninfoplastia',
  'Facelifting',
  'Blefaroplastia',
  'Otoplastia',
  'Lipoenxertia glútea',
] as const

export type ProcedimentoClinica = (typeof PROCEDIMENTOS_CLINICA)[number]

/** Valor sentinela do select quando o usuário quer descrever outro procedimento. */
export const PROCEDIMENTO_OUTRO = '__outro__'
