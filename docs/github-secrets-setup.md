# GitHub Secrets Setup Guide

## Where to Add Secrets

**Yes, you're correct!** Add them in the **Repository Secrets** section:

1. Go to your GitHub repository
2. Click **Settings** (top menu)
3. Click **Secrets and variables** → **Actions** (left sidebar)
4. Click **New repository secret** button
5. Add each secret one by one

**Direct URL format**: `https://github.com/YOUR-USERNAME/YOUR-REPO/settings/secrets/actions`

## NEXT_PUBLIC_API_URL - Where to Get It

### What It Is

`NEXT_PUBLIC_API_URL` is your **Heroku app URL** - the public URL where your app is deployed.

### How to Get It

**Option 1: From Heroku Dashboard**
1. Go to https://dashboard.heroku.com/apps
2. Click on your app
3. The URL is shown at the top, or click "Open app"
4. Copy the full URL (e.g., `https://your-app-name.herokuapp.com`)

**Option 2: From Heroku CLI**
```bash
heroku apps:info
# Or
heroku info
# Look for "Web URL" or "Git URL"
```

**Option 3: From Your Browser**
- If your app is already deployed, just visit it and copy the URL from the address bar

### Example Values

```
https://dtprotection-app.herokuapp.com
https://your-app-name.herokuapp.com
```

**Important**: 
- Include `https://` (not `http://`)
- Don't include a trailing slash
- This is your **production URL** where the app is deployed

### Why It's Needed

Next.js uses this during the build process to know where the API endpoints are. Since you have a monolith (frontend + backend together), this should be your Heroku app URL.

**Note**: The workflow has a fallback to `http://localhost:3000` if not set, but it's better to set it to your actual Heroku URL.

## Complete Secrets Checklist

### Required Secrets (Must Have)

| Secret Name | Where to Get | Example Value |
|------------|--------------|---------------|
| `HEROKU_API_KEY` | https://dashboard.heroku.com/account → Reveal API Key | `abc123def456...` |
| `HEROKU_APP_NAME` | Heroku dashboard or `heroku apps` | `dtprotection-app` |
| `HEROKU_EMAIL` | Your Heroku login email | `your-email@example.com` |

### Optional Secrets (Nice to Have)

| Secret Name | Where to Get | Example Value |
|------------|--------------|---------------|
| `NEXT_PUBLIC_API_URL` | Your Heroku app URL | `https://your-app.herokuapp.com` |
| `PAYPAL_CLIENT_ID` | PayPal Developer Dashboard | `your-paypal-client-id` |
| `PAYPAL_CLIENT_SECRET` | PayPal Developer Dashboard | `your-paypal-secret` |
| `EMAIL_PROVIDER` | Your email config | `mailgun` |

## Step-by-Step: Adding Secrets

### 1. Get Your Heroku API Key

**Method A: From Dashboard**
1. Go to: https://dashboard.heroku.com/account
2. Scroll to "API Key" section
3. Click **Reveal** button
4. Copy the key

**Method B: From CLI**
```bash
heroku auth:token
```

### 2. Get Your Heroku App Name

**Method A: From Dashboard**
- Look at the URL: `https://dashboard.heroku.com/apps/YOUR-APP-NAME`
- Or look at the app name in the dashboard

**Method B: From CLI**
```bash
heroku apps
# Lists all your apps
```

### 3. Get Your Heroku App URL (for NEXT_PUBLIC_API_URL)

**Method A: From Dashboard**
1. Go to your app in Heroku dashboard
2. Click **Open app** button
3. Copy the URL from browser address bar

**Method B: From CLI**
```bash
heroku apps:info --app YOUR-APP-NAME
# Look for "Web URL"
```

### 4. Add Secrets to GitHub

1. Go to: `https://github.com/YOUR-USERNAME/YOUR-REPO/settings/secrets/actions`
2. Click **New repository secret**
3. For each secret:
   - **Name**: Enter the secret name (e.g., `HEROKU_API_KEY`)
   - **Secret**: Paste the value
   - Click **Add secret**
4. Repeat for each secret

## Visual Guide

```
GitHub Repository
└── Settings
    └── Secrets and variables
        └── Actions  ← Click here
            └── New repository secret  ← Click this button
                ├── Name: HEROKU_API_KEY
                ├── Secret: [paste your API key]
                └── Add secret
```

## Verification

After adding secrets, you can verify they're set (but not see their values):

1. Go back to **Secrets and variables** → **Actions**
2. You should see all your secrets listed
3. You can update or delete them anytime

## Important Notes

### Security
- ✅ Secrets are encrypted and never shown in logs
- ✅ Only repository admins can see/edit secrets
- ✅ Secrets are available to GitHub Actions workflows
- ❌ Never commit secrets to code

### When Secrets Are Used

- **During PR**: Secrets are available but deploy job doesn't run
- **On merge to main**: All secrets are used for deployment
- **In CI**: Optional secrets (like PayPal) are used for tests if set

## Troubleshooting

### "Secret not found" error
- Verify the secret name matches exactly (case-sensitive)
- Check you're in the right repository
- Make sure you clicked "Add secret" after entering the value

### "App not found" error
- Verify `HEROKU_APP_NAME` matches your actual app name exactly
- Check for typos or extra spaces

### "Authentication failed" error
- Verify `HEROKU_API_KEY` is correct
- Try regenerating the API key from Heroku dashboard
- Make sure `HEROKU_EMAIL` matches your Heroku account email

## Quick Reference

```bash
# Get Heroku API Key
heroku auth:token

# Get Heroku App Name
heroku apps

# Get Heroku App URL
heroku apps:info --app YOUR-APP-NAME | grep "Web URL"
# Or just visit: https://dashboard.heroku.com/apps/YOUR-APP-NAME
```

## Summary

1. **NEXT_PUBLIC_API_URL** = Your Heroku app URL (e.g., `https://your-app.herokuapp.com`)
2. **Add secrets in**: Settings → Secrets and variables → Actions → New repository secret
3. **Required**: `HEROKU_API_KEY`, `HEROKU_APP_NAME`, `HEROKU_EMAIL`
4. **Optional but recommended**: `NEXT_PUBLIC_API_URL`

