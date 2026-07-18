# Test walkthrough — Free Flow Fitness funnel

Two phases: **(A) local, no secrets (demo mode)** — do this now; and **(B) full
end-to-end** once the goelev8-portal backend is built and test keys are in place.

---

## Phase A — Local demo mode (works today, charges nothing)

```bash
npm install
npm run dev      # http://localhost:3000
```

### 1. The page
- [ ] Header shows the FF mark (white on the dark bar), nav, and phone.
- [ ] Hero shows the **cobalt** logo, the tagline, and two CTAs: **Book a Party**
      and **Book a Private Lesson**.
- [ ] Party section shows all 4 packages with correct prices/deposits and the
      add-ons note. Ultimate Flow is flagged **Most Popular**.
- [ ] Classes teaser lists the 6 class groups.
- [ ] Private-lesson section shows **no price**.
- [ ] Location shows `11726 St Charles Rock Rd Ste A, Bridgeton, MO 63044` and
      `314-625-2323`; footer shows the **teal** ornate logo.

### 2. Party booking (deposit package)
- [ ] Click **Book This Party** on Fab Flow → modal opens, package preselected,
      deposit callout reads **$150**.
- [ ] Submit without the consent box checked → inline error.
- [ ] Fill it in, check consent, submit. In demo mode you'll see the success
      message (no Stripe redirect). Server console logs the payload with
      `"deposit_cents":15000`.

### 3. Body Painting (inquiry only)
- [ ] Book This Party on Body Painting → callout reads **reserve-by-request**,
      button says **Send My Request**, submit → success message, no charge.
      Server logs `"deposit_cents":null`.

### 4. Private lesson (inquiry / hold)
- [ ] Book a Private Lesson (hero or section) → modal has goals / times /
      experience, **no price**, no payment. Submit → success message. Server logs
      `service_type":"private_lesson"` and `"deposit_cents":null`.

### 5. Quick API checks (optional)
```bash
# deposit package (demo) -> ok, no checkoutUrl
curl -s -X POST localhost:3000/api/book -H 'Content-Type: application/json' \
  -d '{"package":"fab-flow","first_name":"Jamie","last_name":"Sample","email":"j@e.com","phone":"3145550100","sms_consent":true}'
# missing consent -> HTTP 400
curl -s -o /dev/null -w '%{http_code}\n' -X POST localhost:3000/api/book \
  -H 'Content-Type: application/json' \
  -d '{"package":"fab-flow","first_name":"J","last_name":"S","email":"j@e.com","phone":"3145550100"}'
```

---

## Phase B — Full end-to-end (after the portal backend is built)

Prereqs: build the backend with `docs/GOELEV8-PORTAL-PROMPT.md`; set
`STRIPE_SECRET_KEY` to a **test** key in the portal; set `PORTAL_API_URL` +
`GOELEV8_WEBHOOK_SECRET` here in `.env.local`.

1. **Party → Stripe → SMS**
   - Submit a Fab Flow booking → you're redirected to Stripe Checkout for **$150**.
   - Pay with test card `4242 4242 4242 4242`, any future expiry/CVC.
   - You return to `/?booking=success` and the **StatusBanner** confirms.
   - A **request-received** SMS arrives within 60s of submit; a **deposit-paid**
     SMS arrives after checkout completes (from the Stripe webhook).
   - A `freeflow_bookings` row exists: `payment_status='deposit_paid'`.
2. **Body Painting inquiry** → request-received SMS, no Stripe, row with
   `deposit_cents=null`, `payment_status='none'`.
3. **Private lesson inquiry** → instructor-follow-up SMS, no charge.
4. **Vapi line** → call the provisioned Free Flow number: it explains packages,
   asks party vs lesson, collects details, and hands off for
   class-level/choreography questions. Call logged to `vapi_calls`.
5. **Flow B metering** → after 5 bookings in a month, the 6th adds a $10 overage to
   the studio's `freeflow_billing_statements` row for the period.

### Sign-off gates (from the brief)
- [ ] SMS copy approved (drafts in the portal prompt).
- [ ] Private-lesson price confirmed before any charge is wired.
- [ ] Body Painting deposit confirmed before any charge is wired.
- [ ] Preview reviewed before production deploy.
