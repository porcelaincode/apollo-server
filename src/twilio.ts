require("dotenv").config();

var twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
var twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;

const twclient = require("twilio")(twilioAccountSid, twilioAuthToken);

module.exports.twclient = twclient;