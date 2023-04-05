export {};

const crypto = require("crypto");

const enc = new TextEncoder();

const algo = "aes-256-cbc";
const inVec = enc.encode(process.env.TOKEN_SECRET.slice(0, 16)).buffer;
const secKey = enc.encode(process.env.TOKEN_SECRET.slice(0, 32)).buffer;

const cipherText = crypto.createCipheriv(algo, secKey, inVec);
const decipherText = crypto.createDecipheriv(algo, secKey, inVec);

const hexEncode = (str: string) => {
  var hex, i;

  var result = "";
  for (i = 0; i < str.length; i++) {
    hex = str.charCodeAt(i).toString(16);
    result += ("000" + hex).slice(-4);
  }

  return result;
};

const encodeUpi = (upi: String) => {
  let encryptedData = cipherText.update(upi, "utf-8", "hex");
  encryptedData += cipherText.final("hex");

  return {
    value: encryptedData,
    display: upi.slice(0, 2) + "******" + upi.slice(-2),
  };
};

const decodeUpi = (encodedUpi: string) => {
  let decryptedData = decipherText.update(encodedUpi, "hex", "utf-8");
  decryptedData += decipherText.final("utf8");

  return decryptedData;
};

const test = () => {
  let upi = "9999900000@upiid";
  let { value } = encodeUpi(upi);
  let d = decodeUpi(value);
  console.log(upi === d);
};

module.exports = {
  decodeUpi,
  encodeUpi,
};
