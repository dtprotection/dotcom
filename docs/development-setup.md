# Development Environment Setup Guide

This guide will help you set up your development environment for the DT Protection booking system. This project uses a modern tech stack with both frontend and backend components.

## 📋 Prerequisites

### macOS Requirements

This guide assumes you're using macOS. The primary package manager used is **Homebrew**, which simplifies installation and management of development tools.

---

## 🍺 Step 1: Install Homebrew

Homebrew is the package manager for macOS and is required for installing most development tools.

### Check if Homebrew is installed:
```bash
brew --version
```

### If not installed, install Homebrew:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Follow the on-screen instructions. After installation, you may need to add Homebrew to your PATH:
```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
source ~/.zshrc
```

---

## 🛠️ Step 2: Install Core Development Tools

### Node.js and npm

The project requires Node.js (LTS version recommended) and npm (comes with Node.js).

```bash
# Install Node.js using Homebrew
brew install node

# Verify installation
node --version
npm --version
```

**Note:** The project uses:
- Node.js (LTS version recommended)
- npm (comes bundled with Node.js)

### Git

Git is required for version control and deployment.

```bash
# Install Git using Homebrew
brew install git

# Verify installation
git --version

# Configure Git (if not already done)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

---

## 🎨 Step 3: Install IDE and Editor Tools

### Cursor (Recommended IDE)

**Cursor** is the recommended IDE for this project. It provides AI-powered assistance and excellent TypeScript/React support.

1. Download Cursor from: https://cursor.sh/
2. Install the application
3. Open the project folder in Cursor

**Alternative:** You can use VS Code or any other editor, but Cursor is optimized for this workflow.

---

## 🧪 Step 4: Install Testing Tools

### Vitest (Test Runner)

Vitest is used for running the test suite. It's installed as a dev dependency via npm, but you may want the CLI globally:

```bash
# Install Vitest globally (optional, but useful)
npm install -g vitest

# Verify installation
vitest --version
```

---

## 🚀 Step 5: Install Deployment Tools

### Heroku CLI

Required for deploying the backend to Heroku.

```bash
# Install Heroku CLI using Homebrew
brew tap heroku/brew && brew install heroku

# Verify installation
heroku --version

# Login to Heroku
heroku login
```

### Vercel CLI

Required for deploying the frontend to Vercel.

```bash
# Install Vercel CLI using Homebrew
brew install vercel-cli

# Verify installation
vercel --version

# Login to Vercel
vercel login
```

---

## 🔐 Step 6: Install Security Tools

### OpenSSL

Used for generating secure secrets (JWT secrets, etc.). Usually comes pre-installed on macOS, but you can ensure it's available:

```bash
# Check if OpenSSL is available
openssl version

# If not available, install via Homebrew
brew install openssl
```

---

## 📦 Step 7: Install Project Dependencies

### Clone the Repository

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd dotcom
```

### Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

### Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

### Install Test Dependencies

```bash
cd tests
npm install
cd ..
```

---

## ⚙️ Step 8: Environment Configuration

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
cd backend
touch .env
```

Add the following variables (see `backend/README.md` for details):
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h
NODE_ENV=development
EMAIL_PROVIDER=mailgun
EMAIL_FROM=noreply@your-domain.com
EMAIL_FROM_NAME=DT Protection Services
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox
```

### Frontend Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```bash
cd frontend
touch .env.local
```

Add the following variables:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id
NEXT_PUBLIC_PAYPAL_MODE=sandbox
```

---

## ✅ Step 9: Verify Installation

### Check All Tools

Run these commands to verify everything is installed correctly:

```bash
# Core tools
node --version
npm --version
git --version

# Deployment tools
heroku --version
vercel --version

# Security tools
openssl version

# Testing tools (if installed globally)
vitest --version
```

### Test the Setup

1. **Start the backend:**
   ```bash
   cd backend
   npm run dev
   ```
   Backend should start on `http://localhost:3001`

2. **Start the frontend (in a new terminal):**
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend should start on `http://localhost:3000`

3. **Run tests:**
   ```bash
   cd tests
   npm test
   ```

---

## 📚 Technology Stack Summary

### Core Technologies
- **Node.js** - JavaScript runtime
- **TypeScript** - Type-safe JavaScript
- **Git** - Version control

### Frontend Stack
- **Next.js 15.2.4** - React framework
- **React 19** - UI library
- **Tailwind CSS 4** - Styling framework
- **ESLint** - Code linting
- **PostCSS** - CSS processing

### Backend Stack
- **Express** - Web framework
- **MongoDB/Mongoose** - Database and ODM
- **TypeScript** - Type-safe development
- **Nodemon** - Development server auto-reload
- **Jest** - Testing framework

### Testing Stack
- **Vitest** - Test runner
- **Testing Library** - React component testing
- **Supertest** - API endpoint testing

### Deployment Tools
- **Heroku CLI** - Backend deployment
- **Vercel CLI** - Frontend deployment

### Development Tools
- **Cursor** - Recommended IDE
- **Homebrew** - Package manager
- **OpenSSL** - Security utilities

---

## 🐛 Troubleshooting

### Node.js Version Issues

If you encounter version conflicts, consider using `nvm` (Node Version Manager):

```bash
# Install nvm via Homebrew
brew install nvm

# Add to your shell profile
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
echo '[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && . "/opt/homebrew/opt/nvm/nvm.sh"' >> ~/.zshrc
source ~/.zshrc

# Install and use Node.js LTS
nvm install --lts
nvm use --lts
```

### Permission Issues

If you encounter permission errors with npm:

```bash
# Fix npm permissions (if needed)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc
```

### Port Already in Use

If ports 3000 or 3001 are already in use:

```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process (replace PID with actual process ID)
kill -9 <PID>

# Or use a different port
# For Next.js: PORT=3001 npm run dev
# For Express: Update the port in backend/src/index.ts
```

### MongoDB Connection Issues

- Ensure MongoDB Atlas network access includes your IP
- Verify the connection string format
- Check that the database user has correct permissions

---

## 📖 Additional Resources

- **Homebrew Documentation**: https://docs.brew.sh/
- **Node.js Documentation**: https://nodejs.org/docs/
- **Next.js Documentation**: https://nextjs.org/docs
- **TypeScript Documentation**: https://www.typescriptlang.org/docs/
- **Heroku CLI Documentation**: https://devcenter.heroku.com/articles/heroku-cli
- **Vercel Documentation**: https://vercel.com/docs
- **Cursor Documentation**: https://cursor.sh/docs

---

## 🎯 Quick Start Commands

Once everything is set up, you can use these commands:

```bash
# Start both frontend and backend (from project root)
./start-all.sh

# Or start individually:
cd backend && npm run dev
cd frontend && npm run dev

# Run tests
cd tests && npm test

# Build for production
cd backend && npm run build
cd frontend && npm run build
```

---

*Last updated: [Current Date]*
*Version: 1.0*

