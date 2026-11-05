// DEMO DATA. Fill the app with dummy creators, challenges, responses, comments and likes.
//   npx convex run seed:run                      (local test deployment)
//   npx convex run seed:run '{"meHandle":"kamal"}'   (also subscribes your own account and adds alerts for it)
//   npx convex run seed:clear                    (remove all demo data again)
//   npx convex run --prod seed:run               (production deployment)
// Every demo user has a uid starting with "demo:", so clear only removes demo rows.
import { internalMutationGeneric } from "convex/server";
import { v } from "convex/values";
import type { MutationCtx } from "./typed";
import type { Id } from "./typed";

/**
 * Placeholder clips. These are real people and places, not cartoons, but they are NOT dance videos
 * (short Google sample clips). Replace the URLs with your own dance clips when you have them.
 * Each clip runs 15 seconds, which is above the 10 second minimum.
 */
const BASE = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/";
const DEMO_VIDEOS = ["ForBiggerBlazes.mp4", "ForBiggerEscapes.mp4", "ForBiggerJoyrides.mp4", "ForBiggerMeltdowns.mp4"].map((f) => BASE + f);
const DURATION = 15;

const CREATORS = [
  { handle: "riya.moves", name: "Riya Kapoor", city: "Mumbai", headline: "Baby steps to big moves", bio: "New challenge every Friday.", verified: true },
  { handle: "meera.dances", name: "Meera Joshi", city: "Pune", headline: "Classical meets street", bio: "Kathak for 12 years, hip hop for 3.", verified: false },
  { handle: "arjun.beats", name: "Arjun Mehta", city: "Delhi", headline: "Beats and footwork", bio: "Bhangra, breaking and everything between.", verified: true },
  { handle: "zoya.z", name: "Zoya Zaidi", city: "Hyderabad", headline: "Dance, laugh, repeat", bio: "Weekend choreographer.", verified: false },
  { handle: "kabir.k", name: "Kabir Khanna", city: "Bengaluru", headline: "Freestyle from the roof", bio: "Rooftop sessions every Sunday.", verified: false },
  { handle: "dev.on.beat", name: "Dev Nair", city: "Kochi", headline: "Mallu grooves", bio: "Folk steps with a modern twist.", verified: false },
  { handle: "studio.nritya", name: "Studio Nritya", city: "Chennai", headline: "Dance studio, sponsor of weekly challenges", bio: "Classes for all ages.", verified: true },
];

const CHALLENGES = [
  { by: 0, tag: "#BabyStepChallenge", caption: "Four easy steps, one big smile. Try it!", sponsor: null },
  { by: 2, tag: "#ShoulderRoll30", caption: "A shoulder roll that sticks. 15 seconds.", sponsor: null },
  { by: 1, tag: "#GarbaGlide", caption: "Garba glide, slowed down so you can learn it.", sponsor: null },
  { by: 3, tag: "#WeekendWiggle", caption: "Saturday energy in 15 seconds.", sponsor: null },
  { by: 6, tag: "#NrityaNights", caption: "Sponsored by Studio Nritya. Win a month of free classes.", sponsor: "Studio Nritya" },
  { by: 5, tag: "#KeralaKick", caption: "Folk kick with a groove.", sponsor: null },
];

const COMMENTS = ["So clean! The timing is perfect.", "Trying this tonight, who is in?", "That is wild, love it.", "Next time beside mine please!", "Teach us the second step.", "Goosebumps.", "This made my day."];
const ACCURACY = [92, 88, 81, 95, 77, 86];

export const clear = internalMutationGeneric({
  args: {},
  handler: async (rawCtx) => {
    const ctx = rawCtx as unknown as MutationCtx;
    const users = (await ctx.db.query("users").collect()).filter((u) => u.uid.startsWith("demo:"));
    const ids = new Set<string>(users.map((u) => u._id));
    let removed = 0;
    const drop = async (rows: { _id: Id<any> }[]) => { for (const r of rows) { await ctx.db.delete(r._id); removed++; } };
    await drop((await ctx.db.query("notifications").collect()).filter((n) => ids.has(n.userId) || ids.has(n.actorId)));
    await drop((await ctx.db.query("subscriptions").collect()).filter((s) => ids.has(s.followerId) || ids.has(s.creatorId)));
    await drop((await ctx.db.query("likes").collect()).filter((l) => ids.has(l.userId)));
    await drop((await ctx.db.query("comments").collect()).filter((c) => ids.has(c.userId)));
    const responses = (await ctx.db.query("responses").collect()).filter((r) => ids.has(r.creatorId));
    const challenges = (await ctx.db.query("challenges").collect()).filter((c) => ids.has(c.creatorId));
    const rIds = new Set<string>(responses.map((r) => r._id));
    await drop((await ctx.db.query("likes").collect()).filter((l) => rIds.has(l.responseId)));
    await drop(responses);
    await drop(challenges);
    await drop(users);
    return { removed };
  },
});

export const run = internalMutationGeneric({
  args: { meHandle: v.optional(v.string()) },
  handler: async (rawCtx, { meHandle }) => {
    const ctx = rawCtx as unknown as MutationCtx;
    const existing = (await ctx.db.query("users").collect()).filter((u) => u.uid.startsWith("demo:"));
    if (existing.length > 0) return { skipped: "Demo data is already there. Run seed:clear first to reset it." };

    const users: Id<"users">[] = [];
    for (const c of CREATORS) {
      users.push(await ctx.db.insert("users", {
        uid: `demo:${c.handle}`, handle: c.handle, handleLower: c.handle.toLowerCase(), displayName: c.name,
        headline: c.headline, bio: c.bio, city: c.city,
        email: `${c.handle.replace(/\./g, "")}@example.com`, website: `${c.handle.replace(/\./g, "")}.example.com`,
        showContact: true, verified: c.verified,
      }));
    }

    const challengeIds: Id<"challenges">[] = [];
    const responseIds: Id<"responses">[] = [];
    let n = 0;
    for (const ch of CHALLENGES) {
      const id = await ctx.db.insert("challenges", {
        creatorId: users[ch.by], tag: ch.tag, caption: ch.caption, videoUrl: DEMO_VIDEOS[n % DEMO_VIDEOS.length],
        durationSec: DURATION, ...(ch.sponsor ? { sponsor: ch.sponsor } : {}), hidden: false,
      });
      challengeIds.push(id);
      n++;
      // Two to three responses from other creators.
      const count = 2 + (n % 2);
      for (let k = 1; k <= count; k++) {
        const responder = (ch.by + k) % users.length;
        responseIds.push(await ctx.db.insert("responses", {
          challengeId: id, creatorId: users[responder], caption: `My take on ${ch.tag}`,
          videoUrl: DEMO_VIDEOS[(n + k) % DEMO_VIDEOS.length], durationSec: DURATION,
          accuracy: ACCURACY[(n + k) % ACCURACY.length], hidden: false,
        }));
      }
      for (let k = 0; k < 3; k++) {
        await ctx.db.insert("comments", { challengeId: id, userId: users[(ch.by + k + 2) % users.length], body: COMMENTS[(n + k) % COMMENTS.length] });
      }
    }

    // Likes: each response is liked by a few of the other demo users.
    let likes = 0;
    for (let i = 0; i < responseIds.length; i++) {
      const r = await ctx.db.get(responseIds[i]);
      if (!r) continue;
      const howMany = 2 + (i % 5);
      for (let k = 0; k < howMany; k++) {
        const u = users[(i + k) % users.length];
        if (u === r.creatorId) continue;
        await ctx.db.insert("likes", { responseId: responseIds[i], userId: u });
        likes++;
      }
    }

    // Subscriptions among demo users.
    for (let i = 0; i < users.length; i++) {
      for (const k of [1, 2, 3]) await ctx.db.insert("subscriptions", { followerId: users[i], creatorId: users[(i + k) % users.length] });
    }

    // Optionally make the signed-in person part of the demo: subscribe to a few creators and get alerts.
    let me = "not requested";
    if (meHandle) {
      const mine = await ctx.db.query("users").withIndex("by_handle", (q) => q.eq("handleLower", meHandle.toLowerCase())).unique();
      if (!mine) me = `no account with handle @${meHandle} yet. Sign in once, then run again after seed:clear.`;
      else {
        me = `added alerts for @${meHandle}`;
        for (const k of [0, 2, 4]) await ctx.db.insert("subscriptions", { followerId: mine._id, creatorId: users[k] });
        for (const [i, kind] of (["accepted", "liked", "commented", "subscribed"] as const).entries()) {
          await ctx.db.insert("notifications", { userId: mine._id, actorId: users[i + 1], kind, challengeId: kind === "subscribed" ? undefined : challengeIds[i], read: i > 1 });
        }
      }
    }

    return { creators: users.length, challenges: challengeIds.length, responses: responseIds.length, likes, me };
  },
});
