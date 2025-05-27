const { getProxyAgent } = require("./proxy");
const UserAgent = require("user-agents");
const axios = require("axios");
const chalk = require("chalk");
const { generateAuthToken } = require("../utils/generator");

const AGENTS = {
  AGENT1: {
    id: "deployment_KiMLvUiTydioiHm7PWZ12zJU",
    name: "Professor",
    prompts: ["What is proof of AI", "what is KiteAI"],
  },
  AGENT2: {
    id: "deployment_ByVHjMD6eDb9AdekRIbyuz14",
    name: "Crypto Buddy",
    prompts: ["Top Movers Today", "Price of bitcoin"],
  },
  AGENT3: {
    id: "deployment_OX7sn2D0WvxGUGK8CTqsU5VJ",
    name: "Sherlock",
    prompts: [
      "What do you think of this transaction? 0x252c02bded9a24426219248c9c1b065b752d3cf8bedf4902ed62245ab950895b",
    ],
  },
};

module.exports = class gokiteV2Bot {
  constructor(account, useProxy, currentNum, total) {
    this.currentNum = currentNum;
    this.total = total;
    this.token = null;
    this.useProxy = useProxy;
    this.proxy = null;
    this.address = account;
    this.axios = axios.create({
      httpsAgent: useProxy ? getProxyAgent() : undefined,
      timeout: 120000,
      headers: {
        "User-Agent": new UserAgent().toString(),
        Origin: "https://testnet.gokite.ai",
        Referer: "https://testnet.gokite.ai/",
      },
    });
  }

  async makeRequest(method, url, config = {}, retries = 3) {
    console.log(
      chalk.yellow(
        `[!] Account ${this.currentNum}/${this.total}: Making request to ${url}...`
      )
    );
    for (let i = 0; i < retries; i++) {
      try {
        const response = await this.axios({ method, url, ...config });
        console.log(
          chalk.green(
            `✔ [SUCCESS] Account ${this.currentNum}/${this.total}: Request to ${url} succeeded`
          )
        );
        return response;
      } catch (error) {
        if (error.response && error.response.status === 401) {
          console.log(
            chalk.yellow(
              `[!] Account ${this.currentNum}/${this.total}: Unauthorized (401), trying to re-login...`
            )
          );
          this.token = await this.loginUser();
          console.log(
            chalk.yellow(
              `[!] Account ${this.currentNum}/${this.total}: Retrying request after re-login...`
            )
          );
          continue;
        }
        const errorData = error.response ? error.response.data : error.message;
        console.log(
          chalk.red(
            `✖ [ERROR] Account ${this.currentNum}/${this.total}: Request failed: ${error.message}`
          )
        );
        console.log(
          chalk.red(
            `✖ [ERROR] Account ${this.currentNum}/${this.total}: Error response data: ${JSON.stringify(
              errorData,
              null,
              2
            )}`
          )
        );
        console.log(
          chalk.yellow(
            `[!] Account ${this.currentNum}/${this.total}: Retrying... (${i + 1}/${retries})`
          )
        );
        await new Promise((resolve) => setTimeout(resolve, 12000));
      }
    }
    console.log(
      chalk.red(
        `✖ [ERROR] Account ${this.currentNum}/${this.total}: Request failed after ${retries} retries`
      )
    );
    return null;
  }

  async loginUser() {
    console.log(
      chalk.yellow(
        `[!] Account ${this.currentNum}/${this.total}: Generating auth token...`
      )
    );
    const authorkey = await generateAuthToken(this.address);
    console.log(
      chalk.green(
        `✔ [SUCCESS] Account ${this.currentNum}/${this.total}: Auth token generated`
      )
    );
    return await this.loginAccount(authorkey);
  }

  async loginAccount(author) {
    console.log(
      chalk.yellow(
        `[!] Account ${this.currentNum}/${this.total}: Logging in...`
      )
    );
    const headers = {
      authorization: author,
      "Content-Type": "application/json",
    };

    const payload = {
      eoa: this.address,
    };

    try {
      const response = await this.makeRequest(
        "POST",
        "https://neo.prod.gokite.ai/v2/signin",
        {
          data: payload,
          headers: headers,
        }
      );
      if (response?.data.error === "") {
        console.log(
          chalk.green(
            `✔ [SUCCESS] Account ${this.currentNum}/${this.total}: Login successful`
          )
        );
        this.token = response.data.data.access_token;
        return response.data.data.access_token;
      }
      console.log(
        chalk.red(
          `✖ [ERROR] Account ${this.currentNum}/${this.total}: Login failed`
        )
      );
      return null;
    } catch (error) {
      console.log(
        chalk.red(
          `✖ [ERROR] Account ${this.currentNum}/${this.total}: Login failed: ${error.message}`
        )
      );
      return null;
    }
  }

  async chatWithAgent(serviceId, message, agentName) {
    console.log(
      chalk.yellow(
        `[!] Account ${this.currentNum}/${this.total}: Chatting with ${agentName}...`
      )
    );
    try {
      const headers = {
        authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      };

      const payload = {
        service_id: serviceId,
        subnet: "kite_ai_labs",
        stream: true,
        body: {
          stream: true,
          message: message,
        },
      };

      const response = await this.makeRequest(
        "POST",
        "https://ozone-point-system.prod.gokite.ai/agent/inference",
        {
          data: payload,
          headers: headers,
          responseType: "stream",
        }
      );

      if (!response || !response.data) {
        console.log(
          chalk.red(
            `✖ [ERROR] Account ${this.currentNum}/${this.total}: Failed to get response from ${agentName}`
          )
        );
        return null;
      }

      return new Promise((resolve) => {
        let result = "";
        response.data.on("data", (chunk) => {
          const lines = chunk
            .toString()
            .split("\n")
            .filter((line) => line.trim());
          for (const line of lines) {
            try {
              if (line.startsWith("data: ")) {
                const jsonStr = line.slice(6);
                if (jsonStr === "[DONE]") continue;

                const data = JSON.parse(jsonStr);
                if (data.choices && data.choices[0].delta.content) {
                  result += data.choices[0].delta.content;
                }
              }
            } catch (e) {
              console.log(
                chalk.red(
                  `✖ [ERROR] Account ${this.currentNum}/${this.total}: Error parsing response: ${e.message}`
                )
              );
            }
          }
        });
        response.data.on("end", () => {
          const trimmedResult = result.trim();
          const preview =
            trimmedResult.length > 50
              ? trimmedResult.substring(0, 50) + "..."
              : trimmedResult;

          console.log(
            chalk.green(
              `✔ [SUCCESS] Account ${this.currentNum}/${this.total}: ${agentName} responded: "${preview}"`
            )
          );
          resolve(trimmedResult);
        });
      });
    } catch (error) {
      console.log(
        chalk.red(
          `✖ [ERROR] Account ${this.currentNum}/${this.total}: Chat failed: ${error.message}`
        )
      );
      return null;
    }
  }

  async submitReceipt(serviceId, inputMessage, outputMessage, agentName) {
    console.log(
      chalk.yellow(
        `[!] Account ${this.currentNum}/${this.total}: Submitting receipt for ${agentName}...`
      )
    );
    try {
      const headers = {
        authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      };

      const payload = {
        address: this.address,
        service_id: serviceId,
        input: [
          {
            type: "text/plain",
            value: inputMessage,
          },
        ],
        output: [
          {
            type: "text/plain",
            value: outputMessage,
          },
        ],
      };

      const response = await this.makeRequest(
        "POST",
        "https://neo.prod.gokite.ai/v2/submit_receipt",
        {
          data: payload,
          headers: headers,
        }
      );
      if (response?.data.error === "") {
        console.log(
          chalk.green(
            `✔ [SUCCESS] Account ${this.currentNum}/${this.total}: Successfully submitted receipt for ${agentName}`
          )
        );
        return true;
      } else {
        console.log(
          chalk.red(
            `✖ [ERROR] Account ${this.currentNum}/${this.total}: Failed to submit receipt for ${agentName}: ${
              response?.data.error || "Unknown error"
            }`
          )
        );
        return false;
      }
    } catch (error) {
      console.log(
        chalk.red(
          `✖ [ERROR] Account ${this.currentNum}/${this.total}: Submit receipt failed: ${error.message}`
        )
      );
      return false;
    }
  }

  async chatRepeat() {
    console.log(
      chalk.yellow(
        `[!] Account ${this.currentNum}/${this.total}: Starting chat session...`
      )
    );
    try {
      let successCount = 0;
      for (const agent of Object.values(AGENTS)) {
        console.log(
          chalk.yellow(
            `[!] Account ${this.currentNum}/${this.total}: Starting conversation with ${agent.name}...`
          )
        );
        for (const prompt of agent.prompts) {
          await new Promise((resolve) => setTimeout(resolve, 2000));

          console.log(
            chalk.blue(
              `[INFO] Account ${this.currentNum}/${this.total}: Prompt: "${prompt}"`
            )
          );

          const response = await this.chatWithAgent(
            agent.id,
            prompt,
            agent.name
          );
          if (!response) continue;

          const success = await this.submitReceipt(
            agent.id,
            prompt,
            response,
            agent.name
          );
          if (success) successCount++;
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }

        console.log(
          chalk.green(
            `✔ [SUCCESS] Account ${this.currentNum}/${this.total}: Completed conversation with ${agent.name}`
          )
        );
      }

      console.log(
        chalk.green(
          `✔ [SUCCESS] Account ${this.currentNum}/${this.total}: Chat session completed with ${successCount} successful interactions`
        )
      );
      return successCount > 0;
    } catch (error) {
      console.log(
        chalk.red(
          `✖ [ERROR] Account ${this.currentNum}/${this.total}: Chat repeat failed: ${error.message}`
        )
      );
      return false;
    }
  }

  async getTotalPoints() {
    console.log(
      chalk.yellow(
        `[!] Account ${this.currentNum}/${this.total}: Getting user data...`
      )
    );
    const headers = {
      authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
    };

    try {
      const response = await this.makeRequest(
        "GET",
        "https://ozone-point-system.prod.gokite.ai/me",
        {
          headers: headers,
        }
      );

      if (response?.data.error === "") {
        console.log(
          chalk.green(
            `✔ [SUCCESS] Account ${this.currentNum}/${this.total}: Get user data successful`
          )
        );
        return response.data.data.profile.total_xp_points;
      } else {
        console.log(
          chalk.red(
            `✖ [ERROR] Account ${this.currentNum}/${this.total}: Failed to get user data: ${response.data.error}`
          )
        );
        return null;
      }
    } catch (error) {
      console.log(
        chalk.red(
          `✖ [ERROR] Account ${this.currentNum}/${this.total}: Failed to get user data: ${error.message}`
        )
      );
      return null;
    }
  }

  async processKeepAlive() {
    console.log(
      chalk.yellow(
        `[!] Account ${this.currentNum}/${this.total}: Processing keep-alive...`
      )
    );
    try {
      if (!this.token) {
        console.log(
          chalk.yellow(
            `[!] Account ${this.currentNum}/${this.total}: No token, attempting login...`
          )
        );
        const authorkey = await generateAuthToken(this.address);
        await this.loginAccount(authorkey);
      }
      const chatRepeat = await this.chatRepeat();
      const pointsXp = await this.getTotalPoints();
      console.log(
        chalk.green(
          `✔ [SUCCESS] Account ${this.currentNum}/${this.total}: Keep-alive processed`
        )
      );
      return {
        points: pointsXp,
        keepAlive: chatRepeat,
      };
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log(
          chalk.yellow(
            `[!] Account ${this.currentNum}/${this.total}: Token expired, attempting to login again...`
          )
        );
        await this.loginUser();
        console.log(
          chalk.yellow(
            `[!] Account ${this.currentNum}/${this.total}: Retrying keep-alive...`
          )
        );
        return this.processKeepAlive();
      }

      console.log(
        chalk.red(
          `✖ [ERROR] Account ${this.currentNum}/${this.total}: Failed to process account: ${error.message}`
        )
      );
      throw error;
    }
  }
};
