export type SocialId = 'x' | 'bsky' | 'pixiv' | 'twitch' | 'vgen' | 'kofi' | 'email';

export interface Social {
  id: SocialId;
  label: string;
  url: string;
  iconClass: string;
  ariaLabel: string;
}

export const SOCIALS: Social[] = [
  {
    id: 'x',
    label: 'X',
    url: 'https://x.com/SummerFloofy',
    iconClass: 'social-icon--x',
    ariaLabel: 'SummerFloofy on X',
  },
  {
    id: 'bsky',
    label: 'Bluesky',
    url: 'https://bsky.app/profile/summerfloofy.bsky.social',
    iconClass: 'social-icon--bsky',
    ariaLabel: 'SummerFloofy on Bluesky',
  },
  {
    id: 'pixiv',
    label: 'Pixiv',
    url: 'https://www.pixiv.net/en/users/115468010',
    iconClass: 'social-icon--pixiv',
    ariaLabel: 'SummerFloofy on Pixiv',
  },
  {
    id: 'twitch',
    label: 'Twitch',
    url: 'https://www.twitch.tv/summerfloofy',
    iconClass: 'social-icon--twitch',
    ariaLabel: 'SummerFloofy on Twitch',
  },
  {
    id: 'vgen',
    label: 'Vgen',
    url: 'https://vgen.co/SummerFloofy',
    iconClass: 'social-icon--vgen',
    ariaLabel: 'SummerFloofy on Vgen',
  },
  {
    id: 'kofi',
    label: 'Ko-fi',
    url: 'https://ko-fi.com/summerfloofy',
    iconClass: 'social-icon--kofi',
    ariaLabel: 'SummerFloofy on Ko-fi',
  },
  {
    id: 'email',
    label: 'Email',
    url: 'mailto:Summerfluffball@gmail.com',
    iconClass: 'social-icon--email',
    ariaLabel: 'SummerFloofy on Email',
  },
];
