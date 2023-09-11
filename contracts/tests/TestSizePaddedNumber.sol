// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.18;

/// @title TestSizePaddedNumber
/// @dev A contract demonstrating the parsing of a size-padded number from calldata.
/// The contract implements assembly code to extract and interpret the size-padded number.
contract TestSizePaddedNumber {
    /// @dev Event to log the parsed size-padded number and the number of parsed bytes.
    /// @param value The parsed uint256 value from calldata after removing padding.
    /// @param parsedBytes The number of bytes needed for the parsed size-padded number.
    event ParsedNumber(uint256 value, uint8 parsedBytes);

    /// @dev Parses a size-padded number from calldata starting from a specific byte.
    /// The size-padded number has padding bits, and the number of padding bits is encoded in extraBytes.
    /// The function extracts the actual value by removing the padding and interpreting extraBytes.
    /// @param startByte The starting byte in calldata.
    /// @return value Parsed uint256 value from calldata after removing padding.
    /// @return parsedBytes The number of bytes needed for the parsed size-padded number.
    ///  356 + 16 gas per parsed byte (from calldata cost)
    function parseSizePaddedNumberFromCallData(
        uint256 startByte
    ) private pure returns (uint256 value, uint8 parsedBytes) {
        uint256 val;
        assembly {
            val := calldataload(startByte)
        }

        // split bits which are part of padding
        uint256 extraBytes = (val & ((7) << 253));

        // remove padding from number
        val ^= extraBytes;

        // get actual extraBytes number
        extraBytes >>= 253;

        // parse number, taking into consideration extraBytes
        value = (val) >> (248 - (extraBytes << 3));

        parsedBytes = uint8(++extraBytes);
    }

    /// @dev Fallback function that demonstrates the parsing of a size-padded number using the provided logic.
    /// The parsed size-padded number and the number of parsed bytes are emitted as an event.
    /// A require statement is used to check if parsedBytes is within the valid calldata range.
    fallback() external {
        (uint256 value, uint8 parsedBytes) = parseSizePaddedNumberFromCallData(0);

        // the require is done at the end, to optimize all data decoding
        require(parsedBytes <= msg.data.length, "trying to read past end of calldata");

        emit ParsedNumber(value, parsedBytes);
    }
}

/// @title TestSizePaddedNumberNoLogic
/// @dev A contract with minimal logic to demonstrate event emission without actual parsing.
/// This contract serves as a comparison point to the TestSizePaddedNumber contract.
contract TestSizePaddedNumberNoLogic {
    /// @dev Event to log a placeholder size-padded number and parsed bytes.
    /// @param value Placeholder uint256 value.
    /// @param parsedBytes Placeholder parsed bytes value.
    event ParsedNumber(uint256 value, uint8 parsedBytes);

    /// @dev Minimal logic function that returns placeholder values.
    function parseSizePaddedNumberFromCallData(uint256) private pure returns (uint256 value, uint8 parsedBytes) {
        value = 0;
        parsedBytes = 0;
    }

    /// @dev Fallback function that demonstrates event emission without actual parsing logic.
    fallback() external {
        (uint256 value, uint8 parsedBytes) = parseSizePaddedNumberFromCallData(0);
        emit ParsedNumber(value, parsedBytes);
    }
}
