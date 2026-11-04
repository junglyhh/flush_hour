/* Sequential campaign progress. Puzzle signatures prevent stale saves from
   awarding a clear when a room's rules have changed. */
const FlushCampaign = Object.freeze({
  puzzleSignature(level) {
    return JSON.stringify([level.initial, level.edges, level.threshold]);
  },
  signature(level) {
    return JSON.stringify([level.initial, level.edges, level.threshold, level.moveLimit]);
  },
  validRecord(level, record) {
    return !!record && record.cleared === true &&
      record.signature === this.signature(level) &&
      Number.isInteger(record.best) && record.best >= level.optimalMoves &&
      record.best <= level.moveLimit;
  },
  normalizeRecords(levels, records) {
    const clean = {};
    if (!records || typeof records !== 'object' || Array.isArray(records)) return clean;
    for (const level of levels) {
      const record = records[level.id];
      if (this.validRecord(level, record)) {
        clean[level.id] = { cleared: true, best: record.best,
          flushed: record.flushed === true, signature: this.signature(level) };
      }
    }
    return clean;
  },
  unlockedThrough(levels, records) {
    let last = 0;
    while (last < levels.length - 1 && this.validRecord(levels[last], records[levels[last].id])) last++;
    return last;
  },
  isUnlocked(levels, records, index) {
    return Number.isInteger(index) && index >= 0 && index < levels.length &&
      index <= this.unlockedThrough(levels, records);
  },
  migrateLegacy(levels, oldLevels, saved) {
    if (!saved || saved.version !== 1) return null;
    const records = {};
    for (const level of levels) {
      const old = oldLevels.find(item => this.puzzleSignature(item) === this.puzzleSignature(level));
      const record = old && saved.records?.[old.id];
      if (!record || !Number.isInteger(record.best) || record.best < old.optimalMoves ||
          record.best < level.optimalMoves || record.best > old.moveLimit || record.best > level.moveLimit) continue;
      records[level.id] = { cleared: true, best: record.best,
        flushed: record.flushed === true, signature: this.signature(level) };
    }
    const last = this.unlockedThrough(levels, records);
    const oldCurrent = Number.isInteger(saved.current) ? oldLevels[saved.current] : null;
    const mapped = oldCurrent ? levels.findIndex(level => this.puzzleSignature(level) === this.puzzleSignature(oldCurrent)) : -1;
    const current = mapped >= 0 && mapped <= last ? mapped : last;
    const oldSession = saved.session && oldLevels.find(level => level.id === saved.session.level);
    const session = oldSession && this.puzzleSignature(oldSession) === this.puzzleSignature(levels[current])
      ? { ...saved.session, level: levels[current].id } : null;
    return { version: 2, language: saved.language === 'zh' ? 'zh' : 'en',
      sound: saved.sound === true, records, current, session };
  },
  validSession(level, session, record) {
    if (!session || session.level !== level.id || !Number.isInteger(session.moves) ||
        session.moves < 0 || session.moves > level.moveLimit || !Array.isArray(session.history) ||
        !Array.isArray(session.values) || session.values.length !== level.initial.length) return false;
    const validValues = values => Array.isArray(values) && values.length === level.initial.length &&
      values.every(value => Number.isFinite(value) && value >= 0 && value <= 100);
    if (!validValues(session.values)) return false;
    if (session.phase === 'flushed') {
      return this.validRecord(level, record) && record.flushed === true &&
        session.moves >= level.optimalMoves && session.history.length === 0 &&
        session.values.every(value => value === 0);
    }
    if (!['playing', 'won', 'failed'].includes(session.phase) || session.history.length !== session.moves) return false;
    const equal = (a, b) => a.length === b.length && a.every((value, index) => value === b[index]);
    let cursor = level.initial;
    for (let step = 0; step < session.history.length; step++) {
      const before = session.history[step], after = session.history[step + 1] || session.values;
      if (!validValues(before) || !validValues(after) || !equal(before, cursor) ||
          FlushRules.cleared(before, level.threshold)) return false;
      const reachable = level.edges.some(edge => {
        const result = FlushRules.average(before, edge);
        return result.changed && equal(result.values, after);
      });
      if (!reachable) return false;
      cursor = after;
    }
    return equal(cursor, session.values);
  }
});
