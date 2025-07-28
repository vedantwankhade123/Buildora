# 🚀 Deploying Buildora to Netlify

This guide will help you deploy your Buildora platform to Netlify.

## Prerequisites

- A GitHub account
- A Netlify account
- Your Buildora project pushed to GitHub

## Step 1: Prepare Your Repository

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for Netlify deployment"
   git push origin main
   ```

2. **Verify your repository structure**:
   - `netlify.toml` ✅
   - `next.config.ts` ✅
   - `package.json` ✅

## Step 2: Deploy to Netlify

### Option A: Deploy via Netlify UI (Recommended)

1. **Go to [Netlify](https://netlify.com)** and sign in
2. **Click "Add new site"** → "Import an existing project"
3. **Connect to GitHub** and select your Buildora repository
4. **Configure build settings**:
   - **Build command**: `npm run build:netlify`
   - **Publish directory**: `.next/standalone`
   - **Node version**: `18`
5. **Click "Deploy site"**

### Option B: Deploy via Netlify CLI

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**:
   ```bash
   netlify login
   ```

3. **Deploy your site**:
   ```bash
   netlify deploy --prod
   ```

## Step 3: Configure Environment Variables

After deployment, you'll need to set up your environment variables in Netlify:

1. **Go to your site dashboard** in Netlify
2. **Navigate to Site settings** → **Environment variables**
3. **Add the following variables**:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google AI API (if using)
GOOGLE_AI_API_KEY=your_google_ai_api_key

# Other API keys as needed
```

## Step 4: Configure Custom Domain (Optional)

1. **Go to Site settings** → **Domain management**
2. **Add custom domain** or use the provided Netlify subdomain
3. **Configure SSL certificate** (automatic with Netlify)

## Step 5: Verify Deployment

1. **Check your site** at the provided Netlify URL
2. **Test all functionality**:
   - User authentication
   - API key management
   - Code generation
   - File uploads
3. **Monitor build logs** for any issues

## Troubleshooting

### Common Issues:

1. **Build fails**: Check the build logs in Netlify dashboard
2. **Environment variables not working**: Ensure they're set in Netlify dashboard
3. **API calls failing**: Verify CORS settings and API endpoints
4. **Static files not loading**: Check the publish directory path

### Build Commands:

- **Local build test**: `npm run build:netlify`
- **Check build output**: Look for `.next/standalone` directory
- **Verify static files**: Ensure `.next/static` is copied to standalone

## Performance Optimization

1. **Enable Netlify Edge Functions** for better performance
2. **Configure caching headers** in `netlify.toml`
3. **Use Netlify's CDN** for global distribution
4. **Monitor performance** with Netlify Analytics

## Security

1. **Environment variables** are encrypted in Netlify
2. **HTTPS** is automatically enabled
3. **Security headers** are configured in `netlify.toml`
4. **API keys** should never be committed to Git

## Support

If you encounter issues:
1. Check Netlify's [deployment documentation](https://docs.netlify.com/)
2. Review Next.js [deployment guide](https://nextjs.org/docs/deployment)
3. Check build logs in Netlify dashboard
4. Verify all environment variables are set correctly

---

**Your Buildora platform should now be live on Netlify! 🎉** 