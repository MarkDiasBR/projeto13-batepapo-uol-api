import express, { json } from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';
import dotenv from 'dotenv';

const app = express();

app.use(cors());
app.use(json());
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

app.get('/oi', (req, res) => {
    res.send('oi');
})

app.post('/')

// app.
// mongoClient.connect()
//     .then(() => {
// 	    db = mongoClient.db();
//         console.log(`Database successfully connected with server; Database URL: ${process.env.DATABASE_URL}`);
//     })
//     .catch((err) => console.log(err.message));

const BACKEND_PORT = 5000;
app.listen(BACKEND_PORT, () => {
    console.log(`Server successfully connected at PORT: ${BACKEND_PORT}; Server URL: http://localhost:${BACKEND_PORT}` );
});