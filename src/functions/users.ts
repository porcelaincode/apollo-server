export function cleanupAddresses(addresses) {
  const data = [];
  addresses.forEach((address) => {
    data.push({
      ...address._doc,
      id: address._id,
    });
  });
  return data;
}
