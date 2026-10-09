import postgres from "postgres";

/** One pooled client per function instance. Supabase's transaction pooler needs prepare: false. */
export const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
