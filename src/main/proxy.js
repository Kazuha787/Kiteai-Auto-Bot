const { HttpsProxyAgent } = require("https-proxy-agent");
const { SocksProxyAgent } = require("socks-proxy-agent");
const fs = require("fs");
const axios = require("axios");
const { logMessage } = require("../utils/logger");

let proxyList = [];
let axiosConfig = {};

function getProxyAgent(proxyUrl, index, total, options = {}) {
  try {
    const isSocks = proxyUrl.toLowerCase().startsWith("socks");
    const agentOptions = {
      rejectUnauthorized: false,
      ...options,
    };

    if (isSocks) {
      return new SocksProxyAgent(proxyUrl, agentOptions);
    }

    return new HttpsProxyAgent(
      proxyUrl.startsWith("http") ? proxyUrl : `http://${proxyUrl}`,
      agentOptions
    );
  } catch (error) {
    logMessage(
      index,
      total,
      `Error creating proxy agent: ${error.message}`,
      "error"
    );
    return null;
  }
}

function loadProxies() {
  try {
    const proxyFile = fs.readFileSync("proxy.txt", "utf8");
    proxyList = proxyFile
      .split("\n")
      .filter((line) => line.trim())
      .map((proxy) => {
        proxy = proxy.trim();
        if (!proxy.includes("://")) {
          return `http://${proxy}`;
        }
        return proxy;
      });

    if (proxyList.length === 0) {
      throw new Error("No proxies found in proxy.txt");
    }
    logMessage(
      null,
      null,
      `Loaded ${proxyList.length} proxies from proxy.txt`,
      "success"
    );
    return true;
  } catch (error) {
    logMessage(null, null, `Error loading proxy: ${error.message}`, "error");
    return false;
  }
}

async function checkIP(index, total) {
  try {
    const response = await axios.get(
      "https://api.ipify.org?format=json",
      axiosConfig
    );
    const ip = response.data.ip;
    logMessage(index, total, `IP Using: ${ip}`, "success");
    return { success: true, ip: ip };
  } catch (error) {
    logMessage(index, total, `Failed to get IP: ${error.message}`, "error");
    return false;
  }
}

async function getRandomProxy(index, total) {
  if (proxyList.length === 0) {
    axiosConfig = {};
    await checkIP(index, total);
    return null;
  }

  let proxyAttempt = 0;
  while (proxyAttempt < proxyList.length) {
    const proxy = proxyList[Math.floor(Math.random() * proxyList.length)];
    try {
      const agent = getProxyAgent(proxy, index, total);
      if (!agent) continue;

      axiosConfig.httpsAgent = agent;
      await checkIP(index, total);
      return proxy;
    } catch (error) {
      proxyAttempt++;
    }
  }

  logMessage(index, total, "Using default IP", "warning");
  axiosConfig = {};
  await checkIP(index, total);
  return null;
}

module.exports = {
  getProxyAgent,
  loadProxies,
  getRandomProxy,
};
