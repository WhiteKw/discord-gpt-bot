import redis from "redis";

const setRedis = async () => {
  console.log(`Started connecting to Redis...`);
  const _redisClient = redis.createClient({ legacyMode: true });
  _redisClient.on("connect", () => {
    console.log("\u001b[1;32mRedis connected!\u001b[0m");
  });
  _redisClient.on("error", err => {
    console.error("\u001b[1;31mRedis client error : " + err + "\u001b[0m");
  });
  await _redisClient.connect();

  return _redisClient;
};

export default setRedis;