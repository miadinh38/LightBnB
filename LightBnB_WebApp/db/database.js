const properties = require("./json/properties.json");
const users = require("./json/users.json");
const { Pool } = require('pg');

const pool = new Pool({
  user: 'miadinh',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});



/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {

  return pool
    .query(`SELECT * FROM users WHERE email = $1`, [email])
    .then((result) => {
      console.log(result.rows);
      const users = result.rows;
      if (users.length > 0) {
        return users[0];
      } else {
        return null;
      }
    })
    .catch((err) => {
      console.log(err.message);
    });  

};

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {

  return pool
  .query(`SELECT * FROM users WHERE id = $1`, [id])
  .then((result) => {
    console.log(result.rows);
    const users = result.rows;
    if (users.length > 0) {
      return users[0];
    } else {
      return null;
    }
  })
  .catch((err) => {
    console.log(err.message);
  });  
};

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {
  return new Promise((resolve, reject) => { 
    //extract user properties
    const { name,  email, password } = user;

    //perform the db query to insert a new user
    pool
    .query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
    [name, email, password])
    .then((result) => {
      const newUser = result.rows[0];
      return newUser;
    })
    .catch((err) => {
      console.log(err.message);
    });
  });
};

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {

  return pool
  .query(`SELECT * FROM reservations LIMIT $1`, [limit])
  .then((result) => {
    console.log(result.rows);
    return result.rows;
  })
  .catch((err) => {
    console.log(err.message);
  });  
};

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function (options, limit = 10) {

    // Setup an array to hold any parameters that may be available for the query
    const queryParams = [];
    
    // Start the query with all information that comes before the WHERE clause
    let queryString = `
    SELECT properties.*, avg(property_reviews.rating) as average_rating
    FROM properties
    JOIN property_reviews ON properties.id = property_id
    `;
    
    // Check if an owner id has been passed in
    if (options.owner_id) {
      queryParams.push(options.owner_id);
      queryString += `WHERE owner_id = $${queryParams.length}`;
    }

    // Check if a city has been passed in
    if (options.city) {
      queryParams.push(`%${options.city}%`);
      queryString += `${queryParams.length > 0 ? 'AND' : 'WHERE'} city LIKE $${queryParams.length} `;
    }

    // Check if a minimum_price_per_night has been passed in
    if (options.minimum_price_per_night) {
      queryParams.push(options.minimum_price_per_night * 100); // convert to cents
      queryString += `${queryParams.length > 0 ? 'AND' : 'WHERE'} cost_per_night >= $${queryParams.length} `;
    }
  
    // Check if a maximum_price_per_night has been passed in
    if (options.maximum_price_per_night) {
      queryParams.push(options.maximum_price_per_night * 100); // convert to cents
      queryString += `${queryParams.length > 0 ? 'AND' : 'WHERE'} cost_per_night <= $${queryParams.length} `;
    }
  
    // Check if a minimum_rating has been passed in
    if (options.minimum_rating) {
      queryParams.push(options.minimum_rating);
      queryString += `${queryParams.length > 0 ? 'AND' : 'WHERE'} property_reviews.rating >= $${queryParams.length} `;
    }

    // Add any query that comes after the WHERE clause
    queryParams.push(limit);
    queryString += `
    GROUP BY properties.id
    ORDER BY cost_per_night
    LIMIT $${queryParams.length};
    `;

    // Console log everything
    console.log(queryString, queryParams);

    // Run the query
    return pool.query(queryString, queryParams).then((res) => res.rows);
};

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  // const propertyId = Object.keys(properties).length + 1;
  // property.id = propertyId;
  // properties[propertyId] = property;
  // return Promise.resolve(property);


};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};


