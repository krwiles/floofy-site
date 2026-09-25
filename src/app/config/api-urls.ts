/**
 * The 3 backend Lambda function URLs, moved out of their services' own class bodies -- see
 * docs/refactor/13-phase-5-plan.md's "ApiService" section. One place to change a URL instead of three service
 * files; no per-environment split exists (or is needed) today, since every environment talks to the same
 * Lambdas.
 */
export const API_URLS = {
  contact: 'https://zh7bsnp2zn4awfk5q7khv64dxu0wiktc.lambda-url.us-east-1.on.aws/',
  reviews: 'https://isaytzssxo6crcwmqfyoqp54py0yjiyt.lambda-url.us-east-1.on.aws/',
  commission: 'https://2nffhwsijx3tjkmylifc7sr64e0tugqt.lambda-url.us-east-1.on.aws/',
} as const;
