export {};

require("dotenv").config();

const DATABASE: string = process.env.MONGODB_CONNECTION_STRING;

async function db() {
  return mongoose
    .connect(DATABASE, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log(`Connected to database`);
    });
}

module.exports = db;
