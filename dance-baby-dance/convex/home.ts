import { query } from "./typed";
import { toCreator, viewer } from "./lib";

/** Counts and suggestions for the signed-in home screen. */
export const summary = query({
  args: {},
  handler: async (ctx) => {
    const me = await viewer(ctx);
    if (!me) return null;
    const mine = (await ctx.db.query("challenges").withIndex("by_creator", (q) => q.eq("creatorId", me._id)).collect()).length
      + (await ctx.db.query("responses").withIndex("by_creator", (q) => q.eq("creatorId", me._id)).collect()).length;
    const subs = await ctx.db.query("subscriptions").withIndex("by_follower", (q) => q.eq("followerId", me._id)).collect();
    const likesGiven = (await ctx.db.query("likes").withIndex("by_user", (q) => q.eq("userId", me._id)).collect()).length;
    const subbed = new Set<string>(subs.map((s) => s.creatorId));
    const people = (await ctx.db.query("users").order("desc").take(30)).filter((u) => u._id !== me._id && !subbed.has(u._id)).slice(0, 8);
    return {
      stats: { posts: mine, subscribed: subs.length, likesGiven },
      suggested: people.map((p) => ({ ...toCreator(p), headline: p.headline })),
    };
  },
});
