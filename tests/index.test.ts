// For clarity in this example we included our typeDefs and resolvers above our test,
// but in a real world situation you'd be importing these in from different files

// export {};

const typeDefs = require("../src/graphql/types");
const resolvers = require("../src/graphql/resolvers");

const fs = require("fs");
require("dotenv").config();

const { ApolloServer } = require("apollo-server-express");

let rawdata = fs.readFileSync("./tests/config.json");
let config = JSON.parse(rawdata);

let TOKEN = "";
let SOURCE = "locale-user-";

const testServer = new ApolloServer({
  typeDefs,
  resolvers,
});

it("login user", async () => {
  const result = await testServer.executeOperation(
    {
      query:
        "query login($contact: ContactInput) { login(contact: $contact){ id token } }",
      variables: { contact: config.user.contact },
    },
    {
      req: {
        headers: {
          source: `${SOURCE}`,
        },
      },
    }
  );

  TOKEN = result.data?.login.token;

  // expect(result.errors).toBeUndefined();
  expect(result.data?.login.id).toBe(config.user.id);
});
