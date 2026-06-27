import React from 'react';
import { useERP } from '../../../app/store/ERPContext';
import { Bell, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function NotificationCenterView() {
  const { notifications, clearNotifications, t, config } = useERP();
  const activeColor = config?.customAccentColor || '#7c3aed';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--color-border-line)] pb-5">
        <div>
          <span className="text-xs tracking-widest uppercase" style={{ color: activeColor }}>
            {t('notif_page_label')}
          </span>
          <h2 className="text-2xl font-display uppercase tracking-tight font-semibold text-[var(--color-text-main)] mt-1">
            {t('notif_page_title')}
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            {t('notif_page_desc')}
          </p>
        </div>

        {notifications.length > 0 && (
          <button
            onClick={clearNotifications}
            className="px-3 py-1.5 border border-[var(--color-border-line)] hover:bg-white/[0.04] text-xs uppercase tracking-wider text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-all rounded-xl cursor-pointer"
          >
            {t('notif_clear_btn')}
          </button>
        )}
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notif, index) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`p-4 rounded-lg border flex gap-4 items-start ${
                (notif.type === 'warning' || notif.type === 'alert')
                  ? 'bg-red-950/20 border-red-500/10'
                  : notif.type === 'info'
                  ? 'bg-[var(--color-card-bg)] border-[var(--color-border-line)]'
                  : 'bg-emerald-950/20 border-emerald-500/10'
              }`}
            >
              <div className={`p-1.5 rounded-xl border mt-0.5 ${
                (notif.type === 'warning' || notif.type === 'alert')
                  ? 'text-red-400 border-red-500/15'
                  : notif.type === 'info'
                  ? 'text-[var(--color-text-muted)] border-[var(--color-border-line)]'
                  : 'text-emerald-400 border-emerald-500/15'
              }`}>
                {(notif.type === 'warning' || notif.type === 'alert')
                  ? <AlertTriangle size={15} />
                  : <CheckCircle2 size={15} />
                }
              </div>

              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-1.5 py-0.5 rounded-xl uppercase ${
                    (notif.type === 'warning' || notif.type === 'alert')
                      ? 'bg-red-500/10 text-red-400'
                      : notif.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-[var(--color-border-line)] text-[var(--color-text-muted)]'
                  }`}>
                    {notif.type}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {notif.timestamp}
                  </span>
                </div>
                <p className="text-sm font-sans text-[var(--color-text-main)]">
                  {notif.message}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="glass-panel p-12 text-center rounded-lg space-y-3">
          <Bell className="mx-auto text-[var(--color-text-muted)] animate-pulse" size={32} />
          <h4 className="text-sm font-display uppercase tracking-widest text-[var(--color-text-muted)] font-medium">
            {t('notif_empty_title')}
          </h4>
          <p className="text-xs text-[var(--color-text-muted)]">
            {t('notif_empty_desc')}
          </p>
        </div>
      )}
    </div>
  );
}
