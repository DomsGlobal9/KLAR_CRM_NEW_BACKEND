/**
 * PM2 process configuration.
 *
 *   pm2 start ecosystem.config.js --env production
 *   pm2 reload klar-crm-backend-server     # zero-downtime reload
 *   pm2 logs klar-crm-backend-server
 *
 * ---------------------------------------------------------------------------
 * WHY instances IS 1, AND WHAT TO DO BEFORE RAISING IT
 * ---------------------------------------------------------------------------
 * Running more than one instance would use all CPU cores and is the next real
 * capacity win. It is NOT safe yet, because two pieces of state live inside the
 * process and on local disk:
 *
 *   1. WhatsApp (services/whatsapp.service.ts) uses whatsapp-web.js with
 *      LocalAuth pointed at ./whatsapp-session. Two instances would fight over
 *      that directory and corrupt the session. WhatsApp Web is also inherently
 *      one-phone-one-session.
 *
 *   2. teamMember.service.ts keeps pendingMemberCreations in an in-process Map.
 *      A second instance would not see entries created by the first, so member
 *      invitations would fail intermittently depending on which worker handled
 *      the follow-up request.
 *
 * Both are fixable, and both are tracked separately:
 *   - move WhatsApp sends onto a queue consumed by one dedicated worker (the
 *     email service already uses BullMQ and can serve as the pattern), or
 *     migrate to the WhatsApp Business Cloud API;
 *   - move pendingMemberCreations into Redis.
 *
 * Once BOTH are done, set instances to 'max' and exec_mode to 'cluster'.
 * Raising it before then will cause intermittent, hard-to-diagnose failures.
 */
module.exports = {
    apps: [
        {
            name: 'klar-crm-backend-server',
            script: 'dist/index.js',

            // See the note above before changing these two lines.
            instances: 1,
            exec_mode: 'fork',

            // Restart if the process exceeds this. A safety net, not a fix —
            // v1.2.0 removed the Chromium leak that used to make this fire.
            max_memory_restart: '1G',

            // Restart on crash, but back off instead of hot-looping if the
            // process dies immediately on boot (e.g. bad config).
            autorestart: true,
            exp_backoff_restart_delay: 200,
            min_uptime: '30s',
            max_restarts: 10,

            // Give in-flight requests time to drain. Must exceed
            // SHUTDOWN_TIMEOUT_MS in src/lifecycle.ts.
            kill_timeout: 20000,

            // Wait for the app to signal readiness rather than assuming it.
            listen_timeout: 10000,

            time: true,
            merge_logs: true,

            env: {
                NODE_ENV: 'development',
            },

            env_production: {
                NODE_ENV: 'production',
            },
        },
    ],
};
