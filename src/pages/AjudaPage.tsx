import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HelpCircle, Mail, Phone, MessageCircle } from 'lucide-react';

const faqs = [
  {
    question: 'Como faço para abrir uma nova solicitação?',
    answer:
      'Acesse o menu "Nova Solicitação" no painel lateral. Preencha todos os campos obrigatórios, incluindo órgão solicitante, tipo de solicitação, número SEI, assunto e descrição detalhada. Você também pode anexar documentos relevantes antes de enviar.',
  },
  {
    question: 'Quanto tempo leva para minha solicitação ser analisada?',
    answer:
      'O tempo de análise varia conforme a prioridade: solicitações de prioridade baixa levam de 7 a 10 dias úteis, média de 5 a 7 dias, alta de 2 a 3 dias, e urgentes são tratadas em 24 a 48 horas. Fatores como complexidade do caso podem influenciar esse prazo.',
  },
  {
    question: 'O que significa cada status da solicitação?',
    answer:
      'Pendente: aguardando início da análise. Em Análise: equipe técnica está avaliando. Em Andamento: trabalho de elaboração em curso. Aguardando Resposta: necessitamos de informações adicionais. Concluído: demanda finalizada.',
  },
  {
    question: 'Como posso verificar a posição da minha solicitação na fila?',
    answer:
      'Acesse "Minhas Solicitações" e clique na solicitação desejada. Na tela de detalhes, você verá um banner indicando sua posição na fila de atendimento, que considera a prioridade e ordem de chegada.',
  },
  {
    question: 'Posso alterar a prioridade da minha solicitação?',
    answer:
      'Usuários externos não podem alterar a prioridade diretamente. Se houver mudança na urgência do caso, entre em contato com a equipe gestora que poderá reavaliar e ajustar a prioridade conforme necessário.',
  },
  {
    question: 'Quais tipos de arquivos posso anexar?',
    answer:
      'São aceitos arquivos nos formatos PDF, DOC, DOCX, JPG, JPEG e PNG. O tamanho máximo por arquivo é de 10MB. Recomendamos sempre anexar documentos relevantes para agilizar a análise.',
  },
  {
    question: 'Como funciona o sistema de notificações?',
    answer:
      'Você receberá notificações sempre que houver atualização no status da sua solicitação. As notificações aparecem no ícone de sino no cabeçalho do sistema.',
  },
  {
    question: 'Posso adicionar informações após enviar a solicitação?',
    answer:
      'Sim, acesse os detalhes da solicitação e utilize a opção "Anexar documento" ou "Adicionar comentário" para incluir informações adicionais que possam ajudar na análise.',
  },
];

export default function AjudaPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-full gradient-primary flex items-center justify-center">
            <HelpCircle className="h-8 w-8 text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-2xl font-bold font-display text-foreground">
          Central de Ajuda
        </h1>
        <p className="text-muted-foreground mt-2">
          Encontre respostas para suas dúvidas sobre o sistema
        </p>
      </div>

      {/* FAQ */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display text-lg">
            Perguntas Frequentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display text-lg">
            Precisa de mais ajuda?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Se você não encontrou a resposta que procurava, entre em contato com nossa equipe de suporte.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <span className="text-sm">E-mail</span>
              <span className="text-xs text-muted-foreground">caods@mppi.mp.br</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <Phone className="h-5 w-5 text-primary" />
              <span className="text-sm">Telefone</span>
              <span className="text-xs text-muted-foreground">(86) 2222-8156</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <span className="text-sm">Chat</span>
              <span className="text-xs text-muted-foreground">Seg-Sex, 8h-15h</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
