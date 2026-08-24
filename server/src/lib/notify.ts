import { Database } from 'sqlite';

export async function notifyUser(
  db: Database,
  opts: {
    userId: number;
    title: string;
    message: string;
    linkType?: string | null;
    linkId?: number | null;
  }
) {
  await db.run(
    'INSERT INTO notifications (user_id, title, message, link_type, link_id) VALUES (?, ?, ?, ?, ?)',
    [opts.userId, opts.title, opts.message, opts.linkType || null, opts.linkId ?? null]
  );
}

export async function notifyAdmins(
  db: Database,
  opts: { title: string; message: string; linkType?: string | null; linkId?: number | null }
) {
  const admins = await db.all(
    "SELECT id FROM users WHERE role IN ('admin', 'supervisor') AND status = 'active'"
  ) as { id: number }[];
  for (const admin of admins) {
    await notifyUser(db, { userId: admin.id, ...opts });
  }
}
