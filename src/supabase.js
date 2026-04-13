import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey);

class MockQueryBuilder {
  constructor(table) {
    this.table = table;
    this.expectSingle = false;
    this.isInsert = false;
  }

  select() {
    return this;
  }

  eq() {
    return this;
  }

  order() {
    return this;
  }

  single() {
    this.expectSingle = true;
    return this;
  }

  insert() {
    this.isInsert = true;
    return this;
  }

  then(resolve, reject) {
    const result = this.isInsert
      ? {
          data: null,
          error: new Error(
            `Supabase is not configured, so "${this.table}" cannot be updated yet.`,
          ),
        }
      : {
          data: this.expectSingle ? null : [],
          error: null,
        };

    return Promise.resolve(result).then(resolve, reject);
  }
}

const createMockSupabaseClient = () => ({
  from(table) {
    return new MockQueryBuilder(table);
  },
  channel() {
    return {
      on() {
        return this;
      },
      subscribe() {
        return {
          unsubscribe() {},
        };
      },
    };
  },
  storage: {
    from() {
      return {
        async upload() {
          return {
            data: null,
            error: new Error("Supabase storage is not configured yet."),
          };
        },
        getPublicUrl() {
          return {
            data: {
              publicUrl: "",
            },
          };
        },
      };
    },
  },
});

if (!hasSupabaseConfig) {
  console.warn(
    "Supabase env vars are missing. Running in frontend-only mode until VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are configured.",
  );
}

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseKey)
  : createMockSupabaseClient();
