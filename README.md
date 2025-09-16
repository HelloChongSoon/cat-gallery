# Cat Gallery

A simple, responsive cat image grid using TheCatAPI.

- 3-column grid on desktop, 2 on tablet, 1 on mobile
- Square (1:1) images with lazy loading
- Refreshes images automatically every 30 minutes without reloading the page
- No API key stored in the repository

## Run Locally
Just open `index.html` in your browser.

## Optional: Use your own API key
To avoid rate limits, you can use your own key at runtime (not committed):

1. Open the page
2. In the browser console, run:
   ```js
   localStorage.setItem('CAT_API_KEY', 'YOUR_API_KEY_HERE')
   location.reload()
   ```

## Publish to GitHub Pages
1. Create a new GitHub repo (no files): `cat-gallery`
2. Push the local repo (see commands below)
3. In the repo Settings → Pages, set the branch to `main` and `/ (root)`
4. Your site will be available at `https://<your-username>.github.io/cat-gallery/`

## Git Commands to push
After you create an empty GitHub repository, run:
```bash
cd /Users/brysontham/cat-gallery
git add .
git commit -m "Initial commit: Cat Gallery"
# Replace the URL with your repo URL
git remote add origin https://github.com/<your-username>/cat-gallery.git
git branch -M main
git push -u origin main
```
