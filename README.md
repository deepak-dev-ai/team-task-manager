# Team Task Manager

A full-stack collaborative project management application built with Next.js, Prisma, and NextAuth.

## Features

- **User Authentication:** Secure login and signup using NextAuth.
- **Project Management:** Create projects, add members with Role-Based Access Control (Admin/Member).
- **Task Management:** Create, assign, and update tasks with status (To Do, In Progress, Done) and priority.
- **Dashboard:** Overview of total tasks, tasks by status, overdue tasks, and personal workload.
- **Role-Based Access:** Admins can manage projects and members; Members can view and update assigned tasks.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Database ORM:** Prisma
- **Database:** SQLite (Development) / PostgreSQL (Production on Railway)
- **Authentication:** NextAuth.js (Credentials Provider with bcrypt)
- **Styling:** Tailwind CSS

## Local Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up the Database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Set Environment Variables:**
   Ensure your `.env` file contains:
   ```env
   NEXTAUTH_SECRET="your-development-secret"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

## Deployment to Railway

To deploy this application to Railway, follow these steps:

1. **Push to GitHub:**
   - Create a new repository on GitHub.
   - Commit and push the code:
     ```bash
     git add .
     git commit -m "Initial commit"
     git branch -M main
     git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
     git push -u origin main
     ```

2. **Deploy on Railway:**
   - Go to [Railway Dashboard](https://railway.app/dashboard).
   - Click **New Project** -> **Deploy from GitHub repo**.
   - Select your newly created repository.

3. **Add PostgreSQL Database:**
   - In your Railway project, click **New** -> **Database** -> **Add PostgreSQL**.
   - Railway will provision a Postgres database.

4. **Configure Environment Variables in Railway:**
   - Go to your Next.js application service in Railway.
   - Click on the **Variables** tab.
   - Add the following variables:
     - `DATABASE_URL`: Set this to the connection string of the PostgreSQL database provided by Railway (e.g., `postgresql://...`).
     - `NEXTAUTH_SECRET`: Generate a random string (e.g., using `openssl rand -base64 32`) and paste it here.
     - `NEXTAUTH_URL`: Set this to the public URL provided by Railway once the app is deployed (e.g., `https://your-app-url.up.railway.app`).

5. **Update Prisma Schema for Production (Important):**
   - Before pushing to Railway, if you want to use PostgreSQL, change the provider in `prisma/schema.prisma` from `"sqlite"` to `"postgresql"`.
   - Update your repository with this change so Railway builds it correctly for Postgres.

6. **Trigger Deployment:**
   - Railway will automatically build and deploy your application. You can view the live app from the public URL.
