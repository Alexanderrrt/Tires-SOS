# Confirmed website lead conversion

Deployed September 6, 2026 to https://tiressosrescue.com.

- Google Ads action: `Website Lead Submitted | Confirmed` (primary, submit lead form category, one conversion per click, 30-day click window, zero monetary value).
- Destination: `AW-18328053401/FBlCCNbM0-8cEJnNv6NE`.
- Existing `/quote` page-view conversion remains secondary.
- The server returns a lead conversion ID only after durable persistence and presence of name, phone, vehicle, and service. The browser does not infer success from page views, button clicks, or AI text.
- Repeated chat responses use the same transaction ID. Browser storage and in-memory checks suppress duplicate sends; Google's transaction ID provides another deduplication layer.
- Only the production apex/www hosts load the tag. Local and Vercel preview traffic cannot emit conversions through this integration.
- No customer name, phone, vehicle, service, or transcript is sent in the conversion payload. Ad personalization signals are disabled in the tag configuration.

Validation: four tracking tests passed; targeted lint had no errors (one existing ChatBot image warning); Vercel production build passed; authenticated deployment smoke check and live quote-page smoke check passed. The exact Google tag script was present in the live browser DOM, with no browser warning/error logs during initialization. A real submitted lead attributed to an ad click has not yet been observed in Ads reporting.

Run tests: `node --experimental-default-type=module --test tests/google-lead-tracking.test.js`.

Production deployment: `dpl_A9PWfcpVQpAFrAifd6pkAXov9nZ6`.
Previous production deployment: `dpl_35i31vKj5nwwY6kA8tnh82mJEtVy`.
Release was built from HEAD plus the tracking files only; unrelated working-tree edits were excluded.
