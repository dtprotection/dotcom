# Quick Deployment Steps - Heroku

## Prerequisites
- Heroku CLI installed and logged in
- Git repository initialized
- MongoDB Atlas account (for database - can set up later)

## Step-by-Step Deployment

### 1. Create Heroku App

```bash
# From the root directory
heroku create dt-protection-app
```

This will:
- Create a new Heroku app
- Add a git remote called `heroku`
- Give you a URL like `https://dt-protection-app.herokuapp.com`

### 2. Set Minimum Required Environment Variables

For the app to start and show the UI (even without full functionality):

```bash
# Set Node environment (Heroku sets this automatically, but good to be explicit)
heroku config:set NODE_ENV=production

# Set a JWT secret (required for auth features)
heroku config:set JWT_SECRET="$(openssl rand -base64 48)"
heroku config:set JWT_EXPIRES_IN="24h"
```

**Note**: Without `MONGODB_URI`, the app will start and show the UI, but database features won't work. This is fine for initial testing!

### 3. Deploy to Heroku

```bash
# Make sure you're on the convert_to_monolith branch
git checkout convert_to_monolith

# Add all files
git add .

# Commit (if not already committed)
git commit -m "Deploy monolith to Heroku"

# Push to Heroku (use 'main' or 'master' depending on your default branch)
git push heroku convert_to_monolith:main
# OR if your default branch is master:
# git push heroku convert_to_monolith:master
```

**Important**: Heroku expects the branch to be named `main` or `master`. If you're on `convert_to_monolith`, use the syntax above.

### 4. Check Deployment

```bash
# View logs to see if it deployed successfully
heroku logs --tail

# Open the app in your browser
heroku open
```

## What You'll See

✅ **With just the above steps:**
- The web UI will load at `https://your-app.herokuapp.com`
- You can see the homepage, navigation, etc.
- Database features (bookings, login) won't work yet (no MongoDB)

## Next Steps (To Make It Fully Functional)

### 5. Set Up MongoDB Atlas

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create a cluster (M0 Free tier)
4. Create database user
5. Set network access to `0.0.0.0/0`
6. Get connection string

Then set it:
```bash
heroku config:set MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/dtprotection?retryWrites=true&w=majority"
```

### 6. Add Mailgun (Email Service)

```bash
heroku addons:create mailgun:starter
heroku config:set EMAIL_PROVIDER="mailgun"
heroku config:set EMAIL_FROM="noreply@your-mailgun-domain.com"
heroku config:set EMAIL_FROM_NAME="DT Protection Services"
```

### 7. Set PayPal Credentials (For Payments)

```bash
heroku config:set PAYPAL_CLIENT_ID="your_paypal_client_id"
heroku config:set PAYPAL_CLIENT_SECRET="your_paypal_client_secret"
heroku config:set PAYPAL_MODE="sandbox"  # or "live" for production
```

### 8. Create Admin User

```bash
heroku run npm run create-admin
```

This creates:
- Username: `admin`
- Password: `admin123456`

**⚠️ Change password after first login!**

## Troubleshooting

### Build Fails
```bash
# Check build logs
heroku logs --tail

# Common issues:
# - Missing dependencies (check package.json)
# - TypeScript errors (check tsconfig)
# - Next.js build errors (check frontend/)
```

### App Crashes on Start
```bash
# Check runtime logs
heroku logs --tail

# Common issues:
# - Missing environment variables
# - MongoDB connection failing (app will still start, just warn)
# - Port issues (Heroku sets PORT automatically)
```

### Can't See UI
- Check if build completed: `heroku logs --tail`
- Verify Procfile exists: `cat Procfile`
- Check if app is running: `heroku ps`

## Quick Commands Reference

```bash
# View logs
heroku logs --tail

# Check config vars
heroku config

# Restart app
heroku restart

# Open app
heroku open

# Run commands
heroku run npm run create-admin

# Check app status
heroku ps
```

## Expected Build Output

When you push, you should see:
1. Node.js buildpack detected
2. Installing dependencies (`npm install`)
3. Building frontend (`next build`)
4. Building backend (`tsc`)
5. Starting web process (`npm start`)

If all goes well, you'll see:
```
> Ready on http://0.0.0.0:PORT
> Environment: production
```

## Answer to Your Question

**Q: Can I just do `git push heroku master` from root?**

**A**: Almost! You need to:
1. Make sure Heroku remote is set up: `heroku create your-app-name`
2. Use the correct branch syntax: `git push heroku convert_to_monolith:main`
3. Set at least `JWT_SECRET` environment variable (for auth)
4. The UI will show even without MongoDB (database features just won't work)

**Q: Will I see the web UI?**

**A**: Yes! The UI will load. Without MongoDB, you can:
- ✅ See the homepage
- ✅ Navigate pages
- ✅ See the UI/design
- ❌ Can't create bookings (needs database)
- ❌ Can't login (needs database)

**Q: Do I need code modifications?**

**A**: No! The code is ready. I just made one small fix:
- Made MongoDB connection non-blocking (app starts even if DB isn't configured)
- Fixed the start script (removed redundant NODE_ENV setting)

You're ready to deploy! 🚀

