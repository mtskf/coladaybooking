// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
import "@openzeppelin/contracts/access/Ownable.sol";

contract HelloWorld is Ownable {
    string[] private rooms = [
        "C01",
        "C02",
        "C03",
        "C04",
        "C05",
        "C06",
        "C07",
        "C08",
        "C09",
        "C10",
        "P01",
        "P02",
        "P03",
        "P04",
        "P05",
        "P06",
        "P07",
        "P08",
        "P09",
        "P10"
    ];

    uint8 private constant NUM_OF_ROOMS = 20;
    uint8 private constant OPEN_AT = 8;
    uint8 private constant CLOSE_AT = 18;
    uint8 private constant HOURS_DAILY = CLOSE_AT - OPEN_AT;

    bool[HOURS_DAILY][NUM_OF_ROOMS] public slots;
    mapping(string => bool) isValidRoom;
    mapping(string => uint8) roomToSlotsRow;

    struct Ticket {
        uint256 id;
        string title;
        string room;
        uint8 from;
        uint8 duration;
        bool isActive;
    }
    // Ticket[] public tickets;
    // mapping(address => uint256[]) userToTicketIds;
    mapping(address => Ticket[]) userToTickets;

    event Updated();

    constructor() {
        // initialise slots - true: available, fale: filled
        for (uint8 row = 0; row < NUM_OF_ROOMS; row++) {
            for (uint8 col = 0; col < HOURS_DAILY; col++) {
                slots[row][col] = true;
            }
            isValidRoom[rooms[row]] = true;
            roomToSlotsRow[rooms[row]] = row;
        }
    }

    function getSlots()
        external
        view
        returns (bool[HOURS_DAILY][NUM_OF_ROOMS] memory)
    {
        return slots;
    }

    modifier validRoom(string memory room) {
        require(isValidRoom[room], "Room not found");
        _;
    }

    modifier validTime(uint8 from, uint8 duration) {
        require(OPEN_AT <= from && from <= CLOSE_AT, "Invalid time");
        require(duration <= HOURS_DAILY, "Duration too long");
        require(from + duration <= CLOSE_AT, "Ending too late");
        _;
    }

    function bookRoom(
        string memory title,
        string memory room,
        uint8 from,
        uint8 duration
    ) external validRoom(room) validTime(from, duration) returns (uint256) {
        uint8 row = roomToSlotsRow[room];
        uint8 fromCol = from - OPEN_AT;
        uint8 toCol = fromCol + duration;

        // make sure if there's no event conflict
        for (uint8 col = fromCol; col < toCol; col++) {
            require(slots[row][col], "Booking conflicts");
        }

        // update slots availability
        for (uint8 col = fromCol; col < toCol; col++) {
            slots[row][col] = false;
        }

        // create a new ticket
        uint256 id = userToTickets[msg.sender].length;
        userToTickets[msg.sender].push(
            Ticket(id, title, room, from, duration, true)
        );

        // emit event
        emit Updated();
    }

    function getTickets() external view returns (Ticket[] memory) {
        return userToTickets[msg.sender];
    }

    function deleteTicket(uint256 id) external {
        require(userToTickets[msg.sender][id].isActive, "Ticket not found");
        userToTickets[msg.sender][id].isActive = false;
        emit Updated();
    }
}
