# DT Protection Website

This repository contains both the frontend and backend code for the DT Protection website, a platform for booking armed security services in India.

## Project Structure

```
.
├── frontend/          # Next.js frontend application
├── backend/          # Node.js/Express backend API
└── README.md         # This file
```

## Quick Start

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd dtprotection
   ```

2. Set up the backend:
   ```bash
   cd backend
   npm install
   # Create .env file (see backend/README.md)
   npm run dev
   ```

3. Set up the frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. Access the applications:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## Development

- The frontend is built with Next.js and Tailwind CSS
- The backend is built with Node.js, Express, and TypeScript
- Both applications have their own README files with detailed setup instructions

## Features

- Modern, responsive website design
- Booking system for security services
- Payment processing with Stripe
- Email notifications
- Admin dashboard for managing bookings

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## License

[Add your license information here] 