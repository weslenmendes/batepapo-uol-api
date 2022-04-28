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

const messageSchema = Joi.object({
  to: Joi.string().required(),
  text: Joi.string().required(),
  type: Joi.string().pattern(new RegExp("^(private_)?message$")).required(),
});

const participantSchema = Joi.string().required();

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

app.get("/participants", async (req, res) => {
  try {
    const allParticipants = await db
      .collection("participants")
      .find({})
      .toArray();
    res.send(allParticipants);
  } catch (e) {
    console.log("Ocorreu um erro: ", e);
    res.sendStatus(500);
  }
});

app.post("/messages", async (req, res) => {
  const { to, text, type } = req.body;
  const { user } = req.headers;
  const validateMessage = messageSchema.validate(req.body);
  const validateParticipant = participantSchema.validate(user);

  if (validateMessage.error || validateParticipant.error) {
    res.status(422).send("Ocorreu um erro no formato da mensagem.");
    return;
  }

  try {
    const usernameSanitized = sanitizeString(user);
    const userExists = await db
      .collection("participants")
      .findOne({ name: usernameSanitized });

    if (!userExists) {
      res.status(422).send("Esse usuário não existe.");
      return;
    }

    const message = {
      to: sanitizeString(to),
      text: sanitizeString(text),
      type: sanitizeString(type),
      from: usernameSanitized,
      time: dayjs().format("HH:mm:ss"),
    };

    await db.collection("messages").insertOne(message);
    res.sendStatus(201);
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

app.get("/messages", async (req, res) => {
  try {
    const allMessages = await db.collection("messages").find({}).toArray();
    res.send(allMessages);
  } catch (e) {
    console.error(e);
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
