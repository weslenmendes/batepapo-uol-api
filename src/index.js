import "dotenv/config";
import express, { json } from "express";
import cors from "cors";
import dayjs from "dayjs";

import { connectWithDB, ObjectId, db } from "./db/index.js";
import {
  messageSchema,
  participantSchema,
} from "./helpers/validation_schema.js";
import { sanitizeString } from "./utils/index.js";

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(json());

const removeInactiveParticipants = (
  inactivityLimitInSeconds,
  timeOfIntervalInSeconds
) => {
  const timeOfIntervalInMiliseconds = timeOfIntervalInSeconds * 1000;

  const removeParticipants = async () => {
    const msInSeconds = (ms) => ms / 1000;

    try {
      const allParticipants = await db
        .collection("participants")
        .find({})
        .toArray();

      for (const participant of allParticipants) {
        const { _id, name, lastStatus } = participant;

        if (
          msInSeconds(Date.now()) - msInSeconds(lastStatus) >
          inactivityLimitInSeconds
        ) {
          const deleteMessage = {
            from: name,
            to: "Todos",
            text: "sai da sala...",
            type: "status",
            time: dayjs().format("HH:mm:ss"),
          };

          await db
            .collection("participants")
            .deleteOne({ _id: new ObjectId(_id) });
          await db.collection("messages").insertOne(deleteMessage);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  return setInterval(removeParticipants, timeOfIntervalInMiliseconds);
};

removeInactiveParticipants(10, 15);

app.post("/participants", async (req, res) => {
  const { name } = req.body;
  const { error } = participantSchema.validate(name);

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
    console.log(usernameSanitized);
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
  if (!req.headers.user) {
    res.status(422).send("Informe o nome do participante no header.");
    return;
  }

  const user = sanitizeString(req.headers.user);
  const limit = parseInt(req.query.limit);

  try {
    const allMessages = await db
      .collection("messages")
      .find({
        $or: [
          { to: user },
          { to: "Todos" },
          { from: user },
          { type: "message" },
        ],
      })
      .toArray();

    if (limit) {
      const lastMessages = [...allMessages].slice(-limit);
      res.send(lastMessages);
      return;
    }

    res.send(allMessages);
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

app.post("/status", async (req, res) => {
  if (!req.headers.user) {
    res.status(422).send("É necessário o nome do usuário");
    return;
  }

  const user = sanitizeString(req.headers.user);

  try {
    const thisParticipantExists = await db
      .collection("participants")
      .findOne({ name: user });

    if (!thisParticipantExists) {
      res.sendStatus(404);
      return;
    }

    await db
      .collection("participants")
      .updateOne({ name: user }, { $set: { lastStatus: Date.now() } });
    res.sendStatus(200);
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
