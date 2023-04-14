import express, { json } from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import cors from 'cors';
import dotenv from 'dotenv';
import dayjs from 'dayjs';

const app = express();

app.use(json());
app.use(cors());
dotenv.config();

let db;
const mongoClient = new MongoClient(process.env.DATABASE_URL);

try {
    await mongoClient.connect();
    db = mongoClient.db();
    console.log(`Database successfully connected with server; Database URL: ${process.env.DATABASE_URL}`);
} catch (err) {
    console.log('Database connection failed');
    console.error(err.message);
}

//AVALIADOR: Cadastro de participante
app.post('/participants', async (req, res) => {
    const { name } = req.body;

    try {
        await db.collection('participants').insertOne({ name, lastStatus: Date.now() });
        await db.collection('messages').insertOne({
            from: name,
            to: 'Todos',
            text: 'entra na sala...',
            type: 'status',
            time: dayjs().format('HH:mm:ss')
        });
        res.status(201).send('User successfully created');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/participants', async (req, res) => {
    try {
        const participants = await db.collection('participants').find().toArray();
        res.send(participants);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post('/messages', async (req, res) => {
    const { to, text, type } = req.body;
    const user = req.header('User');

    const message = {
        from: user,
        to,
        text,
        type,
        time: dayjs().format('HH:mm:ss')
    };

    try {
        await db.collection('messages').insertOne( message );
        res.sendStatus(201);
    } catch (err) {
        res.status(500).send(err.message);
    };
});

app.get('/messages', async (req, res) => {
    try {
        const messages = await db.collection('messages').find().toArray();
        res.send(messages);
    } catch (err) {
        res.status(500).send(err.message);
    };
});

app.post('/status', async (req, res) => {
    const user = req.header('User');

    try {
        const result = await db.collection('participants').updateOne({ name: user }, { $set: { lastStatus: Date.now() } });
        res.send('User lastStatus updated')
    } catch (err) {
        res.status(500).send(err.message);
    };        
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server successfully connected at PORT: ${PORT}; Server URL: http://localhost:${PORT}` );
});

async function removeIdle() {
    try {
        const timestamp = Date.now();

        let result = await db.collection('participants').find({ lastStatus: { $lt: (timestamp - 10000) } }).toArray();

        console.log(result);

        await Promise.all(
            result.map(async (participant) => {
                await db.collection('messages').insertOne({
                    from: participant.name,
                    to: 'Todos',
                    text: 'sai da sala...',
                    type: 'status',
                    time: dayjs().format('HH:mm:ss')
                });
                await db.collection('participants').deleteOne({ name: participant.name });
            })
        );
    } catch (err) {
        console.error(err.message);
    }
}

setInterval(removeIdle, 15*1000)