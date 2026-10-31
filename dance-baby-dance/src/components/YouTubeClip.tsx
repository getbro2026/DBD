import React from 'react';
import { StyleSheet, View } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';

type Props = {
  /** The 11-character id from a YouTube link, e.g. wb7pKmS_9PU */
  videoId: string;
  playing: boolean;
  muted?: boolean;
};

/**
 * Reference clip played through YouTube's official embed.
 * It runs on YouTube's own clock, so it cannot be frame-synced with a response.
 */
export function YouTubeClip({ videoId, playing, muted = false }: Props) {
  return (
    <View style={styles.fill} pointerEvents="none">
      <YoutubePlayer
        height={600}
        videoId={videoId}
        play={playing}
        mute={muted}
        initialPlayerParams={{ loop: true, controls: false, modestbranding: true, rel: false }}
        webViewStyle={styles.web}
      />
    </View>
  );
}

/** Pulls the video id out of watch, youtu.be and shorts links. */
export function parseYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|\/shorts\/|[?&]v=|\/embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFill, overflow: 'hidden', backgroundColor: '#000' },
  web: { opacity: 0.99, backgroundColor: '#000' },
});
