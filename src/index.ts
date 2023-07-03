import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import helmet from 'helmet';

import { ApolloServer } from 'apollo-server-express';
import { createServer } from 'http';
import { ApolloServerPluginDrainHttpServer, ApolloServerPluginLandingPageLocalDefault } from 'apollo-server-core';
import { InMemoryLRUCache } from '@apollo/utils.keyvaluecache';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';

import typeDefs from './graphql/types';
import resolvers from './graphql/resolvers';

// Create the schema, which will be used separately by ApolloServer and
// the WebSocket server.
const schema = makeExecutableSchema({ typeDefs, resolvers });

require('dotenv').config();

const PORT: any = process.env.PORT || 5000;
const DATABASE: string = process.env.MONGODB_CONNECTION_STRING;

// Create an Express app and HTTP server; we will attach both the WebSocket
// server and the ApolloServer to this HTTP server.
export async function startApolloServer() {
    const app = express();

    app.use(cors());
    app.use('/static', express.static('data/images'));
    app.use('/logo', express.static('data/logo'));
    app.use(
        helmet({
            contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
        }),
    );

    const httpServer = createServer(app);

    // Create our WebSocket server using the HTTP server we just set up.
    const wsServer = new WebSocketServer({
        server: httpServer,
        path: '/subscriptions',
    });
    // Save the returned server's info so we can shutdown this server later
    const serverCleanup = useServer({ schema }, wsServer);

    // Set up ApolloServer.
    const server = new ApolloServer({
        schema,
        cache: new InMemoryLRUCache({
            // ~100MiB
            maxSize: Math.pow(2, 20) * 100,
            // 5 minutes (in milliseconds)
            ttl: 300_000,
        }),
        context: ({ req }: any) => ({ req }),
        plugins: [
            // Proper shutdown for the HTTP server.

            ApolloServerPluginDrainHttpServer({ httpServer }),
            // Proper shutdown for the WebSocket server.
            {
                async serverWillStart() {
                    return {
                        async drainServer() {
                            await serverCleanup.dispose();
                        },
                    };
                },
            },
            ApolloServerPluginLandingPageLocalDefault({ embed: true }),
        ],
    });

    await server.start();

    server.applyMiddleware({ app });

    await new Promise(() =>
        httpServer.listen(PORT, () => {
            console.log(`Server is now running on http://localhost:${PORT}${server.graphqlPath}`);
        }),
    );
}

mongoose.connect(DATABASE).then(() => {
    return startApolloServer();
});
