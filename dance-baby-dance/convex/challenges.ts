import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./typed";
import type { Doc } from "./docs";
import { checkClip, loadCreators, notify, requireViewer, toCreator, viewer } from "./lib";

async function toCards(ctx: QueryCtx, rows: Doc<"challenges">[]) {
  const creators = await loadCreators(ctx, rows.map((r) => r.creatorId));
  const cards = [];
  for (const c of rows) {
    const responses = await ctx.db.query("responses").withIndex("by_challenge", (q) => q.eq("challengeId", c._id)).collect();
    cards.push({
      id: c._id,
      tag: c.tag,
      caption: c.caption,
      sponsor: c.sponsor ?? null,
      videoUrl: c.videoUrl,
      posterUrl: c.posterUrl ?? null,
      durationSec: c.durationSec,
      createdAt: c._creationTime,
      creator: creators.get(c.creatorId)!,
      responseCount: responses.filter((r) => !r.hidden).length,
    });
  }
  return cards;
}

export const list = query({
  args: { sort: v.union(v.literal("hot"), v.literal("new"), v.literal("sponsored")) },
  handler: async (ctx, { sort }) => {
    const rows = (await ctx.db.query("challenges").order("desc").take(100)).filter((c) => !c.hidden && (sort !== "sponsored" || c.sponsor));
    const cards = await toCards(ctx, rows);
    if (sort === "hot") cards.sort((a, b) => b.responseCount - a.responseCount || b.createdAt - a.createdAt);
    return cards.slice(0, 40);
  },
});

export const get = query({
  args: { id: v.id("challenges") },
  handler: async (ctx, { id }) => {
    const me = await viewer(ctx);
    const row = await ctx.db.get(id);
    if (!row || row.hidden) return null;
    const [challenge] = await toCards(ctx, [row]);
    const rs = (await ctx.db.query("responses").withIndex("by_challenge", (q) => q.eq("challengeId", id)).order("desc").take(50)).filter((r) => !r.hidden);
    const creators = await loadCreators(ctx, rs.map((r) => r.creatorId));
    const responses = [];
    for (const r of rs) {
      const likes = await ctx.db.query("likes").withIndex("by_response", (q) => q.eq("responseId", r._id)).collect();
      responses.push({
        id: r._id,
        creator: creators.get(r.creatorId)!,
        videoUrl: r.videoUrl,
        posterUrl: r.posterUrl ?? null,
        durationSec: r.durationSec,
        accuracy: r.accuracy ?? null,
        caption: r.caption,
        likeCount: likes.length,
        likedByMe: me ? likes.some((l) => l.userId === me._id) : false,
      });
    }
    const commentCount = (await ctx.db.query("comments").withIndex("by_challenge", (q) => q.eq("challengeId", id)).collect()).length;
    const subscribedIds: string[] = [];
    if (me) {
      for (const cid of new Set([row.creatorId, ...rs.map((r) => r.creatorId)])) {
        const s = await ctx.db.query("subscriptions").withIndex("by_pair", (q) => q.eq("followerId", me._id).eq("creatorId", cid)).unique();
        if (s) subscribedIds.push(cid);
      }
    }
    return { challenge, responses, commentCount, subscribedIds, viewerId: me?._id ?? null };
  },
});

export const create = mutation({
  args: { tag: v.string(), caption: v.string(), videoUrl: v.string(), posterUrl: v.optional(v.string()), durationSec: v.number() },
  handler: async (ctx, a) => {
    const me = await requireViewer(ctx);
    const tag = a.tag.trim().replace(/^#/, "");
    if (!/^[A-Za-z0-9_]{3,30}$/.test(tag)) throw new Error("Name your challenge with 3 to 30 letters or numbers, for example BabyStepChallenge.");
    checkClip(a.durationSec, a.videoUrl);
    return await ctx.db.insert("challenges", {
      creatorId: me._id,
      tag: "#" + tag,
      caption: a.caption.trim().slice(0, 120),
      videoUrl: a.videoUrl,
      posterUrl: a.posterUrl,
      durationSec: a.durationSec,
      hidden: false,
    });
  },
});

export const addResponse = mutation({
  args: {
    challengeId: v.id("challenges"),
    caption: v.string(),
    videoUrl: v.string(),
    posterUrl: v.optional(v.string()),
    durationSec: v.number(),
    accuracy: v.optional(v.number()),
  },
  handler: async (ctx, a) => {
    const me = await requireViewer(ctx);
    const ch = await ctx.db.get(a.challengeId);
    if (!ch || ch.hidden) throw new Error("That challenge is not available.");
    checkClip(a.durationSec, a.videoUrl);
    const accuracy = a.accuracy === undefined ? undefined : Math.max(0, Math.min(100, Math.round(a.accuracy)));
    const id = await ctx.db.insert("responses", {
      challengeId: ch._id,
      creatorId: me._id,
      caption: a.caption.trim().slice(0, 120),
      videoUrl: a.videoUrl,
      posterUrl: a.posterUrl,
      durationSec: a.durationSec,
      accuracy,
      hidden: false,
    });
    await notify(ctx, ch.creatorId, me._id, "accepted", ch._id);
    return id;
  },
});

export { toCreator };
