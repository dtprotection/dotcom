# Pre-Merge Checklist: CI/CD Workflow

## Can You Merge Now?

**Short Answer**: You can merge, but the **deploy job will fail** until you add GitHub Secrets. The lint, test, and build jobs will work fine.

**Recommended**: Add GitHub Secrets **before merging** so the first deployment works automatically.

## Pre-Merge Checklist

### ✅ Required Before Merge (For Full Functionality)

#### 1. GitHub Secrets Setup

Go to your GitHub repository:
1. **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add these secrets:

**Required for Deployment:**
- [ ] `HEROKU_API_KEY` - Your Heroku API key
  - Get from: https://dashboard.heroku.com/account
  - Click "Reveal" next to API Key
  - Or run: `heroku auth:token`

- [ ] `HEROKU_APP_NAME` - Your Heroku app name
  - Example: `dtprotection-app` or whatever you named it
  - Check with: `heroku apps` or in Heroku dashboard

- [ ] `HEROKU_EMAIL` - Your Heroku account email
  - The email you use to log into Heroku

**Optional (For Better CI):**
- [ ] `NEXT_PUBLIC_API_URL` - Your Heroku app URL
  - Example: `https://your-app.herokuapp.com`
  - Used during frontend build

- [ ] `PAYPAL_CLIENT_ID` - Only if you want PayPal tests to run
- [ ] `PAYPAL_CLIENT_SECRET` - Only if you want PayPal tests to run
- [ ] `EMAIL_PROVIDER` - Only if you want email tests to run

### ✅ What Will Work Without Secrets

Even without GitHub Secrets, these jobs will run successfully:
- ✅ **Lint job** - Code quality checks
- ✅ **Test job** - All tests (PayPal/Email tests will skip gracefully)
- ✅ **Build job** - Application builds

### ⚠️ What Will Fail Without Secrets

- ❌ **Deploy job** - Will fail if `HEROKU_API_KEY`, `HEROKU_APP_NAME`, or `HEROKU_EMAIL` are missing

## Merge Strategy Options

### Option 1: Merge Now, Add Secrets Later (Safest)

**Pros:**
- Get CI/CD running immediately
- See lint/test/build results
- Can add secrets anytime

**Cons:**
- First merge to main will fail on deploy
- Need to manually deploy first time

**Steps:**
1. Merge the branch
2. PR will trigger lint/test/build (will pass)
3. Merge to main will trigger deploy (will fail)
4. Add GitHub Secrets
5. Push again or manually deploy

### Option 2: Add Secrets First, Then Merge (Recommended)

**Pros:**
- First deployment works automatically
- No failed workflow runs
- Cleaner history

**Cons:**
- Need to set up secrets first

**Steps:**
1. Add GitHub Secrets (see above)
2. Merge the branch
3. Everything works automatically!

## Quick Setup Guide

### Get Heroku API Key

```bash
# Option 1: From CLI
heroku auth:token

# Option 2: From Dashboard
# Go to https://dashboard.heroku.com/account
# Click "Reveal" next to API Key
```

### Get Heroku App Name

```bash
# Option 1: From CLI
heroku apps

# Option 2: Check your Heroku dashboard
# The app name is in the URL: https://dashboard.heroku.com/apps/YOUR-APP-NAME
```

### Add Secrets to GitHub

1. Go to: `https://github.com/YOUR-USERNAME/YOUR-REPO/settings/secrets/actions`
2. Click **New repository secret**
3. Add each secret:
   - Name: `HEROKU_API_KEY`, Value: `your-api-key`
   - Name: `HEROKU_APP_NAME`, Value: `your-app-name`
   - Name: `HEROKU_EMAIL`, Value: `your-email@example.com`

## What Happens After Merge

### On Pull Request (to main)
1. ✅ Lint job runs
2. ✅ Test job runs
3. ✅ Build job runs
4. ⏭️ Deploy job **skips** (only runs on push to main)

### On Merge to Main
1. ✅ Lint job runs
2. ✅ Test job runs
3. ✅ Build job runs
4. ✅ Deploy job runs (if secrets are set) OR ❌ Fails (if secrets missing)

## Verification Steps

### Before Merging

```bash
# 1. Verify you have Heroku access
heroku apps

# 2. Get your API key
heroku auth:token

# 3. Verify your app name
heroku apps | grep your-app-name
```

### After Merging

1. Go to **Actions** tab in GitHub
2. Check the workflow run
3. Verify all jobs pass (or deploy fails gracefully if secrets missing)

## Troubleshooting

### If Deploy Fails After Merge

**Error**: "HEROKU_API_KEY not found"
- **Solution**: Add `HEROKU_API_KEY` secret to GitHub

**Error**: "App not found"
- **Solution**: Check `HEROKU_APP_NAME` matches your actual app name

**Error**: "Authentication failed"
- **Solution**: Verify `HEROKU_API_KEY` is correct (regenerate if needed)

### If Tests Fail

Tests should skip gracefully if services aren't configured. If they fail:
- Check the test logs
- Verify `SKIP_OPTIONAL_SERVICE_TESTS: 'true'` is set (it is in the workflow)

## Recommended Approach

**Best Practice**: Add the 3 required secrets (`HEROKU_API_KEY`, `HEROKU_APP_NAME`, `HEROKU_EMAIL`) before merging. This takes 5 minutes and ensures the first deployment works automatically.

## Summary

| Action | Status | Impact |
|--------|--------|--------|
| Merge without secrets | ✅ Safe | Lint/test/build work, deploy fails |
| Add secrets first | ✅ Recommended | Everything works automatically |
| Merge then add secrets | ✅ Works | Just need to push again after adding secrets |

**My Recommendation**: Add the 3 required secrets first (takes 5 minutes), then merge. This gives you a clean first deployment.

