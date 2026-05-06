import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import connectDb from "./db/db.js";
import app from "./app.js";

const port: number | string = process.env.PORT || 4000;

connectDb()
.then((conn) => {
  app.listen(port, () => {
    console.log(`Example app listening on port ${port} and connected to mongodb at ${conn.connection.host}`);
  })
})
.catch((err: Error) => {
  console.log("mongodb connection error", err);
});
