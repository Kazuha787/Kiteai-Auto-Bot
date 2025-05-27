const chalk = require("chalk");

function logMessage(
  currentNum = null,
  total = null,
  message = "",
  messageType = "info"
) {
  const now = new Date();
  const timestamp = now
    .toLocaleString("id-ID", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
    .replace(/\./g, ":")
    .replace(/, /g, " ");
  const accountStatus = currentNum && total ? `[${currentNum}/${total}] ` : "";

  let logText;
  switch (messageType) {
    case "success":
      logText = chalk.green(`[✓] ${message}`);
      break;
    case "error":
      logText = chalk.red(`[-] ${message}`);
      break;
    case "process":
      logText = chalk.yellow(`[!] ${message}`);
      break;
    case "debug":
      logText = chalk.blue(`[~] ${message}`);
      break;
    default:
      logText = chalk.white(`[?] ${message}`);
  }

  console.log(
    `${chalk.white("[")}${chalk.dim(timestamp)}${chalk.white(
      "]"
    )} ${accountStatus}${logText}`
  );
}

module.exports = {
  logMessage,
};
