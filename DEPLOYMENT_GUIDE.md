# Vercel Deployment Guide

This guide will help you deploy your Dezi-Agent project to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub/GitLab/Bitbucket Account**: Your code should be in a Git repository
3. **Database**: Set up a PostgreSQL database (recommended: Supabase, Neon, or Railway)
4. **API Keys**: Gather all required API keys (see ENVIRONMENT_VARIABLES.md)

## Step 1: Prepare Your Database

1. Set up a PostgreSQL database
2. Run the Prisma migrations:
   ```bash
   npx prisma migrate deploy
   ```
3. Note down your database connection string

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Connect Repository**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your Git repository
   - Vercel will automatically detect it's a Next.js project

2. **Configure Project**:
   - Project Name: Choose a name for your project
   - Framework Preset: Next.js (should be auto-detected)
   - Root Directory: Leave as default (if your project is in the root)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

3. **Set Environment Variables**:
   - Before deploying, add all required environment variables
   - Go to Settings > Environment Variables
   - Add each variable from ENVIRONMENT_VARIABLES.md
   - Make sure to set the correct environment (Production, Preview, Development)

4. **Deploy**:
   - Click "Deploy"
   - Vercel will build and deploy your application

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Follow the prompts**:
   - Link to existing project or create new
   - Set environment variables when prompted

## Step 3: Configure Custom Domain (Optional)

1. Go to your project dashboard in Vercel
2. Navigate to Settings > Domains
3. Add your custom domain
4. Configure DNS settings as instructed

## Step 4: Set Up Database Migrations

After deployment, you need to run database migrations:

1. **Option A: Via Vercel Dashboard**:
   - Go to your project dashboard
   - Navigate to Functions > View Function Logs
   - Run migrations manually or set up a build hook

2. **Option B: Via Vercel CLI**:
   ```bash
   vercel env pull .env.local
   npx prisma migrate deploy
   ```

## Step 5: Verify Deployment

1. Check your deployed URL
2. Test all major functionality
3. Check Vercel function logs for any errors
4. Verify environment variables are working

## Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Check build logs in Vercel dashboard
   - Ensure all dependencies are in package.json
   - Verify TypeScript compilation

2. **Database Connection Issues**:
   - Verify DATABASE_URL is correct
   - Check if database allows external connections
   - Ensure Prisma client is generated

3. **Environment Variables**:
   - Double-check all variables are set correctly
   - Ensure variables are set for the right environment
   - Check for typos in variable names

4. **API Route Issues**:
   - Check function logs in Vercel dashboard
   - Verify API routes are in the correct location
   - Check for server-side only code in client components

### Getting Help:

- Check Vercel documentation: [vercel.com/docs](https://vercel.com/docs)
- View build logs in your Vercel dashboard
- Check function logs for API route issues
- Review the Next.js deployment guide

## Post-Deployment Checklist

- [ ] All environment variables are set
- [ ] Database migrations are applied
- [ ] All API routes are working
- [ ] Authentication is functioning
- [ ] File uploads work (if applicable)
- [ ] Webhooks are configured (Stripe, etc.)
- [ ] Custom domain is configured (if needed)
- [ ] SSL certificate is active
- [ ] Performance is acceptable
- [ ] Error monitoring is set up 