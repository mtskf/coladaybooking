// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title ColaDayBooking
 * @dev A contract for booking rooms on Cola Day.
 * with ETH
 */
contract ColaDayBooking is Ownable {
    using SafeMath for uint8;

    string[] private ROOMS = [
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
    uint8 private constant MAX_DURATION = 4;
    uint8 private constant HOURS_DAILY = CLOSE_AT - OPEN_AT;

    // slots table
    // row: room index, col: time index => true: available or fale: filled
    bool[HOURS_DAILY][NUM_OF_ROOMS] public slots;

    // mapping of rooms, if invalid room name, returns false
    mapping(string => bool) isValidRoom;

    // mapping of room index; room name => room index
    mapping(string => uint8) roomToSlotsRow;

    // booking tichet
    struct Ticket {
        uint256 id;
        string title;
        string room;
        uint8 from;
        uint8 duration;
        bool isEncrypted;
        bool isActive;
    }

    // mapping of each users' booking tickets
    mapping(address => Ticket[]) userToTickets;

    // event - triggered when new ticket created or ticket removed
    event Updated();

    /**
     * @dev Constructor - initialise slots
     */
    constructor() {
        for (uint8 row = 0; row < NUM_OF_ROOMS; row++) {
            for (uint8 col = 0; col < HOURS_DAILY; col++) {
                slots[row][col] = true;
            }
            isValidRoom[ROOMS[row]] = true;
            roomToSlotsRow[ROOMS[row]] = row;
        }
    }

    /**
     * @dev Get slots table
     * @return bool[][] If the slots are available or not
     */
    function getSlots()
        external
        view
        returns (bool[HOURS_DAILY][NUM_OF_ROOMS] memory)
    {
        return slots;
    }

    /**
     * @dev Checks if the room name is valid
     * @param _roomName The room name to check
     */
    modifier validRoom(string memory _roomName) {
        require(isValidRoom[_roomName], "Room not found");
        _;
    }

    /**
     * @dev Checks if time range (from & duration) is valid
     * @param _from Time the event starts at
     * @param _duration Duration of event
     */
    modifier validTime(uint8 _from, uint8 _duration) {
        require(OPEN_AT <= _from && _from <= CLOSE_AT, "Invalid time");
        require(_duration <= MAX_DURATION, "Duration too long");
        require(_from + _duration <= CLOSE_AT, "Ending too late");
        _;
    }

    /**
     * @dev Save booking ticket
     * @param _title The event title
     * @param _roomName Room name
     * @param _from Time the event starts at
     * @param _duration Duration of event
     * @param _isEncrypted If the ticket title is encrypted with user's public key
     */
    function book(
        string memory _title,
        string memory _roomName,
        uint8 _from,
        uint8 _duration,
        bool _isEncrypted
    ) external validRoom(_roomName) validTime(_from, _duration) {
        uint8 row = roomToSlotsRow[_roomName];
        uint8 fromCol = _from - OPEN_AT;
        uint8 toCol = fromCol + _duration;

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
            Ticket(id, _title, _roomName, _from, _duration, _isEncrypted, true)
        );

        // emit event
        emit Updated();
    }

    /**
     * @dev Get all user's tickets
     * @return Ticket[] array of tickets
     */
    function getTickets() external view returns (Ticket[] memory) {
        return userToTickets[msg.sender];
    }

    /**
     * @dev Deactivate a ticket by id - only the ticket owner can deactivate
     * @param _id The ticket id to remove
     */
    function removeTicket(uint256 _id) external {
        // if the user doesn't own a ticket with the id, return error
        require(userToTickets[msg.sender][_id].isActive, "Ticket not found");

        // deactivate the ticket
        userToTickets[msg.sender][_id].isActive = false;

        // update slots availability
        uint8 row = roomToSlotsRow[userToTickets[msg.sender][_id].room];
        uint8 fromCol = userToTickets[msg.sender][_id].from - OPEN_AT;
        uint8 toCol = fromCol + userToTickets[msg.sender][_id].duration;
        for (uint8 col = fromCol; col < toCol; col++) {
            slots[row][col] = true;
        }

        // emit event
        emit Updated();
    }
}
