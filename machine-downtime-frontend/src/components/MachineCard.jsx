function MachineCard({ name, status }) {

    const statusMessages = {
        running: "Operating normally",
        stopped: "Machine is currently stopped",
        warning: "Machine requires attention"
    };

    return (
        <div className="machine-card">

            <div className="machine-card-header">

                <h3>{name}</h3>

                <span className={`status-badge ${status}`}>
                    {status.toUpperCase()}
                </span>

            </div>

            <p>{statusMessages[status] || "Unknown status"}</p>

        </div>
    );
}

export default MachineCard;