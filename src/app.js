import express, { json } from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';
import dotenv from 'dotenv';

const server = express();

server.use(cors());
server.use(json());
dotenv.config();

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

mongoClient.connect()
    .then(() => {
	    db = mongoClient.db(); 
    })
    .catch((err) => console.log(err.message));

server.listen(process.env.BACKEND_PORT, () => {
    console.log(`Servidor conectado na porta ${process.env.BACKEND_PORT}`);
});