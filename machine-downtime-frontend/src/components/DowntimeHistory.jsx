import { useState } from "react";

function DowntimeHistory({ events, onCloseEvent }) {

    const [selectedFilter, setSelectedFilter] = useState("active");
    const [currentPage, setCurrentPage] = useState(1);

    const EVENTS_PER_PAGE = 10;

    function formatDateTime(date) {
        return new Date(date).toLocaleString();
    }

    function isClosedEvent(event) {
        return (
            event.ended_at !== null &&
            event.ended_at !== undefined &&
            event.ended_at !== "" &&
            !Number.isNaN(new Date(event.ended_at).getTime())
        );
    }

    // Filter events

    const filteredEvents = events.filter(event => {

        if (selectedFilter === "active") {
            return event.ended_at === null;
        }

        if (selectedFilter === "closed") {
            return isClosedEvent(event);
        }

        return true;

    });


    // Sort newest events first

    const sortedEvents = [...filteredEvents].sort((a, b) => {

        const dateA = new Date(a.started_at).getTime();
        const dateB = new Date(b.started_at).getTime();

        return dateB - dateA;

    });


    // Calculate pagination

    const totalPages = Math.ceil(
        sortedEvents.length / EVENTS_PER_PAGE
    );

    const safeCurrentPage = Math.min(
        currentPage,
        Math.max(1, totalPages)
    );

    const startIndex = (safeCurrentPage - 1) * EVENTS_PER_PAGE;

    const endIndex = Math.min(
        startIndex + EVENTS_PER_PAGE,
        sortedEvents.length
    );

    const paginatedEvents = sortedEvents.slice(
        startIndex,
        endIndex
    );


    // Change filter and reset pagination

    function handleFilterChange(filter) {
        setSelectedFilter(filter);
        setCurrentPage(1);
    }


    return (
        <section className="history-section">

            <h2>Downtime History</h2>


            {/* Event filters */}

            <div className="history-filters">

                <button
                    type="button"
                    className={`history-filter-button ${
                        selectedFilter === "all" ? "active" : ""
                    }`}
                    onClick={() => handleFilterChange("all")}
                >
                    All Events
                </button>

                <button
                    type="button"
                    className={`history-filter-button ${
                        selectedFilter === "active" ? "active" : ""
                    }`}
                    onClick={() => handleFilterChange("active")}
                >
                    Active Events
                </button>

                <button
                    type="button"
                    className={`history-filter-button ${
                        selectedFilter === "closed" ? "active" : ""
                    }`}
                    onClick={() => handleFilterChange("closed")}
                >
                    Closed Events
                </button>

            </div>


            {/* Event history */}

            {filteredEvents.length === 0 ? (

                <p className="history-empty">

                    {selectedFilter === "active"
                        ? "No active downtime events."
                        : selectedFilter === "closed"
                        ? "No closed downtime events."
                        : "No downtime events recorded."}

                </p>

            ) : (

                <>

                    <div className="table-container">

                        <table className="event-table">

                            <thead>
                                <tr>
                                    <th>Machine</th>
                                    <th>Reason</th>
                                    <th>Started At</th>
                                    <th>Ended At</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>

                                {paginatedEvents.map(event => {

                                    const closed = isClosedEvent(event);

                                    return (
                                        <tr key={event.id}>

                                            <td>{event.machine_name}</td>

                                            <td>{event.reason}</td>

                                            <td>
                                                {formatDateTime(event.started_at)}
                                            </td>

                                            <td>
                                                {event.ended_at === null
                                                    ? "Ongoing"
                                                    : closed
                                                    ? formatDateTime(event.ended_at)
                                                    : "Invalid timestamp"}
                                            </td>

                                            <td>
                                                <span className={`event-status ${
                                                    closed ? "closed" : "active"
                                                }`}>
                                                    {closed ? "Closed" : "Open"}
                                                </span>
                                            </td>

                                            <td>

                                                {!event.ended_at && (
                                                    <button
                                                        className="close-event-button"
                                                        onClick={() => onCloseEvent(event.id)}
                                                    >
                                                        Close Event
                                                    </button>
                                                )}

                                                {event.ended_at && "—"}

                                            </td>

                                        </tr>
                                    );

                                })}

                            </tbody>

                        </table>

                    </div>


                    {/* Pagination */}

                    <div className="history-pagination">

                        <p>
                            Showing {startIndex + 1}–{endIndex} of{" "}
                            {sortedEvents.length} events
                        </p>

                        {totalPages > 1 && (

                            <div className="history-pagination-controls">

                                <button
                                    type="button"
                                    disabled={safeCurrentPage === 1}
                                    onClick={() => setCurrentPage(safeCurrentPage - 1)}
                                >
                                    Previous
                                </button>

                                <span>
                                    Page {safeCurrentPage} of {totalPages}
                                </span>

                                <button
                                    type="button"
                                    disabled={safeCurrentPage === totalPages}
                                    onClick={() => setCurrentPage(safeCurrentPage + 1)}
                                >
                                    Next
                                </button>

                            </div>

                        )}

                    </div>

                </>

            )}

        </section>
    );
}

export default DowntimeHistory;