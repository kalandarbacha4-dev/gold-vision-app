
‏const SUPABASE_URL = "https://ajzadjmxtnvzdzlxwtyo.supabase.co/rest/v1/";

‏const SUPABASE_KEY = "sb_publishable_faLpmyuJDEydfsI2mwkETg_27i57I-7";

‏window.supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const supabaseClient = window.supabaseClient;
console.log("Gold Vision: Supabase client created:", !!supabaseClient);
