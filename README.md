# React + Vite

## Ephemeral Visitor Data Privacy Guard

The scheduled Firebase Function in `functions/index.js` runs every hour. It finds records in the `registrations` collection whose checkout timestamp (`checkout_time`, `checkoutTime`, `checkOutAt`, or a Firestore `checkOut` timestamp) is older than 24 hours, then removes visitor PII and access artifacts while preserving the visit record for analytics.

Deploy it with the Firebase CLI after authenticating and selecting the project:

```bash
cd functions
npm install
cd ..
firebase deploy --only functions:scrubExpiredVisitData
```

The cleanup requires a real checkout timestamp. A time-only string such as `10:45 AM` cannot be safely aged by a server, so production check-out writes should use a Firestore Timestamp in `checkout_time` (or one of the supported timestamp fields).

## Visitor email notifications

Visit-request and approval emails are sent by Firebase Functions when a registration is created or changes from `pending` to `approved`. Reschedule requests email the host, and the host's approval or decline emails the visitor. Configure SMTP before deploying:

1. Copy `functions/.env.example` to `functions/.env`.
2. Set `GMAIL_USER` to the sending Gmail address and `GMAIL_PASS` to its Google App Password (not the normal account password). Set `ADMIN_EMAIL` to the administrator's recipient address.
3. Deploy the functions: `firebase deploy --only functions`.
4. Check delivery errors with `firebase functions:log --only sendVisitRequestNotification,sendVisitApprovalNotification,sendRescheduleNotification`.

`functions/.env` is ignored by Git. The example values are placeholders and must be replaced with valid credentials.

## Pre-registration email OTP

The public pre-registration form sends an email OTP without creating a visit request. The visitor must verify the OTP before submitting the form; only the separate **Submit Registration** action creates the visit request. To use OTP locally, set `EMAIL_USER` and `EMAIL_PASS` (or `GMAIL_USER` and `GMAIL_PASS`) in the project-root `.env`, then run `npm run email-server` in one terminal and `npm run dev` in another.

## Reschedule email with EmailJS

The visitor and host dashboards can send reschedule-request and decision emails directly through EmailJS without deploying Firebase Functions. Set `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, and `VITE_EMAILJS_PUBLIC_KEY` in the project-root `.env`, then restart Vite. Configure the EmailJS template's recipient as `{{to_email}}` and its content to use `{{to_name}}`, `{{notification_title}}`, and `{{notification_message}}`. Restrict the EmailJS service to trusted website origins and configure its send limits.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
