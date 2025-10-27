-- Markets Management Schema
-- Stores POS (Point of Sale) market information for the Märkte management system

-- Create markets table
CREATE TABLE IF NOT EXISTS public.markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic market information
  name TEXT NOT NULL,
  address TEXT,
  plz TEXT,
  city TEXT,
  cluster TEXT, -- Region: wien-noe-bgl, steiermark, salzburg, oberoesterreich, tirol, vorarlberg, kaernten
  
  -- Stammmarkt relationship
  stamm_promotor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Market leader information
  marktleiter_name TEXT,
  marktleiter_phone TEXT,
  marktleiter_email TEXT,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  
  -- Notes
  internal_notes TEXT DEFAULT '',
  promotor_notes TEXT DEFAULT '',
  
  -- Photos stored as JSONB arrays: [{ url, comment, order }, ...]
  photos_internal JSONB DEFAULT '[]'::jsonb,
  photos_exterior JSONB DEFAULT '[]'::jsonb,
  photos_interior JSONB DEFAULT '[]'::jsonb,
  photos_products JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_markets_cluster ON public.markets(cluster);
CREATE INDEX IF NOT EXISTS idx_markets_plz ON public.markets(plz);
CREATE INDEX IF NOT EXISTS idx_markets_stamm_promotor ON public.markets(stamm_promotor_id);
CREATE INDEX IF NOT EXISTS idx_markets_status ON public.markets(status);
CREATE INDEX IF NOT EXISTS idx_markets_name ON public.markets(name);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_markets_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_markets_set_updated_at ON public.markets;
CREATE TRIGGER trg_markets_set_updated_at
  BEFORE UPDATE ON public.markets
  FOR EACH ROW EXECUTE FUNCTION public.set_markets_updated_at();

-- Enable RLS
ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can do everything
DROP POLICY IF EXISTS markets_admin_all ON public.markets;
CREATE POLICY markets_admin_all ON public.markets
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin_of_admins', 'admin_staff')
    )
  );

-- Promotors can read only
DROP POLICY IF EXISTS markets_promotor_read ON public.markets;
CREATE POLICY markets_promotor_read ON public.markets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid()
      AND role = 'promotor'
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.markets TO authenticated;

-- Create view for market visit statistics
-- This calculates visits by counting assignments at each market location
CREATE OR REPLACE VIEW public.market_visits AS
SELECT 
  m.id as market_id,
  m.name as market_name,
  COUNT(DISTINCT a.id) FILTER (WHERE a.start_ts < NOW()) as total_visits,
  MAX(a.start_ts) FILTER (WHERE a.start_ts < NOW()) as last_visit_date,
  MIN(a.start_ts) FILTER (WHERE a.start_ts >= NOW()) as next_visit_date
FROM public.markets m
LEFT JOIN public.assignments a ON (
  -- Match by location_text containing market name or address
  a.location_text ILIKE '%' || m.name || '%'
  OR a.location_text ILIKE '%' || m.address || '%'
  OR (a.postal_code = m.plz AND a.city = m.city)
)
WHERE a.status NOT IN ('cancelled')
  OR a.id IS NULL
GROUP BY m.id, m.name;

GRANT SELECT ON public.market_visits TO authenticated;

-- Insert sample data (MediaMarkt locations from current UI)
INSERT INTO public.markets (name, address, plz, city, cluster, marktleiter_name, marktleiter_phone, marktleiter_email, status, internal_notes, promotor_notes)
VALUES 
  ('MediaMarkt Wien Mitte', 'Landstraßer Hauptstraße 1b', '1030', 'Wien', 'wien-noe-bgl', 'Thomas Huber', '+43 660 1234567', 'thomas.huber@mediamarkt.at', 'active', '', 'Bitte Nespresso Bereich links neben Eingang beachten'),
  ('MediaMarkt Wien Mariahilf', 'Mariahilfer Straße 45', '1070', 'Wien', 'wien-noe-bgl', 'Sarah Schmidt', '+43 664 2345678', 's.schmidt@mediamarkt.at', 'active', '', ''),
  ('MediaMarkt Graz City', 'Hauptplatz 3', '8010', 'Graz', 'steiermark', 'Michael Wagner', '+43 676 3456789', 'm.wagner@mediamarkt.at', 'active', '', 'Marktleiter sehr kooperativ'),
  ('MediaMarkt Salzburg Zentrum', 'Rainerstraße 27', '5020', 'Salzburg', 'salzburg', 'Lisa Berger', '+43 650 4567890', 'l.berger@mediamarkt.at', 'active', '', ''),
  ('MediaMarkt Innsbruck', 'Museumstraße 12', '6020', 'Innsbruck', 'tirol', 'Andreas Moser', '+43 699 5678901', 'a.moser@mediamarkt.at', 'inactive', 'Temporär geschlossen wegen Umbau', ''),
  ('MediaMarkt St. Pölten', 'Wiener Straße 115', '3100', 'St. Pölten', 'wien-noe-bgl', 'Christina Maier', '+43 660 6789012', 'c.maier@mediamarkt.at', 'active', '', ''),
  ('MediaMarkt Linz Landstraße', 'Landstraße 42', '4020', 'Linz', 'oberoesterreich', 'Peter Gruber', '+43 664 7890123', 'p.gruber@mediamarkt.at', 'active', '', 'Parkplatz vor dem Markt verfügbar'),
  ('MediaMarkt Klagenfurt City', 'Kirchengasse 8', '9020', 'Klagenfurt', 'kaernten', 'Sandra Huber', '+43 676 8901234', 's.huber@mediamarkt.at', 'active', '', ''),
  ('MediaMarkt Bregenz', 'Bahnhofstraße 18', '6900', 'Bregenz', 'vorarlberg', 'Martin Fischer', '+43 650 9012345', 'm.fischer@mediamarkt.at', 'active', '', ''),
  ('MediaMarkt Wien Innenstadt', 'Graben 14', '1010', 'Wien', 'wien-noe-bgl', 'Julia Schneider', '+43 699 0123456', 'j.schneider@mediamarkt.at', 'active', '', 'Früh kommen, Markt öffnet 07:00 Uhr')
ON CONFLICT (id) DO NOTHING;

