
-- Add owner column
ALTER TABLE public.bulk_campaigns
  ADD COLUMN user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();

ALTER TABLE public.campaign_leads
  ADD COLUMN user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();

CREATE INDEX bulk_campaigns_user_id_idx ON public.bulk_campaigns(user_id);
CREATE INDEX campaign_leads_user_id_idx ON public.campaign_leads(user_id);

-- Drop permissive policies
DROP POLICY IF EXISTS "Anyone can delete campaigns" ON public.bulk_campaigns;
DROP POLICY IF EXISTS "Anyone can insert campaigns" ON public.bulk_campaigns;
DROP POLICY IF EXISTS "Anyone can read campaigns" ON public.bulk_campaigns;
DROP POLICY IF EXISTS "Anyone can update campaigns" ON public.bulk_campaigns;

DROP POLICY IF EXISTS "Anyone can delete leads" ON public.campaign_leads;
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.campaign_leads;
DROP POLICY IF EXISTS "Anyone can read leads" ON public.campaign_leads;
DROP POLICY IF EXISTS "Anyone can update leads" ON public.campaign_leads;

-- Owner-scoped policies for authenticated users
CREATE POLICY "Owners can view their campaigns" ON public.bulk_campaigns
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners can create their campaigns" ON public.bulk_campaigns
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners can update their campaigns" ON public.bulk_campaigns
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners can delete their campaigns" ON public.bulk_campaigns
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Owners can view their leads" ON public.campaign_leads
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners can create their leads" ON public.campaign_leads
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners can update their leads" ON public.campaign_leads
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners can delete their leads" ON public.campaign_leads
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
