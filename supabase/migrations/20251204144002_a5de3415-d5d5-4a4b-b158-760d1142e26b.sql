-- Create requests table
CREATE TABLE public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  orgao_solicitante TEXT NOT NULL,
  tipo_solicitacao TEXT NOT NULL,
  data_solicitacao DATE NOT NULL DEFAULT CURRENT_DATE,
  numero_sei TEXT,
  numero_simp TEXT,
  assunto TEXT NOT NULL,
  descricao TEXT NOT NULL,
  encaminhamento TEXT,
  prioridade TEXT NOT NULL DEFAULT 'media',
  status TEXT NOT NULL DEFAULT 'pendente',
  posicao_fila INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create timeline_events table
CREATE TABLE public.timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.requests(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create attachments table
CREATE TABLE public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.requests(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL,
  size INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- RLS for requests
CREATE POLICY "Users can view their own requests"
ON public.requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own requests"
ON public.requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own requests"
ON public.requests FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Gestores can view all requests"
ON public.requests FOR SELECT
USING (public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Gestores can manage all requests"
ON public.requests FOR ALL
USING (public.has_role(auth.uid(), 'gestor'));

-- RLS for timeline_events
CREATE POLICY "Users can view timeline of their requests"
ON public.timeline_events FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.requests r 
  WHERE r.id = request_id AND r.user_id = auth.uid()
));

CREATE POLICY "Gestores can view all timeline events"
ON public.timeline_events FOR SELECT
USING (public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Gestores can manage timeline events"
ON public.timeline_events FOR ALL
USING (public.has_role(auth.uid(), 'gestor'));

-- RLS for attachments
CREATE POLICY "Users can view attachments of their requests"
ON public.attachments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.requests r 
  WHERE r.id = request_id AND r.user_id = auth.uid()
));

CREATE POLICY "Users can add attachments to their requests"
ON public.attachments FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.requests r 
  WHERE r.id = request_id AND r.user_id = auth.uid()
));

CREATE POLICY "Gestores can view all attachments"
ON public.attachments FOR SELECT
USING (public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Gestores can manage attachments"
ON public.attachments FOR ALL
USING (public.has_role(auth.uid(), 'gestor'));

-- Trigger for automatic timestamp updates on requests
CREATE TRIGGER update_requests_updated_at
  BEFORE UPDATE ON public.requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate queue position
CREATE OR REPLACE FUNCTION public.calculate_queue_position()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.posicao_fila IS NULL THEN
    SELECT COALESCE(MAX(posicao_fila), 0) + 1 INTO NEW.posicao_fila
    FROM public.requests
    WHERE status NOT IN ('concluido', 'arquivado');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_queue_position
  BEFORE INSERT ON public.requests
  FOR EACH ROW EXECUTE FUNCTION public.calculate_queue_position();