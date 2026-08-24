/**
 * PM2 Ecosystem Config for Carguinée
 *
 * Usage:
 *   pm2 start ecosystem.config.cjs                    # Start default (blue)
 *   pm2 start ecosystem.config.cjs --name carguinee-green  # Start green slot
 *   pm2 restart carguinee-blue --update-env
 */

module.exports = {
  apps: [
    {
      name: "carguinee-blue",
      script: "./backend/dist/server.js",
      cwd: __dirname,
      instances: 2,
      exec_mode: "cluster",
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      env_staging: {
        NODE_ENV: "staging",
        PORT: 3001,
      },
      // Logging
      error_file: "/var/log/carguinee/blue-error.log",
      out_file: "/var/log/carguinee/blue-out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      // Restart policy
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: "10s",
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 10000,
    },
    {
      name: "carguinee-green",
      script: "./backend/dist/server.js",
      cwd: __dirname,
      instances: 2,
      exec_mode: "cluster",
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3002,
      },
      env_staging: {
        NODE_ENV: "staging",
        PORT: 3002,
      },
      error_file: "/var/log/carguinee/green-error.log",
      out_file: "/var/log/carguinee/green-out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: "10s",
      kill_timeout: 5000,
      listen_timeout: 10000,
    },
  ],
};
