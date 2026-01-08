# /deploy-check - Verify Deployment Status

Check if local changes are deployed to production.

## Usage
```
/deploy-check    # Compare local vs production
```

## Quick Check

### 1. Check local version
```bash
cat VERSION
```

### 2. Check production version
```bash
curl -s https://thejar.vercel.app | grep -o 'version=[^"]*' | head -1
```

Or check the version badge in the app's bottom-right corner.

### 3. Run the script
```bash
./scripts/check-deploy.sh
```

## Vercel Deployment

### Check deployment status
```bash
# If you have Vercel CLI
npx vercel ls

# Or check Vercel dashboard
# https://vercel.com/dashboard
```

### Force redeploy
```bash
git commit --allow-empty -m "Trigger redeploy"
git push
```

## Deployment Checklist

Before pushing to main:

1. **Version bump**
   ```bash
   echo "YYYYMMDD-vN" > VERSION
   ```

2. **Build passes**
   ```bash
   npm run build
   ```

3. **Tests pass**
   ```bash
   npm run test:run
   ```

4. **Lint passes**
   ```bash
   npm run lint
   ```

5. **Commit and push**
   ```bash
   git add .
   git commit -m "Description"
   git push
   ```

## Vercel Build Logs

If deployment fails, check:
1. Vercel dashboard → Project → Deployments → Click failed deploy
2. Look for build errors in the log
3. Common issues:
   - Type errors not caught locally
   - Missing environment variables
   - Module resolution differences

## Environment Variables

Required in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Check they're set in Vercel project settings.
