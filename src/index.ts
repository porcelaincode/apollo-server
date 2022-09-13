const { createServer } = require("http");
const { ApolloServer } = require("apollo-server-express");

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const helmet = require("helmet");

const { execute, subscribe } = require("graphql");
const { makeExecutableSchema } = require("@graphql-tools/schema");

const { SubscriptionServer } = require("subscriptions-transport-ws");

const typeDefs = require("./graphql/types");
const resolvers = require("./graphql/resolvers");

require("dotenv").config();

const PORT: any = process.env.PORT || 5000;
const DATABASE: string = process.env.MONGODB_CONNECTION_STRING;

export async function startApolloServer(typeDefs: any, resolvers: any) {
  const app = express();
  app.use(cors());

  app.use("/static", express.static("data/images"));
  app.use("/logo", express.static("data/logos"));

  app.use(
    helmet({
      contentSecurityPolicy:
        process.env.NODE_ENV === "production" ? undefined : false,
    })
  );

  const schema = makeExecutableSchema({ typeDefs, resolvers });

  const server = new ApolloServer({
    schema,
    context: ({ req }: any) => ({ req }),
  });

  await server.start();

  server.applyMiddleware({ app, path: "/" });

  const ws = createServer(app);

  await new Promise((resolve) => ws.listen({ port: PORT }, resolve))
    .then(() => {
      new SubscriptionServer(
        {
          execute,
          subscribe,
          schema,
        },
        {
          server: ws,
          path: "/subscriptions",
        }
      );
    })
    .then(() => {
      console.log(
        `Subscription Server ready at ws://localhost:${PORT}/subscriptions`
      );
    });
  console.log(
    `Apollo Server ready at http://localhost:${PORT}${server.graphqlPath}`
  );
}

mongoose
  .connect(DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log(`Connected to database`);
    return startApolloServer(typeDefs, resolvers);
  });
