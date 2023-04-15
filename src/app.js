import express, { json } from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import cors from 'cors';
import dotenv from 'dotenv';
import dayjs from 'dayjs';
import joi from 'joi';
import { stripHtml } from "string-strip-html";

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

app.post('/participants', async (req, res) => {

    try {
        const participantSchema = joi.object({
            name: joi.string().required()
        });

        const validation = participantSchema.validate(req.body, { abortEarly: false });

        if (validation.error) {
            const errors = validation.error.details.map((detail) => detail.message);
            return res.status(422).send(errors);
        }

        const name = sanitizeInput(req.body.name);

        const nameFind = await db.collection('participants').findOne({ name });

        if (nameFind) {
            return res.status(409).send('User already logged in.');
        }

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
    const userHeader = { User: req.header('User') };

    const userSchema = joi.object({
        to: joi.string().required(),
        text: joi.string().required(),
        type: joi.string().valid('message', 'private_message').required()
    });

    const userHeaderSchema = joi.object({
        User: joi.string().required()
    });

    const validationUser = userSchema.validate(req.body, { abortEarly: false });

    if (validationUser.error) {
        const errors = validationUser.error.details.map((detail) => detail.message);
        return res.status(422).send(errors);
    }

    const validationUserHeader = userHeaderSchema.validate(userHeader, { abortEarly: false });

    if (validationUserHeader.error) {
        const errors = validationUserHeader.error.details.map((detail) => detail.message);
        return res.status(422).send(errors);
    }

    let user = req.header('User');

    const userFind = await db.collection('participants').findOne({ name: user });

    if (!userFind) {
        return res.status(422).send('User not logged in.');
    }

    let { to, text, type } = req.body;
    
    to = sanitizeInput(to);
    text = sanitizeInput(text);
    type = sanitizeInput(type);
    user = sanitizeInput(user);

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
    let limit;
    if (req.query.hasOwnProperty('limit')) {
        limit = Number(req.query.limit);

        const limitSchema = joi.number().integer().greater(0);

        const validation = limitSchema.validate(limit, { abortEarly: false });

        if (validation.error) {
            const errors = validation.error.details.map(detail => detail.message);
            return res.status(422).send(errors);
        } 
    }

    const user = req.header('User');

    try {
        let messages = await db.collection('messages').find(
            {$or: [
                {to: 'Todos'},
                {type: 'message'},
                {type: 'private_message', from: user},
                {type: 'private_message', to: user},
            ]}
        ).toArray();

        if (limit && messages.length > limit) {
            messages = messages.slice(-limit);  
            return res.send(messages);
        }
        
        res.send(messages);
    } catch (err) {
        res.status(500).send(err.message);
    };
});

app.delete('/messages/:id', async (req, res) => {
    let user = req.header('User');
    const { id } = req.params;

    const messageFind = await db.collection('messages').findOne({ _id: new ObjectId(id) });

    if (!messageFind) return res.status(404).send('Message not found');

    if (messageFind.from !== user) return res.status(401).send('Unauthorized deletion');

    try {
        const messages = await db.collection('messages').deleteOne({ _id: new ObjectId(id) });
        res.send(messages);
    } catch (err) {
        res.status(500).send(err.message);
    };
});

// app.put('/messages/:id', async (req, res) => {
//     const userHeader = { User: req.header('User') };
//     const { id } = req.params;
    
//     const messageFind = await db.collection('messages').findOne({ _id: new ObjectId(id) });
//     if (messageFind.from !== user) return res.status(401).send('Unauthorized deletion');
//     if (!messageFind) return res.status(404).send('Message not found');

//     const userSchema = joi.object({
//         to: joi.string().required(),
//         text: joi.string().required(),
//         type: joi.string().valid('message', 'private_message').required()
//     });
//     const validationUser = userSchema.validate(req.body, { abortEarly: false });
//     if (validationUser.error) {
//         const errors = validationUser.error.details.map((detail) => detail.message);
//         return res.status(422).send(errors);
//     }
    
//     // const userHeaderSchema = joi.object({
//     //     User: joi.string().required()
//     // });
//     // const validationUserHeader = userHeaderSchema.validate(userHeader, { abortEarly: false });
//     // if (validationUserHeader.error) {
//     //     const errors = validationUserHeader.error.details.map((detail) => detail.message);
//     //     return res.status(422).send(errors);
//     // }

//     let user = req.header('User');

//     // const userFind = await db.collection('participants').findOne({ name: user });

//     // if (!userFind) {
//     //     return res.status(422).send('User not logged in.');
//     // }

//     let { to, text, type } = req.body;    

//     to = sanitizeInput(to);
//     text = sanitizeInput(text);
//     // type = sanitizeInput(type);
//     // user = sanitizeInput(user);

//     const message = {
//         from: user,
//         to,
//         text,
//         type
//     };

//     try {
//         await db.collection('messages').updateOne({ _id: new ObjectId(id) }, { $set: message });
//         res.sendStatus(200);
//     } catch (err) {
//         res.status(500).send(err.message);
//     };
// });

app.put('/messages/:id', async (req, res) => {
    let { to, text, type } = req.body;
    let user = req.header('User');
    const { id } = req.params;

    const findMessage = await db.collection('messages').findOne({ _id: new ObjectId(id) });

    console.log(typeof findMessage.from, typeof user)

    console.log( findMessage.from, user)
    if (!findMessage) {
        return res.sendStatus(404);
    } else if (findMessage.from !== user) {
        return res.sendStatus(401);
    }

    const messageSchema = joi.object({
        to: joi.string().required(),
        text: joi.string().required(),
        type: joi.string().required()
    });

    const validation = messageSchema.validate(req.body, { abortEarly: false });

    if (validation.error) {
        const errors = validation.error.details.map((detail) => detail.message);
        return res.status(422).send(errors);
    }

    to = sanitizeInput(to);
    text = sanitizeInput(text);
    type = sanitizeInput(type);
    user = sanitizeInput(user);
    const message = {
        from: user,
        to,
        text,
        type
    };
    try {
        await db.collection('messages').updateOne({ _id: new ObjectId(id) }, { $set: message });
        res.sendStatus(200);
    } catch (err) {
        res.status(500).send(err.message);
    };
});

app.post('/status', async (req, res) => {
    const user = req.header('User');

    const userFind = await db.collection('participants').findOne({ name: user });

    if (!userFind) {
        return res.status(404).send('User not found.');
    }

    try {
        const result = await db.collection('participants').updateOne({ name: user }, { $set: { lastStatus: Date.now() } });
        res.send('User lastStatus updated')
    } catch (err) {
        res.status(500).send(err.message);
    };        
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server successfully connected at PORT: ${PORT}; Server URL: http://localhost:${PORT}`);
});

function sanitizeInput(str) {
    return (stripHtml(str).result).trim();
}

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

setInterval(removeIdle, 15*1000);