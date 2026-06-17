# Shipgen mail system — integration guide for static demo website contact forms

This document explains how mail works in the Fleetbase/Shipgen application and gives everything you need to wire a **static marketing site contact form** to the **same branded email theme**, sent from the **`sales@shipgen.net` mailbox**.

---

## 1. Architecture overview

```
┌─────────────────────┐     HTTPS POST      ┌──────────────────────────────┐
│  Static demo site   │ ──────────────────► │  Shipgen API (recommended)   │
│  contact form       │   /v1/contact       │  ContactController           │
└─────────────────────┘                     └──────────────┬───────────────┘
                                                           │
                         ┌─────────────────────────────────┼─────────────────────────┐
                         ▼                                 ▼                         ▼
              EmailTemplateRenderer              MailboxPolicy (sales@)        Laravel Mail (SMTP)
                         │                                 │                         │
                         ▼                                 │                         ▼
              Velocity .vm templates                      │              mail.shipgen.net:465 SSL
              + layouts/shipgen.vm                        │              (cPanel SMTP)
                         │                                 │
                         └────────► HTML email ◄────────────┘
                                    (Shipgen brand)
```

**Do not send mail directly from the browser.** Browsers cannot use SMTP safely (credentials would be exposed). The static site must POST to a **server endpoint** that sends mail.

**Recommended:** add a small **public API route** on the existing Shipgen API (this repo).  
**Alternative:** a separate Node/PHP serverless function using the same SMTP + copied HTML templates (more duplication; only use if the static site cannot call the API).

---

## 2. Mail transport (SMTP)

All application mail is sent through **Laravel Mail** using **SMTP**.

### Production / on-prem settings (`api/.env`)

| Variable | Purpose | Example |
|----------|---------|---------|
| `MAIL_MAILER` | Driver | `smtp` |
| `MAIL_HOST` | cPanel mail server | `mail.shipgen.net` |
| `MAIL_PORT` | SSL port | `465` |
| `MAIL_ENCRYPTION` | TLS mode | `ssl` |
| `MAIL_USERNAME` | SMTP login (authenticated mailbox) | `noreply@shipgen.net` |
| `MAIL_PASSWORD` | SMTP password | *(cPanel mailbox password)* |
| `MAIL_FROM_ADDRESS` | Default fallback From | `noreply@shipgen.net` |
| `MAIL_FROM_NAME` | Default display name | `Shipgen` |

### Mailbox addresses (From / Reply-To routing)

These are **logical mailboxes**. They control which address appears in the **From** and **Reply-To** headers. SMTP authentication still uses `MAIL_USERNAME`.

| Env variable | Address | Use case |
|--------------|---------|----------|
| `MAIL_SALES_ADDRESS` | `sales@shipgen.net` | **Invites, leads, contact forms, sponsorships** |
| `MAIL_SUPPORT_ADDRESS` | `support@shipgen.net` | Customer support |
| `MAIL_NOREPLY_ADDRESS` | `noreply@shipgen.net` | Auth codes, password reset, system alerts |
| `MAIL_BILLING_ADDRESS` | `billing@shipgen.net` | Invoices, billing |
| `MAIL_DEFAULT_MAILBOX` | fallback key | `support` or `noreply` |

Config source: `packages/core-api/config/fleetbase.php` → `mailboxes` section.

---

## 3. Mailbox routing (`MailboxPolicy`)

File: `packages/core-api/src/Mail/Support/MailboxPolicy.php`

Routing rules:

1. **Exact template key** → mailbox (e.g. `auth.user-invited` → `sales`)
2. **Prefix** → mailbox (e.g. `ledger.*` → `billing`, `auth.*` → `noreply`)
3. **Default** → `MAIL_DEFAULT_MAILBOX` (usually `support`)

**Reply-To behaviour**

- `sales`, `support`, `billing` → **Reply-To enabled** (recipient can reply)
- `noreply` + templates in `no_reply_exact` list → **no Reply-To**

### For static site contact forms

Register templates under the **`sales.`** prefix so they automatically use `sales@shipgen.net`:

```php
// packages/core-api/config/fleetbase.php — inside mailboxes.mapping.prefix
'sales.' => 'sales',
```

Then use template keys like:

- `sales.contact-form-confirmation` — auto-reply to the person who submitted the form
- `sales.contact-form-lead` — internal notification to the sales team

---

## 4. Template system

### 4.1 Stack

| Layer | Technology | Location |
|-------|------------|----------|
| Template engine | **Velocity** (`.vm` files) | `packages/core-api/email-templates/` |
| Layout wrapper | `layouts/shipgen.vm` | Branded header, footer, logo |
| Renderer | `EmailTemplateRenderer` | `packages/core-api/src/Mail/EmailTemplateRenderer.php` |
| Registry | `EmailTemplateRegistry` | Maps template keys → `.vm` paths |
| Laravel output | `views/mail/velocity.blade.php` | Outputs raw HTML (`{!! $html !!}`) |

### 4.2 Template key convention

```
{namespace}.{name}.{part}
```

- **namespace** — product area (`auth`, `sales`, `ledger`, …)
- **name** — email purpose (`contact-form-confirmation`, `user-invited`, …)
- **part** — `subject` or `body` (separate `.vm` files)

Registered keys live in `EmailTemplateRegistry::bootDefaults()` or extension registries.

### 4.3 Global variables (injected automatically)

`EmailTemplateRenderer::withGlobals()` adds these to every template:

| Variable | Value |
|----------|-------|
| `appName` | `config('app.name')` |
| `brandName` | `Shipgen` |
| `year` | Current year |
| `logoUrl` | HTTPS logo URL (`CredentialEmailBranding::emailLogoUrl()`) |
| `consoleUrl` | Main app URL |
| `headerTagline` | Default: `Command Center` (override per email) |
| `emailTitle` | Default: `Shipgen` |
| `footerNote` | Optional legal / disclaimer text |

### 4.4 Brand design tokens (match static site + console)

Use these in custom HTML inside body templates:

| Token | Value | Usage |
|-------|-------|-------|
| Primary blue | `#0066FF` | Links, accents, CTA buttons |
| Purple accent | `#7C3AED` | Gradients, labels |
| Text primary | `#0A0E1A` | Headings |
| Text secondary | `#4B5563` | Body copy |
| Background | `#F5F6F8` | Outer email background |
| Card white | `#FFFFFF` | Content area |
| Footer dark | `#0A0E1A` | Footer bar |
| Font stack | `Arial, Helvetica, sans-serif` | Body |
| Mono labels | `Consolas, Monaco, monospace` | Small uppercase labels |
| Logo | `/images/logo_logistic.png` on API host | Header image |

Production logo URL must be **absolute HTTPS**, e.g.:

```
BRANDING_LOGO_URL=https://your-api-domain.com/images/logo_logistic.png
```

### 4.5 Layout structure (`layouts/shipgen.vm`)

```
┌─────────────────────────────────────┐
│  Gradient header (#0066FF → purple) │
│  Logo + headerTagline               │
├─────────────────────────────────────┤
│  $bodyContent  (your .vm body HTML) │
├─────────────────────────────────────┤
│  Dark footer — © year brandName     │
│  optional $footerNote               │
└─────────────────────────────────────┘
```

**Important:** Body templates output **HTML fragments** only. The layout wraps them. Pre-rendered body HTML is injected via `str_replace('$bodyContent', $body, …)` so tags are **not escaped**.

### 4.6 Reusable partials

| Partial | Path | Purpose |
|---------|------|---------|
| CTA button | `partials/cta.vm` | Needs `$actionUrl` + `$actionLabel` |
| Heading | `partials/heading.vm` | Uses `$headline` or `$title` |
| Muted note | `partials/muted-note.vm` | Small grey disclaimer |
| Verification code | `partials/verification-code.vm` | OTP / code display |

Example CTA usage inside a body template:

```velocity
#set($actionUrl = $consoleUrl)
#set($actionLabel = "Explore Shipgen")
#parse('partials/cta')
```

### 4.7 Reference: existing sales-routed template

`auth.user-invited` is routed to **sales** via exact mapping (invite emails).

- Subject: `packages/core-api/email-templates/auth/user-invited.subject.vm`
- Body: `packages/core-api/email-templates/auth/user-invited.body.vm`
- PHP: `packages/core-api/src/Notifications/UserInvited.php`

---

## 5. New templates for static contact form

Create four files under `packages/core-api/email-templates/sales/`:

### 5.1 `contact-form-confirmation.subject.vm`

```velocity
Thanks for contacting Shipgen — we received your message
```

### 5.2 `contact-form-confirmation.body.vm`

Auto-reply to the **form submitter**.

```velocity
#set($headline = "Thanks, $submitterName!")
<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4B5563;">
  We received your message and our sales team will get back to you shortly.
</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:linear-gradient(180deg,#F8FAFF 0%,#F5F6F8 100%);border:1px solid rgba(0,102,255,0.12);border-radius:12px;">
  <tr>
    <td style="padding:20px 22px;">
      <p style="margin:0 0 10px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#7C3AED;font-weight:700;">Your message</p>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#4B5563;white-space:pre-wrap;">$message</p>
    </td>
  </tr>
</table>
#set($actionUrl = $consoleUrl)
#set($actionLabel = "Visit Shipgen Console")
#parse('partials/cta')
#set($footerNote = "You received this because you submitted the contact form on our website. Reply to this email if you need to add more details.")
```

### 5.3 `contact-form-lead.subject.vm`

```velocity
New website lead: $submitterName
```

### 5.4 `contact-form-lead.body.vm`

Internal email to **sales team** (and/or CRM inbox).

```velocity
<h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;font-weight:800;color:#0A0E1A;">New contact form submission</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4B5563;">A prospect submitted the static demo site contact form.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid rgba(10,14,26,0.08);border-radius:12px;">
  <tr><td style="padding:12px 16px;border-bottom:1px solid rgba(10,14,26,0.06);"><strong>Name:</strong> $submitterName</td></tr>
  <tr><td style="padding:12px 16px;border-bottom:1px solid rgba(10,14,26,0.06);"><strong>Email:</strong> <a href="mailto:$submitterEmail">$submitterEmail</a></td></tr>
#if($companyName && $companyName != '')
  <tr><td style="padding:12px 16px;border-bottom:1px solid rgba(10,14,26,0.06);"><strong>Company:</strong> $companyName</td></tr>
#end
#if($phone && $phone != '')
  <tr><td style="padding:12px 16px;border-bottom:1px solid rgba(10,14,26,0.06);"><strong>Phone:</strong> $phone</td></tr>
#end
#if($sourcePage && $sourcePage != '')
  <tr><td style="padding:12px 16px;border-bottom:1px solid rgba(10,14,26,0.06);"><strong>Page:</strong> $sourcePage</td></tr>
#end
  <tr><td style="padding:16px;"><strong>Message:</strong><br/><span style="white-space:pre-wrap;color:#4B5563;">$message</span></td></tr>
</table>
```

### 5.5 Register templates

In `EmailTemplateRegistry::bootDefaults()` add:

```php
'sales.contact-form-confirmation' => [
    'subject' => 'sales/contact-form-confirmation.subject',
    'body' => 'sales/contact-form-confirmation.body',
    'package' => 'core-api',
    'description' => 'Auto-reply to website contact form submitter.',
],
'sales.contact-form-lead' => [
    'subject' => 'sales/contact-form-lead.subject',
    'body' => 'sales/contact-form-lead.body',
    'package' => 'core-api',
    'description' => 'Internal sales notification for website contact form.',
],
```

### 5.6 Mailbox prefix mapping

In `packages/core-api/config/fleetbase.php`:

```php
'prefix' => [
    'sales.' => 'sales',
    // ...existing prefixes...
],
```

---

## 6. Backend endpoint (implement on Shipgen API)

### 6.1 Route

Add a **public** route (no auth) with rate limiting:

```php
// packages/core-api/src/routes.php — inside public v1 group
$router->post('contact', 'ContactController@submit');
```

Full URL examples:

- Dev: `http://localhost:8000/v1/contact`
- Prod: `https://api.yourdomain.com/v1/contact`

Ensure CORS allows your static site origin (`FRONTEND_HOSTS` / gateway CORS config).

### 6.2 Request body (JSON)

```json
{
  "name": "Jane Client",
  "email": "jane@acme.com",
  "company": "Acme Logistics",
  "phone": "+1 555 0100",
  "message": "We want a demo for 50 vehicles.",
  "source_page": "https://demo.shipgen.net/contact",
  "website": ""
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `name` | yes | |
| `email` | yes | Valid email |
| `message` | yes | Max ~5000 chars |
| `company` | no | |
| `phone` | no | |
| `source_page` | no | For analytics |
| `website` | no | **Honeypot** — must be empty (bots fill hidden fields) |

### 6.3 Controller logic (pseudocode)

```php
public function submit(ContactFormRequest $request)
{
    $variables = [
        'submitterName' => $request->input('name'),
        'submitterEmail' => $request->input('email'),
        'companyName' => $request->input('company', ''),
        'phone' => $request->input('phone', ''),
        'message' => $request->input('message'),
        'sourcePage' => $request->input('source_page', ''),
        'headerTagline' => 'Sales · Website inquiry',
    ];

    $renderer = app(EmailTemplateRenderer::class);

    // 1) Auto-reply to submitter (From: sales@, Reply-To: sales@)
    $confirm = $renderer->renderMail('sales.contact-form-confirmation', $variables);
    $confirmPolicy = MailboxPolicy::forTemplate('sales.contact-form-confirmation');
    Mail::html($confirm['html'], function ($mail) use ($request, $confirm, $confirmPolicy) {
        $mail->to($request->input('email'), $request->input('name'))
            ->subject($confirm['subject'])
            ->from($confirmPolicy['from']->address, $confirmPolicy['from']->name)
            ->replyTo($confirmPolicy['replyTo']->address, $confirmPolicy['replyTo']->name);
    });

    // 2) Lead notification to sales inbox (Reply-To = submitter so sales can hit Reply)
    $lead = $renderer->renderMail('sales.contact-form-lead', $variables);
    $leadPolicy = MailboxPolicy::forTemplate('sales.contact-form-lead');
    $salesInbox = config('fleetbase.mailboxes.addresses.sales');
    Mail::html($lead['html'], function ($mail) use ($request, $lead, $leadPolicy, $salesInbox) {
        $mail->to($salesInbox, 'Shipgen Sales')
            ->subject($lead['subject'])
            ->from($leadPolicy['from']->address, $leadPolicy['from']->name)
            ->replyTo($request->input('email'), $request->input('name'));
    });

    return response()->json(['status' => 'success', 'message' => 'Thank you. We will be in touch soon.']);
}
```

Use `Mail::send` synchronously (same pattern as `SettingController::testMailboxEmail`) so the static site gets immediate feedback.

### 6.4 Security checklist

| Control | Why |
|---------|-----|
| Honeypot field `website` | Block simple bots |
| Rate limit (`throttle:5,1` per IP) | Prevent abuse |
| Validate email format + max lengths | Injection / spam |
| Never expose SMTP creds to static site | Security |
| Optional: reCAPTCHA / Turnstile | Production recommended |
| Optional: shared secret header `X-Contact-Token` | Restrict to your static host |

### 6.5 Deploy after backend changes

```bash
docker compose exec application sh -c "cd /fleetbase/api && composer reinstall fleetbase/core-api --no-interaction && php artisan octane:reload"
docker compose exec iam-service sh -c "cd /fleetbase/api && composer reinstall fleetbase/core-api --no-interaction && php artisan octane:reload"
```

---

## 7. Static website frontend integration

### 7.1 HTML form

```html
<form id="contact-form">
  <input type="text" name="name" required />
  <input type="email" name="email" required />
  <input type="text" name="company" />
  <input type="tel" name="phone" />
  <textarea name="message" required></textarea>
  <!-- Honeypot — hide with CSS, leave empty -->
  <input type="text" name="website" tabindex="-1" autocomplete="off"
         style="position:absolute;left:-9999px" aria-hidden="true" />
  <button type="submit">Contact sales</button>
</form>
<p id="contact-status" role="status"></p>
```

### 7.2 JavaScript submit handler

```javascript
const API_CONTACT_URL = "https://api.yourdomain.com/v1/contact";

document.getElementById("contact-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target;
  const status = document.getElementById("contact-status");
  status.textContent = "Sending…";

  const payload = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    company: form.company.value.trim(),
    phone: form.phone.value.trim(),
    message: form.message.value.trim(),
    source_page: window.location.href,
    website: form.website.value.trim(), // honeypot
  };

  try {
    const response = await fetch(API_CONTACT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Request failed");
    status.textContent = data.message || "Thank you! Check your inbox for a confirmation.";
    form.reset();
  } catch (error) {
    status.textContent = error.message || "Something went wrong. Email sales@shipgen.net directly.";
  }
});
```

### 7.3 Visual parity with emails

Use the same CSS tokens on the static contact page:

- Page background `#F5F6F8`
- Card `#FFFFFF` with `border: 1px solid rgba(10,14,26,0.08)` and `border-radius: 16px`
- Primary button gradient `linear-gradient(135deg, #0066FF 0%, #7C3AED 100%)`
- Logo: same `logo_logistic.png` asset as API `/images/logo_logistic.png`

---

## 8. Email flows summary (contact form)

| # | Recipient | Template key | From | Reply-To |
|---|-----------|--------------|------|----------|
| 1 | Form submitter | `sales.contact-form-confirmation` | `sales@shipgen.net` | `sales@shipgen.net` |
| 2 | Sales team inbox | `sales.contact-form-lead` | `sales@shipgen.net` | Submitter's email |

Both emails use the **same Shipgen layout** (`layouts/shipgen.vm`) as invites, credentials, and support mail.

---

## 9. Existing application mail map (reference)

| Template key | Mailbox | Trigger |
|--------------|---------|---------|
| `auth.user-invited` | **sales** | IAM → Invite user |
| `auth.user-credentials` | noreply | Password / credentials |
| `auth.password-reset` | noreply | Forgot password |
| `auth.verification` | noreply | Email verification |
| `auth.mail-test` | noreply | Admin SMTP test |
| `ledger.*` | billing | Invoices / payments |
| `support.*` | support | Support templates (if added) |
| `sales.*` | **sales** | **Website contact form (new)** |

---

## 10. Testing

### 10.1 Render template in container (no send)

```bash
docker compose exec iam-service php /fleetbase/api/artisan tinker
```

```php
$html = app(\Fleetbase\Mail\EmailTemplateRenderer::class)->renderMail('sales.contact-form-confirmation', [
    'submitterName' => 'Test User',
    'submitterEmail' => 'test@example.com',
    'message' => "Hello from the demo site.",
]);
echo $html['subject'] . PHP_EOL;
file_put_contents('/tmp/contact-test.html', $html['html']);
```

### 10.2 Send test via API

After implementing `POST /v1/contact`, submit the form from the static site or:

```bash
curl -X POST https://api.yourdomain.com/v1/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"you@example.com","message":"Hello","website":""}'
```

### 10.3 Verify headers in inbox

- **From:** `Shipgen <sales@shipgen.net>`
- HTML renders with logo, gradient header, styled body (not raw `<h1>` text)
- Reply opens `sales@` (confirmation) or submitter email (lead notification)

---

## 11. Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Raw HTML tags visible in Gmail | Body passed through escaped pipeline | Use `EmailTemplateRenderer` only; never pass rendered HTML as a Velocity variable |
| Email not sent, API 200 | Queued notification | Use `Mail::html` / `notifyNow`, not `ShouldQueue` without worker |
| From shows noreply instead of sales | Wrong template key prefix | Use `sales.*` keys + mapping |
| SMTP auth error | Wrong `MAIL_USERNAME` / password | Use cPanel mailbox creds; port 465 + `ssl` |
| Stale code in HTTP | Octane workers | `composer reinstall fleetbase/core-api && php artisan octane:reload` |
| CORS error from static site | Origin not allowed | Add static domain to gateway/CORS `FRONTEND_HOSTS` |

---

## 12. File checklist (copy/paste implementation)

- [ ] `packages/core-api/email-templates/sales/contact-form-confirmation.subject.vm`
- [ ] `packages/core-api/email-templates/sales/contact-form-confirmation.body.vm`
- [ ] `packages/core-api/email-templates/sales/contact-form-lead.subject.vm`
- [ ] `packages/core-api/email-templates/sales/contact-form-lead.body.vm`
- [ ] `EmailTemplateRegistry.php` — register both keys
- [ ] `config/fleetbase.php` — `'sales.' => 'sales'` prefix mapping
- [ ] `ContactFormRequest.php` — validation + honeypot
- [ ] `ContactController.php` — send dual emails
- [ ] `routes.php` — `POST v1/contact`
- [ ] Static site JS — `fetch` to API
- [ ] CORS + rate limit + deploy reload

---

## 13. Quick reference — core PHP classes

| Class | Role |
|-------|------|
| `Fleetbase\Mail\EmailTemplateRenderer` | Render subject + HTML for a template key |
| `Fleetbase\Mail\Support\MailboxPolicy` | Resolve From / Reply-To from template key |
| `Fleetbase\Mail\EmailTemplateRegistry` | Template catalog |
| `Fleetbase\Mail\Velocity\VelocityEngine` | `.vm` rendering engine |
| `Fleetbase\Mail\Support\CredentialEmailBranding` | Brand name, logo URL, greetings |
| `Fleetbase\Mail\Concerns\RendersVelocityEmail` | Used by notifications (`UserInvited`, etc.) |

---

*Document version: 2026-06-17 — matches Shipgen on-prem stack (`mail.shipgen.net`, Velocity templates, sales mailbox routing).*
