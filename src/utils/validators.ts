import { ContactProps, ProductProps } from "../props";

const validateRegisterInput = (contact: ContactProps) => {
  const errors: any = {};
  if (contact.number.toString().trim() === "") {
    errors.email = "Contact must not be empty";
  } else {
    const regEx = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im;
    if (!contact.number.toString().match(regEx)) {
      errors.number = "Contact must have a valid format";
    }
  }
  return {
    errors,
    valid: Object.keys(errors).length < 1,
  };
};

const validateLoginInput = (contact: ContactProps) => {
  const errors: any = {};
  if (contact.number.toString().trim() === "") {
    errors.contact.number = "Contact must not be empty";
  } else if (contact.number.toString().length !== 10) {
    errors.contact.number = "Contact must be valid.";
  }
  return {
    errors,
    valid: Object.keys(errors).length < 1,
  };
};

const camelCase = (str: string) => {
  return str
    .replace(/\s(.)/g, function (a) {
      return a.toUpperCase();
    })
    .replace(/\s/g, "")
    .replace(/^(.)/, function (b) {
      return b.toLowerCase();
    });
};

const validateProductInput = (product: ProductProps) => {
  const errors = {};

  // capitalize first letter of brand
  const newProduct: ProductProps = {
    ...product,
    brand: camelCase(product.brand.trim()),
    name: product.name.trim(),
  };

  return {
    newProduct,
    errors,
    valid: Object.keys(errors).length < 1,
  };
};

module.exports = {
  validateRegisterInput,
  validateLoginInput,
  camelCase,
  validateProductInput,
};
