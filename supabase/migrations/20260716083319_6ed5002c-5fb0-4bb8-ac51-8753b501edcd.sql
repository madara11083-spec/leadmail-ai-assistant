
CREATE TABLE public.bulk_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Untitled Campaign',
  sheet_id TEXT NOT NULL,
  sheet_tab TEXT NOT NULL DEFAULT 'Sheet1',
  business_type TEXT NOT NULL,
  service TEXT NOT NULL,
  tone INT NOT NULL DEFAULT 3,
  agency_name TEXT NOT NULL DEFAULT 'Your Agency',
  from_name TEXT NOT NULL DEFAULT 'Your Name',
  unsubscribe_text TEXT NOT NULL DEFAULT 'Reply "unsubscribe" to opt out.',
  daily_limit INT NOT NULL DEFAULT 40,
  status TEXT NOT NULL DEFAULT 'idle',
  sent_today INT NOT NULL DEFAULT 0,
  last_run_date DATE,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.campaign_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.bulk_campaigns(id) ON DELETE CASCADE,
  row_index INT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  business TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  niche TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  subject TEXT,
  body TEXT,
  error TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaign_leads_campaign_status ON public.campaign_leads(campaign_id, status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bulk_campaigns TO anon, authenticated;
GRANT ALL ON public.bulk_campaigns TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_leads TO anon, authenticated;
GRANT ALL ON public.campaign_leads TO service_role;

ALTER TABLE public.bulk_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read campaigns" ON public.bulk_campaigns FOR SELECT USING (true);
CREATE POLICY "Anyone can insert campaigns" ON public.bulk_campaigns FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update campaigns" ON public.bulk_campaigns FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete campaigns" ON public.bulk_campaigns FOR DELETE USING (true);

CREATE POLICY "Anyone can read leads" ON public.campaign_leads FOR SELECT USING (true);
CREATE POLICY "Anyone can insert leads" ON public.campaign_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update leads" ON public.campaign_leads FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete leads" ON public.campaign_leads FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_bulk_campaigns_updated_at
BEFORE UPDATE ON public.bulk_campaigns
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
