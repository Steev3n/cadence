import { supabase } from "./supabase";

// makes API calls with the access token
export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const { data, error } = await supabase.auth.getSession();

  if (error) throw error;
  if (!data.session) throw new Error("Please log in.");

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${data.session.access_token}`);

  return fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });
}