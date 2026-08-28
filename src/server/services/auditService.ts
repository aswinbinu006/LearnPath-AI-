import { Request } from 'express';
import { prisma } from './prismaClient.js';
import { logger } from '../utils/logger.js';

export const AuditAction = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  ADMIN_LOGIN: 'ADMIN_LOGIN',
  COURSE_STARTED: 'COURSE_STARTED',
  LESSON_COMPLETED: 'LESSON_COMPLETED',
  COURSE_COMPLETED: 'COURSE_COMPLETED',
  ASSESSMENT_SUBMITTED: 'ASSESSMENT_SUBMITTED',
  AI_CHAT_USED: 'AI_CHAT_USED',
  SETTINGS_UPDATED: 'SETTINGS_UPDATED',
  USER_PATH_RESET: 'USER_PATH_RESET',
  USER_ROLE_UPDATED: 'USER_ROLE_UPDATED',
  TASK_TOGGLED: 'TASK_TOGGLED',
} as const;

export type AuditActionType = typeof AuditAction[keyof typeof AuditAction] | string;

export const AuditCategory = {
  AUTH: 'AUTH',
  LEARNING: 'LEARNING',
  ASSESSMENT: 'ASSESSMENT',
  AI: 'AI',
  SETTINGS: 'SETTINGS',
  ADMIN: 'ADMIN',
  SYSTEM: 'SYSTEM',
} as const;

export type AuditCategoryType = typeof AuditCategory[keyof typeof AuditCategory] | string;

export interface LogAuditParams {
  userId?: string | null;
  action: AuditActionType;
  category?: AuditCategoryType;
  details?: Record<string, any> | string | null;
  req?: Request;
  ipAddress?: string;
  userAgent?: string;
  browser?: string;
  os?: string;
  status?: 'SUCCESS' | 'FAILED' | 'WARNING' | string;
}

export function parseDeviceFromReq(req?: Request) {
  if (!req) {
    return { browser: 'Chrome', os: 'Windows', ipAddress: '127.0.0.1', userAgent: '' };
  }

  const ua = req.headers['user-agent'] || '';
  let browser = 'Chrome';
  let os = 'Windows';

  if (ua.includes('Edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Apple Safari';
  else if (ua.includes('Chrome/')) browser = 'Google Chrome';

  if (ua.includes('Windows NT 10.0')) os = 'Windows 11 / 10';
  else if (ua.includes('Macintosh') || ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  const forwarded = req.headers['x-forwarded-for'];
  const ipAddress = (Array.isArray(forwarded) ? forwarded[0] : (forwarded as string)?.split(',')[0]) ||
    req.socket.remoteAddress ||
    '127.0.0.1';

  return { browser, os, ipAddress, userAgent: ua };
}

export class AuditService {
  /**
   * Records an audit log event into PostgreSQL asynchronously without blocking the caller.
   */
  static async log(params: LogAuditParams): Promise<void> {
    try {
      const device = parseDeviceFromReq(params.req);

      const ipAddress = params.ipAddress || device.ipAddress;
      const userAgent = params.userAgent || device.userAgent;
      const browser = params.browser || device.browser;
      const os = params.os || device.os;

      let serializedDetails: string | null = null;
      if (params.details) {
        if (typeof params.details === 'string') {
          serializedDetails = params.details;
        } else {
          serializedDetails = JSON.stringify(params.details);
        }
      }

      await prisma.auditLog.create({
        data: {
          userId: params.userId || null,
          action: params.action,
          category: params.category || 'GENERAL',
          details: serializedDetails,
          ipAddress,
          userAgent: userAgent ? userAgent.substring(0, 500) : null,
          browser,
          os,
          status: params.status || 'SUCCESS',
        },
      });
    } catch (err: any) {
      logger.error(`[AuditService] Failed to record audit log: ${err.message}`, err);
    }
  }
}
