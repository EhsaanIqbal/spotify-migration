import spotifyWebApi from "spotify-web-api-node";
import { token } from "./config";

const stringToUri = async (str_arr: string[]) => {
  let uri_arr: any = [];
  const spotifyAPI = new spotifyWebApi({
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
  });

  for (let i = 0; i < str_arr.length; i++) {
    let data = await spotifyAPI.searchTracks(str_arr[i], { limit: 1 });
    if (data.body.tracks?.items.length !== 0) {
      uri_arr.push(data.body.tracks?.items[0].uri);
    } else {
      console.error("Not found : ", str_arr[i]);
    }
  }
  return uri_arr;
};

export default stringToUri;
