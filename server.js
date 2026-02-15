const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send("E2EE App Running");
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
