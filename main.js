const { exec } = require("child_process");

const axios = require("axios");
const execOptions = { windowsHide: true };

// Function to retrieve the IP address
function getIpAddress() {
  return new Promise((resolve, reject) => {
    exec(
      'start /B netsh interface ip show address "Ethernet" | findstr "IP Address"',
      execOptions,
      (error, stdout) => {
        const ipPattern = /\d+\.\d+\.\d+\.\d+/;
        const match = stdout.match(ipPattern);
        if (!error && match) {
          const ipAddress = match[0];
          IP = ipAddress;
          resolve(ipAddress);
        } else {
          console.error("No IP found here.");
          reject(error);
        }
      }
    );
  });
}

// Function to check if Docker is running
function checkDocker() {
  return new Promise((resolve, reject) => {
    exec(
      `start /B tasklist /FI "IMAGENAME eq Docker Desktop.exe"`,
      execOptions,
      (error, stdout) => {
        if (!error && stdout.includes("Docker")) {
          resolve({ success: true, isRunning: true });
        } else {
          console.error("Docker is not running on Windows.");
          reject(error);
        }
      }
    );
  });
}

// Function to check if Ports are running
function checkPorts(port) {
  return new Promise((resolve, reject) => {
    exec(
      `start /B netstat -a -n -o | find "${port}"`,
      execOptions,
      (error, stdout) => {
        if (!error && stdout.includes(`${port}`)) {
          resolve({ success: true, portRunning: true });
        } else {
          console.log(`Port ${port} isn't running`);
          reject(error);
        }
      }
    );
  });
}

// Function to check if GPU utilization is > 40%
function checkGPU() {
  return new Promise((resolve, reject) => {
    exec(
      `start /B nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits`,
      execOptions,
      (error, stdout) => {
        if (!error && stdout) {
          const gpuUsage = parseFloat(stdout.trim());
          if (gpuUsage > 40) {
            resolve({
              success: true,
              result: gpuUsage,
              message: "GPU usage is more than 40%",
            });
          } else {
            resolve({
              success: false,
              result: gpuUsage,
              message: "GPU usage is not more than 40%",
            });
          }
        } else {
          console.log("no GPU");
          reject("No GPU Data");
        }
      }
    );
  });
}

// Function to send the IP address as a POST request
async function sendIpAddress(ipAddress) {
  const ipObj = { ip: ipAddress };
  console.log(ipObj);

  try {
    const response = await axios.post(
      "https://api.metadome.ai/heartbeat-dev/on-prem",
      JSON.stringify(ipObj),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 201) {
      console.log("Ping request sent successfully to on-prem");

      return response.data;
    } else {
      console.error("Failed to send ping request:", response.statusText);
      exec("cmd /c echo There was an error sending ping");
    }
  } catch (error) {
    console.error("Error sending ping request:", error.message);
    exec("cmd /c echo There was an error sending ping");
  }
}

// Main function to retrieve IP and check conditions
async function main() {
  try {
    const ipAddress = await getIpAddress();
    if (ipAddress) {
      const dockerResult = await checkDocker();
      if (dockerResult) {
        const portCheckResult1 = await checkPorts(8081);
        const portCheckResult2 = await checkPorts(8082);

        if (portCheckResult1.success && portCheckResult2.success) {

          const gpuResult = await checkGPU();
          if (gpuResult.success) {
            const onPremPing = await sendIpAddress(ipAddress);
          
          } else {
            console.log("GPU is not working fine", gpuResult);
          }
        } else {
          console.log("Port 8081 or 8082 is not running");
        }
      } else {
        console.log("Docker is not running");
      }
    }
  } catch (error) {
    console.error("Error checking app status:", error.message);
  }
}

let IP;
setTimeout(async () => {
  IP = await getIpAddress();
  console.log(IP, "nicenice");
  await sendIpAddress(IP);
}, 3000);

// Execute the main function
setInterval(() => {
  main();
}, 5 * 1000);

setTimeout(() => {});
