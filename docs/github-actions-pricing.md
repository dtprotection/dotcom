# GitHub Actions Pricing Analysis

## Free Tier Limits

### Private Repositories
- **GitHub Free**: 2,000 minutes/month
- **GitHub Pro**: 3,000 minutes/month
- **GitHub Team**: 3,000 minutes/month

### Public Repositories
- **Unlimited** - Standard GitHub-hosted runners are free

### Minute Multipliers
- **Linux** (ubuntu-latest): **1x** (most efficient)
- **Windows**: 2x multiplier
- **macOS**: 10x multiplier

**Your workflow uses `ubuntu-latest` (Linux)**, so minutes count 1:1. ✅

## Your Workflow Analysis

### Job Breakdown

| Job | Estimated Runtime | Runs On |
|-----|------------------|---------|
| **lint** | 3-5 minutes | Every PR + Push to main |
| **test** | 5-8 minutes | Every PR + Push to main |
| **build** | 4-6 minutes | Every PR + Push to main |
| **deploy** | 2-4 minutes | Push to main only |

### Per Workflow Run Estimates

**Pull Request** (lint + test + build):
- Sequential execution: ~12-19 minutes
- Since `build` waits for `lint` and `test`, total is sum of all three

**Push to Main** (lint + test + build + deploy):
- Sequential execution: ~14-23 minutes
- `deploy` waits for all previous jobs

### Monthly Usage Estimates

**Conservative Estimate** (10 PRs + 10 merges/month):
- 10 PRs × 15 min = 150 minutes
- 10 merges × 18 min = 180 minutes
- **Total: ~330 minutes/month** ✅ Well within free tier

**Moderate Usage** (20 PRs + 20 merges/month):
- 20 PRs × 15 min = 300 minutes
- 20 merges × 18 min = 360 minutes
- **Total: ~660 minutes/month** ✅ Still within free tier

**Heavy Usage** (50 PRs + 50 merges/month):
- 50 PRs × 15 min = 750 minutes
- 50 merges × 18 min = 900 minutes
- **Total: ~1,650 minutes/month** ✅ Still within free tier

**Very Heavy Usage** (100+ PRs + 100+ merges/month):
- Would exceed 2,000 minutes
- Cost: ~$0.008 per minute over limit (Linux)

## Cost Analysis

### If You Exceed Free Tier

**Linux runners**: $0.008 per minute

Example: 2,500 minutes used (500 over limit)
- Cost: 500 × $0.008 = **$4.00/month**

### Comparison to Other Runners

If you used Windows (2x multiplier):
- Same workflow = 2x minutes consumed
- Would hit limit faster

If you used macOS (10x multiplier):
- Same workflow = 10x minutes consumed
- Would hit limit very quickly

**Stick with Linux!** ✅

## Optimization Tips

### 1. Use Caching (Already Implemented)
Your workflow already uses:
```yaml
cache: 'npm'
```
This speeds up `npm ci` significantly, reducing runtime.

### 2. Run Jobs in Parallel Where Possible
Your workflow already does this:
- `lint` and `test` can run in parallel (but `build` waits for both)
- This is optimal

### 3. Skip Optional Steps
You could make coverage optional:
```yaml
- name: Generate test coverage
  run: cd tests && npm run test:coverage
  continue-on-error: true  # ✅ Already set
```

### 4. Conditional Deployment
Only deploy on main branch (already implemented):
```yaml
if: github.ref == 'refs/heads/main' && github.event_name == 'push'
```

### 5. Matrix Strategy (If Needed)
If you need to test multiple Node versions, use matrix:
```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x]
```
But this multiplies minutes, so only if necessary.

## Monitoring Usage

### Check Your Usage
1. Go to: **Settings** → **Billing and plans** → **Actions**
2. View monthly usage
3. Set spending limits if desired

### Set Spending Limits
1. Go to: **Settings** → **Billing and plans** → **Spending limits**
2. Set limit for Actions (e.g., $10/month)
3. GitHub will notify you at 50%, 75%, 90%, and 100%

## Recommendations

### ✅ You're Good to Go!

Your current workflow is **very efficient**:
- ✅ Uses Linux (1x multiplier)
- ✅ Uses caching
- ✅ Runs jobs in parallel where possible
- ✅ Only deploys when needed
- ✅ Estimated ~330-660 minutes/month for normal usage

### If You're Concerned

1. **Monitor for first month** - Check actual usage
2. **Set spending limit** - Prevent unexpected charges
3. **Optimize if needed** - But you're already well-optimized

### If Repository is Public

If you make your repository public:
- **Unlimited free minutes** for standard runners
- No need to worry about limits

## Real-World Example

Based on typical development:
- **Small team** (1-2 developers): ~200-400 min/month ✅
- **Medium team** (3-5 developers): ~500-1,000 min/month ✅
- **Large team** (10+ developers): ~1,500-2,500 min/month ⚠️

Your workflow should easily stay within free tier for small to medium teams.

## Summary

| Scenario | Minutes/Month | Cost |
|----------|---------------|------|
| **Conservative** (10 PRs + 10 merges) | ~330 | **$0** ✅ |
| **Moderate** (20 PRs + 20 merges) | ~660 | **$0** ✅ |
| **Heavy** (50 PRs + 50 merges) | ~1,650 | **$0** ✅ |
| **Very Heavy** (100+ PRs + merges) | ~3,000+ | **~$8/month** |

**Bottom Line**: Your workflow is well-optimized and should easily stay within the free tier for normal usage. Even heavy usage would only cost a few dollars per month.

