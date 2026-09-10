import psycopg2

conn = psycopg2.connect(
    host="localhost", port=5432,
    dbname="erp_admission", user="postgres", password="1234"
)
cur = conn.cursor()

# 1. Tables
print("=" * 80)
print("1. ALL TABLES")
print("=" * 80)
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name")
tables = [r[0] for r in cur.fetchall()]
for t in tables:
    print(t)

# 2. Columns
print("\n" + "=" * 80)
print("2. COLUMNS FOR EACH TABLE")
print("=" * 80)
for table in tables:
    print(f"\n--- {table} ---")
    cur.execute("""
        SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = %s
        ORDER BY ordinal_position
    """, (table,))
    rows = cur.fetchall()
    for r in rows:
        print(f"  {r[0]} | {r[1]} | maxlen={r[2]} | nullable={r[3]} | default={r[4]}")

# 3. Primary Keys
print("\n" + "=" * 80)
print("3. PRIMARY KEYS")
print("=" * 80)
cur.execute("""
    SELECT tc.table_name, kcu.column_name, tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public'
    ORDER BY tc.table_name
""")
for r in cur.fetchall():
    print(f"  {r[0]}.{r[1]} (constraint: {r[2]})")

# 4. Foreign Keys
print("\n" + "=" * 80)
print("4. ALL FOREIGN KEYS")
print("=" * 80)
cur.execute("""
    SELECT
        tc.table_name, kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    ORDER BY tc.table_name
""")
for r in cur.fetchall():
    print(f"  {r[0]}.{r[1]} -> {r[2]}.{r[3]} (constraint: {r[4]})")

# 5. Unique Constraints
print("\n" + "=" * 80)
print("5. UNIQUE CONSTRAINTS")
print("=" * 80)
cur.execute("""
    SELECT tc.table_name, kcu.column_name, tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'UNIQUE' AND tc.table_schema = 'public'
    ORDER BY tc.table_name
""")
for r in cur.fetchall():
    print(f"  {r[0]}.{r[1]} (constraint: {r[2]})")

# 6. Indexes
print("\n" + "=" * 80)
print("6. INDEXES")
print("=" * 80)
cur.execute("""
    SELECT indexname, tablename, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname
""")
for r in cur.fetchall():
    print(f"  {r[1]}.{r[0]}: {r[2]}")

# 7. Sequences
print("\n" + "=" * 80)
print("7. SEQUENCES")
print("=" * 80)
cur.execute("""
    SELECT sequence_name, data_type, start_value, minimum_value, maximum_value, increment
    FROM information_schema.sequences WHERE sequence_schema = 'public'
""")
rows = cur.fetchall()
if rows:
    for r in rows:
        print(f"  {r[0]} | type={r[1]} | start={r[2]} | min={r[3]} | max={r[4]} | inc={r[5]}")
else:
    print("  (none found via information_schema)")

# Also check pg_class for sequences
cur.execute("""
    SELECT schemaname, sequencename, data_type, start_value, minimum_value, maximum_value, increment_by
    FROM pg_sequences
    WHERE schemaname = 'public'
""")
rows = cur.fetchall()
if rows:
    print("  (from pg_sequences):")
    for r in rows:
        print(f"  {r[1]} | type={r[2]} | start={r[3]} | min={r[4]} | max={r[5]} | inc={r[6]}")

# 8. Serial columns (auto-increment without explicit sequence)
print("\n" + "=" * 80)
print("8. SERIAL / IDENTITY COLUMNS (nextval defaults)")
print("=" * 80)
cur.execute("""
    SELECT table_name, column_name, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND column_default LIKE 'nextval%'
    ORDER BY table_name
""")
for r in cur.fetchall():
    print(f"  {r[0]}.{r[1]} -> {r[2]}")

# 9. Max values for each PK
print("\n" + "=" * 80)
print("9. MAX PK VALUES")
print("=" * 80)
for table in tables:
    cur.execute("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = %s
        AND (column_default LIKE 'nextval%' OR column_name LIKE '%_id')
        AND data_type IN ('integer','bigint','smallint')
        ORDER BY ordinal_position
        LIMIT 1
    """, (table,))
    pk = cur.fetchone()
    if pk:
        col_name = pk[0]
        try:
            cur.execute(f'SELECT MAX("{col_name}") FROM "{table}"')
            mx = cur.fetchone()
            print(f"  {table}.{col_name} -> MAX = {mx[0]}")
        except Exception as e:
            print(f"  {table}.{col_name} -> ERROR: {e}")

cur.close()
conn.close()
