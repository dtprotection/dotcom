# CI/CD Setup Guide

## Overview

This project uses GitHub Actions for continuous integration and deployment to Heroku. The CI/CD pipeline automatically runs tests, builds the application, and deploys to production when code is merged to the `main` branch.

## GitHub Actions vs Post-Merge Hook

### Why GitHub Actions?

✅ **Better Choice** - GitHub Actions is recommended over post-merge hooks because:

1. **Test Before Deploy**: Tests run automatically before deployment, preventing broken code from reaching production
2. **Visibility**: All team members can see test results, build status, and deployment logs
3. **Control**: Easy to configure conditions (only deploy if tests pass)
4. **Maintainability**: Version-controlled workflow files, easy to update
5. **Notifications**: Built-in notifications for failures
6. **Parallel Execution**: Can run multiple jobs in parallel
7. **Rollback**: Easier to identify and rollback problematic deployments

### Post-Merge Hook Limitations

❌ **Not Recommended** because:
- No visibility into what's being deployed
- No way to prevent deployment if tests fail
- Harder to debug issues
- No build verification
- Limited error handling

## Pipeline Overview

The CI/CD pipeline consists of 4 stages:

1. **Lint & Type Check** - Verifies code quality
2. **Test** - Runs all unit and integration tests
3. **Build** - Compiles TypeScript and builds Next.js
4. **Deploy** - Deploys to Heroku (only on main branch)

## Setup Instructions

### 1. GitHub Secrets Configuration

You need to configure the following secrets in your GitHub repository:

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add the following secrets:

#### Required Secrets

- `HEROKU_API_KEY`: Your Heroku API key
  - Get it from: https://dashboard.heroku.com/account
  - Click "Reveal" next to API Key

- `HEROKU_APP_NAME`: Your Heroku app name
  - Example: `dtprotection-app`

- `HEROKU_EMAIL`: Your Heroku account email
  - The email associated with your Heroku account

#### Optional Secrets

- `NEXT_PUBLIC_API_URL`: Frontend API URL (for build)
  - Example: `https://dtprotection-app.herokuapp.com`

- `CODECOV_TOKEN`: Code coverage token (if using Codecov)
  - Get from: https://codecov.io

### 2. Heroku API Key Setup

```bash
# Get your Heroku API key
heroku auth:token

# Or from the dashboard:
# https://dashboard.heroku.com/account → API Key section
```

### 3. Verify Workflow File

The workflow file is located at:
```
.github/workflows/ci-cd.yml
```

Make sure it's committed to your repository.

### 4. Test the Pipeline

#### Test on Pull Request

1. Create a pull request to `main`
2. The pipeline will run lint, test, and build (but not deploy)
3. Check the **Actions** tab in GitHub to see results

#### Test Deployment

1. Merge a pull request to `main` (or push directly to `main`)
2. The pipeline will run all stages including deployment
3. Monitor the deployment in the **Actions** tab

## Workflow Details

### Lint Job

- Runs ESLint on frontend code
- Type checks backend TypeScript
- Type checks frontend TypeScript
- Fails if any errors found

### Test Job

- Sets up MongoDB service container
- Installs dependencies
- Runs all tests from `tests/` directory
- Generates coverage reports
- Uploads coverage to Codecov (optional)

### Build Job

- Only runs if lint and test pass
- Builds backend TypeScript
- Builds Next.js frontend
- Verifies build artifacts exist

### Deploy Job

- Only runs on `main` branch pushes
- Only runs if all previous jobs pass
- Deploys to Heroku using Heroku CLI
- Uses the Procfile for process definition

## Manual Deployment

If you need to deploy manually:

```bash
# Deploy to Heroku
git push heroku main

# Or using Heroku CLI
heroku git:remote -a your-app-name
git push heroku main
```

## Troubleshooting

### Tests Failing

1. Check test logs in GitHub Actions
2. Run tests locally: `cd tests && npm run test:run`
3. Verify MongoDB connection in test environment
4. Check environment variables

### Build Failing

1. Check build logs in GitHub Actions
2. Run build locally: `npm run build`
3. Verify all dependencies are installed
4. Check TypeScript errors

### Deployment Failing

1. Verify Heroku secrets are correct
2. Check Heroku app name matches
3. Verify Heroku API key is valid
4. Check Heroku logs: `heroku logs --tail`

### MongoDB Connection Issues in CI

The workflow uses a MongoDB service container. If tests fail:
- Verify MongoDB service is running
- Check connection string in test environment
- Ensure test database is properly isolated

## Best Practices

### Branch Protection

Enable branch protection on `main`:
1. Go to **Settings** → **Branches**
2. Add rule for `main` branch
3. Require status checks to pass
4. Require pull request reviews

### Commit Messages

Use clear commit messages:
- `feat: Add new booking feature`
- `fix: Resolve payment processing bug`
- `test: Add integration tests for admin routes`
- `docs: Update deployment guide`

### Testing Before Push

Always test locally before pushing:
```bash
# Run tests
cd tests && npm run test:run

# Run linting
npm run lint

# Build locally
npm run build
```

## Monitoring

### GitHub Actions Dashboard

- View all workflow runs: **Actions** tab
- See detailed logs for each job
- Download artifacts (if configured)
- Re-run failed jobs

### Heroku Dashboard

- Monitor app metrics
- View logs: `heroku logs --tail`
- Check dyno status
- Monitor add-ons

## Future Enhancements

Potential improvements to the CI/CD pipeline:

1. **Staging Environment**: Deploy to staging before production
2. **E2E Tests**: Add Playwright or Cypress tests
3. **Performance Tests**: Add load testing
4. **Security Scanning**: Add dependency vulnerability scanning
5. **Notifications**: Slack/Discord notifications on deployment
6. **Rollback**: Automated rollback on health check failure
7. **Blue-Green Deployment**: Zero-downtime deployments

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Heroku Deployment Guide](https://devcenter.heroku.com/articles/git)
- [Vitest Documentation](https://vitest.dev/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

