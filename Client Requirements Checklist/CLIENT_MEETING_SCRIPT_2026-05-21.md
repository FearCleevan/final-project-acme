# Acme Lamp & Sign Co. — Client Meeting Script
## Pre-Launch Briefing · May 21, 2026
### Presenter: Developer · Client: Scott (Nova Scotia, Canada)

> **Purpose of this meeting:** Walk the client through the current state of the project, present the prototype, explain the technology stack, and capture all client-side action items needed before backend integration can begin.
>
> **Duration:** Approximately 60–90 minutes
> **Format:** Screen share + discussion

---

## ⚠️ DEVELOPER CONTEXT — READ BEFORE THE MEETING

**Everything visible in this prototype is placeholder content created by the developer.**
The goal was to build a fully alive, realistic-feeling website so the client can see exactly what the final product will look and feel like. Not a wireframe — a working demonstration.

| Prototype Element | Reality |
|---|---|
| Brand name "Acme Lamp & Sign Co." | Working name only — Scott will register the final business name |
| All product names, SKUs, descriptions | Developer-written samples based on the product category |
| All pricing ($14–$586) | Placeholder — Scott to confirm real prices |
| Logo / wordmark | Developer-created typographic placeholder |
| Address "14 Pirie Street, Adelaide SA 5000" | **Incorrect** — Scott is based in Nova Scotia, Canada |
| Phone "+61 8 7000 1873" | **Incorrect** — Australian number, client is in Canada |
| Email "hello@acmelamp.co" | Placeholder — real business email not yet created |
| Currency (AUD) | **Incorrect** — target market is North America, should be CAD/USD |
| "R.K. Patel", bench tester names, workshop details | All fictional — created to demonstrate the spec table |
| Testimonials | Fictional — placeholder names and quotes |
| Heritage timeline (1873–2026) | Partially fictional — dates and events need client confirmation |
| Journal articles | Developer-written placeholder editorial copy |
| Shipping zones (AU/US) | Placeholder — real zones and rates need client confirmation |

**The structure, design, interactions, and all technical functionality are real and production-ready. The words and numbers are not.**

---

### Real Client Facts (from initial discovery call)

| Fact | Detail |
|---|---|
| Client name | Scott |
| Location | Nova Scotia, Canada |
| Business type | 42-year sign manufacturing company (existing: AcmeSign.ca) |
| New project | E-commerce store for reproduction vintage oil lamp parts and advertising signs |
| Supplier | Australian contact with manufacturing plant in India |
| Inventory | Container already received — goods physically on hand in Nova Scotia |
| Target market | **North America** (Canada + USA) |
| Product count | ~50 items for first release |
| Business name | Working name "Acme Lamp and Sign" — Scott will refine and register |
| Photography | Scott will photograph inventory himself (mentioned items are pulled out) |
| Competitor research | Scott will share competitor links + supplier's eBay store link |
| Tech comfort | Self-described late adopter — keep explanations simple, avoid jargon |
| Future projects | 1. This oil lamp site (now) → 2. Rebuild AcmeSign.ca → 3. Digital sign website |
| Design preference | Vintage/antique feel, NOT flashy, NOT template-looking, creative and considered |
| Motivation | Moving from custom sign jobs toward fixed-price e-commerce ("here's the price, click, pay, send") |

---

## PART 1 — OPENING (5 min)

**[Say this]**

> "Scott, thank you for your time today. I want to use this meeting to show you the prototype we've built, walk you through what we're recommending for the technology setup, and go through a list of things we need from you before we can connect the live backend and get this store actually selling.
>
> Before I show you the site, I want to be upfront about one thing: **everything you're about to see is a working demonstration.** The design, the layout, the interactions, the full shopping flow from browsing to checkout — all real and production-ready. But the words, the product names, the prices, the address, the phone number — all of that is placeholder content I created to make the site feel alive. None of it is your real content yet. One of the goals of today is to figure out exactly what we need from you to replace it all with the real thing.
>
> Sound good? Let me share my screen."

---

## PART 2 — PROTOTYPE OVERVIEW (10 min)

**[Say this before showing the screen]**

> "I want to mention upfront — I built **three different prototype designs** for this project. Three completely different visual directions. Today we're looking at the one I believe is the strongest match for what you described: vintage feel, premium positioning, nothing that looks like it came from a template. I'll show you all three, but today's focus is this design and the action items.

**[Screen share — walk through these pages in order. Keep commentary simple — Scott is not a tech person.]**

1. `/` — Homepage: "This is the first thing a customer sees."
2. `/catalog` — "This is the full product listing. Customers can filter by type, material, size."
3. `/catalog/[any-product]` — "Each product gets its own page — photos, technical specs, what it fits, who tested it."
4. `/crate` → `/checkout` — "Cart, checkout, the whole purchase flow. It works end to end."
5. `/checkout/confirmed` → `/track-order` — "Order confirmation and live tracking."
6. `/account` — "Customer accounts — order history, saved address."
7. `/heritage` + `/our-story` — "Brand story pages. This is where the history of the craft lives."
8. `/journal` — "Editorial section — articles, bench notes. Content you can update yourself."
9. `/faq` + `/shipping` + `/returns` — "Support pages."

**[Key advantages to highlight — in plain language for Scott]**

> "Let me tell you why this is the design I'm recommending:
>
> **It looks like what you described.** You said you didn't want it to look like a tech startup. You wanted vintage, premium, considered. Dark background, brass-toned text, serif fonts, editorial layout. This looks like a store that respects the craftsmanship of what it's selling. That matters when you're asking someone to pay $200 for a lamp part.
>
> **It's designed for a curated catalog, not a warehouse.** You've got roughly 50 pieces for this first release. This design treats each one as a featured item — not just a row in a spreadsheet. Each product gets a full page: the history behind it, who made it, what it fits, the specification table. That's how you justify the price point and stand out from competitors.
>
> **Every flow works, right now.** Browse, filter, add to cart, check out, confirm, track an order, create an account, view order history. Not mockups — it all works. I built it so you could hand this to a customer today and they could go through the whole experience.
>
> **You'll be able to update content yourself.** Once we connect the CMS, you'll have a simple browser editor where you can write and publish Journal articles, update the Heritage page, change testimonials — without touching any code. That was important because you mentioned you don't want to be dependent on a developer for every small change.
>
> **It's built to expand.** You said you want to start with ~50 items and grow. The catalog system handles that — there's no ceiling. And when you're ready to add new categories, that's a straightforward addition.
>
> **Mobile works.** A large percentage of your traffic will come from phones. The catalog shows two columns on mobile — same density as desktop. Everything is tappable and readable."

---

## PART 3 — TECH ARCHITECTURE (5 min)

**[Keep this simple — Scott said tech doesn't come naturally. Use the analogy.]**

> "Before we go through what I need from you, let me explain the three services that power this site in plain terms. Think of it like a physical store:

```
┌────────────────────────────┐
│    The Website             │  ← What your customers see (hosted on Vercel)
└────┬──────────────┬────────┘
     │                        │
[The Cash Register]    [The Signage & Displays]
     ▼                        ▼
┌──────────────┐      ┌──────────────┐
│   Shopify    │      │  Sanity CMS  │
└──────────────┘      └──────────────┘
• Your 50 products    • Journal articles
• Stock levels        • Heritage story
• Cart & checkout     • Our Story copy
• Prices              • Testimonials
• Customer accounts   • Page copy & images
• Orders & shipping
```

> **Shopify** is the cash register and stockroom. It holds your products, tracks your inventory, processes payments, manages customer accounts, and records every order. When a customer buys something, Shopify handles the transaction.
>
> **Sanity** is your display case and signage — the editorial side. Journal articles, the heritage story, testimonials, the 'Our Story' page. You'll be able to edit all of that yourself from a simple web editor, like writing an email.
>
> **Vercel** is the building. It's where the website lives and what delivers it to your customers fast. It handles security, uptime, and performance.
>
> Three services. Three monthly costs. I'll go through what each one costs in a moment."

---

## PART 4 — PLACEHOLDER CONTENT DISCUSSION (10 min)

> "Before we get into accounts and setup, I want to walk through the placeholder content together, because this is all stuff I need from you to replace with the real thing."

### 4.1 — Business Name & Domain

> "You mentioned you're still working on the name. 'Acme Lamp and Sign' is the working name — you said you'd sit down this week and come up with what you want to register. That's the first thing I'd love to lock in, because the domain name flows from the business name.
>
> When you've got the name, I'd recommend buying the domain at **Namecheap** or **Cloudflare** — not through Shopify, not through GoDaddy. It's cheaper, you own it independently, and I can configure everything from there.
>
> Since your market is North America, a `.com` is the natural choice for credibility across Canada and the US. If you want to emphasise the Canadian side, `.ca` works too. I'd actually suggest grabbing both if they're available — they're $15–25 a year each.
>
> Once you have the domain, I'll handle pointing it to the website, setting up the SSL certificate (the padlock icon — required for taking payments), and the email configuration. You don't need to touch the DNS settings yourself."

---

### 4.2 — Business Details (All Placeholder Right Now)

**[Show the Contact page and footer on screen]**

> "Everything you see here — the address, the phone number, the email, the ABN — is all placeholder. The prototype has an Australian address because that's where the supplier is, but this is YOUR store in Nova Scotia. I need the real details from you:

| What I need | Why |
|---|---|
| Your registered business name | Appears on invoices, Shopify legal documents |
| Your Canadian business number | For tax compliance at checkout |
| Your physical business address (Nova Scotia) | Contact page, footer, Shopify settings |
| Your real phone number | Contact page — customers will call this |
| Business hours | When can customers expect a response? |
| Whether you're charging HST | Nova Scotia HST is 15% — Shopify needs to know |

> "None of this is complicated — it's just confirming what's real versus what I put in as a placeholder."

---

### 4.3 — All Product Content is Placeholder

**[Show a product page on screen — point at the description, spec table, pricing]**

> "Every word on these product pages — the name, the description, the specification table, the 'what it fits' section, the bench tester name, the workshop location — I wrote all of that as sample content to demonstrate what the page layout can do. None of it is your real copy.
>
> You mentioned your Australian contact has an eBay store and you'd send me the link. That's exactly what I need — once I can see their listings, I can research the product names, specs, and descriptions and write the real copy for your 50 items. We also talked about you taking photographs of the inventory in the next day or two.
>
> The pricing is also all placeholder. You'll need to go through the catalog and confirm what you want to charge for each item."

**[Action items to note:]**
- Share the eBay store link + competitor websites Scott mentioned
- Confirm when photography will be ready
- Review and approve product descriptions once written
- Confirm final prices for all 50 items
- Provide inventory count per item (Shopify needs this to track stock)

---

### 4.4 — Currency: AUD → CAD/USD

> "The prototype currently shows prices in Australian dollars because the placeholder was built around the supplier's location. Your store sells to North Americans — Canada and the US. We need to decide: do you want to price in Canadian dollars, US dollars, or both?
>
> Most Canadian e-commerce stores selling to both markets price in USD — it's the common currency your US customers expect, and Canadians are used to seeing USD for online purchases. Shopify can show prices in CAD to Canadian visitors automatically if you want that.
>
> This is a business decision for you — I just need to know before I set up Shopify so the checkout is configured correctly from day one."

---

## PART 5 — CLIENT ACTION ITEMS (20 min)

> "Now let's go through everything I need from you to get this live. I've organised it into three buckets: accounts you need to create, content you need to provide, and decisions you need to make."

---

### BUCKET 1 — ACCOUNTS TO CREATE

| Account | Where | Monthly Cost | Time to Set Up |
|---|---|---|---|
| **Shopify** | shopify.com | ~$29 USD/month | 20 min |
| **Vercel** (hosting) | vercel.com | $20 USD/month | 10 min |
| **Sanity** (content) | sanity.io | Free | 5 min |
| **Business email** | Google Workspace | ~$7 USD/month | 20 min |
| **Google Analytics** | analytics.google.com | Free | 10 min |
| **Google Search Console** | search.google.com/search-console | Free | 5 min |
| **Mailchimp** (newsletter) | mailchimp.com | Free to start | 10 min |
| **Domain name** | namecheap.com | ~$20/year | 10 min |

**Shopify — the most important one:**
> "Start with the Basic plan at $29/month. Do not upgrade yet. When you create the account, you'll be asked to set up Shopify Payments — this is important because it avoids an extra 0.5–2% transaction fee on every sale. You'll need your business bank account and Canadian business number for that step. Once your account is created, invite me as a Staff member with full permissions — I'll walk you through that."

**Vercel:**
> "Upgrade to the Pro plan at $20/month — the free tier doesn't allow commercial use. Once your account is set up, add me as a team member with Admin access."

**Business email:**
> "Before we go live you'll want a professional email — something like `hello@[yourbusinessname].com`. Google Workspace at $7/month is the easiest option. You also mentioned you use Android and a Google Pixel — it'll integrate naturally with everything you're already using."

---

### BUCKET 2 — CONTENT TO PROVIDE

| Item | Format | Priority |
|---|---|---|
| Business name (final, registered) | Text | First |
| Business address (Nova Scotia) | Text | First |
| Phone number | Text | First |
| eBay store link from Australian supplier | URL | First |
| Competitor website links | URLs | First |
| Product photography (50 items) | JPEGs, min 2000px, warm neutral background | Critical path |
| Inventory count per item | Simple list: item → quantity | Before Shopify setup |
| Prices for all 50 items | Review `/catalog` page | Before launch |
| Product weight per item (approximate) | For shipping rate calculations | Before launch |
| Heritage timeline dates — confirm accuracy | Review `/heritage` | Before launch |
| Our Story copy — review and approve | Review `/our-story` | Before launch |
| 3–6 Journal articles | Title + 300–600 words each, author name | Before launch |
| Hero photograph | One editorial shot of a lamp, warm atmospheric lighting | Critical |
| Category images (4) | One per category — Lighting, Chimneys, Hardware, Signs | Critical |

**On photography specifically:**
> "You mentioned you've got everything pulled out and you're planning to photograph in the next day or two — that's exactly what I need. A few tips: warm light is better than flash, a neutral background like a wooden workbench or cream cloth works well for vintage pieces, and shoot at least 2–3 angles per item. Even smartphone photos in good natural light are a solid starting point — we can refine from there. Name the files by what the item is so I can match them to products."

---

### BUCKET 3 — DECISIONS TO MAKE

| Decision | Options | My Recommendation |
|---|---|---|
| Final business name | TBD — Scott to confirm | Decide before domain purchase |
| Domain extension | `.com` / `.ca` / both | `.com` for North American reach + `.ca` as backup |
| Pricing currency | USD / CAD / both | USD for North American appeal |
| Shipping regions | Canada only / US included / international | Start with Canada + US, expand later |
| Free shipping threshold | Currently placeholder at $150 | Confirm based on your real shipping costs |
| HST on purchases | Charge HST to Canadian customers? | Yes if HST-registered — Shopify handles automatically |
| PayPal as payment option | Add alongside Shopify Payments? | Optional but useful for higher-priced items |

---

## PART 6 — COST SUMMARY (5 min)

| Service | Monthly Cost (USD) | Notes |
|---|---|---|
| Shopify Basic | $29/month | The store engine |
| Vercel Pro | $20/month | Hosting |
| Google Workspace | $7/month | Business email |
| Sanity CMS | Free | Content editing |
| Google Analytics | Free | Traffic + conversion tracking |
| Mailchimp | Free (up to 500 subscribers) | Newsletter |
| **Total ongoing** | **~$56 USD/month** | Plus domain ~$20/year |

> "To run a live e-commerce store that looks and functions at this level — $56 USD a month. Shopify also takes a 2% payment processing fee on transactions, which is standard. That only applies when you're making sales."

---

## PART 7 — TIMELINE (5 min)

| Phase | What Happens | Who | Timing |
|---|---|---|---|
| **Now** | Finalize business name, start accounts, photograph inventory | Scott | This week |
| **Week 1–2** | Photo delivery + Shopify/Sanity accounts ready | Scott + Dev | Week 1–2 |
| **Week 2–3** | Backend connected — products, cart, checkout live | Developer | Week 2–3 |
| **Week 3** | CMS connected — journal, heritage, real testimonials | Developer | Week 3 |
| **Week 3–4** | Real photos + real product copy in the store | Developer | Week 3–4 |
| **Week 4** | Full review — Scott approves every page | Scott + Dev | Week 4 |
| **Week 4–5** | Domain pointed, store live | Developer | Week 4–5 |

> "The critical path is photography. The code is done — I can start the backend integration this week once I have your Shopify staff invite and inventory counts. Photography is the one thing that directly controls the launch date. Everything else runs in parallel.
>
> And I want to echo what you said in our first call: there'll probably be a few hiccups in the startup period. That's completely normal. Once we get through that initial phase and everyone knows what's going on, it flows much smoother."

---

## PART 8 — CLOSE (5 min)

**[Say this]**

> "That's everything for today. I'll send you the written checklist document after this call — every item we discussed with tick boxes.
>
> The three things I need first, in priority order:
> 1. **Final business name** — so I know what domain to register
> 2. **Shopify account + staff invite** — so I can start product setup
> 3. **eBay store link + competitor links** — so I can research the real product content
>
> And whenever the photos are ready, send them over.
>
> I know technology isn't where you grew up, and I appreciate your patience as we get this built. I'll keep things simple and explain anything that's unclear. Peter and Pat will be your daily contacts — don't hesitate to reach out with any questions.
>
> Any questions before we wrap up?"

---

## PART 9 — ANTICIPATED QUESTIONS & ANSWERS

---

### On the Prototype Content

**Q: The website shows Australian addresses and Australian dollars — are you building this for Australia?**

> "No — that's all placeholder content I created to make the demonstration site look complete. Your store will show your Nova Scotia address, Canadian/US pricing, and North American shipping options. Everything you see in the prototype in terms of words and numbers needs to be replaced with your real information. The design and functionality are what's real."

**Q: Who wrote all the product descriptions?**

> "I did — as sample content. I wrote them to show what level of detail is possible on each product page. Once you send me the eBay store link and competitor links you mentioned, I'll research the real product names, specifications, and descriptions and rewrite everything properly. The descriptions on the prototype are a template, not final copy."

**Q: The brand name 'Acme Lamp & Sign Co.' — is that what I'm registering?**

> "That's the working name we've used for the build. You mentioned in our first conversation that you were going to sit down this week and come up with the name you want to register. Once you've landed on that, let me know and I'll check domain availability and we can proceed from there."

---

### On the Existing Website (AcmeSign.ca)

**Q: What about my existing sign website?**

> "That's a separate project — we agreed in our first call to keep the two businesses completely independent. AcmeSign.ca stays as-is while we build the oil lamp store. Once this new store is live and running smoothly, we can revisit AcmeSign.ca and rebuild it with the same level of quality. But for right now, all focus goes on getting the lamp store launched."

---

### On Shopify

**Q: Do I need the more expensive Shopify plan?**

> "No — Basic at $29/month is all you need for the Spring Release. You get unlimited products, full checkout, Shopify Payments, and 2 staff accounts. The main reason to upgrade later would be better sales reporting once the store is active. Start with Basic."

**Q: What are Shopify's transaction fees?**

> "With Shopify Payments enabled: approximately 2.9% + 30¢ per transaction in Canada. No additional Shopify percentage fee on top. That's standard for Canadian e-commerce. If you ever add PayPal as an option, PayPal has their own fee structure on top, but Shopify doesn't add extra."

**Q: Can I manage the products myself once it's live?**

> "Yes — adding new products, updating prices, adjusting inventory — all of that is done through the Shopify Admin, which is a straightforward web dashboard. I'll do a walkthrough with you before launch so you're comfortable. You won't need a developer to manage day-to-day product changes."

---

### On Photography

**Q: Do I really need professional photography or will my own photos work?**

> "Your own photos absolutely can work, especially for a first launch. You mentioned you're planning to photograph the inventory yourself in the next day or two — that's the right instinct. The key things are: good natural light (near a window, not flash), a consistent warm neutral background across all shots, and shoot the item from a few angles. Even a decent smartphone in good light can produce usable product photos. Once the store is live and trading, investing in a professional shoot for a second round of images is a great way to lift conversion rates."

**Q: What if I don't have photos ready in time?**

> "I can use styled placeholder images to keep the structure complete while we wait for real photos. The store can be fully built and functional with placeholders — we just swap in your real photos when they're ready. It doesn't block the build."

---

### On the Business Name

**Q: Does the name have to be decided before we can start?**

> "Not before we start the build — the code doesn't care what the business is called. But you'll need the name before you can purchase the domain, set up Shopify, create the business email, and register with Google Analytics. So it's the first real-world decision on the critical path. Take the time to get it right — this is the name that goes on every invoice, every order confirmation email, and the URL your customers type in."

---

### On the North American Market

**Q: Should I sell to both Canada and the US from day one?**

> "Yes, I'd recommend it. Your inventory is already on hand in Nova Scotia — shipping domestically within Canada and across the border to the US is straightforward. Shopify handles both markets, different tax rules, and multiple currencies. Starting with both markets doubles your addressable audience without any significant extra effort on your side."

**Q: What currency should prices be in?**

> "USD is the path of least resistance for North American e-commerce. American customers — who represent the larger market — expect to see USD. Canadian customers are accustomed to USD pricing for online purchases. Shopify can automatically display CAD to Canadian visitors if you want to add that, but USD as the base currency is the simpler and more universal choice."

---

### On the Tech Setup

**Q: This sounds like a lot of accounts to set up. Is there a simpler way?**

> "The accounts themselves are straightforward — most take under 10 minutes each. What you're setting up is: the store engine, the hosting, the content editor, the email, and Google's free analytics tools. Each one does a specific job that can't be done by another. Once they're set up, you don't need to think about them — they just run. I'll walk you through each one and do all the technical configuration. You're mostly just creating the accounts and handing me the access."

**Q: What happens if one of these services shuts down or I want to switch?**

> "Shopify: your product data, orders, and customer data can be exported at any time. Vercel: the codebase is standard Next.js and can be moved to another host. Sanity: all content can be exported as JSON. You're not locked into any of these services. I'd recommend sticking with them for at least the first 12 months to keep things stable, but you always own your data."

---

## MEETING CLOSE CHECKLIST

Before ending the call, confirm Scott has noted:

- [ ] Will finalise business name this week
- [ ] Will purchase domain once name is confirmed
- [ ] Will create Shopify account and send developer staff invite
- [ ] Will create Vercel account and send developer admin access
- [ ] Will create Sanity account — developer will send project invite
- [ ] Will set up Google Workspace business email
- [ ] Will set up Google Analytics 4 and Search Console
- [ ] Will create Mailchimp account
- [ ] Will photograph inventory in the next 1–2 days and send photos
- [ ] Will send eBay store link + competitor website links
- [ ] Will provide inventory counts per item (quantity on hand)
- [ ] Will confirm prices for all 50 items by reviewing `/catalog`
- [ ] Will confirm business address, phone number, HST status
- [ ] Will confirm North American shipping zones and free freight threshold

**Next touchpoint:** Developer sends written checklist document + Shopify staff invite link to Scott.

---

## APPENDIX — CLIENT GOAL SUMMARY (extracted from discovery call)

Scott's goals, in his own words and intent:

1. **Build a new e-commerce website for vintage oil lamp parts and advertising signs** — completely separate from his existing AcmeSign.ca sign business.

2. **Sell ~50 items from existing inventory** that arrived in a container from Australia (manufactured in India). He already has the goods on hand in Nova Scotia and wants to start selling immediately.

3. **Target the North American market** — Canada and the United States.

4. **Move toward fixed-price e-commerce** — "here's the price, here's the colours, if you want it, click the button, pay for it, we'll send it to you." He is intentionally stepping away from custom sign jobs after 42 years.

5. **Vintage/antique aesthetic** — "We want it to look like that and not a flashy thing like a new tech startup." The customers who buy these items are older, appreciate craftsmanship, and expect the website to reflect the nature of the product.

6. **Not template-looking** — "Sometimes you go on a website and it looks like it was put together through a template and there was no extra thought given to it — just blocks, block, block. I'm trying to avoid that."

7. **Products that stand out from competitors** — he plans to share competitor and supplier links. Their photos and descriptions are currently weak — "lots of room for improvement."

8. **Scale and expand** — first launch is oil lamps and vintage signs, then expand to other product lines. Future projects include rebuilding AcmeSign.ca and a separate digital sign website.

9. **Low technical dependency** — he is a self-described late adopter of technology and wants a system he or someone on his team can manage without constant developer involvement.

10. **Partnership, not a transaction** — he was introduced by a mutual contact (John Hardy) and expects a long-term working relationship with regular updates and communication.

---

*Prepared for Acme Lamp & Sign Co. Client Meeting · May 21, 2026*
*Developer Notes · All prototype content is developer-created placeholder · No final client content yet committed*
