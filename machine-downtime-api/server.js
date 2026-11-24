const express = require("express");
const cors = require("cors");
const pool = require("./database/connection");
const app = express();

const PORT = 3000;
app.use(cors({
    origin: "http://localhost:5173"
}));

app.use(express.json());

app.get("/machines", async (req, res) => {

    try {

        const result = await pool.query(
            "SELECT id, name, status FROM machines ORDER BY id"
        );

        res.json(result.rows);

    } catch (error) {

        console.error("Error retrieving machines:", error.message);

        res.status(500).json({
            error: "Failed to retrieve machines"
        });

    }

});

app.get("/events", async (req, res) => {

    try {

        const result = await pool.query(`
            SELECT
                e.id,
                e.machine_id,
                m.name AS machine_name,
                e.reason,
                e.started_at,
                e.ended_at,
                CASE
                    WHEN e.ended_at IS NULL THEN 'Open'
                    ELSE 'Closed'
                END AS status
            FROM downtime_events AS e
            JOIN machines AS m
                ON e.machine_id = m.id
            ORDER BY e.started_at DESC;
        `);

        res.json(result.rows);

    } catch (error) {

        console.error("Error retrieving downtime events:", error.message);

        res.status(500).json({
            error: "Failed to retrieve downtime events"
        });

    }

});

app.post("/events", async (req, res) => {

    const { machine_id, reason } = req.body || {};

    if (!Number.isInteger(machine_id) || machine_id <= 0) {
        return res.status(400).json({
            error: "A valid machine_id is required"
        });
    }

    if (typeof reason !== "string" || reason.trim() === "") {
        return res.status(400).json({
            error: "A valid downtime reason is required"
        });
    }

    let client;

    try {

        client = await pool.connect();

        await client.query("BEGIN");

        const machineResult = await client.query(
            "SELECT id FROM machines WHERE id = $1 FOR UPDATE",
            [machine_id]
        );

        if (machineResult.rowCount === 0) {

            await client.query("ROLLBACK");

            return res.status(404).json({
                error: "Machine not found"
            });

        }

        const eventResult = await client.query(
            `INSERT INTO downtime_events (machine_id, reason)
             VALUES ($1, $2)
             RETURNING id, machine_id, reason, started_at, ended_at`,
            [machine_id, reason.trim()]
        );

        await client.query(
            "UPDATE machines SET status = 'stopped' WHERE id = $1",
            [machine_id]
        );

        await client.query("COMMIT");

        const newEvent = {
            ...eventResult.rows[0],
            status: "Open"
        };

        res.status(201).json({
            message: "Downtime event created successfully",
            event: newEvent
        });

    } catch (error) {

        if (client) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error("Rollback failed:", rollbackError.message);
            }
        }

        if (
            error.code === "23505" &&
            error.constraint === "downtime_events_one_open_per_machine"
        ) {
            return res.status(409).json({
                error: "This machine already has an open downtime event"
            });
        }

        console.error("Error creating downtime event:", error.message);

        res.status(500).json({
            error: "Failed to create downtime event"
        });

    } finally {

        if (client) {
            client.release();
        }

    }

});

app.patch("/events/:id/close", async (req, res) => {

    const eventId = Number(req.params.id);

    if (!Number.isInteger(eventId) || eventId <= 0) {
        return res.status(400).json({
            error: "Invalid downtime event ID"
        });
    }

    let client;
    let transactionStarted = false;

    try {

        client = await pool.connect();

        await client.query("BEGIN");
        transactionStarted = true;

        const eventLookup = await client.query(
            "SELECT machine_id FROM downtime_events WHERE id = $1",
            [eventId]
        );

        if (eventLookup.rowCount === 0) {

            await client.query("ROLLBACK");
            transactionStarted = false;

            return res.status(404).json({
                error: "Downtime event not found"
            });

        }

        const machineId = eventLookup.rows[0].machine_id;

        await client.query(
            "SELECT id FROM machines WHERE id = $1 FOR UPDATE",
            [machineId]
        );

        const eventResult = await client.query(
            `SELECT id, machine_id, reason, started_at, ended_at
             FROM downtime_events
             WHERE id = $1
             FOR UPDATE`,
            [eventId]
        );

        const event = eventResult.rows[0];

        if (event.ended_at !== null) {

            await client.query("ROLLBACK");
            transactionStarted = false;

            return res.status(409).json({
                error: "This downtime event is already closed"
            });

        }

        const closedEvent = await client.query(
            `UPDATE downtime_events
             SET ended_at = CURRENT_TIMESTAMP
             WHERE id = $1
             RETURNING id, machine_id, reason, started_at, ended_at`,
            [eventId]
        );

        const openEvents = await client.query(
            `SELECT EXISTS (
                SELECT 1
                FROM downtime_events
                WHERE machine_id = $1
                AND ended_at IS NULL
            ) AS has_open_events`,
            [machineId]
        );

        const hasOpenEvents = openEvents.rows[0].has_open_events;

        let machineStatus = "stopped";

        if (!hasOpenEvents) {

            await client.query(
                "UPDATE machines SET status = 'running' WHERE id = $1",
                [machineId]
            );

            machineStatus = "running";

        }

        await client.query("COMMIT");
        transactionStarted = false;

        res.status(200).json({
            message: "Downtime event closed successfully",
            event: {
                ...closedEvent.rows[0],
                status: "Closed"
            },
            machine_status: machineStatus
        });

    } catch (error) {

        if (client && transactionStarted) {

            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error("Rollback failed:", rollbackError.message);
            }

        }

        console.error("Error closing downtime event:", error.message);

        res.status(500).json({
            error: "Failed to close downtime event"
        });

    } finally {

        if (client) {
            client.release();
        }

    }

});

app.listen(PORT, () => {
    console.log(`Machine Downtime Tracker API running on port ${PORT}`);
});