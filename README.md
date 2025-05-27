# Pharos Testnet Bot v3.0

A Node.js-based bot designed to automate interactions with the Pharos Testnet, supporting proxy usage and account management for seamless operation.

---

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [File Structure](#file-structure)
- [Usage](#usage)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)

---

## Overview
The **Pharos Testnet Bot v3.0** is a script that automates the process of interacting with the Pharos Testnet. It supports multiple accounts, optional proxy usage, and provides real-time logging for monitoring. The bot displays a custom ASCII banner and allows users to choose between running with a proxy or a direct connection.

---

## Features
- **Multi-account Support**: Processes multiple accounts listed in `accounts.txt`.
- **Proxy Support**: Optional proxy usage with random proxy selection.
- **Custom Logging**: Color-coded logs for success, errors, and process updates.
- **ASCII Banner**: Displays a stylized banner for better user experience.
- **Automatic Retry**: Runs continuously with a 60-minute interval between processes.
- **User Interaction**: Prompts for proxy usage via an interactive CLI.

---

## Prerequisites
- **Node.js**: Version 14 or higher.
- **npm**: Node package manager for installing dependencies.
- A text editor to manage `accounts.txt` and optional `proxies.txt`.
- Internet connection for testnet interaction.

---

## Installation
1. **Clone the Repository** (or download the project files):
   ```bash
   git clone https://github.com/Kazuha787/Kiteai-Auto-Bot.git
   cd Kiteai-Auto-Bot
   ```
## Install Required Packages:
Ensure the following packages are installed:
`chalk` For colored console output
`inquirer` 
For interactive CLI prompts.fs:
Built-in Node.js module for file handling.
```
npm install
```
chalk inquirerPrepare Configuration Files:
Create an `accounts.txt` file in the project root with one account per line.
(Optional) Create a `proxies.txt` file for proxy support (one proxy per line).

# Usage
Prepare `accounts.txt`
Add each account on a new line in `accounts.txt`Example
```
oxaddress
oxaddeess
```
# Run the Bot
```
node src
```
# Follow Prompts
Choose whether to use a proxy or direct connection when prompted.
The bot will process accounts, display results, and wait 60 minutes before restarting.
Configurationaccounts.txt: Required. Contains the list of accounts to process `proxies.txt`
Optional. Required only if using proxies.Interval
The bot waits 60 minutes between cycles (configurable in `node src` by modifying the setTimeout value).Logging: Logs are displayed in the console with color coding for success, errors, and process updates.ContributingContributions are welcome! To contribute:Fork the repository.Create a feature branch (git checkout -b feature-name).Commit your changes (git commit -m "Add feature").Push to the branch (git push origin feature-name).Open a pull request.Please ensure your code follows the existing style and includes appropriate comments.LicenseThis project is licensed under the MIT License. See the LICENSE file for details.
