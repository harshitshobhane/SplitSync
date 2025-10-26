# Fix Firebase Emails Going to Spam

## Quick Fix (5 minutes)

### 1. Customize Email Template
- Firebase Console → Authentication → Templates
- Click "Email address verification"
- Change **Subject**: `Verify your SplitSync account` 
- Change **Action URL**: (leave default or use your domain)
- Click **Save**

### 2. Set App Name
- Firebase Console → Project Settings → General
- Set **Public-facing name** to: `SplitSync`
- This appears in emails as sender name

### 3. Test
- Sign up with your email
- Check spam folder if inbox is empty
- After first email arrives in inbox → future emails won't go to spam

## Better Fix (with custom domain)

### Get Domain
- Buy: `splitsync.com` (~$15/year) or similar
- From: namecheap.com, google domains, etc.

### Setup in Firebase
1. Firebase Console → Authentication → Templates → Email verification
2. Click "Customize domain"
3. Enter your domain (e.g., `splitsync.com`)
4. Add DNS records (Firebase provides them)
5. Wait for DNS propagation (15 mins - 24 hours)
6. Click "Verify"

### DNS Records to Add
Add to your domain provider's DNS settings:

**SPF Record:**
```
Type: TXT
Host: @
Value: v=spf1 include:_spf.google.com ~all
```

**Firebase will provide DKIM record** - use that exact value

After setup, emails come from: `noreply@splitsync.com` (won't go to spam!)

## Current Solution

For now, just tell users to **check spam folder** - which you've already done in the UI!

The improved UI already shows:
- Step-by-step instructions
- Spam folder warning box  
- Clear instructions on what to do

Once users mark it as "Not Spam", future emails won't go to spam.

