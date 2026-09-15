import db from "../../utils/db.js";

// In-memory sliding window rate limiter
// Map of IP -> array of request timestamps
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 5; // max 5 submissions per 10 mins

function isRateLimited(ip) {
  if (!ip) return false;
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];

  // Filter out timestamps outside window
  const recent = timestamps.filter((time) => now - time < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    rateLimitMap.set(ip, recent);
    return true;
  }

  recent.push(now);
  rateLimitMap.set(ip, recent);

  // Periodic cleanup of stale IPs
  if (rateLimitMap.size > 1000) {
    for (const [key, times] of rateLimitMap.entries()) {
      if (times.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) {
        rateLimitMap.delete(key);
      }
    }
  }

  return false;
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "64kb",
    },
  },
};

export default async function handler(req, res) {
  // Set anti-caching & MIME sniffing headers for API responses
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("X-Content-Type-Options", "nosniff");

  // 1. Enforce POST only
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  // 2. Enforce Content-Type
  const contentType = req.headers["content-type"] || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return res.status(415).json({ error: "Unsupported Media Type. Expected application/json." });
  }

  // 3. Validate Origin / Referer (CSRF protection with exact hostname matching)
  const origin = req.headers["origin"] || req.headers["referer"] || "";
  if (origin) {
    let isAllowedOrigin = false;
    try {
      const parsedUrl = new URL(origin);
      const hostname = parsedUrl.hostname.toLowerCase();
      const allowedHostnames = [
        "christianmarques.com",
        "www.christianmarques.com",
        "localhost",
        "127.0.0.1",
      ];
      isAllowedOrigin =
        allowedHostnames.includes(hostname) ||
        hostname.endsWith(".christianmarques.com") ||
        (hostname.endsWith(".vercel.app") && hostname.includes("christianmarques"));
    } catch {
      isAllowedOrigin = false;
    }

    if (!isAllowedOrigin) {
      return res.status(403).json({ error: "Forbidden: request origin not recognized." });
    }
  }

  // 3. Rate limiting by client IP
  const clientIp =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "unknown";

  if (isRateLimited(clientIp)) {
    return res.status(429).json({
      error: "Too many messages sent. Please wait a few minutes before trying again.",
    });
  }

  try {
    const body = req.body || {};
    const { name, email, subject, message } = body;

    // 4. Honeypot spam trap: if hidden field is filled, silently succeed
    const hasHoneypot =
      Boolean(body._gotcha) ||
      Boolean(body.gotcha) ||
      Object.keys(body).some((key) => {
        const normalized = key.trim().toLowerCase();
        return (
          (normalized === "_gotcha" || normalized === "gotcha" || normalized.includes("honeypot")) &&
          Boolean(body[key])
        );
      });

    if (hasHoneypot) {
      return res.status(200).json({ success: true });
    }

    // 5. Strict Input Validation & Header Injection Prevention
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Please provide your name." });
    }
    // Strip newlines and ASCII control characters to prevent header injection
    const cleanName = name.replace(/[\r\n\x00-\x1F\x7F]/g, " ").trim().slice(0, 100);
    if (cleanName.length < 2) {
      return res.status(400).json({ error: "Name must be at least 2 characters long." });
    }

    // Strict RFC 5322-compliant email regex with at least 2-character alphabetic TLD
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Please provide your email address." });
    }
    const cleanEmail = email.replace(/[\r\n\x00-\x1F\x7F\s]/g, "").trim().slice(0, 120);
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: "Please provide a valid email address (e.g. name@domain.com)." });
    }

    if (!subject || typeof subject !== "string" || !subject.trim()) {
      return res.status(400).json({ error: "Please provide a subject." });
    }
    const cleanSubject = subject.replace(/[\r\n\x00-\x1F\x7F]/g, " ").trim().slice(0, 150);
    if (cleanSubject.length < 2) {
      return res.status(400).json({ error: "Subject must be at least 2 characters long." });
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Please provide a message." });
    }
    const cleanMessage = message.trim().slice(0, 4000);
    if (cleanMessage.length < 10) {
      return res.status(400).json({ error: "Message must be at least 10 characters long." });
    }

    // 6. Dispatch email via Resend
    let resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      try {
        const fs = require("fs");
        const path = require("path");
        const envPath = path.resolve(process.cwd(), ".env");
        if (fs.existsSync(envPath)) {
          const envContent = fs.readFileSync(envPath, "utf8");
          const match = envContent.match(/^RESEND_API_KEY=(.+)$/m);
          if (match) {
            resendApiKey = match[1].trim().replace(/^["']|["']$/g, "");
            process.env.RESEND_API_KEY = resendApiKey;
          }
        }
      } catch (e) {
        console.warn("Unable to read .env file for RESEND_API_KEY:", e.message);
      }
    }

    const recipientEmail = process.env.CONTACT_TO_EMAIL || "christian.marques@gmail.com";
    const fromEmail = process.env.CONTACT_FROM_EMAIL || "Portfolio Contact <onboarding@resend.dev>";

    const messageData = {
      name: cleanName,
      email: cleanEmail,
      subject: cleanSubject,
      message: cleanMessage,
      createdAt: new Date().toISOString(),
      timestamp: Date.now(),
      ip: clientIp,
    };

    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not defined.");
      // Still persist to Firestore so contact is not lost
      try {
        await db.collection("messages").add({
          ...messageData,
          deliveryError: "RESEND_API_KEY missing",
        });
      } catch (dbErr) {
        console.warn("Firestore save warning:", dbErr.message);
      }
      return res.status(500).json({
        error: "Email service is temporarily unavailable. Please try again later.",
      });
    }

    const emailPayload = {
      from: fromEmail,
      to: [recipientEmail],
      reply_to: cleanEmail,
      subject: `[Portfolio] ${cleanSubject} — ${cleanName}`,
      text: `You received a new message from your portfolio contact form:\n\nFrom: ${cleanName} (${cleanEmail})\nSubject: ${cleanSubject}\n\nMessage:\n${cleanMessage}\n\nSent: ${new Date().toLocaleString()}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #eaeaea; border-radius: 8px;">
          <h2 style="margin-top: 0; color: #111; font-size: 20px; border-bottom: 1px solid #eaeaea; padding-bottom: 12px;">
            New Portfolio Contact Submission
          </h2>
          <div style="margin: 16px 0; font-size: 15px; color: #333; line-height: 1.6;">
            <p><strong>Name:</strong> ${escapeHtml(cleanName)}</p>
            <p><strong>Email:</strong> <a href="mailto:${escapeHtml(cleanEmail)}" style="color: #0066cc;">${escapeHtml(cleanEmail)}</a></p>
            <p><strong>Subject:</strong> ${escapeHtml(cleanSubject)}</p>
          </div>
          <div style="margin-top: 24px; padding: 16px; background-color: #f9f9f9; border-radius: 6px; border-left: 3px solid #111;">
            <p style="margin: 0; font-size: 15px; color: #222; white-space: pre-wrap; line-height: 1.6;">${escapeHtml(cleanMessage)}</p>
          </div>
          <div style="margin-top: 24px; font-size: 12px; color: #888; border-top: 1px solid #eaeaea; padding-top: 12px;">
            Sent via christianmarques.com contact form at ${new Date().toUTCString()}
          </div>
        </div>
      `,
    };

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    if (!resendRes.ok) {
      const errorData = await resendRes.json().catch(() => ({}));
      console.error("Resend API error:", errorData);
      messageData.deliveryError = errorData;

      // Still record in Firestore
      try {
        await db.collection("messages").add(messageData);
      } catch (dbErr) {
        console.warn("Firestore save warning:", dbErr.message);
      }

      return res.status(502).json({
        error: errorData.message || "Failed to dispatch email. Please try again.",
      });
    }

    const resendData = await resendRes.json().catch(() => ({}));
    messageData.resendId = resendData.id;

    // 7. Store backup in Firestore
    try {
      await db.collection("messages").add(messageData);
    } catch (dbErr) {
      console.warn("Firestore save warning:", dbErr.message);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error submitting contact message:", error);
    return res.status(500).json({
      error: "Unable to deliver your message at this time. Please try again later.",
    });
  }
}
