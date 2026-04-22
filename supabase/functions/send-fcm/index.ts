// Fluvia — Push Notification Edge Function
// Sends FCM push notifications when alerts/events occur
// Deploy: supabase functions deploy send-fcm --project-ref nfybnnpdrvyxucgpqmmo

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const FIREBASE_PROJECT_ID = "riverhub-elite";

serve(async (req) => {
  try {
    const { type, title, body, user_id, data } = await req.json();

    // Get FCM token from user_profiles
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    let tokens: string[] = [];

    if (user_id) {
      // Send to specific user
      const res = await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${user_id}&select=fcm_token`, {
        headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` },
      });
      const profiles = await res.json();
      tokens = profiles.filter((p: any) => p.fcm_token).map((p: any) => p.fcm_token);
    } else {
      // Broadcast to all users with tokens
      const res = await fetch(`${supabaseUrl}/rest/v1/user_profiles?fcm_token=not.is.null&select=fcm_token`, {
        headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` },
      });
      const profiles = await res.json();
      tokens = profiles.filter((p: any) => p.fcm_token).map((p: any) => p.fcm_token);
    }

    if (tokens.length === 0) {
      return new Response(JSON.stringify({ success: false, error: "No FCM tokens found" }), {
        headers: { "Content-Type": "application/json" }, status: 200,
      });
    }

    // Get Firebase access token using service account
    const serviceAccountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
    if (!serviceAccountJson) {
      return new Response(JSON.stringify({ success: false, error: "FIREBASE_SERVICE_ACCOUNT not set" }), {
        headers: { "Content-Type": "application/json" }, status: 200,
      });
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    const accessToken = await getFirebaseAccessToken(serviceAccount);

    // Send in chunks of 200 to avoid FCM rate limits
    const CHUNK_SIZE = 200;
    let sent = 0;
    let failed = 0;
    const invalidTokens: string[] = [];

    for (let i = 0; i < tokens.length; i += CHUNK_SIZE) {
      const chunk = tokens.slice(i, i + CHUNK_SIZE);
      const results = await Promise.allSettled(
        chunk.map(async (token) => {
          const res = await fetch(`https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: {
                token,
                notification: {
                  title: title || "Fluvia",
                  body: body || "Nueva notificación",
                },
                data: data || {},
                android: {
                  priority: "high",
                  notification: {
                    channel_id: "fluvia_channel",
                    icon: "@mipmap/ic_launcher",
                  },
                },
              },
            }),
          });
          if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            if (errBody?.error?.status === "UNREGISTERED" || errBody?.error?.code === 404) {
              invalidTokens.push(token);
            }
            throw new Error(`FCM ${res.status}`);
          }
          return res;
        })
      );
      sent += results.filter((r) => r.status === "fulfilled").length;
      failed += results.filter((r) => r.status === "rejected").length;
    }

    // Clean up invalid/unregistered tokens from DB
    if (invalidTokens.length > 0) {
      for (const deadToken of invalidTokens) {
        await fetch(`${supabaseUrl}/rest/v1/user_profiles?fcm_token=eq.${encodeURIComponent(deadToken)}`, {
          method: "PATCH",
          headers: {
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
          },
          body: JSON.stringify({ fcm_token: null }),
        });
      }
    }

    return new Response(JSON.stringify({ success: true, sent, failed, cleaned: invalidTokens.length, total: tokens.length }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { "Content-Type": "application/json" }, status: 500,
    });
  }
});

// Generate Firebase access token from service account
async function getFirebaseAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = btoa(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));

  const signInput = `${header}.${payload}`;

  // Import the private key
  const pemKey = serviceAccount.private_key;
  const pemContents = pemKey.replace(/-----BEGIN PRIVATE KEY-----/, "").replace(/-----END PRIVATE KEY-----/, "").replace(/\n/g, "");
  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8", binaryKey, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]
  );

  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, new TextEncoder().encode(signInput));
  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const jwt = `${header}.${payload}.${sig}`;

  // Exchange JWT for access token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}
