# Add EmailJS Gmail sending to Generate page

## 1. Install dependency
- `bun add @emailjs/browser`

## 2. Edit `src/routes/generate.tsx`
- Add import: `import emailjs from "@emailjs/browser";`
- Add constants at top of file (module scope):
  - `EMAILJS_SERVICE_ID = "service_zznirzy"`
  - `EMAILJS_TEMPLATE_ID = "template_9hiuxks"`
  - `EMAILJS_PUBLIC_KEY = "aJkp6MGihHvf3cq6I"`
- Add new state inside `GeneratePage`:
  - `recipientEmail: string`
  - `sending: boolean`
- Add a "Send to (optional)" email input in the form, placed just above the "Generate Email" submit button. Uses the existing `Field` wrapper and `inputCls` styling for visual consistency (dark theme, same as other fields). Placeholder: `client@business.com`.
- In the result preview panel (after the existing Copy / .txt / .doc / CRM button row), conditionally render a "📤 Send via Gmail" button when `recipientEmail.trim()` is non-empty and a result exists. Same red primary style as the Generate button (`bg-primary text-primary-foreground`, full width, rounded-xl).
- Implement `handleSend`:
  - Sets `sending=true`, calls `emailjs.send(SERVICE, TEMPLATE, { to_email, subject, body }, PUBLIC_KEY)` using current edited `subject` and `body` state.
  - On success: green `toast.success("✅ Email sent to <recipient>!")`, reset `sending`.
  - On error: `toast.error("⚠️ Failed to send. Please try again.")`, reset `sending`.
- Button states:
  - Default label: "📤 Send via Gmail"
  - While sending: label "Sending..." and `disabled`

## Notes
- No backend / server function needed — EmailJS runs entirely client-side with the public key.
- Keeps all existing functionality (form, history, CRM dropdown) untouched.
