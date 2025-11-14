# Complete Deployment Guide: DT Protection Booking System

## 🚀 **Overview**

This guide covers the complete deployment process for the DT Protection Booking System, including:
- MongoDB Atlas database setup
- Heroku backend deployment
- Vercel frontend deployment
- PayPal Business account setup
- Testing and verification

## 📋 **Prerequisites**

- Team access to Heroku, MongoDB Atlas, and Vercel
- PayPal Business account (personal accounts cannot use REST API)
- Git repository with the application code
- Command line access

---

## **Phase 1: MongoDB Atlas Setup (Team Member Access)**

### **Step 1: Access MongoDB Atlas Project**
```bash
# You should already have access as a team member
# Go to: https://cloud.mongodb.com
# Select the project you were added to
```

### **Step 2: Create New Cluster**
- Choose "FREE" tier
- Select cloud provider (AWS/Google Cloud/Azure)
- Choose region closest to your users
- Click "Create Cluster"

### **Step 3: Set Up Database Access**
1. Go to "Database Access" → "Add New Database User"
2. Username: `dtprotection_admin`
3. Password: [generate secure password]
4. Role: "Atlas admin" or "Read and write to any database"
5. Click "Add User"

### **Step 4: Set Up Network Access**
1. Go to "Network Access" → "Add IP Address"
2. Add: `0.0.0.0/0` (allows access from anywhere - Heroku)
3. Or add specific Heroku IP ranges if you prefer
4. Click "Confirm"

### **Step 5: Get Connection String**
1. Go to "Database" → "Connect"
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your actual password
5. Replace `<dbname>` with `dtprotection`

**Example connection string:**
```
mongodb+srv://dtprotection_admin:your_password@cluster.mongodb.net/dtprotection?retryWrites=true&w=majority
```

---

## **Phase 2: Heroku Backend Deployment (Team Access)**

### **Step 1: Navigate to Backend Directory**
```bash
cd backend
```

### **Step 2: Create Heroku App**
```bash
# If not already done
heroku create dt-protection-backend --team $teamName
```

### **Step 3: Add Mailgun Add-on**
```bash
heroku addons:create mailgun:starter
```

### **Step 4: Set Environment Variables**
```bash
heroku config:set MONGODB_URI="your_atlas_connection_string_from_step_1"
heroku config:set PAYPAL_CLIENT_ID="your_paypal_client_id"
heroku config:set PAYPAL_CLIENT_SECRET="your_paypal_client_secret"
heroku config:set PAYPAL_MODE="sandbox"  # Change to "live" when ready
heroku config:set JWT_SECRET="$(openssl rand -base64 48)"
heroku config:set JWT_EXPIRES_IN="24h"
heroku config:set NODE_ENV="production"
heroku config:set EMAIL_PROVIDER="mailgun"
heroku config:set EMAIL_FROM="noreply@your-mailgun-domain.com"
heroku config:set EMAIL_FROM_NAME="DT Protection Services"

# Note: MAILGUN_* variables are automatically set by the Mailgun add-on
# You can verify with: heroku config | grep MAILGUN
```

### **Step 5: Verify Configuration**
```bash
heroku config
```

### **Step 6: Deploy Backend**
```bash
git add .
git commit -m "Deploy backend to Heroku"
git push heroku main
```

### **Step 7: Check Logs**
```bash
heroku logs --tail
```

---

## **Phase 3: Vercel Frontend Deployment (Team Access)**

### **Step 1: Navigate to Frontend Directory**
```bash
cd frontend
```

### **Step 2: Deploy to Vercel**
```bash
vercel --prod
# You'll be prompted to select the team project
```

### **Step 3: Set Environment Variables in Vercel Dashboard**
1. Go to: https://vercel.com/dashboard
2. Select your project → Settings → Environment Variables
3. Add these variables:

```
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id
NEXT_PUBLIC_PAYPAL_MODE=sandbox  # Change to "live" when ready
NEXT_PUBLIC_API_BASE_URL=https://your-heroku-app-name.herokuapp.com
```

---

## **Phase 4: PayPal Business Account Setup**

### **Step 1: Upgrade to Business Account**
- Call PayPal Business Support: 1-888-221-1161
- Request REST API access for payment processing
- Provide business verification documents
- **Note**: Personal accounts cannot use REST API for payment processing

### **Step 2: Get API Credentials**
1. Go to: https://developer.paypal.com/dashboard/
2. Create new app
3. Get Client ID and Secret
4. Set to "Live" mode when ready

### **Step 3: Update Environment Variables**

**Backend (Heroku):**
```bash
heroku config:set PAYPAL_CLIENT_ID="new_business_client_id"
heroku config:set PAYPAL_CLIENT_SECRET="new_business_client_secret"
heroku config:set PAYPAL_MODE="live"
```

**Frontend (Vercel):**
Update in Vercel dashboard:
```
NEXT_PUBLIC_PAYPAL_CLIENT_ID=new_business_client_id
NEXT_PUBLIC_PAYPAL_MODE=live
```

---

## **Phase 5: Testing & Verification**

### **Step 1: Test Backend Endpoints**
```bash
curl https://your-heroku-app.herokuapp.com/api/health
```

### **Step 2: Test Frontend**
Visit your Vercel URL and test:
- Home page loads
- Booking form works
- Client portal login works
- Admin dashboard works

### **Step 3: Test Database Connection**
Check Heroku logs:
```bash
heroku logs --tail
```

### **Step 4: Test Email Service**
- Mailgun add-on should automatically work
- Check Mailgun dashboard for delivery status (control panel link in Heroku add-ons)

---

## **Environment Variables Summary**

### **Backend (Heroku):**
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dtprotection?retryWrites=true&w=majority
PAYPAL_CLIENT_ID=your_paypal_business_client_id
PAYPAL_CLIENT_SECRET=your_paypal_business_client_secret
PAYPAL_MODE=live  # or sandbox for testing
JWT_SECRET=your_super_secure_jwt_secret_key_minimum_32_characters
JWT_EXPIRES_IN=24h
NODE_ENV=production
EMAIL_PROVIDER=mailgun
EMAIL_FROM=noreply@your-mailgun-domain.com
EMAIL_FROM_NAME=DT Protection Services

# Auto-set by Mailgun add-on:
# MAILGUN_API_KEY
# MAILGUN_DOMAIN
# MAILGUN_SMTP_LOGIN
# MAILGUN_SMTP_PASSWORD
# MAILGUN_SMTP_PORT
# MAILGUN_SMTP_SERVER
```

### **Frontend (Vercel):**
```bash
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_business_client_id
NEXT_PUBLIC_PAYPAL_MODE=live
NEXT_PUBLIC_API_BASE_URL=https://your-heroku-app-name.herokuapp.com
```

---

## **Important Notes**

### **PayPal Business Account:**
- **Personal accounts cannot use REST API** for payment processing
- **Business verification** can take 2-5 business days
- **Sandbox mode** available for testing while waiting

### **Team Access Benefits:**
- **Shared billing** across team members
- **Collaborative development** and deployment
- **Shared environment variables** and add-ons
- **Team-wide monitoring** and logs

### **Security Considerations:**
- **JWT_SECRET** should be at least 32 characters
- **MongoDB password** should be strong and unique
- **PayPal credentials** should be kept secure
- **Environment variables** are encrypted in Heroku/Vercel

---

## **Deployment Order**

1. **MongoDB Atlas** (database setup)
2. **Heroku Backend** (API deployment)
3. **Vercel Frontend** (UI deployment)
4. **PayPal Business** (payment processing)
5. **Testing & Verification** (end-to-end testing)

---

## **Pro Tips**

- **Start with sandbox mode** for PayPal (easier testing)
- **Use Heroku logs** to debug any backend issues
- **Test email delivery** with Mailgun dashboard (access via Heroku add-ons)
- **Monitor MongoDB Atlas** for connection issues
- **Use team collaboration** features for easier management

---

## **Troubleshooting**

### **Common Issues:**

**Backend won't start:**
```bash
heroku logs --tail
# Check for missing environment variables or database connection issues
```

**Frontend can't connect to backend:**
- Verify `NEXT_PUBLIC_API_BASE_URL` is correct
- Check CORS settings in backend
- Ensure backend is running and accessible

**Database connection failed:**
- Verify MongoDB Atlas network access includes `0.0.0.0/0`
- Check connection string format
- Ensure database user has correct permissions

**PayPal integration not working:**
- Verify business account status
- Check API credentials are correct
- Ensure mode is set correctly (sandbox/live)

---

## **Support Resources**

- **Heroku**: https://help.heroku.com/
- **MongoDB Atlas**: https://docs.atlas.mongodb.com/
- **Vercel**: https://vercel.com/docs
- **PayPal Developer**: https://developer.paypal.com/docs/
- **Mailgun**: https://documentation.mailgun.com/

---

*Last updated: [Current Date]*
*Version: 1.0*
