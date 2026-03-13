import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    "[Supabase] SUPABASE_URL or SUPABASE_SERVICE_KEY not set. Config persistence will be disabled."
  );
}

export const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;
