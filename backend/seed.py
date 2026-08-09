"""
Sets up the database for a real launch: creates tables, structural categories,
one real admin account (from your .env), and a single seed blog post.

No placeholder products or demo customers are created — add your real
inventory through the admin panel at /admin once this has run.

Usage:
    python seed.py
"""
import os
from app import create_app
from app.extensions import db, bcrypt
from app.models import User, Category, BlogPost, DeliverySettings

app = create_app()

with app.app_context():
    db.drop_all()
    db.create_all()

    # --- Real admin account, pulled from .env ---
    admin_name = os.getenv("ADMIN_NAME", "Store Admin")
    admin_email = os.getenv("ADMIN_EMAIL")
    admin_password = os.getenv("ADMIN_PASSWORD")

    if not admin_email or not admin_password:
        raise SystemExit(
            "Set ADMIN_EMAIL and ADMIN_PASSWORD in your .env file before running seed.py. "
            "See .env.example for the format."
        )

    admin = User(
        name=admin_name,
        email=admin_email.strip().lower(),
        phone=os.getenv("ADMIN_PHONE", ""),
        password_hash=bcrypt.generate_password_hash(admin_password).decode("utf-8"),
        is_admin=True,
        age_confirmed=True,
    )
    db.session.add(admin)

    # --- Structural categories (not placeholder products — you'll add real ones) ---
    categories = [
        Category(name="Massagers", slug="massagers"),
        Category(name="Couples", slug="couples"),
        Category(name="Lubricants", slug="lubricants"),
        Category(name="Wellness", slug="wellness"),
        Category(name="Accessories", slug="accessories"),
    ]
    db.session.add_all(categories)

    # --- Seed blog posts ---
    post1 = BlogPost(
        title="Talking About What You Want: A Practical Guide for Couples",
        slug="talking-about-what-you-want",
        excerpt="Most couples don't struggle with desire — they struggle with the conversation. Here's how to start it.",
        content="""Most couples don't actually struggle with desire — they struggle with the conversation about it.

You've probably had this experience: something felt off, or something felt really good, and you didn't say anything either way. Over time, silence becomes its own kind of habit. Not because you don't care, but because it's genuinely hard to know how to bring it up without it feeling like a big, awkward event.

Here's the good news: it doesn't have to be a big event. Some of the most useful conversations happen in small, low-stakes moments — in the car, during a walk, over text the next morning. You're not scheduling a summit. You're just saying one honest thing.

**Start with curiosity, not correction.** "I loved it when..." lands very differently from "You never...". One opens a door. The other closes one. If something isn't working for you, try leading with what you want more of, rather than what you want to stop.

**Timing matters more than wording.** The middle of an intimate moment is rarely the right time for a detailed conversation — but it's a great time for a single word, a sound, a hand guiding gently. Save the fuller conversation for later, when neither of you needs to be anywhere or perform anything.

**Normalize the check-in.** Some couples do this weekly, some monthly, some only when something feels off. There's no correct frequency. What matters is that it's a normal, expected part of how you communicate — not a crisis meeting that only happens when something's wrong.

**Toys are a conversation, not a verdict.** Bringing something new into the relationship — whether it's a shared toy, a new product, or just an idea from something you read — isn't a comment on what's "missing". Framing it as "I found this and thought it might be fun to try together" keeps it collaborative instead of loaded.

**Discretion is not the same as secrecy.** Wanting privacy around what you order, what you own, or what you're curious about is completely normal — it doesn't mean you're hiding something shameful. That's part of why we ship everything in plain packaging: what you explore together is your business, and ours is just making sure it arrives safely.

If there's one thing worth taking from all of this: the couples who talk about it easily aren't the ones who never feel awkward. They're the ones who've simply had the conversation enough times that the awkwardness stopped being the point.""",
        author="Satin & Seal Team",
        is_published=True,
    )

    post2 = BlogPost(
        title="Choosing Your First Toy: A No-Pressure Guide",
        slug="choosing-your-first-toy",
        excerpt="Overwhelmed by the options? Here's how to think about your first purchase without the guesswork.",
        content="""If you've never bought anything like this before, the sheer number of options can be the most intimidating part — more than the product itself.

Here's a simpler way to think about it.

**Start with what you already know you enjoy.** You don't need to guess in the dark. Think about touch, pressure, and rhythm you already respond to, and look for something that echoes that rather than something entirely unfamiliar. A first purchase doesn't need to be adventurous to be worthwhile.

**Materials matter more than looks.** Body-safe silicone is the standard for a reason — it's non-porous, easy to clean, and doesn't react with your body the way some cheaper materials can. If a product doesn't clearly state its material, that's worth noticing before you notice the price.

**Size is not the main variable.** It's tempting to treat size as the headline decision, but intensity, texture, and control usually matter more for how something actually feels in use. A smaller, well-designed product often outperforms a larger, generic one.

**Quiet matters more than people expect.** If privacy is part of why you're buying discreetly in the first place, a whisper-quiet motor is not a minor feature — it's often the difference between something that fits into your life and something that becomes a source of anxiety.

**You're allowed to start simple.** A single-function product is not a lesser choice. Plenty of people find exactly what they need in something straightforward, and "simple" is often easier to actually use consistently than something with twelve settings you'll never touch.

**Read the product page, not just the photo.** Look for clear language about materials, charging, water resistance, and noise level. If a listing is vague on all four, treat that as useful information in itself.

Whatever you choose, remember that a first purchase is just that — a first one. It doesn't need to be the only one, or the "right" one forever. It just needs to be a reasonable, well-informed place to start.""",
        author="Satin & Seal Team",
        is_published=True,
    )

    post3 = BlogPost(
        title="Caring for What You Own: Cleaning, Storage, and Safety Basics",
        slug="caring-for-what-you-own",
        excerpt="A few basic habits make everything you own last longer and stay genuinely safe to use.",
        content="""Good care habits are unglamorous, but they're the difference between a product that lasts and one that doesn't — and more importantly, between something that's safe and something that isn't.

**Clean before and after every use, not just after.** It's easy to only think about cleaning as an after-the-fact step, but a quick clean before use matters too, especially if something has been stored for a while.

**Match your cleaner to your material.** Body-safe silicone can typically be cleaned with mild soap and warm water, or a dedicated toy cleaner. Avoid anything with strong fragrances or alcohol content unless a product specifically says it's safe for that material — alcohol-based cleaners can degrade silicone over time even when they don't damage it instantly.

**Dry fully before storing.** Trapped moisture is one of the most common causes of material breakdown and odor over time. A few extra minutes of air-drying is a small habit with an outsized effect on how long something lasts.

**Store items separately, not touching each other.** Two silicone products left in contact for a long period can sometimes react with one another. A simple pouch, box, or drawer divider solves this — this is exactly why we sell storage pouches alongside everything else, not as an upsell but as a genuinely useful habit.

**Check compatibility before combining products.** Not every lubricant is safe with every material — silicone-based lubricants, in particular, are often not recommended for use with silicone toys, since they can degrade the surface over time. When in doubt, a water-based lubricant is the safer default.

**Replace, don't push through.** If a product's surface becomes tacky, discolored, or starts to smell different than usual, that's a sign it's time to replace it — not a sign to keep going. This is about your health, not about getting extra mileage out of a purchase.

None of this is complicated once it's a habit. It just has to become one.""",
        author="Satin & Seal Team",
        is_published=True,
    )

    db.session.add_all([post1, post2, post3])

    # --- Default delivery rates (editable later from Admin > Settings) ---
    db.session.add(DeliverySettings(id=1, nairobi_fee=300, outside_fee=700))

    db.session.commit()

    print("Database ready.")
    print(f"  Admin login: {admin_email} / (the password you set in .env)")
    print(f"  {len(categories)} categories created")
    print("  3 blog posts seeded")
    print("  Delivery rates set: KSh 300 (Nairobi) / KSh 700 (outside) — editable in Admin > Settings")
    print("  No demo products, customers, or riders were created — add real ones via /admin")
