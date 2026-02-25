import { serviceFeed } from "./client/src/api/serviceFeedClient.ts";
async function test() {
  try {
    const data = await serviceFeed.getFeed(1);
    console.log("Success:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.log("Error:", e);
  }
}
test();
