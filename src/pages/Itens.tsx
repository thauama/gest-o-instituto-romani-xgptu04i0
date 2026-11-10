import React, { useEffect, useState } from 'react'
import { itensService } from '@/services/clinic'
import type { ItemEstoque } from '@/types/clinic'
import { PROCEDIMENTOS_CLINICA } from '@/lib/procedimentos'
import { alertaValidade, ALERTA_VALIDADE_CLASSE, ALERTA_VALIDADE_LABEL } from '@/lib/estoque'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
  Package,
  Search,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  Layers,
  Sparkles,
  CalendarClock,
} from 'lucide-react'

export default function Itens() {
  const [itens, setItens] = useState<ItemEstoque[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState<string>('todos')

  // Modal State
  const [openModal, setOpenModal] = useState(false)
  const [editingItem, setEditingItem] = useState<ItemEstoque | null>(null)

  // Form
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<'produto' | 'peca' | 'servico'>('produto')
  const [quantidade, setQuantidade] = useState<number>(0)
  const [preco, setPreco] = useState<number>(0)
  const [estoqueMinimo, setEstoqueMinimo] = useState<number>(1)
  const [unidade, setUnidade] = useState('un')
  const [descricao, setDescricao] = useState('')
  const [validade, setValidade] = useState('')
  const [procedimentosSel, setProcedimentosSel] = useState<string[]>([])

  useEffect(() => {
    loadItens()
  }, [])

  const loadItens = async () => {
    setLoading(true)
    try {
      const list = await itensService.list('', 'nome')
      setItens(list)
    } catch (err) {
      console.error('Erro ao carregar itens:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenCreate = () => {
    setEditingItem(null)
    setNome('')
    setTipo('produto')
    setQuantidade(1)
    setPreco(0)
    setEstoqueMinimo(1)
    setUnidade('un')
    setDescricao('')
    setValidade('')
    setProcedimentosSel([])
    setOpenModal(true)
  }

  const handleOpenEdit = (it: ItemEstoque) => {
    setEditingItem(it)
    setNome(it.nome)
    setTipo(it.tipo)
    setQuantidade(it.quantidade)
    setPreco(it.preco)
    setEstoqueMinimo(it.estoque_minimo || 0)
    setUnidade(it.unidade || 'un')
    setDescricao(it.descricao || '')
    setValidade(it.validade || '')
    setProcedimentosSel(Array.isArray(it.procedimentos) ? it.procedimentos : [])
    setOpenModal(true)
  }

  const toggleProcedimento = (p: string) => {
    setProcedimentosSel((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome) return

    const payload: Partial<ItemEstoque> = {
      nome,
      tipo,
      quantidade: Number(quantidade) || 0,
      preco: Number(preco) || 0,
      estoque_minimo: Number(estoqueMinimo) || 0,
      unidade,
      descricao,
      // '' e [] limpam o campo no banco (permitem remover validade/vínculos ao editar)
      validade,
      procedimentos: procedimentosSel,
    }

    if (editingItem) {
      await itensService.update(editingItem.id, payload)
    } else {
      await itensService.create(payload)
    }

    setOpenModal(false)
    await loadItens()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir este item do catálogo?')) {
      await itensService.delete(id)
      await loadItens()
    }
  }

  const filtered = itens.filter((it) => {
    const matchSearch =
      it.nome?.toLowerCase().includes(search.toLowerCase()) ||
      it.descricao?.toLowerCase().includes(search.toLowerCase())
    const matchTipo = tipoFiltro === 'todos' || it.tipo === tipoFiltro
    return matchSearch && matchTipo
  })

  const badgeValidade = (it: ItemEstoque) => {
    const alerta = alertaValidade(it)
    if (alerta === 'ok' || !it.validade) return null
    return (
      <Badge
        variant="outline"
        className={`text-[10px] font-semibold border ${ALERTA_VALIDADE_CLASSE[alerta]}`}
      >
        {alerta === 'vencido' ? 'Vencido' : 'Vence em 60 dias'}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Package className="h-6 w-6 text-amber-600" />
            Catálogo de Itens & Estoque
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Cadastro de produtos, peças cirúrgicas e serviços com controle de quantidade, preço,
            validade e procedimentos.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          size="sm"
          className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-9"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Cadastrar Novo Item
        </Button>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome ou descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
            <SelectTrigger className="w-full sm:w-44 h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Tipos</SelectItem>
              <SelectItem value="produto">Produtos (Farmácia)</SelectItem>
              <SelectItem value="peca">Peças / Implantes</SelectItem>
              <SelectItem value="servico">Serviços / Sessões</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          {filtered.length} item(ns) listado(s)
        </div>
      </div>

      {/* Grid of Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-full p-12 text-center border border-dashed rounded-xl bg-white text-xs text-slate-500">
            Nenhum item cadastrado com os filtros atuais.
          </div>
        ) : (
          filtered.map((it) => {
            const isLowStock = it.tipo !== 'servico' && it.quantidade <= it.estoque_minimo
            return (
              <Card
                key={it.id}
                className={`border shadow-sm transition-colors ${
                  isLowStock ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200 bg-white'
                }`}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-sm font-bold text-slate-900">{it.nome}</CardTitle>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <Badge
                          variant="secondary"
                          className="text-[10px] capitalize bg-slate-100 text-slate-700"
                        >
                          {it.tipo}
                        </Badge>
                        {isLowStock && (
                          <Badge
                            variant="destructive"
                            className="text-[10px] bg-amber-500 text-slate-950 hover:bg-amber-500 font-bold flex items-center gap-1"
                          >
                            <AlertTriangle className="h-3 w-3" /> Reposição
                          </Badge>
                        )}
                        {badgeValidade(it)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2 space-y-3 text-xs text-slate-600">
                  {it.descricao && (
                    <p className="text-[11px] text-slate-500 line-clamp-2">{it.descricao}</p>
                  )}

                  {it.validade && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                      <CalendarClock className="h-3.5 w-3.5 text-amber-600" />
                      Validade:{' '}
                      <strong className="text-slate-800">
                        {new Date(`${it.validade}T12:00:00`).toLocaleDateString('pt-BR')}
                      </strong>
                    </div>
                  )}

                  {(it.procedimentos?.length || 0) > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {it.procedimentos!.slice(0, 3).map((p) => (
                        <Badge
                          key={p}
                          variant="outline"
                          className="text-[9px] border-sky-200 text-sky-700 bg-sky-50"
                        >
                          {p}
                        </Badge>
                      ))}
                      {(it.procedimentos!.length || 0) > 3 && (
                        <Badge
                          variant="outline"
                          className="text-[9px] border-slate-200 text-slate-600"
                        >
                          +{it.procedimentos!.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Quantidade:</span>
                      <span
                        className={`font-bold ${isLowStock ? 'text-amber-800' : 'text-slate-900'}`}
                      >
                        {it.quantidade} {it.unidade || 'un'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Preço Unitário:</span>
                      <span className="font-bold text-slate-900">
                        R$ {it.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    {it.tipo !== 'servico' && (
                      <div className="col-span-2 pt-1 border-t border-slate-200/60 text-[10px] text-slate-500">
                        Estoque Mínimo de Segurança:{' '}
                        <strong>
                          {it.estoque_minimo} {it.unidade || 'un'}
                        </strong>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenEdit(it)}
                      className="h-8 text-xs text-slate-700"
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(it.id)}
                      className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Modal Dialog Form */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Item' : 'Cadastrar Item'}</DialogTitle>
            <DialogDescription className="text-xs">
              Informe o tipo de item (produto, peça ou serviço), quantidade, valor, validade e
              procedimentos.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 text-xs mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="i-nome">Nome do Item *</Label>
              <Input
                id="i-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Prótese Motiva 320ml, Botox 100UI, Drenagem"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="i-tipo">Tipo</Label>
                <Select
                  value={tipo}
                  onValueChange={(v: 'produto' | 'peca' | 'servico') => setTipo(v)}
                >
                  <SelectTrigger id="i-tipo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="produto">Produto (Medicamento/Consumo)</SelectItem>
                    <SelectItem value="peca">Peça (Prótese/Cinta)</SelectItem>
                    <SelectItem value="servico">Serviço (Procedimento/Sessão)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="i-unidade">Unidade de Medida</Label>
                <Input
                  id="i-unidade"
                  value={unidade}
                  onChange={(e) => setUnidade(e.target.value)}
                  placeholder="un, par, frasco, cx, sessão"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="i-preco">Preço (R$) *</Label>
                <Input
                  id="i-preco"
                  type="number"
                  step="0.01"
                  min="0"
                  value={preco}
                  onChange={(e) => setPreco(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="i-qtd">Qtd Atual</Label>
                <Input
                  id="i-qtd"
                  type="number"
                  min="0"
                  value={quantidade}
                  onChange={(e) => setQuantidade(parseInt(e.target.value, 10) || 0)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="i-min">Estoque Mín.</Label>
                <Input
                  id="i-min"
                  type="number"
                  min="0"
                  value={estoqueMinimo}
                  onChange={(e) => setEstoqueMinimo(parseInt(e.target.value, 10) || 0)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="i-validade" className="flex items-center gap-1.5">
                <CalendarClock className="h-3.5 w-3.5 text-amber-600" />
                Validade
              </Label>
              <Input
                id="i-validade"
                type="date"
                value={validade}
                onChange={(e) => setValidade(e.target.value)}
              />
              <p className="text-[10px] text-slate-500">
                Opcional. Alerta automático de vencido e vencendo nos próximos 60 dias.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-amber-600" />
                Usado nos procedimentos
              </Label>
              <p className="text-[10px] text-slate-500">
                Marque os procedimentos em que este material é utilizado — ao emitir o contrato, ele
                entra automaticamente no checklist.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50/60">
                {PROCEDIMENTOS_CLINICA.map((p) => (
                  <label
                    key={p}
                    className="flex items-center gap-2 text-[11px] text-slate-700 cursor-pointer hover:text-slate-900"
                  >
                    <Checkbox
                      checked={procedimentosSel.includes(p)}
                      onCheckedChange={() => toggleProcedimento(p)}
                    />
                    {p}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="i-desc">Descrição / Especificações</Label>
              <Input
                id="i-desc"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Detalhes técnicos, lote ou fabricante"
              />
            </div>

            <div className="pt-3 border-t flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpenModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-slate-900 text-white">
                Salvar Item
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
