const jwt = require("jsonwebtoken");

const { AuthenticationError } = require("apollo-server-express");

module.exports = (context: any, sourceCheck?: boolean) => {
  const authHeader = context.req.headers.authorization;
  const source = context.req.headers.source;

  if (sourceCheck) {
    return { loggedUser: null, source };
  }

  if (authHeader) {
    // get bearer token
    const token = authHeader.split("Bearer ")[1];
    if (token) {
      try {
        const user = jwt.verify(token, process.env.TOKEN_SECRET);
        return { loggedUser: user, source };
      } catch (err) {
        throw new AuthenticationError("Invalid/Expired Token");
      }
    }
    throw new Error("Authentication token must be 'Bearer [token]");
  }
  throw new Error("Authorisaztion header must be provided");
};

module.exports.getUserByToken = (token: string) => {
  try {
    const user = jwt.verify(token, process.env.TOKEN_SECRET);
    return user;
  } catch (err) {
    throw new Error("Invalid/Expired Token");
  }
};
