// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {VmSafe} from "forge-std/Vm.sol";
import {MockProviderToken} from "../src/MockProviderToken.sol";

/// @title DeployMockProviderToken
/// @notice Deploys the TESTNET MOCK mNVDA on Sepolia (T-034 skeleton, used by T-022).
/// Re-runnable: if deployments/sepolia.json already has "mNVDA.address" with code
/// on chain, it checks the metadata, prints the address and deploys nothing.
///
/// Usage (laptop; reads DEPLOYER_PRIVATE_KEY and SEPOLIA_RPC_URL from the env,
/// see .env.example; no key is ever written to a file):
///   set -a; . ./.env; set +a            # at the repo root
///   cd contracts/sepolia
///   forge script script/DeployMockProviderToken.s.sol --rpc-url "$SEPOLIA_RPC_URL"              # dry run, writes nothing
///   forge script script/DeployMockProviderToken.s.sol --rpc-url "$SEPOLIA_RPC_URL" --broadcast  # deploys, writes JSON
///
/// Writes (only with --broadcast) the "mNVDA" object and "chainId" into
/// deployments/sepolia.json and keeps every other key in that file (T-022 adds
/// "mNVDA.tokenManager" and the token id there; check-supply reads them).
contract DeployMockProviderToken is Script {
    uint256 internal constant SEPOLIA_CHAIN_ID = 11155111;
    string internal constant ADDRESS_KEY = ".mNVDA.address";

    function run() external returns (MockProviderToken token) {
        require(block.chainid == SEPOLIA_CHAIN_ID, "DeployMockProviderToken: Sepolia only (chainid 11155111)");
        string memory path = string.concat(vm.projectRoot(), "/../../deployments/sepolia.json");

        // Re-run: reuse an existing deployment.
        if (vm.exists(path)) {
            string memory existing = vm.readFile(path);
            if (vm.keyExistsJson(existing, ADDRESS_KEY)) {
                address addr = vm.parseJsonAddress(existing, ADDRESS_KEY);
                require(
                    addr.code.length > 0,
                    "DeployMockProviderToken: mNVDA.address in deployments/sepolia.json has no code on this chain; check the RPC or remove the entry on purpose"
                );
                token = MockProviderToken(addr);
                require(
                    keccak256(bytes(token.symbol())) == keccak256("mNVDA") && token.decimals() == 18,
                    "DeployMockProviderToken: contract at mNVDA.address is not the mNVDA mock"
                );
                console.log("mNVDA already deployed, nothing to do:", addr);
                return token;
            }
        }

        uint256 key = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(key);
        console.log("deployer:", deployer);

        vm.startBroadcast(key);
        token = new MockProviderToken(deployer);
        vm.stopBroadcast();

        console.log("mNVDA (Mock NVIDIA (testnet)) deployed at:", address(token));
        console.log("name:", token.name());
        console.log("symbol:", token.symbol());
        console.log("decimals:", uint256(token.decimals()));

        bool broadcasting =
            vm.isContext(VmSafe.ForgeContext.ScriptBroadcast) || vm.isContext(VmSafe.ForgeContext.ScriptResume);
        if (!broadcasting) {
            console.log("dry run: deployments/sepolia.json not written (add --broadcast to deploy)");
            return token;
        }
        _write(path, address(token), deployer);
        console.log("wrote", path);
    }

    function _write(string memory path, address token, address owner) internal {
        string memory obj = "mNVDA";
        vm.serializeAddress(obj, "address", token);
        vm.serializeAddress(obj, "owner", owner);
        vm.serializeString(obj, "name", "Mock NVIDIA (testnet)");
        vm.serializeString(obj, "symbol", "mNVDA");
        vm.serializeUint(obj, "decimals", 18);
        vm.serializeString(
            obj, "note", "testnet mock standing in for a provider token (ADR 0012); not a real stock token"
        );
        string memory mnvda = vm.serializeUint(obj, "deployedAtBlock", block.number);

        if (vm.exists(path)) {
            // Insert or replace only these keys; every other key in the file stays.
            vm.writeJson(vm.toString(block.chainid), path, ".chainId");
            if (vm.keyExistsJson(vm.readFile(path), ".mNVDA")) {
                // Keep fields already under "mNVDA" (for example tokenManager).
                vm.writeJson(string.concat("\"", vm.toString(token), "\""), path, ".mNVDA.address");
                vm.writeJson(string.concat("\"", vm.toString(owner), "\""), path, ".mNVDA.owner");
                vm.writeJson("\"Mock NVIDIA (testnet)\"", path, ".mNVDA.name");
                vm.writeJson("\"mNVDA\"", path, ".mNVDA.symbol");
                vm.writeJson("18", path, ".mNVDA.decimals");
                vm.writeJson(vm.toString(block.number), path, ".mNVDA.deployedAtBlock");
                vm.writeJson(
                    "\"testnet mock standing in for a provider token (ADR 0012); not a real stock token\"",
                    path,
                    ".mNVDA.note"
                );
            } else {
                vm.writeJson(mnvda, path, ".mNVDA");
            }
        } else {
            string memory root = "root";
            vm.serializeUint(root, "chainId", block.chainid);
            vm.writeJson(vm.serializeString(root, "mNVDA", mnvda), path);
        }
    }
}
