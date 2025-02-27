/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('seats', (table) => {
    table.increments('id').primary();
    table.string('cinema_id').notNullable();
    table.integer('seat_number').notNullable();
    table.boolean('is_sold').defaultTo(false);
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('seats');
};
