# QuizSEO (static landing)

## Quiz library

`quiz-library.js` loads the same list as the Vue app via `GET /api/quiz-library`.

- **Production:** `<meta name="quiz-api-base">` and `<meta name="quiz-app-base">` default to `https://quizgenerator-r4pa.onrender.com` (same origin as the live app).
- **Local testing:** point both to your Flask origin (e.g. `http://localhost:5000`). The Flask app must allow **CORS** from this site’s origin (e.g. GitHub Pages or `the-quiz-generator.com`).

## SEO (included)

- **`sitemap.xml`** — lists `/` and `/ar.html` (update the domain if you use another host).
- **`robots.txt`** — allows crawlers and points to the sitemap.
- **Per page:** tuned `<title>` / `description`, `canonical`, `hreflang` (en / ar / ar-EG / x-default), Open Graph + Twitter tags (with absolute `og:image`), `Organization` + `WebSite` + `WebPage` + `SoftwareApplication` + **`FAQPage`** JSON-LD (`@graph`). Unverifiable `aggregateRating` was removed to follow Google guidelines.
- **Body copy:** an extra keyword-rich section links to the app, library anchor, and language alternate.
- After deploy, submit **`https://the-quiz-generator.com/sitemap.xml`** in [Google Search Console](https://search.google.com/search-console) and optionally add a **1200×630** branded `og:image` URL in the meta tags (stronger than `favicon.svg` for social previews).

## Assets

- `favicon.svg` matches the main Quiz Generator app.
- `quiz-library.css` / `quiz-library.js` — no build step; plain static files.
