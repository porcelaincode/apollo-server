// For clarity in this example we included our typeDefs and resolvers above our test,
// but in a real world situation you'd be importing these in from different files

// we import a function that we wrote to create a new instance of Apollo Server
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

const fs = require("fs");

const mongoose = require("mongoose");
const request = require("supertest");

require("dotenv").config();
const PORT: any = process.env.TEST_PORT || 5001;
const DATABASE: string | undefined = process.env.MONGODB_TEST_CONNECTION_STRING;

const typeDefs = require("../src/graphql/types");
const resolvers = require("../src/graphql/resolvers");

// Create the schema, which will be used separately by ApolloServer and
// the WebSocket server.

let rawdata = fs.readFileSync("./tests/config.json");
let config = JSON.parse(rawdata);

const createApolloServer = async () => {
  // Create our WebSocket server using the HTTP server we just set up.

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: PORT },
  });

  mongoose.connect(DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const connection = mongoose.connection;
  await connection.once("open", async function () {
    await mongoose.connection.db.dropCollection("users");
    await mongoose.connection.db.dropCollection("stores");
    await mongoose.connection.db.dropCollection("inventories");
  });

  return { server, url };
};

const LOGIN_TYPE = `
  mutation Login($contact: ContactInput!) {
    login(contact: $contact) {
      id
      token
      name
    }
  }
`;

const REGISTER_TYPE = `
  mutation Register($userInfoInput: UserInfoInput) {
    register(userInfoInput: $userInfoInput) {
      id
    }
  }
`;

const EDIT_TYPE = `
  mutation EditProfile($userInfoInput: UserInfoInput) {
    editProfile(userInfoInput: $userInfoInput)
  }
`;

const ADDRESS_TYPE = `
  mutation UpdateAddress($id: String, $addressInfo: UpdateAddress) {
    updateAddress(id: $id, addressInfo: $addressInfo)
  }
`;

// this is the query for our test
const registerData = {
  query: REGISTER_TYPE,
  variables: {
    userInfoInput: {
      name: config.user.name,
      contact: config.user.contact,
    },
  },
};

const loginData = {
  query: LOGIN_TYPE,
  variables: {
    contact: config.user.contact,
  },
};

const editData = {
  query: EDIT_TYPE,
  variables: {
    userInfoInput: {
      name: "Edited Name",
      contact: config.user.contact,
    },
  },
};

const updateData = {
  query: ADDRESS_TYPE,
  variables: {
    id: "",
    addressInfo: config.user.address.addressInfo,
  },
};

describe("user resolvers", () => {
  let server, url, token;
  console.log("User tests init");

  // before the tests we spin up a new Apollo Server
  beforeAll(async () => {
    ({ server, url } = await createApolloServer());
  });

  afterAll(async () => {
    await server?.stop();
    mongoose.connection.db.dropCollection("users");
  });

  it("register user", async () => {
    const response = await request(url).post("").send(registerData);
    expect(response._body.data.register.id).not.toBeUndefined();
  });

  it("login user", async () => {
    const result = await request(url)
      .post("")
      .set({ source: `${config.user.source}` })
      .send(loginData);

    token = result._body.data.login.token;
    expect(result._body.data).not.toBeNull();
  });

  // it("edit profile", async () => {
  //   const response = await request(url)
  //     .post("")
  //     .set({
  //       Authorization: `Bearer ${token}`,
  //       source: `${config.user.source}`,
  //     })
  //     .send(editData);

  //   expect(response._body.data.editProfile).toBeTruthy();
  // });

  // it("add address", async () => {
  //   const response = await request(url)
  //     .post("")
  //     .set({
  //       Authorization: `Bearer ${token}`,
  //       source: `${config.user.source}`,
  //     })
  //     .send(updateData);

  //   expect(response._body.data.updateAddress).toBeTruthy();
  // });
});

const REGISTER_STORE = `
  mutation EditStore($edit: Boolean!, $storeInfo: StoreInfo) {
    editStore(edit: $edit, storeInfo: $storeInfo) {
      id
    }
  }
`;

const storeRegisterData = {
  query: REGISTER_STORE,
  variables: {
    edit: false,
    storeInfo: {
      name: config.retail.name + " Superstore",
      contact: config.retail.contact,
      address: config.retail.address,
    },
  },
};

const storeLoginData = {
  query: LOGIN_TYPE,
  variables: {
    contact: config.retail.contact,
  },
};

// describe("store resolvers", () => {
//   let server, url, token;

//   // before the tests we spin up a new Apollo Server
//   beforeAll(async () => {
//     ({ server, url } = await createApolloServer({ port: PORT }));
//   });

//   afterAll(async () => {
//     await server?.stop();
//   });

//   it("register store", async () => {
//     const response = await request(url).post("").send(storeRegisterData);
//     console.log(response._body);
//     expect(response._body.data.editStore.id).not.toBeUndefined();
//   });

//   it("login store", async () => {
//     const result = await request(url)
//       .post("")
//       .set({ source: `${config.retail.source}` })
//       .send(storeLoginData);

//     token = result._body.data.login.token;
//     expect(result._body.data).not.toBeNull();
//   });
// });
