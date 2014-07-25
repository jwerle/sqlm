
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id        serial     PRIMARY KEY,
  username  text       NOT NULL,
  password  text       NOT NULL,
  email     text       NOT NULL
);
