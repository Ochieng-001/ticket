// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TicketManagement {
    address public owner;
    uint256 public eventCounter;
    uint256 public ticketCounter;

    enum TicketType { REGULAR, VIP, VVIP }

    struct Event {
        uint256 eventId;
        string name;
        string venue;
        uint256 eventDate;
        uint256[3] prices; // [regular, vip, vvip]
        uint256[3] supply; // [regular, vip, vvip]
        uint256[3] sold;   // [regular, vip, vvip]
        bool isActive;
        address creator;
    }

    struct Ticket {
        uint256 ticketId;
        uint256 eventId;
        address owner;
        TicketType ticketType;
        uint256 purchasePrice;
        uint256 purchaseTime;
        bool isUsed;
    }

    // Mappings
    mapping(uint256 => Event) public events;
    mapping(uint256 => Ticket) public tickets;
    mapping(address => bool) public admins;
    mapping(address => uint256[]) public userTickets;
    mapping(uint256 => uint256[]) public eventTickets;
    mapping(uint256 => string) public ticketSeats;
    mapping(uint256 => string) public eventDescriptions;

    // Events
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);
    event EventCreated(uint256 indexed eventId, string name);
    event EventDeleted(uint256 indexed eventId);
    event TicketPurchased(uint256 indexed ticketId, uint256 indexed eventId, address indexed buyer);
    event TicketUsed(uint256 indexed ticketId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyAdmin() {
        require(admins[msg.sender] || msg.sender == owner, "Only admin");
        _;
    }

    modifier validEvent(uint256 _eventId) {
        require(_eventId > 0 && _eventId <= eventCounter, "Invalid event");
        _;
    }

    modifier validTicket(uint256 _ticketId) {
        require(_ticketId > 0 && _ticketId <= ticketCounter, "Invalid ticket");
        _;
    }

    constructor() {
        owner = msg.sender;
        admins[msg.sender] = true;
    }

    function addAdmin(address _admin) external onlyOwner {
        require(_admin != address(0), "Invalid address");
        admins[_admin] = true;
        emit AdminAdded(_admin);
    }

    function removeAdmin(address _admin) external onlyOwner {
        require(_admin != owner, "Cannot remove owner");
        admins[_admin] = false;
        emit AdminRemoved(_admin);
    }

    function createEvent(
        string memory _name,
        string memory _description,
        string memory _venue,
        uint256 _eventDate,
        uint256[3] memory _prices,
        uint256[3] memory _supply
    ) external onlyAdmin {
        require(bytes(_name).length > 0, "Empty name");
        require(_eventDate > block.timestamp, "Past date");

        eventCounter++;

        events[eventCounter] = Event({
            eventId: eventCounter,
            name: _name,
            venue: _venue,
            eventDate: _eventDate,
            prices: _prices,
            supply: _supply,
            sold: [uint256(0), uint256(0), uint256(0)],
            isActive: true,
            creator: msg.sender
        });

        eventDescriptions[eventCounter] = _description;
        emit EventCreated(eventCounter, _name);
    }

    function purchaseTicket(
        uint256 _eventId,
        TicketType _ticketType,
        string memory _seat
    ) external payable validEvent(_eventId) {
        Event storage evt = events[_eventId];
        require(evt.isActive, "Event inactive");
        require(evt.eventDate > block.timestamp, "Event passed");

        uint256 typeIndex = uint256(_ticketType);
        require(evt.sold[typeIndex] < evt.supply[typeIndex], "Sold out");

        uint256 price = evt.prices[typeIndex];
        require(msg.value >= price, "Insufficient payment");

        evt.sold[typeIndex]++;
        ticketCounter++;

        tickets[ticketCounter] = Ticket({
            ticketId: ticketCounter,
            eventId: _eventId,
            owner: msg.sender,
            ticketType: _ticketType,
            purchasePrice: price,
            purchaseTime: block.timestamp,
            isUsed: false
        });

        ticketSeats[ticketCounter] = _seat;
        userTickets[msg.sender].push(ticketCounter);
        eventTickets[_eventId].push(ticketCounter);

        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }

        emit TicketPurchased(ticketCounter, _eventId, msg.sender);
    }

    function verifyTicket(uint256 _ticketId) external view validTicket(_ticketId)
        returns (bool isValid, bool isUsed, string memory eventName, uint256 eventDate) {
        Ticket storage ticket = tickets[_ticketId];
        Event storage evt = events[ticket.eventId];

        isValid = ticket.owner != address(0) && evt.isActive;
        isUsed = ticket.isUsed;
        eventName = evt.name;
        eventDate = evt.eventDate;
    }

    function useTicket(uint256 _ticketId) external onlyAdmin validTicket(_ticketId) {
        require(!tickets[_ticketId].isUsed, "Already used");
        tickets[_ticketId].isUsed = true;
        emit TicketUsed(_ticketId);
    }

    function getEventDetails(uint256 _eventId) external view validEvent(_eventId)
        returns (
            string memory name,
            string memory venue,
            uint256 eventDate,
            uint256[3] memory prices,
            bool isActive
        ) {
        Event storage evt = events[_eventId];
        return (evt.name, evt.venue, evt.eventDate, evt.prices, evt.isActive);
    }

    function getEventSupply(uint256 _eventId) external view validEvent(_eventId)
        returns (uint256[3] memory supply, uint256[3] memory sold) {
        Event storage evt = events[_eventId];
        return (evt.supply, evt.sold);
    }

    function updateEventDetails(
        uint256 _eventId,
        string memory _name,
        string memory _description,
        string memory _venue,
        uint256 _eventDate,
        uint256[3] memory _prices,
        uint256[3] memory _supply
    ) external onlyAdmin validEvent(_eventId) {
        require(bytes(_name).length > 0, "Empty name");
        require(_eventDate > block.timestamp, "Past date");

        Event storage evt = events[_eventId];
        evt.name = _name;
        evt.venue = _venue;
        evt.eventDate = _eventDate;
        evt.prices = _prices;
        evt.supply = _supply;
        eventDescriptions[_eventId] = _description;

        emit EventCreated(_eventId, _name);
    }

    function deleteEvent(uint256 _eventId) external onlyAdmin validEvent(_eventId) {
        Event storage evt = events[_eventId];
        require(evt.isActive, "Event is not active");

        // Mark the event as inactive
        evt.isActive = false;

        // Optionally, you can also clear other event details
        // evt.name = "";
        // evt.venue = "";
        // evt.eventDate = 0;
        // evt.prices = [0, 0, 0];
        // evt.supply = [0, 0, 0];
        // evt.sold = [0, 0, 0];
        // delete eventDescriptions[_eventId];

        // Emit an event to indicate that the event has been deleted
        emit EventDeleted(_eventId);
    }

    function getTicketDetails(uint256 _ticketId) external view validTicket(_ticketId)
        returns (
            uint256 eventId,
            address ticketOwner,
            TicketType ticketType,
            uint256 purchasePrice,
            bool isUsed,
            string memory seat
        ) {
        Ticket storage ticket = tickets[_ticketId];
        return (
            ticket.eventId,
            ticket.owner,
            ticket.ticketType,
            ticket.purchasePrice,
            ticket.isUsed,
            ticketSeats[_ticketId]
        );
    }

    function getUserTickets(address _user) external view returns (uint256[] memory) {
        return userTickets[_user];
    }

    function getEventTickets(uint256 _eventId) external view returns (uint256[] memory) {
        return eventTickets[_eventId];
    }

    function getAvailableTickets(uint256 _eventId) external view validEvent(_eventId)
        returns (uint256[3] memory available) {
        Event storage evt = events[_eventId];
        for (uint i = 0; i < 3; i++) {
            available[i] = evt.supply[i] - evt.sold[i];
        }
    }

    function deactivateEvent(uint256 _eventId) external onlyAdmin validEvent(_eventId) {
        events[_eventId].isActive = false;
    }

    function withdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid address");
        owner = _newOwner;
        admins[_newOwner] = true;
    }
}