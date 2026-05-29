import os
import psycopg
from psycopg.rows import dict_row
url = os.getenv('DATABASE_URL') or 'postgresql://%s:%s@%s:%s/%s' % (
    os.getenv('PGUSER','postgres'),
    os.getenv('PGPASSWORD','4341'),
    os.getenv('PGHOST','localhost'),
    os.getenv('PGPORT','5432'),
    os.getenv('PGDATABASE','dashboard'),
)
print('DATABASE_URL=', url)
conn = psycopg.connect(url, autocommit=True)
with conn.cursor(row_factory=dict_row) as cur:
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public';")
    print('Tables=', cur.fetchall())
    cur.execute('SELECT count(*) AS cnt FROM submissions')
    print('Submission rows=', cur.fetchone())
    cur.execute('SELECT id,name,register FROM submissions ORDER BY id DESC LIMIT 3')
    print('Recent=', cur.fetchall())
conn.close()