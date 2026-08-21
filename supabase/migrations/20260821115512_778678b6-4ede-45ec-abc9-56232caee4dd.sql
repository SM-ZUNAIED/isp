DO $$
DECLARE
  table_record record;
  sequence_record record;
BEGIN
  FOR table_record IN
    SELECT schemaname, tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE %I.%I TO authenticated', table_record.schemaname, table_record.tablename);
    EXECUTE format('GRANT ALL ON TABLE %I.%I TO service_role', table_record.schemaname, table_record.tablename);
  END LOOP;

  FOR sequence_record IN
    SELECT sequence_schema, sequence_name
    FROM information_schema.sequences
    WHERE sequence_schema = 'public'
  LOOP
    EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE %I.%I TO authenticated', sequence_record.sequence_schema, sequence_record.sequence_name);
    EXECUTE format('GRANT ALL ON SEQUENCE %I.%I TO service_role', sequence_record.sequence_schema, sequence_record.sequence_name);
  END LOOP;
END
$$;

REVOKE ALL ON FUNCTION public.admin_verify_payment(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_verify_payment(uuid, boolean) TO authenticated, service_role;