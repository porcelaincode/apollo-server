export {};

const mongoose = require("mongoose");

const User = mongoose.model.User || require("./models/User");
const Store = mongoose.model.Store || require("./models/Store");

function toRad(Value: number) {
  // Converts numeric degrees to radians
  return (Value * Math.PI) / 180;
}

function calcCrow(lat1: number, lon1: number, lat2: number, lon2: number) {
  /* 
		spits out the distance between p1(lat1, lng2)
		and p2(lat2, lng2) as the crow flies (in km) 
	*/
  var R = 6371; // km
  var dLat = toRad(lat2 - lat1);
  var dLon = toRad(lon2 - lon1);
  var lat1 = toRad(lat1);
  var lat2 = toRad(lat2);

  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d;
}

async function findNearbyStores(geohash: string) {
  const stores = [];

  var regexHash = geohash.slice(0, -3);

  const nearbyStores = await Store.find({
    "address.location.hash": { $regex: "^" + regexHash },
  });

  nearbyStores.map((store) => {
    stores.push(store._id.toString());
  });

  return stores;
}

async function decideStore(id: string) {
  const stores = [];

  return stores;
}

module.exports = { findNearbyStores, decideStore, calcCrow };
