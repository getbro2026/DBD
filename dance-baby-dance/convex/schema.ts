import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    uid: v.string(), // Firebase user id
    handle: v.string(),
    handleLower: v.string(),
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
    headline: v.string(),
    bio: v.string(),
    city: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    website: v.string(),
    showContact: v.boolean(),
    verified: v.boolean(),
  })
    .index("by_uid", ["uid"])
    .index("by_handle", ["handleLower"]),

  challenges: defineTable({
    creatorId: v.id("users"),
    tag: v.string(),
    caption: v.string(),
    videoUrl: v.string(),
    posterUrl: v.optional(v.string()),
    durationSec: v.number(),
    sponsor: v.optional(v.string()),
    hidden: v.boolean(),
  }).index("by_creator", ["creatorId"]),

  responses: defineTable({
    challengeId: v.id("challenges"),
    creatorId: v.id("users"),
    caption: v.string(),
    videoUrl: v.string(),
    posterUrl: v.optional(v.string()),
    durationSec: v.number(),
    accuracy: v.optional(v.number()),
    hidden: v.boolean(),
  })
    .index("by_challenge", ["challengeId"])
    .index("by_creator", ["creatorId"]),

  likes: defineTable({
    responseId: v.id("responses"),
    userId: v.id("users"),
  })
    .index("by_response", ["responseId"])
    .index("by_pair", ["responseId", "userId"])
    .index("by_user", ["userId"]),

  comments: defineTable({
    challengeId: v.id("challenges"),
    userId: v.id("users"),
    body: v.string(),
  }).index("by_challenge", ["challengeId"]),

  subscriptions: defineTable({
    followerId: v.id("users"),
    creatorId: v.id("users"),
  })
    .index("by_follower", ["followerId"])
    .index("by_creator", ["creatorId"])
    .index("by_pair", ["followerId", "creatorId"]),

  reports: defineTable({
    reporterId: v.id("users"),
    targetType: v.union(v.literal("challenge"), v.literal("response"), v.literal("comment"), v.literal("user")),
    targetId: v.string(),
    reason: v.string(),
  }),

  notifications: defineTable({
    userId: v.id("users"),
    actorId: v.id("users"),
    kind: v.union(v.literal("accepted"), v.literal("liked"), v.literal("commented"), v.literal("subscribed")),
    challengeId: v.optional(v.id("challenges")),
    read: v.boolean(),
  }).index("by_user", ["userId"]),
});
