# Astro Demo — ABC Company

A student-friendly **Astro + MDX** static website for a fictioned company called **ABC Company**. Use it to learn component-based pages, Markdown/MDX content, local npm workflows, and continuous deployment to **Amazon S3** with **GitHub Actions**.

---

## What you will learn

- How an Astro project is structured (`src/pages`, `src/components`, `src/layouts`)
- How to author blog posts in **MDX** (Markdown + components)
- How to run the app locally with **npm**
- How environment variables work (see `.env.example`)
- How **CI/CD** builds the site and syncs `dist/` to **AWS S3**

---

## Requirements

| Tool | Version | Notes |
| --- | --- | --- |
| Node.js | **22.12+** | Check with `node -v` |
| npm | Comes with Node | Check with `npm -v` |
| Git | Any recent version | To clone and push |
| AWS account | Free tier is fine | Only needed for S3 deployment |
| GitHub repository | This repo (or your fork) | Required for Actions |

---

## Project structure (quick map)

```text
.
├── .env.example                 # Template for environment variables
├── .github/workflows/deploy.yml # CI build + S3 continuous deployment
├── astro.config.mjs             # Astro + MDX configuration
├── package.json                 # npm scripts and dependencies
├── public/                      # Static files copied as-is (favicon, etc.)
└── src/
    ├── components/              # Reusable UI pieces (Header, Hero, forms…)
    ├── layouts/                 # Page shells (BaseLayout, MDXLayout)
    ├── pages/                   # Routes: /, /about, /services, /contact, /blog
    │   └── blog/*.mdx           # MDX articles
    └── styles/global.css        # Design tokens and base styles
```

Demo company pages:

| URL | Purpose |
| --- | --- |
| `/` | Homepage with brand-first hero |
| `/about` | Fictioned company story + team |
| `/services` | Service list component demo |
| `/contact` | Contact form component demo |
| `/blog` | MDX article index |
| `/blog/welcome-to-abc` | Sample MDX post |

---

## Setup with npm (local development)

### 1. Clone the repository

```bash
git clone https://github.com/jacky-wong9273/astro-demo.git
cd astro-demo
```

If you forked the repo, use your fork URL instead.

### 2. Install dependencies

```bash
npm install
```

This reads `package.json` / `package-lock.json` and installs Astro, MDX, and related packages into `node_modules/`.

### 3. Create your local environment file

```bash
cp .env.example .env
```

Open `.env` and adjust the **public** values for local work:

```bash
PUBLIC_SITE_URL=http://localhost:4321
PUBLIC_COMPANY_NAME=ABC Company
PUBLIC_CONTACT_EMAIL=hello@abccompany.example
```

Notes for students:

- Variables prefixed with `PUBLIC_` are available in Astro code via `import.meta.env.PUBLIC_…`
- Do **not** put real AWS keys in `.env` if you might commit by mistake — `.gitignore` already ignores `.env`, but habits matter
- AWS keys are only required for deployment; they belong in **GitHub Secrets** (see below)

### 4. Start the development server

```bash
npm run dev
```

Then open [http://localhost:4321](http://localhost:4321) in your browser.

Useful npm scripts:

| Command | What it does |
| --- | --- |
| `npm run dev` | Local dev server with hot reload |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Serve the production build locally |

### 5. Preview a production build locally

```bash
npm run build
npm run preview
```

Confirm the site still looks correct before you rely on CI/CD.

---

## Working with MDX content

Blog posts live in `src/pages/blog/*.mdx`.

Example frontmatter:

```mdx
---
title: "Welcome to ABC Company"
description: "Why this fictioned brand exists…"
pubDate: "2026-03-01"
author: "Avery Chen"
layout: ../../layouts/MDXLayout.astro
---

import Callout from '../../components/Callout.astro';

Your Markdown content here.

<Callout title="Try this" tone="tip">
  Students can embed Astro components inside MDX.
</Callout>
```

After you save, the dev server refreshes. The Blog index page discovers posts automatically.

---

## Continuous deployment (GitHub Actions → AWS S3)

Workflow file: [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)

### What the pipeline does

1. **On every pull request and push** → install with `npm ci` and run `npm run build`
2. **On push to `main` (or manual “Run workflow”)** → download the `dist/` artifact and sync it to your S3 bucket
3. **Optional** → invalidate a CloudFront distribution so visitors see fresh HTML immediately

```text
git push → GitHub Actions → npm ci → npm run build → aws s3 sync dist/ → (optional) CloudFront invalidation
```

### A. Create an S3 bucket for static hosting

In the AWS Console:

1. Create a bucket (example name: `abc-company-astro-demo`) in your preferred region
2. Enable **Static website hosting**
   - Index document: `index.html`
   - Error document: `index.html` (simple demo choice) or a custom `404.html` later
3. Attach a bucket policy that allows public read of objects (only if you intentionally want a public website endpoint)

Example bucket policy (replace `YOUR_BUCKET_NAME`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
    }
  ]
}
```

> Classroom tip: For production, prefer **CloudFront + Origin Access Control** instead of a fully public bucket. This demo keeps the public website endpoint path simple for learning.

### B. Create an IAM user for deploys (least privilege)

Create an IAM user (e.g. `astro-demo-deploy`) with programmatic access and a policy limited to your bucket:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": ["arn:aws:s3:::YOUR_BUCKET_NAME"]
    },
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": ["arn:aws:s3:::YOUR_BUCKET_NAME/*"]
    },
    {
      "Effect": "Allow",
      "Action": ["cloudfront:CreateInvalidation"],
      "Resource": ["*"]
    }
  ]
}
```

Save the **Access Key ID** and **Secret Access Key** — you will paste them into GitHub Secrets only.

### C. Add GitHub Secrets and Variables

In your GitHub repo: **Settings → Secrets and variables → Actions**

#### Secrets (required for deploy)

| Secret name | Example / notes |
| --- | --- |
| `AWS_ACCESS_KEY_ID` | IAM access key id |
| `AWS_SECRET_ACCESS_KEY` | IAM secret access key |
| `AWS_REGION` | e.g. `us-east-1` |
| `AWS_S3_BUCKET` | e.g. `abc-company-astro-demo` |
| `AWS_S3_PREFIX` | Optional folder prefix; leave unset for bucket root |
| `AWS_CLOUDFRONT_DISTRIBUTION_ID` | Optional; only if you use CloudFront |

#### Variables (optional, safe public build values)

| Variable name | Example |
| --- | --- |
| `PUBLIC_SITE_URL` | Your S3 website URL or CloudFront URL |
| `PUBLIC_COMPANY_NAME` | `ABC Company` |
| `PUBLIC_CONTACT_EMAIL` | `hello@abccompany.example` |

Mirror the names from `.env.example` so students can compare local vs CI configuration.

### D. Deploy

1. Merge or push to `main`
2. Open the **Actions** tab and watch **CI and Deploy to Amazon S3**
3. When the deploy job is green, visit your S3 website endpoint or CloudFront URL

You can also run the workflow manually: **Actions → CI and Deploy to Amazon S3 → Run workflow**.

---

## Environment variable reference

See [`.env.example`](.env.example) for the full annotated list.

| Variable | Where used | Secret? |
| --- | --- | --- |
| `PUBLIC_SITE_URL` | Canonical links / meta | No |
| `PUBLIC_COMPANY_NAME` | Brand text in UI | No |
| `PUBLIC_CONTACT_EMAIL` | Contact page | No |
| `PUBLIC_ANALYTICS_ID` | Reserved for future analytics | No |
| `AWS_ACCESS_KEY_ID` | GitHub Actions deploy | **Yes** |
| `AWS_SECRET_ACCESS_KEY` | GitHub Actions deploy | **Yes** |
| `AWS_REGION` | GitHub Actions deploy | **Yes** (treat as sensitive config) |
| `AWS_S3_BUCKET` | Deploy target | **Yes** (config) |
| `AWS_S3_PREFIX` | Optional key prefix | Optional |
| `AWS_CLOUDFRONT_DISTRIBUTION_ID` | Cache invalidation | Optional |

---

## Suggested student exercises

1. Change `PUBLIC_COMPANY_NAME` in `.env` and confirm the header/hero update after restarting `npm run dev`
2. Add a new MDX post under `src/pages/blog/`
3. Create a new Astro component and use it on `/services`
4. Run `npm run build` and inspect files inside `dist/`
5. Fork the repo, configure Secrets, and deploy your own S3 bucket

---

## Troubleshooting

| Problem | What to try |
| --- | --- |
| `npm install` fails on Node version | Upgrade to Node 22.12+ (`nvm install 22`) |
| Site builds but styles look wrong | Hard-refresh the browser; confirm `src/styles/global.css` is imported by `Layout.astro` |
| MDX component not found | Check the relative import path from the `.mdx` file |
| GitHub deploy fails on AWS credentials | Re-check Secrets names (exact spelling) and IAM permissions |
| S3 sync works but browser shows Access Denied | Fix bucket policy / Block Public Access settings for website hosting |
| Old HTML after CloudFront deploy | Confirm `AWS_CLOUDFRONT_DISTRIBUTION_ID` is set so invalidation runs |

---

## License / demo notice

ABC Company and all team bios in this repository are **fictioned for education**. Use and remix freely for teaching web development with Astro.
