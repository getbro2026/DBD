import { v } from "convex/values";
import { mutation, query } from "./typed";
import { MutationCtx } from "./typed";
import { requireViewer, toCreator, viewer } from "./lib";

const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9._]/g, "");

async function freeHandle(ctx: MutationCtx, base: string): Promise<string> {
  let handle = base;
  for (let i = 0; i < 8; i++) {
    const taken = await ctx.db.query("users").withIndex("by_handle", (q) => q.eq("handleLower", handle)).unique();
    if (!taken) return handle;
    handle = base + Math.floor(100 + Math.random() * 900);
  }
  return base + Date.now().toString().slice(-6);
}

/** Called right after sign-in. Creates the profile the first time, does nothing after that. */
export const ensure = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Log in to do that.");
    const existing = await ctx.db.query("users").withIndex("by_uid", (q) => q.eq("uid", identity.subject)).unique();
    if (existing) return existing._id;

    const phone = identity.phoneNumber;
    const seed = clean(identity.name ?? "") || clean((identity.email ?? "").split("@")[0]) || (phone ? "dancer" + phone.slice(-4) : "dancer");
    const base = (seed.slice(0, 16) || "dancer").padEnd(3, "x");
    const handle = await freeHandle(ctx, base);
    return await ctx.db.insert("users", {
      uid: identity.subject,
      handle,
      handleLower: handle,
      displayName: identity.name ?? (phone ? `Dancer ${phone.slice(-4)}` : handle),
      avatarUrl: identity.pictureUrl,
      headline: "",
      bio: "",
      city: "",
      email: identity.email,
      phone,
      website: "",
      showContact: false,
      verified: false,
    });
  },
});

export const current = query({
  args: {},
  handler: async (ctx) => {
    const me = await viewer(ctx);
    return me ? { ...toCreator(me), headline: me.headline, bio: me.bio, city: me.city, email: me.email ?? null, phone: me.phone ?? null, website: me.website, showContact: me.showContact } : null;
  },
});

export const update = mutation({
  args: {
    displayName: v.string(),
    handle: v.string(),
    headline: v.string(),
    bio: v.string(),
    city: v.string(),
    website: v.string(),
    showContact: v.boolean(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, a) => {
    const me = await requireViewer(ctx);
    const handle = a.handle.trim().replace(/^@/, "");
    if (!/^[A-Za-z0-9._]{3,20}$/.test(handle)) throw new Error("Username: 3 to 20 letters, numbers, dots or underscores.");
    const lower = handle.toLowerCase();
    if (lower !== me.handleLower) {
      const taken = await ctx.db.query("users").withIndex("by_handle", (q) => q.eq("handleLower", lower)).unique();
      if (taken) throw new Error("That username is taken.");
    }
    if (!a.displayName.trim()) throw new Error("Add a display name.");
    await ctx.db.patch(me._id, {
      displayName: a.displayName.trim().slice(0, 40),
      handle,
      handleLower: lower,
      headline: a.headline.trim().slice(0, 60),
      bio: a.bio.trim().slice(0, 160),
      city: a.city.trim().slice(0, 40),
      website: a.website.trim().slice(0, 80),
      showContact: a.showContact,
      ...(a.avatarUrl !== undefined ? { avatarUrl: a.avatarUrl } : {}),
    });
    return { handle };
  },
});

/** A public profile. Email and phone are only included for the owner, or when the owner chose to show them. */
export const byHandle = query({
  args: { handle: v.string() },
  handler: async (ctx, { handle }) => {
    const me = await viewer(ctx);
    const key = handle.replace(/^@/, "").toLowerCase();
    const user = key === "me" && me ? me : await ctx.db.query("users").withIndex("by_handle", (q) => q.eq("handleLower", key)).unique();
    if (!user) return null;
    const isSelf = me?._id === user._id;
    const reveal = isSelf || user.showContact;

    const challenges = (await ctx.db.query("challenges").withIndex("by_creator", (q) => q.eq("creatorId", user._id)).order("desc").take(60)).filter((c) => !c.hidden);
    const responses = (await ctx.db.query("responses").withIndex("by_creator", (q) => q.eq("creatorId", user._id)).order("desc").take(60)).filter((r) => !r.hidden);
    const items = [] as { at: number; type: "challenge" | "response"; challengeId: string; tag: string; posterUrl: string | null; videoUrl: string }[];
    for (const c of challenges) items.push({ at: c._creationTime, type: "challenge", challengeId: c._id, tag: c.tag, posterUrl: c.posterUrl ?? null, videoUrl: c.videoUrl });
    for (const r of responses) {
      const c = await ctx.db.get(r.challengeId);
      if (c && !c.hidden) items.push({ at: r._creationTime, type: "response", challengeId: c._id, tag: c.tag, posterUrl: r.posterUrl ?? null, videoUrl: r.videoUrl });
    }
    items.sort((a, b) => b.at - a.at);

    const subscribers = (await ctx.db.query("subscriptions").withIndex("by_creator", (q) => q.eq("creatorId", user._id)).collect()).length;
    const subscribed = (await ctx.db.query("subscriptions").withIndex("by_follower", (q) => q.eq("followerId", user._id)).collect()).length;
    const isSubscribed = me
      ? !!(await ctx.db.query("subscriptions").withIndex("by_pair", (q) => q.eq("followerId", me._id).eq("creatorId", user._id)).unique())
      : false;

    return {
      profile: {
        ...toCreator(user),
        headline: user.headline,
        bio: user.bio,
        city: user.city,
        showContact: user.showContact,
        email: reveal ? user.email ?? null : null,
        phone: reveal ? user.phone ?? null : null,
        website: reveal && user.website ? user.website : null,
      },
      items: items.map(({ at: _at, ...rest }) => rest),
      counts: { videos: items.length, subscribers, subscribed },
      isSelf,
      isSubscribed,
    };
  },
});
