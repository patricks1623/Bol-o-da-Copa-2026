import https from "https";
https.get("https://www.fifa.com/pt/tournaments/mens/worldcup/canadamexicousa2026/teams", res => {
  let chunks = [];
  res.on("data", c => chunks.push(c));
  res.on("end", () => {
    let body = Buffer.concat(chunks).toString();
    // Search for Canada, Mexico, or Brasil in the body to see how they are represented
    let snippets = body.match(/.{0,50}Brasil.{0,50}/g);
    let snippets2 = body.match(/.{0,50}Canad.{0,50}/g);
    console.log("Brasil:", snippets ? snippets.length : 0);
    console.log("Canada:", snippets2 ? snippets2.length : 0);
    if(snippets2) console.log(snippets2[0]);
  });
});
