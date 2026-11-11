import React, { useEffect, useMemo, useState } from 'react'
import {
  contratosService,
  orcamentosService,
  checklistService,
  clientesService,
  itensService,
} from '@/services/clinic'
import type { Contrato, Orcamento, ChecklistItem, Cliente, ItemEstoque } from '@/types/clinic'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PROCEDIMENTOS_CLINICA, PROCEDIMENTO_OUTRO } from '@/lib/procedimentos'
import { materiaisDoProcedimento, quantidadeParaProcedimento } from '@/lib/estoque'
import { toast } from '@/hooks/use-toast'
import {
  FileText,
  AlertTriangle,
  Plus,
  CheckCircle2,
  Clock,
  Calendar,
  XCircle,
  ListCheck,
  CheckSquare,
  Square,
  Trash2,
} from 'lucide-react'

export default function ContratosOrcamentos() {
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [itens, setItens] = useState<ItemEstoque[]>([])
  const [loading, setLoading] = useState(true)

  // Selected Contrato for Checklist Drawer/Modal
  const [activeContrato, setActiveContrato] = useState<Contrato | null>(null)
  const [openChecklistModal, setOpenChecklistModal] = useState(false)
  const [newChecklistDesc, setNewChecklistDesc] = useState('')
  const [newChecklistItemId, setNewChecklistItemId] = useState('')

  // New Contrato Modal
  const [openContratoModal, setOpenContratoModal] = useState(false)
  const [cClienteId, setCClienteId] = useState('')
  const [cProcedimento, setCProcedimento] = useState('')
  const [cValor, setCValor] = useState<number>(0)
  const [cDataEmissao, setCDataEmissao] = useState(new Date().toISOString().slice(0, 10))
  const [cProcedimentoOutro, setCProcedimentoOutro] = useState(false)
  const materiaisSugeridos = useMemo(
    () => materiaisDoProcedimento(itens, cProcedimento),
    [itens, cProcedimento],
  )
  const [cPrevisao, setCPrevisao] = useState('')
  const [cSituacao, setCSituacao] = useState<'assinado' | 'pendente'>('assinado')
  const [cObs, setCObs] = useState('')

  // New Orçamento Modal
  const [openOrcamentoModal, setOpenOrcamentoModal] = useState(false)
  const [oClienteId, setOClienteId] = useState('')
  const [oProcedimento, setOProcedimento] = useState('')
  const [oValor, setOValor] = useState<number>(0)
  const [oStatus, setOStatus] = useState<'emitido' | 'aprovado' | 'reprovado'>('emitido')
  const [oValidade, setOValidade] = useState('')
  const [oObs, setOObs] = useState('')

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const conts = await contratosService.list()
      const orcs = await orcamentosService.list()
      const clis = await clientesService.list('', 'nome')
      const its = await itensService.list('', 'nome')
      setContratos(conts)
      setOrcamentos(orcs)
      setClientes(clis)
      setItens(its)
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
    } finally {
      setLoading(false)
    }
  }

  const isMoreThanOneYear = (dataEmissao: string) => {
    if (!dataEmissao) return false
    const emissaoDate = new Date(dataEmissao)
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    return emissaoDate <= oneYearAgo
  }

  const handleOpenChecklist = async (c: Contrato) => {
    setActiveContrato(c)
    const list = await checklistService.list(c.id)
    setChecklist(list)
    setOpenChecklistModal(true)
  }

  const handleToggleChecklistItem = async (item: ChecklistItem) => {
    const newStatus = item.situacao === 'concluido' ? 'pendente' : 'concluido'
    await checklistService.update(item.id, { situacao: newStatus })
    if (activeContrato) {
      const updated = await checklistService.list(activeContrato.id)
      setChecklist(updated)
    }
  }

  const handleAddChecklistItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeContrato || !newChecklistDesc.trim()) return

    await checklistService.create({
      contrato: activeContrato.id,
      descricao: newChecklistDesc.trim(),
      item: newChecklistItemId || undefined,
      situacao: 'pendente',
      quantidade: 1,
    })

    setNewChecklistDesc('')
    setNewChecklistItemId('')
    const updated = await checklistService.list(activeContrato.id)
    setChecklist(updated)
  }

  const handleDeleteChecklistItem = async (id: string) => {
    await checklistService.delete(id)
    if (activeContrato) {
      const updated = await checklistService.list(activeContrato.id)
      setChecklist(updated)
    }
  }

  const handleCreateContrato = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cClienteId || !cProcedimento) return
    const cont = await contratosService.create({
      cliente: cClienteId,
      procedimento: cProcedimento,
      valor: Number(cValor) || 0,
      data_emissao: cDataEmissao,
      previsao_procedimento: cPrevisao,
      situacao: cSituacao,
      observacoes: cObs,
    })

    // Seed standard checklist items for surgery
    await checklistService.create({
      contrato: cont.id,
      descricao: 'Exames laboratoriais e risco cirúrgico aprovados',
      situacao: 'pendente',
    })
    await checklistService.create({
      contrato: cont.id,
      descricao: 'Consulta pré-anestésica realizada',
      situacao: 'pendente',
    })
    await checklistService.create({
      contrato: cont.id,
      descricao: 'Termo de consentimento informado assinado',
      situacao: 'pendente',
    })

    // Materiais vinculados ao procedimento entram automaticamente no checklist
    // (tolerante a falha: erro aqui nunca bloqueia a criação do contrato)
    try {
      const sugeridos = materiaisDoProcedimento(itens, cProcedimento)
      await Promise.all(
        sugeridos.map((it) =>
          checklistService.create({
            contrato: cont.id,
            item: it.id,
            descricao: it.nome,
            situacao: 'pendente',
            quantidade: quantidadeParaProcedimento(it, cProcedimento) || 1,
          }),
        ),
      )
      if (sugeridos.length > 0) {
        toast({
          title: 'Materiais adicionados ao checklist',
          description: `${sugeridos.length} material(is) vinculado(s) a "${cProcedimento}" entrou(entraram) no checklist.`,
        })
      }
    } catch (err) {
      console.warn('Falha ao sugerir materiais no checklist (contrato criado):', err)
    }

    setOpenContratoModal(false)
    setCProcedimento('')
    setCProcedimentoOutro(false)
    setCValor(0)
    setCObs('')
    await loadAll()
  }

  const handleCreateOrcamento = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!oClienteId || !oProcedimento) return

    await orcamentosService.create({
      cliente: oClienteId,
      procedimento: oProcedimento,
      valor: Number(oValor) || 0,
      status: oStatus,
      validade: oValidade,
      observacoes: oObs,
    })

    setOpenOrcamentoModal(false)
    setOProcedimento('')
    setOValor(0)
    setOObs('')
    await loadAll()
  }

  const handleUpdateOrcamentoStatus = async (
    id: string,
    status: 'emitido' | 'aprovado' | 'reprovado',
  ) => {
    await orcamentosService.update(id, { status })
    await loadAll()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-amber-600" />
            Contratos & Orçamentos
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestão de propostas emitidas, contratos cirúrgicos, alertas de 1 ano e checklist
            pré-operatório.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setOpenOrcamentoModal(true)}
            className="text-xs h-9"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Novo Orçamento
          </Button>

          <Button
            size="sm"
            onClick={() => setOpenContratoModal(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-9"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Emitir Contrato
          </Button>
        </div>
      </div>

      <Tabs defaultValue="contratos" className="w-full">
        <TabsList className="grid w-full sm:w-80 grid-cols-2 mb-6">
          <TabsTrigger value="contratos">Contratos Cirúrgicos</TabsTrigger>
          <TabsTrigger value="orcamentos">Orçamentos Propostos</TabsTrigger>
        </TabsList>

        {/* Tab 1: Contratos */}
        <TabsContent value="contratos" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {contratos.length === 0 ? (
              <div className="col-span-full p-12 text-center border border-dashed rounded-xl bg-white text-xs text-slate-500">
                Nenhum contrato cadastrado.
              </div>
            ) : (
              contratos.map((c) => {
                const expired = isMoreThanOneYear(c.data_emissao)
                return (
                  <Card
                    key={c.id}
                    className={`border shadow-sm transition-all ${
                      expired ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-sm font-bold text-slate-900">
                            {c.expand?.cliente?.nome || 'Paciente'}
                          </CardTitle>
                          <p className="text-xs font-semibold text-amber-800 mt-0.5">
                            {c.procedimento}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase font-semibold ${
                            c.situacao === 'assinado'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}
                        >
                          {c.situacao}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 pt-2 space-y-3 text-xs text-slate-600">
                      {expired && (
                        <div className="p-2.5 rounded-lg bg-rose-100/70 border border-rose-300 text-rose-900 text-[11px] flex items-center gap-2 font-medium">
                          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-700" />
                          <span>
                            Alerta: Contrato com mais de 1 ano! Requer reavaliação de risco e
                            exames.
                          </span>
                        </div>
                      )}

                      <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Valor do Procedimento:</span>
                          <span className="font-bold text-slate-900">
                            R$ {c.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Data de Emissão:</span>
                          <span className="text-slate-800 font-medium">{c.data_emissao}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Previsão da Cirurgia:</span>
                          <span className="text-slate-800 font-medium">
                            {c.previsao_procedimento || 'A definir'}
                          </span>
                        </div>
                      </div>

                      {c.observacoes && (
                        <p className="text-[11px] text-slate-500 italic bg-amber-50/30 p-2 rounded border border-amber-100">
                          {c.observacoes}
                        </p>
                      )}

                      {/* Checklist Button */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenChecklist(c)}
                          className="w-full text-xs font-semibold border-slate-300 text-slate-800 hover:bg-slate-100 h-8"
                        >
                          <ListCheck className="h-3.5 w-3.5 mr-1.5 text-amber-600" />
                          Ver Checklist do Contrato
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>

        {/* Tab 2: Orçamentos */}
        <TabsContent value="orcamentos" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {orcamentos.length === 0 ? (
              <div className="col-span-full p-12 text-center border border-dashed rounded-xl bg-white text-xs text-slate-500">
                Nenhum orçamento cadastrado.
              </div>
            ) : (
              orcamentos.map((o) => (
                <Card
                  key={o.id}
                  className="border-slate-200 shadow-sm bg-white hover:border-slate-300 transition-colors"
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-sm font-bold text-slate-900">
                          {o.expand?.cliente?.nome || 'Paciente'}
                        </CardTitle>
                        <p className="text-xs font-semibold text-slate-700 mt-0.5">
                          {o.procedimento}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase font-semibold ${
                          o.status === 'aprovado'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : o.status === 'reprovado'
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        {o.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2 space-y-3 text-xs text-slate-600">
                    <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Valor Proposto:</span>
                        <span className="font-bold text-slate-900">
                          R$ {o.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      {o.validade && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Validade da Proposta:</span>
                          <span className="text-slate-800 font-medium">{o.validade}</span>
                        </div>
                      )}
                    </div>

                    {o.observacoes && (
                      <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded">
                        {o.observacoes}
                      </p>
                    )}

                    {/* Status update actions */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1.5">
                      {o.status !== 'aprovado' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUpdateOrcamentoStatus(o.id, 'aprovado')}
                          className="h-7 text-[11px] text-emerald-700 hover:bg-emerald-50 px-2"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Aprovar
                        </Button>
                      )}
                      {o.status !== 'reprovado' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUpdateOrcamentoStatus(o.id, 'reprovado')}
                          className="h-7 text-[11px] text-rose-700 hover:bg-rose-50 px-2"
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Reprovar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Checklist Dialog Modal */}
      <Dialog open={openChecklistModal} onOpenChange={setOpenChecklistModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListCheck className="h-5 w-5 text-amber-600" />
              Checklist do Contrato
            </DialogTitle>
            <DialogDescription className="text-xs">
              Paciente: <strong>{activeContrato?.expand?.cliente?.nome}</strong> · Procedimento:{' '}
              {activeContrato?.procedimento}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-xs mt-2">
            {/* Checklist items list */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {checklist.length === 0 ? (
                <div className="p-4 text-center border border-dashed rounded-lg text-slate-400">
                  Nenhum item adicionado ao checklist deste contrato.
                </div>
              ) : (
                checklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleChecklistItem(item)}
                      className="flex items-center gap-2 text-left flex-1"
                    >
                      {item.situacao === 'concluido' ? (
                        <CheckSquare className="h-4 w-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-400 shrink-0" />
                      )}
                      <span
                        className={`${
                          item.situacao === 'concluido'
                            ? 'line-through text-slate-400'
                            : 'font-medium text-slate-800'
                        }`}
                      >
                        {item.descricao}
                        {item.expand?.item && (
                          <span className="text-[10px] text-amber-800 block">
                            Item vinculado: {item.expand.item.nome}
                          </span>
                        )}
                      </span>
                    </button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteChecklistItem(item.id)}
                      className="h-6 w-6 p-0 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* Add item form */}
            <form onSubmit={handleAddChecklistItem} className="pt-3 border-t space-y-2">
              <Label className="text-xs font-semibold text-slate-800">
                Adicionar Tarefa ou Insumo
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: Reserva de prótese, termo assinado, exames"
                  value={newChecklistDesc}
                  onChange={(e) => setNewChecklistDesc(e.target.value)}
                  className="text-xs h-8"
                  required
                />
                <Button type="submit" size="sm" className="bg-slate-900 text-white h-8 text-xs">
                  Adicionar
                </Button>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] text-slate-500">
                  Vincular a um Item do Estoque (Opcional):
                </Label>
                <Select value={newChecklistItemId} onValueChange={setNewChecklistItemId}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Selecione um item (ex: Prótese, Cinta)" />
                  </SelectTrigger>
                  <SelectContent>
                    {itens.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.nome} ({i.tipo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Novo Contrato */}
      <Dialog open={openContratoModal} onOpenChange={setOpenContratoModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Emitir Novo Contrato Cirúrgico</DialogTitle>
            <DialogDescription className="text-xs">
              Vincule ao paciente com previsão e valor do procedimento.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateContrato} className="space-y-3 text-xs mt-2">
            <div className="space-y-1">
              <Label>Paciente *</Label>
              <Select value={cClienteId} onValueChange={setCClienteId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o paciente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome} {c.cpf ? `(${c.cpf})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Procedimento Cirúrgico *</Label>
              <Select
                value={cProcedimento}
                onValueChange={(v) => {
                  if (v === PROCEDIMENTO_OUTRO) {
                    setCProcedimentoOutro(true)
                    setCProcedimento('')
                  } else {
                    setCProcedimentoOutro(false)
                    setCProcedimento(v)
                  }
                }}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o procedimento" />
                </SelectTrigger>
                <SelectContent>
                  {PROCEDIMENTOS_CLINICA.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                  <SelectItem value={PROCEDIMENTO_OUTRO}>Outro (descrever)</SelectItem>
                </SelectContent>
              </Select>
              {cProcedimentoOutro && (
                <Input
                  placeholder="Descreva o procedimento (ex: Mastopexia com Prótese)"
                  value={cProcedimento}
                  onChange={(e) => setCProcedimento(e.target.value)}
                  className="mt-1.5"
                  required
                />
              )}
              {!cProcedimentoOutro && materiaisSugeridos.length > 0 && (
                <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50/50 p-2.5">
                  <p className="text-[11px] font-semibold text-amber-800">
                    {materiaisSugeridos.length} material(is) vinculado(s) — entrarão automaticamente
                    no checklist:
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {materiaisSugeridos.map((m) => (
                      <Badge
                        key={m.id}
                        variant="outline"
                        className="text-[10px] bg-white border-amber-300 text-amber-900"
                      >
                        {m.nome}
                        {quantidadeParaProcedimento(m, cProcedimento) > 1 &&
                          ` ×${quantidadeParaProcedimento(m, cProcedimento)}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Valor do Contrato (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={cValor}
                  onChange={(e) => setCValor(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Situação Inicial</Label>
                <Select
                  value={cSituacao}
                  onValueChange={(v: 'assinado' | 'pendente') => setCSituacao(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assinado">Assinado</SelectItem>
                    <SelectItem value="pendente">Pendente de Assinatura</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Data de Emissão</Label>
                <Input
                  type="date"
                  value={cDataEmissao}
                  onChange={(e) => setCDataEmissao(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Previsão do Procedimento</Label>
                <Input
                  type="date"
                  value={cPrevisao}
                  onChange={(e) => setCPrevisao(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Observações do Contrato</Label>
              <Input
                placeholder="Detalhes sobre anestesia, hospital ou honorários"
                value={cObs}
                onChange={(e) => setCObs(e.target.value)}
              />
            </div>

            <div className="pt-3 border-t flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpenContratoModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-slate-900 text-white">
                Salvar Contrato
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Novo Orçamento */}
      <Dialog open={openOrcamentoModal} onOpenChange={setOpenOrcamentoModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Orçamento</DialogTitle>
            <DialogDescription className="text-xs">
              Cadastre a proposta de orçamento para o paciente.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateOrcamento} className="space-y-3 text-xs mt-2">
            <div className="space-y-1">
              <Label>Paciente *</Label>
              <Select value={oClienteId} onValueChange={setOClienteId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o paciente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome} {c.cpf ? `(${c.cpf})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Procedimento / Cirurgia *</Label>
              <Input
                placeholder="Ex: Blefaroplastia, Abdominoplastia"
                value={oProcedimento}
                onChange={(e) => setOProcedimento(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Valor Proposto (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={oValor}
                  onChange={(e) => setOValor(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Status Inicial</Label>
                <Select
                  value={oStatus}
                  onValueChange={(v: 'emitido' | 'aprovado' | 'reprovado') => setOStatus(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emitido">Emitido</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="reprovado">Reprovado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Validade da Proposta</Label>
              <Input type="date" value={oValidade} onChange={(e) => setOValidade(e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label>Observações</Label>
              <Input
                placeholder="Inclusão de instrumentador, pós-operatório..."
                value={oObs}
                onChange={(e) => setOObs(e.target.value)}
              />
            </div>

            <div className="pt-3 border-t flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpenOrcamentoModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-slate-900 text-white">
                Emitir Orçamento
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
