# Netlify Deployment Guide

This guide will help you deploy the Bangladesh Election Tracker to Netlify.

## Prerequisites

- A [Netlify account](https://app.netlify.com/signup) (free tier available)
- Your Firebase configuration values
- Git repository pushed to GitHub, GitLab, or Bitbucket

## Deployment Steps

### 1. Install Dependencies

First, install the Netlify Next.js plugin:

```bash
npm install
```

### 2. Connect Your Repository

1. Log in to [Netlify](https://app.netlify.com/)
2. Click "Add new site" → "Import an existing project"
3. Choose your Git provider (GitHub, GitLab, or Bitbucket)
4. Select your repository

### 3. Configure Build Settings

Netlify should automatically detect your Next.js project. Verify these settings:

- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Base directory**: (leave empty)

The `netlify.toml` file in your project root will automatically configure these settings.

### 4. Set Environment Variables

Add the following environment variables in Netlify:

**Firebase Public Configuration**:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

**Firebase Admin (Server-side)**:

- `FIREBASE_ADMIN_PRIVATE_KEY` (Note: Keep newlines as `\n`)
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PROJECT_ID`

**Optional Analytics**:

- `NEXT_PUBLIC_GA_MEASUREMENT_ID` (Google Analytics)
- `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` (Google Analytics 4)

> **Note on Analytics**: The project uses `@vercel/analytics` which works on any hosting platform, including Netlify. No changes needed. Alternatively, you can use [Netlify Analytics](https://www.netlify.com/products/analytics/) for server-side analytics.

#### How to Add Environment Variables in Netlify:

1. Go to **Site settings** → **Environment variables**
2. Click **Add a variable**
3. Enter the key and value for each variable
4. Select scopes: Choose "All" or specific deploy contexts

### 5. Deploy

Click **Deploy site**. Netlify will:

- Install dependencies
- Build your Next.js application
- Deploy to their global CDN

## Post-Deployment

### Custom Domain

1. Go to **Site settings** → **Domain management**
2. Click **Add custom domain**
3. Follow the instructions to configure your DNS

### SSL Certificate

Netlify automatically provisions and renews SSL certificates for your site.

### Continuous Deployment

Every time you push to your connected Git repository, Netlify will automatically rebuild and deploy your site.

## Configuration Details

### netlify.toml

The `netlify.toml` file configures:

- Build command and settings
- Next.js plugin integration
- Security headers (CSP, XSS, etc.)
- Cache headers for static assets
- Node.js version

### Performance Optimizations

The configuration includes:

- **Image optimization**: Automatic with Next.js Image component
- **Static asset caching**: 1 year cache for images, fonts, and data files
- **Security headers**: Content Security Policy, XSS protection, etc.
- **Bundle optimization**: Code splitting and tree shaking

## Troubleshooting

### Build Fails

- Check the build logs in Netlify dashboard
- Verify all environment variables are set correctly
- Ensure `package.json` dependencies are correct

### Firebase Connection Issues

- Verify Firebase environment variables are set correctly
- Check Firebase console for security rules
- Ensure Netlify domain is allowed in Firebase settings

### Runtime Errors

- Check Netlify Function logs for server-side errors
- Review browser console for client-side errors
- Verify API routes are working correctly

## Local Development

To test locally before deploying:

```bash
# Development server
npm run dev

# Production build locally
npm run build
npm start
```

## Netlify CLI (Optional)

Install the Netlify CLI for local testing and deployment:

```bash
# Install globally
npm install -g netlify-cli

# Login
netlify login

# Link to your site
netlify link

# Test locally with Netlify environment
netlify dev

# Deploy from CLI
netlify deploy --prod
```

## Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Next.js on Netlify](https://docs.netlify.com/integrations/frameworks/next-js/)
- [Netlify Next.js Plugin](https://github.com/netlify/netlify-plugin-nextjs)
- [Environment Variables](https://docs.netlify.com/environment-variables/overview/)

## Comparison with Vercel

Both platforms work well for Next.js. Key differences:

| Feature         | Netlify         | Vercel                |
| --------------- | --------------- | --------------------- |
| Next.js Support | Via plugin      | Native                |
| Build Time      | Good            | Excellent             |
| CDN             | Global          | Global (Edge Network) |
| Free Tier       | 100GB bandwidth | 100GB bandwidth       |
| Custom Domains  | Yes             | Yes                   |
| Edge Functions  | Yes             | Yes                   |

Your app is configured to work on both platforms. Choose based on your preference or organizational requirements.
