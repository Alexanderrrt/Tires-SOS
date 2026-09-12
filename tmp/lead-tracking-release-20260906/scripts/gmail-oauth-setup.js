#!/usr/bin/env node
// One-time helper to obtain a Gmail API refresh token for the inbox that
// receives Yelp "Request a Quote" lead emails.
//
// Prerequisites (Google Cloud Console, one time):
//   1. Create a project, enable the "Gmail API".
//   2. Create an OAuth 2.0 Client ID of type "Desktop app".
//   3. Add yourself as a test user on the OAuth consent screen (or publish it).
//
// Usage:
//   GMAIL_CLIENT_ID=... GMAIL_CLIENT_SECRET=... node scripts/gmail-oauth-setup.js
//
// This starts a local server, opens the Google consent screen in your
// browser, and prints a GMAIL_REFRESH_TOKEN to paste into your env vars.
// Sign in with the Gmail account that actually receives the Yelp lead emails.

import http from "node:http";
import { URL } from "node:url";
import readline from "node:readline";
import { exec } from "node:child_process";

const PORT = 53682;
const REDIRECT_URI = `http://127.0.0.1:${PORT}/oauth2callback`;
const SCOPE = "https://www.googleapis.com/auth/gmail.modify";

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => {
    rl.close();
    resolve(answer.trim());
  }));
}

function openBrowser(url) {
  const command = process.platform === "win32" ? `start "" "${url}"`
    : process.platform === "darwin" ? `open "${url}"`
    : `xdg-open "${url}"`;
  exec(command, () => {});
}

async function main() {
  const clientId = process.env.GMAIL_CLIENT_ID || (await prompt("Google OAuth Client ID: "));
  const clientSecret = process.env.GMAIL_CLIENT_SECRET || (await prompt("Google OAuth Client Secret: "));
  if (!clientId || !clientSecret) {
    console.error("Client ID and Client Secret are required.");
    process.exit(1);
  }

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", SCOPE);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");

  console.log("\nOpen this URL and sign in with the Gmail inbox that receives Yelp leads:\n");
  console.log(authUrl.toString());
  console.log("\nWaiting for the redirect back to this script...\n");
  openBrowser(authUrl.toString());

  const code = await new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, REDIRECT_URI);
      if (url.pathname !== "/oauth2callback") {
        res.writeHead(404).end();
        return;
      }
      const returnedCode = url.searchParams.get("code");
      const error = url.searchParams.get("error");
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(error
        ? "<h1>Authorization failed.</h1><p>You can close this tab.</p>"
        : "<h1>Authorization complete.</h1><p>You can close this tab and return to the terminal.</p>");
      server.close();
      if (error) reject(new Error(error));
      else resolve(returnedCode);
    });
    server.listen(PORT);
  });

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI,
    }).toString(),
  });
  const tokenBody = await tokenResponse.json();
  if (!tokenResponse.ok || !tokenBody.refresh_token) {
    console.error("Token exchange failed:", tokenBody);
    process.exit(1);
  }

  console.log("\nSuccess! Add these to your env vars (Vercel + .env.local):\n");
  console.log(`GMAIL_CLIENT_ID=${clientId}`);
  console.log(`GMAIL_CLIENT_SECRET=${clientSecret}`);
  console.log(`GMAIL_REFRESH_TOKEN=${tokenBody.refresh_token}`);
}

main().catch((error) => {
  console.error("Gmail OAuth setup failed:", error);
  process.exit(1);
});
