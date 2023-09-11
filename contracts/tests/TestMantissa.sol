// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.18;

/// @title TestMantissa
/// @dev A contract demonstrating the parsing of a number using exponent and mantissa values from calldata.
/// The contract includes assembly code to extract and interpret the components of the number.
contract TestMantissa {
    constructor() {}

    /// @dev Event to log the parsed number and the number of parsed bytes.
    /// @param amount The parsed uint256 value from calldata.
    /// @param parsedBytes The number of bytes needed for the exponent and mantissa.
    event ParsedData(uint256 amount, uint256 parsedBytes);

    /// @dev Get the number using the exponent and mantissa values from msg.data starting from a specific byte
    /// The data for mantissa and exponent has the following format: 1/2 bytes for type, 1/2 bytes for exponent
    /// and 3/5/7 bytes for mantissa, depending on the type
    /// @param startByte The starting byte
    /// @return value Parsed uint256 value from calldata
    /// @return parsedBytes The number of bytes needed for the exponent and mantissa
    function parseNumberMantissaFromCallData(
        uint256 startByte
    ) private pure returns (uint256 value, uint8 parsedBytes) {
        uint256 val;

        assembly {
            val := calldataload(startByte)
        }

        uint8 mantissaType = uint8(val >> (256 - 2));
        uint256 exponent = (val >> (256 - 8)) - (mantissaType << 6);

        val = (val << 8); // get rid of the type and exponent

        // The mapping from mantissa types (0,1 and 2) to bytes can be interpreted as 3 + 2 * type
        value = (val >> (232 - (mantissaType << 4))) * (10 ** exponent);
        parsedBytes = (mantissaType << 1) + 4;
    }

    /// @dev Fallback function that demonstrates the parsing of a number using the provided logic.
    /// The parsed number and the number of parsed bytes are emitted as an event.
    fallback() external {
        (uint256 amount, uint256 parsedBytes) = parseNumberMantissaFromCallData(0);
        emit ParsedData(amount, parsedBytes);
    }
}

/// @title TestMantissaNoLogic
/// @dev A contract with minimal logic to demonstrate event emission without actual parsing.
/// This contract serves as a comparison point to the TestMantissa contract.
contract TestMantissaNoLogic {
    /// @dev Event to log a placeholder amount and parsed bytes.
    /// @param amount Placeholder uint256 value.
    /// @param parsedBytes Placeholder parsed bytes value.
    event ParsedData(uint256 amount, uint256 parsedBytes);

    /// @dev Minimal logic function that returns placeholder values.
    /// @return Placeholder values (0, 0).
    function parseNumberMantissaFromCallData(uint256) private pure returns (uint256, uint256) {
        return (0, 0);
    }

    /// @dev Fallback function that demonstrates event emission without actual parsing logic.
    fallback() external {
        (uint256 amount, uint256 parsedBytes) = parseNumberMantissaFromCallData(0);
        emit ParsedData(amount, parsedBytes);
    }
}
