import fs from "fs";
import parser from "fast-xml-parser";

const parseXML = (f_name: string) => {
  let tracks: string[] = [];
  const data = fs.readFileSync(__dirname + `/uploads/${f_name}`, "utf8");

  // XML --> JSON
  let parsedJSON = parser.parse(data);
  let arr = parsedJSON.plist.dict.dict.dict;
  let playlist_name = parsedJSON.plist.dict.array.dict.string[0];
  arr.forEach((i: any) => {
    tracks.push(i.string[0]);
  });
  return {
    success: false,
    error: null,
    playlist_name: playlist_name,
    tracks: tracks,
  };
};

export default parseXML;
