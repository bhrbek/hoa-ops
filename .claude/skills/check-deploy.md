# /check-deploy - Deployment Status Check

Verify if the latest code is deployed to production.

## Usage
```
/check-deploy
```

## What it does
1. Shows local VERSION file
2. Shows latest git commit
3. Checks for uncommitted changes
4. Checks if local is ahead of origin
5. Pings production to verify it's reachable

## Script
Run: `./scripts/check-deploy.sh`

## Common Scenarios

### "Fix isn't working in production"
1. Run `/check-deploy`
2. If "Local ahead of origin" → `git push`
3. Wait 1-2 minutes for Vercel deployment
4. Hard refresh browser: Cmd+Shift+R

### "Not sure if code is deployed"
1. Check VERSION in footer of app
2. Compare to local `cat VERSION`
3. If different, deployment may be in progress

## Vercel Logs
```bash
vercel logs --follow
```
