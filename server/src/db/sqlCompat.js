/** Translate common T-SQL patterns to PostgreSQL for cloud deployment. */

function translateStringConcat(sql) {
  let q = sql;
  const re = /([a-zA-Z_][\w.]*|\([^)]+\))\s+\+\s+'([^']*)'\s+\+\s+([a-zA-Z_][\w.]*|\([^)]+\))/;
  let prev;
  do {
    prev = q;
    q = q.replace(re, "$1 || '$2' || $3");
  } while (prev !== q);
  return q;
}

function translateTop(sql) {
  let q = sql;
  const re = /\bSELECT\s+TOP\s+(\d+)\s+/gi;
  let match;
  const replacements = [];

  while ((match = re.exec(sql)) !== null) {
    replacements.push({ index: match.index, len: match[0].length, n: match[1] });
  }

  if (!replacements.length) return q;

  // Process from end to start so indices stay valid
  for (let i = replacements.length - 1; i >= 0; i--) {
    const { index, len, n } = replacements[i];
    const before = q.slice(0, index);
    const after = q.slice(index + len);

    let depth = 0;
    let end = 0;
    for (let j = 0; j < after.length; j++) {
      if (after[j] === '(') depth++;
      if (after[j] === ')') {
        if (depth === 0) {
          end = j;
          break;
        }
        depth--;
      }
    }

    const body = end ? after.slice(0, end) : after;
    const tail = end ? after.slice(end) : '';

    if (/\bLIMIT\s+\d+/i.test(body)) {
      q = before + 'SELECT ' + after;
      continue;
    }

    let newBody = body;
    const orderMatch = body.match(/\bORDER BY\b[\s\S]*$/i);
    if (orderMatch) {
      const orderIdx = body.lastIndexOf(orderMatch[0]);
      newBody = body.slice(0, orderIdx + orderMatch[0].length) + ` LIMIT ${n}` + body.slice(orderIdx + orderMatch[0].length);
    } else {
      newBody = body.trimEnd() + ` LIMIT ${n}`;
    }

    q = before + 'SELECT ' + newBody + tail;
  }

  return q;
}

function translateOutputInserted(sql) {
  let q = sql;

  // UPDATE ... OUTPUT INSERTED.* WHERE ...
  q = q.replace(
    /(UPDATE[\s\S]+?)\s+OUTPUT\s+INSERTED\.(\*|[\w,\s.]+)\s+(WHERE[\s\S]+?)(;?\s*)$/i,
    (_, updatePart, cols, wherePart, tail) => {
      const returning = cols.trim() === '*' ? '*' : cols.replace(/\s*INSERTED\./g, '').trim();
      return `${updatePart} ${wherePart} RETURNING ${returning}${tail}`;
    }
  );

  // INSERT ... OUTPUT INSERTED.* VALUES ...
  q = q.replace(
    /(INSERT INTO[\s\S]+?)\s+OUTPUT\s+INSERTED\.(\*|[\w,\s.]+)\s+(VALUES[\s\S]+)/i,
    (_, insertPart, cols, valuesPart) => {
      const returning = cols.trim() === '*' ? '*' : cols.replace(/\s*INSERTED\./g, '').trim();
      return `${insertPart} ${valuesPart.trim()} RETURNING ${returning}`;
    }
  );

  return q;
}

function translateMergeSettings(sql) {
  if (!/MERGE\s+Settings/i.test(sql)) return sql;

  if (/UpdatedBy = @userId/i.test(sql)) {
    return `INSERT INTO Settings (SettingKey, SettingValue, UpdatedBy)
      VALUES (@key, @value, @userId)
      ON CONFLICT (SettingKey) DO UPDATE SET
        SettingValue = EXCLUDED.SettingValue,
        UpdatedAt = NOW(),
        UpdatedBy = EXCLUDED.UpdatedBy`;
  }

  return `INSERT INTO Settings (SettingKey, SettingValue)
    VALUES (@key, @value)
    ON CONFLICT (SettingKey) DO UPDATE SET SettingValue = EXCLUDED.SettingValue`;
}

export function translateForPostgres(sql) {
  let q = sql;

  q = translateMergeSettings(q);

  q = q.replace(
    /IF NOT EXISTS \(SELECT 1 FROM ConversationMembers WHERE ConversationId = @cid AND UserId = @uid\)\s+INSERT INTO ConversationMembers \(ConversationId, UserId\) VALUES \(@cid, @uid\)/gi,
    'INSERT INTO ConversationMembers (ConversationId, UserId) VALUES (@cid, @uid) ON CONFLICT (ConversationId, UserId) DO NOTHING'
  );

  q = q.replace(/\bdbo\./gi, '');
  q = translateStringConcat(q);
  q = q.replace(/\bSYSUTCDATETIME\(\)/gi, 'NOW()');
  q = q.replace(/DATEADD\(MINUTE,\s*-(\d+),\s*NOW\(\)\)/gi, (_, n) => `NOW() - INTERVAL '${n} minutes'`);
  q = q.replace(/DATEADD\(DAY,\s*-(\d+),\s*NOW\(\)\)/gi, (_, n) => `NOW() - INTERVAL '${n} days'`);
  q = translateTop(q);
  q = translateOutputInserted(q);

  return q;
}

export function bindNamedParams(sql, params = {}) {
  const indexByKey = {};
  const values = [];
  const text = sql.replace(/@(\w+)/g, (_, key) => {
    if (!(key in params)) {
      throw new Error(`Missing SQL parameter @${key}`);
    }
    if (!(key in indexByKey)) {
      indexByKey[key] = values.length + 1;
      values.push(params[key]);
    }
    return `$${indexByKey[key]}`;
  });
  return { text, values };
}
