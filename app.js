const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "users.db");
let db = null;

// Initialize DB + Server
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    // Create table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        age INTEGER
      );
    `);

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      console.log(`Server Running at http://localhost:${PORT}/`);
    });

  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();



app.get("/users", async (req, res) => {
  try {
    const { search = "", sort = "id", order = "ASC" } = req.query;

    const validSortFields = ["id", "name", "email", "age"];
    const sortField = validSortFields.includes(sort) ? sort : "id";
    const sortOrder = order.toUpperCase() === "DESC" ? "DESC" : "ASC";

    const query = `
      SELECT * FROM users
      WHERE name LIKE '%${search}%' OR email LIKE '%${search}%'
      ORDER BY ${sortField} ${sortOrder};
    `;

    const users = await db.all(query);
    res.json(users);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// 🔹 GET /users/:id
app.get("/users/:id/", async (request, response) => {
  const { id } = request.params;

  const getUserQuery = `
    SELECT *
    FROM users
    WHERE id = ?;
  `;

  const user = await db.get(getUserQuery, [id]);
  response.send(user);
});

app.post("/users/", async (request, response) => {
  const { name, email, age } = request.body;

  const query = `
    INSERT INTO users (name, email, age)
    VALUES (?, ?, ?);
  `;

  const result = await db.run(query, [name, email, age]);

  response.send({
    id: result.lastID,
    name,
    email,
    age
  });
});
// 🔹 PUT /users/:id
app.put("/users/:id/", async (request, response) => {
  const { id } = request.params;
  const { name, email, age } = request.body;

  const updateUserQuery = `
    UPDATE users
    SET name = '${name}',
        email = '${email}',
        age = ${age}
    WHERE id = ${id};
  `;

  await db.run(updateUserQuery);

  response.send("User Updated");
});


// 🔹 DELETE /users/:id
app.delete("/users/:id/", async (request, response) => {
  const { id } = request.params;

  const deleteUserQuery = `
    DELETE FROM users
    WHERE id = ${id};
  `;

  await db.run(deleteUserQuery);

  response.send("User Deleted");
});