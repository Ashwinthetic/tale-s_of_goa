const getHealthStatus = (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    service: 'tales-of-goa-backend',
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  getHealthStatus
};
