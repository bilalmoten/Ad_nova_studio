# Troubleshooting Guide

## Common Issues

### 1. "GOOGLE_GENAI_API_KEY is required" Error

**Problem:** The app can't generate AI content because the API key is missing.

**Solution:**
1. Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Add it to your `.env.local` file:
   ```env
   GOOGLE_GENAI_API_KEY=your-api-key-here
   ```
3. Restart your development server (`npm run dev`)

### 2. Storage Bucket Not Found

**Problem:** Error when trying to upload images or videos.

**Solution:**
1. Create the storage bucket in Supabase:
   ```bash
   supabase storage create assets --public false
   ```
2. Or use the Supabase Dashboard:
   - Go to Storage → Create Bucket
   - Name: `assets`
   - Public: No
   - File size limit: 50MB (or your preference)

### 3. Database Migration Errors

**Problem:** Tables don't exist or migrations fail.

**Solution:**
```bash
# Reset the database and apply all migrations
npm run db:reset

# Regenerate TypeScript types
npm run db:types
```

### 4. Video Generation Takes Too Long

**Problem:** Video generation seems stuck.

**Solution:**
- Video generation with Veo 3.1 can take 5-10 minutes per scene
- The app polls every 8 seconds for completion
- Check the browser console for any errors
- Verify your API key has sufficient quota

### 5. "Unauthorized" Errors

**Problem:** Can't access projects or get unauthorized errors.

**Solution:**
1. Make sure you're signed in
2. Check that RLS policies are enabled on all tables
3. Verify migrations were applied correctly

### 6. Deprecation Warnings (punycode)

**Problem:** See warnings about `punycode` module being deprecated.

**Solution:**
- These are harmless warnings from dependencies
- They don't affect functionality
- Will be fixed in future dependency updates

## Debugging Tips

### Check Server Logs
Look at your terminal where `npm run dev` is running for detailed error messages.

### Check Browser Console
Open browser DevTools (F12) and check the Console tab for client-side errors.

### Verify Environment Variables
```bash
# Check if variables are loaded
node -e "require('dotenv').config({ path: '.env.local' }); console.log(process.env.GOOGLE_GENAI_API_KEY ? 'API key found' : 'API key missing')"
```

### Test Database Connection
```bash
# Start Supabase
npm run db:start

# Check connection
supabase status
```

## Getting Help

If you encounter issues not covered here:
1. Check the browser console for errors
2. Check server terminal output
3. Verify all environment variables are set
4. Ensure all migrations have been applied
5. Check Supabase dashboard for any service issues

