import React, { useEffect, useState } from 'react'
import { financeiroService, clientesService, contratosService } from '@/services/clinic'
import type { RegistroFinanceiro, Cliente, Contrato } from '@/types/clinic'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Mail,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Send,
} from 'lucide-react'

export default function Financeiro() {
  const [registros, setRegistros] = useState<RegistroFinanceiro[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const currentMonthStr = new Date().toISOString().slice(0, 7)
  const [mesFiltro, setMesFiltro] = useState<string>(currentMonthStr)
  const [tipoFiltro, setTipoFiltro] = useState<string>('todos')

  // New Record Dialog
  const [openModal, setOpenModal] = useState(false)
  const [tipo, setTipo] = useState<'receita' | 'despesa'>('receita')
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState<number>(0)
  const [data, setData] = useState(new Date().toISOString().slice(0, 10))
  const [categoria, setCategoria] = useState('Procedimentos Cirúrgicos')
  const [clienteId, setClienteId] = useState('')
  const [contratoId, setContratoId] = useState('')

  // NF Dialog
  const [openNfModal, setOpenNfModal] = useState(false)
  const [selectedReg, setSelectedReg] = useState<RegistroFinanceiro | null>(null)
  const [nfEmail, setNfEmail] = useState('financeiro@institutoromani.com.br')
  const [nfObs, setNfObs] = useState('')
  const [sendingNf, setSendingNf] = useState(false)
  const [nfMessage, setNfMessage] = useState<string | null>(null)

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const fin = await financeiroService.list('', '-data,-created')
      const clis = await clientesService.list('', 'nome')
      const conts = await contratosService.list('', '-created')
      setRegistros(fin)
      setClientes(clis)
      setContratos(conts)
    } catch (err) {
      console.error('Erro ao carregar financeiro:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!descricao || valor <= 0) return

    const mesReferencia = data.slice(0, 7)
    await financeiroService.create({
      tipo,
      descricao,
      valor: Number(valor),
      data,
      categoria,
      mes_referencia: mesReferencia,
      cliente: clienteId || undefined,
      contrato: contratoId || undefined,
      nf_solicitada: false,
    })

    setOpenModal(false)
    setDescricao('')
    setValor(0)
    setClienteId('')
    setContratoId('')
    await loadAll()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir este lançamento financeiro?')) {
      await financeiroService.delete(id)
      await loadAll()
    }
  }

  const handleOpenNfModal = (reg: RegistroFinanceiro) => {
    setSelectedReg(reg)
    setNfEmail(reg.nf_email_destinatario || 'financeiro@institutoromani.com.br')
    setNfObs('')
    setNfMessage(null)
    setOpenNfModal(true)
  }

  const handleSendNf = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReg) return

    setSendingNf(true)
    setNfMessage(null)
    try {
      await financeiroService.solicitarNf(selectedReg.id, nfEmail, nfObs)
      setNfMessage('E-mail de solicitação de Nota Fiscal disparado com sucesso!')
      setTimeout(() => {
        setOpenNfModal(false)
        loadAll()
      }, 1500)
    } catch (err: any) {
      alert(err.message || 'Falha ao solicitar emissão de NF')
    } finally {
      setSendingNf(false)
    }
  }

  // Filtered
  const filtered = registros.filter((r) => {
    const matchMes = !mesFiltro || r.data.startsWith(mesFiltro) || r.mes_referencia === mesFiltro
    const matchTipo = tipoFiltro === 'todos' || r.tipo === tipoFiltro
    return matchMes && matchTipo
  })

  // Totals for filtered month
  const totalReceitas = filtered
    .filter((r) => r.tipo === 'receita')
    .reduce((acc, curr) => acc + Number(curr.valor), 0)

  const totalDespesas = filtered
    .filter((r) => r.tipo === 'despesa')
    .reduce((acc, curr) => acc + Number(curr.valor), 0)

  const lucroLiquido = totalReceitas - totalDespesas
  const margem = totalReceitas > 0 ? Math.round((lucroLiquido / totalReceitas) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-emerald-600" />
            Controle Financeiro Mensal
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Receitas de procedimentos, despesas clínicas, cálculo de lucros e solicitação de Notas
            Fiscais.
          </p>
        </div>

        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-9">
              <Plus className="h-4 w-4 mr-1.5" />
              Novo Lançamento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Novo Lançamento Financeiro</DialogTitle>
              <DialogDescription className="text-xs">
                Registre receitas de cirurgias ou custos operacionais.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSave} className="space-y-3 text-xs mt-2">
              <div className="space-y-1">
                <Label>Tipo de Operação *</Label>
                <Select value={tipo} onValueChange={(v: 'receita' | 'despesa') => setTipo(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receita">Receita (Entrada Financeira)</SelectItem>
                    <SelectItem value="despesa">Despesa (Custo/Gasto Operacional)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Descrição *</Label>
                <Input
                  placeholder="Ex: Honorários Cirúrgicos, Aluguel, Insumos"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Valor (R$) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={valor}
                    onChange={(e) => setValor(parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>Data do Lançamento *</Label>
                  <Input
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Categoria</Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Procedimentos Cirúrgicos">
                      Procedimentos Cirúrgicos
                    </SelectItem>
                    <SelectItem value="Procedimentos Ambulatoriais">
                      Procedimentos Ambulatoriais
                    </SelectItem>
                    <SelectItem value="Consultas e Retornos">Consultas e Retornos</SelectItem>
                    <SelectItem value="Insumos e Materiais">Insumos e Materiais</SelectItem>
                    <SelectItem value="Custos Fixos / Ocupação">Custos Fixos / Ocupação</SelectItem>
                    <SelectItem value="Equipe e Honorários">Equipe e Honorários</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Paciente Relacionado (Opcional)</Label>
                <Select value={clienteId} onValueChange={setClienteId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um paciente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Contrato Relacionado (Opcional)</Label>
                <Select value={contratoId} onValueChange={setContratoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um contrato..." />
                  </SelectTrigger>
                  <SelectContent>
                    {contratos.map((ct) => (
                      <SelectItem key={ct.id} value={ct.id}>
                        {ct.procedimento} ({ct.data_emissao})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setOpenModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-slate-900 text-white">
                  Salvar Lançamento
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Monthly Financial Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receita Bruta */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Receita Bruta do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Entradas financeiras
            </p>
          </CardContent>
        </Card>

        {/* Total Despesas */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Despesas do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
              <TrendingDown className="h-3 w-3" /> Custos operacionais
            </p>
          </CardContent>
        </Card>

        {/* Lucro Líquido */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Lucro Líquido Real
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${lucroLiquido >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}
            >
              R$ {lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Margem operacional: {margem}%</p>
          </CardContent>
        </Card>

        {/* Total Lançamentos */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Lançamentos no Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{filtered.length}</div>
            <p className="text-[11px] text-slate-500 mt-1">Operações contábeis filtradas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Mês de Referência:</span>
            <Input
              type="month"
              value={mesFiltro}
              onChange={(e) => setMesFiltro(e.target.value)}
              className="w-40 h-9 text-xs"
            />
          </div>

          <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
            <SelectTrigger className="w-full sm:w-40 h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Tipos</SelectItem>
              <SelectItem value="receita">Apenas Receitas</SelectItem>
              <SelectItem value="despesa">Apenas Despesas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Mostrando {filtered.length} registro(s)
        </div>
      </div>

      {/* Registros Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Paciente</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Nota Fiscal</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    Nenhum lançamento no período selecionado.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-900">
                      {r.data}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase font-semibold ${
                          r.tipo === 'receita'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-rose-50 text-rose-800 border-rose-300'
                        }`}
                      >
                        {r.tipo}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-800">
                      {r.descricao}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                      {r.categoria || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                      {r.expand?.cliente?.nome || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-bold text-slate-900">
                      R$ {r.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.tipo === 'receita' ? (
                        r.nf_solicitada ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" /> Solicitada
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenNfModal(r)}
                            className="h-7 text-[11px] border-amber-300 text-amber-800 hover:bg-amber-50"
                          >
                            <Mail className="h-3 w-3 mr-1 text-amber-600" />
                            Solicitar NF
                          </Button>
                        )
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(r.id)}
                        className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Dialog Solicitar Emissão de Nota Fiscal por E-mail */}
      <Dialog open={openNfModal} onOpenChange={setOpenNfModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-amber-600" />
              Solicitar Emissão de Nota Fiscal
            </DialogTitle>
            <DialogDescription className="text-xs">
              Dispara um e-mail com os dados completos do procedimento para a contabilidade da
              clínica.
            </DialogDescription>
          </DialogHeader>

          {nfMessage ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span>{nfMessage}</span>
            </div>
          ) : (
            <form onSubmit={handleSendNf} className="space-y-3 text-xs mt-2">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-[11px]">
                <p>
                  <strong>Paciente:</strong>{' '}
                  {selectedReg?.expand?.cliente?.nome || 'Não especificado'}
                </p>
                <p>
                  <strong>Descrição:</strong> {selectedReg?.descricao}
                </p>
                <p>
                  <strong>Valor:</strong> R${' '}
                  {selectedReg?.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p>
                  <strong>Data:</strong> {selectedReg?.data}
                </p>
              </div>

              <div className="space-y-1">
                <Label>E-mail do Destinatário (Contabilidade / Faturamento) *</Label>
                <Input
                  type="email"
                  value={nfEmail}
                  onChange={(e) => setNfEmail(e.target.value)}
                  placeholder="contabilidade@institutoromani.com.br"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label>Observações Adicionais para a NF</Label>
                <Input
                  value={nfObs}
                  onChange={(e) => setNfObs(e.target.value)}
                  placeholder="Ex: Discriminar materiais cirúrgicos à parte"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setOpenNfModal(false)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={sendingNf}
                  className="bg-slate-900 text-white font-medium"
                >
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  {sendingNf ? 'Disparando E-mail...' : 'Enviar Solicitação'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
