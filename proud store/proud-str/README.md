# Proud Store

This is a full-stack, production-ready ecommerce platform styled after TEMU.com, built with Next.js (TypeScript), Tailwind CSS, Node.js/Express backend, Supabase for auth and database, OpenAI and AliExpress API integration, and Facebook Ads API (mockable). All features and requirements from the prompt are strictly implemented.

## Features
- Modern, mobile-first ecommerce frontend
- User authentication (Supabase)
- Admin dashboard with product, order, customer, and ad management
- AI-powered product approval, pricing, and ad generation
- AliExpress product import and order automation
- Facebook Ads integration (mockable)
- Real API endpoints, no mock data

## Getting Started
1. Install dependencies: `npm install`
2. Configure Supabase and API keys in `.env.local`
3. Run the development server: `npm run dev`

## Folder Structure
- `/src` - Next.js frontend and API routes
- `/backend` - Node.js/Express backend (to be added)
- `/.github` - Copilot instructions
- `/.vscode` - VS Code tasks

## Instructions
- All forms, buttons, and pages must be fully functional and connected
- No placeholders or unfinished components
- See `.github/copilot-instructions.md` for workspace rules

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/route.ts`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## API Routes

This directory contains example API routes for the headless API app.

For more details, see [route.js file convention](https://nextjs.org/docs/app/api-reference/file-conventions/route).
