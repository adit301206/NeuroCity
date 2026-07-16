const dns = require("dns");

console.log("Current DNS servers:", dns.getServers());

// Try with default servers
dns.resolveSrv("_mongodb._tcp.cluster0.szer44a.mongodb.net", (err, records) => {
  console.log("Default SRV resolution:", err ? err.message : records);
});

// Try setting DNS servers to Google's
try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
  console.log("Set servers to 8.8.8.8, 8.8.4.4");
  dns.resolveSrv("_mongodb._tcp.cluster0.szer44a.mongodb.net", (err, records) => {
    console.log("8.8.8.8 SRV resolution:", err ? err.message : records);
  });
} catch (e) {
  console.log("Failed to set 8.8.8.8:", e.message);
}

// Try setting DNS servers to Cloudflare's
try {
  dns.setServers(["1.1.1.1", "1.0.0.1"]);
  console.log("Set servers to 1.1.1.1");
  dns.resolveSrv("_mongodb._tcp.cluster0.szer44a.mongodb.net", (err, records) => {
    console.log("1.1.1.1 SRV resolution:", err ? err.message : records);
  });
} catch (e) {
  console.log("Failed to set 1.1.1.1:", e.message);
}

// Try dns.lookup for the main cluster domain
dns.lookup("cluster0.szer44a.mongodb.net", (err, address) => {
  console.log("Lookup cluster domain:", err ? err.message : address);
});
