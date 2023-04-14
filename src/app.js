import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import cors from 'cors';
import dotenv from 'dotenv';

const app = express();

app.use(cors());
app.use(express.json());
dotenv.config();

let db;
const mongoClient = new MongoClient(process.env.DATABASE_URL);

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

app.post('/participants', async (req, res) => {
    const { name } = req.body;


    try {
        await db.collection('participants').insertOne({ name, lastStatus: Date.now() });
        res.status(201).send('User successfully created');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// app.
// mongoClient.connect()
//     .then(() => {
// 	    db = mongoClient.db();
//         console.log(`Database successfully connected with server; Database URL: ${process.env.DATABASE_URL}`);
//     })
//     .catch((err) => console.log(err.message));

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server successfully connected at PORT: ${PORT}; Server URL: http://localhost:${PORT}` );
});