import Store from './models/Store';

const toRad = (Value: number) => {
    // Converts numeric degrees to radians
    return (Value * Math.PI) / 180;
};

const calcCrow = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    /* 
		spits out the distance between p1(lat1, lng2)
		and p2(lat2, lng2) as the crow flies (in km) 
	*/
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    var lat1 = toRad(lat1);
    var lat2 = toRad(lat2);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d;
};

const findNearbyStores = async (geohash: string) => {
    const stores = [];

    const regexHash = geohash.slice(0, -3);

    const nearbyStores = await Store.find({
        'address.location.hash': { $regex: '^' + regexHash },
    });

    nearbyStores.map((store) => {
        stores.push(store._id.toString());
    });

    return stores;
};

const decideStore = async (id: string) => {
    const stores = [];

    return stores;
};

export { findNearbyStores, decideStore, calcCrow };
