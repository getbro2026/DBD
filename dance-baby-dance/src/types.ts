export type Creator = {
  handle: string;
  initials: string;
};

export type Response = {
  id: string;
  creator: Creator;
  durationSec: number;
  likes: number;
  liked?: boolean;
  /** Set by the accuracy score later. Undefined until that feature exists. */
  accuracy?: number;
  caption?: string;
  /** Local or hosted video uri. Sample data has none and shows an animated placeholder. */
  uri?: string;
};

export type Challenge = {
  id: string;
  tag: string;
  creator: Creator;
  durationSec: number;
  acceptedLabel: string;
  sponsor?: string;
  uri?: string;
  /** Optional YouTube reference clip, used when there is no uri. */
  youtubeId?: string;
  responses: Response[];
};
