import { createLogger, format, transports } from 'winston';
import { picrConfig } from './config/picrConfig';

export const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
  ),
  defaultMeta: { service: 'picr' },
  transports: [
    new transports.File({ filename: 'cache/error.log', level: 'error' }),
    new transports.File({ filename: 'cache/info.log' }),
  ],
});

export const addDevLogger = () => {
  // If we're not in production then **ALSO** log to the `console` with colors
  if (picrConfig.dev) {
    logger.add(
      new transports.Console({
        format: format.combine(format.colorize(), format.simple()),
      }),
    );
  }
};

export const log = (level: LevelType, message: string, important?: boolean) => {
  if (important) console.log(message); //basic "server running" type messages
  logger.log(level, message);
};

// no idea where to find this type in winston :/
type LevelType = 'error' | 'warning' | 'info' | 'verbose' | 'debug';
