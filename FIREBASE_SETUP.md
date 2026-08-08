# Firebase — manual setup steps only you can do

Everything fixable in code has been fixed. This file lists what's left, all of which lives in
the Firebase Console, your DNS, or your hosting setup — I can't reach any of it from here.

Project: `financefirst-ee059` · Site: `fynoptic.org` (GitHub Pages) · SDK: Firebase JS 12.17.1

Items are ordered by how badly they bite you. **1 and 2 are the ones that can leave sign-in
broken or your storage bucket wide open — do those first.**

---

## 1. Verify `fynoptic.org` is an authorized domain — REQUIRED

If your production domain isn't on this list, every Google sign-in attempt dies with
`auth/unauthorized-domain` and nothing else works. Check it even if sign-in seems fine today,
because the list is per-project and easy to lose track of.

1. [Firebase Console](https://console.firebase.google.com/) → project **financefirst-ee059**
2. **Authentication** → **Settings** tab → **Authorized domains**
3. Confirm all of these are present, and add any that are missing:
   - `fynoptic.org`
   - `www.fynoptic.org` (if you serve it)
   - `financefirst-ee059.firebaseapp.com` (leave it — it's the auth helper domain)
   - `localhost` (for local testing)

The new code maps this failure to a readable message instead of a raw Firebase string, so if
it *is* misconfigured you'll now see "This site isn't authorized for sign-in" rather than
silence. But it still won't work until you add the domain.

## 2. Lock down Cloud Storage rules — SECURITY

`js/profile.js` uploads avatars to `avatars/{uid}/{timestamp}-{filename}`. If your Storage
rules are still in test mode (`allow read, write: if true`), **anyone on the internet can write
to your bucket** and fill it at your expense.

1. Console → **Storage** → **Rules**
2. Replace with rules that scope writes to the owner and cap file size:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /avatars/{userId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.auth.uid == userId
                   && request.resource.size < 3 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

3. **Publish**

The 3 MB / image-type checks mirror the client-side validation in `js/profile.js:172-173`.
Client-side checks are a UX nicety; only rules actually stop anyone.

Note: the `apiKey` in `js/auth.js` is *supposed* to be public — Firebase web API keys are
identifiers, not secrets. Your actual security perimeter is Authorized domains (step 1) plus
Storage/Firestore rules (this step). Don't waste time trying to hide the key.

## 3. Turn on email enumeration protection — SECURITY

Without this, the error codes Firebase returns let anyone test whether a given email has an
account on your site.

1. Console → **Authentication** → **Settings** → **User actions**
2. Enable **Email enumeration protection**

The new code already refuses to leak this — `invalid-credential`, `wrong-password`, and
`user-not-found` all render the same message ("That email or password isn't right."), and the
new password-reset flow reports success even for unknown addresses. Enabling the setting closes
the gap at the API level too, so a script hitting Firebase directly learns nothing either.

## 4. Check the password reset email template — REQUIRED for the new feature

The site had **no password recovery at all** before this change. The code now calls
`sendPasswordResetEmail`, but the email itself is Firebase's default and will come from a
`firebaseapp.com` address with generic wording.

1. Console → **Authentication** → **Templates** → **Password reset**
2. Edit the sender name to "Fynoptic" and adjust the subject/body wording
3. Optional but recommended: set a **custom domain** for the sender so the mail comes from
   `fynoptic.org` and stops landing in spam. This needs DNS records (SPF/DKIM) that the
   console will show you.
4. Send yourself a test reset from the live site and confirm the link works end-to-end.

Also confirm **Email/Password** is enabled under **Authentication → Sign-in method** — the
signup and reset flows both depend on it.

## 5. Google provider support email

Console → **Authentication** → **Sign-in method** → **Google** → confirm a **support email**
is set. Google shows it on the consent screen; a missing one can make the provider misbehave.

## 6. Optional: enable redirect-based Google sign-in

**You do not need this. Skip it unless popups are causing you real problems.**

### Why redirect is currently disabled in code

`signInWithRedirect()` works by loading a cross-origin iframe from your `authDomain`. Chrome
and Safari now block third-party storage access, so that iframe fails whenever `authDomain`
(`financefirst-ee059.firebaseapp.com`) differs from the site's domain (`fynoptic.org`) — which
is exactly your setup. Firebase documents this directly:

> The `signInWithRedirect()` flow uses a cross-origin iframe, which can be blocked by browsers
> that restrict third-party storage access. This issue affects apps hosted on Firebase Hosting
> with a custom domain [...] or apps hosted with other services.
> — [Redirect best practices](https://firebase.google.com/docs/auth/web/redirect-best-practices)

The old code used redirect as its popup fallback, so a user with popups blocked got bounced
back to the site still signed out, with no error shown. That fallback is now **removed**;
Google sign-in is popup-only and popup failures produce an actionable message. This is
Firebase's own recommended option for your situation, and it needs zero console work.

### If you still want redirect

Firebase offers three routes. Two of them are blocked by GitHub Pages:

| Route | Works on GitHub Pages? |
|---|---|
| Keep using popup (current) | ✅ Already done |
| Serve the site from Firebase Hosting, set `authDomain: 'fynoptic.org'` | ❌ Requires migrating hosting off GitHub Pages |
| Reverse-proxy `/__/auth/**` → `financefirst-ee059.firebaseapp.com` | ❌ GitHub Pages can't do rewrites (it fronts with Fastly/Varnish and gives you no config) |

So to get redirect working you'd need to change where the site is served from. Two viable paths:

**Path A — put Cloudflare in front of GitHub Pages** (keeps your current deploy flow)
1. Move `fynoptic.org` DNS to Cloudflare (change nameservers at your registrar)
2. Keep GitHub Pages as the origin
3. Add a Cloudflare **Origin Rule** or **Worker** proxying `/__/auth/*` to
   `https://financefirst-ee059.firebaseapp.com/__/auth/*` — the equivalent of this Nginx block
   from the Firebase docs:
   ```nginx
   location /__/auth {
     proxy_pass https://financefirst-ee059.firebaseapp.com;
   }
   ```
4. Verify `https://fynoptic.org/__/auth/handler` loads Firebase's helper page
5. **Only then** open `js/auth.js` and flip the flag at the top:
   ```js
   const USE_CUSTOM_AUTH_DOMAIN = true;
   ```
6. Add `fynoptic.org` under Authorized domains (step 1) if you haven't

**Path B — migrate hosting to Firebase Hosting**
1. `firebase init hosting` in the repo, deploy, point `fynoptic.org` at Firebase Hosting
2. Firebase Hosting serves `/__/auth/**` automatically
3. Flip `USE_CUSTOM_AUTH_DOMAIN = true` in `js/auth.js`

> ⚠️ **Do not flip that flag before the `/__/auth/handler` URL actually resolves on
> `fynoptic.org`.** Popup sign-in also routes through `authDomain`, so setting it to a domain
> that doesn't serve the helper breaks Google sign-in *entirely* — worse than today. Load
> `https://fynoptic.org/__/auth/handler` in a browser and confirm you get Firebase's page,
> not a 404, before changing the flag.

## 7. Optional: App Check

Stops people using your Firebase project from outside your site. Console → **App Check** →
register the web app with reCAPTCHA v3. Requires adding the App Check SDK to `js/auth.js` and
a site key — tell me if you want it and I'll wire it up.

---

## Quick checklist

- [ ] 1. `fynoptic.org` in Authorized domains
- [ ] 2. Storage rules scoped to `request.auth.uid` (not test mode)
- [ ] 3. Email enumeration protection enabled
- [ ] 4. Password reset template branded + tested end-to-end
- [ ] 5. Google provider support email set
- [ ] 6. Redirect sign-in — skip unless you want it
- [ ] 7. App Check — optional hardening
