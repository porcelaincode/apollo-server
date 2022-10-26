import { ProductProps, UserProps } from "../props";

const jwt = require("jsonwebtoken");

async function asyncForEach(array: any[], callback: any) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}
module.exports.asyncForEach = asyncForEach;

function log(str: string) {
  if (process.env.NODE_ENV === "production") {
    console.log(log);
  }
}
module.exports.log = log;

function generate(n: number): string {
  var add = 1,
    max = 12 - add; // 12 is the min safe number Math.random() can generate without it starting to pad the end with zeros.
  var data: string;
  if (n > max) {
    return generate(max) + generate(n - max);
  }

  max = Math.pow(10, n + add);
  var min = max / 10; // Math.pow(10, n) basically
  var number = Math.floor(Math.random() * (max - min + 1)) + min;
  data = ("" + number).substring(add);
  return data;
}
module.exports.generateOTP = generate;

function generateToken(user: UserProps) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      contact: user.contact,
    },
    process.env.TOKEN_SECRET,
    { expiresIn: "7d" }
  );
}
module.exports.generateToken = generateToken;

function generateRefreshToken(user: UserProps) {
  return jwt.sign(
    {
      id: user.id,
      contact: user.contact,
    },
    process.env.REFRESH_TOKEN_SECRET
  );
}
module.exports.generateRefreshToken = generateRefreshToken;

function addMinutesToDate(objDate: number, intMinutes: number) {
  var numberOfMlSeconds = objDate;
  var addMlSeconds = intMinutes * 60000;
  var newDateObj = new Date(numberOfMlSeconds + addMlSeconds).toISOString();
  return newDateObj;
}
module.exports.addMinutesToDate = addMinutesToDate;

function randomizeArray(array: Array<ProductProps>, lim: number) {
  let c = [...array];
  let len = array.length;

  if (lim) {
    c.slice(0, lim);
  }

  return c;
}
module.exports.randomizeArray = randomizeArray;
