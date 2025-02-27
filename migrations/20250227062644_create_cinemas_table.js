/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('cinemas', (table) => {
    table.increments('id').primary();
    table.string('cinema_id').notNullable();
    table.string('cinema_name').notNullable();
    table.integer('total_seats').notNullable();
    table.integer('each_row_capacity').notNullable();
    table.string('address').notNullable();
    table.timestamps(true, true);
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('cinemas');
};
