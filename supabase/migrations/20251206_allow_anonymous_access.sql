ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_requests"
ON public.requests FOR SELECT
USING (true);

CREATE POLICY "anon_insert_requests"
ON public.requests FOR INSERT
WITH CHECK (true);

CREATE POLICY "anon_update_requests"
ON public.requests FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "anon_delete_requests"
ON public.requests FOR DELETE
USING (true);

CREATE POLICY "anon_select_timeline"
ON public.timeline_events FOR SELECT
USING (true);

CREATE POLICY "anon_insert_timeline"
ON public.timeline_events FOR INSERT
WITH CHECK (true);

CREATE POLICY "anon_update_timeline"
ON public.timeline_events FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "anon_delete_timeline"
ON public.timeline_events FOR DELETE
USING (true);

CREATE POLICY "anon_select_attachments"
ON public.attachments FOR SELECT
USING (true);

CREATE POLICY "anon_insert_attachments"
ON public.attachments FOR INSERT
WITH CHECK (true);

CREATE POLICY "anon_update_attachments"
ON public.attachments FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "anon_delete_attachments"
ON public.attachments FOR DELETE
USING (true);
