const pool = require("./connection");

async function testConnection() {

    try {

        const result = await pool.query(`
            SELECT
                current_database() AS database,
                current_user AS username,
                inet_server_addr() AS server_address,
                inet_server_port() AS server_port;
        `);

        console.log("Database connection successful!");

        console.table(result.rows);

    } catch (error) {

        console.error("Database connection failed:");
        console.error(error.message);

    } finally {

        await pool.end();

    }

}

testConnection();