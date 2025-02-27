module.exports = {
  development: {
    client: "pg",
    connection: {
      host: "127.0.0.1",
      user: "postgres",
      password: "admin",
      database: "serverless_db",
      port: 5432,
    },
    migrations: {
      directory: "./migrations",
    },
  },
};
