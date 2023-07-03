import jwt from 'jsonwebtoken';

import { ValidationError } from 'apollo-server-express';
import { IUserTokenSchema } from './generalUtil';

const checkAuthHeader = (context: any, sourceCheck?: boolean) => {
    const source: string = context.req.headers.source;
    if (sourceCheck) {
        return { loggedUser: null, source };
    }

    const authHeader = context.req.headers.authorization;
    if (authHeader) {
        // get bearer token
        const token = authHeader.split('Bearer ')[1];
        if (token) {
            try {
                const user = jwt.verify(token, process.env.TOKEN_SECRET) as IUserTokenSchema;
                return { loggedUser: user, source };
            } catch (err) {
                throw new ValidationError('Invalid/Expired Token');
            }
        }
        throw new ValidationError("Authentication token must be 'Bearer [token]");
    }
    throw new ValidationError('Authorisaztion header must be provided');
};

const getUserByToken = (token: string) => {
    try {
        const user = jwt.verify(token, process.env.TOKEN_SECRET) as IUserTokenSchema;
        return user;
    } catch (err) {
        throw new ValidationError('Invalid/Expired Token');
    }
};

export { checkAuthHeader, getUserByToken };
