-- Add RLS policy to allow anonymous users to read academic_years
-- This is reference data needed for dropdowns in the UI
CREATE POLICY academic_years_select_anon
ON public.academic_years
FOR SELECT
TO anon
USING (true);;
