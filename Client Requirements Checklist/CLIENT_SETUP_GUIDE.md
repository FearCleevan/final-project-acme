# Acme Lamp & Sign — Client Setup Guide

Hello Scott,

I have prepared this step-by-step guide to walk you through creating all the accounts and services needed to get your store live. Each section covers one platform — what it is, how to sign up, and how to give me access so I can connect everything during the development and testing phase. You don't need any technical knowledge to follow these steps; just go in order and save your login details as you go.

If you get stuck on any step, feel free to reach out and I'll walk you through it.

---

**Prepared by:** Peter Paul Lazan · jonathan.mauring17@gmail.com
**Purpose:** Step-by-step account creation for every service needed to launch the store, written for a non-technical owner. After each account is created, follow the "Add Developer Access" step so Peter Paul can connect everything during development and testing.

---

## Before You Start

Keep a secure notes document (Google Keep, Apple Notes, or a password manager like 1Password) open as you go. For every account you create, save:
- The email address used
- The password
- Any confirmation numbers or account IDs

You will need these later.

---

## Checklist Overview

| # | Service | Purpose | Cost |
|---|---------|---------|------|
| 1 | Domain Name | Your web address (e.g. acmelamp.co) | ~$15–$25/yr (varies) |
| 2 | Shopify | Online store & checkout | ~$39/mo (Basic tier) |
| 3 | Vercel | Hosts the website code | Free to start |
| 4 | Sanity | Content management (edit product copy) | Free to start |
| 5 | Google Workspace | Business email (you@acmelamp.co) | ~$6/mo per user |
| 6 | Google Analytics 4 | See who visits your store | Free |
| 7 | Google Search Console | Monitor Google search rankings | Free |
| 8 | Mailchimp | Email newsletter to customers | Free up to 500 contacts |

---

## 1. Domain Name

**What this is:** Your store's address on the internet — the part customers type in, like `acmelamp.co` or `acmelampandsign.com`.

**Where to buy:** Namecheap (recommended for price and simplicity)
👉 Go to: https://www.namecheap.com

### Steps
1. Go to Namecheap and click **Sign Up** (top right).
2. Fill in your name, email address, and choose a password. Click **Create Account & Continue**.
3. Check your email and click the confirmation link Namecheap sends you.
4. Back on the site, use the search bar on the homepage to type your preferred domain name (e.g. `acmelamp`).
5. Choose a name that shows `.co` or `.com` available, and click **Add to Cart**.
6. During checkout, Namecheap will offer add-ons — you can safely skip all of them (Privacy Protection is optional but recommended at ~$2/yr).
7. Complete payment. Your domain is now yours.

### Add Developer Access
1. Log in to Namecheap → click your username (top right) → **Dashboard**.
2. Click **Account** → **Users & Access** → **+ New User**.
3. Enter: `jonathan.mauring17@gmail.com` — set Role to **Admin**.
4. Click **Send Invite**. Peter Paul will receive an email to accept.

> **Note:** Exact domain price will depend on which name and extension you choose. `.co` and `.com` are most common. `.shop` or `.store` are alternatives if your first choice is taken.

---

## 2. Shopify — Online Store

**What this is:** The engine that runs your store — product listings, shopping cart, checkout, payments, and order management.

👉 Go to: https://www.shopify.com

### Steps
1. Click **Start free trial** on the Shopify homepage.
2. Enter your email address and click **Create Shopify ID**. You may be asked to sign in with Google — that is fine, or you can create a separate Shopify account.
3. Answer the short setup questions about your business (you can skip or approximate — these are just for Shopify's onboarding).
4. Once inside the dashboard, click **Settings** (bottom left) → **Plan** → choose **Basic** ($39/mo). Enter your payment card.
5. Your store is now active on a temporary Shopify domain (like `your-store.myshopify.com`). You will connect your real domain later during development.

### Add Developer Access
1. From the Shopify Admin, click **Settings** → **Users and Permissions**.
2. Click **Add staff** (or **Add collaborator** if it appears).
3. Enter `jonathan.mauring17@gmail.com`.
4. Under permissions, check **All permissions** (full access).
5. Click **Send invite**. Peter Paul will receive an email to accept.

---

## 3. Vercel — Website Hosting

**What this is:** The service that makes your website load fast for visitors. It publishes the code Developer writes and keeps it live 24/7.

👉 Go to: https://vercel.com

### Steps
1. Click **Sign Up** on the Vercel homepage.
2. Choose **Continue with GitHub** if you already have a GitHub account — or choose **Continue with Email** and enter your email address.
3. If using email: check your inbox for a magic link and click it to confirm.
4. On the "Tell us about you" screen, select **Personal** and click **Continue**.
5. Skip the "Import Git Repository" step for now — click **Skip** or **Continue**. The Developer/Peter Paul will handle the code import.
6. Your Vercel account is ready. Stay on the **Free (Hobby)** plan for now.

### Add Developer Access
1. Inside Vercel, click your profile icon (top right) → **Settings**.
2. Click **Members** → **Invite Member**.
3. Enter `jonathan.mauring17@gmail.com` — set Role to **Owner**.
4. Click **Send Invitation**. Peter Paul will receive an email.

---

## 4. Sanity — Content Management

**What this is:** The tool you will use to edit product descriptions, prices, and images without touching any code. Think of it as a simple editing dashboard for your store's content.

👉 Go to: https://www.sanity.io

### Steps
1. Click **Get started for free** on the Sanity homepage.
2. Click **Continue with Google** (easiest) and log in with your Google account — or click **Continue with email** and fill in the form.
3. On the next screen, click **Create new project**.
4. Give it a name like `Acme Lamp & Sign` and click **Create project**.
5. Choose the **Free** plan and click **Continue**.
6. Your Sanity project is created. Note the **Project ID** shown on the project page — save it in your notes document.

### Add Developer Access
1. Inside the Sanity management dashboard (manage.sanity.io), click your project name.
2. Click **Members** → **Invite member**.
3. Enter `jonathan.mauring17@gmail.com` — set Role to **Administrator**.
4. Click **Send invite**. Peter Paul will receive an email.

---

## 5. Google Workspace — Business Email

**What this is:** Gives you a professional email address like `hello@acmelamp.co` instead of a Gmail address. Required for customer trust and for business accounts on other platforms.

👉 Go to: https://workspace.google.com

### Steps
1. Click **Get started** on the Google Workspace homepage.
2. Enter your business name (e.g. `Acme Lamp & Sign`) and the number of employees — select **Just me**.
3. Enter your personal email address as the recovery email.
4. On the next screen, choose **Use a domain I already own** and type in the domain you bought in Step 1 (e.g. `acmelamp.co`).
5. Click **Next** and follow the prompts to verify that you own the domain. Google will give you a short code to add to your Namecheap DNS settings — the Developer can do this step for you.
6. Create your new business email address on the next screen (e.g. `hello@acmelamp.co` or `info@acmelamp.co`).
7. Choose the **Business Starter** plan (~$6/mo per user) and enter your payment card.

### Add Developer Access
1. Log in to the Google Admin Console: https://admin.google.com
2. Click **Account** → **Admin roles**.
3. Click **Super Admin** → **Assign admins**.
4. Enter `jonathan.mauring17@gmail.com` and click **Assign role**.

> **Note:** This gives the developer access to manage the Workspace during setup. You can remove this role once the store is live.

---

## 6. Google Analytics 4

**What this is:** Shows you how many people visit your store, which products they look at, and where they came from (Google search, social media, etc.).

👉 Go to: https://analytics.google.com

### Steps
1. Sign in with the Google account linked to your Google Workspace.
2. Click **Start measuring**.
3. Enter an Account Name (e.g. `Acme Lamp & Sign`).
4. Click **Next** → enter a Property Name (same as account name is fine).
5. Select your business size and purpose → click **Next**.
6. Click **Web** as your platform.
7. Enter your website URL (e.g. `https://acmelamp.co`) and a Stream Name.
8. Click **Create stream**. Copy the **Measurement ID** (starts with `G-`) and save it in your notes document. the Developer will enter this into the website code.

### Add Developer Access
1. Inside Google Analytics, click **Admin** (gear icon, bottom left).
2. Under the **Account** column, click **Account Access Management**.
3. Click the blue **+** button → **Add users**.
4. Enter `jonathan.mauring17@gmail.com`, check **Editor** and **Administrator**, and click **Add**.

---

## 7. Google Search Console

**What this is:** Shows you how your store appears in Google search results and alerts you to any problems Google finds with your site.

👉 Go to: https://search.google.com/search-console

### Steps
1. Sign in with the same Google account as Analytics.
2. Click **Start now**.
3. Under **URL prefix**, type your full website URL (e.g. `https://acmelamp.co`) and click **Continue**.
4. Google will ask you to verify ownership. Choose the **HTML tag** method — copy the tag it gives you and save it in your notes. the Developer will add it to the website.
5. Click **Verify** (do this after the Developer confirms the tag is added to the site).

### Add Developer Access
1. Inside Search Console, click **Settings** (gear icon, bottom left).
2. Click **Users and permissions** → **Add user**.
3. Enter `jonathan.mauring17@gmail.com` — set permission to **Owner**.
4. Click **Add**.

---

## 8. Mailchimp — Newsletter

**What this is:** Lets you send email newsletters to customers who sign up on your website. Useful for announcing new product releases, restocks, and promotions.

👉 Go to: https://mailchimp.com

### Steps
1. Click **Sign Up Free** on the Mailchimp homepage.
2. Enter your email address, a username, and a password. Click **Sign up**.
3. Check your inbox and click the activation link in the email Mailchimp sends.
4. Follow the short setup wizard — enter your name, business name, and website URL.
5. When asked about your audience, select **E-commerce** and click **Continue**.
6. You are now on the **Free plan** (up to 500 contacts, 1,000 emails/month). You can upgrade later when your list grows.

### Add Developer Access
1. Inside Mailchimp, click your profile icon (top right) → **Account & billing**.
2. Click the **Settings** tab → **Users**.
3. Click **Invite a user**.
4. Enter `jonathan.mauring17@gmail.com` — set role to **Manager**.
5. Click **Send invite**. The Developer will receive an email to accept.

---

## Summary: What the Developer Needs from You

Once all accounts are created, send Peter Paul/Developer a message confirming:

| Item | What to share |
|------|--------------|
| Domain registrar | Invite accepted or confirmation email forwarded |
| Shopify | Collaborator invite accepted |
| Vercel | Team invite accepted |
| Sanity | Project ID (save from Step 4) + invite accepted |
| Google Workspace | Admin access granted |
| Google Analytics 4 | Measurement ID (the `G-XXXXXXXX` code) |
| Google Search Console | HTML verification tag copied and saved |
| Mailchimp | Invite accepted |

> Do not share passwords directly. The invite system on each platform is the secure way to give access.

---

## Cost Summary (Estimated Monthly)

| Service | Cost |
|---------|------|
| Domain Name | ~$1.50–$2/mo (billed yearly) |
| Shopify Basic | $39/mo |
| Vercel | Free |
| Sanity | Free |
| Google Workspace Starter | $6/mo |
| Google Analytics 4 | Free |
| Google Search Console | Free |
| Mailchimp (up to 500 contacts) | Free |
| **Estimated Total** | **~$47–$48/mo to start** |

Costs may increase as the store grows (more Mailchimp contacts, Vercel Pro for more bandwidth, etc.).

---

## Live Website Preview

Your store design is already built and live at the link below. You can open this at any time on your phone or computer to see exactly how the store looks and feels before the real product data is added.

**Live Preview:** https://acmelampandsign.vercel.app/

### What you can review on the live site
- Overall look and feel — layout, fonts, and spacing
- Color palette — the warm parchment background, brass gold tones, and dark ink text
- How the catalog, product pages, and cart work
- Mobile experience — try it on your phone

### Requesting design changes
If you would like to adjust anything — color palette, fonts, button styles, section layout, wording — simply note it down and send it to me. Be as specific as you can, for example:
- *"The gold color feels too dark, can it be lighter?"*
- *"I'd prefer the product cards to show the price more prominently."*
- *"The homepage hero text feels too small on mobile."*

Changes to colors, typography, and layout can be made quickly at this stage — it is much easier to revise design before real data is loaded than after.

---

## Real Content — What I Need from You

Once the accounts above are set up, I will need you to provide the real product data to replace the sample content currently on the site. Please prepare the following for **each product** you want to list in the store.

### For Every Product

| Field | Description | Example |
|-------|-------------|---------|
| **Product Name** | The full display name | Cattaraugus Brass Center-Draft Lamp |
| **SKU / Item Code** | Your internal reference number | OL-1873-CB |
| **Short Description** | 1–2 sentences, what makes this piece special | Precision-cast from an 1873 Cattaraugus County original. No. 2 burner, center-draft mechanism, original brass finish. |
| **Full Description** | 3–5 sentences covering history, materials, and use | A longer paragraph about provenance, construction details, workshop notes, etc. |
| **Price (USD)** | Selling price | $248.00 |
| **Category** | One of: Lighting Fixtures · Glass & Chimneys · Burners & Wicks · Reproduction Signs | Lighting Fixtures |
| **Burner Size** | If applicable: No. 1 · No. 2 · No. 3 · Universal | No. 2 |
| **Material** | Primary material(s) | Brass, cast iron base |
| **Finish Options** | Available finishes if the buyer can choose | Antique Brass, Polished Nickel |
| **Fits / Compatibility** | What it works with (for parts/chimneys) | Fits No. 2 center-draft burners |
| **Stock Quantity** | How many units you currently have | 4 |
| **In Stock?** | Yes or No | Yes |
| **Collection / Series** | If it belongs to a named group | Spring Release 2025 |
| **Edition** | e.g. First Edition, Limited Run | Limited — 4 pieces |
| **Net Weight** | Shipping/display weight | 1.4 kg |
| **Workshop** | Where it was made or restored | Pune Workshop, India |
| **Bench Tester** | Person who tested/verified it | Your name or technician's name |
| **Bench Test Date** | Date of last quality check | March 2025 |
| **Featured?** | Should it appear on the homepage? | Yes / No |
| **Patent / Certificate** | Any patent number or certification mark | Pat. 1873 |

---

### Product Images

For each product, please provide **at least 3 photos**, ideally 5. Images should be:

- **Format:** JPG or PNG (WebP also accepted)
- **Size:** At least 1200 × 1200 px — larger is better
- **Background:** Clean, neutral background (white, light grey, or natural surface like wood/linen)
- **Angles to include:**
  1. Front-facing full product shot
  2. 3/4 angle to show depth
  3. Close-up of detail (burner, chimney, hardware, or label)
  4. Top-down flat lay (optional but great for signs and parts)
  5. Product in use / styled context shot (optional)

> You can send images as a shared Google Drive folder, Dropbox link, or WeTransfer. I will resize and optimise everything for the website.

---

### Signs & Reproduction Products — Extra Fields

If a product is a **Reproduction Sign**, also provide:

| Field | Description |
|-------|-------------|
| **Original Year** | Year the original sign design is from |
| **Original Manufacturer** | The company that originally made it |
| **Reproduction Method** | e.g. Screen-printed on porcelain, lithograph |
| **Dimensions** | Width × Height in cm or inches |
| **Mounting** | How it hangs or mounts |

---

### Store-Level Content (One-Time)

In addition to product data, I will also need the following from you once:

| Item | Details |
|------|---------|
| **Business legal name** | Full registered name for receipts and terms |
| **Business address** | For legal pages and returns |
| **Phone number** | Contact number shown on site |
| **Business email** | The address from your Google Workspace (e.g. hello@acmelamp.co) |
| **Return policy** | How many days, conditions |
| **Shipping policy** | Regions you ship to, estimated times, flat rate or calculated |
| **About / Story** | 2–3 paragraphs about you and the business — who you are, why you do this, what makes your pieces different |
| **Newsletter intro text** | 1–2 sentences shown on the signup form |
| **Social media handles** | Instagram, Facebook, etc. if you have them |
| **Logo file** | If you have a logo (SVG or high-res PNG preferred) |

---

### How to Deliver the Content

The easiest method:
1. Copy the product table above into a Google Sheet (one row per product, one column per field).
2. Create a shared Google Drive folder and upload all product images into subfolders named by SKU (e.g. `/OL-1873-CB/`).
3. Share both the Google Sheet and Drive folder with `jonathan.mauring17@gmail.com`.

Alternatively, you can send me an Excel file and a WeTransfer link for the images — whichever is easiest for you.

---

*Guide prepared for client handoff — Acme Lamp & Sign Co.*
*Developer contact: Peter Paul Lazan - Web Developer
jonathan.mauring17@gmail.com*
