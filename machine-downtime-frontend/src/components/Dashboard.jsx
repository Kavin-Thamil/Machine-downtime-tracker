import { useState, useEffect } from "react";
import { API_BASE_URL } from "../config/api.js";
import MachineCard from "./MachineCard.jsx";
import DowntimeForm from "./DowntimeForm.jsx";
import DowntimeHistory from "./DowntimeHistory.jsx";


function Dashboard() {

    const [machines, setMachines] = useState([]);
    const [events, setEvents] = useState([]);
    const [machineSearch, setMachineSearch] = useState("");
    const [machineStatusFilter, setMachineStatusFilter] = useState("all");
    const [machinePage, setMachinePage] = useState(1);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {

        async function loadDashboardData() {

            try {
                const machineResponse = await fetch(
                    `${API_BASE_URL}/machines`
                );

                if (!machineResponse.ok) {
                    throw new Error("Failed to fetch machines");
                }

                const machineData = await machineResponse.json();

                setMachines(machineData);

                const eventResponse = await fetch(
                    `${API_BASE_URL}/events`
                );

                if (!eventResponse.ok) {
                    throw new Error("Failed to fetch downtime events");
                }

                const eventData = await eventResponse.json();

                setEvents(eventData);

            } catch (error) {

                setError("Unable to load dashboard data. Please refresh.");

                console.error(error);

            } finally {

                setIsLoading(false);

            }

        }

        loadDashboardData();

    }, []);

    async function handleAddEvent(eventData) {

        const response = await fetch(`${API_BASE_URL}/events`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(eventData)

        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Failed to create downtime event");
        }

        const createdEvent = data.event;

        const selectedMachine = machines.find(
            machine => machine.id === createdEvent.machine_id
        );

        const eventForDisplay = {
            ...createdEvent,
            machine_name: selectedMachine
                ? selectedMachine.name
                : "Unknown Machine"
        };

        setEvents(previousEvents => [
            eventForDisplay,
            ...previousEvents
        ]);

        setMachines(previousMachines =>
            previousMachines.map(machine =>
                machine.id === createdEvent.machine_id
                    ? { ...machine, status: "stopped" }
                    : machine
            )
        );

    }

    async function handleCloseEvent(eventId) {

        const targetEvent = events.find(
            event => event.id === eventId
        );

        if (!targetEvent || targetEvent.ended_at !== null) {
            return;
        }

        try {

            const response = await fetch(
                `${API_BASE_URL}/events/${eventId}/close`,
                {
                    method: "PATCH"
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Failed to close downtime event"
                );
            }

            const updatedEvent = {
                ...data.event,
                machine_name: targetEvent.machine_name
            };

            setEvents(previousEvents =>
                previousEvents.map(event =>
                    event.id === eventId
                        ? updatedEvent
                        : event
                )
            );

            setMachines(previousMachines =>
                previousMachines.map(machine =>
                    machine.id === updatedEvent.machine_id
                        ? {
                            ...machine,
                            status: data.machine_status
                        }
                        : machine
                )
            );

        } catch (error) {

            console.error("Error closing downtime event:", error);

            window.alert(error.message);

        }

    }

    const MACHINES_PER_PAGE = 12;

    const statusPriority = {
        warning: 1,
        stopped: 2,
        running: 3
    };

    const filteredMachines = machines
        .filter(machine => {

            const searchTerm = machineSearch.trim().toLowerCase();

            const matchesSearch =
                machine.name.toLowerCase().includes(searchTerm) ||
                String(machine.id).includes(searchTerm);

            const matchesStatus =
                machineStatusFilter === "all" ||
                machine.status === machineStatusFilter;

            return matchesSearch && matchesStatus;

        })
        .sort((a, b) => {

            return (
                (statusPriority[a.status] ?? 4) -
                (statusPriority[b.status] ?? 4)
            );

        });

    const totalMachinePages = Math.ceil(
        filteredMachines.length / MACHINES_PER_PAGE
    );

    const currentMachinePage = Math.min(
        machinePage,
        Math.max(1, totalMachinePages)
    );

    const startIndex = (currentMachinePage - 1) * MACHINES_PER_PAGE;

    const paginatedMachines = filteredMachines.slice(
        startIndex,
        startIndex + MACHINES_PER_PAGE
    );

    const runningCount = machines.filter(
        machine => machine.status === "running"
    ).length;

    const stoppedCount = machines.filter(
        machine => machine.status === "stopped"
    ).length;

    const warningCount = machines.filter(
        machine => machine.status === "warning"
    ).length;


    return (

        <main className="dashboard">

            {/* Dashboard heading */}

            <section className="dashboard-heading">

                <h1>Machine Overview</h1>

                <p>
                    Monitor factory machine operations and downtime.
                </p>

            </section>


            {/* Summary cards */}

            {!isLoading && !error && (

                <section className="summary-grid">

                    <div className="summary-card">
                        <h3>Total Machines</h3>
                        <p>{machines.length}</p>
                    </div>

                    <div className="summary-card">
                        <h3>Running</h3>
                        <p>{runningCount}</p>
                    </div>

                    <div className="summary-card">
                        <h3>Stopped</h3>
                        <p>{stoppedCount}</p>
                    </div>

                    <div className="summary-card">
                        <h3>Warning</h3>
                        <p>{warningCount}</p>
                    </div>

                </section>

            )}


            {/* Machine cards */}

            <section className="machine-section">

                <h2>Machines</h2>

                <div className="machine-controls">

                    {/* Machine search */}

                    <input
                        type="search"
                        className="machine-search"
                        placeholder="Search by machine name or ID..."
                        value={machineSearch}
                        onChange={(event) => {
                            setMachineSearch(event.target.value);
                            setMachinePage(1);
                        }}
                    />

                    {/* Status filters */}

                    <div className="machine-filters">

                        <button
                            type="button"
                            className={`machine-filter-button ${
                                machineStatusFilter === "all" ? "active" : ""
                            }`}
                            onClick={() => {
                                setMachineStatusFilter("all");
                                setMachinePage(1);
                            }}
                        >
                            All
                        </button>

                        <button
                            type="button"
                            className={`machine-filter-button ${
                                machineStatusFilter === "running" ? "active" : ""
                            }`}
                            onClick={() => {
                                setMachineStatusFilter("running");
                                setMachinePage(1);
                            }}
                        >
                            Running
                        </button>

                        <button
                            type="button"
                            className={`machine-filter-button ${
                                machineStatusFilter === "stopped" ? "active" : ""
                            }`}
                            onClick={() => {
                                setMachineStatusFilter("stopped");
                                setMachinePage(1);
                            }}
                        >
                            Stopped
                        </button>

                        <button
                            type="button"
                            className={`machine-filter-button ${
                                machineStatusFilter === "warning" ? "active" : ""
                            }`}
                            onClick={() => {
                                setMachineStatusFilter("warning");
                                setMachinePage(1);
                            }}
                        >
                            Warning
                        </button>

                    </div>

                </div>

                {isLoading && (
                    <p className="information-message">
                        Loading machines...
                    </p>
                )}

                {error && (
                    <p className="form-error">{error}</p>
                )}

                {!isLoading && !error && (

                    filteredMachines.length > 0 ? (

                        <>

                            <div className="machine-list">

                                {paginatedMachines.map(machine => (

                                    <MachineCard
                                        key={machine.id}
                                        name={machine.name}
                                        status={machine.status}
                                    />

                                ))}

                            </div>

                            {/* Machine pagination */}

                            <div className="machine-pagination">

                                <p>
                                    Showing {startIndex + 1}–{
                                        Math.min(
                                            startIndex + MACHINES_PER_PAGE,
                                            filteredMachines.length
                                        )
                                    } of {filteredMachines.length} machines
                                </p>

                                <div className="pagination-controls">

                                    <button
                                        type="button"
                                        disabled={currentMachinePage === 1}
                                        onClick={() => setMachinePage(currentMachinePage - 1)}
                                    >
                                        Previous
                                    </button>

                                    <span>
                                        Page {currentMachinePage} of {totalMachinePages}
                                    </span>

                                    <button
                                        type="button"
                                        disabled={currentMachinePage === totalMachinePages}
                                        onClick={() => setMachinePage(currentMachinePage + 1)}
                                    >
                                        Next
                                    </button>

                                </div>

                            </div>

                        </>

                    ) : (

                        <p className="machine-empty">
                            No machines match your search or selected filter.
                        </p>

                    )

                )}

            </section>

            {/* Downtime form */}

            {!isLoading && !error && (

                <DowntimeForm
                    machines={machines}
                    events={events}
                    onAddEvent={handleAddEvent}
                />

            )}


            {/* Downtime history */}

            {!isLoading && !error && (

                <DowntimeHistory
                    events={events}
                    onCloseEvent={handleCloseEvent}
                />

            )}

        </main>

    );

}

export default Dashboard;