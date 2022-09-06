import { UserProps } from "../props";

const jwt = require("jsonwebtoken");

async function asyncForEach(array: any[], callback: any) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

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

function generateToken(user: UserProps) {
  return jwt.sign(
    {
      id: user.id,
      contact: user.contact,
    },
    process.env.TOKEN_SECRET,
    { expiresIn: "7d" }
  );
}

function generateRefreshToken(user: UserProps) {
  return jwt.sign(
    {
      id: user.id,
      contact: user.contact,
    },
    process.env.REFRESH_TOKEN_SECRET
  );
}

function addMinutesToDate(objDate: number, intMinutes: number) {
  var numberOfMlSeconds = objDate;
  var addMlSeconds = intMinutes * 60000;
  var newDateObj = new Date(numberOfMlSeconds + addMlSeconds).toISOString();
  return newDateObj;
}

module.exports.asyncForEach = asyncForEach;
module.exports.generateOTP = generate;
module.exports.addMinutesToDate = addMinutesToDate;
module.exports.generateRefreshToken = generateRefreshToken;
module.exports.generateToken = generateToken;
