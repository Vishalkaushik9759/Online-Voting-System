const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/users.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const auditRoutes = require('./modules/audit/audit.routes');
const zoneRoutes = require('./modules/zones/zones.routes');
const supervisorRoutes = require('./modules/supervisor/supervisor.routes');
const voteRoutes = require('./modules/vote/vote.routes');
const { ok } = require('./utils/apiResponse');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('combined'));
app.use(rateLimit({ windowMs: 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false }));

app.get('/health', (req, res) => res.json(ok('MERN backend healthy')));
app.use(authRoutes);
app.use(userRoutes);
app.use(adminRoutes);
app.use(auditRoutes);
app.use(zoneRoutes);
app.use(supervisorRoutes);
app.use(voteRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
