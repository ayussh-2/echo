import http from "node:http";
import crypto from "node:crypto";
import { shell } from "electron";

export interface GoogleAuthResult {
  idToken: string;
  accessToken?: string;
  refreshToken?: string;
  email?: string;
  name?: string;
  picture?: string;
}

function base64UrlEncode(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function generatePkcePair(): { verifier: string; challenge: string } {
  const verifier = base64UrlEncode(crypto.randomBytes(32));
  const challenge = base64UrlEncode(
    crypto.createHash("sha256").update(verifier).digest()
  );
  return { verifier, challenge };
}

/**
 * Initiates the Google OAuth 2.0 PKCE flow via local loopback HTTP server.
 * Uses default system browser for secure authentication without embedded webviews.
 */
export function performGoogleOAuthFlow(
  clientId: string,
  clientSecret?: string
): Promise<GoogleAuthResult> {
  return new Promise((resolve, reject) => {
    const { verifier, challenge } = generatePkcePair();
    // Use plain hex string for state to prevent any URL encoding/decoding mismatches
    const state = crypto.randomBytes(16).toString("hex");

    let server: http.Server | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    let isHandled = false;

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (server) {
        server.close();
        server = null;
      }
    };

    // Auto-timeout after 3 minutes if user abandons browser flow
    timeoutId = setTimeout(() => {
      if (!isHandled) {
        isHandled = true;
        cleanup();
        reject(new Error("OAuth sign-in timed out. Please try again."));
      }
    }, 180000);

    server = http.createServer(async (req, res) => {
      try {
        if (!req.url) {
          res.writeHead(400);
          res.end("Bad Request");
          return;
        }

        const reqUrl = new URL(req.url, `http://${req.headers.host}`);

        // Ignore browser auxiliary requests like favicon
        if (reqUrl.pathname === "/favicon.ico") {
          res.writeHead(204);
          res.end();
          return;
        }

        const code = reqUrl.searchParams.get("code");
        const returnedState = reqUrl.searchParams.get("state");
        const error = reqUrl.searchParams.get("error");

        // If request is not an OAuth callback (no code and no error), ignore it
        if (!code && !error) {
          res.writeHead(200, { "Content-Type": "text/plain" });
          res.end("Echo loopback listener waiting for OAuth callback.");
          return;
        }

        if (isHandled) {
          res.writeHead(200, { "Content-Type": "text/plain" });
          res.end("Already processed.");
          return;
        }

        if (error) {
          isHandled = true;
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Echo — Sign-in Cancelled</title>
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                  .card { background: #1e293b; padding: 2.5rem; border-radius: 1rem; text-align: center; max-width: 420px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
                  h1 { font-size: 1.25rem; margin-bottom: 0.5rem; color: #f87171; }
                  p { color: #94a3b8; font-size: 0.9rem; line-height: 1.5; }
                </style>
              </head>
              <body>
                <div class="card">
                  <h1>Sign-in was not completed</h1>
                  <p>Google returned: ${error}. You may close this tab and return to the Echo app.</p>
                </div>
              </body>
            </html>
          `);
          cleanup();
          reject(new Error(`OAuth error: ${error}`));
          return;
        }

        // Validate state
        if (returnedState !== state) {
          isHandled = true;
          res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
          res.end("Invalid OAuth response state.");
          cleanup();
          reject(new Error("Invalid OAuth callback state"));
          return;
        }

        isHandled = true;

        // Return pleasant success page in browser
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Echo — Connected</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0f14; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 2.5rem; border-radius: 1.25rem; text-align: center; max-width: 400px; backdrop-filter: blur(16px); }
                .badge { width: 48px; height: 48px; border-radius: 50%; background: #10b981; color: white; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 1rem; }
                h1 { font-size: 1.35rem; margin: 0 0 0.5rem 0; font-weight: 700; }
                p { color: #94a3b8; font-size: 0.9rem; line-height: 1.5; margin: 0; }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="badge">✓</div>
                <h1>Signed in to Echo</h1>
                <p>Authentication complete. You can close this browser tab and return to the Echo app.</p>
              </div>
            </body>
          </html>
        `);

        const port = (server?.address() as { port: number })?.port;
        const redirectUri = `http://127.0.0.1:${port}`;

        // Exchange authorization code for tokens
        const tokenParams = new URLSearchParams({
          code: code || "",
          client_id: clientId,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
          code_verifier: verifier,
        });

        if (clientSecret) {
          tokenParams.append("client_secret", clientSecret);
        }

        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: tokenParams.toString(),
        });

        if (!tokenResponse.ok) {
          const errBody = await tokenResponse.text();
          cleanup();
          reject(new Error(`Failed to exchange token: ${tokenResponse.status} ${errBody}`));
          return;
        }

        const tokenData = (await tokenResponse.json()) as {
          id_token: string;
          access_token?: string;
          refresh_token?: string;
        };

        // Parse basic user info from ID Token payload if available
        let email: string | undefined;
        let name: string | undefined;
        let picture: string | undefined;

        try {
          const parts = tokenData.id_token.split(".");
          if (parts[1]) {
            const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
            email = payload.email;
            name = payload.name;
            picture = payload.picture;
          }
        } catch {
          // Token decode fallback
        }

        cleanup();
        resolve({
          idToken: tokenData.id_token,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          email,
          name,
          picture,
        });
      } catch (err) {
        cleanup();
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    });

    server.listen(0, "127.0.0.1", () => {
      const address = server?.address();
      if (!address || typeof address === "string") {
        cleanup();
        reject(new Error("Failed to obtain local loopback port"));
        return;
      }

      const port = address.port;
      const redirectUri = `http://127.0.0.1:${port}`;
      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.searchParams.set("client_id", clientId);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", "openid email profile");
      authUrl.searchParams.set("code_challenge", challenge);
      authUrl.searchParams.set("code_challenge_method", "S256");
      shell.openExternal(authUrl.toString());
    });

    server.on("error", (err) => {
      cleanup();
      reject(err);
    });
  });
}

/**
 * Refreshes an expired Google ID Token using the stored refresh_token.
 */
export async function refreshGoogleIdToken(
  clientId: string,
  refreshToken: string,
  clientSecret?: string
): Promise<{ idToken: string; accessToken?: string }> {
  const tokenParams = new URLSearchParams({
    client_id: clientId,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  if (clientSecret) {
    tokenParams.append("client_secret", clientSecret);
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenParams.toString(),
  });

  if (!tokenResponse.ok) {
    const errBody = await tokenResponse.text();
    throw new Error(`Failed to refresh Google token: ${tokenResponse.status} ${errBody}`);
  }

  const tokenData = (await tokenResponse.json()) as {
    id_token?: string;
    access_token?: string;
  };

  if (!tokenData.id_token) {
    throw new Error("No id_token returned during refresh");
  }

  return {
    idToken: tokenData.id_token,
    accessToken: tokenData.access_token,
  };
}
