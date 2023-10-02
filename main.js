const { exec } = require("child_process");
const axios = require("axios");
// const fetch = require("node-fetch");

// Function to retrieve the IP address
function getIpAddress(callback) {
  exec(
    'netsh interface ip show address "Ethernet" | findstr "IP Address"',
    (error, stdout) => {
      if (error) {
        console.error("Error retrieving IP address:", error);
        callback(null);
      } else {
        console.log(ipAddress);

        const ipAddress = stdout.trim().split(": ")[1];
        callback(ipAddress);
      }
    }
  );
}

// Function to send the IP address as a POST request
async function sendIpAddress(ipAddress) {
  const ipObj = { ip: ipAddress };

  try {
    const response = await axios.post(
      "https://api.metadome.ai/heartbeat-dev/on-prem",
      ipObj,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 200) {
      console.log("Ping request sent successfully to on-prem");
    } else {
      console.error("Failed to send ping request:", response.statusText);
    }
  } catch (error) {
    console.error("Error sending ping request:", error.message);
  }
}

// Main function to retrieve IP and send the POST request
function main() {
  getIpAddress((ipAddress) => {
    if (ipAddress) {
      sendIpAddress(ipAddress);
      console.log("sent");
    } else {
      console.error("No IP address found.");
    }
  });
}

// Execute the main function
main();
