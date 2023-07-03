require('dotenv').config();

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;

const twclient = require('twilio')(twilioAccountSid, twilioAuthToken);

export { twclient };
