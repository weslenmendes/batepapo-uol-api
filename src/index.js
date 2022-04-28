import "dotenv/config";
import express, { json } from "express";
import cors from "cors";
import Joi from "joi";
import dayjs from "dayjs";

import { connectWithDB, db } from "./db/index.js";
import { sanitizeString } from "./utils/index.js";

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(json());

app.post("/participants", async (req, res) => {
  const { name } = req.body;
  const { error } = Joi.string().required().validate(name);

  if (error) {
    res.status(422).send("name deve ser strings não vazio.");
    return;
  }

  try {
    const nameSanitized = sanitizeString(name);
    const thisNameAlreadyExists = await db
      .collection("participants")
      .findOne({ name: nameSanitized });

    if (thisNameAlreadyExists) {
      res.status(409).send("Esse name já está sendo usado.");
      return;
    }

    const newUser = {
      name: nameSanitized,
      lastStatus: Date.now(),
    };

    const newUserMessage = {
      from: nameSanitized,
      to: "Todos",
      text: "entra na sala...",
      type: "status",
      time: dayjs().format("HH:mm:ss"),
    };

    await db.collection("participants").insertOne(newUser);
    await db.collection("messages").insertOne(newUserMessage);
    res.sendStatus(201);
  } catch (e) {
    console.log("Ocorreu um erro:", e);
    res.sendStatus(500);
  }
});

connectWithDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`🚀 Server is running on: http://localhost:${port}/`);
    });
  })
  .catch((e) => {
    console.log("Ocorreu um erro na conexão com o banco", e);
  });
