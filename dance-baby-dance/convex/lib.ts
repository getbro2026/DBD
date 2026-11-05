import type { Doc } from "./docs";
import type { Id, MutationCtx, QueryCtx } from "./typed";

export type Creator = {
  id: Id<"users">;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  verified: boolean;
};

export const toCreator = (u: Doc<"users">): Creator => ({
  id: u._id,
  handle: u.handle,
  displayName: u.displayName,
  avatarUrl: u.avatarUrl ?? null,
  verified: u.verified,
});

const ghost = (id: Id<"users">): Creator => ({ id, handle: "dancer", displayName: "Dancer", avatarUrl: null, verified: false });

export async function loadCreators(ctx: QueryCtx, ids: Id<"users">[]): Promise<Map<Id<"users">, Creator>> {
  const map = new Map<Id<"users">, Creator>();
  for (const id of new Set(ids)) {
    const u = await ctx.db.get(id);
    map.set(id, u ? toCreator(u) : ghost(id));
  }
  return map;
}

/** The signed-in user's profile row, or null for guests and for people whose profile is not created yet. */
export async function viewer(ctx: QueryCtx): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db.query("users").withIndex("by_uid", (q) => q.eq("uid", identity.subject)).unique();
}

export async function requireViewer(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
  const me = await viewer(ctx as QueryCtx);
  if (!me) throw new Error("Log in to do that.");
  return me;
}

export const MIN_CLIP_SEC = 10;
export const MAX_CLIP_SEC = 60;

export function checkClip(durationSec: number, videoUrl: string) {
  if (!(durationSec >= MIN_CLIP_SEC)) throw new Error("Dances need at least 0:10.");
  if (!(durationSec <= MAX_CLIP_SEC)) throw new Error("Trim it to 1:00 or less.");
  if (!/^https:\/\//.test(videoUrl) || videoUrl.length > 1000) throw new Error("That video link is not valid.");
}

export async function notify(
  ctx: MutationCtx,
  userId: Id<"users">,
  actorId: Id<"users">,
  kind: "accepted" | "liked" | "commented" | "subscribed",
  challengeId?: Id<"challenges">
) {
  if (userId === actorId) return;
  await ctx.db.insert("notifications", { userId, actorId, kind, challengeId, read: false });
}
