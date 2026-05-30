const { data: reportsData } = await supabase
  .from("reports")
  .select("id, created_at, report_type")
  .order("created_at", { ascending: false })
  .limit(20);