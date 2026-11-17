BEGIN;

ALTER TABLE public."Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Client" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."DiaryEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TransportRecord" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE
  public."Product",
  public."Client",
  public."DiaryEntry",
  public."TransportRecord"
FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE
  public."Product",
  public."Client",
  public."DiaryEntry",
  public."TransportRecord"
TO authenticated;

DROP POLICY IF EXISTS mobile_reader_select ON public."Product";
DROP POLICY IF EXISTS mobile_reader_select ON public."Client";
DROP POLICY IF EXISTS mobile_reader_select ON public."DiaryEntry";
DROP POLICY IF EXISTS mobile_reader_select ON public."TransportRecord";

CREATE POLICY mobile_reader_select ON public."Product"
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'mobile_reader');

CREATE POLICY mobile_reader_select ON public."Client"
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'mobile_reader');

CREATE POLICY mobile_reader_select ON public."DiaryEntry"
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'mobile_reader');

CREATE POLICY mobile_reader_select ON public."TransportRecord"
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'mobile_reader');

COMMIT;
