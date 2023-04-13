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

mongoClient.connect()
    .then(() => {
	    db = mongoClient.db(); 
    })
    .catch((err) => console.log(err.message));

const BACKEND_PORT = 5000;
server.listen(BACKEND_PORT, () => {
    console.log(`Servidor conectado na porta ${BACKEND_PORT}`);
});