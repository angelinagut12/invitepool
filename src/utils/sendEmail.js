const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function sendEmail({ to, subject, html }) {
  const response = await fetch(
    "https://vhvbxdcshjcrgldrcyai.supabase.co/functions/v1/send-email",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ to, subject, html }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("Function error:", error); //  IMPORTANT
    throw new Error(error);
  }

  return response.json();
}