import React, { useEffect, useState } from 'react'
import { movimentacoesService, itensService, clientesService } from '@/services/clinic'
import type { Movimentacao, ItemEstoque, Cliente } from '@/types/clinic'
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
  ArrowLeftRight,
  Plus,
  ArrowDownCircle,
  ArrowUpCircle,
  Stethoscope,
  Trash2,
  Calendar,
} from 'lucide-react'

export default function Movimentacoes() {
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([])
  const [itens, setItens] = useState<ItemEstoque[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [filtroData, setFiltroData] = useState<string>('')

  // Modal
  const [openModal, setOpenModal] = useState(false)
  const [tipo, setTipo] = useState<'entrada' | 'saida' | 'atendimento'>('atendimento')
  const [data, setData] = useState(new Date().toISOString().slice(0, 10))
  const [itemId, setItemId] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [quantidade, setQuantidade] = useState<number>(1)
  const [observacao, setObservacao] = useState('')

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const movs = await movimentacoesService.list('', '-data,-created')
      const its = await itensService.list('', 'nome')
      const clis = await clientesService.list('', 'nome')
      setMovimentacoes(movs)
      setItens(its)
      setClientes(clis)
    } catch (err) {
      console.error('Erro ao carregar movimentações:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    await movimentacoesService.create({
      tipo,
      data,
      item: itemId || undefined,
      cliente: clienteId || undefined,
      quantidade: Number(quantidade) || 1,
      observacao,
    })

    setOpenModal(false)
    setItemId('')
    setClienteId('')
    setObservacao('')
    await loadAll()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir este registro de movimentação?')) {
      await movimentacoesService.delete(id)
      await loadAll()
    }
  }

  const filtered = movimentacoes.filter((m) => {
    const matchTipo = filtroTipo === 'todos' || m.tipo === filtroTipo
    const matchData = !filtroData || m.data === filtroData
    return matchTipo && matchData
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ArrowLeftRight className="h-6 w-6 text-indigo-600" />
            Movimentações do Dia
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Registro diário de entradas (compras/lotes), saídas de materiais e atendimentos clínicos
            realizados.
          </p>
        </div>

        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-9">
              <Plus className="h-4 w-4 mr-1.5" />
              Registrar Movimentação
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Movimentação</DialogTitle>
              <DialogDescription className="text-xs">
                Registre uma entrada de estoque, saída ou atendimento médico do dia.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSave} className="space-y-4 text-xs mt-2">
              <div className="space-y-1.5">
                <Label htmlFor="m-tipo">Tipo de Movimentação *</Label>
                <Select
                  value={tipo}
                  onValueChange={(v: 'entrada' | 'saida' | 'atendimento') => setTipo(v)}
                >
                  <SelectTrigger id="m-tipo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="atendimento">Atendimento Clínico / Procedimento</SelectItem>
                    <SelectItem value="saida">Saída / Uso de Material</SelectItem>
                    <SelectItem value="entrada">Entrada / Chegada de Fornecedor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="m-data">Data *</Label>
                  <Input
                    id="m-data"
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="m-qtd">Quantidade</Label>
                  <Input
                    id="m-qtd"
                    type="number"
                    min="1"
                    value={quantidade}
                    onChange={(e) => setQuantidade(parseInt(e.target.value, 10) || 1)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="m-item">Item / Material Relacionado (Opcional)</Label>
                <Select value={itemId} onValueChange={setItemId}>
                  <SelectTrigger id="m-item">
                    <SelectValue placeholder="Selecione um item (ou deixe em branco)" />
                  </SelectTrigger>
                  <SelectContent>
                    {itens.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.nome} ({i.tipo} - {i.quantidade} {i.unidade || 'un'} em estoque)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="m-cli">Paciente / Cliente (Opcional)</Label>
                <Select value={clienteId} onValueChange={setClienteId}>
                  <SelectTrigger id="m-cli">
                    <SelectValue placeholder="Selecione o paciente" />
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

              <div className="space-y-1.5">
                <Label htmlFor="m-obs">Observações / Detalhes</Label>
                <Input
                  id="m-obs"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Ex: Aplicação terço superior, entrega de cinta, recebimento NF"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setOpenModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-slate-900 text-white">
                  Salvar Registro
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="w-full sm:w-48 h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Tipos</SelectItem>
              <SelectItem value="atendimento">Apenas Atendimentos</SelectItem>
              <SelectItem value="saida">Apenas Saídas</SelectItem>
              <SelectItem value="entrada">Apenas Entradas</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={filtroData}
            onChange={(e) => setFiltroData(e.target.value)}
            className="w-full sm:w-44 h-9 text-xs"
          />

          {filtroData && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFiltroData('')}
              className="text-xs h-9 text-slate-500"
            >
              Limpar data
            </Button>
          )}
        </div>

        <div className="text-xs text-slate-500 font-medium">
          {filtered.length} registro(s) encontrado(s)
        </div>
      </div>

      {/* Movimentações Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Item / Insumo</th>
                <th className="px-4 py-3">Paciente</th>
                <th className="px-4 py-3">Qtd</th>
                <th className="px-4 py-3">Observação</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    Nenhuma movimentação registrada.
                  </td>
                </tr>
              ) : (
                filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-900">
                      {m.data}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase font-semibold ${
                          m.tipo === 'entrada'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : m.tipo === 'saida'
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        {m.tipo === 'entrada' && <ArrowDownCircle className="h-3 w-3 mr-1" />}
                        {m.tipo === 'saida' && <ArrowUpCircle className="h-3 w-3 mr-1" />}
                        {m.tipo === 'atendimento' && <Stethoscope className="h-3 w-3 mr-1" />}
                        {m.tipo}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-800">
                      {m.expand?.item?.nome || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                      {m.expand?.cliente?.nome || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-semibold">
                      {m.quantidade || 1}
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-slate-500">
                      {m.observacao || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(m.id)}
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
    </div>
  )
}
