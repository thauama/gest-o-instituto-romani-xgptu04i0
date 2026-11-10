import React, { useEffect, useState } from 'react'
import { usuariosService } from '@/services/clinic'
import type { UserProfile } from '@/hooks/use-auth'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Shield,
  Users,
  Plus,
  Edit,
  Lock,
  Mail,
  User as UserIcon,
  ShieldCheck,
  UserCheck,
  UserX,
  AlertCircle,
  CheckCircle2,
  Crown,
  Info,
} from 'lucide-react'

type Papel = 'admin' | 'equipe'

export default function Permissoes() {
  const { user: usuarioAtual } = useAuth()
  const [usuarios, setUsuarios] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)

  // Modal de criação
  const [openCreate, setOpenCreate] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [novoEmail, setNovoEmail] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [novoPapel, setNovoPapel] = useState<Papel>('equipe')
  const [criando, setCriando] = useState(false)
  const [erroCreate, setErroCreate] = useState<string | null>(null)

  // Modal de edição
  const [editando, setEditando] = useState<UserProfile | null>(null)
  const [editNome, setEditNome] = useState('')
  const [editPapel, setEditPapel] = useState<Papel>('equipe')
  const [editAtivo, setEditAtivo] = useState(true)
  const [editSenha, setEditSenha] = useState('')
  const [editandoLoading, setEditandoLoading] = useState(false)
  const [erroEdit, setErroEdit] = useState<string | null>(null)

  useEffect(() => {
    carregar()
  }, [])

  const carregar = async () => {
    setLoading(true)
    setErro(null)
    try {
      const lista = await usuariosService.list('name')
      setUsuarios(lista)
    } catch (err: any) {
      console.error('Erro ao carregar usuários:', err)
      setErro('Não foi possível carregar a lista de usuários. Verifique se você é administrador.')
    } finally {
      setLoading(false)
    }
  }

  const resetCreate = () => {
    setNovoNome('')
    setNovoEmail('')
    setNovaSenha('')
    setNovoPapel('equipe')
    setErroCreate(null)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setErroCreate(null)
    if (novaSenha.length < 8) {
      setErroCreate('A senha deve conter no mínimo 8 caracteres.')
      return
    }
    setCriando(true)
    try {
      await usuariosService.create({
        name: novoNome,
        email: novoEmail,
        password: novaSenha,
        role: novoPapel,
      })
      setOpenCreate(false)
      resetCreate()
      setSucesso(
        `Usuário "${novoNome}" criado com sucesso. Já pode fazer login com e-mail e senha.`,
      )
      await carregar()
    } catch (err: any) {
      setErroCreate(err?.message || 'Falha ao criar usuário. Verifique os dados informados.')
    } finally {
      setCriando(false)
    }
  }

  const abrirEdicao = (u: UserProfile) => {
    setEditando(u)
    setEditNome(u.name || '')
    setEditPapel((u.role as Papel) || 'equipe')
    setEditAtivo(u.is_active !== false)
    setEditSenha('')
    setErroEdit(null)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editando) return
    setErroEdit(null)
    if (editSenha && editSenha.length < 8) {
      setErroEdit('A nova senha deve conter no mínimo 8 caracteres.')
      return
    }
    setEditandoLoading(true)
    try {
      await usuariosService.update(editando.id, {
        name: editNome,
        role: editPapel,
        is_active: editAtivo,
        ...(editSenha ? { password: editSenha } : {}),
      })
      setEditando(null)
      setSucesso(`Usuário "${editNome}" atualizado com sucesso.`)
      await carregar()
    } catch (err: any) {
      setErroEdit(err?.message || 'Falha ao atualizar o usuário.')
    } finally {
      setEditandoLoading(false)
    }
  }

  const toggleAtivo = async (u: UserProfile) => {
    const novoEstado = u.is_active === false
    try {
      await usuariosService.update(u.id, { is_active: novoEstado })
      setSucesso(
        novoEstado
          ? `Acesso de "${u.name}" reativado.`
          : `Acesso de "${u.name}" desativado. Este usuário não consegue mais entrar.`,
      )
      await carregar()
    } catch (err: any) {
      setErro(err?.message || 'Falha ao alterar o status do usuário.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Shield className="h-6 w-6 text-amber-600" />
            Permissões & Acesso
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gerencie quem acessa o sistema, com qual perfil e se o acesso está ativo.
          </p>
        </div>

        <Button
          onClick={() => setOpenCreate(true)}
          size="sm"
          className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-9"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Criar Novo Usuário
        </Button>
      </div>

      {/* Feedback */}
      {erro && (
        <Alert variant="destructive" className="py-2.5">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">{erro}</AlertDescription>
        </Alert>
      )}
      {sucesso && (
        <Alert className="py-2.5 bg-emerald-50 text-emerald-800 border-emerald-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-xs">{sucesso}</AlertDescription>
        </Alert>
      )}

      {/* Resumo do que cada perfil pode */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="border-amber-200 bg-white shadow-sm">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-600" />
              Administrador
            </CardTitle>
            <CardDescription className="text-[11px] text-slate-500">
              Acesso completo — uso recomendado apenas para o responsável pela clínica.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-2 text-xs text-slate-600 space-y-1.5">
            <p>
              • Vê e edita <strong>tudo</strong>: clientes, itens, movimentações, agenda e
              contratos.
            </p>
            <p>
              • <strong>Controle Financeiro completo</strong>: receitas, despesas, lucro e notas
              fiscais.
            </p>
            <p>
              • Acessa <strong>Permissões & Acesso</strong>: cria, edita e desativa usuários.
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-slate-600" />
              Equipe
            </CardTitle>
            <CardDescription className="text-[11px] text-slate-500">
              Operação do dia a dia da clínica, sem dados financeiros.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-2 text-xs text-slate-600 space-y-1.5">
            <p>• Clientes & Pacientes, Itens & Estoque, Movimentações e Agenda Google.</p>
            <p>• Contratos & Orçamentos sem somatório financeiro.</p>
            <p>
              • <strong>Não vê</strong> o Controle Financeiro nem as Permissões & Acesso.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de usuários */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-600" />
            Usuários da Clínica ({usuarios.length})
          </CardTitle>
          <CardDescription className="text-[11px] text-slate-500">
            Cada usuário entra com o e-mail e a senha cadastrados aqui.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-500">Carregando usuários...</div>
          ) : usuarios.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 border border-dashed rounded-lg">
              Nenhum usuário encontrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="pb-2 pr-4 font-medium">Nome</th>
                    <th className="pb-2 pr-4 font-medium">E-mail</th>
                    <th className="pb-2 pr-4 font-medium">Perfil</th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    <th className="pb-2 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usuarios.map((u) => {
                    const inativo = u.is_active === false
                    const isSelf = usuarioAtual?.id === u.id
                    return (
                      <tr key={u.id} className={inativo ? 'opacity-60' : ''}>
                        <td className="py-2.5 pr-4 font-semibold text-slate-800">
                          <span className="flex items-center gap-1.5">
                            {u.name || 'Sem nome'}
                            {isSelf && (
                              <span className="text-[10px] font-normal text-slate-400">(você)</span>
                            )}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 text-slate-600">{u.email}</td>
                        <td className="py-2.5 pr-4">
                          {u.role === 'admin' ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-amber-50 text-amber-800 border-amber-300"
                            >
                              <Crown className="h-2.5 w-2.5 mr-0.5" /> Administrador
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-slate-100 text-slate-700 border-slate-300"
                            >
                              <UserCheck className="h-2.5 w-2.5 mr-0.5" /> Equipe
                            </Badge>
                          )}
                        </td>
                        <td className="py-2.5 pr-4">
                          {inativo ? (
                            <Badge variant="destructive" className="text-[10px]">
                              <UserX className="h-2.5 w-2.5 mr-0.5" /> Inativo
                            </Badge>
                          ) : (
                            <Badge className="text-[10px] bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border border-emerald-200">
                              <ShieldCheck className="h-2.5 w-2.5 mr-0.5" /> Ativo
                            </Badge>
                          )}
                        </td>
                        <td className="py-2.5 text-right">
                          <div className="inline-flex items-center gap-1">
                            <Switch
                              checked={!inativo}
                              onCheckedChange={() => toggleAtivo(u)}
                              disabled={isSelf}
                              aria-label={inativo ? 'Reativar acesso' : 'Desativar acesso'}
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => abrirEdicao(u)}
                              disabled={isSelf}
                              className="h-8 text-xs text-slate-700"
                            >
                              <Edit className="h-3.5 w-3.5 mr-1" />
                              Editar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <p className="mt-3 text-[11px] text-slate-400 flex items-center gap-1">
                <Info className="h-3 w-3" />
                Você não pode editar ou desativar o seu próprio acesso por aqui.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Criar */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Novo Usuário</DialogTitle>
            <DialogDescription className="text-xs">
              O usuário já poderá fazer login imediatamente com o e-mail e a senha definidos aqui.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 text-xs mt-2">
            {erroCreate && (
              <Alert variant="destructive" className="py-2.5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{erroCreate}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="u-nome">Nome Completo *</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  id="u-nome"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  placeholder="Ex: Maria Recepção"
                  required
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="u-email">E-mail *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  id="u-email"
                  type="email"
                  value={novoEmail}
                  onChange={(e) => setNovoEmail(e.target.value)}
                  placeholder="colaborador@institutoromani.com.br"
                  required
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="u-senha">Senha (mínimo 8 caracteres) *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  id="u-senha"
                  type="password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Perfil de Acesso</Label>
              <Select value={novoPapel} onValueChange={(v: Papel) => setNovoPapel(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equipe">Equipe — sem financeiro</SelectItem>
                  <SelectItem value="admin">Administrador — acesso total</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-3 border-t flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpenCreate(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={criando} className="bg-slate-900 text-white">
                {criando ? 'Criando...' : 'Criar Usuário'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Editar */}
      <Dialog
        open={!!editando}
        onOpenChange={(open) => {
          if (!open) setEditando(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription className="text-xs">
              Altere o perfil, redefina a senha ou ative/desative o acesso.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="space-y-4 text-xs mt-2">
            {erroEdit && (
              <Alert variant="destructive" className="py-2.5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{erroEdit}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="e-nome">Nome Completo</Label>
              <Input
                id="e-nome"
                value={editNome}
                onChange={(e) => setEditNome(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>E-mail (não editável)</Label>
              <Input value={editando?.email || ''} disabled />
            </div>

            <div className="space-y-1.5">
              <Label>Perfil de Acesso</Label>
              <Select value={editPapel} onValueChange={(v: Papel) => setEditPapel(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equipe">Equipe — sem financeiro</SelectItem>
                  <SelectItem value="admin">Administrador — acesso total</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="e-senha">Nova Senha (opcional)</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  id="e-senha"
                  type="password"
                  value={editSenha}
                  onChange={(e) => setEditSenha(e.target.value)}
                  placeholder="Deixe em branco para manter a atual"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
              <div>
                <p className="font-medium text-slate-800">Acesso Ativo</p>
                <p className="text-[11px] text-slate-500">
                  Desativado: o usuário não consegue mais entrar no sistema.
                </p>
              </div>
              <Switch checked={editAtivo} onCheckedChange={setEditAtivo} />
            </div>

            <div className="pt-3 border-t flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setEditando(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={editandoLoading} className="bg-slate-900 text-white">
                {editandoLoading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
