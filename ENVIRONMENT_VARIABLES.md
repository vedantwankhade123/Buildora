# Environment Variables Required for Deployment

This project requires the following environment variables to be set in your Vercel deployment:

## Database
- `DATABASE_URL` - PostgreSQL connection string

## NextAuth
- `NEXTAUTH_URL` - Your app's URL (e.g., https://your-app.vercel.app)
- `NEXTAUTH_SECRET` - A random string for NextAuth encryption

## Supabase
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

## Firebase (if using Firebase Auth)
- `FIREBASE_PROJECT_ID` - Your Firebase project ID
- `FIREBASE_CLIENT_EMAIL` - Your Firebase client email
- `FIREBASE_PRIVATE_KEY` - Your Firebase private key

## Google AI (for GenKit)
- `GOOGLE_AI_API_KEY` - Your Google AI API key

## Stripe
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key
- `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook secret

## Other API Keys
- `OPENAI_API_KEY` - Your OpenAI API key
- `ANTHROPIC_API_KEY` - Your Anthropic API key

## App Configuration
- `NEXT_PUBLIC_APP_URL` - Your app's public URL

## How to Set Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings > Environment Variables
4. Add each variable with the appropriate value
5. Make sure to set the environment (Production, Preview, Development) as needed 