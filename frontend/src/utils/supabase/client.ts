import { createBrowserClient } from "@supabase/ssr";

// Public Supabase project credentials for TruthLens Evidence Vault
const DEFAULT_SUPABASE_URL = "https://fxzylehiojnchtrwcvpu.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_0rlU7nt5tdjVijMFOwk5Qg_nmt-Iyq_";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  (typeof process !== "undefined" ? process.env?.NEXT_PUBLIC_SUPABASE_URL : "") ||
  DEFAULT_SUPABASE_URL;

const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  (typeof process !== "undefined" ? process.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY : "") ||
  DEFAULT_SUPABASE_ANON_KEY;

export const createClient = () => {
  try {
    if (!supabaseUrl || !supabaseKey) {
      console.warn("[Supabase] Missing credentials, using fallback proxy.");
      return null;
    }
    return createBrowserClient(supabaseUrl, supabaseKey);
  } catch (err) {
    console.warn("[Supabase] Browser client initialization fallback:", err);
    return null;
  }
};

const rawClient = createClient();

// Safe chainable fallback builder to prevent uncaught runtime exceptions
const safeQueryBuilder: any = {
  select: () => safeQueryBuilder,
  insert: () => safeQueryBuilder,
  update: () => safeQueryBuilder,
  delete: () => safeQueryBuilder,
  eq: () => safeQueryBuilder,
  order: () => safeQueryBuilder,
  limit: () => safeQueryBuilder,
  single: () => Promise.resolve({ data: null, error: null }),
  then: (resolve: (val: any) => any) => Promise.resolve(resolve({ data: [], error: null })),
  catch: () => Promise.resolve({ data: [], error: null }),
};

export const supabase = rawClient || (new Proxy({}, {
  get: (_target, prop) => {
    if (prop === 'from') {
      return () => safeQueryBuilder;
    }
    if (prop === 'auth') {
      return {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      };
    }
    return () => safeQueryBuilder;
  }
}) as any);
