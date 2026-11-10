import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { clientesService } from '@/services/clinic'
import type { Cliente } from '@/types/clinic'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Stethoscope, CheckCircle2, ShieldCheck, HeartPulse } from 'lucide-react'

export default function PreCadastroPaciente() {
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [client, setClient] = useState<Cliente | null>(null)

  // Fields
  const [nome, setNome] = useState('')
  const [rg, setRg] = useState('')
  const [cpf, setCpf] = useState('')
  const [nascimento, setNascimento] = useState('')
  const [endereco, setEndereco] = useState('')
  const [profissao, setProfissao] = useState('')
  const [estadoCivil, setEstadoCivil] = useState('Solteira(o)')
  const [email, setEmail] = useState('')
  const [religiao, setReligiao] = useState('')
  const [peso, setPeso] = useState('')
  const [altura, setAltura] = useState('')
  const [instagram, setInstagram] = useState('')
  const [contato, setContato] = useState('')
  const [observacoes, setObservacoes] = useState('')

  useEffect(() => {
    if (id) {
      loadClient(id)
    }
  }, [id])

  const loadClient = async (clientId: string) => {
    setLoading(true)
    try {
      const data = await clientesService.getById(clientId)
      setClient(data)
      setNome(data.nome || '')
      setRg(data.rg || '')
      setCpf(data.cpf || '')
      setNascimento(data.nascimento || '')
      setEndereco(data.endereco || '')
      setProfissao(data.profissao || '')
      setEstadoCivil(data.estado_civil || 'Solteira(o)')
      setEmail(data.email || '')
      setReligiao(data.religiao || '')
      setPeso(data.peso || '')
      setAltura(data.altura || '')
      setInstagram(data.instagram || '')
      setContato(data.contato || '')
      setObservacoes(data.observacoes || '')
    } catch (err) {
      console.error('Erro ao carregar pré-cadastro:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setSaving(true)

    try {
      await clientesService.update(id, {
        nome,
        rg,
        cpf,
        nascimento,
        endereco,
        profissao,
        estado_civil: estadoCivil,
        email,
        religiao,
        peso,
        altura,
        instagram,
        contato,
        observacoes,
        status_cadastro: 'completo',
      })
      setSuccess(true)
    } catch (err) {
      console.error('Erro ao salvar pré-cadastro:', err)
      alert('Houve uma falha ao enviar os dados. Por favor, tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-600 border-t-transparent" />
          <p className="text-xs text-slate-600 font-medium">Carregando formulário da clínica...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/10">
            <Stethoscope className="h-6 w-6 text-slate-950" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Instituto Romani</h1>
          <p className="text-xs text-amber-700 font-semibold tracking-wide uppercase">
            Cirurgia Plástica · Sorocaba-SP · Dr. Pedro Ivo Romani
          </p>
        </div>

        {success ? (
          <Card className="border-emerald-200 bg-emerald-50/40 text-center p-8 shadow-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <CardTitle className="text-xl font-bold text-emerald-950">
                Dados Enviados com Sucesso!
              </CardTitle>
              <CardDescription className="text-xs text-emerald-800 max-w-md">
                Obrigado por completar seu cadastro prévio, <strong>{nome}</strong>. Suas
                informações foram registradas com segurança no sistema da nossa clínica e estarão à
                disposição do Dr. Pedro Ivo na sua consulta.
              </CardDescription>
              <div className="pt-4 flex items-center gap-2 text-[11px] text-slate-500">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Dados protegidos de acordo com a LGPD e sigilo médico.</span>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 text-amber-600 font-semibold text-xs mb-1">
                <HeartPulse className="h-4 w-4" />
                <span>Ficha Cadastral Pré-Consulta</span>
              </div>
              <CardTitle className="text-lg font-bold text-slate-900">
                Confirmação de Dados do Paciente
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Por favor, complete ou revise seus dados cadastrais para agilizar o atendimento
                presencial no consultório.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <Label htmlFor="pac-nome">Nome Completo *</Label>
                  <Input
                    id="pac-nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="pac-contato">Telefone / WhatsApp *</Label>
                    <Input
                      id="pac-contato"
                      value={contato}
                      onChange={(e) => setContato(e.target.value)}
                      placeholder="(15) 99999-9999"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pac-email">E-mail *</Label>
                    <Input
                      id="pac-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu.email@exemplo.com"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="pac-cpf">CPF</Label>
                    <Input
                      id="pac-cpf"
                      value={cpf}
                      onChange={(e) => setCpf(e.target.value)}
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pac-rg">RG</Label>
                    <Input
                      id="pac-rg"
                      value={rg}
                      onChange={(e) => setRg(e.target.value)}
                      placeholder="00.000.000-0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pac-nasc">Data de Nascimento</Label>
                    <Input
                      id="pac-nasc"
                      type="date"
                      value={nascimento}
                      onChange={(e) => setNascimento(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pac-end">Endereço Completo</Label>
                  <Input
                    id="pac-end"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    placeholder="Rua, número, complemento, bairro, cidade - UF"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="pac-prof">Profissão</Label>
                    <Input
                      id="pac-prof"
                      value={profissao}
                      onChange={(e) => setProfissao(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pac-est">Estado Civil</Label>
                    <Input
                      id="pac-est"
                      value={estadoCivil}
                      onChange={(e) => setEstadoCivil(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pac-rel">Religião</Label>
                    <Input
                      id="pac-rel"
                      value={religiao}
                      onChange={(e) => setReligiao(e.target.value)}
                      placeholder="Opcional"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="pac-peso">Peso Aproximado</Label>
                    <Input
                      id="pac-peso"
                      value={peso}
                      onChange={(e) => setPeso(e.target.value)}
                      placeholder="Ex: 60 kg"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pac-alt">Altura Aproximada</Label>
                    <Input
                      id="pac-alt"
                      value={altura}
                      onChange={(e) => setAltura(e.target.value)}
                      placeholder="Ex: 1.65 m"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pac-insta">Instagram</Label>
                    <Input
                      id="pac-insta"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="@perfil"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pac-obs">Queixa Principal / Procedimento Desejado</Label>
                  <Input
                    id="pac-obs"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Conte resumidamente o que gostaria de avaliar na consulta"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium h-10 mt-4 text-xs"
                >
                  {saving ? 'Enviando dados...' : 'Confirmar e Enviar Ficha à Clínica'}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="bg-slate-50 border-t border-slate-100 flex justify-center text-[11px] text-slate-500 py-3">
              <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
              Ambiente criptografado e seguro · Instituto Romani
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}
