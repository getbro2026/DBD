export type Creator = {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  verified: boolean;
};

export type ChallengeCard = {
  id: string;
  tag: string;
  caption: string;
  sponsor: string | null;
  videoUrl: string;
  posterUrl: string | null;
  durationSec: number;
  createdAt: number;
  creator: Creator;
  responseCount: number;
};

export type ResponseItem = {
  id: string;
  creator: Creator;
  videoUrl: string;
  posterUrl: string | null;
  durationSec: number;
  accuracy: number | null;
  caption: string;
  likeCount: number;
  likedByMe: boolean;
};

export type ChallengeDetail = {
  challenge: ChallengeCard;
  responses: ResponseItem[];
  commentCount: number;
  subscribedIds: string[];
  viewerId: string | null;
};

export type CommentItem = { id: string; body: string; createdAt: number; user: Creator; isCreator: boolean };

export type Me = Creator & {
  headline: string;
  bio: string;
  city: string;
  email: string | null;
  phone: string | null;
  website: string;
  showContact: boolean;
};

export type ProfileData = {
  profile: Creator & { headline: string; bio: string; city: string; showContact: boolean; email: string | null; phone: string | null; website: string | null };
  items: { type: 'challenge' | 'response'; challengeId: string; tag: string; posterUrl: string | null; videoUrl: string }[];
  counts: { videos: number; subscribers: number; subscribed: number };
  isSelf: boolean;
  isSubscribed: boolean;
};

export type Notice = {
  id: string;
  kind: 'accepted' | 'liked' | 'commented' | 'subscribed';
  actor: Creator;
  challengeId: string | null;
  tag: string | null;
  read: boolean;
  createdAt: number;
};

export type Route =
  | { name: 'home' }
  | { name: 'trending' }
  | { name: 'challenge'; id: string }
  | { name: 'create'; acceptId?: string }
  | { name: 'profile'; handle: string }
  | { name: 'alerts' }
  | { name: 'login' };
