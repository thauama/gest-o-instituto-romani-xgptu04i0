import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Cliente, RegistroFinanceiro } from '@/types/clinic'

export interface FormLancamento {
  tipo: 'receita' | 'despesa'
  descricao: string
  valor: string
  data: string
  categoria: string
  cliente: string
  mes_referencia: string
}

interface Props {
  open: boolean
  editando: RegistroFinanceiro | null
  clientes: Cliente[]
  categoriasReceita: string[]
  categoriasDespesa: string[]
  onClose: () => void
  onSave: (form: FormLancamento) => Promise<void>
}

export const CATEGORIAS_RECEITA = [
  'Procedimentos Cirúrgicos',
  'Procedimentos Ambulatoriais',
  'Consultas e Avaliações',
  'Pacotes Pós-Operatórios',
  'Produtos e Cosméticos',
  'Outras Receitas',
]

export const CATEGORIAS_DESPESA = [
  'Insumos e Materiais',
  'Custos Fixos / Ocupação',
  'Equipe / Folha de Pagamento',
  'Impostos e Taxas',
  'Marketing e Publicidade',
  'Equipamentos e Manutenção',
  'Outras Despesas',
]

export default function DialogoLancamento({
  open,
  editando,
  clientes,
  categoriasReceita,
  categoriasDespesa,
  onClose,
  onSave,
}: Props) {
  const hoje = new Date().toISOString().slice(0, 10)
  const mesAtual = hoje.slice(0, 7)
  const [form, setForm] = useState<FormLancamento>({
    tipo: 'receita',
    descricao: '',
    valor: '',
    data: hoje,
    categoria: categoriasReceita[0],
    cliente: 'none',
    mes_referencia: mesAtual,
  })

  useEffect(() => {
    if (open) {
      if (editando) {
        setForm({
          tipo: editando.tipo,
          descricao: editando.descricao,
          valor: String(editando.valor),
          data: editando.data,
          categoria: editando.categoria || categoriasReceita[0],
          cliente: editando.cliente || 'none',
          mes_referencia: editando.mes_referencia || editando.data.slice(0, 7),
        })
      } else {
        setForm({
          tipo: 'receita',
          descricao: '',
          valor: '',
          data: hoje,
          categoria: categoriasReceita[0],
          cliente: 'none',
          mes_referencia: hoje.slice(0, 7),
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editando])

  const categorias = form.tipo === 'receita' ? categoriasReceita : categoriasDespesa
  const set = (k: keyof FormLancamento, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.descricao.trim() || !form.valor) return
    await onSave(form)
  }

  const valido = form.descricao.trim() && form.valor && Number(form.valor) > 0

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : undefined)}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-slate-100">
            {editando ? 'Editar Lançamento' : 'Novo Lançamento'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Registre uma receita ou despesa da clínica.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-slate-300">Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => set('tipo', v)}>
                <SelectTrigger className="bg-slate-800/60 border-slate-700 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-slate-100">
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">Categoria</Label>
              <Select value={form.categoria} onValueChange={(v) => set('categoria', v)}>
                <SelectTrigger className="bg-slate-800/60 border-slate-700 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-slate-100 max-h-60">
                  {categorias.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-slate-300">Descrição</Label>
            <Input
              value={form.descricao}
              onChange={(e) => set('descricao', e.target.value)}
              placeholder="Ex.: Entrada contrato cirurgia — paciente"
              className="bg-slate-800/60 border-slate-700 text-slate-100 placeholder:text-slate-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-slate-300">Valor (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.valor}
                onChange={(e) => set('valor', e.target.value)}
                className="bg-slate-800/60 border-slate-700 text-slate-100"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">Data</Label>
              <Input
                type="date"
                value={form.data}
                onChange={(e) => set('data', e.target.value)}
                className="bg-slate-800/60 border-slate-700 text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-slate-300">Mês de referência</Label>
              <Input
                type="month"
                value={form.mes_referencia}
                onChange={(e) => set('mes_referencia', e.target.value)}
                className="bg-slate-800/60 border-slate-700 text-slate-100"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">Cliente (opcional)</Label>
              <Select value={form.cliente} onValueChange={(v) => set('cliente', v)}>
                <SelectTrigger className="bg-slate-800/60 border-slate-700 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-slate-100 max-h-60">
                  <SelectItem value="none">Sem vínculo</SelectItem>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={submit}
              disabled={!valido}
              className={
                form.tipo === 'receita'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-rose-600 hover:bg-rose-500 text-white'
              }
            >
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
