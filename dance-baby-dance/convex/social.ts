import { v } from "convex/values";
import { mutation, query } from "./typed";
import { loadCreators, notify, requireViewer, viewer } from "./lib";

export const toggleLike = mutation({
  args: { responseId: v.id("responses") },
  handler: async (ctx, { responseId }) => {
    const me = await requireViewer(ctx);
    const r = await ctx.db.get(responseId);
    if (!r) throw new Error("That response is not available.");
    const existing = await ctx.db.query("likes").withIndex("by_pair", (q) => q.eq("responseId", responseId).eq("userId", me._id)).unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    }
    await ctx.db.insert("likes", { responseId, userId: me._id });
    await notify(ctx, r.creatorId, me._id, "liked", r.challengeId);
    return true;
  },
});

export const comments = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, { challengeId }) => {
    const ch = await ctx.db.get(challengeId);
    const rows = await ctx.db.query("comments").withIndex("by_challenge", (q) => q.eq("challengeId", challengeId)).order("asc").take(200);
    const users = await loadCreators(ctx, rows.map((r) => r.userId));
    return rows.map((r) => ({ id: r._id, body: r.body, createdAt: r._creationTime, user: users.get(r.userId)!, isCreator: ch?.creatorId === r.userId }));
  },
});

export const addComment = mutation({
  args: { challengeId: v.id("challenges"), body: v.string() },
  handler: async (ctx, { challengeId, body }) => {
    const me = await requireViewer(ctx);
    const text = body.trim();
    if (!text) throw new Error("Write something first.");
    if (text.length > 300) throw new Error("Comments can be up to 300 characters.");
    const ch = await ctx.db.get(challengeId);
    if (!ch || ch.hidden) throw new Error("That challenge is not available.");
    await ctx.db.insert("comments", { challengeId, userId: me._id, body: text });
    await notify(ctx, ch.creatorId, me._id, "commented", challengeId);
  },
});

export const toggleSubscribe = mutation({
  args: { handle: v.string() },
  handler: async (ctx, { handle }) => {
    const me = await requireViewer(ctx);
    const target = await ctx.db.query("users").withIndex("by_handle", (q) => q.eq("handleLower", handle.replace(/^@/, "").toLowerCase())).unique();
    if (!target) throw new Error("That creator was not found.");
    if (target._id === me._id) throw new Error("You cannot subscribe to yourself.");
    const existing = await ctx.db.query("subscriptions").withIndex("by_pair", (q) => q.eq("followerId", me._id).eq("creatorId", target._id)).unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    }
    await ctx.db.insert("subscriptions", { followerId: me._id, creatorId: target._id });
    await notify(ctx, target._id, me._id, "subscribed");
    return true;
  },
});

export const report = mutation({
  args: {
    targetType: v.union(v.literal("challenge"), v.literal("response"), v.literal("comment"), v.literal("user")),
    targetId: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, a) => {
    const me = await requireViewer(ctx);
    if (a.reason.trim().length < 3) throw new Error("Tell us briefly what is wrong.");
    await ctx.db.insert("reports", { reporterId: me._id, targetType: a.targetType, targetId: a.targetId, reason: a.reason.trim().slice(0, 300) });
  },
});

export const notifications = query({
  args: {},
  handler: async (ctx) => {
    const me = await viewer(ctx);
    if (!me) return { items: [], unread: 0 };
    const rows = await ctx.db.query("notifications").withIndex("by_user", (q) => q.eq("userId", me._id)).order("desc").take(40);
    const actors = await loadCreators(ctx, rows.map((r) => r.actorId));
    const items = [];
    for (const r of rows) {
      const ch = r.challengeId ? await ctx.db.get(r.challengeId) : null;
      items.push({ id: r._id, kind: r.kind, actor: actors.get(r.actorId)!, challengeId: r.challengeId ?? null, tag: ch?.tag ?? null, read: r.read, createdAt: r._creationTime });
    }
    return { items, unread: items.filter((i) => !i.read).length };
  },
});

export const markNotificationsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const me = await requireViewer(ctx);
    const rows = await ctx.db.query("notifications").withIndex("by_user", (q) => q.eq("userId", me._id)).collect();
    for (const r of rows) if (!r.read) await ctx.db.patch(r._id, { read: true });
  },
});
