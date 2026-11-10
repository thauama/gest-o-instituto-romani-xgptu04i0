import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ShieldCheck, Stethoscope, Lock, Mail, User, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function Login() {
  const { signIn, signUp, requestPasswordReset } = useAuth()
  const navigate = useNavigate()

  // Sign In State
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signInError, setSignInError] = useState<string | null>(null)
  const [signInLoading, setSignInLoading] = useState(false)

  // Sign Up State
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regRole, setRegRole] = useState<'admin' | 'equipe'>('equipe')
  const [regError, setRegError] = useState<string | null>(null)
  const [regSuccess, setRegSuccess] = useState<string | null>(null)
  const [regLoading, setRegLoading] = useState(false)

  // Forgot Password State
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotMsg, setForgotMsg] = useState<string | null>(null)
  const [forgotLoading, setForgotLoading] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignInError(null)
    setSignInLoading(true)

    const res = await signIn(email, password)
    setSignInLoading(false)

    if (res.error) {
      setSignInError('E-mail ou senha incorretos. Verifique suas credenciais.')
    } else {
      navigate('/painel')
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegError(null)
    setRegSuccess(null)
    setRegLoading(true)

    if (regPassword.length < 8) {
      setRegError('A senha deve conter no mínimo 8 caracteres.')
      setRegLoading(false)
      return
    }

    const res = await signUp(regEmail, regPassword, regName, regRole)
    setRegLoading(false)

    if (res.error) {
      setRegError(res.error?.message || 'Falha ao criar conta. Verifique os dados.')
    } else {
      setRegSuccess('Cadastro realizado com sucesso!')
      setTimeout(() => {
        navigate('/painel')
      }, 800)
    }
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotLoading(true)
    setForgotMsg(null)
    await requestPasswordReset(forgotEmail)
    setForgotLoading(false)
    setForgotMsg('Se o e-mail estiver cadastrado, você receberá as instruções de redefinição.')
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Brand Sidebar */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-slate-950 p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(217,119,6,0.15),transparent_50%)]" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20">
              <Stethoscope className="h-6 w-6 text-slate-950" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Instituto Romani</h1>
              <p className="text-xs text-amber-400 font-medium tracking-wide uppercase">
                Cirurgia Plástica & Estética Avançada
              </p>
            </div>
          </div>
          <div className="mt-16 max-w-md">
            <span className="inline-flex items-center rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 border border-amber-500/20">
              Sorocaba - SP
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Gestão clínica inteligente e integrada
            </h2>
            <p className="mt-4 text-sm text-slate-400 leading-relaxed">
              Painel completo para o Dr. Pedro Ivo Romani e sua equipe: controle de pacientes,
              estoque cirúrgico, contratos com alertas de vigência, orçamentos, agenda Google
              Calendar e controle financeiro.
            </p>
          </div>
        </div>

        <div className="relative z-10 pt-8 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Dr. Pedro Ivo Romani · Responsável Técnico</span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <ShieldCheck className="h-4 w-4" /> Acesso Seguro
          </span>
        </div>
      </div>

      {/* Auth Forms */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500 text-slate-950">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900">Instituto Romani</h1>
              <p className="text-xs text-amber-600 font-medium">Cirurgia Plástica Sorocaba</p>
            </div>
          </div>

          {!showForgot ? (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
                  Acessar Sistema
                </CardTitle>
                <CardDescription className="text-slate-500">
                  Insira suas credenciais corporativas para continuar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="login">Entrar</TabsTrigger>
                    <TabsTrigger value="cadastro">Novo Usuário</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      {signInError && (
                        <Alert variant="destructive" className="py-2.5">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-xs">{signInError}</AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="romani@institutoromani.com.br"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="pl-9"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="password">Senha</Label>
                          <button
                            type="button"
                            onClick={() => setShowForgot(true)}
                            className="text-xs text-amber-600 hover:text-amber-700 hover:underline"
                          >
                            Esqueceu a senha?
                          </button>
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="pl-9"
                          />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={signInLoading}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium"
                      >
                        {signInLoading ? 'Entrando...' : 'Entrar no Painel'}
                      </Button>

                      <div className="mt-4 rounded-lg bg-slate-50 p-3 border border-slate-200/80 text-xs text-slate-600 space-y-1">
                        <p className="font-semibold text-slate-900">Acessos padrão configurados:</p>
                        <p>
                          👑 <strong>Admin:</strong> romani@institutoromani.com.br / Skip@Pass
                        </p>
                        <p>
                          👥 <strong>Equipe:</strong> equipe@institutoromani.com.br / Skip@Pass
                        </p>
                      </div>
                    </form>
                  </TabsContent>

                  <TabsContent value="cadastro">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      {regError && (
                        <Alert variant="destructive" className="py-2.5">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-xs">{regError}</AlertDescription>
                        </Alert>
                      )}
                      {regSuccess && (
                        <Alert className="py-2.5 bg-emerald-50 text-emerald-800 border-emerald-200">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <AlertDescription className="text-xs">{regSuccess}</AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="reg-name">Nome Completo</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input
                            id="reg-name"
                            placeholder="Dra. Roberta ou Maria Recepção"
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                            required
                            className="pl-9"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reg-email">E-mail Corporativo</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input
                            id="reg-email"
                            type="email"
                            placeholder="colaborador@institutoromani.com.br"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            required
                            className="pl-9"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reg-pass">Senha (mínimo 8 caracteres)</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input
                            id="reg-pass"
                            type="password"
                            placeholder="••••••••"
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            required
                            className="pl-9"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Perfil de Acesso</Label>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => setRegRole('equipe')}
                            className={`p-2.5 rounded-md border text-left transition-colors ${
                              regRole === 'equipe'
                                ? 'border-amber-500 bg-amber-50/50 text-amber-950 font-medium'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <p className="font-semibold">Equipe</p>
                            <p className="text-[11px] text-slate-500">Agenda, clientes e estoque</p>
                          </button>
                          <button
                            type="button"
                            onClick={() => setRegRole('admin')}
                            className={`p-2.5 rounded-md border text-left transition-colors ${
                              regRole === 'admin'
                                ? 'border-amber-500 bg-amber-50/50 text-amber-950 font-medium'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <p className="font-semibold">Administrador</p>
                            <p className="text-[11px] text-slate-500">Acesso total e financeiro</p>
                          </button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={regLoading}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium"
                      >
                        {regLoading ? 'Criando conta...' : 'Cadastrar Usuário'}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="space-y-1">
                <CardTitle className="text-xl font-bold tracking-tight text-slate-900">
                  Recuperar Senha
                </CardTitle>
                <CardDescription className="text-slate-500">
                  Informe o e-mail cadastrado para receber o link de redefinição
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleForgot} className="space-y-4">
                  {forgotMsg && (
                    <Alert className="py-2.5 bg-blue-50 text-blue-800 border-blue-200">
                      <CheckCircle2 className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-xs">{forgotMsg}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">E-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="seu@institutoromani.com.br"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium"
                  >
                    {forgotLoading ? 'Enviando e-mail...' : 'Enviar Link de Redefinição'}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="flex justify-center border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForgot(false)}
                  className="text-xs text-amber-600 hover:underline font-medium"
                >
                  ← Voltar para o login
                </button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
