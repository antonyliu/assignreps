// Low-level Twilio send, extracted so the invite path and the assign-notify path
// share one implementation instead of duplicating the REST call.
//
// Uses MessagingServiceSid (not From) — required by the Twilio setup.
//
// Never throws: SMS is best-effort everywhere in this app, so callers get a
// boolean instead of an exception. Nothing sensitive is logged — no recipient
// number, no message body (only a status code).
export async function sendSms(to: string, body: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

  if (!accountSid || !authToken || !messagingServiceSid) {
    // Twilio not configured (local dev). Don't log the phone or message body.
    console.warn("Twilio not configured — SMS skipped");
    return false;
  }

  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  try {
    const res = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        MessagingServiceSid: messagingServiceSid,
        To: to,
        Body: body,
      }),
    });

    if (!res.ok) {
      console.error("SMS failed to send", { status: res.status });
      return false;
    }

    return true;
  } catch {
    // Network/transport failure — stay quiet, same as a non-OK response.
    console.error("SMS request failed to complete");
    return false;
  }
}
