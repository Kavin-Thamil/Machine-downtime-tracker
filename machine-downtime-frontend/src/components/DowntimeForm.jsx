import { useState } from "react";

function DowntimeForm({ machines, events, onAddEvent }) {

    const [reason, setReason] = useState("");
    const [machineId, setMachineId] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function handleSubmit(event) {

    event.preventDefault();

    const selectedMachineId = Number(machineId);

    if (machineId === "") {
        setError("Please select a machine.");
        setSuccess("");
        return;
    }

    if (reason.trim() === "") {
        setError("Please enter a downtime reason.");
        setSuccess("");
        return;
    }

    const existingEvent = events.some(
        item =>
            item.machine_id === selectedMachineId &&
            item.ended_at === null
    );

    if (existingEvent) {
        setError("This machine already has an open downtime event.");
        setSuccess("");
        return;
    }

    const eventData = {
        machine_id: selectedMachineId,
        reason: reason.trim()
    };

    try {

        await onAddEvent(eventData);

        setReason("");
        setMachineId("");
        setError("");
        setSuccess("Downtime report submitted successfully.");

    } catch (error) {

        setError(error.message);
        setSuccess("");

    }

}

    return (
        <section className="downtime-form">

            <h2>Report Machine Downtime</h2>

            <form onSubmit={handleSubmit}>

                <label htmlFor="machine">
                    Select Machine
                </label>

                <select
                    id="machine"
                    value={machineId}
                    onChange={(event) => setMachineId(event.target.value)}
                >
                    <option value="">Select a machine</option>

                    {machines.map(machine => (
                        <option
                            key={machine.id}
                            value={machine.id}
                        >
                            {machine.name}
                        </option>
                    ))}

                </select>

                <label htmlFor="reason">
                    Downtime Reason
                </label>

                <input
                    id="reason"
                    type="text"
                    placeholder="Enter downtime reason"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                />

                {error && (
                    <p className="form-error">{error}</p>
                )}

                {success && (
                    <p className="success-message">{success}</p>
                )}

                <button type="submit">
                    Report Downtime
                </button>

            </form>

        </section>
    );
}

export default DowntimeForm;