const gokiteV2Bot = require("./main/gokiteV2bot");
const chalk = require("chalk");
const { getRandomProxy, loadProxies } = require("./main/proxy");
const fs = require("fs");
const { logMessage } = require("./utils/logger");
const inquirer = require("inquirer");

const asciiBannerLines = [
  "██╗  ██╗██╗████████╗███████╗     █████╗ ██╗    ██╗   ██╗██████╗ ",
  "██║ ██╔╝██║╚══██╔══╝██╔════╝    ██╔══██╗██║    ██║   ██║╚════██╗",
  "█████╔╝ ██║   ██║   █████╗█████╗███████║██║    ██║   ██║ █████╔╝",
  "██╔═██╗ ██║   ██║   ██╔══╝╚════╝██╔══██║██║    ╚██╗ ██╔╝██╔═══╝ ",
  "██║  ██╗██║   ██║   ███████╗    ██║  ██║██║     ╚████╔╝ ███████╗",
  "╚═╝  ╚═╝╚═╝   ╚═╝   ╚══════╝    ╚═╝  ╚═╝╚═╝      ╚═══╝  ╚══════╝",
  "",
  "       KITE AI BOT  v2.0 - Created By Kazuha787       ",
  "                  LETS FUCK THIS TESTNET                   ",
];

// Display banner with custom color and spacing
function displayBanner() {
  console.clear();
  console.log(chalk.hex("#D8BFD8").bold(asciiBannerLines.join("\n")));
  console.log("\n\n"); // Extra spacing after banner
}

async function promptProxyChoice() {
  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "useProxy",
      message: "Do you want to run the bot through a proxy?",
      choices: [
        { name: "Yes (Run with Proxy)", value: true },
        { name: "No (Run with Direct Connection)", value: false },
      ],
    },
  ]);
  return answers.useProxy;
}

async function main() {
  await displayBanner();

  try {
    // Prompt user for proxy choice
    const useProxy = await promptProxyChoice();

    // Load accounts
    const accounts = fs
      .readFileSync("accounts.txt", "utf8")
      .split("\n")
      .map((account) => account.trim())
      .filter(Boolean);

    if (accounts.length === 0) {
      logMessage(null, null, "No accounts found in accounts.txt", "error");
      return;
    }

    const count = accounts.length;
    let proxiesLoaded = true;

    // Load proxies if user chose to use them
    if (useProxy) {
      proxiesLoaded = loadProxies();
      if (!proxiesLoaded) {
        logMessage(
          null,
          null,
          "Failed to load proxies, falling back to default IP",
          "error"
        );
      }
    }

    // Initialize bot instances
    const botInstances = await Promise.all(
      accounts.map(async (account, index) => {
        const currentProxy = useProxy ? await getRandomProxy() : null;
        return new gokiteV2Bot(account, currentProxy, index + 1, count);
      })
    );

    while (true) {
      logMessage(null, null, "Starting new process, please wait...", "process");

      try {
        const results = await Promise.all(
          botInstances.map(async (flow, index) => {
            try {
              console.log(chalk.white("-".repeat(85)));
              const data = await flow.processKeepAlive();
              return {
                points: data.points || 0,
                keepAlive: data.keepAlive || false,
                proxy: flow.proxy || "Direct Connection",
                accountIndex: index + 1,
              };
            } catch (error) {
              logMessage(
                null,
                null,
                `Failed to process account ${index + 1}: ${error.message}`,
                "error"
              );
              return {
                points: 0,
                keepAlive: false,
                proxy: flow.proxy || "Direct Connection",
                accountIndex: index + 1,
              };
            }
          })
        );

        console.log("\n" + "═".repeat(70));
        results.forEach((result) => {
          logMessage(
            null,
            null,
            `Account ${result.accountIndex} - Today XP: ${result.points}`,
            "success"
          );
          const keepAliveStatus = result.keepAlive
            ? chalk.green("✔ Auto Chatting Success")
            : chalk.red("✖ Auto Chatting Failed");
          logMessage(null, null, `Auto Chatting: ${keepAliveStatus}`, "success");
          logMessage(null, null, `Connection: ${result.proxy}`, "success");
          console.log("─".repeat(70));
        });

        logMessage(
          null,
          null,
          "Process completed, waiting for 60 minutes before starting new auto chatting...",
          "success"
        );

        await new Promise((resolve) => setTimeout(resolve, 60 * 60 * 1000)); // 60 minutes
      } catch (error) {
        logMessage(
          null,
          null,
          `Main process failed: ${error.message}`,
          "error"
        );
      }
    }
  } catch (error) {
    logMessage(null, null, `Main process failed: ${error.message}`, "error");
    process.exit(1);
  }
}

main();
