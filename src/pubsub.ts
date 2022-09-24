const { RedisPubSub } = require("graphql-redis-subscriptions");

require("dotenv").config();

module.exports = new RedisPubSub({
  connection: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    retry_strategy: (options: any) => Math.max(options.attempt * 100, 3000),
  },
});
