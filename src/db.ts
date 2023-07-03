import mongoose from 'mongoose';

const DATABASE: string = process.env.MONGODB_CONNECTION_STRING;

async function db() {
    return mongoose.connect(DATABASE).then(() => {
        console.log(`Connected to database`);
    });
}

export { db };
