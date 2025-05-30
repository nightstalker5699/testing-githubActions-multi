const keys = require("./keys");

// Express App Setup

const express = require("express");
const cors = require("cors");

const app = express();

app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());

// Postgress client setup

const { Pool } = require("pg");
const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort,
  ssl:
    process.env.NODE_ENV != "production"
      ? false
      : { rejectUnauthorized: false },
});

pgClient.on("error", () => {
  console.log("lost Connection to the database");
});

pgClient.on("connect", (client) => {
  client
    .query("CREATE TABLE IF NOT EXISTS  values (number INT)")
    .catch((err) => {
      console.log(err);
    });
});

// redis Client Setup

const redis = require("redis");
const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000,
});

const redisPublisher = redisClient.duplicate();

// express route handlers

app.get("/", (req, res) => {
  res.send("HI");
});

app.get("/values/all", async (req, res) => {
  const values = await pgClient.query("SELECT * FROM values");

  res.send(values.rows);
});

app.get("/values/current", async (req, res) => {
  redisClient.hgetall("values", (err, values) => {
    res.send(values);
  });
});

app.post("/values", async (req, res) => {
  const index = req.body.index;
  if (parseInt(index) > 40) {
    return res.status(422).send("index too high");
  }

  redisClient.hset("values", index, "Nothing yet!");
  redisPublisher.publish("insert", index);

  pgClient.query(`INSERT INTO values(number) values(${index})`);

  res.send({ working: true });
});

app.listen(5000, (err) => {
  console.log("Listening");
});
