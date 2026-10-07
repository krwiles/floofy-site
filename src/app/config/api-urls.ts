/**
 * The three backend Lambda function URLs, used by `ApiService` -- see docs/refactor/13-phase-5-plan.md's "ApiService"
 * section. Every environment talks to the same Lambdas, so there's no per-environment split.
 */
export const API_URLS = {
  contact: 'https://zh7bsnp2zn4awfk5q7khv64dxu0wiktc.lambda-url.us-east-1.on.aws/',
  reviews: 'https://isaytzssxo6crcwmqfyoqp54py0yjiyt.lambda-url.us-east-1.on.aws/',
  commission: 'https://2nffhwsijx3tjkmylifc7sr64e0tugqt.lambda-url.us-east-1.on.aws/',
} as const;
