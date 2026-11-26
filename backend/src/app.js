// backend/src/app.js
'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
const requestContext = require('./middleware/requestContext');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();

app.set('trust proxy', 1);
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
    origin: env.security.corsOrigin.split(',').map((s) => s.trim()),
    credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(requestContext);

if (env.isProd) app.use(morgan('combined'));
else app.use(morgan('dev'));

if (env.security.rateLimitEnabled) {
    app.use(rateLimit({
        windowMs: env.security.rateLimitWindow,
        max: env.security.rateLimitMax,
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
    }));
}

// --- Root route ---
app.get('/', (req, res) => {
    res.json({
        service: 'SSTMOS backend',
        status: 'ok',
        version: '1.0',
        documentation: '/health',
        api: '/api/v1',
    });
});

// --- Health check ---
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'sstmos-backend',
        time: new Date().toISOString(),
        requestId: req.id,
    });
});

// --- API Router ---
const apiRouter = express.Router();

const routeModules = [
    ['/auth',                  './routes/authRoutes'],
    ['/schools',               './routes/schoolRoutes'],
    ['/dashboard',             './routes/dashboardRoutes'],
    ['/school',                './routes/userRoutes'],
    ['/academic',              './routes/academicRoutes'],
    ['/rooms',                 './routes/roomRoutes'],
    ['/trainers',              './routes/trainerRoutes'],
    ['/modules',               './routes/moduleRoutes'],
    ['/class-teachers',        './routes/classTeacherRoutes'],
    ['/timetable-config',      './routes/timetableConfigRoutes'],
    ['/generation',            './routes/generationRoutes'],
    ['/timetable',             './routes/timetableRoutes'],
    ['/reports',               './routes/reportRoutes'],
    ['/notifications',         './routes/notificationRoutes'],
    ['/contact',               './routes/contactRoutes'],
    ['/school-registrations',  './routes/schoolRegistrationRoutes'],

        ['/students',      './routes/studentsRoutes'],
    ['/marks',         './routes/marksRoutes'],
    ['/report-cards',  './routes/reportCardRoutes'],
];

const missingRoutes = [];
const loadedRoutes = [];

for (const [mount, path] of routeModules) {
    try {
        const mod = require(path);
        apiRouter.use(mount, mod);
        loadedRoutes.push(mount);
    } catch (err) {
        if (err.code === 'MODULE_NOT_FOUND' && err.message.includes(path.replace('./', ''))) {
            missingRoutes.push({ mount, path });
        } else {
            logger.error(`Route load failed: ${mount}`, { message: err.message, stack: err.stack });
            missingRoutes.push({ mount, path, reason: err.message });
        }
    }
}

apiRouter.get('/', (req, res) => {
    res.json({
        message: 'SSTMOS API v1',
        routes: loadedRoutes,
        missing: missingRoutes.map((m) => m.mount),
    });
});

app.use('/api/v1', apiRouter);

if (missingRoutes.length > 0) {
    logger.warn('Some route modules are missing — server started without them', {
        missing: missingRoutes.map((m) => m.mount),
    });
}

app.use(notFoundHandler);
app.use(errorHandler);

logger.info('Express app initialized', {
    env: env.nodeEnv,
    mountedRoutes: loadedRoutes.length,
    missingRoutes: missingRoutes.length,
});

module.exports = app;