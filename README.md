# Pitchside Notes (KickPulse Final)

Static football preview and analysis site built with Node.js (`build.js`) and deployed on Vercel.

## Project Structure

- `build.js` — Reads `content/*.md`, copies `static/`, validates images/metadata, injects Vercel Web Analytics, and outputs the finished site to `dist/`.
- `content/*.md` — Published articles (filenames starting with `_` or frontmatter containing `draft: true` are skipped).
- `static/` — CSS (`style.css`), favicon (`favicon.svg`), and article images (`static/images/`).
- `vercel.json` — Configures `node build.js` as the build command and `dist/` as the output directory.

## Adding a New Article

1. Save images in `static/images/` using lowercase letters, numbers, and hyphens only (recommended `1600x900`, `.jpg`, under `250 KB`).
2. Create a `.md` file in `content/` using lowercase letters, numbers, and hyphens only.
3. Add required frontmatter at the top: `title`, `description` (120–155 chars), `date` (`YYYY-MM-DD`), `category`, `image` (`/images/...`), and `imageAlt`.
4. Run locally to check for zero warnings:
   ```bash
   node build.js
   ```
5. Commit and push to GitHub. Vercel rebuilds the site automatically.
