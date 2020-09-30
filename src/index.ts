import express from "express";
import path from "path";
import spotifyWebAPI from "spotify-web-api-node";
import multer from "multer";
import parseXML from "./parseXML";
import fs from "fs";
import cors from "cors";
import stringToUri from "./stringToUri";
import {
  PORT,
  token,
  clientId,
  clientSecret,
  redirectUri,
  scopes,
  state,
} from "./config";

const main = async () => {
  const app = express();
  // middleware
  app.use(express.json());
  app.use(cors());
  app.set("views", path.join(__dirname, "views"));
  app.set("view engine", "ejs");
  const upload = multer({ dest: __dirname + `/uploads/` });
  let isAuth: boolean = false;
  let userInfo: any = null;
  let playlist: any = {};

  // instantiate SpotifyWebAPI
  const spotifyAPI = new spotifyWebAPI({ clientId, clientSecret, redirectUri });

  // index
  app.get("/", (_, res) => {
    res.render("index");
  });

  // authorize
  app.get("/login", (_, res) => {
    const authURL = spotifyAPI.createAuthorizeURL(scopes, state);
    res.redirect(authURL);
  });

  // callback from Spotify
  app.get("/callback", async (req, res, next) => {
    try {
      // retrieve access token
      const data = await spotifyAPI.authorizationCodeGrant(
        req.query.code as string
      );
      // set access & refresh token
      spotifyAPI.setAccessToken(data.body["access_token"]);
      spotifyAPI.setRefreshToken(data.body["refresh_token"]);
      token["access_token"] = data.body["access_token"];
      token["refresh_token"] = data.body["refresh_token"];
      isAuth = true;
      // redirect back to app
      res.redirect("/app");
    } catch (err) {
      next(err);
    }
  });
  // upload playlist
  app.post("/upload", upload.single("playlistFile"), (req, res, next) => {
    if (!isAuth) {
      res
        .status(401)
        .send(`Not authenticated. Please login <a href="/login">here</a>`);
    } else {
      if (
        req.file.mimetype !== "text/xml" &&
        req.file.mimetype !== "application/xml"
      ) {
        res.json({ success: false, error: "Playlist type not XML!" });
        fs.unlink(__dirname + `/uploads/${req.file.filename}`, (err) => {
          if (err) next(err);
        });
      } else {
        const data = parseXML(req.file.filename);
        if (data) {
          data.success = true;
          res.json(data);
          playlist = data;
        } else {
          res.json({
            success: false,
            error: "Hmm... the server is acting dodgy! Try again later.",
          });
        }
      }
    }
  });

  // migrate playlist
  app.get("/migrate", async (_, res, next) => {
    try {
      if (!isAuth) {
        res
          .status(401)
          .send(`Not authenticated. Please login <a href="/login">here</a>`);
      } else {
        // string array -> uri array
        const track_uri = await stringToUri(playlist.tracks);

        // create playlist
        let created_playlist = await spotifyAPI.createPlaylist(
          userInfo.body.id,
          playlist.playlist_name
        );
        if (created_playlist) {
          console.log(
            "playlist : ",
            created_playlist.body.external_urls.spotify
          );
          // add tracks to playlist
          await spotifyAPI.addTracksToPlaylist(
            created_playlist.body.id,
            track_uri
          );
          res.json({
            success: true,
            error: null,
            playlist_link: created_playlist.body.external_urls.spotify,
            playlist_name: created_playlist.body.name,
          });
        } else {
          res.json({
            success: false,
            error: `Something went wrong while migrating the playlist : ${playlist.playlist_name}`,
          });
        }
      }
    } catch (err) {
      next(err);
    }
  });

  // render app dashboard
  app.get("/app", async (_, res, next) => {
    try {
      if (!isAuth) {
        res
          .status(401)
          .send(`Not authenticated. Please login <a href="/login">here</a>`);
      } else {
        userInfo = await spotifyAPI.getMe();
        res.render("app", { userInfo });
      }
    } catch (err) {
      next(err);
    }
  });

  // start server
  app.listen(PORT, () => {
    console.log(`server running on PORT: ${PORT}`);
  });
};

main().catch((err) => {
  console.error(err);
});
