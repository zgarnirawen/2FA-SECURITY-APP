# Recovery Application - Next.js

A secure recovery application built with Next.js, featuring two-factor authentication (2FA) and recovery codes for enhanced account protection.

---

## Overview

This application provides a robust authentication system combining JWT-based login, TOTP-based two-factor authentication, and emergency recovery codes. It is designed with security best practices, modern UI components, and scalable architecture.

---

## Features

* Secure authentication (register and login with JWT)
* Two-factor authentication (2FA) using TOTP (Google Authenticator)
* Recovery codes for emergency access
* Modern and responsive UI (shadcn/ui + Tailwind CSS)
* Data validation with Zod
* MongoDB database with Mongoose

---

## Prerequisites

* Node.js (v18 or higher)
* MongoDB (local or cloud)
* npm or yarn

---

## Installation

### Clone the Repository

```bash
git clone <repository-url>
cd my-recovery-app
```

### Install Dependencies

```bash
npm install
```

### Environment Configuration

Create a `.env.local` file at the root:

```env
MONGODB_URL=mongodb://127.0.0.1:27017/next-js-app
JWT_SECRET=your_secure_jwt_secret
NODE_ENV=development
```

### Start MongoDB

**Windows**

```powershell
net start MongoDB
```

**macOS / Linux**

```bash
sudo systemctl start mongod
# or
brew services start mongodb/brew/mongodb-community
```

### Run the Application

```bash
npm run dev
```

Application URL: http://localhost:3000

---

## Project Structure

```id="m0k6zz"
src/
├── app/
│   ├── (auth)/          
│   ├── (dashboard)/     
│   └── api/            
├── components/
│   ├── forms/          
│   ├── modals/         
│   ├── sections/       
│   └── ui/            
├── lib/
│   ├── actions/        
│   ├── database/       
│   ├── utils.ts        
│   └── validations.ts  
└── types/              
```

---

## Security

### Two-Factor Authentication (2FA)

* TOTP-based authentication using Google Authenticator
* QR code setup and token verification
* Mandatory verification for future logins

### Recovery Codes

* 16 unique, single-use codes
* Securely stored in the database
* Used when 2FA device is unavailable

### Password Security

* Password hashing with bcrypt
* Minimum strength validation
* No plaintext storage

---

## API Routes

### Authentication

* POST `/api/register`
* POST `/api/login`
* GET `/api/profile`

### Two-Factor Authentication

* POST `/api/twofa`
* PUT `/api/twofa`
* GET `/api/twofa`
* DELETE `/api/twofa`

### Recovery Codes

* POST `/api/recovery-codes`
* GET `/api/recovery-codes`
* PUT `/api/recovery-codes`

---

## Troubleshooting

* Ensure MongoDB is running
* Verify environment variables
* Check database connection string
* Restart the development server after changes

---

## Deployment

### Production Environment Variables

```env
MONGODB_URL=mongodb+srv://user:password@cluster.mongodb.net/production
JWT_SECRET=strong_production_secret
NODE_ENV=production
```

### Steps

```bash
npm run build
npm start
```

Deploy using platforms such as Vercel or Netlify.

---

## Best Practices

* Use HTTPS in production
* Rotate JWT secrets regularly
* Monitor authentication attempts
* Backup the database frequently
* Keep dependencies updated

