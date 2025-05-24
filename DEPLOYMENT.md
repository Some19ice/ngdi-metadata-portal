# Vercel Deployment Guide

## Pre-Deployment Checklist

### ✅ Build Status

- [x] Build completes successfully (`npm run build`)
- [x] No TypeScript errors
- [x] No ESLint errors
- [x] All dependencies are properly installed

### ✅ Configuration Files

- [x] `next.config.mjs` is properly configured
- [x] `package.json` has correct build scripts
- [x] `middleware.ts` is configured for auth routing
- [x] Database configuration in `drizzle.config.ts`

## Required Environment Variables

Set these in your Vercel project settings:

### Database

```
DATABASE_URL=postgresql://username:password@host:port/database
```

### Authentication (Clerk)

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
```

### Analytics (PostHog)

```
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### Payments (Stripe)

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PAYMENT_LINK_MONTHLY=https://buy.stripe.com/...
NEXT_PUBLIC_STRIPE_PAYMENT_LINK_YEARLY=https://buy.stripe.com/...
```

### Maps (MapTiler)

```
NEXT_PUBLIC_MAPTILER_API_KEY=your_maptiler_api_key
```

### Node Environment

```
NODE_ENV=production
```

## Deployment Steps

### 1. Database Setup

- Set up a PostgreSQL database (recommended: Supabase, Neon, or PlanetScale)
- Run migrations: `npm run db:migrate`
- Seed initial data if needed: `npm run db:seed:users`

### 2. External Services Setup

#### Clerk Authentication

1. Create a Clerk application
2. Configure allowed redirect URLs in Clerk dashboard
3. Add your Vercel domain to allowed origins

#### Stripe (if using payments)

1. Set up Stripe account
2. Create payment links for monthly/yearly plans
3. Configure webhook endpoint: `https://yourdomain.com/api/stripe/webhooks`

#### PostHog Analytics

1. Create PostHog project
2. Get API key and host URL

#### MapTiler (for maps)

1. Create MapTiler account
2. Get API key for map services

### 3. Vercel Configuration

#### Project Settings

1. Import your GitHub repository to Vercel
2. Set Framework Preset to "Next.js"
3. Set Node.js Version to 18.x or higher

#### Environment Variables

Add all required environment variables in Vercel dashboard:

- Go to Project Settings → Environment Variables
- Add each variable for Production, Preview, and Development environments

#### Build Settings

- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

### 4. Domain Configuration

1. Add your custom domain in Vercel dashboard
2. Update Clerk allowed origins to include your domain
3. Update Stripe webhook endpoint URL

## Post-Deployment Verification

### ✅ Functionality Tests

- [ ] Homepage loads correctly
- [ ] Authentication flow works (login/signup)
- [ ] Protected routes require authentication
- [ ] Database connections work
- [ ] Map functionality works
- [ ] Search functionality works
- [ ] Admin dashboard accessible
- [ ] API endpoints respond correctly

### ✅ Performance Checks

- [ ] Lighthouse score > 90
- [ ] Core Web Vitals are good
- [ ] Images are optimized
- [ ] No console errors

### ✅ Security Checks

- [ ] Environment variables are not exposed to client
- [ ] HTTPS is enforced
- [ ] Authentication middleware works
- [ ] API routes are protected

## Common Issues & Solutions

### Build Errors

- **TypeScript errors**: Run `npm run type-check` locally
- **Missing dependencies**: Check `package.json` and run `npm install`
- **Environment variables**: Ensure all required vars are set

### Runtime Errors

- **Database connection**: Verify `DATABASE_URL` is correct
- **Authentication issues**: Check Clerk configuration and allowed origins
- **Map not loading**: Verify `NEXT_PUBLIC_MAPTILER_API_KEY` is set

### Performance Issues

- **Large bundle size**: Check for unnecessary imports
- **Slow loading**: Optimize images and enable Next.js optimizations
- **Memory issues**: Consider upgrading Vercel plan

## Monitoring & Maintenance

### Analytics

- Monitor PostHog for user behavior
- Check Vercel Analytics for performance metrics
- Monitor error rates in Vercel dashboard

### Database

- Monitor database performance and usage
- Set up automated backups
- Monitor connection pool usage

### Updates

- Keep dependencies updated
- Monitor security advisories
- Test updates in preview deployments

## Additional Recommendations

### Security

1. Enable Vercel's security headers
2. Set up Content Security Policy (CSP)
3. Use environment-specific API keys
4. Enable rate limiting for API routes

### Performance

1. Enable Vercel's Edge Functions for better performance
2. Use Vercel's Image Optimization
3. Enable compression and caching
4. Monitor Core Web Vitals

### Backup & Recovery

1. Set up database backups
2. Export environment variables
3. Document deployment process
4. Test disaster recovery procedures
