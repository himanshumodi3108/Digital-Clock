# GitHub Pages Deployment Guide

## Quick Setup

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for GitHub Pages deployment"
   git push origin main
   ```

2. **Enable GitHub Pages**:
   - Go to your repository: https://github.com/himanshumodi3108/Digital-Clock
   - Click on **Settings** tab
   - Scroll down to **Pages** in the left sidebar
   - Under **Source**, select:
     - Branch: `main` (or `master` if that's your default branch)
     - Folder: `/ (root)`
   - Click **Save**

3. **Wait for deployment**:
   - GitHub will build and deploy your site
   - This usually takes 1-2 minutes
   - You'll see a green checkmark when it's ready

4. **Access your site**:
   - Your site will be live at: `https://himanshumodi3108.github.io/Digital-Clock/`
   - The URL will be displayed in the Pages settings

## Important Notes

- The `index.html` file is the entry point for GitHub Pages
- All files (CSS, JS) should be in the root directory or properly referenced
- Changes pushed to the selected branch will automatically update the site
- It may take a few minutes for changes to appear after pushing

## Troubleshooting

- **404 Error**: Make sure `index.html` exists in the root directory
- **Styles not loading**: Check that CSS file paths are correct (relative paths)
- **Scripts not working**: Verify JavaScript file paths are correct
- **Changes not appearing**: Wait a few minutes and hard refresh (Ctrl+F5)

