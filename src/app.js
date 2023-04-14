import express, { json } from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';
import dotenv from 'dotenv';

const server = express();

server.use(cors());
server.use(json());
dotenv.config();

const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;

try {
    await mongoClient.connect();
    db = mongoClient.db();
    console.log(`Database successfully connected with server; Database URL: ${process.env.DATABASE_URL}`);
} catch (err) {
    console.log('Database connection failed')
    console.error(err.message)
}

server.get('/oi', (req, res) => {
    res.send('oi');
})

server.post('/participants', async (req, res) => {
    const { name } = req.body;


    try {
        await db.collection('participants').insertOne({ name });
        res.status(201).send('User successfully created')
    } catch (err) {
        console.error(err.message);
    }
});

// app.
// mongoClient.connect()
//     .then(() => {
// 	    db = mongoClient.db();
//         console.log(`Database successfully connected with server; Database URL: ${process.env.DATABASE_URL}`);
//     })
//     .catch((err) => console.log(err.message));

const BACKEND_PORT = 5000;
server.listen(BACKEND_PORT, () => {
    console.log(`Server successfully connected at PORT: ${BACKEND_PORT}; Server URL: http://localhost:${BACKEND_PORT}` );
});