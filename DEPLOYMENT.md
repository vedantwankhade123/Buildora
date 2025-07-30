# Dezi-Agent Platform Deployment Guide

## Deploy to Vercel

This guide will help you deploy the Dezi-Agent platform to Vercel, which is the recommended hosting platform for Next.js applications.

### Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Database**: Set up a PostgreSQL database (recommended: Supabase, Neon, or Railway)
3. **Environment Variables**: Prepare all required environment variables

### Step 1: Database Setup

You'll need a PostgreSQL database. Recommended options:

#### Option A: Supabase (Recommended)
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Get your database URL from Settings > Database
4. Run the Prisma migrations:
   ```bash
   npx prisma db push
   ```

#### Option B: Neon
1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Get your database URL from the dashboard

### Step 2: Environment Variables

You'll need to set these environment variables in Vercel:

#### Required Variables:
```
DATABASE_URL=postgresql://username:password@host:port/database
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
GEMINI_API_KEY=your-google-ai-api-key
NEXTAUTH_SECRET=your-random-secret-key
NEXTAUTH_URL=https://your-domain.vercel.app
```

#### Optional Variables (if using Stripe):
```
STRIPE_SECRET_KEY=your-stripe-secret-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
```

### Step 3: Deploy to Vercel

#### Method 1: Deploy via Vercel CLI
1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel --prod
   ```

#### Method 2: Deploy via GitHub Integration
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Configure environment variables
6. Deploy

### Step 4: Configure Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add all the required environment variables listed above
4. Redeploy the project

### Step 5: Database Migration

After deployment, run the database migrations:

1. Go to your Vercel project dashboard
2. Navigate to Functions > View Function Logs
3. The Prisma migrations should run automatically during build

### Step 6: Verify Deployment

1. Check that your application is running at your Vercel URL
2. Test the main functionality
3. Check the function logs for any errors

### Troubleshooting

#### Common Issues:

1. **Database Connection Errors**:
   - Verify your DATABASE_URL is correct
   - Ensure your database allows connections from Vercel's IP ranges
   - Check that the database exists and is accessible

2. **Build Errors**:
   - Check the build logs in Vercel dashboard
   - Ensure all dependencies are properly installed
   - Verify TypeScript compilation

3. **Environment Variable Issues**:
   - Double-check all environment variable names and values
   - Ensure sensitive variables are not exposed in client-side code
   - Redeploy after adding new environment variables

#### Performance Optimization:

1. **Database**: Use connection pooling (Prisma Accelerate recommended)
2. **Images**: Optimize images and use Next.js Image component
3. **Caching**: Implement proper caching strategies
4. **CDN**: Vercel automatically provides global CDN

### Monitoring and Analytics

1. **Vercel Analytics**: Enable in your project settings
2. **Error Tracking**: Set up error monitoring (Sentry recommended)
3. **Performance Monitoring**: Use Vercel's built-in performance insights

### Security Considerations

1. **Environment Variables**: Never commit sensitive data to version control
2. **API Keys**: Rotate API keys regularly
3. **Database**: Use strong passwords and enable SSL connections
4. **CORS**: Configure CORS properly for your domain

### Support

If you encounter issues:
1. Check Vercel's documentation: [vercel.com/docs](https://vercel.com/docs)
2. Review the build logs in your Vercel dashboard
3. Check the function logs for runtime errors
4. Verify all environment variables are set correctly

---

**Note**: This deployment guide assumes you're using the default Next.js configuration. If you've made custom changes to the build process or configuration, you may need to adjust the deployment steps accordingly. 