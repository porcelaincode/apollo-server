import { RedisPubSub } from 'graphql-redis-subscriptions';

const host: string = process.env.REDIS_HOST;
const port: number = parseInt(process.env.REDIS_PORT);

const pubsub = new RedisPubSub({
    connection: {
        host,
        port,
        retryStrategy: (options: any) => Math.max(options.attempt * 100, 3000),
    },
});

export default pubsub;
