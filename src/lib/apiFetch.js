import { supabase } from '@/lib/supabase';

// POSTs JSON to our API with the signed-in user's token. Throws Error(message) with the server's message on failure.
export async function apiPost(path, body) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  let data = {};
  try {
    data = await res.json();
  } catch {
    // non-JSON error body
  }

  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.code = data.code;
    err.status = res.status;
    throw err;
  }
  return data;
}
