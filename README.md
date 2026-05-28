# Student Portal

Full-stack MERN starter with a Vite React client and an Express/MongoDB API.

## Local Setup

1. Install dependencies:

   ```bash
   npm run install:all
   ```

2. Create backend environment file:

   ```bash
   copy server\.env.example server\.env
   ```

3. Update `server/.env` with your MongoDB Atlas URI and JWT secret.

4. Start the backend:

   ```bash
   npm run server
   ```

5. Start the frontend in another terminal:

   ```bash
   npm run client
   ```

Frontend: http://localhost:5173
Backend: http://localhost:5000

## Deployment

Deploy the backend from `server` on Render and the frontend from `client` on Vercel.
