const E2E_TEST_MODE_ENV = "TIRES_SOS_E2E_TEST_MODE";

// Server-only guard for end-to-end workflow tests. Keep the lookup dynamic so
// the flag is evaluated when the server starts instead of being baked into a
// production build.
export function isE2ETestMode() {
  return String(process.env[E2E_TEST_MODE_ENV] || "").trim() === "1";
}
