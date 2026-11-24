function getMachines() {
    return [
        {
            id: 1,
            name: "CNC Machine 01",
            status: "running"
        },
        {
            id: 2,
            name: "Conveyor Belt 02",
            status: "stopped"
        }
    ];
}

module.exports = getMachines;