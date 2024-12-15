const { Hyperliquid } = require("../dist/index");
const readline = require("readline");

const path = require("path");
const { TurnkeySigner, serializeSignature } = require("@turnkey/ethers");
const { Turnkey: TurnkeyServerSDK } = require("@turnkey/sdk-server");

// Load environment variables from `.env`
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

const turnkeyClient = new TurnkeyServerSDK({
  apiBaseUrl: process.env.TURNKEY_BASE_URL,
  apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY,
  apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY,
  defaultOrganizationId: process.env.TURNKEY_ORGANIZATION_ID,
});

// Initialize a Turnkey Signer
const turnkeySigner = new TurnkeySigner({
  client: turnkeyClient.apiClient(),
  organizationId: process.env.TURNKEY_ORGANIZATION_ID,
  signWith: process.env.TURNKEY_SIGN_WITH,
});

const user_address = process.env.TURNKEY_SIGN_WITH;
const raw_mode = true;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function waitForInput(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, () => {
      resolve();
    });
  });
}

async function testInfoAPI(sdk) {
  console.log("Testing InfoAPI methods:");

  console.log("getAllMids:");
  console.log(await sdk.info.getAllMids(raw_mode));
  await waitForInput("Press Enter to continue...");

  console.log("getUserOpenOrders:");
  console.log(await sdk.info.getUserOpenOrders(user_address, raw_mode));
  await waitForInput("Press Enter to continue...");

  console.log("getFrontendOpenOrders:");
  console.log(await sdk.info.getFrontendOpenOrders(user_address, raw_mode));
  await waitForInput("Press Enter to continue...");

  console.log("getUserFills:");
  console.log(await sdk.info.getUserFills(user_address, raw_mode));
  await waitForInput("Press Enter to continue...");

  console.log("getUserFillsByTime:");
  console.log(
    await sdk.info.getUserFillsByTime(
      user_address,
      Date.now() - 1506400000,
      Date.now(),
      raw_mode,
    ),
  ); // Last 24 hours
  await waitForInput("Press Enter to continue...");

  console.log("getUserRateLimit:");
  console.log(await sdk.info.getUserRateLimit(user_address, raw_mode));
  await waitForInput("Press Enter to continue...");

  console.log("getOrderStatus:");
  console.log(await sdk.info.getOrderStatus(user_address, 1000, raw_mode));
  await waitForInput("Press Enter to continue...");

  console.log("getL2Book:");
  const book = await sdk.info.getL2Book("BTC-PERP", raw_mode);
  console.log(book);
  console.log(book.levels);
  await waitForInput("Press Enter to continue...");

  console.log("getCandleSnapshot:");
  console.log(
    await sdk.info.getCandleSnapshot(
      "BTC-PERP",
      "1h",
      Date.now() - 86400000,
      Date.now(),
      raw_mode,
    ),
  );
  await waitForInput("Press Enter to continue...");
}

async function testSpotInfoAPI(sdk) {
  console.log("\nTesting SpotInfoAPI methods:");

  console.log("getSpotMeta:");
  console.log(await sdk.info.spot.getSpotMeta(raw_mode));
  await waitForInput("Press Enter to continue...");

  console.log("getSpotClearinghouseState:");
  console.log(
    await sdk.info.spot.getSpotClearinghouseState(user_address, raw_mode),
  );
  await waitForInput("Press Enter to continue...");

  console.log("getSpotMetaAndAssetCtxs:");
  console.log(await sdk.info.spot.getSpotMetaAndAssetCtxs(raw_mode));
  await waitForInput("Press Enter to continue...");
}

async function testPerpetualsInfoAPI(sdk) {
  console.log("\nTesting PerpetualsInfoAPI methods:");

  console.log("getMeta:");
  console.log(await sdk.info.perpetuals.getMeta(raw_mode));
  await waitForInput("Press Enter to continue...");

  console.log("getMetaAndAssetCtxs:");
  console.log(await sdk.info.perpetuals.getMetaAndAssetCtxs(raw_mode));
  await waitForInput("Press Enter to continue...");

  console.log("getClearinghouseState:");
  const perpsClearing = await sdk.info.perpetuals.getClearinghouseState(
    user_address,
    raw_mode,
  );
  console.log(perpsClearing);
  console.log(perpsClearing.assetPositions);
  await waitForInput("Press Enter to continue...");

  console.log("getUserFunding:");
  console.log(
    await sdk.info.perpetuals.getUserFunding(
      user_address,
      Date.now() - 86400000,
      Date.now(),
      raw_mode,
    ),
  );
  await waitForInput("Press Enter to continue...");

  console.log("getUserNonFundingLedgerUpdates:");
  console.log(
    await sdk.info.perpetuals.getUserNonFundingLedgerUpdates(
      user_address,
      Date.now() - 86400000,
      Date.now(),
      raw_mode,
    ),
  );
  await waitForInput("Press Enter to continue...");

  console.log("getFundingHistory:");
  console.log(
    await sdk.info.perpetuals.getFundingHistory(
      "BTC-PERP",
      Date.now() - 86400000,
      Date.now(),
      raw_mode,
    ),
  );
  await waitForInput("Press Enter to continue...");
}

async function main() {
  // Initialize the SDK (replace with your actual private key and other necessary parameters)
  const testnet = process.env.MAINNET ? false : true; // false for mainnet, true for testnet
  const walletAddress = process.env.TURNKEY_SIGN_WITH;
  const sdk = new Hyperliquid(testnet, turnkeySigner, walletAddress);

  try {
    await testInfoAPI(sdk);
    await testSpotInfoAPI(sdk);
    await testPerpetualsInfoAPI(sdk);
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    rl.close();
  }
}

main();
