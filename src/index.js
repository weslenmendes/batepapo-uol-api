import "dotenv/config";
import express, { json } from "express";
import cors from "cors";
import dayjs from "dayjs";

import { connectWithDB, ObjectId, db } from "./db/index.js";
import {
  messageSchema,
  participantSchema,
  options,
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
    return res.status(422).send("name deve ser strings não vazio.");
  }

  try {
    const nameSanitized = sanitizeString(name);
    const thisNameAlreadyExists = await db
      .collection("participants")
      .findOne({ name: nameSanitized });

    if (thisNameAlreadyExists) {
      return res.status(409).send("Esse name já está sendo usado.");
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
    res.sendStatus(500);
    console.error(e);
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
    res.sendStatus(500);
    console.error(e);
  }
});

app.post("/messages", async (req, res) => {
  const { to, text, type } = req.body;
  const { user } = req.headers;
  const { error } = messageSchema.validate(
    { from: user, to, text, type },
    options
  );

  if (error) {
    const allMessagesOfError = error.details.map(({ message }) => message);

    return res.status(422).send(allMessagesOfError);
  }

  try {
    const userSanitized = sanitizeString(user);
    const toSanitized = sanitizeString(to);
    const userExists = await db
      .collection("participants")
      .findOne({ name: usernameSanitized });
    const receiverExists = await db
      .collection("participants")
      .findOne({ name: toSanitized });

    if (!userExists) {
      return res.status(422).send("Esse usuário não existe.");
    }

    if (!receiverExists) {
      return res.status(422).send("Esse destinatário não existe.");
    }

    const message = {
      to: toSanitized,
      text: sanitizeString(text),
      type: sanitizeString(type),
      from: userSanitized,
      time: dayjs().format("HH:mm:ss"),
    };

    await db.collection("messages").insertOne(message);
    res.sendStatus(201);
  } catch (e) {
    res.sendStatus(500);
    console.error(e);
  }
});

app.get("/messages", async (req, res) => {
  let user = req.headers.user;

  if (!user) {
    return res.status(422).send("Informe o nome do participante no header.");
  }

  const limit = parseInt(req.query.limit);
  user = sanitizeString(user);

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
      return res.send(lastMessages);
    }

    res.send(allMessages);
  } catch (e) {
    res.sendStatus(500);
    console.error(e);
  }
});

app.put("/messages/:messageId", async (req, res) => {
  const { to, text, type } = req.body;
  const from = req.headers.user;

  const validateMessage = messageSchema.validate(
    { from, to, text, type },
    options
  );

  if (validateMessage.error) {
    const { error } = validateMessage;

    const allMessagesOfError = error.details.map(({ message }) => message);

    return res.status(422).send(allMessagesOfError);
  }

  try {
    const { messageId } = req.params;
    const user = sanitizeString(from);
    const objectId = new ObjectId(messageId);

    const thisParticipantExists = await db.collection("participants").findOne({
      name: user,
    });

    if (!thisParticipantExists) {
      return res.send(404).send("Participante não existe.");
    }

    const message = await db.collection("messages").findOne({ _id: objectId });

    if (!message) {
      return res.status(404).send("Essa mensagem não existe.");
    }

    if (message.from !== user) {
      return res.status(401).send("Usuário não é dono da mensagem.");
    }

    const messageBody = {
      from: user,
      to: sanitizeString(to),
      text: sanitizeString(text),
      type: sanitizeString(type),
      time: dayjs().format("HH:mm:ss"),
    };

    await db
      .collection("messages")
      .updateOne({ _id: objectId }, { $set: messageBody });
    res.sendStatus(200);
  } catch (e) {
    res.sendStatus(500);
    console.error(e);
  }
});

app.delete("/messages/:messageId", async (req, res) => {
  let { user } = req.headers;

  const { error } = participantSchema.validate(user, options);

  if (error) {
    const allMessagesOfError = error.details.map(({ message }) => message);

    return res.status(422).send(allMessagesOfError);
  }

  try {
    const { messageId } = req.params;
    const objectId = new ObjectId(messageId);
    user = sanitizeString(user);

    const message = await db.collection("messages").findOne({ _id: objectId });

    if (!message) {
      return res.status(404).send("Essa mensagem não existe.");
    }

    if (message.from !== user) {
      return res.status(401).send("Usuário não é dono da mensagem.");
    }

    await db.collection("messages").deleteOne({ _id: objectId });
    res.sendStatus(200);
  } catch (e) {
    res.sendStatus(500);
    console.error(e);
  }
});

app.post("/status", async (req, res) => {
  let user = req.headers.user;

  if (!user) {
    return res.status(422).send("É necessário o nome do usuário");
  }

  user = sanitizeString(user);

  try {
    const thisParticipantExists = await db
      .collection("participants")
      .findOne({ name: user });

    if (!thisParticipantExists) {
      return res.sendStatus(404);
    }

    await db
      .collection("participants")
      .updateOne({ name: user }, { $set: { lastStatus: Date.now() } });
    res.sendStatus(200);
  } catch (e) {
    res.sendStatus(500);
    console.error(e);
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
