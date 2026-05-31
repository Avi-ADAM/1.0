<script module>
  import moment from 'moment';

  /** @param {unknown} value */
  function parseFlexibleDate(value) {
    if (value == null || value === '' || value === 'undefined') {
      return null;
    }

    if (value instanceof Date) {
      const fromDate = moment(value);
      return fromDate.isValid() ? fromDate : null;
    }

    const str = String(value).trim();

    if (str.includes('T') || /^\d{4}-\d{2}-\d{2}/.test(str)) {
      const iso = moment(str);
      if (iso.isValid()) return iso;
    }

    const formats = [
      'HH:mm DD/MM/YYYY',
      'H:mm DD/MM/YYYY',
      'hh:mm dd/mm/yyyy',
      'YYYY-MM-DD HH:mm:ss',
      'DD/MM/YYYY HH:mm',
      'DD/MM/YYYY'
    ];

    for (const fmt of formats) {
      const parsed = moment(str, fmt, true);
      if (parsed.isValid()) return parsed;
    }

    const loose = moment(str);
    return loose.isValid() ? loose : null;
  }

  /**
   * @param {string} moy
   * @param {unknown} beg
   * @param {unknown} end
   * @param {boolean} [_fromIOs] kept for backward compatibility
   */
  export function montsi(moy, beg, end, _fromIOs) {
    if (moy !== 'monthly' && moy !== 'yearly' && moy !== 'rent') {
      return 1;
    }

    const start = parseFlexibleDate(beg);
    const finish = parseFlexibleDate(end);

    if (!start?.isValid() || !finish?.isValid()) {
      return 1;
    }

    const unit = moy === 'yearly' ? 'years' : 'months';
    const diff = finish.diff(start, unit, true);

    if (!Number.isFinite(diff) || diff <= 0) {
      return 1;
    }

    return diff.toFixed(2);
  }

  /** @param {unknown} value */
  export function toIsoDateString(value) {
    const parsed = parseFlexibleDate(value);
    return parsed?.isValid() ? parsed.toISOString() : null;
  }
</script>
