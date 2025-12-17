# CI/CD FAQ - Partial Service Configuration

## Can CI/CD work if some services aren't configured?

**Yes!** The CI/CD pipeline is designed to work with partial service configuration. Tests gracefully skip when services aren't available.

## Which tests always run?

**Core functionality tests** that don't require external services:
- ✅ Authentication & Authorization
- ✅ Database Models
- ✅ API Route Structure
- ✅ Input Validation
- ✅ Business Logic Calculations
- ✅ Booking Management (without payments)

## Which tests skip when services aren't configured?

**Service-dependent tests** skip gracefully:
- ⏭️ PayPal tests (if `PAYPAL_CLIENT_ID` not set)
- ⏭️ Email sending tests (if `EMAIL_PROVIDER` not set)
- ⏭️ SMS tests (if `SMS_PROVIDER` not set)

## Will the pipeline fail if PayPal isn't configured?

**No!** The pipeline will:
1. ✅ Run all core tests
2. ⏭️ Skip PayPal tests (with clear messaging)
3. ✅ Build successfully
4. ✅ Deploy to Heroku

## How do I know which tests are being skipped?

Check the GitHub Actions logs. Skipped tests will show:
```
Skipping PayPal tests: PayPal is not configured. Skipping test.
```

## What happens when I add PayPal credentials later?

1. Add credentials to Heroku config
2. Add credentials to GitHub Secrets (optional, for CI)
3. Remove `.skipIf()` conditions from PayPal tests
4. Tests will automatically start running

## Can I deploy without PayPal configured?

**Yes!** The app deploys successfully. Payment features simply won't work until credentials are added.

## How do I add tests for a new service?

1. Create test file in `tests/services/`
2. Use service check utility to conditionally skip
3. Tests will automatically skip until service is configured
4. Remove skip condition when ready

## Example: Current Status

Based on your [Heroku config](https://gist.github.com/msands/d68023d6db20a371a83e4df0489b5bca):

| Service | Configured? | Tests Run? |
|---------|-------------|------------|
| MongoDB | ✅ Yes | ✅ Yes |
| JWT Auth | ✅ Yes | ✅ Yes |
| Mailgun | ✅ Yes | ⏭️ Skip (EMAIL_PROVIDER not set) |
| PayPal | ❌ No | ⏭️ Skip |
| SMS | ❌ No | ⏭️ Skip |

## Quick Fixes

### Enable Email Tests

```bash
heroku config:set EMAIL_PROVIDER="mailgun"
heroku config:set EMAIL_FROM="dtprotected@sandbox9ffc865629c74b66b067bf25affa9005.mailgun.org"
```

### Enable PayPal Tests (when credentials available)

```bash
heroku config:set PAYPAL_CLIENT_ID="your_client_id"
heroku config:set PAYPAL_CLIENT_SECRET="your_client_secret"
```

Then update tests to remove skip conditions.

## Resources

- [Progressive Testing Strategy](./progressive-testing-strategy.md)
- [CI/CD Setup Guide](./ci-cd-setup.md)
- [Testing Strategy](./testing-strategy.md)

