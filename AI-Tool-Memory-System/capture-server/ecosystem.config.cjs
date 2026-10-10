module.exports = {
  apps: [{
    name: "capture-server",
    script: "./src/index.js",
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: "production",
      PORT: 3000
    },
    // Automatic restart on crash
    autorestart: true,
    // Avoid duplicate instances
    instances: 1,
    exec_mode: "fork"
  }]
};
