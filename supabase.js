const SUPABASE_URL = "https://ajzadjmxtnvzdzlxwtyo.supabase.co/rest/v1/";

const SUPABASE_KEY = "sb_publishable_faLpmyuJDEydfsI2mwkETg_27i57I-7";


if (!window.supabase) {

  throw new Error(
    "کتابخانه Supabase بارگذاری نشده است."
  );

}


window.supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


console.log(
  "Gold Vision Supabase:",
  !!window.supabaseClient
);
