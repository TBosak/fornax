// Utility functions
export function ensureObject(o: any): object {
    return o != null && typeof o === 'object' ? o : {};
  }
  
export function makeSafeObject(o: any): any {
    let out = String();
  
    if (typeof o === 'function') {
      return o;
    }
  
    if (o == null || typeof o !== 'object') {
      if (typeof o === 'string') {
        try {
          return JSON.stringify(JSON.parse(o));
        } catch (e) {}
      }
      return JSON.stringify(o);
    }
  
    if (typeof o === 'object') {
      for (const k in o) {
        o[k] = makeSafeObject(o[k]);
      }
      if (Array.isArray(o)) {
        out += '[';
        for (const k in o) out += `${o[k]}, `;
        out += ']';
      } else {
        out += '{';
        for (const k in o) out += `${k}: ${o[k]}, `;
        out += '}';
      }
    }
  
    return out;
  }
  