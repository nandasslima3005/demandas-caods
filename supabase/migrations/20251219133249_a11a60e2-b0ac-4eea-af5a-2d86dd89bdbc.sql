-- Allow anonymous users to create requests (without authentication)
CREATE POLICY "Anyone can create requests"
ON public.requests
FOR INSERT
WITH CHECK (true);

-- Allow anonymous users to view their own requests by ID (for confirmation)
CREATE POLICY "Anyone can view requests"
ON public.requests
FOR SELECT
USING (true);

-- Allow anonymous users to add timeline events
CREATE POLICY "Anyone can create timeline events"
ON public.timeline_events
FOR INSERT
WITH CHECK (true);

-- Allow anonymous users to view timeline events
CREATE POLICY "Anyone can view timeline events"
ON public.timeline_events
FOR SELECT
USING (true);

-- Allow anonymous users to add attachments
CREATE POLICY "Anyone can create attachments"
ON public.attachments
FOR INSERT
WITH CHECK (true);

-- Allow anonymous users to view attachments
CREATE POLICY "Anyone can view attachments"
ON public.attachments
FOR SELECT
USING (true);