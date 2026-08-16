// PM2 process manager config: pm2 start ecosystem.config.js
// Backend serves the built frontend in production (single process).
module.exports = {
  apps: [
    {
      name: 'resumecraft',
      script: 'server.js',
      cwd: './backend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      time: true,
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      pid_file: './logs/resumecraft.pid'
    }
  ]
};
