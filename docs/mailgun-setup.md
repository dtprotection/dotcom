# Mailgun Email Service Setup

## Overview

The application uses Mailgun for email delivery. When you add the Mailgun add-on to Heroku, it automatically configures the necessary environment variables.

## Heroku Add-on Installation

```bash
cd backend
heroku addons:create mailgun:starter
```

## Automatic Environment Variables

The Mailgun add-on automatically sets these variables:

```bash
MAILGUN_API_KEY          # Your Mailgun API key
MAILGUN_DOMAIN           # Your Mailgun sending domain
MAILGUN_SMTP_LOGIN       # SMTP username
MAILGUN_SMTP_PASSWORD    # SMTP password
MAILGUN_SMTP_PORT        # SMTP port (usually 587)
MAILGUN_SMTP_SERVER      # SMTP server (smtp.mailgun.org)
```

## Required Manual Configuration

You need to set these additional variables:

```bash
heroku config:set EMAIL_PROVIDER="mailgun"
heroku config:set EMAIL_FROM="noreply@your-mailgun-domain.com"
heroku config:set EMAIL_FROM_NAME="DT Protection Services"
```

### Important Notes:

1. **EMAIL_FROM domain**: Must match your Mailgun domain (check Mailgun dashboard)
2. **Mailgun Starter Plan**: Includes 5,000 emails/month free
3. **Domain Verification**: You may need to verify your domain in the Mailgun dashboard

## Verify Configuration

```bash
# Check all Mailgun variables
heroku config | grep MAILGUN

# Check email configuration
heroku config | grep EMAIL
```

## Access Mailgun Dashboard

```bash
# Open Mailgun dashboard from Heroku
heroku addons:open mailgun
```

## How It Works

The application's email service (`backend/src/services/email.service.ts`) automatically detects and uses Mailgun when:

1. `EMAIL_PROVIDER` is set to `mailgun` (or not set, as it's the default)
2. Mailgun SMTP credentials are available in environment variables

## Email Templates

The application includes pre-built email templates for:

- **Booking Confirmations**: Sent when a new booking is created
- **Payment Reminders**: Sent when payment is due
- **Invoice Notifications**: Sent when invoices are generated
- **Status Updates**: Sent when booking status changes

## Testing Email Delivery

### Method 1: Via API
```bash
# Test email endpoint (requires admin authentication)
curl -X POST https://your-app.herokuapp.com/api/communication/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com"}'
```

### Method 2: Check Logs
```bash
# Monitor logs for email sending
heroku logs --tail | grep -i email
```

### Method 3: Mailgun Dashboard
- Go to Mailgun dashboard
- Check "Logs" section for delivery status
- View sent emails, bounces, and failures

## Troubleshooting

### Issue: Emails not sending

**Check 1**: Verify Mailgun add-on is installed
```bash
heroku addons | grep mailgun
```

**Check 2**: Verify environment variables are set
```bash
heroku config | grep -E '(MAILGUN|EMAIL)'
```

**Check 3**: Check application logs
```bash
heroku logs --tail
```

### Issue: "Domain not verified"

**Solution**: 
1. Open Mailgun dashboard: `heroku addons:open mailgun`
2. Go to "Sending" → "Domains"
3. Add DNS records to your domain
4. Wait for verification (can take up to 24 hours)

### Issue: "From address doesn't match domain"

**Solution**: Update EMAIL_FROM to match your Mailgun domain:
```bash
# Check your Mailgun domain
heroku config:get MAILGUN_DOMAIN

# Update EMAIL_FROM
heroku config:set EMAIL_FROM="noreply@YOUR_MAILGUN_DOMAIN"
```

### Issue: SMTP authentication failed

**Solution**: Mailgun credentials are auto-set, but you can verify:
```bash
heroku config | grep MAILGUN_SMTP
```

If missing, remove and re-add the add-on:
```bash
heroku addons:destroy mailgun
heroku addons:create mailgun:starter
```

## Mailgun Sandbox vs. Production

### Sandbox Mode (Default)
- **Limited**: Can only send to authorized recipients
- **Free**: Included in starter plan
- **Setup**: Add authorized recipients in Mailgun dashboard

### Production Mode
- **Unlimited**: Send to any email address
- **Requires**: Domain verification
- **Setup**: Add and verify your custom domain

## Upgrading Mailgun Plan

If you need more than 5,000 emails/month:

```bash
# View available plans
heroku addons:plans mailgun

# Upgrade to a higher tier
heroku addons:upgrade mailgun:concept
```

## Alternative: Custom Domain Setup

For better deliverability, use your own domain:

1. **Add Domain in Mailgun**:
   - Go to Mailgun dashboard → Sending → Domains
   - Click "Add New Domain"
   - Enter your domain (e.g., `mg.dtprotection.com`)

2. **Add DNS Records**:
   - Copy the DNS records from Mailgun
   - Add them to your domain's DNS settings
   - Wait for verification

3. **Update Environment Variables**:
   ```bash
   heroku config:set EMAIL_FROM="noreply@mg.dtprotection.com"
   ```

## Security Best Practices

1. **Never commit** Mailgun credentials to Git
2. **Use environment variables** only
3. **Rotate API keys** periodically
4. **Monitor usage** in Mailgun dashboard
5. **Set up alerts** for suspicious activity

## Support Resources

- **Mailgun Documentation**: https://documentation.mailgun.com/
- **Heroku Mailgun Add-on**: https://devcenter.heroku.com/articles/mailgun
- **Mailgun Support**: support@mailgun.com

---

*Last updated: October 2025*
*Version: 1.0*

