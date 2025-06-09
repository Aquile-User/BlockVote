// contracts/Voting.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Voting {
    struct Election {
        string name;
        string[] candidates;
        mapping(string => uint256) votes;
        mapping(address => bool) hasVoted;
        bool exists;
        uint256 startTime;    // UNIX timestamp when voting opens
        uint256 endTime;      // UNIX timestamp when voting closes
        bool disabled;        // if true, no votes allowed
    }

    mapping(uint256 => Election) private elections;
    uint256 public nextElectionId = 1;
    address public trustedRelayer;

    event ElectionCreated(
        uint256 indexed electionId,
        string name,
        string[] candidates,
        uint256 startTime,
        uint256 endTime
    );
    event ElectionNameUpdated(uint256 indexed electionId, string newName);
    event CandidateAdded(uint256 indexed electionId, string newCandidate);
    event ElectionDisabled(uint256 indexed electionId);
    event ElectionEnabled(uint256 indexed electionId);
    event VotedMeta(
        uint256 indexed electionId,
        address indexed voter,
        string candidate
    );

    constructor(address _relayer) {
        trustedRelayer = _relayer;
    }

    /// @notice Create a new election with name, candidates, start/end UNIX timestamps
    function createElection(
        string memory name,
        string[] memory candidateNames,
        uint256 startTime,
        uint256 endTime
    ) external {
        require(msg.sender == trustedRelayer, "Only relayer can create");
        require(endTime > startTime, "endTime must be > startTime");

        uint256 eid = nextElectionId++;
        Election storage e = elections[eid];
        e.name = name;
        e.exists = true;
        e.startTime = startTime;
        e.endTime = endTime;
        e.disabled = false;

        for (uint256 i = 0; i < candidateNames.length; i++) {
            e.candidates.push(candidateNames[i]);
            e.votes[candidateNames[i]] = 0;
        }

        emit ElectionCreated(eid, name, candidateNames, startTime, endTime);
    }

    /// @notice Change an election’s name
    function updateElectionName(
        uint256 electionId,
        string memory newName
    ) external {
        require(msg.sender == trustedRelayer, "Only relayer can edit");
        require(elections[electionId].exists, "Election does not exist");
        elections[electionId].name = newName;
        emit ElectionNameUpdated(electionId, newName);
    }

    /// @notice Add a new candidate
    function addCandidate(
        uint256 electionId,
        string memory candidate
    ) external {
        require(msg.sender == trustedRelayer, "Only relayer can edit");
        require(elections[electionId].exists, "Election does not exist");
        Election storage e = elections[electionId];
        e.candidates.push(candidate);
        e.votes[candidate] = 0;
        emit CandidateAdded(electionId, candidate);
    }

    /// @notice Disable voting for an election
    function disableElection(uint256 electionId) external {
        require(msg.sender == trustedRelayer, "Only relayer can disable");
        require(elections[electionId].exists, "Election does not exist");
        Election storage e = elections[electionId];
        e.disabled = true;
        emit ElectionDisabled(electionId);
    }

    /// @notice Re-enable voting for an election
    function enableElection(uint256 electionId) external {
        require(msg.sender == trustedRelayer, "Only relayer can enable");
        require(elections[electionId].exists, "Election does not exist");
        Election storage e = elections[electionId];
        e.disabled = false;
        emit ElectionEnabled(electionId);
    }

    /// @notice Meta-transaction entrypoint: relayer calls this with a signed vote
    function voteMeta(
        uint256 electionId,
        string memory candidate,
        address voter,
        bytes memory signature
    ) external {
        require(msg.sender == trustedRelayer, "Only relayer can call voteMeta");
        require(elections[electionId].exists, "Election does not exist");
        Election storage e = elections[electionId];
        require(!e.disabled, "Election is disabled");
        require(block.timestamp >= e.startTime, "Too early to vote");
        require(block.timestamp <= e.endTime, "Voting period has ended");
        require(!e.hasVoted[voter], "Voter has already voted");

        bytes32 message = prefixed(
            keccak256(abi.encodePacked(electionId, candidate, voter, address(this)))
        );
        require(
            recoverSigner(message, signature) == voter,
            "Invalid signature"
        );

        e.hasVoted[voter] = true;
        e.votes[candidate] += 1;
        emit VotedMeta(electionId, voter, candidate);
    }

    /// @notice Returns list of candidates
    function getCandidates(
        uint256 electionId
    ) external view returns (string[] memory) {
        require(elections[electionId].exists, "Election does not exist");
        return elections[electionId].candidates;
    }

    /// @notice Returns a candidate's current vote count
    function getVoteCount(
        uint256 electionId,
        string memory candidate
    ) external view returns (uint256) {
        require(elections[electionId].exists, "Election does not exist");
        return elections[electionId].votes[candidate];
    }

    /// @notice Check if a voter has already voted in an election
    function hasVoted(
        uint256 electionId,
        address voter
    ) external view returns (bool) {
        require(elections[electionId].exists, "Election does not exist");
        return elections[electionId].hasVoted[voter];
    }

    /// @notice Fetch election metadata (name, candidate list, timings, disabled)
    function getElection(
        uint256 electionId
    ) external view returns (
        string memory,
        string[] memory,
        uint256,
        uint256,
        bool
    ) {
        require(elections[electionId].exists, "Election does not exist");
        Election storage e = elections[electionId];
        return (e.name, e.candidates, e.startTime, e.endTime, e.disabled);
    }

    /// @notice Helper: add Ethereum prefix before signature recovery
    function prefixed(bytes32 hash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }

    /// @notice Recovers the signer address from a signed message
    function recoverSigner(bytes32 message, bytes memory sig)
        internal
        pure
        returns (address)
    {
        (uint8 v, bytes32 r, bytes32 s) = splitSignature(sig);
        return ecrecover(message, v, r, s);
    }

    /// @notice Splits a 65-byte signature into v, r, s components
    function splitSignature(bytes memory sig)
        internal
        pure
        returns (uint8, bytes32, bytes32)
    {
        require(sig.length == 65, "Invalid signature length");
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
        return (v, r, s);
    }
}
