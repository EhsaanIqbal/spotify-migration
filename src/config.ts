export const PORT = process.env.PORT || 3000;
export const clientId: string = "";
export const clientSecret: string = "";
export const redirectUri: string = "";
export const state: string = "";
export const scopes: string[] = [
  "user-read-email",
  "playlist-read-collaborative",
  "user-read-private",
  "playlist-modify-public",
  "user-library-modify",
];
export let token = {
  access_token: "",
  refresh_token: "",
};
