import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Bell, Mail, Globe, Palette } from 'lucide-react';

export default function ConfiguracoesPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">
          Configurações
        </h1>
        <p className="text-muted-foreground">
          Personalize sua experiência no sistema
        </p>
      </div>

      {/* Notifications */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="font-display text-lg">Notificações</CardTitle>
              <CardDescription>Configure como deseja receber alertas</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Notificações no sistema</Label>
              <p className="text-sm text-muted-foreground">
                Receba alertas sobre atualizações das suas solicitações
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Notificações por email</Label>
              <p className="text-sm text-muted-foreground">
                Receba um email quando houver mudança de status
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Resumo diário</Label>
              <p className="text-sm text-muted-foreground">
                Receba um resumo diário das suas solicitações
              </p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Email Preferences */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="font-display text-lg">Preferências de Email</CardTitle>
              <CardDescription>Escolha quais emails deseja receber</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Atualizações de status</Label>
              <p className="text-sm text-muted-foreground">
                Quando uma solicitação mudar de status
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Novos comentários</Label>
              <p className="text-sm text-muted-foreground">
                Quando houver novos comentários na solicitação
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Lembretes de prazo</Label>
              <p className="text-sm text-muted-foreground">
                Alertas sobre prazos próximos
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Palette className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="font-display text-lg">Aparência</CardTitle>
              <CardDescription>Personalize a interface do sistema</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Modo compacto</Label>
              <p className="text-sm text-muted-foreground">
                Reduzir espaçamentos para ver mais conteúdo
              </p>
            </div>
            <Switch />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Animações</Label>
              <p className="text-sm text-muted-foreground">
                Habilitar animações e transições
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="font-display text-lg">Idioma e Região</CardTitle>
              <CardDescription>Configurações de localização</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label>Idioma</Label>
              <p className="text-sm text-muted-foreground">
                Português (Brasil)
              </p>
            </div>
            <Button variant="outline" size="sm">Alterar</Button>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button className="gradient-primary border-0">
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
