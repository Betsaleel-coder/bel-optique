import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req) => {
    try {
        const payload = await req.json();
        const { record } = payload;

        if (!RESEND_API_KEY) {
            return new Response(JSON.stringify({ error: "RESEND_API_KEY missing in Supabase Secrets" }), { status: 500 });
        }

        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: "Bel'Optique <onboarding@resend.dev>",
                to: ["mailbusinessagencylearn@gmail.com"],
                subject: "Nouveau Rendez-vous : " + record.name,
                html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 15px;">
            <h1 style="color: #000; font-family: serif;">Nouveau rendez-vous !</h1>
            <p>Un nouveau rendez-vous vient d'être enregistré sur Bel'Optique.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;"/>
            <table style="width: 100%;">
              <tr><td><strong>Client :</strong></td><td>${record.name}</td></tr>
              <tr><td><strong>Ville :</strong></td><td>${record.city}</td></tr>
              <tr><td><strong>Pays :</strong></td><td>${record.country}</td></tr>
              <tr><td><strong>Service :</strong></td><td>${record.service}</td></tr>
              <tr><td><strong>Date :</strong></td><td>${record.date} à ${record.time}</td></tr>
              <tr><td><strong>Téléphone :</strong></td><td>${record.phone}</td></tr>
              <tr><td><strong>Email :</strong></td><td>${record.email}</td></tr>
              <tr><td><strong>Notes :</strong></td><td>${record.notes || 'N/A'}</td></tr>
            </table>
            <br/>
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://egmvcjbnfghrprigoufb.supabase.co/admin" style="background: #000; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 10px; font-weight: bold;">Accéder au Dashboard Admin</a>
            </div>
          </div>
        `,
            }),
        });

        const data = await res.json();
        return new Response(JSON.stringify(data), { status: res.status });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});
