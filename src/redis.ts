const { RedisPubSub } = require("graphql-redis-subscriptions");
const redis = require("ioredis");
const { promisify } = require("util");

require("dotenv").config();

const pubsub = new RedisPubSub({
  connection: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    retry_strategy: (options: any) => Math.max(options.attempt * 100, 3000),
  },
});

const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});

client.on("connect", () => {
  console.log("Connected to redis successfully!");
});

client.on("error", (error) => {
  console.log("Redis connection error :", error);
});

client.get = promisify(client.get).bind(client);
client.set = promisify(client.set).bind(client);
client.del = promisify(client.del).bind(client);
client.expire = promisify(client.expire).bind(client);

module.exports.client = client;
module.exports.pubsub = pubsub;
