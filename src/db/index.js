import { MongoClient, ObjectId } from "mongodb";

const url = process.env.DB_URL;
const client = new MongoClient(url);
let db = null;

async function connectWithDB() {
  try {
    await client.connect();
    db = client.db(process.env.DB_NAME);
  } catch (e) {
    console.log("Ocorreu um erro na conexão com o banco", e);
  }
}

export { connectWithDB, client, db, ObjectId };
