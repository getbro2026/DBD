import { Challenge } from '../types';

/** Sample data so the app has something to show before a backend exists. */
export const sampleChallenges: Challenge[] = [
  {
    id: 'c1',
    tag: '#BabyStepChallenge',
    creator: { handle: '@riya.moves', initials: 'RK' },
    durationSec: 45,
    acceptedLabel: '18.4k accepted',
    responses: [
      { id: 'r1', creator: { handle: '@arjun.beats', initials: 'AM' }, durationSec: 44, likes: 2100, accuracy: 86 },
      { id: 'r2', creator: { handle: '@meera.dances', initials: 'MJ' }, durationSec: 46, likes: 3400, accuracy: 92 },
      { id: 'r3', creator: { handle: '@kabir.k', initials: 'KK' }, durationSec: 40, likes: 860, accuracy: 74 },
    ],
  },
  {
    id: 'c2',
    tag: '#ShoulderRoll30',
    creator: { handle: '@dev.on.beat', initials: 'DB' },
    durationSec: 32,
    acceptedLabel: '9.1k accepted',
    responses: [
      { id: 'r4', creator: { handle: '@isha.in.motion', initials: 'II' }, durationSec: 33, likes: 1300, accuracy: 81 },
      { id: 'r5', creator: { handle: '@zoya.z', initials: 'ZZ' }, durationSec: 31, likes: 970, accuracy: 88 },
    ],
  },
  {
    id: 'c3',
    tag: '#GarbaGlide',
    creator: { handle: '@studio.nritya', initials: 'SN' },
    durationSec: 58,
    acceptedLabel: '31k accepted',
    sponsor: 'Sponsored by Studio Nritya',
    responses: [
      { id: 'r6', creator: { handle: '@nikhil.garba', initials: 'NG' }, durationSec: 57, likes: 5200, accuracy: 90 },
      { id: 'r7', creator: { handle: '@pooja.p', initials: 'PP' }, durationSec: 59, likes: 1800, accuracy: 79 },
      { id: 'r8', creator: { handle: '@team.dhol', initials: 'TD' }, durationSec: 55, likes: 2600, accuracy: 84 },
    ],
  },
];
