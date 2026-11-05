// Convex trusts Firebase sign-in tokens from your Firebase project.
// Set FIREBASE_PROJECT_ID in the Convex dashboard (Settings, Environment Variables).
declare const process: { env: Record<string, string | undefined> };

const projectId = process.env.FIREBASE_PROJECT_ID;

export default {
  providers: [
    {
      domain: `https://securetoken.google.com/${projectId}`,
      applicationID: projectId,
    },
  ],
};
